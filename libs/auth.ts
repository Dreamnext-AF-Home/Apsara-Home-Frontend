
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

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.log('[Auth] Missing credentials')
                    return null
                }

                try {
                    const url = `${process.env.LARAVEL_API_URL}/api/auth/login`
                    console.log('[Auth] Calling:', url, 'email:', credentials.email)

                    const res = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    })

                    console.log('[Auth] Laravel response status:', res.status)

                    const data = await res.json().catch(() => null)

                    if (!res.ok) {
                        const message =
                            data?.message ||
                            data?.errors?.email?.[0] ||
                            data?.errors?.login?.[0] ||
                            'Invalid email or password. Please try again.'
                        console.log('[Auth] Laravel error body:', data)
                        throw new Error(message)
                    }

                    console.log('[Auth] Laravel data keys:', Object.keys(data))

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
                    console.log('[Auth] Fetch error:', e)
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
                    const url = `${process.env.LARAVEL_API_URL}/api/supplier/auth/login`
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
