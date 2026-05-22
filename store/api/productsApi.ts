import { baseApi } from './baseApi'

export interface Product {
  id: number
  supplierId?: number
  supplierName?: string | null
  name: string
  description?: string | null
  specifications?: string | null
  catid: number
  catsubid: number
  priceSrp: number
  priceDp: number
  priceMember?: number
  prodpv?: number
  qty: number
  weight: number
  psweight?: number
  pswidth?: number
  pslenght?: number
  psheight?: number
  material?: string | null
  assemblyRequired?: boolean
  warranty?: string | null
  roomType?: number
  brandType?: number
  brand?: string | null
  type: number
  musthave: boolean
  bestseller: boolean
  salespromo: boolean
  manualCheckoutEnabled?: boolean
  verified?: boolean
  status: number
  sku: string
  uploaderName?: string | null
  uploaderEmail?: string | null
  uploaderRole?: string | null
  image: string | null
  images?: string[] | null
  variants?: ProductVariant[] | null
  soldCount?: number
  avgRating?: number
  createdAt: string | null
  updatedAt: string | null
}

export interface ProductVariant {
  id?: number
  sku?: string
  name?: string
  color?: string
  colorHex?: string
  size?: string
  style?: string
  width?: number
  dimension?: number
  height?: number
  priceSrp?: number
  priceDp?: number
  priceMember?: number
  prodpv?: number
  qty?: number
  status?: number
  images?: string[]
}

export interface ProductsMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface ProductsResponse {
  products: Product[]
  meta: ProductsMeta
}

export interface ProductReviewSummary {
  average: number
  count: number
  breakdown: Record<number, number>
}

export interface ProductReview {
  id: number
  rating: number
  review: string
  review_image?: string | null
  review_video?: string | null
  review_images?: string[]
  review_videos?: string[]
  customer_name: string
  customer_avatar?: string | null
  created_at?: string | null
}

export interface ProductReviewsResponse {
  summary: ProductReviewSummary
  reviews: ProductReview[]
}

export interface ProductActivityLog {
  id: number
  productId: number | null
  supplierId: number | null
  action: string
  status: string
  productName: string
  productSku?: string | null
  actorName?: string | null
  actorEmail?: string | null
  actorRole?: string | null
  changes?: Array<{
    field: string
    before: string | null
    after: string | null
  }> | null
  createdAt?: string | null
}

export interface ProductActivityLogsResponse {
  logs: ProductActivityLog[]
  meta: ProductsMeta
}

export interface BulkImportProductsRow {
  pd_name?: string
  pd_parent_sku?: string
  pd_catid?: number | string
  pd_room_type?: number | string
  pd_brand_type?: number | string
  pd_catsubid?: number | string
  pd_price_srp?: number | string
  pd_price_dp?: number | string
  pd_price_member?: number | string
  pd_prodpv?: number | string
  pd_qty?: number | string
  pd_weight?: number | string
  pd_psweight?: number | string
  pd_pswidth?: number | string
  pd_pslenght?: number | string
  pd_psheight?: number | string
  pd_description?: string
  pd_specifications?: string
  pd_material?: string
  pd_warranty?: string
  pd_image?: string
  pd_images?: string[] | string
  pd_type?: number | string
  pd_status?: number | string
  pd_pricing_tier?: string
  pd_reversed_pv_multiplier?: number | string
  pd_musthave?: boolean | number | string
  pd_bestseller?: boolean | number | string
  pd_salespromo?: boolean | number | string
  pd_verified?: boolean | number | string
  pd_assembly_required?: boolean | number | string
  pd_manual_checkout_enabled?: boolean | number | string
  // variant fields (used during CSV parsing; grouped into pd_variants before sending)
  pv_sku?: string
  pv_name?: string
  pv_color?: string
  pv_color_hex?: string
  pv_size?: string
  pv_style?: string
  pv_width?: number | string
  pv_dimension?: number | string
  pv_height?: number | string
  pv_price_srp?: number | string
  pv_price_dp?: number | string
  pv_price_member?: number | string
  pv_prodpv?: number | string
  pv_qty?: number | string
  pv_status?: number | string
  pv_images?: string[] | string
  pd_variants?: CreateProductVariantPayload[]
}

export interface BulkImportProductsPayload {
  rows: BulkImportProductsRow[]
  mode?: 'create_only' | 'create_or_update'
}

export interface BulkImportProductsResponse {
  message: string
  summary: {
    total: number
    created: number
    updated: number
    failed: number
  }
  results: Array<{
    row: number
    status: 'created' | 'updated' | 'failed'
    product_id?: number | null
    name?: string | null
    sku?: string | null
    message: string
  }>
}

export interface BulkPriceRow {
  id?: number
  sku?: string
  price_srp?: number | string | null
  price_dp?: number | string | null
  price_member?: number | string | null
}

