'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type InvitePayload = {
  name: string
  username: string
  email: string
  role: string
  expires_at: string
}

type Props = {
  token: string
}

function getPasswordChecks(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
}

export default function AdminInviteSetupForm({ token }: Props) {
  const apiUrl = (process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').replace(/\/+$/, '')
  const [invite, setInvite] = useState<InvitePayload | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const checks = useMemo(() => getPasswordChecks(password), [password])

  const getFirstApiError = (value: unknown): string | null => {
    if (!value || typeof value !== 'object') return null

    const errorMap = value as Record<string, unknown>
    const firstEntry = Object.values(errorMap)[0]

    if (Array.isArray(firstEntry) && typeof firstEntry[0] === 'string') {
      return firstEntry[0]
    }

    return null
  }

  useEffect(() => {
    let isMounted = true

    const loadInvite = async () => {
      if (!apiUrl || !token) {
        if (isMounted) {
          setError('Invite link is invalid.')
          setIsLoading(false)
        }
        return
      }

      try {
        const res = await fetch(`${apiUrl}/api/admin/invites/${encodeURIComponent(token)}`, {
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          throw new Error(data?.message || 'Invite link is invalid or expired.')
        }

        if (isMounted) {
          setInvite(data.invite)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load invite.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInvite()

    return () => {
      isMounted = false
    }
  }, [apiUrl, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!Object.values(checks).every(Boolean)) {
      setError('Password does not meet the required strength.')
      return
    }

    if (!apiUrl) {
      setError('API URL is not configured.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`${apiUrl}/api/admin/invites/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          password_confirmation: confirmPassword,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const firstError = getFirstApiError((data as { errors?: unknown } | null)?.errors)
        throw new Error(firstError || data?.message || 'Unable to complete admin setup.')
      }

      setSuccess(data?.message || 'Your admin account is now active.')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete admin setup.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/30">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
              Admin Setup
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white">Finish your admin account setup</h1>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Verify this invitation by setting your password. After that, you can sign in to the admin portal.
            </p>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-5 py-6 text-sm text-slate-400">
              Loading invite details...
            </div>
          ) : error && !invite ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-6 text-sm text-red-300">
              {error}
            </div>
          ) : invite ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</p>
                  <p className="mt-1 text-sm font-medium text-white">{invite.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</p>
                  <p className="mt-1 text-sm font-medium capitalize text-white">{invite.role.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Username</p>
                  <p className="mt-1 text-sm font-medium text-white">{invite.username}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
                  <p className="mt-1 text-sm font-medium text-white">{invite.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create your password"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                <p className="text-sm font-semibold text-white">Password requirements</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-400">
                  <li className={checks.length ? 'text-emerald-400' : ''}>At least 8 characters</li>
                  <li className={checks.uppercase ? 'text-emerald-400' : ''}>At least one uppercase letter</li>
                  <li className={checks.lowercase ? 'text-emerald-400' : ''}>At least one lowercase letter</li>
                  <li className={checks.number ? 'text-emerald-400' : ''}>At least one number</li>
                  <li className={checks.special ? 'text-emerald-400' : ''}>At least one special character</li>
                </ul>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {success} <Link href="/admin/login" className="font-semibold underline">Go to admin login</Link>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Activating account...' : 'Activate Admin Account'}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}
