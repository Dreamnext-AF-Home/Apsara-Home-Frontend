import { buildPageMetadata } from '@/app/seo';

export const metadata = buildPageMetadata({ title: 'Admin Accounting Settings', description: 'Browse the Admin Accounting Settings page on AF Home.', path: '/admin/accounting/settings', noIndex: true });

import AccountingSettingsMain from '@/components/superAdmin/accounting/AccountingSettingsMain'

export default function AccountingSettingsPage() {
  return <AccountingSettingsMain />
}