export interface BulkUpdateRow {
  id?: number
  sku?: string
  pd_name?: string | null
  pd_catid?: number | string | null
  pd_room_type?: number | string | null
  pd_brand_type?: number | string | null
  pd_material?: string | null
  pd_price_srp?: number | string | null
  pd_price_member?: number | string | null
  pd_price_dp?: number | string | null
  pd_qty?: number | string | null
  pd_weight?: number | string | null
  pd_pswidth?: number | string | null
  pd_pslenght?: number | string | null
  pd_psheight?: number | string | null
  pd_psweight?: number | string | null
}

export interface BulkPricePreviewResponse {
  message: string
  summary: {
    total: number
    ready: number
    failed: number
  }
  results: Array<{
    row: number
    status: 'ready' | 'failed'
    product_id?: number | null
    sku?: string | null
    name?: string | null
    current?: {
      price_srp?: number | null
      price_dp?: number | null
      price_member?: number | null
    }
    next?: {
      price_srp?: number | null
      price_dp?: number | null
      price_member?: number | null
    }
    message: string
  }>
}

export interface BulkUpdatePreviewResponse {
  message: string
  summary: {
    total: number
    ready: number
    failed: number
  }
  results: Array<{
    row: number
    status: 'ready' | 'failed'
    product_id?: number | null
    sku?: string | null
    name?: string | null
    current?: Record<string, unknown> | null
    next?: Record<string, unknown> | null
    message: string
  }>
}

export interface BulkPriceApplyResponse {
  message: string
  summary: {
    total: number
    updated: number
    failed: number
  }
  results: Array<{
    row: number
    status: 'updated' | 'failed'
    product_id?: number | null
    sku?: string | null
    name?: string | null
    message: string
  }>
}

export interface BulkUpdateApplyResponse {
  message: string
  summary: {
    total: number
    updated: number
    failed: number
  }
  results: Array<{
    row: number
    status: 'updated' | 'failed'
    product_id?: number | null
    sku?: string | null
    name?: string | null
    message: string
  }>
}

export interface ProductBrandInfo {
  id: number
  name: string
  image?: string | null
  status?: number
  rating?: number | null
  chatPerformance?: number
  totalProducts?: number
  joinedDate?: string
  overallRating?: number | null
  totalReviews?: number
}

export interface ManualCheckoutApplyResponse {
  message: string
  summary: {
    total: number
    updated: number
    failed: number
  }
  results: Array<{
    product_id: number
    status: 'updated' | 'failed'
    name?: string | null
    message: string
  }>
}

export interface ZqImportPreviewPayload {
  cursor?: string | number | null
  size?: number
  keyword?: string
  status?: string
  resumeFromSaved?: boolean
  resetCursor?: boolean
  sourceType?: string[]
  ids?: number[]
}

export interface ZqImportPreviewResponse {
  message: string
  request?: Record<string, unknown>
  cursor?: {
    used?: string | null
    saved?: string | null
    resumed?: boolean
  }
  zq: Record<string, unknown>
}

export interface ZqImportProductsResponse {
  message: string
  summary: {
    total: number
    created: number
    failed: number
  }
  results: Array<{
    id: string
    status: 'created' | 'failed'
    product_id?: number | null
    name?: string | null
    message: string
  }>
}

export interface ZqImportDetailResponse {
  message: string
  zq: Record<string, unknown>
}

export interface ZqCachedProduct {
  id: number
  externalId: string
  offerId?: string | null
  brandType?: number | null
  zqCategoryId?: string | null
  subject: string
  subjectCn?: string | null
  categoryName?: string | null
  localCategoryId?: number | null
  localCategoryName?: string | null
  categoryMappingStatus?: 'mapped' | 'unmapped' | 'missing'
  primaryImage?: string | null
  images?: string[]
  sourceType?: string | null
  status?: string | null
  importStatus?: string | null
  productUrl?: string | null
  targetCurrency?: string | null
  shippingTo?: string | null
  priceMinCents?: number | null
  priceMaxCents?: number | null
  costMinCents?: number | null
  costMaxCents?: number | null
  totalStock: number
  variantCount: number
  publishedAt?: string | null
  sourceCreatedAt?: string | null
  sourceUpdatedAt?: string | null
  syncedAt?: string | null
}

export interface ZqCachedProductsResponse {
  products: ZqCachedProduct[]
  meta: ProductsMeta
}

export interface ZqPublicProductResponse {
  product: ZqCachedProduct & {
    description?: string | null
    specs?: Array<{
      id: string
      sku: string
      name: string
      priceCents?: number | null
      stock: number
      image?: string | null
    }>
  }
}

