import { notFound } from 'next/navigation'
import Footer from '@/components/landing-page/Footer'
import ScrollToTop from '@/components/landing-page/ScrollToTop'
import GlobalProductDetail from '@/components/globalProduct/GlobalProductDetail'
import ProductPageWrapper from '@/components/product/ProductPageWrapper'
import { getNavbarCategories } from '@/libs/serverStorefront'
import type { ZqPublicProductResponse, ZqCachedProduct } from '@/store/api/productsApi'

export const revalidate = 60

async function getGlobalProduct(id: string, preview = false) {
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL
  if (!apiUrl) return null

  const productUrl = new URL(`${apiUrl.replace(/\/$/, '')}/api/products/zq/cached/${encodeURIComponent(id)}`)
  if (preview) {
    productUrl.searchParams.set('preview', '1')
  }

  const response = await fetch(productUrl.toString(), {
    next: { revalidate },
  })

  if (!response.ok) return null
  const payload = (await response.json()) as ZqPublicProductResponse
  return payload.product
}

async function getRelatedGlobalProducts(currentId: number): Promise<ZqCachedProduct[]> {
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL
  if (!apiUrl) return []

  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/products/zq/cached?per_page=12&page=1`, {
    next: { revalidate: 300 },
  })

  if (!response.ok) return []
  const payload = (await response.json()) as { products?: ZqCachedProduct[] }
  return (payload.products ?? []).filter((p) => p.id !== currentId).slice(0, 4)
}

export default async function GlobalProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ preview?: string }>
}) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const preview = resolvedSearchParams.preview === '1'
  const [product, navbarCategories] = await Promise.all([
    getGlobalProduct(id, preview),
    getNavbarCategories(),
  ])

  if (!product) notFound()

  const relatedProducts = await getRelatedGlobalProducts(product.id)

  return (
    <ProductPageWrapper initialCategories={navbarCategories}>
      <main className="flex-1 bg-white dark:bg-gray-900">
        <GlobalProductDetail product={product} relatedProducts={relatedProducts} />
      </main>
      <Footer />
      <ScrollToTop />
    </ProductPageWrapper>
  )
}
