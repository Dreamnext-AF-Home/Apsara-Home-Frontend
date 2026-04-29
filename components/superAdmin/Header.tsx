'use client';

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    adminNotificationsApi,
    AdminNotificationItem,
    useGetAdminNotificationsQuery,
    useMarkAdminNotificationReadMutation,
    useMarkAllAdminNotificationsReadMutation,
} from "@/store/api/adminNotificationsApi";
import { useGetAdminMeQuery } from "@/store/api/authApi";
import { baseApi, clearAccessTokenCache } from "@/store/api/baseApi";
import { useAppDispatch } from "@/store/hooks";
import { clearAdminSession } from "@/libs/adminSession";
import { normalizeAdminPermissions } from "@/libs/adminPermissions";
import ThemeToggle from "@/components/ui/buttons/ThemeToggle";
import SearchCommandPalette from "./SearchCommandPalette";
import Pusher from "pusher-js";

interface HeaderProps {
    onMenuClick: () => void;
}

const getInitials = (name?: string | null) => {
    const value = String(name ?? '').trim();
    if (!value) return 'AD';
    const parts = value.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
};

const formatRole = (role?: string | null) => {
    if (!role) return 'Administrator';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

type DateRangePreset = 'this_month' | 'last_month' | 'last_30_days' | 'this_year' | 'last_year' | 'custom';

const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'this_year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
];

const parseNotificationDate = (value?: string | null) => {
    if (!value) return null;
    const normalized = value.includes('T') ? value.trim() : value.trim().replace(' ', 'T');
    const hasTimeZone = /([zZ]|[+-]\d{2}:\d{2})$/.test(normalized);
    const date = new Date(hasTimeZone ? normalized : `${normalized}Z`);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatRelativeTime = (value?: string | null) => {
    const date = parseNotificationDate(value);
    if (!date) return '';
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 0) return 'just now';

    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
};

