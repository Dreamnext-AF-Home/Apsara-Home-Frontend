import { categoryMeta, type CategoryProduct } from '@/libs/CategoryData'
import type { Category } from '@/store/api/categoriesApi'
import type { Product } from '@/store/api/productsApi'

type LooseRecord = Record<string, unknown>
const toLooseRecord = (value: unknown): LooseRecord => value as LooseRecord

interface ApiCategoriesResponse {
  categories?: Category[]
  data?: Category[]
}

interface ApiProductsResponse {
  products?: Product[]
  data?: Product[]
}
const MAX_FETCH_RETRIES = 2
const PRODUCT_PAGE_REVALIDATE_SECONDS = 60

export interface ProductPageData {
  product: CategoryProduct
  categorySlug: string
  categoryId: number
  categoryLabel: string
  relatedProducts: CategoryProduct[]
  reviewSummary?: {
    average: number
    count: number
    breakdown: Record<number, number>
  }
  reviews?: Array<{
    id: number
    rating: number
    review: string
    customer_name: string
    customer_avatar?: string | null
    created_at?: string | null
  }>
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const parseSlugAndId = (raw: string) => {
  const match = raw.match(/^(.*)-i(\d+)$/i)
  if (!match) return { slugOnly: raw, id: null as number | null }
  const id = Number(match[2])
  return {
    slugOnly: (match[1] || '').trim(),
    id: Number.isFinite(id) ? id : null,
  }
}

export const buildCanonicalProductSlug = (name: string, id?: number) => {
  const base = slugify(name)
  if (typeof id === 'number' && id > 0) return `${base}-i${id}`
  return base
}

const normalizeCategorySlug = (rawUrl: string | null | undefined, fallbackName: string) => {
  const source = (rawUrl ?? '').trim()
  if (!source || source === '0') return slugify(fallbackName)
  const withoutDomain = source.replace(/^https?:\/\/[^/]+/i, '')
  const cleaned = withoutDomain.replace(/^\/+/, '').replace(/^category\//i, '').replace(/\/+$/, '')
  return cleaned || slugify(fallbackName)
}

const resolveImageUrl = (rawImage: string | null | undefined, apiUrl?: string) => {
  if (!rawImage) return '/Images/HeroSection/chairs_stools.jpg'
  if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) return rawImage
  if (rawImage.startsWith('/')) return rawImage
  if (!apiUrl) return `/${rawImage}`
  return `${apiUrl.replace(/\/$/, '')}/${rawImage.replace(/^\/+/, '')}`
}

const fetchWithRetry = async (input: string, init?: RequestInit): Promise<Response> => {
  let lastResponse: Response | null = null
  let lastError: unknown = null

  for (let attempt = 0; attempt <= MAX_FETCH_RETRIES; attempt += 1) {
    try {
      const response = await fetch(input, init)
      if (response.ok) {
        return response
      }

      // Do not hammer the API on client errors; return immediately.
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response
      }

      if (response.status === 429) {
        const retryAfterRaw = response.headers.get('retry-after')
        const retryAfterSeconds = retryAfterRaw ? Number.parseInt(retryAfterRaw, 10) : NaN
        const delayMs = Number.isFinite(retryAfterSeconds)
          ? Math.max(250, Math.min(2000, retryAfterSeconds * 1000))
          : 700 * (attempt + 1)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }

      if (attempt === MAX_FETCH_RETRIES) {
        return response
      }
      lastResponse = response
    } catch (error) {
      lastError = error
      if (attempt === MAX_FETCH_RETRIES) {
        throw error
      }
    }
  }

  if (lastResponse) return lastResponse
  throw (lastError instanceof Error ? lastError : new Error('Failed to fetch'))
}

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.-]/g, '')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value == null) return undefined
  if (typeof value === 'string' && value.trim() === '') return undefined

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.-]/g, '')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
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
      // fallback below
    }
    return [value]
  }

  return []
}

