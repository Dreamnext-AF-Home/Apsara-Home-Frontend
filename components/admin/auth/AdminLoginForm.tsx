'use client';

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Loading from '@/components/Loading'
import { signIn, signOut } from "next-auth/react";
import { baseApi, clearAccessTokenCache } from "@/store/api/baseApi";
import { useAppDispatch } from "@/store/hooks";
import { clearAdminSession, clearPartnerSession } from "@/libs/adminSession";
import PrimaryButton from '@/components/ui/buttons/PrimaryButton';

const EyeIcon = ({ open }: { open: boolean }) => open
    ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
    : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>

function FloatingInput({ id, type = 'text', label, value, onChange, autoComplete, endContent }: {
    id: string; type?: string; label: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    autoComplete?: string; endContent?: React.ReactNode;
}) {
    return (
        <div className="w-full">
            <label htmlFor={id} className="block text-xs font-semibold text-gray-600 dark:text-white/80 mb-1.5">
                {label}
            </label>
            <div className="relative w-full">
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder=""
                    autoComplete={autoComplete}
                    className="h-11 w-full rounded-[18px] border border-gray-300 dark:border-white/18 bg-white dark:bg-white/12 px-4 text-sm text-gray-900 dark:text-white outline-none transition-all duration-200 focus:border-sky-400 dark:focus:border-sky-400/60 focus:bg-white dark:focus:bg-white/18"
                />
                {endContent && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/60">
                        {endContent}
                    </div>
                )}
            </div>
        </div>
    )
}

const BAN_KEYWORDS = ['suspended', 'banned', 'restricted', 'contact a super admin']
const TWO_FACTOR_PREFIX = '2FA_REQUIRED|'
const LOCKOUT_PREFIX = 'LOCKOUT|'

function isBanMessage(msg: string) {
    return BAN_KEYWORDS.some(k => msg.toLowerCase().includes(k))
}

function parseTwoFactorError(rawMessage: string): { token: string; message: string } | null {
    if (!rawMessage.startsWith(TWO_FACTOR_PREFIX)) return null
    const payload = rawMessage.slice(TWO_FACTOR_PREFIX.length)
    const [token = '', ...rest] = payload.split('|')
    return {
        token: token.trim(),
        message: (rest.join('|') || 'A verification code was sent to your email.').trim(),
    }
}

function parseLockoutError(rawMessage: string): { seconds: number; message: string } | null {
    if (!rawMessage.startsWith(LOCKOUT_PREFIX)) return null
    const payload = rawMessage.slice(LOCKOUT_PREFIX.length)
    const [secondsRaw = '0', ...rest] = payload.split('|')
    const seconds = Number.parseInt(secondsRaw, 10)
    return {
        seconds: Number.isFinite(seconds) && seconds > 0 ? seconds : 1,
        message: (rest.join('|') || 'Too many login attempts. Please try again later.').trim(),
    }
}

