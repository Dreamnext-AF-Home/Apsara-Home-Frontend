'use client';

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import Loading from '@/components/Loading'
import { showErrorToast, showInfoToast, showSuccessToast } from '@/libs/toast'

const REMEMBER_USER_EMAIL_KEY = 'afhome_user_login'

function getRememberedUserEmail() {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(REMEMBER_USER_EMAIL_KEY) ?? ''
}

const EyeIcon = ({ open }: { open: boolean }) => open
    ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
    : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>

interface LoginFormProps {
    onSwitchToSignUp: () => void;
    onRequirePasswordChange: () => void;
}

const LoginForm = ({ onSwitchToSignUp, onRequirePasswordChange }: LoginFormProps) => {
    const router = useRouter();
    const [showPass, setShowPass] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const rememberedEmail = getRememberedUserEmail()
    const [form, setForm] = useState({
        email: rememberedEmail,
        password: '',
        rememberMe: rememberedEmail !== '',
    })

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [field]: e.target.value }))



    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await signIn('credentials', {
            email: form.email,
            password: form.password,
            redirect: false,
        })

        setIsLoading(false)

        if (result?.ok) {
            if (typeof window !== 'undefined') {
                if (form.rememberMe) {
                    window.localStorage.setItem(REMEMBER_USER_EMAIL_KEY, form.email.trim())
                } else {
                    window.localStorage.removeItem(REMEMBER_USER_EMAIL_KEY)
                }
            }

            const session = await getSession()
            const passwordChangeRequired = Boolean(session?.user?.passwordChangeRequired)

            if (passwordChangeRequired) {
                showInfoToast('Create a new password first before continuing to the shop.')
                onRequirePasswordChange()
                return
            }

            showSuccessToast('Login successful. Welcome back!')
            router.replace('/shop');
        } else {
            const message = 'Invalid email or password. Please try again.'
            setError(message)
            showErrorToast(message)
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.25 }}
        >
            <h2 className="text-2xl font-bold text-white mb-1">Welcome back!</h2>
            <p className="text-white/70 text-sm mb-7">Sign in to your AF Home account</p>

            <form className="space-y-4" onSubmit={handleSignIn}>
                {error && (
                    <div className="bg-red-500/20 border border-red-400/20 rounded-xl px-4 py-2.5 text-sm text-red-300">
                        {error}
                    </div>
                )}
                <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">
                        Username or Email
                    </label>
                    <input
                        type="text"
                        placeholder="Enter your username or email"
                        value={form.email}
                        onChange={set('email')}
                        className="w-full px-4 py-3 bg-white/15 border border-white/25 rounded-xl text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-orange-400/60 focus:bg-white/20 transition-all"
                    />
                </div>

                <div className="">
                    <label className="block text-xs font-semibold text-white mb-1.5">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPass ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={set('password')}
                            className="w-full px-4 py-3 pr-11 bg-white/15 border border-white/25 rounded-xl text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-orange-400/60 focus:bg-white/20 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPass(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
                        >
                            <EyeIcon open={showPass} />
                        </button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-white/55">Passwords are case-sensitive.</p>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-white/70 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.rememberMe}
                            onChange={(e) => setForm((prev) => ({ ...prev, rememberMe: e.target.checked }))}
                            className="accent-orange-500 w-3.5"
                        />
                        Remember me
                    </label>
                    <Link
                        href="/forgot-password"
                        className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
                    >
                        Forgot Password
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-orange-500/30 mt-2 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loading size={14} />
                            <span>Signing in...</span>
                        </>
                    ) : (
                        <span>SIGN IN</span>
                    )}
                </button>

                <p className="text-center text-xs text-white/60">
                    Don&apos;t have an account?{' '}
                    <button
                        onClick={onSwitchToSignUp}
                        className="text-orange-400 hover:text-orange-400 font-semibold transition-colors"
                    >
                        Sign Up
                    </button>
                </p>
            </form>
        </motion.div>
    )
}

export default LoginForm
