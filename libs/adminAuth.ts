import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

type TokenUser = {
  id?: string;
  accessToken?: string;
  role?: string;
  userLevelId?: number;
  adminPermissions?: string[];
  storefrontIds?: number[];
  supplierId?: number | null;
  image?: string | null;
  picture?: string | null;
  isBanned?: boolean;
  sessionTimeoutMinutes?: number;
};

const isProd = process.env.NODE_ENV === 'production';

export const adminAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'Admin Credentials',
      credentials: {
        login: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        otp: { label: 'OTP', type: 'text' },
        otp_challenge_token: { label: 'OTP Challenge Token', type: 'text' },
        resend_otp: { label: 'Resend OTP', type: 'text' },
        cf_turnstile_response: { label: 'Turnstile Response', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          return null;
        }

        try {
          const isResendOtp = credentials.resend_otp === '1';
          const url = isResendOtp
            ? `${process.env.LARAVEL_API_URL}/api/admin/auth/login/2fa/resend`
            : `${process.env.LARAVEL_API_URL}/api/admin/auth/login`;
          const body = isResendOtp
            ? {
                otp_challenge_token: credentials.otp_challenge_token,
              }
            : {
                login: credentials.login,
                password: credentials.password,
                otp: credentials.otp?.trim() || undefined,
                otp_challenge_token: credentials.otp_challenge_token || undefined,
                cf_turnstile_response: credentials.cf_turnstile_response || undefined,
              };
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(body),
          });
          const data = await res.json();
          if (data?.requires_otp) {
            const token = String(data.otp_challenge_token ?? '');
            const message = String(data.message ?? 'OTP required');
            throw new Error(`2FA_REQUIRED|${token}|${message}`);
          }

          if (!res.ok) {
            const errBody = data as { message?: string; errors?: Record<string, string[]> };
            const firstValidation = errBody.errors ? Object.values(errBody.errors)[0]?.[0] : undefined;
            const message = firstValidation || errBody.message || '';
            if (message) throw new Error(message);
            return null;
          }

          if (isResendOtp) {
            return null;
          }

          if (!data.user || !data.token) return null;

          return {
            id: String(data.user.id),
            name: data.user.name ?? data.user.email,
            email: data.user.email,
            accessToken: data.token,
            role: data.user.role,
            userLevelId: data.user.user_level_id,
            adminPermissions: data.user.admin_permissions ?? [],
            storefrontIds: Array.isArray(data.user.storefront_ids) ? data.user.storefront_ids : [],
            supplierId: data.user.supplier_id ?? null,
            image: data.user.avatar_url ?? null,
            isBanned: data.user.is_banned ?? false,
            sessionTimeoutMinutes: Number(data.user.session_timeout_minutes ?? 60),
          };
        } catch (error) {
          if (error instanceof Error && error.message) {
            throw error;
          }
          return null;
        }
      }
    }),
  ],

  pages: {
    signIn: '/admin/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  cookies: {
    sessionToken: {
      name: isProd ? '__Secure-admin-next-auth.session-token' : 'admin-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProd,
      },
    },
    csrfToken: {
      name: isProd ? '__Host-admin-next-auth.csrf-token' : 'admin-next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProd,
      },
    },
    callbackUrl: {
      name: isProd ? '__Secure-admin-next-auth.callback-url' : 'admin-next-auth.callback-url',
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
        token.storefrontIds = authUser.storefrontIds;
        token.supplierId = authUser.supplierId;
        token.picture = authUser.image ?? null;
        token.isBanned = authUser.isBanned ?? false;
        token.sessionTimeoutMinutes = authUser.sessionTimeoutMinutes;
        if (typeof authUser.sessionTimeoutMinutes === 'number' && Number.isFinite(authUser.sessionTimeoutMinutes)) {
          token.exp = Math.floor(Date.now() / 1000) + (Math.max(5, authUser.sessionTimeoutMinutes) * 60);
        }
      }
      if (trigger === 'update' && session) {
        const nextSession = session as {
          role?: string;
          userLevelId?: number;
          adminPermissions?: string[];
          storefrontIds?: number[];
          supplierId?: number | null;
          image?: string | null;
        };
        if (typeof nextSession.role === 'string') {
          token.role = nextSession.role;
        }
        if (typeof nextSession.userLevelId === 'number') {
          token.userLevelId = nextSession.userLevelId;
        }
        if (Array.isArray(nextSession.adminPermissions)) {
          token.adminPermissions = nextSession.adminPermissions;
        }
        if (Array.isArray(nextSession.storefrontIds)) {
          token.storefrontIds = nextSession.storefrontIds;
        }
        if (typeof nextSession.supplierId !== 'undefined') {
          token.supplierId = nextSession.supplierId;
        }
        if (typeof nextSession.image !== 'undefined') {
          token.picture = nextSession.image;
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
        sessionUser.storefrontIds = authToken.storefrontIds;
        sessionUser.supplierId = authToken.supplierId;
        sessionUser.image = typeof authToken.picture === 'string' ? authToken.picture : null;
        sessionUser.isBanned = typeof authToken.isBanned === 'boolean' ? authToken.isBanned : false;
        sessionUser.sessionTimeoutMinutes = authToken.sessionTimeoutMinutes;
      }
      return session;
    }
  },

  secret: process.env.NEXTAUTH_SECRET,
};
