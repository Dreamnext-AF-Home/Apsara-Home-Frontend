'use client';

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { getSession, signIn, signOut, useSession } from "next-auth/react";
import Loading from '@/components/Loading'
import { showErrorToast, showInfoToast, showSuccessToast } from '@/libs/toast'
import { clearAccessTokenCache } from "@/store/api/baseApi";
import PrimaryButton from '@/components/ui/buttons/PrimaryButton';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const REMEMBER_USER_EMAIL_KEY = 'afhome_user_login'
const BLOCKED_KEYWORDS = ['banned', 'blocked', 'contact support']
const TWO_FACTOR_PREFIX = '2FA_REQUIRED|'
const MFA_APPROVAL_PREFIX = 'MFA_APPROVAL_REQUIRED|'

function parseTwoFactorError(rawMessage: string): { token: string; message: string } | null {
    if (!rawMessage.startsWith(TWO_FACTOR_PREFIX)) return null
    const payload = rawMessage.slice(TWO_FACTOR_PREFIX.length)
    const [token = '', ...rest] = payload.split('|')
    return {
        token: token.trim(),
        message: (rest.join('|') || 'A verification code was sent to your email.').trim(),
    }
}

function parseMfaApprovalError(rawMessage: string): { token: string; message: string } | null {
    if (!rawMessage.startsWith(MFA_APPROVAL_PREFIX)) return null
    const payload = rawMessage.slice(MFA_APPROVAL_PREFIX.length)
    const [token = '', ...rest] = payload.split('|')
    return {
        token: token.trim(),
        message: (rest.join('|') || 'Approve this login from your email first.').trim(),
    }
}

function resolveCallbackPath(value: string | null | undefined): string {
    const normalized = String(value ?? '').trim()
    if (!normalized.startsWith('/')) return '/shop'
    if (normalized.startsWith('//')) return '/shop'
    return normalized
}

function getRememberedUserEmail() {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(REMEMBER_USER_EMAIL_KEY) ?? ''
}

async function waitForAuthenticatedSession(maxAttempts = 12, delayMs = 150): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const session = await getSession()
        if (session?.user?.accessToken) {
            return true
        }

        await new Promise((resolve) => window.setTimeout(resolve, delayMs))
    }

    return false
}

const base64UrlToUint8Array = (value: string): Uint8Array<ArrayBuffer> => {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const binary = atob(padded)
    const buffer = new ArrayBuffer(binary.length)
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
}

const uint8ArrayToBase64Url = (input: ArrayBuffer | Uint8Array): string => {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
    let binary = ''
    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const parsePasskeyError = (error: unknown): string => {
    if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') return 'Passkey request was cancelled or timed out.'
        if (error.name === 'SecurityError') return 'Passkey is unavailable on this origin/domain.'
        if (error.name === 'NotSupportedError') return 'This browser/device does not support passkeys.'
    }
    if (error instanceof Error) return error.message
    return 'Passkey sign-in failed.'
}

type PasskeyAllowCredential = {
    id: string
    transports?: AuthenticatorTransport[]
}

const EyeIcon = ({ open }: { open: boolean }) => open
    ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
    : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>

type FloatingInputProps = {
    id: string;
    type?: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    autoComplete?: string;
    endContent?: React.ReactNode;
}

