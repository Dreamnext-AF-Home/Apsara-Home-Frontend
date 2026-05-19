import { notFound } from 'next/navigation'
import CategoryListProductMain from '@/components/category/CategoryListProductMain'
import { buildPageMetadata } from '@/app/seo'
import { filterPartnerCategories, getPartnerStorefrontConfig } from '@/libs/partnerStorefront'
import { getPartnerStorefrontBySlug } from '@/libs/partnerStorefrontServer'
import type { CategoryProduct } from '@/libs/CategoryData'
import type { Category } from '@/store/api/categoriesApi'
import type { Product } from '@/store/api/productsApi'
import type { WebPageItem } from '@/store/api/webPagesApi'
export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{
    partner: string
  }>
}

type ApiCategoriesResponse = {
  categories?: Category[]
}

type ApiWebPagesResponse = {
  items?: WebPageItem[]
}
type ApiProductResponse = {
  product?: Product
}
type ApiProductsResponse = {
  products?: Product[]
}

const REQUEST_TIMEOUT_MS = 12000
const MAX_FETCH_RETRIES = 2
const MAX_FEATURED_PRODUCT_DETAIL_FETCHES = 12
const BLANK_FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"

async function fetchWithTimeout(input: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchWithRetry(input: string, init?: RequestInit): Promise<Response> {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= MAX_FETCH_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(input, init)
      if (response.ok || attempt === MAX_FETCH_RETRIES) {
        return response
      }
    } catch (error) {
      lastError = error
      if (attempt === MAX_FETCH_RETRIES) {
        throw error
      }
    }
  }

  throw (lastError instanceof Error ? lastError : new Error('Failed to fetch resource'))
}

const resolveImageUrl = (rawImage: string | null | undefined, apiUrl?: string) => {
  if (!rawImage) return '/Images/HeroSection/chairs_stools.jpg'
  if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) return rawImage
  if (rawImage.startsWith('/')) return rawImage
  if (!apiUrl) return `/${rawImage}`
  return `${apiUrl.replace(/\/$/, '')}/${rawImage.replace(/^\/+/, '')}`
}

const resolveStorefrontAssetUrl = (rawValue: string | null | undefined, apiUrl?: string) => {
  const value = String(rawValue ?? '').trim()
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) return value
  if (value.startsWith('/Images/')) return value
  if (!apiUrl) return value.startsWith('/') ? value : `/${value}`
  return `${apiUrl.replace(/\/$/, '')}/${value.replace(/^\/+/, '')}`
}

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      }
    } catch {
      return [value]
    }
    return [value]
  }

  return []
}

const mapProductToDisplay = (product: Product, apiUrl?: string): CategoryProduct => ({
  id: product.id,
  name: product.name,
  createdAt: product.createdAt ?? null,
  price: Number(product.priceSrp ?? 0),
  priceSrp: Number(product.priceSrp ?? 0) || undefined,
  priceDp: Number(product.priceDp ?? 0) || undefined,
  priceMember: Number(product.priceMember ?? 0) || undefined,
  prodpv: Number(product.prodpv ?? 0) || undefined,
  image: resolveImageUrl(product.image, apiUrl),
  images: toStringArray(product.images).map((item) => resolveImageUrl(item, apiUrl)),
  badge: product.salespromo ? 'SALE' : product.bestseller ? 'BEST SELLER' : product.musthave ? 'MUST HAVE' : undefined,
  verified: Boolean(product.verified),
  stock: Number(product.qty ?? 0),
  brand: product.brand ?? undefined,
  sku: product.sku ?? undefined,
  variants: product.variants ?? undefined,
  type: product.type,
  musthave: Boolean(product.musthave),
  bestseller: Boolean(product.bestseller),
  salespromo: Boolean(product.salespromo),
  manualCheckoutEnabled: Boolean(product.manualCheckoutEnabled),
  weight: Number(product.weight ?? 0) || undefined,
  psweight: Number(product.psweight ?? 0) || undefined,
  pswidth: Number(product.pswidth ?? 0) || undefined,
  pslenght: Number(product.pslenght ?? 0) || undefined,
  psheight: Number(product.psheight ?? 0) || undefined,
  material: product.material ?? undefined,
  assemblyRequired: Boolean(product.assemblyRequired),
  warranty: product.warranty ?? undefined,
})

export async function generateMetadata({ params }: PageProps) {
  const resolved = await params
  const plainTitle = `${resolved.partner} Products`
  const metadata = buildPageMetadata({
    title: `${resolved.partner} Products`,
    description: `Browse all products for ${resolved.partner}.`,
    path: `/shop/${resolved.partner}/product`,
  })
  const partnerConfig = await getPartnerStorefrontBySlug(resolved.partner)
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL
  const partnerIcon = resolveStorefrontAssetUrl(partnerConfig?.tabLogoUrl || partnerConfig?.logoUrl, apiUrl)

  return {
    ...metadata,
    title: plainTitle,
    icons: partnerIcon
      ? {
        icon: [{ url: partnerIcon, type: 'image/png' }],
        apple: partnerIcon,
      }
      : {
        icon: [{ url: BLANK_FAVICON, type: 'image/svg+xml' }],
        apple: BLANK_FAVICON,
      },
    openGraph: metadata.openGraph
      ? {
        ...metadata.openGraph,
        title: plainTitle,
      }
      : undefined,
    twitter: metadata.twitter
      ? {
        ...metadata.twitter,
        title: plainTitle,
      }
      : undefined,
  }
}

