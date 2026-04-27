import { buildPageMetadata } from '@/app/seo';

export const metadata = buildPageMetadata({ title: 'Admin Login', description: 'Browse the Admin Login page on AF Home.', path: '/admin/login', noIndex: true });

import AdminLoginForm from "@/components/admin/auth/AdminLoginForm"

export default function AdminLoginPage() {
  const turnstileSiteKey = process.env.ADMIN_LOGIN_CLOUDFLARE_SITE_KEY ?? '';
  return <AdminLoginForm turnstileSiteKey={turnstileSiteKey} />;
}