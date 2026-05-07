import { buildPageMetadata } from '@/app/seo';

export const metadata = buildPageMetadata({ title: 'Admin Accounting Disbursement History', description: 'Browse the Admin Accounting Disbursement History page on AF Home.', path: '/admin/accounting/disbursement-history', noIndex: true });

import DisbursementHistoryMain from '@/components/superAdmin/accounting/DisbursementHistoryMain'

export default function AccountingDisbursementHistoryPage() {
  return <DisbursementHistoryMain />
}