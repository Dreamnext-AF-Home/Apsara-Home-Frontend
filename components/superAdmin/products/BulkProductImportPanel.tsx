'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BulkImportProductsPayload, BulkImportProductsResponse, BulkImportProductsRow, CreateProductVariantPayload, Product, useBulkImportProductsMutation, useLazyGetProductsQuery } from '@/store/api/productsApi'
import { useGetCategoriesQuery } from '@/store/api/categoriesApi'
import { useGetProductBrandsQuery } from '@/store/api/productBrandsApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import { ROOM_OPTIONS } from '@/libs/roomConfig'

interface BulkProductImportPanelProps {
  onClose: () => void
  onImported?: () => void
}

type ParsedCsv = {
  headers: string[]
  rows: BulkImportProductsRow[]
  isVariantSheet: boolean
}

type ParsedSuccess = ParsedCsv & { rawRows: BulkImportProductsRow[] }

const PRODUCT_REQUIRED_COLUMNS = ['pd_name', 'pd_catid', 'pd_price_srp']
const VARIANT_REQUIRED_COLUMNS = ['pd_parent_sku', 'pv_sku']
const OPTIONAL_COLUMNS = [
  'pd_parent_sku',
  'pd_brand_type',
  'pd_room_type',
  'pd_price_dp',
  'pd_price_member',
  'pd_prodpv',
  'pd_pricing_tier',
  'pd_reversed_pv_multiplier',
  'pd_qty',
  'pd_weight',
  'pd_psweight',
  'pd_pswidth',
  'pd_pslenght',
  'pd_psheight',
  'pd_description',
  'pd_specifications',
  'pd_material',
  'pd_warranty',
  'pd_image',
  'pd_images',
  'pd_type',
  'pd_status',
  'pd_musthave',
  'pd_bestseller',
  'pd_salespromo',
  'pd_assembly_required',
  'pd_verified',
]

const IMPORT_COLUMNS = [...PRODUCT_REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS]
const HEADER_ALIASES: Record<string, string> = {
  'product name': 'pd_name',
  'parent sku': 'pd_parent_sku',
  'main product sku': 'pd_parent_sku',
  'main product name': 'pd_name',
  'category': 'pd_catid',
  'category id': 'pd_catid',
  'room type': 'pd_room_type',
  'brand': 'pd_brand_type',
  'brand type': 'pd_brand_type',
  'price srp': 'pd_price_srp',
  'srp price': 'pd_price_srp',
  'price dp': 'pd_price_dp',
  'dp price': 'pd_price_dp',
  'price member': 'pd_price_member',
  'member price': 'pd_price_member',
  'product pv': 'pd_prodpv',
  'product pv (auto)': 'pd_prodpv',
  'pv pricing tier': 'pd_pricing_tier',
  'pricing tier': 'pd_pricing_tier',
  'pv multiplier': 'pd_reversed_pv_multiplier',
  'reversed pv multiplier': 'pd_reversed_pv_multiplier',
  'reversed pv multiplier (auto)': 'pd_reversed_pv_multiplier',
  'quantity': 'pd_qty',
  'weight': 'pd_weight',
  'package weight': 'pd_psweight',
  'package width': 'pd_pswidth',
  'pacakge width': 'pd_pswidth',
  'package length': 'pd_pslenght',
  'package height': 'pd_psheight',
  'description': 'pd_description',
  'specifications': 'pd_specifications',
  'material': 'pd_material',
  'warranty': 'pd_warranty',
  'image': 'pd_image',
  'images': 'pd_images',
  'product type': 'pd_type',
  'status': 'pd_status',
  'must have': 'pd_musthave',
  'best seller': 'pd_bestseller',
  'sales promo': 'pd_salespromo',
  'assembly required': 'pd_assembly_required',
  'verified': 'pd_verified',
  'variant sku': 'pv_sku',
  'variant name': 'pv_name',
  'variant color': 'pv_color',
  'color name': 'pv_color',
  'variant color hex': 'pv_color_hex',
  'color hex': 'pv_color_hex',
  'variant size': 'pv_size',
  'variant style': 'pv_style',
  'variant width': 'pv_width',
  'variant dimension': 'pv_dimension',
  'variant height': 'pv_height',
  'variant price srp': 'pv_price_srp',
  'variant price dp': 'pv_price_dp',
  'variant price member': 'pv_price_member',
  'variant pv': 'pv_prodpv',
  'variant pv (auto)': 'pv_prodpv',
  'variant qty': 'pv_qty',
  'variant status': 'pv_status',
  'variant images': 'pv_images',
}
const PREVIEW_COLUMNS = [
  'pd_name',
  'pd_parent_sku',
  'pd_catid',
  'pd_room_type',
  'pd_brand_type',
  'pd_price_srp',
  'pd_price_dp',
  'pd_price_member',
  'pd_prodpv',
  'pd_pricing_tier',
  'pd_reversed_pv_multiplier',
  'pd_qty',
  'pd_weight',
  'pd_psweight',
  'pd_pswidth',
  'pd_pslenght',
  'pd_psheight',
  'pd_description',
  'pd_specifications',
  'pd_material',
  'pd_warranty',
  'pd_images',
  'pd_type',
  'pd_status',
  'pd_musthave',
  'pd_bestseller',
  'pd_salespromo',
  'pd_assembly_required',
  'pd_verified',
]

const VARIANT_PREVIEW_COLUMNS = [
  'pd_parent_sku',
  'pd_name',
  'pd_catid',
  'pd_room_type',
  'pd_brand_type',
  'pd_price_srp',
  'pd_price_dp',
  'pd_price_member',
  'pd_prodpv',
  'pd_pricing_tier',
  'pd_reversed_pv_multiplier',
  'pd_qty',
  'pd_weight',
  'pd_psweight',
  'pd_pswidth',
  'pd_pslenght',
  'pd_psheight',
  'pd_description',
  'pd_specifications',
  'pd_material',
  'pd_warranty',
  'pd_images',
  'pd_type',
  'pd_status',
  'pd_musthave',
  'pd_bestseller',
  'pd_salespromo',
  'pd_assembly_required',
  'pd_verified',
  'pv_sku',
  'pv_name',
  'pv_color',
  'pv_color_hex',
  'pv_size',
  'pv_style',
  'pv_width',
  'pv_dimension',
  'pv_height',
  'pv_price_srp',
  'pv_price_dp',
  'pv_price_member',
  'pv_prodpv',
  'pv_qty',
  'pv_status',
  'pv_images',
]

const REQUIRED_IMPORT_FIELDS = ['pd_name', 'pd_catid', 'pd_price_srp', 'pd_parent_sku', 'pd_type']

const PRICE_COLUMNS = new Set([
  'pd_price_srp', 'pd_price_dp', 'pd_price_member',
  'pd_prodpv', 'pd_reversed_pv_multiplier',
  'pd_qty', 'pd_weight', 'pd_psweight', 'pd_pswidth', 'pd_pslenght', 'pd_psheight',
  'pv_price_srp', 'pv_price_dp', 'pv_price_member', 'pv_prodpv', 'pv_qty',
])

const BOOLEAN_COLUMNS = new Set([
  'pd_musthave', 'pd_bestseller', 'pd_salespromo', 'pd_assembly_required', 'pd_verified',
])

const normalizeBoolean = (val: string): string => {
  const lower = val.toLowerCase().trim()
  if (['yes', 'true', 'y', '1', 'active'].includes(lower)) return '1'
  if (['no', 'false', 'n', '0', 'inactive'].includes(lower)) return '0'
  return val
}