const resolveDisplayStock = (baseStock: number, variants?: Array<{ qty?: number; status?: number }>): number => {
  if (!variants || variants.length === 0) return baseStock

  const activeVariants = variants.filter((variant) => {
    if (variant.status == null) return true
    return Number(variant.status) === 1
  })

  if (activeVariants.length === 0) return 0

  const hasVariantQty = activeVariants.some((variant) => typeof variant.qty === 'number')
  if (!hasVariantQty) return baseStock

  return activeVariants.reduce((sum, variant) => sum + Math.max(0, Number(variant.qty ?? 0)), 0)
}

const extractCategories = (json: unknown): Category[] => {
  const source = json as ApiCategoriesResponse
  return asArray<Category>(source.categories ?? source.data)
}

const extractProducts = (json: unknown): Product[] => {
  const source = json as ApiProductsResponse
  return asArray<Product>(source.products ?? source.data)
}

const toCategoryProduct = (row: LooseRecord, apiUrl?: string): CategoryProduct => {
  const id = toNumber(row.id ?? row.pd_id ?? 0)
  const name = String(row.name ?? row.pd_name ?? 'Untitled Product')
  const srp = toNumber(row.priceSrp ?? row.pd_price_srp ?? 0)
  const member = toNumber(row.priceMember ?? row.pd_price_member ?? 0)
  const prodpv = toNumber(row.prodpv ?? row.pd_prodpv ?? 0)
  const price = srp
  const rawImage = (row.image ?? row.pd_image) as string | null | undefined
  const images = toStringArray(row.images ?? row.pd_images).map((item) => resolveImageUrl(item, apiUrl))

  let badge: string | undefined
  if (Boolean(row.salespromo ?? row.pd_salespromo)) badge = 'SALE'
  else if (Boolean(row.bestseller ?? row.pd_bestseller)) badge = 'BEST SELLER'
  else if (Boolean(row.musthave ?? row.pd_musthave)) badge = 'MUST HAVE'

  const rawVariants = Array.isArray(row.variants)
    ? row.variants
    : Array.isArray(row.pd_variants)
      ? row.pd_variants
      : row.variants && typeof row.variants === 'object'
        ? Object.values(row.variants as Record<string, unknown>)
        : []

  const variants =
    rawVariants.length > 0
      ? rawVariants.map((item) => {
          const variant = toLooseRecord(item)
          const statusRaw = variant.status ?? variant.pv_status
          return {
            id: typeof variant.id === 'number' ? variant.id : undefined,
            sku: typeof (variant.sku ?? variant.pv_sku) === 'string' ? String(variant.sku ?? variant.pv_sku) : undefined,
            name:
              typeof (variant.name ?? variant.pv_name) === 'string' ? String(variant.name ?? variant.pv_name) : undefined,
            color:
              typeof (variant.color ?? variant.pv_color) === 'string'
                ? String(variant.color ?? variant.pv_color)
                : undefined,
            colorHex:
              typeof (variant.colorHex ?? variant.pv_color_hex) === 'string'
                ? String(variant.colorHex ?? variant.pv_color_hex)
                : undefined,
            size:
              typeof (variant.size ?? variant.pv_size) === 'string' ? String(variant.size ?? variant.pv_size) : undefined,
            style:
              typeof (variant.style ?? variant.pv_style) === 'string'
                ? String(variant.style ?? variant.pv_style)
                : undefined,
            width: toOptionalNumber(variant.width ?? variant.pv_width),
            dimension: toOptionalNumber(variant.dimension ?? variant.pv_dimension),
            height: toOptionalNumber(variant.height ?? variant.pv_height),
            priceSrp: toOptionalNumber(variant.priceSrp ?? variant.pv_price_srp),
            priceDp: toOptionalNumber(variant.priceDp ?? variant.pv_price_dp),
            priceMember: toOptionalNumber(variant.priceMember ?? variant.pv_price_member),
            prodpv: toOptionalNumber(variant.prodpv ?? variant.pv_prodpv),
            qty: toOptionalNumber(variant.qty ?? variant.pv_qty),
            status: typeof statusRaw === 'number' ? statusRaw : Number(statusRaw),
            images: toStringArray(variant.images ?? variant.pv_images).map((img) => resolveImageUrl(img, apiUrl)),
          }
        })
      : undefined

  const baseStock = Number(row.qty ?? row.pd_qty ?? 0)
  const stock = resolveDisplayStock(baseStock, variants)

  const resolveBrand = () => {
    if (typeof row.brand === 'string') return row.brand
    if (typeof row.brand_name === 'string') return row.brand_name
    if (row.brand && typeof row.brand === 'object') {
      const brandObj = row.brand as LooseRecord
      if (typeof brandObj.name === 'string') return brandObj.name
      if (typeof brandObj.brand_name === 'string') return brandObj.brand_name
    }
    return undefined
  }

  return {
    id,
    name,
    type: toNumber(row.type ?? row.pd_type),
    createdAt: (row.createdAt ?? row.pd_created_at ?? row.created_at) as string | undefined,
    price,
    priceSrp: srp || undefined,
    priceDp: toOptionalNumber(row.priceDp ?? row.pd_price_dp),
    priceMember: member || undefined,
    prodpv: prodpv || undefined,
    originalPrice: toOptionalNumber(row.originalPrice ?? row.pd_original_price),
    image: resolveImageUrl(rawImage, apiUrl),
    images,
    description: (row.description ?? row.pd_description) as string | undefined,
    specifications: (row.specifications ?? row.pd_specifications) as string | undefined,
    badge,
    verified: Boolean(row.verified ?? row.pd_verified),
    stock,
    sku: String(row.sku ?? row.pd_parent_sku ?? '').trim() || undefined,
    variants,
    brand: resolveBrand(),
    manualCheckoutEnabled: Boolean(row.manualCheckoutEnabled ?? row.pd_manual_checkout_enabled),
    weight: toOptionalNumber(row.weight ?? row.pd_weight),
    psweight: toOptionalNumber(row.psweight ?? row.pd_psweight),
    pswidth: toOptionalNumber(row.pswidth ?? row.pd_pswidth),
    pslenght: toOptionalNumber(row.pslenght ?? row.pd_pslenght),
    psheight: toOptionalNumber(row.psheight ?? row.pd_psheight),
    material: (row.material ?? row.pd_material) as string | undefined,
    assemblyRequired: Boolean(row.assemblyRequired ?? row.pd_assembly_required),
    warranty: (row.warranty ?? row.pd_warranty) as string | undefined,
  }
}

