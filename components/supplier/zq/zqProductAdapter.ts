import type { ZqImportDetailData } from '@/components/superAdmin/products/ZqProductPreviewPage'

export type ZqDisplayVariant = {
  id: string
  label: string
  sku: string | null
  image: string | null
  price: number | null
  compareAtPrice: number | null
  stock: number
  attributes: string[]
}

export type ZqDisplayProduct = {
  id: string
  name: string
  brand: string
  category: string
  image: string | null
  images: string[]
  price: number | null
  compareAtPrice: number | null
  stock: number
  variantCount: number
  variants: ZqDisplayVariant[]
  description: string
  status: string | null
  sourceType: string | null
}

export const stripZqHtml = (value: string | null | undefined) => {
  if (!value) return ''

  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

export const formatZqMoney = (cents: number | null | undefined) => {
  if (typeof cents !== 'number' || Number.isNaN(cents)) return 'Price pending'
  return `PHP ${(cents / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const adaptZqDetailToDisplayProduct = (detail: ZqImportDetailData): ZqDisplayProduct => {
  const variants = detail.specs.map((spec, index): ZqDisplayVariant => {
    const attributes = spec.attributes
      .map((attribute) => attribute.value)
      .filter((value): value is string => Boolean(value))

    return {
      id: spec.id || `${detail.id}-${index}`,
      label: spec.spec || attributes.join(' / ') || `Variant ${index + 1}`,
      sku: spec.skuId,
      image: spec.image || spec.attributes.find((attribute) => attribute.skuImageUrl)?.skuImageUrl || null,
      price: spec.salesPrice,
      compareAtPrice: spec.cost,
      stock: Number(spec.amountOnSale ?? 0),
      attributes,
    }
  })

  const firstPricedVariant = variants.find((variant) => typeof variant.price === 'number') ?? variants[0]
  const image = detail.images[0] ?? variants.find((variant) => variant.image)?.image ?? null

  return {
    id: detail.id,
    name: detail.subject || detail.subjectCn || 'Untitled Global Supplier product',
    brand: detail.sourceType || 'AF HOME GLOBAL SUPPLIER',
    category: detail.categoryName || 'Unmapped Global Supplier category',
    image,
    images: detail.images.length > 0 ? detail.images : variants.map((variant) => variant.image).filter((item): item is string => Boolean(item)),
    price: firstPricedVariant?.price ?? null,
    compareAtPrice: firstPricedVariant?.compareAtPrice ?? null,
    stock: variants.reduce((sum, variant) => sum + variant.stock, 0),
    variantCount: variants.length,
    variants,
    description: stripZqHtml(detail.description),
    status: detail.status,
    sourceType: detail.sourceType,
  }
}
