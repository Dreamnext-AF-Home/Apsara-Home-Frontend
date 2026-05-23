import { buildPageMetadata } from '@/app/seo'
import SupplierInventoryPage from '@/components/supplier/SupplierInventoryPage'

export const metadata = buildPageMetadata({
  title: 'Supplier Inventory',
  description: 'Live ZQ warehouse inventory for Global Supplier products.',
  path: '/supplier/inventory',
  noIndex: true,
})

export const dynamic = 'force-dynamic'

export default function Page() {
  return <SupplierInventoryPage />
}