async function getPartnerProductPageData(partnerSlug: string) {
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL
  if (!apiUrl) return null

  try {
    const [storefrontsRes, categoriesRes, productsRes] = await Promise.all([
      fetchWithRetry(`${apiUrl}/api/web-pages/partner-storefronts`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
      fetchWithRetry(`${apiUrl}/api/categories?used_only=1&per_page=300`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
      fetchWithRetry(`${apiUrl}/api/products?page=1&per_page=200&status=1`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
    ])

    if (!storefrontsRes.ok) {
      return {
        categories: [] as Category[],
        products: [] as CategoryProduct[],
      }
    }
    if (!categoriesRes.ok || !productsRes.ok) {
      return {
        categories: [] as Category[],
        products: [] as CategoryProduct[],
      }
    }

    const storefrontsJson = (await storefrontsRes.json()) as ApiWebPagesResponse
    const categoriesJson = (await categoriesRes.json()) as ApiCategoriesResponse
    const productsJson = (await productsRes.json()) as ApiProductsResponse

    const storefrontItem = (storefrontsJson.items ?? []).find((item) => {
      const config = getPartnerStorefrontConfig(item)
      return config?.slug === partnerSlug
    })

    const partnerRaw = getPartnerStorefrontConfig(storefrontItem)
    const partner = partnerRaw
      ? {
          ...partnerRaw,
          logoUrl: resolveStorefrontAssetUrl(partnerRaw.logoUrl, apiUrl) || null,
          tabLogoUrl: resolveStorefrontAssetUrl(partnerRaw.tabLogoUrl, apiUrl) || null,
          heroVideoUrl: resolveStorefrontAssetUrl(partnerRaw.heroVideoUrl, apiUrl) || null,
        }
      : null
    if (!partner) return null

    const allowedCategories = filterPartnerCategories(categoriesJson.categories ?? [], partner)
    const selectedProductIds = partner.featuredProductIds
    const allowedCategoryIdSet = new Set(allowedCategories.map((category) => Number(category.id)))
    const allowedProductsFromListing = (productsJson.products ?? []).filter((product) =>
      allowedCategoryIdSet.has(Number(product.catid)),
    )

    if (allowedCategories.length === 0) {
      return {
        partner,
        categories: allowedCategories,
        products: [] as CategoryProduct[],
      }
    }

    // Fallback: when no featured list is configured, show all products in allowed categories.
    if (selectedProductIds.length === 0) {
      return {
        partner,
        categories: allowedCategories,
        products: allowedProductsFromListing.map((product) => mapProductToDisplay(product, apiUrl)),
      }
    }
    const listingProductsById = new Map(allowedProductsFromListing.map((product) => [product.id, product] as const))
    const selectedProductsFromListing = selectedProductIds
      .map((productId) => listingProductsById.get(productId) ?? null)
      .filter((product): product is Product => Boolean(product))

    const missingSelectedIds = selectedProductIds
      .filter((productId, index, arr) => arr.indexOf(productId) === index)
      .filter((productId) => !listingProductsById.has(productId))
      .slice(0, MAX_FEATURED_PRODUCT_DETAIL_FETCHES)

    const productEntries = await Promise.all(
      missingSelectedIds.map(async (productId) => {
        try {
          const response = await fetchWithRetry(`${apiUrl}/api/products/${productId}`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            cache: 'no-store',
          })
          if (!response.ok) return null
          const json = (await response.json()) as ApiProductResponse
          const product = json.product
          if (!product) return null
          if (!allowedCategoryIdSet.has(Number(product.catid))) return null
          return product
        } catch {
          return null
        }
      }),
    )

    const selectedProducts = [
      ...selectedProductsFromListing,
      ...productEntries.filter((item): item is Product => Boolean(item)),
    ]

    const productsToDisplay = selectedProducts.length > 0 ? selectedProducts : allowedProductsFromListing

    return {
      partner,
      categories: allowedCategories,
      products: productsToDisplay.map((product) => mapProductToDisplay(product, apiUrl)),
    }
  } catch {
    return {
      partner: null,
      categories: [] as Category[],
      products: [] as CategoryProduct[],
    }
  }
}

export default async function PartnerProductPage({ params }: PageProps) {
  const resolved = await params
  const payload = await getPartnerProductPageData(resolved.partner)

  if (!payload) {
    notFound()
  }

  return (
    <CategoryListProductMain
      slug={`${resolved.partner}-products`}
      initialCategoryLabel="All Products"
      initialProducts={payload.products}
      initialCategories={payload.categories}
      partnerBranding={{
        logoSrc: payload.partner?.logoUrl || payload.partner?.tabLogoUrl || '/Images/af_home_logo.png',
        displayName: payload.partner?.displayName || resolved.partner,
        productHref: `/shop/${resolved.partner}/product`,
        heroVideoUrl: payload.partner?.heroVideoUrl || undefined,
        enableActivateDiscount: Boolean(payload.partner?.enableActivateDiscount),
      }}
    />
  )
}
