'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Loading from '@/components/Loading'
import { signIn, signOut } from "next-auth/react";
import { clearAccessTokenCache } from "@/store/api/baseApi";

const EyeIcon = ({ open }: { open: boolean }) => open
    ? <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
    : <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>

const AdminLoginForm = () => {
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ login: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [field]: e.target.value }));

    const handleSign = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
       
        try {
            // Reset any previous admin session/token to prevent role carry-over.
            clearAccessTokenCache()
            await signOut({ redirect: false })

            const result = await signIn('admin-credentials', {
                login: form.login,
                password: form.password,
                redirect: false,
            })

            if (!result?.ok) {
                setError('Invalid email/username or password')
                return;
            }

            clearAccessTokenCache()

            // Hand off redirect decision to middleware using a fresh request.
            window.location.href = '/admin/login'
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
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl shadow-black/40">

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
                
                {/* FOOTER */}
                <p className="text-center text-xs text-slate-600 mt-5">
                    AF HOME Admin Portal &copy; {new Date().getFullYear()}
                </p>
            </motion.div>
        </div>
    )
}

export default AdminLoginForm
