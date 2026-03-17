'use client';

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
    adminNotificationsApi,
    AdminNotificationItem,
    useGetAdminNotificationsQuery,
    useMarkAdminNotificationReadMutation,
    useMarkAllAdminNotificationsReadMutation,
} from "@/store/api/adminNotificationsApi";
import { useAppDispatch } from "@/store/hooks";
import Pusher from "pusher-js";

interface HeaderProps {
    onMenuClick: () => void;
}

const getInitials = (name?: string | null) => {
    const value = (name ?? '').trim();
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
const formatRelativeTime = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
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

const Header = ({ onMenuClick }: HeaderProps) => {
    const dispatch = useAppDispatch();
    const [notifOpen, setNotifOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [headerSearch, setHeaderSearch] = useState(searchParams.get('q') ?? '');
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
    const unreadCount = notifications?.unread_count ?? 0;
    const displayName = session?.user?.name?.trim() || 'Admin';
    const displayRole = formatRole(session?.user?.role);
    const displayInitials = getInitials(displayName);
    const avatarSrc = session?.user?.image;
    const accessToken = session?.user?.accessToken;

    useEffect(() => {
        setHeaderSearch(searchParams.get('q') ?? '');
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
                        draft.unread_count = (draft.unread_count ?? 0) + 1;
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
    }, [accessToken, dispatch, refetchNotifs]);

    const handleNotificationClick = (notif: AdminNotificationItem) => {
        setNotifOpen(false);
        router.push(resolveNotificationHref(notif));
        void markNotificationRead(notif.id).unwrap().catch(() => {
            // Keep navigation smooth even if read-state update fails.
        });
    };

    const handleMarkAllNotificationsRead = async () => {
        try {
            await markAllNotificationsRead().unwrap();
            await refetchNotifs();
        } catch {
            // Keep UI stable; next poll/realtime event will refresh the feed.
        }
    };

    const handleHeaderSearchChange = (value: string) => {
        setHeaderSearch(value);
        const params = new URLSearchParams(searchParams.toString());

        if (value.trim() === '') {
            params.delete('q');
        } else {
            params.set('q', value);
        }

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
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
        <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 gap-4 shrink-0 sticky top-0 z-10">
            <button
                onClick={onMenuClick}
                className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <div className="hidden sm:block">
                <h1>Dashboard</h1>
                <p className="text-slate-400">Welcome back, {displayName}</p>
            </div>

            <div className="flex-1 max-w-md mx-auto">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search orders, members, products..."
                        value={headerSearch}
                        onChange={(e) => handleHeaderSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
                {isDashboardPage && (
                    <div className="hidden md:flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                className="bg-transparent text-xs text-slate-600 font-medium focus:outline-none"
                            >
                                {DATE_RANGE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Today</span>
                            <span className="text-xs text-slate-600 font-medium">
                                {new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        {selectedRange === 'custom' && (
                            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="text-xs text-slate-600 bg-transparent focus:outline-none"
                                />
                                <span className="text-xs text-slate-400">to</span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="text-xs text-slate-600 bg-transparent focus:outline-none"
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

                <div className="relative">
                    <button
                        onClick={() => {
                            setNotifOpen(!notifOpen);
                            setUserOpen(false);
                            if (!notifOpen) {
                                refetchNotifs();
                            }
                        }}
                        className="relative flex items-center justify-center h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white" />
                        )}
                    </button>
                    <AnimatePresence>
                        {notifOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-2 w-85 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 bg-linear-to-r from-teal-50 to-white border-b border-teal-100/60">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm">Notifications</span>
                                        {unreadCount > 0 && (
                                            <span className="bg-teal-500 text-white text-[10px] font-bold rounded-full min-w-4.5 h-4.5 px-1 flex items-center justify-center leading-none">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleMarkAllNotificationsRead}
                                        className="text-xs text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                </div>

                                {/* List */}
                                <div className="max-h-80 overflow-y-auto overscroll-contain divide-y divide-slate-50">
                                    {isNotifLoading ? (
                                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                                            <div className="h-7 w-7 rounded-full border-2 border-teal-200 border-t-teal-500 animate-spin" />
                                            <p className="text-xs text-slate-400">Loading...</p>
                                        </div>
                                    ) : isNotifError ? (
                                        <div className="px-4 py-8 text-center">
                                            <p className="text-sm text-red-500 font-medium">Failed to load notifications</p>
                                            <p className="text-xs text-slate-400 mt-1">Please try again later.</p>
                                        </div>
                                    ) : notifications?.items?.length ? (
                                        notifications.items.map((notif) => {
                                            const isNew = !notif.is_read;
                                            const severity = notif.severity ?? 'info';
                                            const sc = severity === 'critical'
                                                ? { bg: 'bg-red-100', dot: 'bg-red-500', badge: 'bg-red-100 text-red-600', border: 'border-l-red-400' }
                                                : severity === 'warning'
                                                ? { bg: 'bg-amber-100', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-600', border: 'border-l-amber-400' }
                                                : severity === 'success'
                                                ? { bg: 'bg-green-100', dot: 'bg-green-500', badge: 'bg-green-100 text-green-600', border: 'border-l-green-400' }
                                                : { bg: 'bg-blue-100', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-600', border: 'border-l-blue-400' };
                                            return (
                                                <button
                                                    key={notif.id}
                                                    type="button"
                                                    onClick={() => {
                                                        handleNotificationClick(notif);
                                                    }}
                                                    className={`w-full text-left flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer border-l-2 ${isNew ? `${sc.border} bg-teal-50/20` : 'border-l-transparent'}`}
                                                >
                                                    <div className={`shrink-0 mt-0.5 h-8 w-8 rounded-full flex items-center justify-center ${isNew ? sc.bg : 'bg-slate-100'}`}>
                                                        <div className={`h-2 w-2 rounded-full ${isNew ? sc.dot : 'bg-slate-300'}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className={`text-sm leading-snug ${isNew ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}>{notif.title}</p>
                                                            {notif.type && (
                                                                <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 leading-none ${isNew ? sc.badge : 'bg-slate-100 text-slate-400'}`}>
                                                                    {notif.type.replace(/_/g, ' ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.description}</p>
                                                        {formatRelativeTime(notif.updated_at) && (
                                                            <p className="text-[11px] text-slate-400 mt-1">{formatRelativeTime(notif.updated_at)}</p>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                </svg>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-slate-500">All caught up!</p>
                                                <p className="text-xs text-slate-400 mt-0.5">No new notifications</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] text-slate-400">Realtime · 5-second polling fallback</p>
                                        {notifications?.generated_at && (
                                            <p className="text-[11px] text-slate-400">Updated: {notifications.generated_at}</p>
                                        )}
                                    </div>
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
                        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-slate-100 transition-colors"
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
                        <div className="hidden sm:block text-left">
                            <p className="text-xs font-semibold text-slate-800 leading-none">{displayName}</p>
                            <p className="text-xs text-slate-400 mt-0">{displayRole}</p>
                        </div>
                        <svg className="w-4 h-4 text-slate-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <AnimatePresence>
                        {userOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden py-1"
                            >
                                {['My Profile', 'Settings', 'Help Center'].map((item) => (
                                    <button key={item} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left">
                                        {item}
                                    </button>
                                ))}
                                <div className="border-t border-slate-100 mt-1 pt-1">
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/admin/login' })}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
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
