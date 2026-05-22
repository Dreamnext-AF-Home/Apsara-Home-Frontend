'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { MoonStar, SunMedium } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import { signIn, signOut } from 'next-auth/react'
import { clearAccessTokenCache } from '@/store/api/baseApi'

const REMEMBER_SUPPLIER_LOGIN_KEY = 'afhome_supplier_login'
const TWO_FACTOR_PREFIX = '2FA_REQUIRED|'
const LOCKOUT_PREFIX = 'LOCKOUT|'

const EyeIcon = ({ open }: { open: boolean }) => open
  ? <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
  : <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>

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

export default function SupplierLoginForm() {
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(() => {
    if (typeof window === 'undefined') {
      return { login: '', password: '', rememberMe: false }
    }

    const rememberedLogin = window.localStorage.getItem(REMEMBER_SUPPLIER_LOGIN_KEY)
    return rememberedLogin
      ? { login: rememberedLogin, password: '', rememberMe: true }
      : { login: '', password: '', rememberMe: false }
  })
  const [otpCode, setOtpCode] = useState('')
  const [otpChallengeToken, setOtpChallengeToken] = useState('')
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    if (lockoutSeconds <= 0) return
    const timer = window.setInterval(() => {
      setLockoutSeconds((prev) => (prev > 1 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [lockoutSeconds])

  const set = (field: 'login' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const setRememberMe = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, rememberMe: e.target.checked }))

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lockoutSeconds > 0) {
      return
    }
    setError('')
    setIsLoading(true)

    try {
      // Reset previous session only on first-step login, not during OTP verification.
      if (!otpChallengeToken) {
        clearAccessTokenCache()
        await signOut({ redirect: false })
      }

      const result = await signIn('supplier-credentials', {
        login: form.login,
        password: form.password,
        otp: otpChallengeToken ? otpCode : undefined,
        otp_challenge_token: otpChallengeToken || undefined,
        redirect: false,
      })

      if (!result?.ok) {
        const msg = result?.error ?? ''
        const twoFactor = parseTwoFactorError(msg)
        if (twoFactor) {
          setOtpChallengeToken(twoFactor.token)
          setOtpCode('')
          setError(twoFactor.message)
          return
        }
        const lockout = parseLockoutError(msg)
        if (lockout) {
          setLockoutSeconds(lockout.seconds)
          setError('')
          return
        }
        setError(msg || 'Invalid username/email or password')
        return
      }

      if (typeof window !== 'undefined') {
        if (form.rememberMe) {
          window.localStorage.setItem(REMEMBER_SUPPLIER_LOGIN_KEY, form.login.trim())
        } else {
          window.localStorage.removeItem(REMEMBER_SUPPLIER_LOGIN_KEY)
        }
      }

      router.push('/supplier/dashboard')
    } catch {
      setError('Unable to sign in. Please try again')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f7fbff_0%,#eff6ff_38%,#f8fafc_100%)] px-4 text-slate-900 dark:bg-[radial-gradient(circle_at_top,#14263a_0%,#09111d_42%,#050914_100%)] dark:text-slate-100">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.08)_1px,transparent_1px)] bg-[size:48px_48px] dark:bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.05)_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute top-0 left-1/4 h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-600/10" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl dark:bg-teal-600/10" />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200/80 bg-white/80 text-slate-600 shadow-sm backdrop-blur transition hover:border-sky-300 hover:text-sky-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-cyan-500/30 dark:hover:text-cyan-300"
        >
          {resolvedTheme === 'dark' ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="rounded-2xl border border-sky-100/90 bg-white/92 p-8 shadow-2xl shadow-sky-100/70 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/82 dark:shadow-black/40">
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4 rounded-xl border border-sky-200/80 bg-sky-50/90 p-3 dark:border-cyan-500/20 dark:bg-cyan-600/15">
              <Image
                src="/Images/af_home_logo.png"
                alt="AF HOME"
                width={80}
                height={26}
                className="h-7 w-auto object-contain dark:brightness-0 dark:invert dark:opacity-90"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Supplier Portal</h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sign in to manage your company products</p>
          </div>

          <form onSubmit={handleSign}>
            {(error || lockoutSeconds > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
              >
                <svg className="shrink-0 w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {lockoutSeconds > 0 ? `Too many login attempts. Try again in ${lockoutSeconds} seconds.` : error}
              </motion.div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Email or Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/95 py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/30 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-cyan-500/50"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/95 py-2.5 pl-9 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/30 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-cyan-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>

            {otpChallengeToken ? (
              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Email OTP Code</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  inputMode="numeric"
                  placeholder="Enter 6-digit code"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/95 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/30 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-cyan-500/50"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">OTP was sent to your supplier account email.</p>
                  <button
                    type="button"
                    onClick={async () => {
                      setError('')
                      setIsLoading(true)
                      try {
                        const resend = await signIn('supplier-credentials', {
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
                    className="text-xs font-semibold text-cyan-600 transition hover:text-cyan-700 dark:text-cyan-300 dark:hover:text-cyan-200"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={setRememberMe}
                  className="h-4 w-4 rounded border-slate-300 bg-white text-cyan-500 focus:ring-cyan-500/30 dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-cyan-500/40"
                />
                Remember me
              </label>

              <Link href="/supplier/forgot-password" className="text-xs font-semibold text-cyan-600 transition hover:text-cyan-700 dark:text-cyan-300 dark:hover:text-cyan-200">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading || lockoutSeconds > 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2.5 font-semibold tracking-wide text-white shadow-lg shadow-cyan-600/25 transition-all duration-200 hover:bg-cyan-500 active:scale-[0.99] disabled:opacity-60"
            >
              {isLoading ? <><Loading size={14} /><span>Signing in...</span></> : <span>{lockoutSeconds > 0 ? `Try again in ${lockoutSeconds}s` : otpChallengeToken ? 'Verify & Sign In' : 'Sign In'}</span>}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-600">
          AF HOME Supplier Portal &copy; {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  )
}
