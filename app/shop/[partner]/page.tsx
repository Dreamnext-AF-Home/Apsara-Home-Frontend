import { notFound, redirect } from 'next/navigation'
import PartnerStorefrontPage from '@/components/partner/PartnerStorefrontPage'
import { filterPartnerCategories, filterPartnerProducts } from '@/libs/partnerStorefront'
import { getPartnerStorefrontBySlug } from '@/libs/partnerStorefrontServer'
import type { Category } from '@/store/api/categoriesApi'
import type { Product } from '@/store/api/productsApi'
import type { WebPageItem } from '@/store/api/webPagesApi'
import type { Metadata } from 'next'
export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{
    partner: string
  }>
  searchParams?: Promise<{
    category?: string
    preview?: string
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
const BLANK_FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"

export async function generateMetadata({ params }: PageProps) {
  const resolved = await params
  const RAW_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://afhome.ph'
  const SITE_URL = RAW_SITE_URL.startsWith('http') ? RAW_SITE_URL : `https://${RAW_SITE_URL}`
  const partnerName = resolved.partner
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
  const title = partnerName.toLowerCase().endsWith('shop') ? partnerName : `${partnerName} Shop`
  const description = `Browse the curated storefront for ${resolved.partner}.`
  const path = `/shop/${resolved.partner}`
  const canonicalUrl = `${SITE_URL}${path}`
  const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'AF Home',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }

  const partnerConfig = await getPartnerStorefrontBySlug(resolved.partner)
  const iconUrl = partnerConfig?.tabLogoUrl || partnerConfig?.logoUrl

  metadata.icons = iconUrl
    ? {
      icon: [{ url: iconUrl, type: 'image/png' }],
      apple: iconUrl,
    }
    : {
      icon: [{ url: BLANK_FAVICON, type: 'image/svg+xml' }],
      apple: BLANK_FAVICON,
    }

  return metadata
}

async function getPartnerStorefrontData(partnerSlug: string, selectedCategoryId?: number, fresh = false) {
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL
  if (!apiUrl) return null

  try {
    const partner = await getPartnerStorefrontBySlug(partnerSlug, { fresh })
    if (!partner) return null

    const [webPagesRes, categoriesRes, productsRes] = await Promise.allSettled([
      fetch(`${apiUrl}/api/web-pages/shop-builder`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${apiUrl}/api/categories?per_page=300`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${apiUrl}/api/products?page=1&per_page=200&status=1`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
    ])

    if (selectedCategoryId && !partner.allowedCategoryIds.includes(selectedCategoryId)) {
      redirect(`/shop/${partner.slug}`)
    }

    const webPagesJson =
      webPagesRes.status === 'fulfilled' && webPagesRes.value.ok
        ? ((await webPagesRes.value.json()) as ApiWebPagesResponse)
        : { items: [] }
    const categoriesJson =
      categoriesRes.status === 'fulfilled' && categoriesRes.value.ok
        ? ((await categoriesRes.value.json()) as ApiCategoriesResponse)
        : { categories: [] }
    const productsJson =
      productsRes.status === 'fulfilled' && productsRes.value.ok
        ? ((await productsRes.value.json()) as ApiProductsResponse)
        : { products: [] }

    if (partner.allowedCategoryIds.length === 0) {
      const itemsWithoutCategoryGrid = (webPagesJson.items ?? []).filter(
        (item) => String(item.key ?? '').trim() !== 'category-grid',
      )
      return {
        partner,
        data: {
          items: itemsWithoutCategoryGrid,
          categories: [],
          products: [],
        },
      }
    }

    const categories = filterPartnerCategories(categoriesJson.categories ?? [], partner)
    const baseProducts = filterPartnerProducts(productsJson.products ?? [], partner)
    const baseProductIds = new Set(baseProducts.map((product) => product.id))

    // Ensure selected partner products always appear even if they are not in the first page batch.
    const missingFeaturedIds = partner.featuredProductIds.filter((id) => !baseProductIds.has(id))
    let missingFeaturedProducts: Product[] = []

    if (missingFeaturedIds.length > 0) {
      const featuredFetchResults = await Promise.all(
        missingFeaturedIds.map(async (id) => {
          try {
            const response = await fetch(`${apiUrl}/api/products/${id}`, {
              method: 'GET',
              headers: { Accept: 'application/json' },
              cache: 'no-store',
            })
            if (!response.ok) return null
            const json = (await response.json()) as { product?: Product }
            return json.product ?? null
          } catch {
            return null
          }
        }),
      )

      missingFeaturedProducts = featuredFetchResults
        .filter((product): product is Product => Boolean(product))
        .filter((product) => partner.allowedCategoryIds.includes(product.catid))
    }

    const products = [...baseProducts, ...missingFeaturedProducts]
    const selectedProducts = selectedCategoryId
      ? products.filter((product) => product.catid === selectedCategoryId)
      : products

    return {
      partner,
      data: {
        items: webPagesJson.items ?? [],
        categories,
        products: selectedProducts,
      },
    }
  } catch {
    return null
  }
}

export default async function PartnerShopPage({ params, searchParams }: PageProps) {
  const resolved = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const selectedCategoryId = Number.parseInt(String(resolvedSearchParams?.category ?? ''), 10)
  const payload = await getPartnerStorefrontData(
    resolved.partner,
    Number.isFinite(selectedCategoryId) && selectedCategoryId > 0 ? selectedCategoryId : undefined,
    Boolean(resolvedSearchParams?.preview),
  )

  if (!payload) {
    notFound()
  }

  return <PartnerStorefrontPage partner={payload.partner} data={payload.data} />
}