const normalizeWord = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')

const normalizeHeader = (value: string) => normalizeWord(value)

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value)

const plainTextToHtml = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (looksLikeHtml(trimmed)) return trimmed

  const lines = trimmed.split(/\r?\n/)
  const blocks: string[] = []
  let listItems: string[] = []
  let paragraphLines: string[] = []

  const flushParagraph = () => {
    const text = paragraphLines.join(' ').trim()
    if (text) blocks.push(`<p>${escapeHtml(text)}</p>`)
    paragraphLines = []
  }

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push(`<ul>${listItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`)
      listItems = []
    }
  }

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (!trimmedLine) {
      flushParagraph()
      flushList()
      continue
    }

    if (/^[-*•]\s+/.test(trimmedLine)) {
      flushParagraph()
      listItems.push(trimmedLine.replace(/^[-*•]\s+/, ''))
      continue
    }

    flushList()
    paragraphLines.push(trimmedLine)
  }

  flushParagraph()
  flushList()

  return blocks.join('')
}

const normalizeStatus = (val: string): string => {
  const lower = normalizeWord(val)
  if (['active', 'published', 'live', '1'].includes(lower)) return '1'
  if (['inactive', 'draft', 'unpublished', '0'].includes(lower)) return '0'
  return val
}

const normalizeVariantStatus = (val: string): string => {
  const lower = normalizeWord(val)
  if (['active', 'published', 'live', '1'].includes(lower)) return '1'
  if (['inactive', 'draft', 'unpublished', '0'].includes(lower)) return '0'
  return val
}

const normalizeProductType = (val: string): string => {
  const lower = normalizeWord(val)
  if (['simple', '0'].includes(lower)) return '0'
  if (['variable', 'variant', 'variants', 'has variant', 'has variants', '1'].includes(lower)) return '1'
  return val
}

const normalizeRoomType = (val: string): string => {
  const trimmed = val.trim()
  if (!trimmed || /^\d+$/.test(trimmed)) return trimmed

  const normalized = normalizeWord(trimmed)
  const exactMatch = ROOM_OPTIONS.find((room) => normalizeWord(room.label) === normalized || normalizeWord(room.slug) === normalized)
  if (exactMatch) return String(exactMatch.id)

  const partialMatch = ROOM_OPTIONS.find((room) => {
    const label = normalizeWord(room.label)
    const slug = normalizeWord(room.slug)
    return label.includes(normalized) || normalized.includes(label) || slug.includes(normalized) || normalized.includes(slug)
  })

  return partialMatch ? String(partialMatch.id) : trimmed
}

const normalizeLookupValue = (
  val: string,
  lookup: Array<{ id: number; name: string }>,
): string => {
  const trimmed = val.trim()
  if (!trimmed || /^\d+$/.test(trimmed)) return trimmed

  // Try exact case-sensitive match first
  const exactCaseMatch = lookup.find((item) => item.name === trimmed)
  if (exactCaseMatch) return String(exactCaseMatch.id)

  // Fall back to normalized (case-insensitive) match
  const normalized = normalizeWord(trimmed)
  const normalizedMatch = lookup.find((item) => normalizeWord(item.name) === normalized)
  if (normalizedMatch) return String(normalizedMatch.id)

  // Try partial match as last resort
  const partialMatch = lookup.find((item) => {
    const name = normalizeWord(item.name)
    return name.includes(normalized) || normalized.includes(name)
  })

  return partialMatch ? String(partialMatch.id) : trimmed
}

const normalizeRow = (row: Record<string, string>): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const [key, raw] of Object.entries(row)) {
    let val = raw
    if (PRICE_COLUMNS.has(key)) {
      val = val.replace(/,/g, '')
    } else if (BOOLEAN_COLUMNS.has(key)) {
      val = normalizeBoolean(val)
    } else if (key === 'pd_status') {
      val = normalizeStatus(val)
    } else if (key === 'pv_status') {
      val = normalizeVariantStatus(val)
    } else if (key === 'pd_type') {
      val = normalizeProductType(val)
    } else if (key === 'pd_room_type') {
      val = normalizeRoomType(val)
    } else if (key === 'pd_description') {
      val = plainTextToHtml(val)
    }
    result[key] = val
  }
  return result
}

const getFieldSummary = (row: Record<string, unknown>, fields: string[]) =>
  fields.map((field) => ({
    field,
    value: row[field],
    present: row[field] !== undefined && row[field] !== null && String(row[field]).trim() !== '',
  }))

const parseImageList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((url): url is string => typeof url === 'string' && url.trim().length > 0).map((url) => url.trim())
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return value.split('|').map((url) => url.trim()).filter(Boolean)
  }

  return []
}

const isNumericLike = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'string') return false
  return value.trim() !== '' && Number.isFinite(Number(value))
}

const getValueType = (value: unknown) => {
  if (Array.isArray(value)) return 'array'
  if (value === null) return 'null'
  return typeof value
}

const buildPayloadChecklist = (payload: BulkImportProductsPayload) => {
  const rows = payload.rows ?? []
  const firstRow = rows[0] as Record<string, unknown> | undefined
  const firstVariant = Array.isArray(firstRow?.pd_variants) ? (firstRow?.pd_variants[0] as Record<string, unknown> | undefined) : undefined

  return [
    {
      label: 'Rows included',
      ok: rows.length > 0,
      detail: `${rows.length} row(s)`,
    },
    {
      label: 'Parent SKU present',
      ok: Boolean(String(firstRow?.pd_parent_sku ?? '').trim()),
      detail: String(firstRow?.pd_parent_sku ?? 'missing'),
    },
    {
      label: 'Product type numeric',
      ok: isNumericLike(firstRow?.pd_type),
      detail: String(firstRow?.pd_type ?? 'missing'),
    },
    {
      label: 'Category numeric',
      ok: isNumericLike(firstRow?.pd_catid),
      detail: String(firstRow?.pd_catid ?? 'missing'),
    },
    {
      label: 'Price numeric',
      ok: isNumericLike(firstRow?.pd_price_srp),
      detail: String(firstRow?.pd_price_srp ?? 'missing'),
    },
    {
      label: 'Product images array',
      ok: Array.isArray(firstRow?.pd_images),
      detail: Array.isArray(firstRow?.pd_images)
        ? `${(firstRow?.pd_images as unknown[]).length} image(s)`
        : String(firstRow?.pd_images ?? 'missing'),
    },
    {
      label: 'Variants nested',
      ok: Array.isArray(firstRow?.pd_variants) && (firstRow?.pd_variants as unknown[]).length > 0,
      detail: Array.isArray(firstRow?.pd_variants) ? `${(firstRow?.pd_variants as unknown[]).length} variant(s)` : 'missing',
    },
    {
      label: 'Variant SKU present',
      ok: Boolean(String(firstVariant?.pv_sku ?? '').trim()),
      detail: String(firstVariant?.pv_sku ?? 'missing'),
    },
    {
      label: 'Variant status numeric',
      ok: isNumericLike(firstVariant?.pv_status),
      detail: String(firstVariant?.pv_status ?? 'missing'),
    },
  ]
}

const compareField = (csvVal: unknown, dbVal: unknown, isNumeric = false): boolean => {
  const csv = csvVal !== undefined && csvVal !== null ? String(csvVal).trim() : ''
  if (csv === '') return true // blank = not overriding, treat as unchanged
  if (isNumeric) return Number(csv) === Number(dbVal ?? 0)
  return csv === String(dbVal ?? '').trim()
}

