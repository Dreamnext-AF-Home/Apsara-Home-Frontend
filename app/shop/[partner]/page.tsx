import { notFound } from 'next/navigation'
import { buildPageMetadata } from '@/app/seo'
import PartnerStorefrontPage from '@/components/partner/PartnerStorefrontPage'
import { filterPartnerCategories, filterPartnerProducts, getPartnerStorefrontConfig } from '@/libs/partnerStorefront'
import type { Category } from '@/store/api/categoriesApi'
import type { Product } from '@/store/api/productsApi'
import type { WebPageItem } from '@/store/api/webPagesApi'

type PageProps = {
  params: Promise<{
    partner: string
  }>
}

type ApiCategoriesResponse = {
  categories?: Category[]
}

type ApiProductsResponse = {
  products?: Product[]
}

type ApiWebPagesResponse = {
  items?: WebPageItem[]
}

export async function generateMetadata({ params }: PageProps) {
  const resolved = await params
  return buildPageMetadata({
    title: `${resolved.partner} Shop`,
    description: `Browse the curated storefront for ${resolved.partner}.`,
    path: `/shop/${resolved.partner}`,
  })
}

async function getPartnerStorefrontData(partnerSlug: string) {
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL
  if (!apiUrl) return null

  try {
    const [storefrontsRes, webPagesRes, categoriesRes, productsRes] = await Promise.all([
      fetch(`${apiUrl}/api/web-pages/partner-storefronts`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${apiUrl}/api/web-pages/shop-builder`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${apiUrl}/api/categories?used_only=1`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${apiUrl}/api/products?page=1&per_page=100&status=1`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
    ])

    if (!storefrontsRes.ok || !webPagesRes.ok || !categoriesRes.ok || !productsRes.ok) return null

    const storefrontsJson = (await storefrontsRes.json()) as ApiWebPagesResponse
    const webPagesJson = (await webPagesRes.json()) as ApiWebPagesResponse
    const categoriesJson = (await categoriesRes.json()) as ApiCategoriesResponse
    const productsJson = (await productsRes.json()) as ApiProductsResponse

    const storefrontItem = (storefrontsJson.items ?? []).find((item) => {
      const config = getPartnerStorefrontConfig(item)
      return config?.slug === partnerSlug
    })
    const partner = getPartnerStorefrontConfig(storefrontItem)
    if (!partner) return null

    const categories = filterPartnerCategories(categoriesJson.categories ?? [], partner)
    const products = filterPartnerProducts(productsJson.products ?? [], partner)

    return {
      partner,
      data: {
        items: webPagesJson.items ?? [],
        categories,
        products,
      },
    }
  } catch {
    return null
  }
}

export default async function PartnerShopPage({ params }: PageProps) {
  const resolved = await params
  const payload = await getPartnerStorefrontData(resolved.partner)

  if (!payload) {
    notFound()
  }

  return <PartnerStorefrontPage partner={payload.partner} data={payload.data} />
}