export interface ZqSyncProductsPayload {
  cursor?: string | number | null
  size?: number
  keyword?: string
  status?: string
  resumeFromSaved?: boolean
  resetCursor?: boolean
  sourceType?: string[]
  ids?: number[]
}

export interface ZqSyncProductsResponse {
  message: string
  summary: {
    requested: number
    synced: number
    skipped: number
    failed: number
  }
  hasMore: boolean
  nextCursor?: string | null
  usedCursor?: string | null
  savedCursor?: string | null
}

export interface ZqProductsSummaryResponse {
  total: number
  active: number
  inactive: number
  low_stock: number
  saved_cursor?: string | null
  has_saved_cursor?: boolean
}

export interface ZqCategoryMappingItem {
  zqCategoryId?: string | null
  zqCategoryName: string
  productCount: number
  localCategoryId?: number | null
  localCategoryName?: string | null
  status: 'mapped' | 'unmapped'
}

export interface ZqCategoryMappingLocalCategory {
  id: number
  name: string
  url: string
}

export interface ZqCategoryMappingsResponse {
  zqCategories: ZqCategoryMappingItem[]
  localCategories: ZqCategoryMappingLocalCategory[]
  message?: string
}

export interface UpsertZqCategoryMappingPayload {
  zqCategoryId?: string | null
  zqCategoryName: string
  localCategoryId?: number | null
}

export interface UpsertZqCategoryMappingResponse {
  message: string
  mapping: {
    zqCategoryId?: string | null
    zqCategoryName: string
    localCategoryId?: number | null
    localCategoryName?: string | null
  }
}

export interface ImportZqToLocalResponse {
  message: string
  product: {
    id: number
    name: string
    status: number
    sku: string
  }
}

export interface PublicProductResponse {
  product: Product
}

export interface ProductViewerHeartbeatResponse {
  product_id: number
  viewer_id: string
  active_viewers: number
  ttl_seconds: number
  updated_at: string
}

export interface CreateProductPayload {
  pd_name: string
  pd_catid: number
  pd_room_type?: number | null
  pd_brand_type?: number | null
  pd_catsubid?: number
  pd_price_srp: number
  pd_price_dp?: number
  pd_price_member?: number
  pd_prodpv?: number
  pd_qty?: number
  pd_weight?: number
  pd_psweight?: number
  pd_pswidth?: number
  pd_pslenght?: number
  pd_psheight?: number
  pd_description?: string
  pd_specifications?: string
  pd_material?: string
  pd_warranty?: string
  pd_assembly_required?: boolean
  pd_parent_sku?: string
  pd_type?: number
  pd_musthave?: boolean
  pd_bestseller?: boolean
  pd_salespromo?: boolean
  pd_manual_checkout_enabled?: boolean
  pd_verified?: boolean
  pd_status?: number
  pd_image?: string | null
  pd_images?: string[] | null
  pd_variants?: CreateProductVariantPayload[]
}

export interface CreateProductVariantPayload {
  pv_sku?: string
  pv_name?: string
  pv_color?: string
  pv_color_hex?: string
  pv_size?: string
  pv_style?: string
  pv_width?: number
  pv_dimension?: number
  pv_height?: number
  pv_price_srp?: number
  pv_price_dp?: number
  pv_price_member?: number
  pv_prodpv?: number
  pv_qty?: number
  pv_status?: number
  pv_images?: string[]
}

interface ProductsQueryParams {
  page?: number
  perPage?: number
  search?: string
  status?: string
  catId?: number
  roomType?: number
  brandType?: number
  supplierId?: number
}

interface ProductActivityLogsQueryParams {
  page?: number
  perPage?: number
  search?: string
  scope?: 'my' | 'all'
}

interface ZqCachedProductsQueryParams {
  page?: number
  perPage?: number
  search?: string
  brandType?: number
  sourceType?: string
  status?: string
  importStatus?: string
  localCategoryId?: number
  mappingStatus?: 'mapped' | 'unmapped' | 'missing'
}

const zqProductsApiBase = () => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/supplier')) {
    return '/api/supplier/products/zq'
  }

  return '/api/admin/products/zq'
}

const cleanParams = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )

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
      // keep fallback below
    }
    return [value]
  }

  return []
}

const getProductVariantKey = (variant: ProductVariant) => {
  return [
    variant.sku?.trim().toLowerCase() ?? '',
    variant.name?.trim().toLowerCase() ?? '',
    variant.color?.trim().toLowerCase() ?? '',
    variant.colorHex?.trim().toLowerCase() ?? '',
    variant.size?.trim().toLowerCase() ?? '',
    variant.style?.trim().toLowerCase() ?? '',
    String(variant.width ?? ''),
    String(variant.dimension ?? ''),
    String(variant.height ?? ''),
    String(variant.priceSrp ?? ''),
    String(variant.priceDp ?? ''),
    String(variant.priceMember ?? ''),
    String(variant.prodpv ?? ''),
    String(variant.qty ?? ''),
    String(variant.status ?? ''),
    variant.images?.join('|') ?? '',
  ].join('|')
}

