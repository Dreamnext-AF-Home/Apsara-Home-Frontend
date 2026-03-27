'use client';

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useGetAdminMeQuery } from "@/store/api/authApi";
import { useHeartbeatAdminPresenceMutation } from "@/store/api/adminUsersApi";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { data: session } = useSession();
    const pathname = usePathname();
    const isBanned = (session?.user as { isBanned?: boolean } | undefined)?.isBanned === true;
    const sessionAccessToken = String((session?.user as { accessToken?: string } | undefined)?.accessToken ?? '');
    const adminIdentityKey = sessionAccessToken
        ? `${String((session?.user as { id?: string | number } | undefined)?.id ?? 'unknown')}:${sessionAccessToken}`
        : undefined;
    const [heartbeatAdminPresence] = useHeartbeatAdminPresenceMutation();

    // Poll /me every 12 seconds — baseQueryWithBanCheck intercepts 401 reason:banned and auto-signs out
    useGetAdminMeQuery(adminIdentityKey, { pollingInterval: 12_000, skip: isBanned || !sessionAccessToken });

    useEffect(() => {
        if (!sessionAccessToken || isBanned) {
            return;
        }

        const currentPath = pathname || '/admin/dashboard';
        void heartbeatAdminPresence({ path: currentPath });

        const intervalId = window.setInterval(() => {
            void heartbeatAdminPresence({ path: currentPath });
        }, 30_000);

        return () => window.clearInterval(intervalId);
    }, [heartbeatAdminPresence, isBanned, pathname, sessionAccessToken]);

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>

            {/* ── Ban Overlay ── */}
            <AnimatePresence>
                {isBanned && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-9999 flex items-center justify-center p-4"
                        style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(2, 6, 23, 0.85)' }}
                    >
                        {/* Glow behind card */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            className="relative w-full max-w-md bg-slate-900/90 border border-red-500/20 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden"
                        >
                            {/* Top red accent bar */}
                            <div className="h-1 w-full bg-linear-to-r from-red-600 via-red-400 to-red-600" />

                            <div className="px-8 py-10 flex flex-col items-center text-center">
                                {/* Pulsing lock */}
                                <div className="relative mb-7">
                                    <motion.div
                                        animate={{ scale: [1, 1.07, 1], opacity: [1, 0.85, 1] }}
                                        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                                        className="h-24 w-24 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center"
                                    >
                                        <svg className="w-11 h-11 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </motion.div>
                                    {/* Red dot badge */}
                                    <motion.span
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 border-2 border-slate-900 flex items-center justify-center"
                                    >
                                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </motion.span>
                                </div>

                                {/* Heading */}
                                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                                    Account Suspended
                                </h2>
                                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                    Your admin account has been suspended by a Super Admin.
                                    You can view this page but you cannot perform any actions.
                                </p>

                                {/* Info box */}
                                <div className="w-full rounded-2xl border border-red-500/15 bg-red-500/8 px-5 py-4 mb-8 text-left space-y-2">
                                    <div className="flex items-start gap-2.5">
                                        <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-xs text-red-300/80 leading-relaxed">
                                            To restore access, contact a <span className="font-semibold text-red-300">Super Admin</span> and ask them to lift the restriction on your account.
                                        </p>
                                    </div>
                                </div>

                                {/* Logged in as */}
                                <div className="w-full flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3 mb-6">
                                    <div className="h-8 w-8 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div className="text-left min-w-0">
                                        <p className="text-xs text-slate-500 leading-none mb-0.5">Logged in as</p>
                                        <p className="text-sm font-semibold text-slate-300 truncate">{session?.user?.name ?? 'Admin'}</p>
                                        <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
                                    </div>
                                </div>

                                {/* Sign out button */}
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => signOut({ callbackUrl: '/admin/login' })}
                                    className="w-full py-3 rounded-xl border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default DashboardLayout
