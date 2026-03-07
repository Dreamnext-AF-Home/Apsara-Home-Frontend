'use client';

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
    useGetAdminNotificationsQuery,
    useMarkAdminNotificationReadMutation,
    useMarkAllAdminNotificationsReadMutation,
} from "@/store/api/adminNotificationsApi";
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

const Header = ({ onMenuClick }: HeaderProps) => {
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
        pollingInterval: 10000,
        refetchOnFocus: true,
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
        const onNotificationCreated = () => {
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
    }, [accessToken, refetchNotifs]);

    const handleNotificationClick = async (id: string, href: string) => {
        try {
            await markNotificationRead(id).unwrap();
        } catch {
            // Navigate even if read-state update fails; polling/realtime will reconcile state.
        } finally {
            setNotifOpen(false);
            router.push(href);
        }
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
                                className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50"
                            >
                                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 z-10 overflow-hidden">
                                    <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                                    <button
                                        onClick={handleMarkAllNotificationsRead}
                                        className="text-xs text-teal-600 font-medium hover:underline"
                                    >
                                        Mark all read
                                    </button>
                                </div>
                                <div className="max-h-80 overflow-y-auto overscroll-contain">
                                    {isNotifLoading ? (
                                        <div className="px-4 py-3 text-sm text-slate-500">Loading notifications...</div>
                                    ) : isNotifError ? (
                                        <div className="px-4 py-3 text-sm text-red-600">Failed to load notifications.</div>
                                    ) : notifications?.items?.length ? (
                                        notifications.items.map((notif) => {
                                            const isNew = !notif.is_read;
                                            return (
                                            <button
                                                key={notif.id}
                                                type="button"
                                                onClick={() => {
                                                    handleNotificationClick(notif.id, notif.href);
                                                }}
                                                className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${isNew ? 'bg-teal-50/40' : ''}`}
                                            >
                                                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${isNew ? 'bg-teal-500' : 'bg-slate-200'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-slate-700 font-medium">{notif.title}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{notif.description}</p>
                                                    {formatRelativeTime(notif.updated_at) && (
                                                        <p className="text-[11px] text-slate-400 mt-1">{formatRelativeTime(notif.updated_at)}</p>
                                                    )}
                                                </div>
                                                {notif.type ? (
                                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{notif.type.replace(/_/g, ' ')}</span>
                                                ) : null}
                                            </button>
                                            );
                                        })
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-slate-500">No notifications right now.</div>
                                    )}
                                </div>
                                <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                                    <p className="text-[11px] text-slate-400">
                                        Realtime updates enabled (with 10-second polling fallback)
                                    </p>
                                    {notifications?.generated_at ? (
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Updated: {notifications.generated_at}
                                        </p>
                                    ) : null}
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
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
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
