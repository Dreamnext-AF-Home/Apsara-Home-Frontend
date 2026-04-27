import { buildPageMetadata } from '@/app/seo';
import LoginPageClient from "@/components/auth/LoginPageClient";

export const metadata = buildPageMetadata({ title: 'Login', description: 'Browse the Login page on AF Home.', path: '/login' });

export default function LoginPage() {
  const turnstileSiteKey = process.env.USER_LOGIN_CLOUDFLARE_SITE_KEY ?? '';
  const signupTurnstileSiteKey = process.env.USER_SIGNUP_CLOUDFLARE_SITE_KEY ?? '';
  return <LoginPageClient turnstileSiteKey={turnstileSiteKey} signupTurnstileSiteKey={signupTurnstileSiteKey} />;
}