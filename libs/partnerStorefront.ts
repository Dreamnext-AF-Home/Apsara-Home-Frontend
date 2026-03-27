import type { Category } from '@/store/api/categoriesApi'
import type { Product } from '@/store/api/productsApi'
import type { WebPageItem } from '@/store/api/webPagesApi'

type PartnerStorefrontPayload = {
  fields?: Record<string, string>
}

export type PartnerStorefrontConfig = {
  slug: string
  displayName: string
  logoUrl: string | null
  heroTitle: string
  heroSubtitle: string
  themeColor: string
  accentColor: string
  allowedCategoryIds: number[]
  featuredProductIds: number[]
  notificationEmail: string
}

const defaultThemeColor = '#0f766e'
const defaultAccentColor = '#f97316'

export const parseIdList = (value: string) =>
  value
    .split(',')
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isFinite(item) && item > 0)

const getPayloadFields = (item: WebPageItem | undefined): Record<string, string> =>
  (((item?.payload ?? {}) as PartnerStorefrontPayload).fields ?? {})

export const getPartnerStorefrontConfig = (item: WebPageItem | undefined): PartnerStorefrontConfig | null => {
  if (!item) return null

  const fields = getPayloadFields(item)
  const slug = String(fields.slug ?? item.key ?? '').trim().toLowerCase()
  if (!slug) return null

  return {
    slug,
    displayName: String(fields.display_name ?? item.title ?? slug).trim() || slug,
    logoUrl: String(fields.logo_url ?? item.image_url ?? '').trim() || null,
    heroTitle: String(fields.hero_title ?? item.subtitle ?? '').trim() || `Shop ${slug}`,
    heroSubtitle: String(fields.hero_subtitle ?? item.body ?? '').trim() || 'Curated products for your partner storefront.',
    themeColor: String(fields.theme_color ?? defaultThemeColor).trim() || defaultThemeColor,
    accentColor: String(fields.accent_color ?? defaultAccentColor).trim() || defaultAccentColor,
    allowedCategoryIds: parseIdList(String(fields.allowed_category_ids ?? '')),
    featuredProductIds: parseIdList(String(fields.featured_product_ids ?? '')),
    notificationEmail: String(fields.notification_email ?? '').trim(),
  }
}

export const filterPartnerCategories = (categories: Category[], config: PartnerStorefrontConfig | null) => {
  if (!config || config.allowedCategoryIds.length === 0) return categories
  const allowed = new Set(config.allowedCategoryIds)
  return categories.filter((category) => allowed.has(category.id))
}

export const filterPartnerProducts = (products: Product[], config: PartnerStorefrontConfig | null) => {
  if (!config || config.allowedCategoryIds.length === 0) return products
  const allowed = new Set(config.allowedCategoryIds)
  return products.filter((product) => allowed.has(product.catid))
}

export const buildPartnerShopLink = (href: string, partnerSlug?: string) => {
  if (!partnerSlug) return href
  const value = href.trim()
  if (value === '' || !value.startsWith('/shop')) return value
  return value.replace(/^\/shop(?=\/|\?|$)/, `/shop/${partnerSlug}`)
}
