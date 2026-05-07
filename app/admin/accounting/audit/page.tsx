import { buildPageMetadata } from '@/app/seo';

export const metadata = buildPageMetadata({ title: 'Admin Accounting Audit', description: 'Browse the Admin Accounting Audit page on AF Home.', path: '/admin/accounting/audit', noIndex: true });

import AuditTrailMain from '@/components/superAdmin/accounting/AuditTrailMain'

export default function AccountingAuditTrailPage() {
  return <AuditTrailMain />
}