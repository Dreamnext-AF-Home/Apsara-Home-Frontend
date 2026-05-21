import { buildPageMetadata } from '@/app/seo'
import AdminTermsConditionSettingsPageMain from '@/components/superAdmin/settings/AdminTermsConditionSettingsPageMain'

export const metadata = buildPageMetadata({
  title: 'Admin Settings Terms and Condition',
  description: 'Manage Terms and Condition settings in the AF Home admin panel.',
  path: '/admin/settings/terms-condition',
  noIndex: true,
})

export default function AdminSettingsTermsConditionPage() {
  return <AdminTermsConditionSettingsPageMain />
}