const isProductRowUnchanged = (row: BulkImportProductsRow, existing: Product): boolean =>
  compareField(row.pd_name, existing.name) &&
  compareField(row.pd_catid, existing.catid, true) &&
  compareField(row.pd_price_srp, existing.priceSrp, true) &&
  compareField(row.pd_price_dp, existing.priceDp, true) &&
  compareField(row.pd_price_member, existing.priceMember, true) &&
  compareField(row.pd_prodpv, existing.prodpv, true) &&
  compareField(row.pd_qty, existing.qty, true) &&
  compareField(row.pd_weight, existing.weight, true) &&
  compareField(row.pd_room_type, existing.roomType, true) &&
  compareField(row.pd_brand_type, existing.brandType, true) &&
  compareField(row.pd_status, existing.status, true) &&
  compareField(row.pd_type, existing.type, true) &&
  compareField(row.pd_musthave, existing.musthave ? 1 : 0, true) &&
  compareField(row.pd_bestseller, existing.bestseller ? 1 : 0, true) &&
  compareField(row.pd_salespromo, existing.salespromo ? 1 : 0, true) &&
  compareField(row.pd_assembly_required, existing.assemblyRequired ? 1 : 0, true) &&
  compareField(row.pd_verified, existing.verified ? 1 : 0, true) &&
  compareField(row.pd_material, existing.material) &&
  compareField(row.pd_warranty, existing.warranty)

const detectDelimiter = (line: string) => {
  const candidates = [',', '\t', ';']
  let best = ','
  let maxCount = -1

  for (const candidate of candidates) {
    const count = (line.match(new RegExp(`\\${candidate}`, 'g')) ?? []).length
    if (count > maxCount) {
      best = candidate
      maxCount = count
    }
  }

  return best
}

const parseCsvLine = (line: string, delimiter: string) => {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values.map((value) => value.replace(/^"|"$/g, '').trim())
}

const normalizeCsvValues = (headers: string[], values: string[]) => {
  if (values.length <= headers.length) {
    return values
  }

  const normalized: string[] = []
  let valueIndex = 0

  for (let headerIndex = 0; headerIndex < headers.length; headerIndex += 1) {
    const header = headers[headerIndex]
    const remainingHeaders = headers.length - headerIndex - 1
    const remainingValues = values.length - valueIndex

    if (remainingValues <= remainingHeaders + 1) {
      normalized.push(values[valueIndex] ?? '')
      valueIndex += 1
      continue
    }

    if (PRICE_COLUMNS.has(header)) {
      const tokensToKeep = Math.max(1, remainingValues - remainingHeaders)
      normalized.push(values.slice(valueIndex, valueIndex + tokensToKeep).join(','))
      valueIndex += tokensToKeep
      continue
    }

    normalized.push(values[valueIndex] ?? '')
    valueIndex += 1
  }

  while (normalized.length < headers.length) {
    normalized.push('')
  }

  return normalized
}

const parseCsvText = (text: string): ParsedCsv => {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one product row.')
  }

  const delimiter = detectDelimiter(lines[0])
  const rawHeaders = parseCsvLine(lines[0], delimiter).map((header) => header.trim())
  const headers = rawHeaders.map((header) => HEADER_ALIASES[normalizeHeader(header)] ?? header)
  const isVariantSheet =
    headers.includes('pv_sku') ||
    headers.includes('pv_name') ||
    headers.includes('pv_style') ||
    headers.includes('pv_size') ||
    headers.includes('pv_images')

  const requiredColumns = isVariantSheet ? VARIANT_REQUIRED_COLUMNS : PRODUCT_REQUIRED_COLUMNS
  const missing = requiredColumns.filter((column) => !headers.includes(column))
  if (missing.length > 0) {
    throw new Error(`Missing required column(s): ${missing.join(', ')}`)
  }

  // Propagate pd_parent_sku to variant-only rows where the user left it blank
  // (common in spreadsheets: first row has name/sku/category, subsequent variant rows don't)
  let lastParentSku = ''

  const rows = lines.slice(1).map((line) => {
    const values = normalizeCsvValues(headers, parseCsvLine(line, delimiter))
    const raw: Record<string, string> = {}
    headers.forEach((header, index) => {
      raw[header] = values[index] ?? ''
    })
    return normalizeRow(raw)
  }).map((row) => {
    const sku = (row.pd_parent_sku ?? '').trim()
    if (sku) {
      lastParentSku = sku
      return row
    }
    // Variant row with no parent SKU — inherit from the last seen product row
    if ((row.pv_sku ?? '').trim() && lastParentSku) {
      return { ...row, pd_parent_sku: lastParentSku }
    }
    return row
  }).filter((row) => {
    // Skip rows that have no product info AND no variant SKU — these are truly blank rows
    const name = (row.pd_name ?? '').trim()
    const sku = (row.pd_parent_sku ?? '').trim()
    const variantSku = (row.pv_sku ?? '').trim()
    return name !== '' || sku !== '' || variantSku !== ''
  })

  return { headers: headers.filter((header) => IMPORT_COLUMNS.includes(header)), rows, isVariantSheet }
}

const rowHasVariantData = (row: Record<string, string>) =>
  (row.pv_sku ?? '').trim() !== ''

const extractVariant = (row: Record<string, string>): CreateProductVariantPayload => ({
  pv_sku: row.pv_sku?.trim() || undefined,
  pv_name: row.pv_name?.trim() || undefined,
  pv_color: row.pv_color?.trim() || undefined,
  pv_color_hex: row.pv_color_hex?.trim() || undefined,
  pv_size: row.pv_size?.trim() || undefined,
  pv_style: row.pv_style?.trim() || '',
  pv_width: row.pv_width?.trim() ? Number(row.pv_width) : 0,
  pv_dimension: row.pv_dimension?.trim() ? Number(row.pv_dimension) : 0,
  pv_height: row.pv_height?.trim() ? Number(row.pv_height) : 0,
  pv_price_srp: row.pv_price_srp?.trim() ? Number(row.pv_price_srp) : undefined,
  pv_price_dp: row.pv_price_dp?.trim() ? Number(row.pv_price_dp) : undefined,
  pv_price_member: row.pv_price_member?.trim() ? Number(row.pv_price_member) : undefined,
  pv_prodpv: row.pv_prodpv?.trim() ? Number(row.pv_prodpv) : undefined,
  pv_qty: row.pv_qty?.trim() ? Number(row.pv_qty) : undefined,
  pv_status: row.pv_status?.trim() ? Number(normalizeVariantStatus(row.pv_status)) : undefined,
  pv_images: row.pv_images?.trim() ? row.pv_images.split('|').map((u) => u.trim()).filter(Boolean) : undefined,
})

