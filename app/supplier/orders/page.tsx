import { buildPageMetadata } from '@/app/seo'
import SupplierOrdersPage from '@/components/supplier/SupplierOrdersPage'

export const metadata = buildPageMetadata({
  title: 'Supplier Orders',
  description: 'Manage supplier orders on AF Home.',
  path: '/supplier/orders',
  noIndex: true,
})

export default function SupplierOrders() {
  return <SupplierOrdersPage />
}
