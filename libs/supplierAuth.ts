import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

type TokenUser = {
  id?: string;
  accessToken?: string;
  role?: string;
  supplierId?: number | null;
  supplierName?: string | null;
  supplierLevelType?: number | null;
  isMainSupplier?: boolean;
};

const isProd = process.env.NODE_ENV === 'production';

export const supplierAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'supplier-credentials',
      name: 'Supplier Credentials',
      credentials: {
        login: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          return null;
        }

        try {
          const url = `${process.env.LARAVEL_API_URL}/api/supplier/auth/login`;
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
            return null;
          }

          const data = await res.json();
          if (!data.user || !data.token) return null;

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
          };
        } catch {
          return null;
        }
      }
    }),
  ],

  pages: {
    signIn: '/supplier/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  cookies: {
    sessionToken: {
      name: isProd ? '__Secure-supplier-next-auth.session-token' : 'supplier-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProd,
      },
    },
    csrfToken: {
      name: isProd ? '__Host-supplier-next-auth.csrf-token' : 'supplier-next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProd,
      },
    },
    callbackUrl: {
      name: isProd ? '__Secure-supplier-next-auth.callback-url' : 'supplier-next-auth.callback-url',
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
        token.supplierId = authUser.supplierId;
        token.supplierName = authUser.supplierName;
        token.supplierLevelType = authUser.supplierLevelType;
        token.isMainSupplier = authUser.isMainSupplier;
      }
      if (trigger === 'update' && session) {
        const nextSession = session as {
          role?: string;
          supplierId?: number | null;
        };
        if (typeof nextSession.role === 'string') {
          token.role = nextSession.role;
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
        sessionUser.supplierId = authToken.supplierId;
        sessionUser.supplierName = authToken.supplierName;
        sessionUser.supplierLevelType = authToken.supplierLevelType;
        sessionUser.isMainSupplier = authToken.isMainSupplier;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
