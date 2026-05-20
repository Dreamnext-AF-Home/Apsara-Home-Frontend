import { buildPageMetadata } from '@/app/seo'
import ZqProductPreviewClient from '@/components/superAdmin/products/ZqProductPreviewClient'

export const metadata = buildPageMetadata({
  title: 'Global Supplier Product Preview',
  description: 'Preview an AF HOME GLOBAL SUPPLIER product inside the admin panel.',
  path: '/admin/products/zq-preview',
  noIndex: true,
})

export const dynamic = 'force-dynamic'

export default async function AdminZqProductPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <ZqProductPreviewClient
      id={id}
      backHref="/admin/products"
      scopeLabel="Admin Global Product Preview"
    />
  )
}
