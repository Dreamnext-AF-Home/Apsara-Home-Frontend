'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from '@/components/Loading'
import { signIn, signOut } from "next-auth/react";
import { baseApi, clearAccessTokenCache } from "@/store/api/baseApi";
import { useAppDispatch } from "@/store/hooks";
import { clearAdminSession } from "@/libs/adminSession";

const EyeIcon = ({ open }: { open: boolean }) => open
    ? <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
    : <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>

const BAN_KEYWORDS = ['suspended', 'banned', 'restricted', 'contact a super admin']

function isBanMessage(msg: string) {
    return BAN_KEYWORDS.some(k => msg.toLowerCase().includes(k))
}

const AdminLoginForm = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isSuspendedRedirect = searchParams.get('suspended') === '1';
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [banMessage, setBanMessage] = useState('');
    const [form, setForm] = useState({ login: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [field]: e.target.value }));

    const handleSign = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError('');
        setBanMessage('');
        setIsLoading(true);

        try {
            // Reset any previous admin session/token to prevent role carry-over.
            dispatch(baseApi.util.resetApiState())
            clearAccessTokenCache()
            await clearAdminSession()
            await signOut({ redirect: false })

            const result = await signIn('admin-credentials', {
                login: form.login,
                password: form.password,
                redirect: false,
            })

            if (!result?.ok) {
                const msg = result?.error ?? ''
                if (isBanMessage(msg)) {
                    setBanMessage(msg)
                } else {
                    setError('Invalid email/username or password')
                }
                return;
            }

            dispatch(baseApi.util.resetApiState())
            clearAccessTokenCache()

            // Refresh the app shell using Next router navigation.
            router.replace('/admin/dashboard')
            router.refresh()
        } catch {
            setError('Unable to sign in. Please try again');
        } finally {
            setIsLoading(false)
        }
    }
    return (
        <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">

            {/* BACKGROUND GRID */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />

            {/* GLOW BLOBS */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 25, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-sm"
            >

                {/* CARD */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">

                    {/* ── BANNED / SUSPENDED SCREEN ── */}
                    <AnimatePresence mode="wait">
                    {(isSuspendedRedirect || banMessage) ? (
                        <motion.div
                            key="banned"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="px-8 py-10 flex flex-col items-center text-center"
                        >
                            {/* Top red bar */}
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-red-600 via-red-400 to-red-600" />

                            {/* Pulsing lock icon */}
                            <div className="relative mb-6">
                                <motion.div
                                    animate={{ scale: [1, 1.08, 1], opacity: [1, 0.8, 1] }}
                                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                                    className="h-20 w-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center"
                                >
                                    <svg className="w-9 h-9 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </motion.div>
                                <motion.span
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-slate-900 flex items-center justify-center"
                                >
                                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </motion.span>
                            </div>

                            <h2 className="text-lg font-bold text-white mb-1.5">Account Suspended</h2>
                            <p className="text-sm text-slate-400 leading-relaxed mb-5">
                                {banMessage || 'Your session was ended because your account has been suspended by a Super Admin.'}
                            </p>

                            <div className="w-full rounded-xl border border-red-500/15 bg-red-500/8 px-4 py-3 mb-6 text-left">
                                <p className="text-xs text-red-400/80 leading-relaxed">
                                    You will not be able to access the admin portal until a Super Admin lifts the restriction on your account.
                                </p>
                            </div>

                            {!isSuspendedRedirect && (
                                <button
                                    type="button"
                                    onClick={() => { setBanMessage(''); setForm({ login: '', password: '' }) }}
                                    className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 text-sm font-medium transition-all"
                                >
                                    Back to Login
                                </button>
                            )}
                        </motion.div>
                    ) : (
                    <div className="p-8">
                    {/* LOGO + HEADING */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="mb-4 p-3 rounded-xl bg-indigo-600/15 border border-indigo-500/20">
                            <Image
                                src="/Images/af_home_logo.png"
                                alt="AF HOME"
                                width={80}
                                height={26}
                                className="h-7 w-auto object-contain brightness-0 invert opacity-90"
                            />
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Admin Portal</h1>
                        <p className="text-slate-400 text-xs mt-1">Sign in to your admin account</p>
                    </div>

                    <form onSubmit={handleSign}>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2.5 bg-red-500/10 border rounded-2xl px-3.5 py-2.5 text-xs text-red-400"
                            >
                                <svg className="shrink-0 w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {error}
                            </motion.div>
                        )}

                        {/* USERNAME */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email or Username</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Enter email or username"
                                    value={form.login}
                                    onChange={set('login')}
                                    required
                                    autoComplete="username"
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* PASSWORD */}
                        <div className="mt-1.5">
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <input 
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={set('password')}
                                    required
                                    autoComplete="current-password"
                                    className="w-full pl-9 pr-11 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    <EyeIcon open={showPass}/>
                                </button>
                            </div>
                        </div>

                        {/* SUBMIT */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl tracking-wide transition-all duration-200 shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loading size={14}/>
                                    <span>Signing in...</span>
                                </>
                            ):(
                                <span>Sign In</span>                            )}
                        </button>
                    </form>
                    </div>
                    )}
                    </AnimatePresence>
                </div>

                {/* FOOTER */}
                <p className="text-center text-xs text-slate-600 mt-5">
                    AF HOME Admin Portal &copy; {new Date().getFullYear()}
                </p>
            </motion.div>
        </div>
    )
}

export default AdminLoginForm
