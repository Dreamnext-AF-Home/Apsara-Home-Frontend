import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

type TokenUser = {
  id?: string;
  accessToken?: string;
  role?: string;
  userLevelId?: number;
  adminPermissions?: string[];
  supplierId?: number | null;
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
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          return null;
        }

        try {
          const url = `${process.env.LARAVEL_API_URL}/api/admin/auth/login`;
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
          });

          if (!res.ok) {
            const errBody = await res.text();
            console.log('[AdminAuth] Laravel error body:', errBody);
            return null;
          }

          const data = await res.json();
          if (!data.user || !data.token) return null;

          return {
            id: String(data.user.id),
            name: data.user.name ?? data.user.email,
            email: data.user.email,
            accessToken: data.token,
            role: data.user.role,
            userLevelId: data.user.user_level_id,
            adminPermissions: data.user.admin_permissions ?? [],
            supplierId: data.user.supplier_id ?? null,
          };
        } catch {
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
        token.supplierId = authUser.supplierId;
      }
      if (trigger === 'update' && session) {
        const nextSession = session as {
          role?: string;
          userLevelId?: number;
          adminPermissions?: string[];
          supplierId?: number | null;
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
      }
      return session;
    }
  },

  secret: process.env.NEXTAUTH_SECRET,
};
