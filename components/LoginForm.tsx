'use client';

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { getSession, signIn, signOut, useSession } from "next-auth/react";
import Loading from '@/components/Loading'
import { DynamicIslandToast, dynamicIsland } from '@/components/ui/LoginLoading/LoginLoading'
import { clearAccessTokenCache } from "@/store/api/baseApi";
import QrModal from "@/components/QrModal";

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

const REMEMBER_USER_EMAIL_KEY = 'afhome_user_login'
const BLOCKED_KEYWORDS = ['banned', 'blocked', 'contact support']
const TWO_FACTOR_PREFIX = '2FA_REQUIRED|'
const MFA_APPROVAL_PREFIX = 'MFA_APPROVAL_REQUIRED|'
const LOCKOUT_PREFIX = 'LOCKOUT|'

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


// Google OAuth popup handler for login
type GoogleAuthResult = {
    success: true;
    email: string;
    name: string;
    id_token: string;
} | {
    success: false;
    error: string;
};

const openGoogleAuthPopup = (): Promise<GoogleAuthResult> => {
    return new Promise((resolve) => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
            resolve({ success: false, error: 'Google Client ID not configured' });
            return;
        }

        const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/auth/google/callback` : '';
        const scope = encodeURIComponent('openid email profile');
        const state = Math.random().toString(36).substring(2, 15);

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=token` +
            `&scope=${scope}` +
            `&state=${state}` +
            `&prompt=consent`;

        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
            authUrl,
            'googleAuth',
            `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
        );

        if (!popup) {
            resolve({ success: false, error: 'Popup blocked. Please allow popups for this site.' });
            return;
        }

        const messageHandler = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type !== 'GOOGLE_AUTH_CALLBACK') return;

            window.removeEventListener('message', messageHandler);
            clearInterval(checkClosed);

            const { error, access_token, id_token, email, name } = event.data;

            if (error) {
                resolve({ success: false, error });
            } else if ((access_token || id_token) && email) {
                resolve({
                    success: true,
                    email,
                    name: name || email.split('@')[0],
                    id_token: id_token || access_token, // Use id_token if available, fallback to access_token
                });
            } else {
                resolve({ success: false, error: 'Failed to get Google credentials' });
            }
        };

        window.addEventListener('message', messageHandler);

        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
                window.removeEventListener('message', messageHandler);
                resolve({ success: false, error: 'Authentication cancelled' });
            }
        }, 500);
    });
};

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
    accountLabel?: string;
    defaultCallbackPath?: string;
}

const LoginForm = ({
    onSwitchToSignUp,
    onRequirePasswordChange,
    turnstileSiteKey = '',
    accountLabel = 'AF Home',
    defaultCallbackPath = '/shop',
}: LoginFormProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { update: updateSession } = useSession();
    const [showPass, setShowPass] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
    const [error, setError] = useState('');
    const [mfaChallengeToken, setMfaChallengeToken] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [lockoutSeconds, setLockoutSeconds] = useState(0);
    const [showTotpField, setShowTotpField] = useState(false);
    const [totpLoginCode, setTotpLoginCode] = useState('');
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [preGeneratedQr, setPreGeneratedQr] = useState<{ sessionId: string; qrData: string } | null>(null);
    const [form, setForm] = useState({
        email: '',
        password: '',
        rememberMe: false,
    })

    const blockedFromRedirect = searchParams.get('blocked') === '1'
    const callbackPath = resolveCallbackPath(
        searchParams.get('callback') || searchParams.get('callbackUrl') || defaultCallbackPath,
    )
    const apiBaseUrl = (process.env.NEXT_PUBLIC_LARAVEL_API_URL || '').trim()
    const autoLoginInFlightRef = useRef(false)
    const passkeySupported = typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials
    const turnstileRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string>('')
    const [turnstileToken, setTurnstileToken] = useState('')

    useEffect(() => {
        if (lockoutSeconds <= 0) return
        const timer = window.setInterval(() => {
            setLockoutSeconds((prev) => (prev > 1 ? prev - 1 : 0))
        }, 1000)
        return () => window.clearInterval(timer)
    }, [lockoutSeconds])

    // Prevent hydration mismatch for Turnstile widget
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Pre-generate QR code in background
    useEffect(() => {
        const generateQrInBackground = async () => {
            try {
                if (!apiBaseUrl) return
                const response = await fetch(`${apiBaseUrl}/api/auth/qr/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    setPreGeneratedQr({
                        sessionId: data.session_id,
                        qrData: data.qr_data,
                    })
                }
            } catch (err) {
                console.warn('Background QR generation failed:', err)
            }
        }

        generateQrInBackground()
    }, [apiBaseUrl])

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
        if (!turnstileSiteKey || !isMounted) return

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
    }, [turnstileSiteKey, isMounted])

    const resetTurnstile = () => {
        if (widgetIdRef.current && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current)
        }
        setTurnstileToken('')
    }

    const attemptSignIn = useCallback(async (source: 'manual' | 'auto' = 'manual') => {
        setError('');
        setIsLoading(true);
        dynamicIsland.loading('Logging in…')

        if (!mfaChallengeToken) {
            clearAccessTokenCache()
            await signOut({ redirect: false })
        }

        const result = await signIn('credentials', {
            email: form.email,
            password: form.password,
            mfa_challenge_token: mfaChallengeToken || undefined,
            cf_turnstile_response: turnstileToken || undefined,
            totp_code: totpLoginCode.trim() || undefined,
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
                dynamicIsland.success('Create a new password first before continuing to the shop.')
                onRequirePasswordChange()
                return
            }

            dynamicIsland.success(source === 'auto' ? 'Login approved. Welcome back!' : 'Login successful. Welcome back!')
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
            const lockout = parseLockoutError(rawError)
            if (lockout) {
                setLockoutSeconds(lockout.seconds)
                setError('')
                resetTurnstile()
                return
            }
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
            dynamicIsland.error(message)
            resetTurnstile()
        }
    }, [callbackPath, defaultCallbackPath, form.email, form.password, form.rememberMe, mfaChallengeToken, onRequirePasswordChange, router, turnstileToken, updateSession])

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (lockoutSeconds > 0) return
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
        dynamicIsland.loading('Verifying passkey…')

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
                dynamicIsland.success('Create a new password first before continuing to the shop.')
                onRequirePasswordChange()
                return
            }

            dynamicIsland.success('Passkey sign-in successful. Welcome back!')
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
            dynamicIsland.error(message)
        } finally {
            setIsPasskeyLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setError('')
        setIsGoogleLoading(true)
        dynamicIsland.loading('Signing in with Google…')

        try {
            const result = await openGoogleAuthPopup()

            if (!result.success) {
                setError(result.error)
                dynamicIsland.error(result.error)
                return
            }

            if (!result.id_token) {
                const msg = 'Google sign-in failed: No token received from Google.'
                setError(msg)
                dynamicIsland.error(msg)
                return
            }

            clearAccessTokenCache()
            const existingSession = await getSession()
            if (existingSession) {
                await signOut({ redirect: false })
            }

            const signInResult = await signIn('credentials', {
                google_access_token: result.id_token,
                email: result.email,
                password: 'google_oauth',
                redirect: false,
                callbackUrl: callbackPath,
            })

            if (!signInResult?.ok) {
                const rawError = String(signInResult?.error ?? '').trim()

                if (rawError === 'GOOGLE_NOT_LINKED') {
                    router.push('/auth/google-not-connected')
                    return
                }

                const message = rawError || 'Google sign-in failed. Please try again.'
                setError(message)
                dynamicIsland.error(message)
                return
            }

            const sessionReady = await waitForAuthenticatedSession()

            if (!sessionReady) {
                router.push('/auth/google-not-connected')
                return
            }

            const session = await getSession()
            const passwordChangeRequired = Boolean(session?.user?.passwordChangeRequired)

            if (updateSession) {
                await updateSession()
            }

            if (passwordChangeRequired) {
                dynamicIsland.success('Create a new password first before continuing to the shop.')
                onRequirePasswordChange()
                return
            }

            dynamicIsland.success('Google sign-in successful. Welcome back!')
            const targetPath = callbackPath.startsWith('/') ? callbackPath : '/shop'
            window.location.replace(targetPath)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.'
            setError(message)
            dynamicIsland.error(message)
        } finally {
            setIsGoogleLoading(false)
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
            <DynamicIslandToast />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome back!</h2>
            <p className="text-gray-500 dark:text-white/70 text-sm mb-7">Sign in to your {accountLabel} account</p>

            <form className="space-y-4" onSubmit={handleSignIn}>
                {(error || lockoutSeconds > 0) && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 shadow-sm dark:border-red-400/20 dark:bg-red-500/20 dark:text-red-300">
                        {lockoutSeconds > 0 ? `Too many login attempts. Try again in ${lockoutSeconds} seconds.` : error}
                    </div>
                )}
                {!error && blockedFromRedirect && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 shadow-sm dark:border-red-400/20 dark:bg-red-500/20 dark:text-red-300">
                        Your account has been banned. Please contact support for assistance.
                    </div>
                )}
                {!showTotpField && (
                    <>
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
                    </>
                )}

                {showTotpField && (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between mb-1">
                            <label htmlFor="login-totp" className="block text-xs font-semibold text-gray-600 dark:text-white/80">
                                Authenticator Code
                            </label>
                            <button
                                type="button"
                                onClick={() => { setShowTotpField(false); setTotpLoginCode(''); resetTurnstile(); }}
                                className="text-[11px] font-medium text-gray-400 dark:text-white/50 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                            >
                                ← Back to sign in
                            </button>
                        </div>
                        <input
                            id="login-totp"
                            type="text"
                            inputMode="numeric"
                            value={totpLoginCode}
                            onChange={(e) => setTotpLoginCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="6-digit code"
                            maxLength={6}
                            autoComplete="one-time-code"
                            autoFocus
                            className="h-11 w-full rounded-[18px] border border-gray-300 dark:border-white/18 bg-white dark:bg-white/12 px-4 text-sm text-gray-900 dark:text-white outline-none transition-all duration-200 focus:border-sky-400 dark:focus:border-sky-400/60 focus:bg-white dark:focus:bg-white/18 font-mono tracking-widest text-center"
                        />
                        <p className="text-[11px] text-gray-400 dark:text-white/55">Enter the 6-digit code from your authenticator app.</p>
                    </div>
                )}

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

                {!showTotpField && (
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
                )}

                {isMounted && turnstileSiteKey && !mfaChallengeToken && (
                    <div className="flex justify-center">
                        <div ref={turnstileRef} />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || isPasskeyLoading || isGoogleLoading || lockoutSeconds > 0 || (isMounted && !!turnstileSiteKey && !turnstileToken && !mfaChallengeToken)}
                    className="w-full h-11 flex items-center justify-center gap-3 rounded-[14px] bg-sky-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Signing in...</span>
                        </>
                    ) : (
                        <span>{lockoutSeconds > 0 ? `Try again in ${lockoutSeconds}s` : mfaChallengeToken ? 'Continue Sign in' : showTotpField ? 'Verify & Sign in' : 'Sign in'}</span>
                    )}
                </button>

                {/* Social Login Options */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or continue with</span>
                    </div>
                </div>

                <div className="flex items-stretch justify-center gap-3">
                    {/* Google */}
                    <button
                        type="button"
                        onClick={() => {
                            if (isMounted && !!turnstileSiteKey && !turnstileToken && !mfaChallengeToken) {
                                setError('Please complete the verification checkbox to sign in with Google.')
                                return
                            }
                            handleGoogleSignIn()
                        }}
                        disabled={isLoading || isPasskeyLoading || isGoogleLoading}
                        className="flex-1 flex flex-row items-center justify-center gap-2 py-3 rounded-[14px] border border-slate-200 bg-white transition-colors hover:bg-slate-50 disabled:opacity-60 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                        {isGoogleLoading ? (
                            <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                        )}
                        <span className="text-xs font-medium text-slate-600 dark:text-gray-300">Google</span>
                    </button>

                    {/* Authenticator App (TOTP) — temporarily disabled */}
                    {/* <button
                        type="button"
                        onClick={() => {
                            setShowTotpField((v) => !v)
                            setTotpLoginCode('')
                        }}
                        disabled={isLoading || isPasskeyLoading || isGoogleLoading}
                        className={`flex-1 flex flex-row items-center justify-center gap-2 py-3 rounded-[14px] border transition-colors disabled:opacity-60 ${showTotpField ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-700' : 'border-slate-200 bg-white hover:bg-slate-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'}`}
                    >
                        <svg className={`h-5 w-5 ${showTotpField ? 'text-sky-500' : 'text-slate-500 dark:text-gray-300'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="5" y="2" width="14" height="20" rx="2" />
                            <path d="M12 18h.01" />
                            <path d="M9 7h6M9 11h4" />
                        </svg>
                        <span className={`text-xs font-medium ${showTotpField ? 'text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-gray-300'}`}>Authenticator</span>
                    </button> */}

                    {/* QR Code */}
                    <button
                        type="button"
                        onClick={() => setIsQrModalOpen(true)}
                        disabled={isLoading || isPasskeyLoading || isGoogleLoading}
                        className="flex-1 flex flex-row items-center justify-center gap-2 py-3 rounded-[14px] border border-slate-200 bg-white transition-colors hover:bg-slate-50 disabled:opacity-60 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                        <svg className="h-5 w-5 text-slate-600 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="4" height="4"></rect>
                        </svg>
                        <span className="text-xs font-medium text-slate-600 dark:text-gray-300">QR Code</span>
                    </button>

                    {/* Passkey */}
                    {isMounted && (
                        <button
                            type="button"
                            onClick={() => {
                                if (lockoutSeconds > 0) {
                                    setError(`Too many login attempts. Try again in ${lockoutSeconds} seconds.`)
                                    return
                                }
                                if (isMounted && !!turnstileSiteKey && !turnstileToken && !mfaChallengeToken) {
                                    setError('Please complete the verification checkbox to sign in with Passkey.')
                                    return
                                }
                                handlePasskeySignIn()
                            }}
                            disabled={isLoading || isPasskeyLoading || isGoogleLoading || lockoutSeconds > 0}
                            className="flex-1 flex flex-row items-center justify-center gap-2 py-3 rounded-[14px] border border-slate-200 bg-white transition-colors hover:bg-slate-50 disabled:opacity-60 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                        >
                            {isPasskeyLoading ? (
                                <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="h-5 w-5 text-slate-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            )}
                            <span className="text-xs font-medium text-slate-600 dark:text-gray-300">Passkey</span>
                        </button>
                    )}
                </div>
                {isMounted && !passkeySupported && (
                    <p className="text-[11px] text-center text-slate-500 dark:text-gray-400">Passkeys are not supported in this browser.</p>
                )}
            </form>

            <QrModal
              isOpen={isQrModalOpen}
              onClose={() => setIsQrModalOpen(false)}
              defaultCallbackPath={defaultCallbackPath}
              accountLabel={accountLabel}
              preGeneratedSessionId={preGeneratedQr?.sessionId}
              preGeneratedQrData={preGeneratedQr?.qrData}
            />
        </motion.div>
    )
}

export default LoginForm