const groupVariantRows = (rows: BulkImportProductsRow[]): BulkImportProductsRow[] => {
  const skuMap = new Map<string, BulkImportProductsRow>()
  const noSkuRows: BulkImportProductsRow[] = []
  const ordered: string[] = []

  const variantFlatFields = [
    'pv_sku', 'pv_name', 'pv_color', 'pv_color_hex', 'pv_size', 'pv_style',
    'pv_width', 'pv_dimension', 'pv_height', 'pv_price_srp', 'pv_price_dp',
    'pv_price_member', 'pv_prodpv', 'pv_qty', 'pv_status', 'pv_images'
  ]

  for (const row of rows) {
    const rawRow = row as Record<string, string>
    const sku = (row.pd_parent_sku ?? '').trim()

    if (!sku) {
      noSkuRows.push(row)
      continue
    }

    if (!skuMap.has(sku)) {
      ordered.push(sku)
      skuMap.set(sku, { ...row, pd_variants: [] })
    }

    if (rowHasVariantData(rawRow)) {
      const parent = skuMap.get(sku)!
      parent.pd_variants = [...(parent.pd_variants ?? []), extractVariant(rawRow)]
      if ((parent.pd_variants?.length ?? 0) > 0) {
        parent.pd_type = 1
      }
    }
  }

  const grouped = ordered.map((sku) => {
    const row = skuMap.get(sku)!
    const srp = Number(row.pd_price_srp)
    if (!Number.isFinite(srp) || srp <= 0) {
      const variantPrices = (row.pd_variants ?? [])
        .map((v) => Number(v.pv_price_srp))
        .filter((n) => Number.isFinite(n) && n > 0)
      if (variantPrices.length > 0) {
        row.pd_price_srp = String(Math.min(...variantPrices))
      }
    }
    
    // Remove flat variant fields after grouping to avoid confusing the backend
    if (row.pd_variants && row.pd_variants.length > 0) {
      variantFlatFields.forEach((field) => {
        delete (row as Record<string, unknown>)[field]
      })
    }
    
    return row
  })
  return [...grouped, ...noSkuRows]
}

const VIEW_TEMPLATE_LOW_END_URL = 'https://docs.google.com/spreadsheets/d/1bt9hMYtxIBvsNcdJ-Q7V7BKdcToa5_9FP942K0XzjCg/edit?gid=6170168#gid=6170168'
const VIEW_TEMPLATE_HIGH_END_URL: string | null = null