function FloatingInput({ id, type = 'text', label, value, onChange, autoComplete, endContent }: FloatingInputProps) {
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
                {endContent ? (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/60">
                        {endContent}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

interface LoginFormProps {
    onSwitchToSignUp: () => void;
    onRequirePasswordChange: () => void;
    turnstileSiteKey?: string;
}

const LoginForm = ({ onSwitchToSignUp, onRequirePasswordChange, turnstileSiteKey = '' }: LoginFormProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { update: updateSession } = useSession();
    const [showPass, setShowPass] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
    const [error, setError] = useState('');
    const [mfaChallengeToken, setMfaChallengeToken] = useState('');
    const [form, setForm] = useState({
        email: '',
        password: '',
        rememberMe: false,
    })

    const blockedFromRedirect = searchParams.get('blocked') === '1'
    const callbackPath = resolveCallbackPath(searchParams.get('callback') || searchParams.get('callbackUrl'))
    const apiBaseUrl = (process.env.NEXT_PUBLIC_LARAVEL_API_URL || '').trim()
    const autoLoginInFlightRef = useRef(false)
    const passkeySupported = typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials
    const turnstileRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string>('')
    const [turnstileToken, setTurnstileToken] = useState('')

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [field]: e.target.value }))

    useEffect(() => {
        const rememberedEmail = getRememberedUserEmail().trim()
        if (!rememberedEmail) return

        setForm((prev) => {
            if (prev.email || prev.password) return prev
            return {
                ...prev,
                email: rememberedEmail,
                rememberMe: true,
            }
        })
    }, [])

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

    const attemptSignIn = useCallback(async (source: 'manual' | 'auto' = 'manual') => {
        setError('');
        setIsLoading(true);

        if (!mfaChallengeToken) {
            clearAccessTokenCache()
            await signOut({ redirect: false })
        }

        const result = await signIn('credentials', {
            email: form.email,
            password: form.password,
            mfa_challenge_token: mfaChallengeToken || undefined,
            cf_turnstile_response: turnstileToken || undefined,
            redirect: false,
            callbackUrl: callbackPath,
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

            if (updateSession) {
                await updateSession()
            }

            if (passwordChangeRequired) {
                showInfoToast('Create a new password first before continuing to the shop.')
                onRequirePasswordChange()
                return
            }

            showSuccessToast(source === 'auto' ? 'Login approved. Welcome back!' : 'Login successful. Welcome back!')
            const sessionReady = await waitForAuthenticatedSession()
            const targetPath = callbackPath.startsWith('/') ? callbackPath : '/shop'

            router.replace(targetPath)
            router.refresh()

            if (!sessionReady && typeof window !== 'undefined') {
                window.setTimeout(() => {
                    window.location.replace(targetPath)
                }, 250)
            }
        } else {
            const rawError = String(result?.error ?? '').trim()
            const mfaApproval = parseMfaApprovalError(rawError)
            if (mfaApproval) {
                setMfaChallengeToken(mfaApproval.token)
                setError(mfaApproval.message)
                setIsLoading(false)
                return
            }
            const twoFactor = parseTwoFactorError(rawError)
            if (twoFactor) {
                setMfaChallengeToken(twoFactor.token)
                setError(twoFactor.message)
                setIsLoading(false)
                return
            }
            const isBlockedError = BLOCKED_KEYWORDS.some((keyword) => rawError.toLowerCase().includes(keyword))
            const message = isBlockedError
                ? 'Your account has been banned. Please contact support for assistance.'
                : (rawError || 'Invalid email or password. Please try again.')
            setError(message)
            showErrorToast(message)
            resetTurnstile()
        }
    }, [callbackPath, form.email, form.password, form.rememberMe, mfaChallengeToken, onRequirePasswordChange, router, turnstileToken, updateSession])

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        await attemptSignIn('manual')
    };

    const handlePasskeySignIn = async () => {
        if (!apiBaseUrl) {
            setError('API URL is not configured for passkey sign-in.')
            return
        }
        if (!passkeySupported) {
            setError('Passkeys are not supported on this browser/device.')
            return
        }

        const identifier = form.email.trim()
        if (!identifier) {
            setError('Enter your email/username first, then use passkey sign-in.')
            return
        }

        setError('')
        setIsPasskeyLoading(true)

        try {
            const beginRes = await fetch(`${apiBaseUrl}/api/auth/passkeys/login/options`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ identifier }),
            })
            const beginData = await beginRes.json().catch(() => null)
            if (!beginRes.ok) {
                const msg = String(
                    beginData?.message
                    || beginData?.errors?.identifier?.[0]
                    || 'Unable to start passkey sign-in.',
                )
                throw new Error(msg)
            }

            const publicKey = beginData?.public_key
            if (!publicKey?.challenge) {
                throw new Error('Passkey options are invalid.')
            }

            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: base64UrlToUint8Array(String(publicKey.challenge)),
                    rpId: publicKey.rpId ? String(publicKey.rpId) : undefined,
                    timeout: Number(publicKey.timeout ?? 60000),
                    userVerification: publicKey.userVerification === 'required' ? 'required' : 'preferred',
                    allowCredentials: Array.isArray(publicKey.allowCredentials)
                        ? (publicKey.allowCredentials as PasskeyAllowCredential[]).map((item) => ({
                            type: 'public-key',
                            id: base64UrlToUint8Array(String(item?.id ?? '')),
                            transports: Array.isArray(item?.transports) ? item.transports : undefined,
                          }))
                        : undefined,
                },
            })

            if (!credential || !(credential instanceof PublicKeyCredential)) {
                throw new Error('No passkey credential was returned.')
            }
            const response = credential.response as AuthenticatorAssertionResponse
            const assertionPayload = {
                id: credential.id,
                rawId: uint8ArrayToBase64Url(credential.rawId),
                type: credential.type,
                response: {
                    clientDataJSON: uint8ArrayToBase64Url(response.clientDataJSON),
                    authenticatorData: uint8ArrayToBase64Url(response.authenticatorData),
                    signature: uint8ArrayToBase64Url(response.signature),
                    userHandle: response.userHandle ? uint8ArrayToBase64Url(response.userHandle) : null,
                },
            }

            clearAccessTokenCache()
            await signOut({ redirect: false })
            const result = await signIn('credentials', {
                email: identifier,
                password: 'passkey',
                passkey_challenge_token: String(beginData.challenge_token || ''),
                passkey_assertion: JSON.stringify(assertionPayload),
                redirect: false,
                callbackUrl: callbackPath,
            })

            if (!result?.ok) {
                throw new Error(String(result?.error || 'Passkey sign-in failed.'))
            }

            if (typeof window !== 'undefined') {
                if (form.rememberMe) {
                    window.localStorage.setItem(REMEMBER_USER_EMAIL_KEY, identifier)
                } else {
                    window.localStorage.removeItem(REMEMBER_USER_EMAIL_KEY)
                }
            }

            const session = await getSession()
            const passwordChangeRequired = Boolean(session?.user?.passwordChangeRequired)
            if (updateSession) {
                await updateSession()
            }

            if (passwordChangeRequired) {
                showInfoToast('Create a new password first before continuing to the shop.')
                onRequirePasswordChange()
                return
            }

            showSuccessToast('Passkey sign-in successful. Welcome back!')
            const sessionReady = await waitForAuthenticatedSession()
            const targetPath = callbackPath.startsWith('/') ? callbackPath : '/shop'
            router.replace(targetPath)
            router.refresh()
            if (!sessionReady && typeof window !== 'undefined') {
                window.setTimeout(() => {
                    window.location.replace(targetPath)
                }, 250)
            }
        } catch (err: unknown) {
            const message = parsePasskeyError(err)
            setError(message)
            showErrorToast(message)
        } finally {
            setIsPasskeyLoading(false)
        }
    }

    useEffect(() => {
        if (!mfaChallengeToken || !apiBaseUrl) return

        let isCancelled = false
        const pollStatus = async () => {
            if (isCancelled || autoLoginInFlightRef.current) return
            try {
                const response = await fetch(`${apiBaseUrl}/api/auth/login/mfa/status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        mfa_challenge_token: mfaChallengeToken,
                    }),
                })
                const data = await response.json().catch(() => null)
                const status = String(data?.status || '')
                const message = String(data?.message || '')

                if (status === 'approved') {
                    autoLoginInFlightRef.current = true
                    setError('Approval confirmed. Signing you in automatically...')
                    await attemptSignIn('auto')
                    autoLoginInFlightRef.current = false
                    return
                }

                if (status === 'denied') {
                    setError(message || 'This sign-in request was denied.')
                    setMfaChallengeToken('')
                    return
                }

                if (status === 'expired' || response.status === 410) {
                    setError(message || 'Sign-in approval expired. Please sign in again.')
                    setMfaChallengeToken('')
                }
            } catch {
                // no-op: keep waiting and polling
            }
        }

        const intervalId = window.setInterval(pollStatus, 2500)
        void pollStatus()

        return () => {
            isCancelled = true
            window.clearInterval(intervalId)
        }
    }, [apiBaseUrl, attemptSignIn, mfaChallengeToken])

    return (
        <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.25 }}
        >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome back!</h2>
            <p className="text-gray-500 dark:text-white/70 text-sm mb-7">Sign in to your AF Home account</p>

            <form className="space-y-4" onSubmit={handleSignIn}>
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 shadow-sm dark:border-red-400/20 dark:bg-red-500/20 dark:text-red-300">
                        {error}
                    </div>
                )}
                {!error && blockedFromRedirect && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 shadow-sm dark:border-red-400/20 dark:bg-red-500/20 dark:text-red-300">
                        Your account has been banned. Please contact support for assistance.
                    </div>
                )}
                <FloatingInput
                    id="login-email"
                    type="text"
                    label="Username or Email"
                    value={form.email}
                    onChange={set('email')}
                    autoComplete="username email"
                />

                <div>
                    <FloatingInput
                        id="login-password"
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

                {mfaChallengeToken ? (
                    <div className="">
                        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900 dark:border-orange-300/30 dark:bg-orange-500/15 dark:text-orange-200">
                            <p className="font-semibold">New device sign-in check</p>
                            <p className="mt-1 text-xs text-orange-800/90 dark:text-orange-200/90">
                                We sent an approval link to your email. Tap <strong>Yes, it is me</strong> and we will sign you in automatically.
                            </p>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={async () => {
                                    setError('')
                                    setIsLoading(true)
                                    try {
                                        const resend = await signIn('credentials', {
                                            email: form.email,
                                            password: form.password,
                                            mfa_challenge_token: mfaChallengeToken,
                                            resend_mfa_approval: '1',
                                            redirect: false,
                                        })
                                        const msg = String(resend?.error ?? '').trim()
                                        const mfaApproval = parseMfaApprovalError(msg)
                                        if (mfaApproval) {
                                            setMfaChallengeToken(mfaApproval.token)
                                            setError(mfaApproval.message)
                                        } else if (msg) {
                                            setError(msg)
                                        } else {
                                            setError('A new approval email was sent. Please check your inbox.')
                                        }
                                    } catch {
                                        setError('Failed to resend approval email. Please try again.')
                                    } finally {
                                        setIsLoading(false)
                                    }
                                }}
                                className="text-xs font-semibold text-orange-500 hover:text-orange-400 transition-colors"
                            >
                                Resend Email
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMfaChallengeToken('')
                                    setError('')
                                }}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-white/70 dark:hover:text-white transition-colors"
                            >
                                Start Over
                            </button>
                        </div>
                    </div>
                ) : null}

                <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-gray-500 dark:text-white/70 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.rememberMe}
                            onChange={(e) => setForm((prev) => ({ ...prev, rememberMe: e.target.checked }))}
                            className="h-4 w-4 rounded border-white/30 bg-white/10 accent-sky-500"
                        />
                        <span className="text-xs">Remember me</span>
                    </label>
                    <Link
                        href="/forgot-password"
                        className="text-sky-500 hover:text-sky-400 font-semibold transition-colors"
                    >
                        Forgot Password
                    </Link>
                </div>

                <button
                    type="button"
                    onClick={handlePasskeySignIn}
                    disabled={isLoading || isPasskeyLoading}
                    className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                >
                    {isPasskeyLoading ? 'Checking passkey...' : 'Sign in with Passkey'}
                </button>
                {!passkeySupported ? (
                    <p className="text-[11px] text-slate-500">Passkeys are not supported in this browser.</p>
                ) : null}

                {turnstileSiteKey && !mfaChallengeToken && (
                    <div className="flex justify-center">
                        <div ref={turnstileRef} />
                    </div>
                )}

                <PrimaryButton
                    type="submit"
                    disabled={isLoading || isPasskeyLoading || (!!turnstileSiteKey && !turnstileToken && !mfaChallengeToken)}
                    className="w-full py-3 px-5 text-sm"
                >
                    {isLoading ? (
                        <>
                            <Loading size={14} />
                            <span>Signing in...</span>
                        </>
                    ) : (
                        <span>{mfaChallengeToken ? 'Continue Sign in' : 'Sign in'}</span>
                    )}
                </PrimaryButton>
            </form>
        </motion.div>
    )
}

export default LoginForm