const getCategorySlugFromProduct = (row: LooseRecord, categories: Category[]) => {
  const catId = Number(
    row.catid ??
      row.pd_catid ??
      row.cat_id ??
      row.category_id ??
      ((row.category as LooseRecord | undefined)?.id) ??
      -1,
  )
  const matchedById = categories.find((c) => Number(c.id) === catId)
  if (matchedById) return normalizeCategorySlug(matchedById.url, matchedById.name)

  const categoryName =
    (row.categoryName as string | undefined) ??
    (row.category_name as string | undefined) ??
    (row.cat_name as string | undefined) ??
    ((row.category as LooseRecord | undefined)?.name as string | undefined)

  if (categoryName) return slugify(categoryName)
  return ''
}

export async function getProductPageData(slug: string): Promise<ProductPageData | null> {
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL
  if (!apiUrl) return null
  const { slugOnly, id } = parseSlugAndId(slug)

  try {
    const [categoriesRes, productRes, productsRes] = await Promise.allSettled([
      fetchWithRetry(`${apiUrl}/api/categories?page=1&per_page=100`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        next: { revalidate: PRODUCT_PAGE_REVALIDATE_SECONDS, tags: ['storefront:categories'] },
      }),
      fetchWithRetry(id ? `${apiUrl}/api/products/${id}` : `${apiUrl}/api/products/slug/${encodeURIComponent(slugOnly)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        next: { revalidate: PRODUCT_PAGE_REVALIDATE_SECONDS, tags: ['storefront:products'] },
      }),
      fetchWithRetry(`${apiUrl}/api/products?page=1&per_page=300&status=1`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        next: { revalidate: PRODUCT_PAGE_REVALIDATE_SECONDS, tags: ['storefront:products'] },
      }),
    ])

    const categoriesResponse = categoriesRes.status === 'fulfilled' ? categoriesRes.value : null
    const productResponse = productRes.status === 'fulfilled' ? productRes.value : null
    const productsResponse = productsRes.status === 'fulfilled' ? productsRes.value : null

    const categories =
      categoriesResponse && categoriesResponse.ok ? extractCategories(await categoriesResponse.json()) : []
    const products =
      productsResponse && productsResponse.ok
        ? extractProducts(await productsResponse.json()).map((p) => toLooseRecord(p))
        : []

    let target: LooseRecord | null = null
    if (productResponse && productResponse.ok) {
      const productJson = (await productResponse.json()) as { product?: Product }
      target = productJson.product ? toLooseRecord(productJson.product) : null
    }

    if (!target && id) {
      try {
        const slugResponse = await fetchWithRetry(`${apiUrl}/api/products/slug/${encodeURIComponent(slugOnly)}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          next: { revalidate: PRODUCT_PAGE_REVALIDATE_SECONDS, tags: ['storefront:products'] },
        })
        if (slugResponse.ok) {
          const slugJson = (await slugResponse.json()) as { product?: Product }
          target = slugJson.product ? toLooseRecord(slugJson.product) : null
        }
      } catch {
        // Keep other fallback paths below.
      }
    }

    if (!target && id && products.length > 0) {
      target =
        products.find((row) => toNumber(row.id ?? row.pd_id ?? 0) === id) ??
        null
    }

    if (!target && products.length > 0) {
      target =
        products.find((row) => slugify(String(row.name ?? row.pd_name ?? '')) === slugOnly) ??
        null
    }

    if (!target) return null

    const categorySlug = getCategorySlugFromProduct(target, categories)
    const matchedCategory = categories.find((c) => normalizeCategorySlug(c.url, c.name) === categorySlug)
    const categoryId = matchedCategory?.id ?? 0
    const categoryLabel = matchedCategory?.name ?? categoryMeta[categorySlug]?.label ?? 'Category'

    const relatedProducts = products
      .filter((row) => {
        const rowId = toNumber(row.id ?? row.pd_id ?? 0)
        if (id && rowId === id) return false
        const rowSlug = slugify(String(row.name ?? row.pd_name ?? ''))
        if (rowSlug === slugOnly) return false
        const rowCategorySlug = getCategorySlugFromProduct(row, categories)
        return rowCategorySlug === categorySlug
      })
      .slice(0, 4)
      .map((row) => toCategoryProduct(row, apiUrl))

    const resolvedProduct = toCategoryProduct(target, apiUrl)
    const reviewId = resolvedProduct.id ?? id ?? 0
    let reviewSummary: ProductPageData['reviewSummary']
    let reviews: ProductPageData['reviews']
    if (reviewId > 0) {
      try {
        const reviewsRes = await fetch(`${apiUrl}/api/products/${reviewId}/reviews`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          next: { revalidate: PRODUCT_PAGE_REVALIDATE_SECONDS, tags: ['storefront:products'] },
        })
        if (reviewsRes.ok) {
          const reviewsJson = (await reviewsRes.json()) as {
            summary?: ProductPageData['reviewSummary']
            reviews?: ProductPageData['reviews']
          }
          reviewSummary = reviewsJson.summary
          reviews = reviewsJson.reviews
        }
      } catch {
        // Keep fallback empty if review endpoint fails.
      }
    }

    return {
      product: resolvedProduct,
      categorySlug,
      categoryId,
      categoryLabel,
      relatedProducts,
      reviewSummary,
      reviews,
    }
  } catch {
    return null
  }
}
