import { buildPageMetadata } from '@/app/seo'
import SupplierOrderReportsPage from '@/components/supplier/SupplierOrderReportsPage'

export const metadata = buildPageMetadata({
  title: 'Order Report',
  description: 'Review supplier order reports on AF Home.',
  path: '/supplier/reports/orders',
  noIndex: true,
})

export default function SupplierOrderReportPage() {
  return <SupplierOrderReportsPage title="Order Report" filter="all" />
}
