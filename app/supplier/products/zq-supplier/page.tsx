import { buildPageMetadata } from '@/app/seo'
import ZqSupplierProductsPageMain from '@/components/superAdmin/products/ZqSupplierProductsPageMain'

export const metadata = buildPageMetadata({
  title: 'Global Supplier Products',
  description: 'Browse cached AF HOME GLOBAL SUPPLIER products in the supplier panel.',
  path: '/supplier/products/zq-supplier',
  noIndex: true,
})

export const dynamic = 'force-dynamic'

export default function SupplierZqSupplierProductsPage() {
  return <ZqSupplierProductsPageMain scope="supplier" />
}
