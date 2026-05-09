import { buildPageMetadata } from '@/app/seo'
import ProductsReviewsPageMain from '@/components/superAdmin/products/ProductsReviewsPageMain'
import { adminAuthOptions } from '@/libs/adminAuth'
import { normalizeProductsResponse, type ProductsResponse } from '@/store/api/productsApi'
import { getServerSession } from 'next-auth'

export const metadata = buildPageMetadata({
  title: 'Admin Products Reviews',
  description: 'Browse the Admin Products Reviews page on AF Home.',
  path: '/admin/products/reviews',
  noIndex: true,
})

export const dynamic = 'force-dynamic'

async function getInitialRatedProducts(): Promise<ProductsResponse | null> {
  const session = await getServerSession(adminAuthOptions)
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken

  if (!accessToken) return null

  const apiUrl = (process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').trim().replace(/\/+$/, '')
  if (!apiUrl) return null

  try {
    const res = await fetch(`${apiUrl}/api/admin/products?page=1&per_page=250&status=1`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!res.ok) return null
    return normalizeProductsResponse((await res.json()) as ProductsResponse)
  } catch (error) {
    console.error('Failed to fetch initial admin products reviews data:', error)
    return null
  }
}

export default async function AdminProductsReviewsPage() {
  const initialData = await getInitialRatedProducts()

  return <ProductsReviewsPageMain initialData={initialData} />
}