export default function BulkProductImportPanel({ onClose, onImported }: BulkProductImportPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [importSource, setImportSource] = useState<'file' | 'link'>('file')
  const [sheetUrl, setSheetUrl] = useState('')
  const [isFetchingSheet, setIsFetchingSheet] = useState(false)
  const [fileName, setFileName] = useState('')
  const [csvText, setCsvText] = useState('')
  const [importMode, setImportMode] = useState<'create_only' | 'create_or_update'>('create_or_update')
  const [fileError, setFileError] = useState('')
  const [importResults, setImportResults] = useState<BulkImportProductsResponse['results'] | null>(null)
  const [importErrorModal, setImportErrorModal] = useState<{
    title: string
    details: string
    payload?: BulkImportProductsPayload
    checklist?: Array<{ label: string; ok: boolean; detail: string }>
  } | null>(null)
  const { data: categoryData } = useGetCategoriesQuery({ per_page: 500 })
  const { data: brandData } = useGetProductBrandsQuery({ search: '' })
  const [importProducts, { isLoading }] = useBulkImportProductsMutation()
  const [fetchProducts, { data: existingProductsData }] = useLazyGetProductsQuery()
  const [editedCells, setEditedCells] = useState<Record<number, Record<string, string>>>({})
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set())

  const categoryLookup = useMemo(() => categoryData?.categories ?? [], [categoryData])
  const brandLookup = useMemo(() => brandData?.brands ?? [], [brandData])
  const existingProducts = useMemo(() => existingProductsData?.products ?? [], [existingProductsData])

  const parsedResult = useMemo(() => {
    if (!csvText.trim()) return null

    try {
      const result = parseCsvText(csvText)
      return { ...result, rawRows: result.rows, rows: groupVariantRows(result.rows) }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to parse CSV file.' }
    }
  }, [csvText])

  const parsed = ('error' in (parsedResult ?? {}) ? null : parsedResult) as ParsedSuccess | null

  const parseError = useMemo(() => {
    if (!csvText.trim()) return ''
    if (parsedResult && 'error' in parsedResult) return parsedResult.error
    return ''
  }, [csvText, parsedResult])

  const normalizedRows = useMemo(() => {
    if (!parsed) return null

    console.log('[DEBUG] Category lookup data:', categoryLookup.map(c => ({ id: c.id, name: c.name })))
    console.log('[DEBUG] Brand lookup data:', brandLookup.map(b => ({ id: b.id, name: b.name })))

    const numericFields = [
      'pd_catid', 'pd_room_type', 'pd_brand_type', 'pd_catsubid',
      'pd_price_srp', 'pd_price_dp', 'pd_price_member', 'pd_prodpv',
      'pd_qty', 'pd_weight', 'pd_psweight', 'pd_pswidth', 'pd_pslenght', 'pd_psheight',
      'pd_type', 'pd_status', 'pd_musthave', 'pd_bestseller', 'pd_salespromo',
      'pd_assembly_required', 'pd_verified', 'pd_manual_checkout_enabled'
    ]

    return parsed.rows.map((row) => {
      const originalCatid = String(row.pd_catid ?? '')
      const originalBrand = String(row.pd_brand_type ?? '')
      
      const normalizedCatid = normalizeLookupValue(originalCatid, categoryLookup)
      const normalizedBrand = normalizeLookupValue(originalBrand, brandLookup)
      
      console.log('[DEBUG] Row category conversion:', { original: originalCatid, normalized: normalizedCatid })
      console.log('[DEBUG] Row brand conversion:', { original: originalBrand, normalized: normalizedBrand })
      
      const normalizedRow: Record<string, unknown> = {
        ...row,
        pd_catid: normalizedCatid,
        pd_brand_type: normalizedBrand,
        pd_room_type: normalizeRoomType(String(row.pd_room_type ?? '')),
        pd_images: parseImageList(row.pd_images),
      }
      
      // Convert numeric string fields to numbers
      numericFields.forEach((field) => {
        const value = normalizedRow[field]
        if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) {
          normalizedRow[field] = Number(value)
        }
      })
      
      return normalizedRow as BulkImportProductsRow
    })
  }, [brandLookup, categoryLookup, parsed])

  // Fetch existing products when CSV is loaded
  useMemo(() => {
    if (parsed && parsed.rows.length > 0) {
      fetchProducts({ perPage: 1000 })
    }
  }, [parsed, fetchProducts])

  // Analyze import data
  const importAnalysis = useMemo(() => {
    if (!parsed || parsed.rows.length === 0) return null

    const rows = normalizedRows ?? parsed.rows
    const existingSkus = new Set(existingProducts.map((p) => String(p.sku)))
    
    let newProducts = 0
    let updatedProducts = 0
    let variantsInNewProducts = 0
    let variantsInUpdatedProducts = 0
    let totalVariants = 0

    rows.forEach((row) => {
      const isExisting = existingSkus.has(String(row.pd_parent_sku))
      const variantCount = row.pd_variants?.length ?? 0
      
      if (isExisting) {
        updatedProducts++
        variantsInUpdatedProducts += variantCount
      } else {
        newProducts++
        variantsInNewProducts += variantCount
      }
      totalVariants += variantCount
    })

    return {
      totalRows: rows.length,
      newProducts,
      updatedProducts,
      variantsInNewProducts,
      variantsInUpdatedProducts,
      totalVariants,
      productsWithoutVariants: rows.filter((r) => !r.pd_variants || r.pd_variants.length === 0).length,
    }
  }, [parsed, normalizedRows, existingProducts])

  const previewRows = useMemo(
    () =>
      (parsed?.rows ?? []).map((row, index) => {
        const variants = row.pd_variants ?? []
        const srpValues = variants.map((v) => Number(v.pv_price_srp)).filter((n) => Number.isFinite(n) && n > 0)
        const minSrp = srpValues.length ? Math.min(...srpValues) : 0
        const maxSrp = srpValues.length ? Math.max(...srpValues) : 0
        const totalQty = variants.reduce((sum, v) => sum + (Number.isFinite(Number(v.pv_qty)) ? Number(v.pv_qty) : 0), 0)
        return {
          index: index + 1,
          name: String(row.pd_name ?? '').trim() || 'Unnamed product',
          sku: String(row.pd_parent_sku ?? '').trim() || 'No SKU',
          category: String(row.pd_catid ?? '').trim() || 'N/A',
          srp: String(row.pd_price_srp ?? '').trim() || '0',
          qty: String(row.pd_qty ?? '').trim() || '0',
          variantCount: variants.length,
          variantSrpRange: minSrp === maxSrp ? String(minSrp) : `${minSrp} – ${maxSrp}`,
          variantTotalQty: totalQty,
          variants,
          row,
        }
      }),
    [parsed],
  )

  const importStats = useMemo(() => {
    if (!parsed) return null
    const rows = parsed.rows
    const productsWithVariants = rows.filter((r) => (r.pd_variants?.length ?? 0) > 0)
    const totalVariants = rows.reduce((sum, r) => sum + (r.pd_variants?.length ?? 0), 0)
    return {
      total: rows.length,
      withVariants: productsWithVariants.length,
      simple: rows.length - productsWithVariants.length,
      totalVariants,
    }
  }, [parsed])

  const unchangedSkus = useMemo(() => {
    if (!normalizedRows || existingProducts.length === 0) return new Set<string>()
    const existingBySku = new Map(existingProducts.map((p) => [p.sku, p]))
    const skus = new Set<string>()
    for (const row of normalizedRows) {
      const sku = String(row.pd_parent_sku ?? '').trim()
      if (!sku) continue
      const existing = existingBySku.get(sku)
      if (existing && isProductRowUnchanged(row, existing)) skus.add(sku)
    }
    return skus
  }, [normalizedRows, existingProducts])

  // Reset selection and edits whenever the CSV source changes
  useEffect(() => {
    setEditedCells({})
    if (!parsed) {
      setSelectedRowIndices(new Set())
      return
    }
    const count = parsed.rawRows?.length ?? parsed.rows.length
    setSelectedRowIndices(new Set(Array.from({ length: count }, (_, i) => i)))
  }, [parsed])

  const rawTableRowCount = parsed ? (parsed.rawRows?.length ?? parsed.rows.length) : 0
  const isAllSelected = rawTableRowCount > 0 && selectedRowIndices.size === rawTableRowCount
  const isIndeterminate = selectedRowIndices.size > 0 && selectedRowIndices.size < rawTableRowCount

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRowIndices(new Set())
    } else {
      setSelectedRowIndices(new Set(Array.from({ length: rawTableRowCount }, (_, i) => i)))
    }
  }

  const toggleRowSelection = (index: number) => {
    setSelectedRowIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleCellEdit = (rowIndex: number, col: string, value: string) => {
    setEditedCells((prev) => ({
      ...prev,
      [rowIndex]: { ...(prev[rowIndex] ?? {}), [col]: value },
    }))
  }

  const renderPreviewCell = (rowIndex: number, col: string, row: Record<string, unknown>) => {
    const originalValue = String(row[col] ?? '').trim()
    const cellValue = editedCells[rowIndex]?.[col] ?? originalValue
    const isEdited = editedCells[rowIndex]?.[col] !== undefined

    const selectCls = `w-full min-w-[140px] rounded px-2 py-1.5 text-[11px] border transition focus:outline-none focus:ring-1 focus:ring-teal-300 focus:border-teal-300 cursor-pointer ${
      isEdited ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
    }`
    const inputCls = `w-full min-w-[80px] rounded px-2 py-1.5 text-[11px] text-slate-700 border transition focus:outline-none focus:ring-1 focus:ring-teal-300 focus:border-teal-300 ${
      isEdited ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-transparent border-transparent hover:border-slate-200 hover:bg-white focus:bg-white'
    }`

    if (col === 'pd_catid') {
      // rawRows may still hold the category name (not yet resolved to ID), so resolve it here for display
      const resolvedCatId = normalizeLookupValue(cellValue, categoryLookup)
      return (
        <select value={resolvedCatId} onChange={(e) => handleCellEdit(rowIndex, col, e.target.value)} className={selectCls}>
          <option value="">—</option>
          {categoryLookup.map((cat) => (
            <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
          ))}
        </select>
      )
    }
    if (col === 'pd_room_type') {
      return (
        <select value={cellValue} onChange={(e) => handleCellEdit(rowIndex, col, e.target.value)} className={selectCls}>
          <option value="">—</option>
          {ROOM_OPTIONS.map((room) => (
            <option key={room.id} value={String(room.id)}>{room.label}</option>
          ))}
        </select>
      )
    }
    if (col === 'pd_brand_type') {
      // rawRows may still hold the brand name (not yet resolved to ID), so resolve it here for display
      const resolvedBrandId = normalizeLookupValue(cellValue, brandLookup)
      return (
        <select value={resolvedBrandId} onChange={(e) => handleCellEdit(rowIndex, col, e.target.value)} className={selectCls}>
          <option value="">—</option>
          {brandLookup.map((brand) => (
            <option key={brand.id} value={String(brand.id)}>{brand.name}</option>
          ))}
        </select>
      )
    }
    if (col === 'pd_type') {
      return (
        <select value={cellValue} onChange={(e) => handleCellEdit(rowIndex, col, e.target.value)} className={selectCls}>
          <option value="">—</option>
          <option value="0">Simple</option>
          <option value="1">Has Variants</option>
        </select>
      )
    }
    if (col === 'pd_status' || col === 'pv_status') {
      return (
        <select value={cellValue} onChange={(e) => handleCellEdit(rowIndex, col, e.target.value)} className={selectCls}>
          <option value="">—</option>
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </select>
      )
    }
    if (BOOLEAN_COLUMNS.has(col)) {
      return (
        <select value={cellValue} onChange={(e) => handleCellEdit(rowIndex, col, e.target.value)} className={selectCls}>
          <option value="">—</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      )
    }
    return (
      <input
        type="text"
        value={cellValue}
        onChange={(e) => handleCellEdit(rowIndex, col, e.target.value)}
        className={inputCls}
      />
    )
  }

  const handleClear = () => {
    setFileName('')
    setCsvText('')
    setFileError('')
    setImportResults(null)
    setImportErrorModal(null)
    setSheetUrl('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const handlePickFile = async (file?: File | null) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setFileError('Please upload a .csv file.')
      return
    }

    setFileError('')
    const text = await file.text()
    setFileName(file.name)
    setCsvText(text)
  }

  const handleFetchSheet = async () => {
    if (!sheetUrl.trim()) return

    setFileError('')
    setIsFetchingSheet(true)
    try {
      const response = await fetch(`/api/fetch-sheet?url=${encodeURIComponent(sheetUrl.trim())}`)
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `Request failed (${response.status}).`)
      }
      const text = await response.text()
      const gidMatch = sheetUrl.match(/[?&#]gid=(\d+)/)
      const gid = gidMatch ? gidMatch[1] : '0'
      setFileName(`Google Sheet${gid !== '0' ? ` (tab gid=${gid})` : ''}`)
      setCsvText(text)
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Failed to fetch Google Sheet.')
    } finally {
      setIsFetchingSheet(false)
    }
  }

  const handleImport = async () => {
    if (!parsed || parsed.rows.length === 0) {
      showErrorToast('Load a valid CSV first.')
      return
    }

    // Check if lookup data is loaded
    if (categoryLookup.length === 0 || brandLookup.length === 0) {
      showErrorToast('Please wait for categories and brands to load before importing.')
      return
    }

    setImportResults(null)

    // Build import rows: apply edits, filter by selection, re-group, normalize
    const rawRowsSource = parsed.rawRows ?? []
    const filteredEditedRaw = rawRowsSource
      .map((row, i) => ({ ...row, ...(editedCells[i] ?? {}) }))
      .filter((_, i) => selectedRowIndices.has(i))

    if (filteredEditedRaw.length === 0) {
      showErrorToast('No rows selected. Please select at least one row to import.')
      return
    }

    const groupedForImport = groupVariantRows(filteredEditedRaw)

    const numericImportFields = [
      'pd_catid', 'pd_room_type', 'pd_brand_type', 'pd_catsubid',
      'pd_price_srp', 'pd_price_dp', 'pd_price_member', 'pd_prodpv',
      'pd_qty', 'pd_weight', 'pd_psweight', 'pd_pswidth', 'pd_pslenght', 'pd_psheight',
      'pd_type', 'pd_status', 'pd_musthave', 'pd_bestseller', 'pd_salespromo',
      'pd_assembly_required', 'pd_verified', 'pd_manual_checkout_enabled',
    ]

    const rows: BulkImportProductsRow[] = groupedForImport.map((row) => {
      const normalizedCatid = normalizeLookupValue(String(row.pd_catid ?? ''), categoryLookup)
      const normalizedBrand = normalizeLookupValue(String(row.pd_brand_type ?? ''), brandLookup)
      const normalizedRow: Record<string, unknown> = {
        ...row,
        pd_catid: normalizedCatid,
        pd_brand_type: normalizedBrand,
        pd_room_type: normalizeRoomType(String(row.pd_room_type ?? '')),
        pd_images: parseImageList(row.pd_images),
      }
      numericImportFields.forEach((field) => {
        const value = normalizedRow[field]
        if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) {
          normalizedRow[field] = Number(value)
        }
      })
      return normalizedRow as BulkImportProductsRow
    })

    const payload: BulkImportProductsPayload = { mode: importMode, rows }

    // Detailed pre-import validation
    const validationErrors: string[] = []
    rows.forEach((row, index) => {
      const rowNum = index + 1
      if (!String(row.pd_name ?? '').trim()) validationErrors.push(`Row ${rowNum}: Missing pd_name`)
      if (!String(row.pd_catid ?? '').trim()) validationErrors.push(`Row ${rowNum}: Missing pd_catid`)
      if (!String(row.pd_price_srp ?? '').trim()) validationErrors.push(`Row ${rowNum}: Missing pd_price_srp`)
      if (!String(row.pd_parent_sku ?? '').trim()) validationErrors.push(`Row ${rowNum}: Missing pd_parent_sku`)
      if (row.pd_type === undefined || row.pd_type === null || row.pd_type === '') validationErrors.push(`Row ${rowNum}: Missing pd_type`)
      
      // Validate variants if present
      if (row.pd_variants && row.pd_variants.length > 0) {
        row.pd_variants.forEach((variant, vIndex) => {
          if (!String(variant.pv_sku ?? '').trim()) validationErrors.push(`Row ${rowNum}, Variant ${vIndex + 1}: Missing pv_sku`)
          if (variant.pv_status === undefined || variant.pv_status === null) validationErrors.push(`Row ${rowNum}, Variant ${vIndex + 1}: Missing pv_status`)
        })
      }
    })

    if (validationErrors.length > 0) {
      setImportErrorModal({
        title: 'Validation Failed',
        details: `Found ${validationErrors.length} validation error(s):\n${validationErrors.join('\n')}`,
        payload,
        checklist: buildPayloadChecklist(payload),
      })
      return
    }

    try {
      console.log('[DEBUG] Sending import payload:', JSON.stringify(payload, null, 2))
      const response = await importProducts(payload).unwrap()
      console.log('[DEBUG] Import response:', JSON.stringify(response, null, 2))

      const { summary, results } = response
      const failedRows = results.filter((r) => r.status === 'failed')
      const hasFailures = failedRows.length > 0 || summary.failed > 0

      if (hasFailures) {
        setImportResults(results)
        const failureDetails = failedRows.map((r) => `Row ${r.row}: ${r.message}`).join('\n')
        showErrorToast(`Import finished with errors: ${summary.created} created, ${summary.updated} updated, ${summary.failed} failed.`)
        if (summary.created > 0 || summary.updated > 0) onImported?.()
      } else if (summary.created === 0 && summary.updated === 0) {
        showSuccessToast('No changes detected — all rows already match the current database.')
        onClose()
      } else {
        showSuccessToast(`Import finished: ${summary.created} created, ${summary.updated} updated.`)
        onImported?.()
        onClose()
      }
    } catch (error) {
      console.error('[DEBUG] Import error:', error)
      const errorData = error as { data?: { message?: string; errors?: Record<string, unknown>; status?: number } }
      const message = errorData?.data?.message || 'Bulk import failed.'
      const errors = errorData?.data?.errors ? JSON.stringify(errorData.data.errors, null, 2) : 'No additional error details'
      const status = errorData?.data?.status ? `HTTP ${errorData.data.status}` : 'Unknown status'
      
      setImportErrorModal({
        title: 'Bulk import failed',
        details: `${message}\n\nStatus: ${status}\n\nError Details:\n${errors}\n\nRaw Error:\n${JSON.stringify(error, null, 2)}`,
        payload,
        checklist: buildPayloadChecklist(payload),
      })
    }
  }

  return (
    <div className="flex h-full flex-col relative">
      {importErrorModal ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-red-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-red-100 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-red-800">{importErrorModal.title}</p>
                <p className="mt-1 text-xs text-red-600">Review the import payload details below.</p>
              </div>
              <button
                type="button"
                onClick={() => setImportErrorModal(null)}
                className="rounded-lg p-1 text-red-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto px-5 py-4">
              <div className="space-y-4">
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</p>
                  <pre className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-700">{importErrorModal.details}</pre>
                </section>

                {importErrorModal.payload ? (
                  <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Request Payload</p>
                    <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 text-[11px] leading-5 text-slate-100">
                      {JSON.stringify(importErrorModal.payload, null, 2)}
                    </pre>
                  </section>
                ) : null}

                {importErrorModal.checklist ? (
                  <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type Check</p>
                    <div className="mt-3 space-y-2">
                      {importErrorModal.checklist.map((item) => (
                        <div key={item.label} className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 px-3 py-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800">{item.label}</p>
                            <p className="text-xs text-slate-500">{item.detail}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {item.ok ? 'OK' : 'Check'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Likely Backend Checks</p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-900 list-disc list-inside">
                    <li>Confirm the imported row has `pd_parent_sku` and `pd_type` set correctly for create-or-update matching.</li>
                    <li>Verify the backend accepts nested `pd_variants` in the exact shape shown in the payload.</li>
                    <li>Check that category, room type, and brand IDs exist in the backend.</li>
                    <li>Make sure `pd_images` and `pv_images` are accepted as arrays of URLs.</li>
                    <li>Confirm the backend is not rejecting numeric strings for price and quantity fields.</li>
                  </ul>
                </section>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-red-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setImportErrorModal(null)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isLoading && importStats && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/90 backdrop-blur-sm">
          <svg className="h-10 w-10 animate-spin text-teal-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <div className="text-center space-y-1">
            <p className="text-base font-bold text-slate-800">Importing products…</p>
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{importStats.total}</span> product{importStats.total !== 1 ? 's' : ''} total
              {importStats.totalVariants > 0 && (
                <> &mdash; <span className="font-semibold text-violet-600">{importStats.totalVariants}</span> variant{importStats.totalVariants !== 1 ? 's' : ''} across <span className="font-semibold text-violet-600">{importStats.withVariants}</span> product{importStats.withVariants !== 1 ? 's' : ''}</>
              )}
            </p>
            <p className="text-xs text-slate-400">Please wait, this may take a moment for large batches.</p>
          </div>
        </div>
      )}
      <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-5">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Upload one CSV file to create many products at once. Required columns: <span className="font-semibold">{PRODUCT_REQUIRED_COLUMNS.join(', ')}</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          {/* Source toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 self-start w-fit">
            {[
              { value: 'file', label: 'CSV File' },
              { value: 'link', label: 'Google Sheet Link' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setImportSource(opt.value as 'file' | 'link'); handleClear() }}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  importSource === opt.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {importSource === 'file' ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                Select CSV File
              </button>
              <a href={VIEW_TEMPLATE_LOW_END_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                View Template (Low End)
              </a>
              {VIEW_TEMPLATE_HIGH_END_URL ? (
                <a href={VIEW_TEMPLATE_HIGH_END_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100">
                  View Template (High End)
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-300 cursor-not-allowed">
                  View Template (High End)
                </span>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => void handlePickFile(event.target.files?.[0] ?? null)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Paste your Google Sheet URL below. The sheet must be shared as <span className="font-semibold">Anyone with the link can view</span>.
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
                <button
                  type="button"
                  onClick={() => void handleFetchSheet()}
                  disabled={isFetchingSheet || !sheetUrl.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
                >
                  {isFetchingSheet ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Fetching…
                    </>
                  ) : 'Load Sheet'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <a href={VIEW_TEMPLATE_LOW_END_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-700">
                  Template (Low End)
                </a>
                <span className="text-slate-300">·</span>
                {VIEW_TEMPLATE_HIGH_END_URL ? (
                  <a href={VIEW_TEMPLATE_HIGH_END_URL} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-500 underline underline-offset-2 hover:text-violet-700">
                    Template (High End)
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-not-allowed">
                    Template (High End)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Import Mode</p>
              <p className="text-xs text-slate-500">Choose whether matching SKU rows should create only or update existing products.</p>
            </div>
            <div className="flex rounded-xl bg-slate-100 p-1">
              {[
                { value: 'create_or_update', label: 'Create or Update' },
                { value: 'create_only', label: 'Create Only' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setImportMode(option.value as 'create_only' | 'create_or_update')}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    importMode === option.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
              <div>
                <p className="font-semibold text-slate-700">Important Notes</p>
                <ul className="mt-2 space-y-1 text-slate-600 list-disc list-inside">
                  <li>Column order doesn&apos;t matter — header names are matched by name</li>
                  <li>Only 3 columns are required: <span className="font-mono font-semibold text-slate-700">pd_name</span>, <span className="font-mono font-semibold text-slate-700">pd_catid</span>, <span className="font-mono font-semibold text-slate-700">pd_price_srp</span></li>
                  <li>Skip any optional column by leaving it blank or removing it</li>
                  <li>Multiple images: separate URLs with pipe <span className="font-mono">url1|url2</span></li>
                  <li>Prices support commas — <span className="font-mono">4,999.00</span> and <span className="font-mono">4999.00</span> both work</li>
                  <li>Boolean fields accept: <span className="font-mono">1/0</span>, <span className="font-mono">yes/no</span>, <span className="font-mono">true/false</span></li>
                  <li>Status and flag columns accept <span className="font-mono">Active</span> or <span className="font-mono">Inactive</span> and are normalized to <span className="font-mono">1</span> or <span className="font-mono">0</span></li>
                  <li>Category, room type, brand, pricing tier, warranty, product type, and status/flag values can be pasted as labels or database IDs when available</li>
                  <li>SKU is required for &quot;Create or Update&quot; mode matching</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Field Reference</p>
                <ul className="mt-2 space-y-0.5 text-slate-600 list-disc list-inside text-[11px]">
                  <li><span className="font-mono">pd_catid</span> — category name or numeric category ID</li>
                  <li><span className="font-mono">pd_room_type</span> — room label or numeric room ID</li>
                  <li><span className="font-mono">pd_brand_type</span> — brand name or numeric brand ID</li>
                  <li><span className="font-mono">pd_pricing_tier</span> — tier label or value</li>
                  <li><span className="font-mono">pd_warranty</span> — warranty label or custom text</li>
                  <li><span className="font-mono">pd_type</span> — product type label or numeric value</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {fileName ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-700 truncate">
              Selected file: <span className="font-semibold">{fileName}</span>
            </p>
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          </div>
        ) : null}

        {fileError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{fileError}</div>
        ) : null}

        {parseError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{parseError}</div>
        ) : null}

        {importResults ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 overflow-hidden">
            <div className="border-b border-red-100 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-red-800">Import Errors</p>
                <p className="text-xs text-red-600">{importResults.filter((r) => r.status === 'failed').length} row(s) failed — fix the data and re-upload.</p>
              </div>
              <button
                type="button"
                onClick={() => setImportResults(null)}
                className="shrink-0 rounded-lg p-1 text-red-400 transition hover:bg-red-100 hover:text-red-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-64 overflow-auto divide-y divide-red-100">
              {importResults.filter((r) => r.status === 'failed').map((r) => (
                <div key={r.row} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">Row {r.row}</span>
                    <div className="min-w-0">
                      {(r.name || r.sku) && (
                        <p className="text-xs font-semibold text-red-800 truncate">
                          {r.name ?? ''}{r.name && r.sku ? ' — ' : ''}{r.sku ? `SKU: ${r.sku}` : ''}
                        </p>
                      )}
                      <p className="text-xs text-red-700 mt-0.5">{r.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {parsed ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">New Products</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{importAnalysis?.newProducts ?? 0}</p>
                <p className="text-xs text-slate-500">Will be created</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Updated Products</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{importAnalysis?.updatedProducts ?? 0}</p>
                <p className="text-xs text-slate-500">Will be updated</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total Variants</p>
                <p className="mt-1 text-2xl font-bold text-violet-600">{importAnalysis?.totalVariants ?? 0}</p>
                <p className="text-xs text-slate-500">Across all products</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Mode</p>
                <p className="mt-1 text-lg font-bold text-slate-800">{importMode === 'create_or_update' ? 'Create or Update' : 'Create Only'}</p>
                <p className="text-xs text-slate-500">Import behavior</p>
              </div>
            </div>

            {importAnalysis && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Import Breakdown</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                  <div>
                    <span className="text-slate-600">Variants in new products:</span>
                    <span className="ml-2 font-semibold text-emerald-600">{importAnalysis.variantsInNewProducts}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Variants in updated products:</span>
                    <span className="ml-2 font-semibold text-blue-600">{importAnalysis.variantsInUpdatedProducts}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Products without variants:</span>
                    <span className="ml-2 font-semibold text-slate-700">{importAnalysis.productsWithoutVariants}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Total rows:</span>
                    <span className="ml-2 font-semibold text-slate-700">{importAnalysis.totalRows}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Upload Summary</p>
                  <p className="text-xs text-slate-500">Products that will be imported when you proceed.</p>
                </div>
                {importStats && (
                  <div className="flex flex-wrap gap-2 text-[11px] shrink-0">
                    <span className="inline-flex items-center rounded-full bg-teal-50 border border-teal-100 px-2.5 py-1 font-semibold text-teal-700">
                      {importStats.total} product{importStats.total !== 1 ? 's' : ''}
                    </span>
                    {importStats.totalVariants > 0 && (
                      <span className="inline-flex items-center rounded-full bg-violet-50 border border-violet-100 px-2.5 py-1 font-semibold text-violet-700">
                        {importStats.totalVariants} variant{importStats.totalVariants !== 1 ? 's' : ''}
                      </span>
                    )}
                    {unchangedSkus.size > 0 && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 font-semibold text-slate-400">
                        {unchangedSkus.size} unchanged
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="max-h-80 overflow-auto divide-y divide-slate-100">
                {previewRows.map((row) => (
                  <div key={`${row.index}-${row.sku}-${row.name}`} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">#{row.index}</span>
                      <p className={`text-sm font-semibold ${unchangedSkus.has(row.sku) ? 'text-slate-400' : 'text-slate-800'}`}>{row.name}</p>
                      {row.variantCount > 0 && (
                        <span className="inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                          {row.variantCount} variant{row.variantCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {unchangedSkus.has(row.sku) && (
                        <span className="inline-flex rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                          No changes
                        </span>
                      )}
                    </div>
                    {parsed.isVariantSheet ? (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>SKU: {row.sku}</span>
                          <span>SRP: PHP {row.variantSrpRange}</span>
                          <span>Total Qty: {row.variantTotalQty}</span>
                        </div>
                        {row.variants.length > 0 && (
                          <div className="mt-1 flex flex-col gap-0.5">
                            {row.variants.map((v, vi) => (
                              <div key={vi} className="flex flex-wrap gap-x-2 text-[11px] text-slate-400 pl-2 border-l-2 border-violet-200">
                                <span className="font-medium text-slate-600">{v.pv_name ?? v.pv_sku ?? `Variant ${vi + 1}`}</span>
                                {v.pv_sku && <span>SKU: {v.pv_sku}</span>}
                                {v.pv_style && <span>Style: {v.pv_style}</span>}
                                {v.pv_size && <span>Size: {v.pv_size}</span>}
                                {v.pv_color && <span>Color: {v.pv_color}</span>}
                                {Number.isFinite(v.pv_price_srp) && v.pv_price_srp! > 0 && <span>PHP {v.pv_price_srp}</span>}
                                {Number.isFinite(v.pv_prodpv) && v.pv_prodpv! > 0 && <span className="text-teal-600 font-semibold">PV: {v.pv_prodpv}</span>}
                                {Number.isFinite(v.pv_qty) && <span>Qty: {v.pv_qty}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>SKU: {row.sku}</span>
                        <span>Category ID: {row.category}</span>
                        <span>SRP: PHP {row.srp}</span>
                        <span>Qty: {row.qty}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Raw Preview</p>
                  <p className="text-xs text-slate-500">Full table view of the uploaded CSV fields.</p>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px] shrink-0">
                  <span className="inline-flex items-center rounded-full bg-teal-50 border border-teal-100 px-2 py-0.5 font-semibold text-teal-700">
                    {selectedRowIndices.size} / {rawTableRowCount} selected
                  </span>
                  {Object.keys(editedCells).length > 0 && (
                    <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 font-semibold text-amber-700">
                      {Object.keys(editedCells).length} row{Object.keys(editedCells).length !== 1 ? 's' : ''} edited
                    </span>
                  )}
                </div>
              </div>

              {/* Editable note */}
              <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2.5">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-amber-800">
                  <span className="font-semibold">You can edit cells directly before importing.</span>{' '}
                  Click any cell to modify its value. Edited cells are highlighted in amber.
                  Use the checkboxes to select which rows to include — only checked rows will be imported.
                </p>
              </div>

              <div className="max-h-96 overflow-auto">
                <table className="min-w-[2400px] divide-y divide-slate-100 text-left text-[11px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="sticky left-0 z-10 bg-slate-50 px-3 py-3 w-14">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={(el) => { if (el) el.indeterminate = isIndeterminate }}
                            onChange={toggleSelectAll}
                            className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-teal-600 accent-teal-600"
                          />
                          <span className="font-semibold text-slate-600">Row</span>
                        </div>
                      </th>
                      {(parsed.isVariantSheet ? VARIANT_PREVIEW_COLUMNS : PREVIEW_COLUMNS).map((header) => (
                        <th key={header} className="px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsed.isVariantSheet
                      ? (parsed.rawRows ?? []).map((row: BulkImportProductsRow, index: number) => {
                          const isSelected = selectedRowIndices.has(index)
                          const rowSku = String(row.pd_parent_sku ?? '').trim()
                          const isUnchanged = unchangedSkus.has(rowSku)
                          return (
                            <tr key={index} className={`align-top transition-opacity ${isSelected ? (isUnchanged ? 'bg-slate-50' : 'bg-white') : 'bg-slate-50 opacity-50'}`}>
                              <td className="sticky left-0 z-10 bg-inherit px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleRowSelection(index)}
                                    className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-teal-600 accent-teal-600"
                                  />
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold text-slate-500">{index + 1}</span>
                                    {isUnchanged && isSelected && (
                                      <span className="inline-flex rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 leading-none whitespace-nowrap">
                                        no changes
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              {VARIANT_PREVIEW_COLUMNS.map((header) => (
                                <td key={`${index}-${header}`} className="px-1 py-1 max-w-[200px]">
                                  {renderPreviewCell(index, header, row as Record<string, unknown>)}
                                </td>
                              ))}
                            </tr>
                          )
                        })
                      : previewRows.map((preview: (typeof previewRows)[number], i: number) => {
                          const isSelected = selectedRowIndices.has(i)
                          const isUnchanged = unchangedSkus.has(preview.sku)
                          return (
                            <tr key={preview.index} className={`align-top transition-opacity ${isSelected ? (isUnchanged ? 'bg-slate-50' : 'bg-white') : 'bg-slate-50 opacity-50'}`}>
                              <td className="sticky left-0 z-10 bg-inherit px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleRowSelection(i)}
                                    className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-teal-600 accent-teal-600"
                                  />
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold text-slate-500">{preview.index}</span>
                                    {isUnchanged && isSelected && (
                                      <span className="inline-flex rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 leading-none whitespace-nowrap">
                                        no changes
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              {PREVIEW_COLUMNS.map((header) => (
                                <td key={`${preview.index}-${header}`} className="px-1 py-1 max-w-[200px]">
                                  {renderPreviewCell(i, header, preview.row as Record<string, unknown>)}
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6 sm:py-4 flex items-center gap-3">
        <p className="text-xs text-slate-400 flex-1">Manual add still works. This option is only for bulk CSV imports.</p>
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={isLoading || !parsed || parsed.rows.length === 0 || selectedRowIndices.size === 0}
          className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-teal-500/30 transition hover:bg-teal-700 disabled:opacity-60"
        >
          {isLoading
            ? 'Importing...'
            : selectedRowIndices.size > 0 && selectedRowIndices.size < rawTableRowCount
              ? `Import ${selectedRowIndices.size} Row${selectedRowIndices.size !== 1 ? 's' : ''}`
              : 'Import Products'
          }
        </button>
      </div>
    </div>
  )
}
