import { buildPageMetadata } from '@/app/seo'
import SupplierOrderReportsPage from '@/components/supplier/SupplierOrderReportsPage'

export const metadata = buildPageMetadata({
  title: 'Delivered Order Report',
  description: 'Review delivered supplier orders on AF Home.',
  path: '/supplier/reports/delivered',
  noIndex: true,
})

export default function SupplierDeliveredOrderReportPage() {
  return <SupplierOrderReportsPage title="Delivered Order Report" filter="completed" />
}