const dedupeProductVariants = (variants: ProductVariant[]) =>
  Array.from(
    variants.reduce((map, variant) => {
      const key = getProductVariantKey(variant)
      if (!map.has(key)) {
        map.set(key, variant)
      }
      return map
    }, new Map<string, ProductVariant>()).values(),
  )

const getEffectiveProductQty = (variants: ProductVariant[], fallbackQty: number) => {
  const activeVariants = variants.filter((variant) => Number(variant.status ?? 1) === 1)

  if (activeVariants.length === 0) {
    return fallbackQty
  }

  return activeVariants.reduce((total, variant) => total + Number(variant.qty ?? 0), 0)
}

const dedupeImageUrls = (urls: string[]) => {
  const seen = new Set<string>()

  return urls
    .map((url) => url.trim())
    .filter((url) => {
      if (!url) return false
      const key = url.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export const normalizeProduct = (input: Product & Record<string, unknown>): Product => {
  const parsedImages = dedupeImageUrls(toStringArray(input.images ?? input.pd_images))
  const primaryImage = typeof input.image === 'string' && input.image.trim().length > 0
    ? input.image
    : (typeof input.pd_image === 'string' && input.pd_image.trim().length > 0 ? input.pd_image : null)

  const images = parsedImages.length > 0
    ? parsedImages
    : (primaryImage ? [primaryImage] : [])

  const rawVariants = Array.isArray(input.variants)
    ? input.variants
    : Array.isArray(input.pd_variants)
      ? input.pd_variants
      : []

  const parsedVariants = rawVariants.map((variant) => {
        const row = variant as ProductVariant & Record<string, unknown>
        return {
          id: typeof row.id === 'number' ? row.id : undefined,
          sku: typeof row.sku === 'string' ? row.sku : (typeof row.pv_sku === 'string' ? row.pv_sku : undefined),
          name: typeof row.name === 'string' ? row.name : (typeof row.pv_name === 'string' ? row.pv_name : undefined),
          color: typeof row.color === 'string' ? row.color : (typeof row.pv_color === 'string' ? row.pv_color : undefined),
          colorHex: typeof row.colorHex === 'string' ? row.colorHex : (typeof row.pv_color_hex === 'string' ? row.pv_color_hex : undefined),
          size: typeof row.size === 'string' ? row.size : (typeof row.pv_size === 'string' ? row.pv_size : undefined),
          style: typeof row.style === 'string' ? row.style : (typeof row.pv_style === 'string' ? row.pv_style : undefined),
          width: typeof row.width === 'number' ? row.width : (typeof row.width === 'string' ? Number(row.width) : (typeof row.pv_width === 'number' ? row.pv_width : (typeof row.pv_width === 'string' ? Number(row.pv_width) : undefined))),
          dimension: typeof row.dimension === 'number' ? row.dimension : (typeof row.dimension === 'string' ? Number(row.dimension) : (typeof row.pv_dimension === 'number' ? row.pv_dimension : (typeof row.pv_dimension === 'string' ? Number(row.pv_dimension) : undefined))),
          height: typeof row.height === 'number' ? row.height : (typeof row.height === 'string' ? Number(row.height) : (typeof row.pv_height === 'number' ? row.pv_height : (typeof row.pv_height === 'string' ? Number(row.pv_height) : undefined))),
          priceSrp: typeof row.priceSrp === 'number' ? row.priceSrp : (typeof row.priceSrp === 'string' ? Number(row.priceSrp) : (typeof row.pv_price_srp === 'number' ? row.pv_price_srp : (typeof row.pv_price_srp === 'string' ? Number(row.pv_price_srp) : undefined))),
          priceDp: typeof row.priceDp === 'number' ? row.priceDp : (typeof row.priceDp === 'string' ? Number(row.priceDp) : (typeof row.pv_price_dp === 'number' ? row.pv_price_dp : (typeof row.pv_price_dp === 'string' ? Number(row.pv_price_dp) : undefined))),
          priceMember: typeof row.priceMember === 'number' ? row.priceMember : (typeof row.priceMember === 'string' ? Number(row.priceMember) : (typeof row.pv_price_member === 'number' ? row.pv_price_member : (typeof row.pv_price_member === 'string' ? Number(row.pv_price_member) : undefined))),
          prodpv: typeof row.prodpv === 'number' ? row.prodpv : (typeof row.prodpv === 'string' ? Number(row.prodpv) : (typeof row.pv_prodpv === 'number' ? row.pv_prodpv : (typeof row.pv_prodpv === 'string' ? Number(row.pv_prodpv) : undefined))),
          qty: typeof row.qty === 'number' ? row.qty : (typeof row.qty === 'string' ? Number(row.qty) : (typeof row.pv_qty === 'number' ? row.pv_qty : (typeof row.pv_qty === 'string' ? Number(row.pv_qty) : undefined))),
          status: typeof row.status === 'number' ? row.status : (typeof row.status === 'string' ? Number(row.status) : (typeof row.pv_status === 'number' ? row.pv_status : (typeof row.pv_status === 'string' ? Number(row.pv_status) : undefined))),
          images: dedupeImageUrls(toStringArray(row.images ?? row.pv_images)),
        } satisfies ProductVariant
      })
  const uniqueVariants = dedupeProductVariants(parsedVariants)
  const fallbackQty =
    typeof input.qty === 'number'
      ? input.qty
      : (typeof input.pd_qty === 'number' ? input.pd_qty : (typeof input.pd_qty === 'string' ? Number(input.pd_qty) : 0))
  const effectiveQty = getEffectiveProductQty(uniqueVariants, fallbackQty)

  return {
    ...input,
    id: typeof input.id === 'number' ? input.id : Number(input.id ?? 0),
    supplierId:
      typeof input.supplierId === 'number'
        ? input.supplierId
        : (typeof input.pd_supplier === 'number' ? input.pd_supplier : (typeof input.pd_supplier === 'string' ? Number(input.pd_supplier) : 0)),
    supplierName: typeof input.supplierName === 'string' ? input.supplierName : null,
    name: typeof input.name === 'string' ? input.name : (typeof input.pd_name === 'string' ? input.pd_name : ''),
    specifications: typeof input.specifications === 'string' ? input.specifications : null,
    catid:
      typeof input.catid === 'number'
        ? input.catid
        : (typeof input.pd_catid === 'number' ? input.pd_catid : (typeof input.pd_catid === 'string' ? Number(input.pd_catid) : 0)),
    catsubid:
      typeof input.catsubid === 'number'
        ? input.catsubid
        : (typeof input.pd_catsubid === 'number' ? input.pd_catsubid : (typeof input.pd_catsubid === 'string' ? Number(input.pd_catsubid) : 0)),
    priceSrp:
      typeof input.priceSrp === 'number'
        ? input.priceSrp
        : (typeof input.pd_price_srp === 'number' ? input.pd_price_srp : (typeof input.pd_price_srp === 'string' ? Number(input.pd_price_srp) : 0)),
    priceDp:
      typeof input.priceDp === 'number'
        ? input.priceDp
        : (typeof input.pd_price_dp === 'number' ? input.pd_price_dp : (typeof input.pd_price_dp === 'string' ? Number(input.pd_price_dp) : 0)),
    priceMember:
      typeof input.priceMember === 'number'
        ? input.priceMember
        : (typeof input.pd_price_member === 'number' ? input.pd_price_member : (typeof input.pd_price_member === 'string' ? Number(input.pd_price_member) : undefined)),
    prodpv:
      typeof input.prodpv === 'number'
        ? input.prodpv
        : (typeof input.pd_prodpv === 'number' ? input.pd_prodpv : (typeof input.pd_prodpv === 'string' ? Number(input.pd_prodpv) : 0)),
    psweight:
      typeof input.psweight === 'number'
        ? input.psweight
        : (typeof input.pd_psweight === 'number' ? input.pd_psweight : (typeof input.pd_psweight === 'string' ? Number(input.pd_psweight) : undefined)),
    pslenght:
      typeof input.pslenght === 'number'
        ? input.pslenght
        : (typeof input.pd_pslenght === 'number' ? input.pd_pslenght : (typeof input.pd_pslenght === 'string' ? Number(input.pd_pslenght) : undefined)),
    psheight:
      typeof input.psheight === 'number'
        ? input.psheight
        : (typeof input.pd_psheight === 'number' ? input.pd_psheight : (typeof input.pd_psheight === 'string' ? Number(input.pd_psheight) : undefined)),
    roomType:
      typeof input.roomType === 'number'
        ? input.roomType
        : (typeof input.pd_room_type === 'number' ? input.pd_room_type : (typeof input.pd_room_type === 'string' ? Number(input.pd_room_type) : undefined)),
    brandType:
      typeof input.brandType === 'number'
        ? input.brandType
        : (typeof input.pd_brand_type === 'number' ? input.pd_brand_type : (typeof input.pd_brand_type === 'string' ? Number(input.pd_brand_type) : undefined)),
    brand:
      typeof input.brand === 'string'
        ? input.brand
        : (typeof input.brand_name === 'string'
          ? input.brand_name
          : (typeof (input as { brand?: { pb_name?: string; name?: string } }).brand === 'object'
            ? ((input as { brand?: { pb_name?: string; name?: string } }).brand?.pb_name
              ?? (input as { brand?: { pb_name?: string; name?: string } }).brand?.name
              ?? null)
            : null)),
    qty:
      effectiveQty,
    weight:
      typeof input.weight === 'number'
        ? input.weight
        : (typeof input.pd_weight === 'number' ? input.pd_weight : (typeof input.pd_weight === 'string' ? Number(input.pd_weight) : 0)),
    type:
      typeof input.type === 'number'
        ? input.type
        : (typeof input.pd_type === 'number' ? input.pd_type : (typeof input.pd_type === 'string' ? Number(input.pd_type) : 0)),
    musthave:
      typeof input.musthave === 'boolean'
        ? input.musthave
        : Boolean(input.pd_musthave),
    bestseller:
      typeof input.bestseller === 'boolean'
        ? input.bestseller
        : Boolean(input.pd_bestseller),
    salespromo:
      typeof input.salespromo === 'boolean'
        ? input.salespromo
        : Boolean(input.pd_salespromo),
    manualCheckoutEnabled:
      typeof input.manualCheckoutEnabled === 'boolean'
        ? input.manualCheckoutEnabled
        : Boolean(input.pd_manual_checkout_enabled),
    status:
      typeof input.status === 'number'
        ? input.status
        : (typeof input.pd_status === 'number' ? input.pd_status : (typeof input.pd_status === 'string' ? Number(input.pd_status) : 0)),
    sku:
      typeof input.sku === 'string'
        ? input.sku
        : (typeof input.pd_parent_sku === 'string' ? input.pd_parent_sku : ''),
    uploaderName: typeof input.uploaderName === 'string' ? input.uploaderName : null,
    uploaderEmail: typeof input.uploaderEmail === 'string' ? input.uploaderEmail : null,
    uploaderRole: typeof input.uploaderRole === 'string' ? input.uploaderRole : null,
    image: images[0] ?? primaryImage ?? null,
    images,
    variants: uniqueVariants,
    avgRating:
      typeof input.avgRating === 'number'
        ? input.avgRating
        : (typeof input.avg_rating === 'number'
          ? input.avg_rating
          : (typeof input.avg_rating === 'string'
            ? Number(input.avg_rating)
            : (typeof input.rating === 'number'
              ? input.rating
              : (typeof input.rating === 'string' ? Number(input.rating) : undefined)))),
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : (typeof (input as Record<string, unknown>).created_at === 'string' ? (input as Record<string, unknown>).created_at as string : null),
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : (typeof (input as Record<string, unknown>).updated_at === 'string' ? (input as Record<string, unknown>).updated_at as string : null),
  }
}

export const normalizeProductsResponse = (response: ProductsResponse | Record<string, unknown>): ProductsResponse => {
  const rawProducts = Array.isArray((response as ProductsResponse).products)
    ? (response as ProductsResponse).products
    : []
  const normalizedProducts = rawProducts.map((product) => normalizeProduct(product as Product & Record<string, unknown>))
  const uniqueProducts = Array.from(
    normalizedProducts.reduce((map, product) => {
      map.set(product.id, product)
      return map
    }, new Map<number, Product>()).values(),
  )

  return {
    ...(response as ProductsResponse),
    products: uniqueProducts,
  }
}

export const productsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getPublicProducts: builder.query<ProductsResponse, ProductsQueryParams | void>({
      query: (params) => ({
        url: '/api/products',
        method: 'GET',
        cache: 'no-store',
        params: cleanParams({
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 25,
          q: params?.search,
          search: params?.search,
          status: params?.status,
          cat_id: params?.catId,
          room_type: params?.roomType,
          brand_type: params?.brandType,
          supplier_id: params?.supplierId,
        }),
      }),
      transformResponse: (response: ProductsResponse) => normalizeProductsResponse(response),
      providesTags: ['Products'],
    }),
    getPublicProduct: builder.query<Product, number>({
      query: (id) => ({
        url: `/api/products/${id}`,
        method: 'GET',
        cache: 'no-store',
      }),
      transformResponse: (response: PublicProductResponse | Product) => {
        const rawProduct = 'product' in response ? response.product : response
        return normalizeProduct(rawProduct as Product & Record<string, unknown>)
      },
      providesTags: ['Products'],
    }),
    getPublicZqProducts: builder.query<ZqCachedProductsResponse, Pick<ZqCachedProductsQueryParams, 'page' | 'perPage' | 'search' | 'brandType' | 'localCategoryId'> | void>({
      query: (params) => ({
        url: '/api/products/zq/cached',
        method: 'GET',
        cache: 'no-store',
        params: cleanParams({
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 20,
          search: params?.search,
          brand_type: params?.brandType,
          local_category_id: params?.localCategoryId,
        }),
      }),
      providesTags: ['Products'],
    }),
    getPublicZqProduct: builder.query<ZqPublicProductResponse['product'], number>({
      query: (id) => ({
        url: `/api/products/zq/cached/${id}`,
        method: 'GET',
        cache: 'no-store',
      }),
      transformResponse: (response: ZqPublicProductResponse) => response.product,
      providesTags: ['Products'],
    }),
    getProductReviews: builder.query<ProductReviewsResponse, number>({
      query: (id) => ({
        url: `/api/products/${id}/reviews`,
        method: 'GET',
      }),
      providesTags: ['Products'],
    }),
    getProductBrand: builder.query<ProductBrandInfo, number>({
      query: (id) => ({
        url: `/api/products/${id}/brand`,
        method: 'GET',
      }),
      transformResponse: (response: {
        brand?: Record<string, unknown>
        supplier_user?: Record<string, unknown>
        overall_rating?: number | null
        total_reviews?: number
        total_products?: number
      }) => {
        const brand = response.brand || {};
        const supplierUser = response.supplier_user || {};
        return {
          ...brand,
          joinedDate: typeof supplierUser.joined_date === 'string' ? supplierUser.joined_date : undefined,
          overallRating: response.overall_rating,
          totalReviews: response.total_reviews,
          totalProducts: response.total_products,
        } as ProductBrandInfo;
      },
      providesTags: ['Products'],
    }),
    heartbeatProductViewer: builder.mutation<ProductViewerHeartbeatResponse, { productId: number; viewerId?: string }>({
      query: ({ productId, viewerId }) => ({
        url: `/api/products/${productId}/viewers/heartbeat`,
        method: 'POST',
        body: cleanParams({
          viewer_id: viewerId,
        }),
      }),
    }),
    getProducts: builder.query<ProductsResponse, ProductsQueryParams | void>({
      query: (params) => ({
        url: '/api/admin/products',
        method: 'GET',
        cache: 'no-store',
        params: cleanParams({
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 25,
          q: params?.search,
          search: params?.search,
          status: params?.status,
          cat_id: params?.catId,
          room_type: params?.roomType,
          brand_type: params?.brandType,
          supplier_id: params?.supplierId,
        }),
      }),
      transformResponse: (response: ProductsResponse) => normalizeProductsResponse(response),
      providesTags: ['Products'],
    }),
    getProductActivityLogs: builder.query<ProductActivityLogsResponse, ProductActivityLogsQueryParams | void>({
      query: (params) => ({
        url: '/api/admin/products/activity-logs',
        method: 'GET',
        cache: 'no-store',
        params: {
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 20,
          search: params?.search,
          scope: params?.scope ?? 'my',
        },
      }),
      providesTags: ['Products'],
    }),
    createProduct: builder.mutation<{ message: string; product: Partial<Product> }, CreateProductPayload>({
      query: (body) => ({
        url: '/api/admin/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Products'],
    }),
    bulkImportProducts: builder.mutation<BulkImportProductsResponse, BulkImportProductsPayload>({
      query: (body) => ({
        url: '/api/admin/products/import',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Products'],
    }),
    bulkImportProductsWithVariants: builder.mutation<BulkImportProductsResponse, BulkImportProductsPayload>({
      query: (body) => ({
        url: '/api/admin/products/import-with-variants',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Products'],
    }),
    bulkPricePreview: builder.mutation<BulkPricePreviewResponse, { rows: BulkPriceRow[] }>({
      query: (body) => ({
        url: '/api/admin/products/bulk-price/preview',
        method: 'POST',
        body,
      }),
    }),
    bulkPriceApply: builder.mutation<BulkPriceApplyResponse, { rows: BulkPriceRow[] }>({
      query: (body) => ({
        url: '/api/admin/products/bulk-price/apply',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Products'],
    }),
    bulkUpdatePreview: builder.mutation<BulkUpdatePreviewResponse, { rows: BulkUpdateRow[] }>({
      query: (body) => ({
        url: '/api/admin/products/bulk-update/preview',
        method: 'POST',
        body,
      }),
    }),
    bulkUpdateApply: builder.mutation<BulkUpdateApplyResponse, { rows: BulkUpdateRow[] }>({
      query: (body) => ({
        url: '/api/admin/products/bulk-update/apply',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Products'],
    }),
    manualCheckoutApply: builder.mutation<ManualCheckoutApplyResponse, { product_ids: number[]; enabled?: boolean }>({
      query: (body) => ({
        url: '/api/admin/products/manual-checkout/apply',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Products'],
    }),
    fetchZqImportPreview: builder.mutation<ZqImportPreviewResponse, ZqImportPreviewPayload | void>({
      query: (body) => ({
        url: `${zqProductsApiBase()}/fetch-preview`,
        method: 'POST',
        body: body
          ? (() => {
              const { resumeFromSaved, resetCursor, ...rest } = body
              return {
                ...rest,
                resume_from_saved: resumeFromSaved,
                reset_cursor: resetCursor,
              }
            })()
          : {},
      }),
    }),
    importZqProducts: builder.mutation<ZqImportProductsResponse, { ids: string[] }>({
      query: (body) => ({
        url: '/api/admin/products/zq/import',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Products'],
    }),
    fetchZqImportDetail: builder.mutation<ZqImportDetailResponse, string | number>({
      query: (id) => ({
        url: `${zqProductsApiBase()}/detail/${id}`,
        method: 'GET',
      }),
    }),
    getZqCachedProducts: builder.query<ZqCachedProductsResponse, ZqCachedProductsQueryParams | void>({
      query: (params) => ({
        url: `${zqProductsApiBase()}/cached`,
        method: 'GET',
        cache: 'no-store',
        params: cleanParams({
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 20,
          search: params?.search,
          brand_type: params?.brandType,
          source_type: params?.sourceType,
          status: params?.status,
          import_status: params?.importStatus,
          local_category_id: params?.localCategoryId,
          mapping_status: params?.mappingStatus,
        }),
      }),
      providesTags: ['Products'],
    }),
    getZqProductsSummary: builder.query<ZqProductsSummaryResponse, void>({
      query: () => ({
        url: `${zqProductsApiBase()}/summary`,
        method: 'GET',
        cache: 'no-store',
      }),
      providesTags: ['Products'],
    }),
    syncZqProducts: builder.mutation<ZqSyncProductsResponse, ZqSyncProductsPayload | void>({
      query: (body) => ({
        url: `${zqProductsApiBase()}/sync`,
        method: 'POST',
        body: body
          ? (() => {
              const { resumeFromSaved, resetCursor, ...rest } = body
              return {
                ...rest,
                resume_from_saved: resumeFromSaved,
                reset_cursor: resetCursor,
              }
            })()
          : {},
      }),
      invalidatesTags: ['Products'],
    }),
    importZqToLocal: builder.mutation<ImportZqToLocalResponse, string>({
      query: (externalId) => ({
        url: `${zqProductsApiBase()}/import-to-local/${externalId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Products'],
    }),
    getZqCategoryMappings: builder.query<ZqCategoryMappingsResponse, void>({
      query: () => ({
        url: `${zqProductsApiBase()}/category-mappings`,
        method: 'GET',
        cache: 'no-store',
      }),
      providesTags: ['Products'],
    }),
    upsertZqCategoryMapping: builder.mutation<UpsertZqCategoryMappingResponse, UpsertZqCategoryMappingPayload>({
      query: (body) => ({
        url: `${zqProductsApiBase()}/category-mappings`,
        method: 'POST',
        body: {
          zq_category_id: body.zqCategoryId,
          zq_category_name: body.zqCategoryName,
          local_category_id: body.localCategoryId,
        },
      }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation<{ message: string; product?: Product }, { id: number; data: Partial<CreateProductPayload> }>({
      query: ({ id, data }) => ({
        url: `/api/admin/products/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: { message: string; product?: Product | Record<string, unknown> }) => ({
        ...response,
        product: response.product ? normalizeProduct(response.product as Product & Record<string, unknown>) : undefined,
      }),
      invalidatesTags: ['Products'],
    }),
    deleteProduct: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/api/admin/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products'],
    }),
  }),
})

export const {
  useGetPublicProductsQuery,
  useLazyGetPublicProductQuery,
  useGetPublicZqProductsQuery,
  useGetPublicZqProductQuery,
  useGetProductReviewsQuery,
  useGetProductBrandQuery,
  useHeartbeatProductViewerMutation,
  useGetProductsQuery,
  useLazyGetProductsQuery,
  useGetProductActivityLogsQuery,
  useCreateProductMutation,
  useBulkImportProductsMutation,
  useBulkImportProductsWithVariantsMutation,
  useBulkPricePreviewMutation,
  useBulkPriceApplyMutation,
  useBulkUpdatePreviewMutation,
  useBulkUpdateApplyMutation,
  useManualCheckoutApplyMutation,
  useFetchZqImportPreviewMutation,
  useImportZqProductsMutation,
  useFetchZqImportDetailMutation,
  useGetZqCachedProductsQuery,
  useGetZqProductsSummaryQuery,
  useSyncZqProductsMutation,
  useImportZqToLocalMutation,
  useGetZqCategoryMappingsQuery,
  useUpsertZqCategoryMappingMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi
