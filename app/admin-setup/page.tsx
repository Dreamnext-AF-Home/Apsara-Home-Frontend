import { buildPageMetadata } from '@/app/seo'
import AdminInviteSetupForm from '@/components/admin/auth/AdminInviteSetupForm'

export const metadata = buildPageMetadata({
  title: 'Admin Account Setup',
  description: 'Verify your admin invite and set your password.',
  path: '/admin-setup',
  noIndex: true,
})

export default async function AdminSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const token = (params?.token ?? '').trim()

  return <AdminInviteSetupForm token={token} />
}