const formatExactNotificationTime = (value?: string | null) => {
    const date = parseNotificationDate(value);
    if (!date) return '';

    return date.toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

const resolveNotificationHref = (notif: AdminNotificationItem) => {
    const rawHref = (notif.href || '/admin/orders').trim();
    const fallbackHref = rawHref.startsWith('/') ? rawHref : '/admin/orders';
    const url = new URL(fallbackHref, 'http://localhost');
    const payload = (notif.payload ?? {}) as Record<string, unknown>;
    const orderId = payload.order_id;
    const checkoutId = payload.checkout_id;

    if (typeof orderId === 'number' && Number.isFinite(orderId)) {
        url.searchParams.set('highlightOrderId', String(orderId));
    } else if (typeof orderId === 'string' && orderId.trim() !== '') {
        url.searchParams.set('highlightOrderId', orderId.trim());
    }

    if (typeof checkoutId === 'string' && checkoutId.trim() !== '' && !url.searchParams.get('q')) {
        url.searchParams.set('q', checkoutId.trim());
    }

    return `${url.pathname}${url.search}`;
};

const permissionForAdminHref = (href?: string | null) => {
    const normalized = `/${String(href ?? '/admin/orders').replace(/^\/+/, '')}`;

    if (normalized === '/admin' || normalized.startsWith('/admin/dashboard')) return null;
    if (normalized.startsWith('/admin/members')) return 'members';
    if (normalized.startsWith('/admin/orders')) return 'orders';
    if (normalized.startsWith('/admin/interior-requests')) return 'interior_requests';
    if (normalized.startsWith('/admin/products') || normalized.startsWith('/admin/categories') || normalized.startsWith('/admin/product-brands')) return 'products';
    if (normalized.startsWith('/admin/shipping')) return 'shipping';
    if (normalized.startsWith('/admin/suppliers')) return 'suppliers';
    if (normalized.startsWith('/admin/webpages') || normalized.startsWith('/admin/web-pages')) return 'web_content';
    if (normalized.startsWith('/admin/settings/users') || normalized.startsWith('/admin/users')) return 'settings_users';
    return null;
};

const Header = ({ onMenuClick }: HeaderProps) => {
    const dispatch = useAppDispatch();
    const [notifOpen, setNotifOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
    const [optimisticReadIds, setOptimisticReadIds] = useState<string[]>([]);
    const { data: session } = useSession();
    const sessionAccessToken = String((session?.user as { accessToken?: string } | undefined)?.accessToken ?? '');
    const adminIdentityKey = sessionAccessToken
        ? `${String((session?.user as { id?: string } | undefined)?.id ?? 'unknown')}:${sessionAccessToken}`
        : undefined;
    const { data: adminMe, isLoading: isAdminMeLoading, isFetching: isAdminMeFetching } = useGetAdminMeQuery(adminIdentityKey, { skip: !sessionAccessToken });
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [selectedRange, setSelectedRange] = useState<DateRangePreset>('this_month');
    const [customStart, setCustomStart] = useState(searchParams.get('from') ?? '');
    const [customEnd, setCustomEnd] = useState(searchParams.get('to') ?? '');
    const {
        data: notifications,
        isLoading: isNotifLoading,
        isError: isNotifError,
        refetch: refetchNotifs,
    } = useGetAdminNotificationsQuery(undefined, {
        pollingInterval: 5000,
        refetchOnFocus: true,
        refetchOnReconnect: true,
        skipPollingIfUnfocused: true,
    });
    const [markNotificationRead] = useMarkAdminNotificationReadMutation();
    const [markAllNotificationsRead] = useMarkAllAdminNotificationsReadMutation();
    const isRefreshingAdminIdentity = Boolean(sessionAccessToken) && !adminMe && (isAdminMeLoading || isAdminMeFetching);
    const displayName = String(adminMe?.name ?? session?.user?.name ?? '').trim() || (isRefreshingAdminIdentity ? 'Refreshing admin...' : 'Admin');
    const displayRole = formatRole(adminMe?.role ?? session?.user?.role);
    const displayInitials = getInitials(displayName);
    const avatarSrc = adminMe?.avatar_url || session?.user?.image;
    const accessToken = session?.user?.accessToken;
    const effectiveRole = adminMe?.role ?? session?.user?.role;
    const effectiveUserLevelId = Number(adminMe?.user_level_id ?? (session?.user as { userLevelId?: number } | undefined)?.userLevelId ?? 0);
    const effectivePermissions = normalizeAdminPermissions(
        adminMe?.admin_permissions ?? (session?.user as { adminPermissions?: string[] } | undefined)?.adminPermissions ?? []
    );
    const userMenuItems = [
        { label: 'My Profile', href: '/admin/profile' },
        { label: 'Settings', href: '/admin/settings/general' },
        { label: 'Help Center', href: '/admin/settings/notifications' },
    ] as const;

    useEffect(() => {
        const queryRange = searchParams.get('range') as DateRangePreset | null;
        setSelectedRange(queryRange && DATE_RANGE_OPTIONS.some((opt) => opt.value === queryRange) ? queryRange : 'this_month');
        setCustomStart(searchParams.get('from') ?? '');
        setCustomEnd(searchParams.get('to') ?? '');
    }, [searchParams]);

    useEffect(() => {
        const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
        const apiBaseUrl = (process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').replace(/\/+$/, '');

        if (!pusherKey || !pusherCluster || !apiBaseUrl || !accessToken) {
            return;
        }

        const pusher = new Pusher(pusherKey, {
            cluster: pusherCluster,
            channelAuthorization: {
                endpoint: `${apiBaseUrl}/api/admin/realtime/pusher/auth`,
                transport: 'ajax',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/json',
                },
            },
        });

        const channel = pusher.subscribe('private-admin-orders');
        const onOrderCreated = () => {
            refetchNotifs();
        };
        const onNotificationCreated = (event: {
            id?: number | string;
            type?: string;
            title?: string;
            description?: string;
            href?: string;
            created_at?: string;
        }) => {
            const neededPermission = permissionForAdminHref(event?.href);
            if (effectiveUserLevelId !== 1 && neededPermission && !effectivePermissions.includes(neededPermission)) {
                return;
            }

            if (event?.id != null) {
                dispatch(
                    adminNotificationsApi.util.updateQueryData('getAdminNotifications', undefined, (draft) => {
                        const id = String(event.id);
                        const existingIndex = draft.items.findIndex((item) => item.id === id);
                        const nextItem: AdminNotificationItem = {
                            id,
                            type: event.type ?? 'system',
                            title: event.title ?? 'New notification',
                            description: event.description ?? '',
                            count: 1,
                            is_read: false,
                            severity: 'info',
                            href: event.href ?? '/admin/orders',
                            updated_at: event.created_at ?? new Date().toISOString(),
                            payload: null,
                        };

                        if (existingIndex >= 0) {
                            draft.items.splice(existingIndex, 1);
                        }
                        draft.items.unshift(nextItem);
                        draft.unread_count = Number(draft.unread_count ?? 0) + 1;
                    })
                );
            }
            refetchNotifs();
        };

        channel.bind('order.created', onOrderCreated);
        channel.bind('notification.created', onNotificationCreated);

        return () => {
            channel.unbind('order.created', onOrderCreated);
            channel.unbind('notification.created', onNotificationCreated);
            pusher.unsubscribe('private-admin-orders');
            pusher.disconnect();
        };
    }, [accessToken, dispatch, effectivePermissions, effectiveRole, effectiveUserLevelId, refetchNotifs]);

    const visibleNotifications = useMemo(() => {
        const items = notifications?.items ?? [];

        return items.map((item) => {
            const isOptimisticallyRead = optimisticReadIds.includes(item.id);
            return {
                ...item,
                is_read: Boolean(item.is_read || isOptimisticallyRead),
                count: item.is_read || isOptimisticallyRead ? 0 : item.count,
            };
        });
    }, [notifications?.items, optimisticReadIds]);

    const unreadCount = useMemo(() => {
        return visibleNotifications.reduce((total, item) => total + (item.is_read ? 0 : 1), 0);
    }, [visibleNotifications]);

    const handleNotificationClick = (notif: AdminNotificationItem) => {
        setNotifOpen(false);
        setOptimisticReadIds((current) => (current.includes(notif.id) ? current : [...current, notif.id]));
        router.push(resolveNotificationHref(notif));
        void markNotificationRead(notif.id).unwrap().catch(() => {
            // Keep navigation smooth even if read-state update fails.
        });
    };

    const handleMarkAllNotificationsRead = async () => {
        const pendingIds = visibleNotifications.filter((item) => !item.is_read).map((item) => item.id);
        if (pendingIds.length === 0) {
            return;
        }

        setOptimisticReadIds((current) => Array.from(new Set([...current, ...pendingIds])));
        try {
            await markAllNotificationsRead().unwrap();
            await refetchNotifs();
        } catch {
            setOptimisticReadIds((current) => current.filter((id) => !pendingIds.includes(id)));
            // Keep UI stable; next poll/realtime event will refresh the feed.
        }
    };

    const updateDateRangeParams = (range: DateRangePreset, from?: string, to?: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('range', range);
        if (range === 'custom') {
            if (from) params.set('from', from);
            else params.delete('from');
            if (to) params.set('to', to);
            else params.delete('to');
        } else {
            params.delete('from');
            params.delete('to');
        }
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    const isDashboardPage = pathname?.startsWith('/admin/dashboard');

    return (
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-4">
            <button
                onClick={onMenuClick}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <div className="hidden sm:block">
                <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Dashboard</h1>
                <p className="text-slate-400 dark:text-slate-500">Welcome back, {displayName}</p>
            </div>

            <SearchCommandPalette />

            <div className="flex items-center gap-2 ml-auto">
                {isDashboardPage && (
                    <div className="hidden md:flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-800/60">
                            <svg className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <select
                                value={selectedRange}
                                onChange={(e) => {
                                    const nextRange = e.target.value as DateRangePreset;
                                    setSelectedRange(nextRange);
                                    if (nextRange !== 'custom') {
                                        updateDateRangeParams(nextRange);
                                    }
                                }}
                                className="bg-transparent text-xs font-medium text-slate-600 focus:outline-none dark:text-slate-200"
                            >
                                {DATE_RANGE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-800/60">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Today</span>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-200">
                                {new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        {selectedRange === 'custom' && (
                            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-800 dark:bg-slate-800/60">
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="bg-transparent text-xs text-slate-600 focus:outline-none dark:text-slate-200"
                                />
                                <span className="text-xs text-slate-400 dark:text-slate-500">to</span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="bg-transparent text-xs text-slate-600 focus:outline-none dark:text-slate-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => updateDateRangeParams('custom', customStart, customEnd)}
                                    className="px-2 py-0.5 text-[11px] font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <ThemeToggle isScrolled={true} />

                <div className="relative">
                    <button
                        onClick={() => {
                            setNotifOpen(!notifOpen);
                            setUserOpen(false);
                            if (!notifOpen) {
                                refetchNotifs();
                            }
                        }}
                        className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-all hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    <AnimatePresence>
                        {notifOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">Notifications</span>
                                        {unreadCount > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full h-4.5 min-w-4.5 px-1 flex items-center justify-center leading-none">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleMarkAllNotificationsRead}
                                        className="text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                    >
                                        Mark all read
                                    </button>
                                </div>

                                {/* List */}
                                <div className="max-h-96 overflow-y-auto overscroll-contain">
                                    {isNotifLoading ? (
                                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                                            <div className="h-7 w-7 rounded-full border-2 border-slate-200 border-t-slate-400 animate-spin dark:border-slate-700 dark:border-t-slate-500" />
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Loading...</p>
                                        </div>
                                    ) : isNotifError ? (
                                        <div className="px-4 py-8 text-center">
                                            <p className="text-sm text-red-500 font-medium dark:text-red-400">Failed to load notifications</p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Please try again later.</p>
                                        </div>
                                    ) : visibleNotifications.length ? (
                                        visibleNotifications.map((notif) => {
                                            const isNew = !notif.is_read;
                                            return (
                                                <button
                                                    key={notif.id}
                                                    type="button"
                                                    onClick={() => {
                                                        handleNotificationClick(notif);
                                                    }}
                                                    className={`flex w-full cursor-pointer items-start gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${isNew ? 'border-l-2 border-l-emerald-500 bg-slate-50 dark:bg-slate-800/30' : 'border-l-2 border-l-transparent'}`}
                                                >
                                                    <div className="mt-1 flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full">
                                                        <div className={`h-2.5 w-2.5 rounded-full ${isNew ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] dark:shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className={`text-sm leading-snug ${isNew ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-400'}`}>{notif.title}</p>
                                                            {notif.type && (
                                                                <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide ${isNew ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'}`}>
                                                                    {notif.type.replace(/_/g, ' ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{notif.description}</p>
                                                        {(formatExactNotificationTime(notif.updated_at) || formatRelativeTime(notif.updated_at)) && (
                                                            <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                                                {formatExactNotificationTime(notif.updated_at)}
                                                                {formatExactNotificationTime(notif.updated_at) && formatRelativeTime(notif.updated_at) ? ' · ' : ''}
                                                                {formatRelativeTime(notif.updated_at)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/60">
                                                <svg className="h-5 w-5 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                </svg>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">All caught up!</p>
                                                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">No new notifications</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="relative">
                    <button
                        onClick={() => {
                            setUserOpen(!userOpen);
                            setNotifOpen(false);
                        }}
                        className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        {avatarSrc ? (
                            <Image
                                src={avatarSrc}
                                alt={displayName}
                                width={32}
                                height={32}
                                className="h-8 w-8 rounded-full object-cover"
                            />
                        ) : (
                            <div className="h-8 w-8 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                                <span className="text-white font-bold text-xs">{displayInitials}</span>
                            </div>
                        )}
                        <div className="hidden text-left sm:block">
                            <p className="text-xs font-semibold leading-none text-slate-800 dark:text-slate-100">{displayName}</p>
                            <p className="mt-0 text-xs text-slate-400 dark:text-slate-500">{displayRole}</p>
                        </div>
                        <svg className="hidden h-4 w-4 text-slate-400 dark:text-slate-500 sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <AnimatePresence>
                        {userOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-100 bg-white py-1 dark:border-slate-800 dark:bg-slate-900"
                            >
                                {userMenuItems.map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={() => {
                                            setUserOpen(false);
                                            router.push(item.href);
                                        }}
                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                                <div className="mt-1 border-t border-slate-100 pt-1 dark:border-slate-800">
                                    <button
                                        onClick={async () => {
                                            const isPartnerRoute = pathname.startsWith('/partner');
                                            const loginPath = isPartnerRoute ? '/partner/login' : '/admin/login';
                                            dispatch(baseApi.util.resetApiState());
                                            clearAccessTokenCache();
                                            await clearAdminSession(loginPath);
                                            void signOut({ callbackUrl: loginPath });
                                        }}
                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {(notifOpen || userOpen) && (
                <div className="fixed inset-0 z-40" onClick={() => { setNotifOpen(false); setUserOpen(false); }} />
            )}
        </header>
    );
};

export default Header;
