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
  tabLogoUrl: string | null
  heroVideoUrl: string | null
  logoVersion: string
  referralLink: string
  heroTitle: string
  heroSubtitle: string
  themeColor: string
  accentColor: string
  allowedCategoryIds: number[]
  featuredProductIds: number[]
  notificationEmail: string
  domainLink: string
  enableAiSupport: boolean
  enableActivateDiscount: boolean
}


const defaultThemeColor = '#0f766e'
const defaultAccentColor = '#f97316'

export const slugifyLabel = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')

export const normalizeCategorySlug = (rawUrl: string | null | undefined, fallbackName: string) => {
  const source = decodeURIComponent(String(rawUrl ?? '').trim())
  if (!source || source === '0') return slugifyLabel(fallbackName)

  const withoutDomain = source.replace(/^https?:\/\/[^/]+/i, '')
  const withoutQuery = withoutDomain.split(/[?#]/)[0] ?? withoutDomain
  const cleaned = withoutQuery
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^shop\/category\//i, '')
    .replace(/^shop\//i, '')
    .replace(/^category\//i, '')
    .replace(/\/+$/, '')

  const segment = cleaned.split('/').filter(Boolean).pop() ?? cleaned
  return slugifyLabel(segment || fallbackName)
}

export const parseIdList = (value: string) =>
  value
    .split(',')
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isFinite(item) && item > 0)

const getPayloadFields = (item: WebPageItem | undefined): Record<string, string> =>
  (((item?.payload ?? {}) as PartnerStorefrontPayload).fields ?? {})

const toBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
  }
  return false
}

export const getPartnerStorefrontConfig = (item: WebPageItem | undefined): PartnerStorefrontConfig | null => {
  if (!item) return null

  const fields = getPayloadFields(item)
  const slug = String(fields.slug ?? item.key ?? '').trim().toLowerCase()
  if (!slug) return null

  return {
    slug,
    displayName: String(fields.display_name ?? item.title ?? slug).trim() || slug,
    logoUrl: String(fields.logo_url ?? item.image_url ?? '').trim() || null,
    tabLogoUrl: String(fields.tab_logo_url ?? '').trim() || null,
    heroVideoUrl: String(fields.hero_video_url ?? '').trim() || null,
    logoVersion: String(fields.logo_version ?? '').trim(),
    referralLink: String(fields.referral_link ?? '').trim(),
    heroTitle: String(fields.hero_title ?? item.subtitle ?? '').trim() || `Shop ${slug}`,
    heroSubtitle: String(fields.hero_subtitle ?? item.body ?? '').trim() || 'Curated products for your partner storefront.',
    themeColor: String(fields.theme_color ?? defaultThemeColor).trim() || defaultThemeColor,
    accentColor: String(fields.accent_color ?? defaultAccentColor).trim() || defaultAccentColor,
    allowedCategoryIds: parseIdList(String(fields.allowed_category_ids ?? '')),
    featuredProductIds: parseIdList(String(fields.featured_product_ids ?? '')),
    notificationEmail: String(fields.notification_email ?? '').trim(),
    domainLink: String(fields.domain_link ?? '').trim(),
    enableAiSupport: toBoolean(fields.enable_ai_support),
    enableActivateDiscount: toBoolean(fields.activate_discount ?? fields.enable_activate_discount),
  }
}


export const filterPartnerCategories = (categories: Category[], config: PartnerStorefrontConfig | null) => {
  if (!config) return categories
  if (config.allowedCategoryIds.length === 0) return []
  const allowed = new Set(config.allowedCategoryIds)
  return categories.filter((category) => allowed.has(category.id))
}

export const filterPartnerProducts = (products: Product[], config: PartnerStorefrontConfig | null) => {
  if (!config) return products
  if (config.allowedCategoryIds.length === 0) return []
  const allowed = new Set(config.allowedCategoryIds)
  return products.filter((product) => allowed.has(product.catid))
}

export const buildPartnerShopLink = (href: string, partnerSlug?: string) => {
  if (!partnerSlug) return href
  const value = href.trim()
  if (value === '' || !value.startsWith('/shop')) return value
  return value.replace(/^\/shop(?=\/|\?|$)/, `/shop/${partnerSlug}`)
}

export const buildPartnerCategoryLink = (partnerSlug: string | undefined, category: Pick<Category, 'url' | 'name'>) => {
  const categorySlug = normalizeCategorySlug(category.url, category.name)
  if (!partnerSlug) return `/category/${categorySlug}`
  return `/shop/${partnerSlug}/category/${categorySlug}`
}
