import { buildPageMetadata } from '@/app/seo'
import AdminLoginForm from '@/components/admin/auth/AdminLoginForm'

export const metadata = buildPageMetadata({
  title: 'Partner Login',
  description: 'Sign in to manage your partner storefront.',
  path: '/partner/login',
  noIndex: true,
})

export default function PartnerLoginPage() {
  const turnstileSiteKey = process.env.ADMIN_LOGIN_CLOUDFLARE_SITE_KEY ?? ''
  return <AdminLoginForm turnstileSiteKey={turnstileSiteKey} />
}
