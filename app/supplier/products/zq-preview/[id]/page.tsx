import { buildPageMetadata } from '@/app/seo'
import ZqProductPreviewClient from '@/components/superAdmin/products/ZqProductPreviewClient'

export const metadata = buildPageMetadata({
  title: 'Global Supplier Product Preview',
  description: 'Preview an AF HOME GLOBAL SUPPLIER product inside the supplier portal.',
  path: '/supplier/products/zq-preview',
  noIndex: true,
})

export const dynamic = 'force-dynamic'

export default async function SupplierZqProductPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <ZqProductPreviewClient
      id={id}
      backHref="/supplier/products"
      scopeLabel="Supplier Global Product Preview"
    />
  )
}