const AdminLoginForm = ({ turnstileSiteKey = '' }: { turnstileSiteKey?: string }) => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isPartnerLogin = pathname.startsWith('/partner');
    const loginPath = isPartnerLogin ? '/partner/login' : '/admin/login';
    const providerId = isPartnerLogin ? 'partner-credentials' : 'admin-credentials';
    const isSuspendedRedirect = searchParams.get('suspended') === '1';
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [banMessage, setBanMessage] = useState('');
    const [form, setForm] = useState({ login: '', password: '' });
    const [otpCode, setOtpCode] = useState('');
    const [otpChallengeToken, setOtpChallengeToken] = useState('');
    const [lockoutSeconds, setLockoutSeconds] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const turnstileRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string>('');
    const [turnstileToken, setTurnstileToken] = useState('');

    useEffect(() => {
        if (lockoutSeconds <= 0) return
        const timer = window.setInterval(() => {
            setLockoutSeconds((prev) => (prev > 1 ? prev - 1 : 0))
        }, 1000)
        return () => window.clearInterval(timer)
    }, [lockoutSeconds])

    useEffect(() => {
        if (!turnstileSiteKey) return

        let cancelled = false

        const doRender = () => {
            if (cancelled || !turnstileRef.current || !window.turnstile) return
            widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
                sitekey: turnstileSiteKey,
                callback: (token) => { if (!cancelled) setTurnstileToken(token) },
                'expired-callback': () => { if (!cancelled) setTurnstileToken('') },
                'error-callback': () => { if (!cancelled) setTurnstileToken('') },
                theme: 'auto',
            })
        }

        const SCRIPT_ID = 'cf-turnstile-script'
        let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
        if (!script) {
            script = document.createElement('script')
            script.id = SCRIPT_ID
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
            script.async = true
            document.head.appendChild(script)
        }

        if (window.turnstile) {
            doRender()
        } else {
            script.addEventListener('load', doRender, { once: true })
        }

        return () => {
            cancelled = true
            if (widgetIdRef.current && window.turnstile) {
                try { window.turnstile.remove(widgetIdRef.current) } catch {}
                widgetIdRef.current = ''
            }
            setTurnstileToken('')
        }
    }, [turnstileSiteKey])

    const resetTurnstile = () => {
        if (widgetIdRef.current && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current)
        }
        setTurnstileToken('')
    }

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [field]: e.target.value }));

    const handleSign = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (lockoutSeconds > 0) {
            return
        }
        setError('');
        setBanMessage('');
        setIsLoading(true);

        try {
            // Reset previous session only on first-step login, not during OTP verification.
            if (!otpChallengeToken) {
                dispatch(baseApi.util.resetApiState())
                clearAccessTokenCache()
                if (isPartnerLogin) {
                    await clearPartnerSession(loginPath)
                } else {
                    await clearAdminSession(loginPath)
                }
                await signOut({ redirect: false })
            }

            const result = await signIn(providerId, {
                login: form.login,
                password: form.password,
                otp: otpChallengeToken ? otpCode : undefined,
                otp_challenge_token: otpChallengeToken || undefined,
                cf_turnstile_response: !otpChallengeToken ? turnstileToken || undefined : undefined,
                redirect: false,
            })

            if (!result?.ok) {
                const msg = result?.error ?? ''
                const twoFactor = parseTwoFactorError(msg)
                if (twoFactor) {
                    setOtpChallengeToken(twoFactor.token)
                    setOtpCode('')
                    setError(twoFactor.message)
                    resetTurnstile()
                    return
                }
                const lockout = parseLockoutError(msg)
                if (lockout) {
                    setLockoutSeconds(lockout.seconds)
                    setError('')
                    resetTurnstile()
                    return
                }
                if (isBanMessage(msg)) {
                    setBanMessage(msg)
                } else {
                    setError(msg || 'Invalid email/username or password')
                }
                resetTurnstile()
                return;
            }

            dispatch(baseApi.util.resetApiState())
            clearAccessTokenCache()

            if (isPartnerLogin) {
                router.replace('/partner/webpages/partner-storefronts')
            } else {
                router.replace('/admin')
            }
        } catch {
            setError('Unable to sign in. Please try again');
        } finally {
            setIsLoading(false)
        }
    }
    return (
        <div className="min-h-screen w-full flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
            <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md"
            >
                <div className="bg-white/90 dark:bg-slate-800/85 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-8">
                    <AnimatePresence mode="wait">
                        {(isSuspendedRedirect || banMessage) ? (
                            <motion.div
                                key="banned"
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="flex flex-col items-center text-center"
                            >
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
                                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white dark:border-slate-800 flex items-center justify-center"
                                    >
                                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </motion.span>
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">Account Suspended</h2>
                                <p className="text-sm text-gray-500 dark:text-white/70 leading-relaxed mb-5">
                                    {banMessage || 'Your session was ended because your account has been suspended by a Super Admin.'}
                                </p>
                                <div className="w-full rounded-xl border border-red-200 bg-red-50 dark:border-red-400/20 dark:bg-red-500/20 px-4 py-3 mb-6 text-left">
                                    <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                                        You will not be able to access the admin portal until a Super Admin lifts the restriction on your account.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBanMessage('');
                                        setForm({ login: '', password: '' });
                                        setOtpCode('');
                                        setOtpChallengeToken('');
                                        setLockoutSeconds(0);
                                        if (isSuspendedRedirect) router.replace(loginPath);
                                    }}
                                    className="w-full py-2.5 rounded-full border border-gray-300 dark:border-white/20 text-gray-500 dark:text-white/70 hover:text-gray-800 dark:hover:text-white hover:border-gray-400 dark:hover:border-white/40 text-sm font-medium transition-all"
                                >
                                    Back to Login
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: -24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 24 }}
                                transition={{ duration: 0.25 }}
                            >
                                <div className="mb-6">
                                    <Image
                                        src="/Images/af_home_logo.png"
                                        alt="AF HOME"
                                        width={80}
                                        height={26}
                                        className="h-10 w-auto object-contain dark:brightness-0 dark:invert mb-4"
                                    />
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome back!</h2>
                                    <p className="text-gray-500 dark:text-white/70 text-sm">
                                        Sign in to your {isPartnerLogin ? 'Partner' : 'Admin'} account
                                    </p>
                                </div>

                                <form className="space-y-4" onSubmit={handleSign}>
                                    {(error || lockoutSeconds > 0) && (
                                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/20 dark:text-red-300">
                                            {lockoutSeconds > 0 ? `Too many login attempts. Try again in ${lockoutSeconds} seconds.` : error}
                                        </div>
                                    )}

                                    <FloatingInput
                                        id="admin-login"
                                        type="text"
                                        label="Email or Username"
                                        value={form.login}
                                        onChange={set('login')}
                                        autoComplete="username"
                                    />

                                    <div>
                                        <FloatingInput
                                            id="admin-password"
                                            type={showPass ? 'text' : 'password'}
                                            label="Password"
                                            value={form.password}
                                            onChange={set('password')}
                                            autoComplete="current-password"
                                            endContent={(
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPass(p => !p)}
                                                    className="text-gray-400 dark:text-white/60 hover:text-gray-700 dark:hover:text-white/80 transition-colors"
                                                >
                                                    <EyeIcon open={showPass} />
                                                </button>
                                            )}
                                        />
                                        <p className="mt-1.5 text-[11px] text-gray-400 dark:text-white/55">Passwords are case-sensitive.</p>
                                    </div>  

                                    {otpChallengeToken ? (
                                        <div>
                                            <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900 dark:border-orange-300/30 dark:bg-orange-500/15 dark:text-orange-200">
                                                <p className="font-semibold">2-Factor Authentication</p>
                                                <p className="mt-1 text-xs text-orange-800/90 dark:text-orange-200/90">
                                                    A 6-digit code was sent to your account email.
                                                </p>
                                            </div>
                                            <div className="mt-3">
                                                <FloatingInput
                                                    id="admin-otp"
                                                    type="text"
                                                    label="OTP Code"
                                                    value={otpCode}
                                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    autoComplete="one-time-code"
                                                />
                                            </div>
                                            <div className="mt-2 flex items-center justify-between gap-2">
                                                <p className="text-[11px] text-gray-400 dark:text-white/55">Check your email for the code.</p>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        setError('')
                                                        setIsLoading(true)
                                                        try {
                                                            const resend = await signIn(providerId, {
                                                                login: form.login,
                                                                password: form.password,
                                                                otp_challenge_token: otpChallengeToken,
                                                                resend_otp: '1',
                                                                redirect: false,
                                                            })
                                                            const msg = resend?.error ?? ''
                                                            const twoFactor = parseTwoFactorError(msg)
                                                            if (twoFactor) {
                                                                setOtpChallengeToken(twoFactor.token)
                                                                setError(twoFactor.message)
                                                            } else if (msg) {
                                                                setError(msg)
                                                            } else {
                                                                setError('OTP re-sent. Please check your email.')
                                                            }
                                                        } catch {
                                                            setError('Failed to resend OTP. Please try again.')
                                                        } finally {
                                                            setIsLoading(false)
                                                        }
                                                    }}
                                                    className="text-xs font-semibold text-sky-500 hover:text-sky-400 transition-colors"
                                                >
                                                    Resend Code
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}

                                    {turnstileSiteKey && !otpChallengeToken && (
                                        <div className="flex justify-center">
                                            <div ref={turnstileRef} />
                                        </div>
                                    )}

                                    <PrimaryButton
                                        type="submit"
                                        disabled={isLoading || lockoutSeconds > 0 || (!!turnstileSiteKey && !turnstileToken && !otpChallengeToken)}
                                        className="w-full py-3 px-5 text-sm"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loading size={14} />
                                                <span>Signing in...</span>
                                            </>
                                        ) : (
                                            <span>{lockoutSeconds > 0 ? `Try again in ${lockoutSeconds}s` : otpChallengeToken ? 'Verify & Sign In' : 'Sign in'}</span>
                                        )}
                                    </PrimaryButton>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-5">
                    AF HOME {isPartnerLogin ? 'Partner' : 'Admin'} Portal &copy; {new Date().getFullYear()}
                </p>
            </motion.div>
        </div>
    )
}

export default AdminLoginForm
