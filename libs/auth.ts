
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

type TokenUser = {
    id?: string;
    accessToken?: string;
    role?: string;
    userLevelId?: number;
    adminPermissions?: string[];
    supplierId?: number | null;
    supplierName?: string | null;
    supplierLevelType?: number | null;
    isMainSupplier?: boolean;
    passwordChangeRequired?: boolean;
};

const isProd = process.env.NODE_ENV === 'production';
const apiBaseUrl = (process.env.LARAVEL_API_URL || process.env.NEXT_PUBLIC_LARAVEL_API_URL || '').trim()

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: 'qr',
            name: 'QR Code',
            credentials: {
                sessionId: { label: 'Session ID', type: 'text' },
            },
            async authorize(credentials, req) {
                const sessionId = credentials?.sessionId;
                if (!sessionId) {
                    return null;
                }

                try {
                    if (!apiBaseUrl) {
                        throw new Error('Authentication service is not configured (LARAVEL_API_URL).')
                    }

                    const incomingHeaders = req?.headers ?? {}
                    const forwardedFor = String(
                        incomingHeaders['x-forwarded-for']
                        ?? incomingHeaders['x-real-ip']
                        ?? ''
                    ).trim()
                    const userAgent = String(incomingHeaders['user-agent'] ?? '').trim()
                    const cfIpCountry = String(incomingHeaders['cf-ipcountry'] ?? '').trim()

                    const res = await fetch(`${apiBaseUrl}/api/auth/qr/complete`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            ...(forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {}),
                            ...(userAgent ? { 'User-Agent': userAgent } : {}),
                            ...(cfIpCountry ? { 'CF-IPCountry': cfIpCountry } : {}),
                        },
                        body: JSON.stringify({
                            session_id: sessionId,
                        }),
                    })

                    const data = await res.json().catch(() => null)

                    if (!res.ok) {
                        const message = data?.message || 'QR login failed. Please try again.'
                        throw new Error(message)
                    }

                    if (!data.user || !data.token) return null

                    return {
                        id: String(data.user.id),
                        name: data.user.name,
                        email: data.user.email,
                        accessToken: data.token,
                        role: 'customer',
                        passwordChangeRequired: Boolean(data.user.password_change_required),
                    }
                } catch (e) {
                    throw e instanceof Error ? e : new Error('QR authentication failed.')
                }
            }
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
                otp: { label: 'OTP', type: 'text' },
                otp_challenge_token: { label: 'OTP Challenge Token', type: 'text' },
                resend_otp: { label: 'Resend OTP', type: 'text' },
                mfa_challenge_token: { label: 'MFA Challenge Token', type: 'text' },
                resend_mfa_approval: { label: 'Resend MFA Approval', type: 'text' },
                passkey_challenge_token: { label: 'Passkey Challenge Token', type: 'text' },
                passkey_assertion: { label: 'Passkey Assertion', type: 'text' },
                cf_turnstile_response: { label: 'Turnstile Response', type: 'text' },
                google_access_token: { label: 'Google Access Token', type: 'text' },
                facebook_access_token: { label: 'Facebook Access Token', type: 'text' },
                facebook_provider_id: { label: 'Facebook Provider ID', type: 'text' },
            },
            async authorize(credentials, req) {
                const hasEmail = Boolean(credentials?.email)
                const hasPassword = Boolean(credentials?.password)
                const hasPasskeyFlow = Boolean(credentials?.passkey_challenge_token && credentials?.passkey_assertion)
                const hasGoogleToken = Boolean(credentials?.google_access_token)
                const hasFacebookToken = Boolean(credentials?.facebook_access_token)
                if (!hasGoogleToken && !hasFacebookToken && (!hasEmail || (!hasPassword && !hasPasskeyFlow))) {
                    return null
                }
                const safeCredentials = credentials!

                try {
                    if (!apiBaseUrl) {
                        throw new Error('Authentication service is not configured (LARAVEL_API_URL).')
                    }
                    const isResendOtp = safeCredentials.resend_otp === '1'
                    const isResendMfaApproval = safeCredentials.resend_mfa_approval === '1'
                    const isPasskey = !isResendOtp && !isResendMfaApproval && hasPasskeyFlow
                    const isGoogleOAuth = !isResendOtp && !isResendMfaApproval && !hasPasskeyFlow && hasGoogleToken
                    const isFacebookOAuth = !isResendOtp && !isResendMfaApproval && !hasPasskeyFlow && !hasGoogleToken && hasFacebookToken
                    const url = isResendOtp
                        ? `${apiBaseUrl}/api/auth/login/2fa/resend`
                        : isResendMfaApproval
                          ? `${apiBaseUrl}/api/auth/login/mfa/resend`
                        : isPasskey
                          ? `${apiBaseUrl}/api/auth/passkeys/login/verify`
                        : isGoogleOAuth
                          ? `${apiBaseUrl}/api/auth/callback/google`
                        : isFacebookOAuth
                          ? `${apiBaseUrl}/api/auth/callback/facebook`
                        : `${apiBaseUrl}/api/auth/login`

                    const incomingHeaders = req?.headers ?? {}
                    const forwardedFor = String(
                        incomingHeaders['x-forwarded-for']
                        ?? incomingHeaders['x-real-ip']
                        ?? ''
                    ).trim()
                    const userAgent = String(incomingHeaders['user-agent'] ?? '').trim()
                    const cfIpCountry = String(incomingHeaders['cf-ipcountry'] ?? '').trim()
                    const secChUaPlatform = String(incomingHeaders['sec-ch-ua-platform'] ?? '').trim().replace(/^"|"$/g, '')
                    const secChUa = String(incomingHeaders['sec-ch-ua'] ?? '').trim()

                    const res = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            ...(forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {}),
                            ...(userAgent ? { 'User-Agent': userAgent } : {}),
                            ...(cfIpCountry ? { 'CF-IPCountry': cfIpCountry } : {}),
                            ...(secChUaPlatform ? { 'X-App-Platform': secChUaPlatform } : {}),
                            ...(secChUa ? { 'X-App-Sec-Ch-Ua': secChUa } : {}),
                        },
                        body: JSON.stringify(
                            isResendOtp
                                ? {
                                    otp_challenge_token: safeCredentials.otp_challenge_token,
                                }
                                : isResendMfaApproval
                                  ? {
                                      mfa_challenge_token: safeCredentials.mfa_challenge_token,
                                  }
                                : isPasskey
                                  ? {
                                      identifier: safeCredentials.email,
                                      challenge_token: safeCredentials.passkey_challenge_token,
                                      credential: (() => {
                                          try {
                                              return JSON.parse(String(safeCredentials.passkey_assertion || '{}'))
                                          } catch {
                                              return null
                                          }
                                      })(),
                                  }
                                : isGoogleOAuth
                                  ? {
                                      id_token: safeCredentials.google_access_token,
                                  }
                                : isFacebookOAuth
                                  ? {
                                      access_token: safeCredentials.facebook_access_token,
                                      provider_id: safeCredentials.facebook_provider_id,
                                  }
                                : {
                                    email: safeCredentials.email,
                                    password: safeCredentials.password,
                                    otp: safeCredentials.otp?.trim() || undefined,
                                    otp_challenge_token: safeCredentials.otp_challenge_token || undefined,
                                    mfa_challenge_token: safeCredentials.mfa_challenge_token || undefined,
                                    cf_turnstile_response: safeCredentials.cf_turnstile_response || undefined,
                                }
                        ),
                    })

                    const data = await res.json().catch(() => null)

                    if (data?.requires_otp) {
                        const token = String(data.otp_challenge_token ?? '')
                        const message = String(data.message ?? 'OTP required')
                        throw new Error(`2FA_REQUIRED|${token}|${message}`)
                    }
                    if (data?.requires_mfa_approval) {
                        const token = String(data.mfa_challenge_token ?? '')
                        const message = String(data.message ?? 'Login approval required')
                        throw new Error(`MFA_APPROVAL_REQUIRED|${token}|${message}`)
                    }

                    if (!res.ok) {
                        if (isGoogleOAuth) {
                            const googleErrorCode = String(data?.error ?? '')
                            const googleErrorMsg = String(data?.message ?? '').toLowerCase()
                            const isNotLinked =
                                googleErrorCode === 'social_account_not_found' ||
                                googleErrorCode === 'account_not_linked' ||
                                googleErrorCode === 'google_not_linked' ||
                                googleErrorMsg.includes('no google account') ||
                                googleErrorMsg.includes('not linked') ||
                                googleErrorMsg.includes('link your google') ||
                                googleErrorMsg.includes('not connected') ||
                                (res.status === 404 && googleErrorMsg.includes('google'))
                            if (isNotLinked) {
                                throw new Error('GOOGLE_NOT_LINKED')
                            }
                            throw new Error(
                                data?.message ||
                                'Google sign-in failed. Make sure your Google account is linked to your AF Home account.'
                            )
                        }
                        if (isFacebookOAuth) {
                            const fbErrorCode = String(data?.error ?? '')
                            const fbErrorMsg = String(data?.message ?? '').toLowerCase()
                            const isNotLinked =
                                fbErrorCode === 'social_account_not_found' ||
                                fbErrorCode === 'account_not_linked' ||
                                fbErrorMsg.includes('no facebook account') ||
                                fbErrorMsg.includes('not linked') ||
                                fbErrorMsg.includes('link your facebook') ||
                                fbErrorMsg.includes('not connected') ||
                                (res.status === 401 && fbErrorMsg.includes('facebook'))
                            if (isNotLinked) {
                                throw new Error('FACEBOOK_NOT_LINKED')
                            }
                            throw new Error(
                                data?.message ||
                                'Facebook sign-in failed. Make sure your Facebook account is linked to your AF Home account.'
                            )
                        }
                        const message =
                            data?.message ||
                            data?.errors?.email?.[0] ||
                            data?.errors?.identifier?.[0] ||
                            data?.errors?.credential?.[0] ||
                            data?.errors?.login?.[0] ||
                            'Invalid email or password. Please try again.'
                        throw new Error(message)
                    }

                    if (isResendOtp || isResendMfaApproval) {
                        return null
                    }

                    if (!data.user || !data.token) return null

                    return {
                        id: String(data.user.id),
                        name: data.user.name,
                        email: data.user.email,
                        accessToken: data.token,
                        role: 'customer',
                        passwordChangeRequired: Boolean(data.user.password_change_required),
                    }
                } catch (e) {
                    throw e instanceof Error ? e : new Error('Unable to sign in right now.')
                }
            }
        }),
        CredentialsProvider({
            id: 'supplier-credentials',
            name: 'Supplier Credentials',
            credentials: {
                login: { label: 'Email or Username', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.login || !credentials?.password) {
                    return null
                }

                try {
                    if (!apiBaseUrl) {
                        throw new Error('Authentication service is not configured (LARAVEL_API_URL).')
                    }
                    const url = `${apiBaseUrl}/api/supplier/auth/login`
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({
                            login: credentials.login,
                            password: credentials.password,
                        }),
                    })

                    if (!res.ok) {
                        const errBody = await res.text()
                        console.log('[SupplierAuth] Laravel error body:', errBody)
                        return null
                    }

                    const data = await res.json()
                    if (!data.user || !data.token) return null

                    return {
                        id: String(data.user.id),
                        name: data.user.name ?? data.user.username,
                        email: data.user.email,
                        accessToken: data.token,
                        role: data.user.role,
                        supplierId: data.user.supplier_id ?? null,
                        supplierName: data.user.supplier_name ?? null,
                        supplierLevelType: data.user.level_type ?? null,
                        isMainSupplier: Boolean(data.user.is_main_supplier),
                    }
                } catch {
                    return null
                }
            }
        }),
    ],

    pages: {
        signIn: '/login',
    },

    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
    },

    cookies: {
        sessionToken: {
            name: isProd ? '__Secure-member-next-auth.session-token' : 'member-next-auth.session-token',
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: isProd,
            },
        },
        csrfToken: {
            name: isProd ? '__Host-member-next-auth.csrf-token' : 'member-next-auth.csrf-token',
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: isProd,
            },
        },
        callbackUrl: {
            name: isProd ? '__Secure-member-next-auth.callback-url' : 'member-next-auth.callback-url',
            options: {
                sameSite: 'lax',
                path: '/',
                secure: isProd,
            },
        },
    },

    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                const authUser = user as TokenUser;
                token.id = authUser.id;
                token.accessToken = authUser.accessToken;
                token.role = authUser.role;
                token.userLevelId = authUser.userLevelId;
                token.adminPermissions = authUser.adminPermissions;
                token.supplierId = authUser.supplierId;
                token.supplierName = authUser.supplierName;
                token.supplierLevelType = authUser.supplierLevelType;
                token.isMainSupplier = authUser.isMainSupplier;
                token.passwordChangeRequired = authUser.passwordChangeRequired;
            }
            if (trigger === 'update' && session) {
                const nextSession = session as {
                    passwordChangeRequired?: boolean;
                    role?: string;
                    userLevelId?: number;
                    adminPermissions?: string[];
                    supplierId?: number | null;
                };
                if (typeof nextSession.passwordChangeRequired === 'boolean') {
                    token.passwordChangeRequired = nextSession.passwordChangeRequired;
                }
                if (typeof nextSession.role === 'string') {
                    token.role = nextSession.role;
                }
                if (typeof nextSession.userLevelId === 'number') {
                    token.userLevelId = nextSession.userLevelId;
                }
                if (Array.isArray(nextSession.adminPermissions)) {
                    token.adminPermissions = nextSession.adminPermissions;
                }
                if (typeof nextSession.supplierId !== 'undefined') {
                    token.supplierId = nextSession.supplierId;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                const sessionUser = session.user as TokenUser;
                const authToken = token as TokenUser;
                sessionUser.id = authToken.id;
                sessionUser.accessToken = authToken.accessToken;
                sessionUser.role = authToken.role;
                sessionUser.userLevelId = authToken.userLevelId;
                sessionUser.adminPermissions = authToken.adminPermissions;
                sessionUser.supplierId = authToken.supplierId;
                sessionUser.supplierName = authToken.supplierName;
                sessionUser.supplierLevelType = authToken.supplierLevelType;
                sessionUser.isMainSupplier = authToken.isMainSupplier;
                sessionUser.passwordChangeRequired = authToken.passwordChangeRequired;
            }
            return session
        }
    },

    secret: process.env.NEXTAUTH_SECRET
}
