'use client';

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import VideoBackground from "@/components/VideoBackground";
import { motion } from "framer-motion";
import Header from "@/components/landing-page/Header";
import PrimaryButton from '@/components/ui/buttons/PrimaryButton';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, options: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback': () => void;
        'error-callback': () => void;
        theme?: string;
      }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    }
  }
}

type Props = {
  turnstileSiteKey?: string;
}

export default function ForgotPasswordForm({ turnstileSiteKey = '' }: Props) {
  const apiUrl = (process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').replace(/\/+$/, '')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const turnstileRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string>('')
  const [turnstileToken, setTurnstileToken] = useState('')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!apiUrl) {
      setError('API URL is not configured.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, cf_turnstile_response: turnstileToken || undefined }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.message || 'Unable to send reset email.')
      }

      setSuccess(data?.message || 'If that email exists, a reset link has been sent.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email.')
      resetTurnstile()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto flex flex-col">
      <VideoBackground />
      <div className="absolute inset-0 bg-black/25 dark:bg-black/55 backdrop-blur-[2px]" />

      <div className="relative z-20">
        <Header cartCount={0} />
      </div>

      <div className="relative z-10 flex justify-center w-full px-4 flex-1 items-center">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md transition-all duration-300"
        >
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password</h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-white/70">
                Enter your AF Home account email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 shadow-sm dark:border-red-400/20 dark:bg-red-500/20 dark:text-red-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/20 dark:text-emerald-300">
                  {success}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-white/80">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  required
                  className="h-11 w-full rounded-[18px] border border-gray-300 dark:border-white/18 bg-white dark:bg-white/12 px-4 text-sm text-gray-900 dark:text-white outline-none transition-all duration-200 focus:border-sky-400 dark:focus:border-sky-400/60 focus:bg-white dark:focus:bg-white/18"
                />
              </div>

              {turnstileSiteKey && (
                <div className="flex justify-center">
                  <div ref={turnstileRef} />
                </div>
              )}

              <PrimaryButton
                type="submit"
                disabled={isSubmitting || (!!turnstileSiteKey && !turnstileToken)}
                className="w-full py-3 px-5 text-sm"
              >
                {isSubmitting ? 'Sending reset link...' : 'Send Reset Link'}
              </PrimaryButton>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-white/70">
              <Link href="/login" className="text-sky-500 hover:text-sky-400 font-semibold transition-colors">
                Back to login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
