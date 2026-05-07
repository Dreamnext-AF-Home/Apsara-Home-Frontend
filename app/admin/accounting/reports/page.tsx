import { buildPageMetadata } from '@/app/seo';

export const metadata = buildPageMetadata({ title: 'Admin Accounting Reports', description: 'Browse the Admin Accounting Reports page on AF Home.', path: '/admin/accounting/reports', noIndex: true });

import ReportsMain from '@/components/superAdmin/accounting/ReportsMain'

export default function AccountingReportsPage() {
  return <ReportsMain />
}