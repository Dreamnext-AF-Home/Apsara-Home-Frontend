'use client'

import Image from 'next/image'
import { useMemo, useRef, useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Fragment } from 'react'
import { useGetAdminMeQuery } from '@/store/api/authApi'
import { Product, ZqCachedProduct, ZqCategoryMappingItem, ZqSyncProductsPayload, ZqSyncProductsResponse, useFetchZqImportPreviewMutation, useGetProductsQuery, useGetPublicProductsQuery, useDeleteProductMutation, useGetZqCachedProductsQuery, useGetZqProductsSummaryQuery, useGetZqCategoryMappingsQuery, useUpsertZqCategoryMappingMutation, useManualCheckoutApplyMutation, useSyncZqProductsMutation, ProductsResponse } from "@/store/api/productsApi"

import { useGetAdminGeneralSettingsQuery, useUpdateAdminGeneralSettingsMutation } from "@/store/api/adminSettingsApi";
import { useGetPublicProductBrandsQuery } from "@/store/api/productBrandsApi";
import { useGetSuppliersQuery } from "@/store/api/suppliersApi";
import ProductsToolbar from './ProductsToolbar'
import ProductsTable from './ProductsTable'
import DataTableShell from '../DataTableShell'
import AddProductModal from './AddProductModal'
import EditProductModal from './EditProductModal'
import BulkEditProductsModal from './BulkEditProductsModal'
import ProductActivityLogsModal from './ProductActivityLogsModal'
import EditZqPricingModal from '@/components/superAdmin/products/EditZqPricingModal'
import ImportZqPricingModal from '@/components/superAdmin/products/ImportZqPricingModal'
import * as XLSX from 'xlsx'
import PrimaryButton from '@/components/ui/buttons/PrimaryButton'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import { revalidateStorefront } from '@/libs/revalidateStorefront'
import { buildStorefrontProductPath } from '@/libs/storefrontRouting'

interface ProductsPageMainProps {
  initialData?: ProductsResponse | null
  initialBrandType?: number
}

const NEW_BADGE_DAYS = 7
const getZqInlineStorageKey = (pathname: string) => `afhome:zq-inline:${pathname}`

const exportToCSV = (products: Product[]) => {
  if (products.length === 0) {
    showErrorToast('No products to export')
    return
  }

  const headers = [
    'pd_name',
    'pd_parent_sku',
    'pd_catid',
    'pd_room_type',
    'pd_brand_type',
    'pd_catsubid',
    'pd_price_srp',
    'pd_price_dp',
    'pd_price_member',
    'pd_prodpv',
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
    'pd_assembly_required',
    'pd_image',
    'pd_images',
    'pd_type',
    'pd_status',
    'pd_pricing_tier',
    'pd_reversed_pv_multiplier',
    'pd_musthave',
    'pd_bestseller',
    'pd_salespromo',
    'pd_verified',
    'pd_manual_checkout_enabled',
  ]

  const csvRows = [
    headers.join(','),
    ...products.map((product) => {
      const row = [
        `"${(product.name || '').replace(/"/g, '""')}"`,
        product.sku,
        product.catid,
        product.roomType || '',
        product.brandType || '',
        product.catsubid,
        product.priceSrp,
        product.priceDp,
        product.priceMember || '',
        product.prodpv || '',
        product.qty,
        product.weight,
        product.psweight || '',
        product.pswidth || '',
        product.pslenght || '',
        product.psheight || '',
        `"${(product.description || '').replace(/"/g, '""')}"`,
        `"${(product.specifications || '').replace(/"/g, '""')}"`,
        product.material || '',
        product.warranty || '',
        product.assemblyRequired || '',
        product.image || '',
        (product.images || []).join('|'),
        product.type,
        product.status,
        '',
        '',
        product.musthave,
        product.bestseller,
        product.salespromo,
        product.verified || '',
        product.manualCheckoutEnabled || '',
      ]
      return row.join(',')
    }),
  ]

  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  const now = new Date()
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
  link.setAttribute('download', `products-export-${timestamp}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  showSuccessToast(`Exported ${products.length} products to CSV`)
}

const exportZqToCSV = (products: ZqCachedProduct[]) => {
  if (products.length === 0) {
    showErrorToast('No ZQ products to export')
    return
  }

  const cents = (v: number | null | undefined) => v != null ? parseFloat((v / 100).toFixed(2)) : null

  const HEADERS = [
    'External ID', 'Product Name', 'Chinese Name', 'Category', 'Source',
    'Status', 'Import Status', 'Shipping To', 'Target Currency',
    'Total Stock', 'Variants',
    'Member Price (₱)', 'Dealer Price (₱)', 'PV',
    'PV Tier', 'Reversed PV Multiplier',
    'Price Min (₱)', 'Price Max (₱)', 'Cost Min (₱)', 'Cost Max (₱)',
    'Primary Image', 'Product URL', 'Created At', 'Last Synced',
  ]

  const dataRows = products.map((p) => [
    p.externalId,
    p.subject,
    p.subjectCn ?? '',
    p.categoryName ?? '',
    p.sourceType ?? '',
    p.status ?? '',
    p.importStatus ?? '',
    p.shippingTo ?? '',
    p.targetCurrency ?? '',
    p.totalStock ?? 0,
    p.variantCount ?? 0,
    cents(p.memberPrice),
    cents(p.dealerPrice),
    p.pv ?? null,
    p.pvTier ?? 'low_end',
    p.reversedPvMultiplier ?? null,
    cents(p.priceMinCents),
    cents(p.priceMaxCents),
    cents(p.costMinCents),
    cents(p.costMaxCents),
    p.primaryImage ?? '',
    p.productUrl ?? '',
    p.sourceCreatedAt ?? '',
    p.syncedAt ?? '',
  ])

  /* ── build worksheet ── */
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...dataRows])

  /* column widths */
  ws['!cols'] = [
    { wch: 12 },  // External ID
    { wch: 48 },  // Product Name
    { wch: 36 },  // Chinese Name
    { wch: 22 },  // Category
    { wch: 10 },  // Source
    { wch: 10 },  // Status
    { wch: 14 },  // Import Status
    { wch: 12 },  // Shipping To
    { wch: 14 },  // Target Currency
    { wch: 11 },  // Total Stock
    { wch: 9  },  // Variants
    { wch: 16 },  // Member Price
    { wch: 15 },  // Dealer Price
    { wch: 8  },  // PV
    { wch: 11 },  // PV Tier
    { wch: 20 },  // Reversed PV Multiplier
    { wch: 13 },  // Price Min
    { wch: 13 },  // Price Max
    { wch: 12 },  // Cost Min
    { wch: 12 },  // Cost Max
    { wch: 10 },  // Primary Image
    { wch: 10 },  // Product URL
    { wch: 20 },  // Created At
    { wch: 20 },  // Last Synced
  ]

  /* freeze top row */
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  /* header row style — sky-blue bg, white bold text */
  const headerFill = { patternType: 'solid', fgColor: { rgb: '0284C7' } }
  const headerFont = { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 }
  const headerAlign = { horizontal: 'center', vertical: 'center', wrapText: false }
  const headerBorder = {
    bottom: { style: 'medium', color: { rgb: 'FFFFFF' } },
  }

  /* pricing columns (K-Q = indices 11-16) get light-green tint on data rows */
  const pricingFill = { patternType: 'solid', fgColor: { rgb: 'F0FDF4' } }
  const altRowFill  = { patternType: 'solid', fgColor: { rgb: 'F8FAFC' } }
  const pricingFont = { color: { rgb: '166534' }, sz: 10 }
  const defaultFont = { sz: 10 }

  const totalCols = HEADERS.length
  const totalRows = dataRows.length + 1 // +1 for header

  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      if (!ws[addr]) ws[addr] = { v: '', t: 's' }

      if (r === 0) {
        /* header row */
        ws[addr].s = {
          fill: headerFill,
          font: headerFont,
          alignment: headerAlign,
          border: headerBorder,
        }
      } else {
        const isPricingCol = c >= 11 && c <= 16
        const isAltRow = r % 2 === 0

        ws[addr].s = {
          fill: isPricingCol ? pricingFill : (isAltRow ? altRowFill : undefined),
          font: isPricingCol ? pricingFont : defaultFont,
          alignment: { vertical: 'center', wrapText: false },
          border: {
            bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
          },
          numFmt: (isPricingCol && c < 16) ? '#,##0.00' : undefined,
        }
      }
    }
  }

  /* row height: header 22pt, data rows 18pt */
  ws['!rows'] = [
    { hpt: 22 },
    ...Array(dataRows.length).fill({ hpt: 18 }),
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'ZQ Products')

  const now = new Date()
  const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  XLSX.writeFile(wb, `zq-products-${ts}.xlsx`)

  showSuccessToast(`Exported ${products.length} ZQ products to Excel`)
}

const mapCachedZqProductToLocalRow = (product: ZqCachedProduct): Product => ({
  id: -Number(product.id || 0),
  supplierId: 0,
  supplierName: product.sourceType || 'AF HOME GLOBAL SUPPLIER',
  name: product.subject,
  description: product.importStatus ? `Global Supplier import status: ${product.importStatus}` : null,
  specifications: product.localCategoryName
    ? `${product.localCategoryName}${product.categoryName ? ` (ZQ: ${product.categoryName})` : ''}`
    : product.categoryName ?? null,
  catid: product.localCategoryId ?? 0,
  catsubid: 0,
  priceSrp: Number(product.priceMinCents ?? 0) / 100,
  priceDp: Number(product.priceMaxCents ?? product.priceMinCents ?? 0) / 100,
  priceMember: Number(product.priceMinCents ?? 0) / 100,
  prodpv: 0,
  qty: Number(product.totalStock ?? 0),
  weight: 0,
  brandType: product.brandType ?? undefined,
  brand: 'AF HOME GLOBAL SUPPLIER',
  type: 1,
  musthave: false,
  bestseller: false,
  salespromo: false,
  manualCheckoutEnabled: false,
  verified: false,
  status: String(product.status ?? '').toLowerCase() === 'published' ? 1 : 0,
  sku: product.externalId,
  uploaderName: 'Global Supplier API',
  uploaderEmail: null,
  uploaderRole: 'supplier_api',
  image: product.primaryImage ?? null,
  images: product.images ?? (product.primaryImage ? [product.primaryImage] : []),
  variants: [],
  soldCount: 0,
  avgRating: 0,
  createdAt: product.sourceCreatedAt ?? product.publishedAt ?? null,
  updatedAt: product.syncedAt ?? product.sourceUpdatedAt ?? null,
})

const parseZqPreviewMeta = (payload: Record<string, unknown> | undefined) => {
  const data = (payload?.data && typeof payload.data === 'object') ? payload.data as Record<string, unknown> : {}
  const records = Array.isArray(data.records) ? data.records : []
  const hasMore = Boolean(data.hasMore ?? false)
  const nextCursor = typeof data.nextCursor === 'string' || typeof data.nextCursor === 'number'
    ? String(data.nextCursor)
    : null

  return {
    count: records.length,
    hasMore,
    nextCursor,
  }
}

const isNewProduct = (product: Product) => {
  if (!product.createdAt) return false

  const createdAt = new Date(product.createdAt)
  if (Number.isNaN(createdAt.getTime())) return false

  const diffDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays < NEW_BADGE_DAYS
}

const getEffectiveStockQty = (product: Product) => {
  const activeVariants = (product.variants ?? []).filter((variant) => Number(variant.status ?? 1) === 1)

  if (activeVariants.length === 0) {
    return Number(product.qty ?? 0)
  }

  return activeVariants.reduce((total, variant) => total + Number(variant.qty ?? 0), 0)
}

/* ── Stat card ── */
function StatCard({
  label, value, sub, icon, colorClass,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  colorClass: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 flex items-center gap-3 dark:border-slate-800 dark:bg-slate-900">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none text-slate-800 dark:text-slate-100">{value}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-300">{label}</p>
        {sub && <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}

function ManualCheckoutSelectionModal({
  products,
  onConfirm,
  onRemove,
  onClose,
  isSaving = false,
  removingIds = [],
  mode = 'review',
}: {
  products: Product[]
  onConfirm: () => void
  onRemove?: (product: Product) => void
  onClose: () => void
  isSaving?: boolean
  removingIds?: number[]
  mode?: 'review' | 'view'
}) {
  const isViewMode = mode === 'view'
  const eyebrow = isViewMode ? 'Manual Checkout Products' : 'Manual Checkout Review'
  const title = isViewMode ? 'Added Products' : 'Selected Products'
  const description = isViewMode
    ? 'These products are already included in the manual checkout flow.'
    : 'Review the selected products that can proceed under the manual checkout flow.'
  const summaryLabel = isViewMode ? 'manual checkout product' : 'selected product'
  const primaryLabel = isViewMode ? 'Already Added to Manual Checkout' : 'Add to Manual Checkout'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">{eyebrow}</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Close
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ delay: 0.05, duration: 0.2, ease: 'easeOut' }}
            className="space-y-4 p-6"
          >
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="max-h-[55vh] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/70">
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Image</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Product</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Brand</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">SKU</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Stock</th>
                    {isViewMode ? (
                      <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Action</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {products.map((product) => {
                    const isRemoving = removingIds.includes(product.id)

                    return (
                      <tr
                        key={product.id}
                        className="bg-white dark:bg-slate-900"
                      >
                        <td className="px-5 py-3.5">
                          <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            {product.image ? (
                              <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <svg className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-semibold text-slate-800 dark:text-slate-100">{product.name}</p>
                            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">#{product.id}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {product.brand || 'Unbranded'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">{product.sku || 'N/A'}</td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {getEffectiveStockQty(product).toLocaleString()}
                        </td>
                        {isViewMode ? (
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => onRemove?.(product)}
                              disabled={isRemoving}
                              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isRemoving ? 'Removing...' : 'Remove'}
                            </button>
                          </td>
                        ) : null}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-100">{products.length}</span> {summaryLabel}{products.length !== 1 ? 's' : ''}
            </p>
            <button
              type="button"
              onClick={isViewMode ? onClose : onConfirm}
              disabled={(!isViewMode && isSaving) || products.length === 0}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isViewMode
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'bg-teal-600 text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300'
              }`}
            >
              {isSaving && !isViewMode ? 'Saving...' : primaryLabel}
            </button>
          </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function ZqSyncProgressModal({
  isOpen,
  progress,
  isImporting,
  hasStarted,
  totalToImport,
  isDiscoveringTotal,
  hasSavedCursor,
  hasImportedProducts,
  importMode,
  onStartImport,
  onStartRescan,
  onCancel,
}: {
  isOpen: boolean
  progress: {
    batches: number
    requested: number
    synced: number
    skipped: number
    failed: number
  }
  isImporting: boolean
  hasStarted: boolean
  totalToImport: number
  isDiscoveringTotal: boolean
  hasSavedCursor: boolean
  hasImportedProducts: boolean
  importMode: 'resume' | 'rescan'
  onStartImport: () => void
  onStartRescan: () => void
  onCancel: () => void
}) {
  if (!isOpen) return null

  const canResumeImport = hasSavedCursor || hasImportedProducts

  const totalProcessed = progress.synced + progress.skipped + progress.failed
  const isResumeMode = importMode === 'resume'
  const progressPercent = !hasStarted
    ? 0
    : totalToImport > 0
      ? Math.min(100, Math.round((totalProcessed / totalToImport) * 100))
      : isImporting
        ? 15
        : 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="border-b border-slate-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Global Supplier Product Fetch</p>
            <div className="mt-1 flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {isDiscoveringTotal
                  ? 'Preparing import total'
                  : isImporting
                    ? 'Importing global supplier products'
                    : hasStarted
                      ? 'Finishing import'
                      : 'Prepare Global Supplier import'}
              </h2>
              {isImporting || isDiscoveringTotal ? (
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"
                />
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {isImporting
                ? 'Products are being imported one by one into tbl_zqproducts. Once complete, they will appear in the products table below.'
                : isDiscoveringTotal
                  ? 'We are counting all available global supplier products first so the progress bar can use the real total.'
                : hasStarted
                  ? 'The import is wrapping up now. Please wait a moment while we refresh the table.'
                  : canResumeImport
                    ? 'Start Import will resume from the last saved Global Supplier cursor. Use Rescan from Start only if you want to restart from the beginning.'
                    : 'Click Start Import to begin fetching and saving global supplier products one by one into tbl_zqproducts before displaying them in the table.'}
            </p>
            {isDiscoveringTotal ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-flex"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 1 1-2.64-6.36" />
                  </svg>
                </motion.span>
                <span>Discovering total products before import starts</span>
              </div>
            ) : null}
            {!isDiscoveringTotal && isResumeMode && canResumeImport ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <span>Resuming from saved checkpoint</span>
              </div>
            ) : null}
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                <span>Progress</span>
                <span>
                  {hasStarted
                    ? totalToImport > 0
                      ? `${progressPercent}%`
                      : (isResumeMode ? 'Resuming...' : `${progressPercent}%`)
                    : (isDiscoveringTotal ? 'Counting...' : 'Ready')}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ type: 'spring', stiffness: 90, damping: 20, mass: 0.8 }}
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-500"
                />
              </div>
            </div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-5"
            >
              <motion.div
                variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Batches</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{progress.batches.toLocaleString()}</p>
              </motion.div>
              <motion.div
                variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Found</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{totalToImport.toLocaleString()}</p>
              </motion.div>
              <motion.div
                variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Synced</p>
                <p className="mt-1 text-xl font-bold text-emerald-700">{progress.synced.toLocaleString()}</p>
              </motion.div>
              <motion.div
                variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Skipped</p>
                <p className="mt-1 text-xl font-bold text-amber-700">{progress.skipped.toLocaleString()}</p>
              </motion.div>
              <motion.div
                variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">Failed</p>
                <p className="mt-1 text-xl font-bold text-rose-700">{progress.failed.toLocaleString()}</p>
              </motion.div>
            </motion.div>

            <div className="space-y-3">
              <p className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                {isDiscoveringTotal
                  ? 'We are scanning every available Global Supplier page first to get the exact total that will be imported.'
                  : hasStarted
                  ? (isResumeMode
                      ? 'Resume mode jumps straight to the saved cursor. Existing products are still skipped if they are encountered again.'
                      : 'This modal keeps a running count while we fetch all available global supplier products. Existing products already in tbl_zqproducts are skipped automatically.')
                  : canResumeImport
                    ? 'The counter will start from the saved checkpoint instead of repeating the earliest imported pages.'
                    : 'The counter will start moving as soon as you click Start Import.'}
              </p>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Imported So Far</p>
                <motion.p
                  key={progress.synced}
                  initial={{ opacity: 0.4, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="mt-1 text-xl font-bold text-emerald-700"
                >
                  {isDiscoveringTotal
                    ? 'Counting available global supplier products...'
                    : hasStarted
                    ? `${progress.synced.toLocaleString()} product${progress.synced === 1 ? '' : 's'} imported`
                    : 'Import has not started yet'}
                </motion.p>
                {hasStarted && progress.skipped > 0 ? (
                  <p className="mt-1 text-sm font-medium text-amber-700">
                    {progress.skipped.toLocaleString()} existing product{progress.skipped === 1 ? '' : 's'} skipped
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  isImporting || isDiscoveringTotal
                    ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isImporting || isDiscoveringTotal ? 'Cancel Import' : 'Close'}
              </button>
              <button
                type="button"
                onClick={onStartImport}
                disabled={isImporting || hasStarted || isDiscoveringTotal}
                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
              >
                {isDiscoveringTotal ? 'Counting Total...' : isImporting ? 'Importing...' : hasStarted ? 'Import Started' : (canResumeImport ? 'Resume Import' : 'Start Import')}
              </button>
              {!isImporting && !hasStarted && !isDiscoveringTotal ? (
                <button
                  type="button"
                  onClick={onStartRescan}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                >
                  Rescan from Start
                </button>
              ) : null}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function ZqCategoryMappingPanel({
  categories,
  localCategories,
  selectedZqKey,
  selectedLocalCategoryId,
  mappingStatus,
  isSaving,
  onSelectZq,
  onSelectLocalCategory,
  onMappingStatusChange,
  onSave,
}: {
  categories: ZqCategoryMappingItem[]
  localCategories: Array<{ id: number; name: string; url: string }>
  selectedZqKey: string
  selectedLocalCategoryId: number | undefined
  mappingStatus: '' | 'mapped' | 'unmapped' | 'missing'
  isSaving: boolean
  onSelectZq: (value: string) => void
  onSelectLocalCategory: (value: number | undefined) => void
  onMappingStatusChange: (value: '' | 'mapped' | 'unmapped' | 'missing') => void
  onSave: () => void
}) {
  const mappedCount = categories.filter((category) => category.status === 'mapped').length
  const unmappedCount = categories.filter((category) => category.status !== 'mapped').length

  return (
    <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">ZQ Category Mapping</p>
          <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">Map ZQ categories to AF Home categories</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            One mapping applies to all synced ZQ products under that category.
          </p>
        </div>

        <div className="grid w-full gap-3 md:grid-cols-[1.4fr_1.2fr_1fr_auto] xl:max-w-5xl">
          <select
            value={selectedZqKey}
            onChange={(event) => onSelectZq(event.target.value)}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="">Select ZQ category</option>
            {categories.map((category) => {
              const key = `${category.zqCategoryId ?? ''}::${category.zqCategoryName}`
              const suffix = category.localCategoryName ? ` -> ${category.localCategoryName}` : ' -> Needs review'
              return (
                <option key={key} value={key}>
                  {category.zqCategoryName} ({category.productCount}){suffix}
                </option>
              )
            })}
          </select>

          <select
            value={selectedLocalCategoryId ?? ''}
            onChange={(event) => onSelectLocalCategory(event.target.value ? Number(event.target.value) : undefined)}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="">Needs Review / no category</option>
            {localCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={mappingStatus}
            onChange={(event) => onMappingStatusChange(event.target.value as '' | 'mapped' | 'unmapped' | 'missing')}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="">All mapping states</option>
            <option value="mapped">Mapped products</option>
            <option value="unmapped">Needs review</option>
            <option value="missing">Missing ZQ category</option>
          </select>

          <button
            type="button"
            onClick={onSave}
            disabled={!selectedZqKey || isSaving}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? 'Saving...' : 'Save Mapping'}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{mappedCount} mapped</span>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{unmappedCount} needs review</span>
      </div>
    </div>
  )
}

export default function ProductsPageMain({ initialData = null, initialBrandType }: ProductsPageMainProps) {
  const selectionPerPage = 5000
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session, status: sessionStatus } = useSession()
  const supplierName = String((session?.user as { supplierName?: string | null; name?: string | null } | undefined)?.supplierName
    ?? (session?.user as { name?: string | null } | undefined)?.name
    ?? '')
  const sessionAccessToken = String((session?.user as { accessToken?: string } | undefined)?.accessToken ?? '')
  const isSessionLoading = sessionStatus === 'loading'
  const zqInlineStorageKey = useMemo(() => getZqInlineStorageKey(pathname || '/products'), [pathname])
  const isAdminRoute = pathname.startsWith('/admin')
  const adminIdentityKey = sessionAccessToken
    ? `${String((session?.user as { id?: string } | undefined)?.id ?? 'unknown')}:${sessionAccessToken}`
    : undefined
  const { data: adminMe } = useGetAdminMeQuery(adminIdentityKey, { skip: !sessionAccessToken || !isAdminRoute })
  const role = String(adminMe?.role ?? session?.user?.role ?? '').toLowerCase()
  const isSupplierPortal = role === 'supplier' || pathname.startsWith('/supplier')
  const linkedSupplierId = Number(adminMe?.supplier_id ?? session?.user?.supplierId ?? 0)
  const normalizedSupplierName = supplierName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const isZqSupplierAccount = normalizedSupplierName.includes('zqsupplier')
    || normalizedSupplierName.includes('afhomeglobalsupplier')
    || normalizedSupplierName.includes('globalsupplier')
  const [search,          setSearch]          = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status,          setStatus]          = useState('')
  const [catId,           setCatId]           = useState<number | undefined>(undefined)
  const [brandType,       setBrandType]       = useState<number | undefined>(
    typeof initialBrandType === 'number' && initialBrandType > 0 ? initialBrandType : undefined,
  )
  const [supplierFilterId, setSupplierFilterId] = useState<number | undefined>(undefined)
  const [page,            setPage]            = useState(1)
  const [showAddModal,    setShowAddModal]    = useState(false)
  const [showActivityLogs, setShowActivityLogs] = useState(false)
  const [showManualSelectionModal, setShowManualSelectionModal] = useState(false)
  const [manualSelectionProducts, setManualSelectionProducts] = useState<Product[]>([])
  const [manualSelectionMode, setManualSelectionMode] = useState<'review' | 'view'>('review')
  const [editProduct,     setEditProduct]     = useState<Product | null>(null)
  const [editZqPricing,   setEditZqPricing]   = useState<ZqCachedProduct | null>(null)
  const [showImportZq,    setShowImportZq]    = useState(false)
  const [isExportingZq,  setIsExportingZq]  = useState(false)
  const [showBulkEdit,    setShowBulkEdit]    = useState(false)
  const [showZqSupplierInline, setShowZqSupplierInline] = useState(() => {
    if (typeof window === 'undefined') return false

    try {
      return window.localStorage.getItem(getZqInlineStorageKey(window.location.pathname || '/products')) === '1'
    } catch {
      return false
    }
  })
  const [showZqSyncModal, setShowZqSyncModal] = useState(false)
  const [isSyncingAllZq, setIsSyncingAllZq] = useState(false)
  const [hasStartedZqImport, setHasStartedZqImport] = useState(false)
  const [isDiscoveringZqTotal, setIsDiscoveringZqTotal] = useState(false)
  const [zqTotalToImport, setZqTotalToImport] = useState(0)
  const [zqImportMode, setZqImportMode] = useState<'resume' | 'rescan'>('resume')
  const zqImportCancelRef = useRef(false)
  const [zqSyncProgress, setZqSyncProgress] = useState({
    batches: 0,
    requested: 0,
    synced: 0,
    skipped: 0,
    failed: 0,
  })
  const [zqMappingStatus, setZqMappingStatus] = useState<'' | 'mapped' | 'unmapped' | 'missing'>('')
  const [selectedZqCategoryKey, setSelectedZqCategoryKey] = useState('')
  const [selectedZqLocalCategoryId, setSelectedZqLocalCategoryId] = useState<number | undefined>(undefined)
  const [deletingIds,     setDeletingIds]     = useState<number[]>([])
  const [removingManualCheckoutIds, setRemovingManualCheckoutIds] = useState<number[]>([])
  const [selectedIds,     setSelectedIds]     = useState<number[]>([])
  const [applyManualCheckout, { isLoading: isApplyingManualCheckout }] = useManualCheckoutApplyMutation()
  const [fetchZqImportPreview] = useFetchZqImportPreviewMutation()
  const [syncZqProducts] = useSyncZqProductsMutation()
  const [saveGeneralSettings, { isLoading: isSavingManualMode }] = useUpdateAdminGeneralSettingsMutation()
  const [productOverrides, setProductOverrides] = useState<Record<number, Product>>({})
  const [createdProducts, setCreatedProducts] = useState<Product[]>([])
  const [useInitialData,  setUseInitialData]  = useState(Boolean(initialData))
  const [userPerPage, setUserPerPage] = useState<number | 'all'>(50)
  const defaultPerPage = 50
  const searchPerPage = 500
  const perPage = debouncedSearch ? searchPerPage : (userPerPage === 'all' ? 10000 : userPerPage)
  const canShowZqSupplierSide = !isSupplierPortal || isZqSupplierAccount
  const zqInlineActive = canShowZqSupplierSide && (showZqSupplierInline || isSupplierPortal)
  const { data: adminGeneralSettingsData } = useGetAdminGeneralSettingsQuery(undefined, { skip: isSupplierPortal })
  const manualHeaderToggle = Boolean(adminGeneralSettingsData?.settings?.enable_manual_checkout_mode)

  useEffect(() => {
    const modal = (searchParams.get('modal') ?? '').toLowerCase()
    if (modal === 'add-product') {
      setShowAddModal(true)
    }
  }, [searchParams])

  const { data: supplierBrandsData } = useGetPublicProductBrandsQuery(undefined, { skip: !isSupplierPortal })
  const { data: supplierListData } = useGetSuppliersQuery(undefined, { skip: isSupplierPortal })
  const supplierRecord = useMemo(() => {
    if (!isSupplierPortal) return undefined
    const suppliers = supplierListData?.suppliers ?? []
    if (linkedSupplierId > 0) {
      return suppliers.find((supplier) => supplier.id === linkedSupplierId) ?? suppliers[0]
    }
    return suppliers[0]
  }, [isSupplierPortal, linkedSupplierId, supplierListData?.suppliers])

  useEffect(() => {
    if (!isSupplierPortal || brandType !== undefined) return
    const brands = supplierBrandsData?.brands ?? []
    if (brands.length === 0) return
    const candidates = [
      supplierName,
      supplierRecord?.company,
      supplierRecord?.name,
    ]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.toLowerCase().replace(/[^a-z0-9]/g, ''))
    if (candidates.length === 0) return
    const pickBestBrandId = () => {
      const exactMatch = brands.find((brand) => {
        const brandKey = String(brand.name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
        return brandKey !== '' && candidates.some((candidate) => candidate === brandKey)
      })
      if (exactMatch?.id) {
        return Number(exactMatch.id)
      }

      let bestId = 0
      let bestScore = 0
      let bestLen = 0
      brands.forEach((brand) => {
        const brandKey = String(brand.name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
        if (!brandKey) return
        candidates.forEach((candidate) => {
          if (!candidate) return
          let score = 0
          if (candidate === brandKey) score = 3
          else if (candidate.includes(brandKey)) score = 2
          else if (brandKey.includes(candidate)) score = 1
          if (score > 0) {
            const len = brandKey.length
            if (score > bestScore || (score === bestScore && len > bestLen)) {
              bestScore = score
              bestLen = len
              bestId = Number(brand.id ?? 0)
            }
          }
        })
      })
      return bestId
    }

    const matchId = pickBestBrandId()
    if (matchId > 0) {
      setBrandType(matchId)
    }
  }, [brandType, isSupplierPortal, supplierBrandsData?.brands, supplierName, supplierRecord?.company, supplierRecord?.name])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const adminQueryArgs = {
    page: debouncedSearch ? 1 : page,
    perPage,
    search: debouncedSearch || undefined,
    status: status === 'new' ? undefined : (status || undefined),
    catId,
    brandType,
    supplierId: isSupplierPortal && linkedSupplierId > 0 ? linkedSupplierId : supplierFilterId,
  }
  const publicQueryArgs = {
    page: debouncedSearch ? 1 : page,
    perPage,
    search: debouncedSearch || undefined,
    status: status === 'new' ? undefined : (status || undefined),
    catId,
    brandType,
    supplierId: isSupplierPortal && linkedSupplierId > 0 ? linkedSupplierId : undefined,
  }

  const {
    data: adminData,
    isLoading: isAdminLoading,
    isFetching: isAdminFetching,
    isError: isAdminError,
    error: adminError,
    refetch: refetchAdminProducts,
  } = useGetProductsQuery(adminQueryArgs, { skip: isSupplierPortal, refetchOnMountOrArgChange: true })

  const {
    data: publicData,
    isLoading: isPublicLoading,
    isFetching: isPublicFetching,
    isError: isPublicError,
    error: publicError,
    refetch: refetchPublicProducts,
  } = useGetPublicProductsQuery(publicQueryArgs, { skip: !isSupplierPortal, refetchOnMountOrArgChange: true })

  const data = isSupplierPortal ? publicData : adminData
  const isLoading = isSupplierPortal ? isPublicLoading : isAdminLoading
  const isFetching = isSupplierPortal ? isPublicFetching : isAdminFetching
  const isError = isSupplierPortal ? isPublicError : isAdminError
  const error = isSupplierPortal ? publicError : adminError
  const refetchProducts = isSupplierPortal ? refetchPublicProducts : refetchAdminProducts

  const adminSelectionQueryArgs = {
    ...adminQueryArgs,
    page: 1,
    perPage: selectionPerPage,
  }
  const publicSelectionQueryArgs = {
    ...publicQueryArgs,
    page: 1,
    perPage: selectionPerPage,
  }

  const { data: adminSelectionData } = useGetProductsQuery(
    adminSelectionQueryArgs,
    { skip: isSupplierPortal, refetchOnMountOrArgChange: true },
  )
  const { data: publicSelectionData } = useGetPublicProductsQuery(
    publicSelectionQueryArgs,
    { skip: !isSupplierPortal, refetchOnMountOrArgChange: true },
  )

  const selectionData = isSupplierPortal ? publicSelectionData : adminSelectionData

  /* Lightweight count queries for stats */
  const activeCountArgs = {
    perPage: 1,
    status: '1',
    supplierId: isSupplierPortal && linkedSupplierId > 0 ? linkedSupplierId : supplierFilterId,
    brandType: isSupplierPortal ? brandType : undefined,
  }
  const inactiveCountArgs = {
    perPage: 1,
    status: '0',
    supplierId: isSupplierPortal && linkedSupplierId > 0 ? linkedSupplierId : supplierFilterId,
    brandType: isSupplierPortal ? brandType : undefined,
  }

  const { data: adminActiveCountData, refetch: refetchAdminActiveCount } = useGetProductsQuery(
    activeCountArgs,
    { skip: isSupplierPortal, refetchOnMountOrArgChange: true },
  )
  const { data: adminInactiveCountData, refetch: refetchAdminInactiveCount } = useGetProductsQuery(
    inactiveCountArgs,
    { skip: isSupplierPortal, refetchOnMountOrArgChange: true },
  )
  const { data: publicActiveCountData, refetch: refetchPublicActiveCount } = useGetPublicProductsQuery(
    activeCountArgs,
    { skip: !isSupplierPortal, refetchOnMountOrArgChange: true },
  )
  const { data: publicInactiveCountData, refetch: refetchPublicInactiveCount } = useGetPublicProductsQuery(
    inactiveCountArgs,
    { skip: !isSupplierPortal, refetchOnMountOrArgChange: true },
  )

  const activeCountData = isSupplierPortal ? publicActiveCountData : adminActiveCountData
  const inactiveCountData = isSupplierPortal ? publicInactiveCountData : adminInactiveCountData
  const refetchActiveCount = isSupplierPortal ? refetchPublicActiveCount : refetchAdminActiveCount
  const refetchInactiveCount = isSupplierPortal ? refetchPublicInactiveCount : refetchAdminInactiveCount
  const {
    data: zqSummaryData,
    refetch: refetchZqSummary,
  } = useGetZqProductsSummaryQuery(undefined, { skip: !zqInlineActive })
  const {
    data: zqCategoryMappingsData,
    refetch: refetchZqCategoryMappings,
  } = useGetZqCategoryMappingsQuery(undefined, { skip: !zqInlineActive || !isSupplierPortal })
  const [upsertZqCategoryMapping, { isLoading: isSavingZqCategoryMapping }] = useUpsertZqCategoryMappingMutation()
  const {
    data: zqCachedData,
    isLoading: isLoadingZqCached,
    isFetching: isFetchingZqCached,
    refetch: refetchZqCachedProducts,
  } = useGetZqCachedProductsQuery({
    page: debouncedSearch ? 1 : page,
    perPage,
    search: debouncedSearch || undefined,
    brandType: isSupplierPortal && !isZqSupplierAccount ? brandType : undefined,
    localCategoryId: catId,
    mappingStatus: zqMappingStatus || undefined,
  }, { skip: !zqInlineActive, refetchOnMountOrArgChange: true })

  const [deleteProduct] = useDeleteProductMutation()

  useEffect(() => {
    if (data) {
      setUseInitialData(false)
    }
  }, [data])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      if (isSupplierPortal && isSessionLoading) {
        return
      }

      if (!canShowZqSupplierSide) {
        window.localStorage.removeItem(zqInlineStorageKey)
        return
      }

      window.localStorage.setItem(zqInlineStorageKey, showZqSupplierInline ? '1' : '0')
    } catch {
      // Ignore localStorage failures.
    }
  }, [canShowZqSupplierSide, isSessionLoading, isSupplierPortal, showZqSupplierInline, zqInlineStorageKey])

  useEffect(() => {
    if (isSupplierPortal && !isSessionLoading && !canShowZqSupplierSide && showZqSupplierInline) {
      setShowZqSupplierInline(false)
    }
  }, [canShowZqSupplierSide, isSessionLoading, isSupplierPortal, showZqSupplierInline])

  const handleProductsSaved = (updatedProduct?: Product) => {
    setUseInitialData(false)
    if (updatedProduct) {
      setProductOverrides((prev) => ({ ...prev, [updatedProduct.id]: updatedProduct }))
      setCreatedProducts((prev) => {
        const next = [updatedProduct, ...prev.filter((product) => product.id !== updatedProduct.id)]
        return next
      })
    }
    router.refresh()
    void revalidateStorefront()
    void refetchProducts()
    void refetchActiveCount()
    void refetchInactiveCount()
  }

  const products = useMemo(() => {
    const rawProducts = data?.products
      ? data.products
      : (useInitialData ? (initialData?.products ?? []) : [])
    const mergedProducts = rawProducts.map((product) => productOverrides[product.id] ?? product)
    const mergedById = new Map<number, Product>()

    createdProducts.forEach((product) => {
      mergedById.set(product.id, productOverrides[product.id] ?? product)
    })

    mergedProducts.forEach((product) => {
      mergedById.set(product.id, product)
    })

    const mergedProductList = Array.from(mergedById.values())

      if (!isSupplierPortal || linkedSupplierId <= 0) {
      return mergedProductList.filter((product) => {
        if (!supplierFilterId || supplierFilterId <= 0) return true
        return Number(product.supplierId ?? 0) === supplierFilterId
      })
      }

    return mergedProductList.filter((product) => {
      const matchesSupplier = Number(product.supplierId ?? 0) === linkedSupplierId
      const matchesBrand = typeof brandType === 'number' && brandType > 0
        ? Number(product.brandType ?? 0) === brandType
        : false
      return matchesSupplier || matchesBrand
    })
  }, [brandType, createdProducts, data?.products, initialData?.products, isSupplierPortal, linkedSupplierId, productOverrides, supplierFilterId, useInitialData])

  const zqRows = useMemo(
    () => (zqCachedData?.products ?? []).map(mapCachedZqProductToLocalRow),
    [zqCachedData?.products],
  )

  const visibleProducts = useMemo(() => {
    if (zqInlineActive) {
      return zqRows
    }

    const baseProducts = status === 'new' ? products.filter(isNewProduct) : products
    const categoryFiltered =
      typeof catId === 'number' && catId > 0
        ? baseProducts.filter((product) => Number(product.catid ?? 0) === catId)
        : baseProducts
    const keyword = debouncedSearch.trim().toLowerCase()
    if (!keyword) return categoryFiltered

    const terms = keyword.split(/\s+/).filter(Boolean)
    if (terms.length === 0) return categoryFiltered

    return categoryFiltered.filter((product) => {
      const haystacks = [
        product.name,
        product.sku,
        product.description,
        product.specifications,
        product.material,
        product.brand,
        ...(product.variants ?? []).flatMap((variant) => [
          variant.sku,
          variant.name,
          variant.color,
          variant.size,
        ]),
      ]
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => value.toLowerCase())

      return terms.every((term) => haystacks.some((value) => value.includes(term)))
    })
  }, [catId, debouncedSearch, products, status, zqInlineActive, zqRows])

  const selectableProducts = useMemo(() => {
    const selectionSource = selectionData?.products
      ? selectionData.products
      : products
    const mergedSelection = selectionSource.map((product) => productOverrides[product.id] ?? product)
    const mergedById = new Map<number, Product>()

    createdProducts.forEach((product) => {
      const candidate = productOverrides[product.id] ?? product
      const matchesSupplierFilter = !supplierFilterId || supplierFilterId <= 0 || Number(candidate.supplierId ?? 0) === supplierFilterId
      const matchesLinkedSupplier = !isSupplierPortal || linkedSupplierId <= 0
        ? true
        : Number(candidate.supplierId ?? 0) === linkedSupplierId
          || (typeof brandType === 'number' && brandType > 0 && Number(candidate.brandType ?? 0) === brandType)

      if (matchesSupplierFilter && matchesLinkedSupplier) {
        mergedById.set(candidate.id, candidate)
      }
    })

    mergedSelection.forEach((product) => {
      mergedById.set(product.id, product)
    })

    const rows = Array.from(mergedById.values())
    return status === 'new' ? rows.filter(isNewProduct) : rows
  }, [
    brandType,
    createdProducts,
    isSupplierPortal,
    linkedSupplierId,
    productOverrides,
    products,
    selectionData?.products,
    status,
    supplierFilterId,
  ])

  const selectableIds = useMemo(
    () => new Set(selectableProducts.map((product) => product.id)),
    [selectableProducts],
  )

  const meta = useMemo(() => {
    return data?.meta ?? (useInitialData ? initialData?.meta : undefined)
  }, [data?.meta, initialData?.meta, useInitialData])

  const visibleMeta = useMemo(() => {
    if (zqInlineActive) {
      return zqCachedData?.meta ?? {
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0,
        from: 0,
        to: 0,
      }
    }

    // Keep API pagination totals (meta.total) whenever we're not in client-only "new" status mode.
    // Manual checkout mode should not change how total results are counted.
    if (!debouncedSearch && status !== 'new') {
      return meta
    }

    return {
      current_page: 1,
      last_page: 1,
      per_page: visibleProducts.length || perPage,
      total: meta?.total ?? visibleProducts.length,
      from: visibleProducts.length > 0 ? 1 : 0,
      to: visibleProducts.length,
    }
  }, [debouncedSearch, meta, perPage, status, visibleProducts.length, zqCachedData?.meta, zqInlineActive])

  /* Low-stock count from current page */
  const lowStockCount = useMemo(
    () => visibleProducts.filter((product) => {
      const qty = getEffectiveStockQty(product)
      return qty > 0 && qty <= 5
    }).length,
    [visibleProducts],
  )

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleStatus = (v: string) => { setStatus(v); setPage(1) }
  const handleCatId  = (v: number | undefined) => { setCatId(v); setPage(1) }
  const handleBrandType  = (v: number | undefined) => { setBrandType(v); setPage(1) }
  const handleSupplierFilterId = (v: number | undefined) => { setSupplierFilterId(v); setPage(1) }
  const zqCategoryMappings = zqCategoryMappingsData?.zqCategories ?? []
  const zqLocalCategories = zqCategoryMappingsData?.localCategories ?? []

  const handleSelectZqCategory = (value: string) => {
    setSelectedZqCategoryKey(value)
    const selected = zqCategoryMappings.find((category) => `${category.zqCategoryId ?? ''}::${category.zqCategoryName}` === value)
    setSelectedZqLocalCategoryId(selected?.localCategoryId ?? undefined)
  }

  const handleSaveZqCategoryMapping = async () => {
    const selected = zqCategoryMappings.find((category) => `${category.zqCategoryId ?? ''}::${category.zqCategoryName}` === selectedZqCategoryKey)
    if (!selected) {
      showErrorToast('Select a ZQ category first.')
      return
    }

    try {
      const result = await upsertZqCategoryMapping({
        zqCategoryId: selected.zqCategoryId,
        zqCategoryName: selected.zqCategoryName,
        localCategoryId: selectedZqLocalCategoryId,
      }).unwrap()

      showSuccessToast(result.message || 'ZQ category mapping saved.')
      await refetchZqCategoryMappings()
      await refetchZqCachedProducts()
    } catch (error) {
      const apiError = error as { data?: { message?: string } }
      showErrorToast(apiError?.data?.message || 'Failed to save ZQ category mapping.')
    }
  }

  const supplierOptions = useMemo(
    () => (supplierListData?.suppliers ?? []).map((supplier) => ({
      id: supplier.id,
      label: supplier.company?.trim() || supplier.name?.trim() || `Supplier #${supplier.id}`,
    })),
    [supplierListData?.suppliers],
  )

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => selectableIds.has(id)))
  }, [selectableIds])

  useEffect(() => {
    setSelectedIds([])
  }, [manualHeaderToggle])

  useEffect(() => {
    if (zqInlineActive) {
      setSelectedIds([])
    }
  }, [zqInlineActive])

  const handleToggleManualCheckoutMode = async () => {
    const nextValue = !manualHeaderToggle
    const payload = new FormData()
    payload.append('enable_manual_checkout_mode', nextValue ? '1' : '0')

    try {
      await saveGeneralSettings(payload).unwrap()
      showSuccessToast(nextValue ? 'Manual checkout mode enabled.' : 'Manual checkout mode disabled.')
    } catch (error) {
      const apiError = error as { data?: { message?: string } }
      showErrorToast(apiError?.data?.message || 'Failed to update manual checkout mode.')
    }
  }

  const handleCancelZqImport = () => {
    if (isSyncingAllZq || isDiscoveringZqTotal) {
      zqImportCancelRef.current = true
      showSuccessToast('Global Supplier import will stop after the current item finishes.')
      return
    }

    setShowZqSyncModal(false)
    setHasStartedZqImport(false)
    setIsDiscoveringZqTotal(false)
  }

  const requestSupplierZq = async <T,>(path: string, body: Record<string, unknown>): Promise<T> => {
    const apiBaseUrl = (process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').replace(/\/+$/, '')
    if (!apiBaseUrl) {
      throw new Error('Laravel API URL is not configured.')
    }

    if (!sessionAccessToken) {
      throw new Error('Supplier session token is missing. Please log in again.')
    }

    const response = await fetch(`${apiBaseUrl}/api/supplier/products/zq/${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${sessionAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const payload = await response.json().catch(() => ({})) as { message?: string }

    if (!response.ok) {
      if (response.status === 401) {
        void fetch('/api/supplier/auth/signout', { method: 'POST', credentials: 'include' })
          .catch(() => {})
          .finally(() => { window.location.replace('/supplier/login?session=expired') })
      }
      throw new Error(payload.message || `Global Supplier request failed with status ${response.status}.`)
    }

    return payload as T
  }

  const discoverZqTotal = async (mode: 'resume' | 'rescan') => {
    setIsDiscoveringZqTotal(true)
    let cursor: string | null = null
    let total = 0

    try {
      do {
        if (zqImportCancelRef.current) {
          break
        }

        const previewPayload = {
          cursor: cursor ?? undefined,
          size: 100,
          resumeFromSaved: cursor === null && mode === 'resume',
          resetCursor: cursor === null && mode === 'rescan',
        }
        const result = isSupplierPortal
          ? await requestSupplierZq<{ zq?: Record<string, unknown> }>('fetch-preview', {
              ...previewPayload,
              resume_from_saved: previewPayload.resumeFromSaved,
              reset_cursor: previewPayload.resetCursor,
            })
          : await fetchZqImportPreview(previewPayload).unwrap()

        const zqPayload = (result.zq && typeof result.zq === 'object') ? result.zq : {}
        const meta = parseZqPreviewMeta(zqPayload)
        total += meta.count
        setZqTotalToImport(total)

        cursor = meta.nextCursor

        if (!meta.hasMore) {
          break
        }
      } while (cursor)

      return total
    } finally {
      setIsDiscoveringZqTotal(false)
    }
  }

  const syncAllZqProducts = async (mode: 'resume' | 'rescan') => {
    if (isSyncingAllZq) return

    zqImportCancelRef.current = false
    setZqImportMode(mode)
    setShowZqSyncModal(true)
    setShowZqSupplierInline(true)
    setHasStartedZqImport(false)
    setZqTotalToImport(0)
    setZqSyncProgress({ batches: 0, requested: 0, synced: 0, skipped: 0, failed: 0 })
    setPage(1)
    let total = 0

    try {
      if (mode === 'rescan') {
        total = await discoverZqTotal(mode)
        if (zqImportCancelRef.current || total <= 0) {
          setShowZqSyncModal(false)
          setHasStartedZqImport(false)
          return
        }
      } else {
        setZqTotalToImport(0)
      }

      setHasStartedZqImport(true)
      setIsSyncingAllZq(true)
      setZqTotalToImport(total)
      let cursor: string | null = null
      let batchCounter = 0

      do {
        if (zqImportCancelRef.current) {
          showSuccessToast('Global Supplier import cancelled.')
          break
        }

        const syncPayload: ZqSyncProductsPayload = {
          cursor: cursor ?? undefined,
          size: 100,
          resumeFromSaved: cursor === null && mode === 'resume',
          resetCursor: cursor === null && mode === 'rescan',
        }
        const result: ZqSyncProductsResponse = isSupplierPortal
          ? await requestSupplierZq<ZqSyncProductsResponse>('sync', {
              ...syncPayload,
              resume_from_saved: syncPayload.resumeFromSaved,
              reset_cursor: syncPayload.resetCursor,
            })
          : await syncZqProducts(syncPayload).unwrap()
        batchCounter += 1

        setZqSyncProgress((current) => ({
          batches: current.batches + 1,
          requested: current.requested + (result.summary?.requested ?? 0),
          synced: current.synced + (result.summary?.synced ?? 0),
          skipped: current.skipped + (result.summary?.skipped ?? 0),
          failed: current.failed + (result.summary?.failed ?? 0),
        }))

        if (batchCounter === 1 || batchCounter % 5 === 0) {
          void refetchZqCachedProducts()
        }
        if (batchCounter === 1 || batchCounter % 20 === 0) {
          void refetchZqSummary()
        }

        cursor = result.nextCursor ?? null

        if (!result.hasMore) {
          break
        }
      } while (cursor)

      if (!zqImportCancelRef.current) {
        setShowZqSupplierInline(true)
        setPage(1)
        await refetchZqSummary()
        await refetchZqCachedProducts()
        setShowZqSyncModal(false)
        showSuccessToast('All global supplier products imported to tbl_zqproducts successfully.')
      }
    } catch (error) {
      const apiError = error as { data?: { message?: string } }
      showErrorToast(apiError?.data?.message || (error instanceof Error ? error.message : '') || 'Failed to sync all global supplier products.')
    } finally {
      setIsSyncingAllZq(false)
      setShowZqSyncModal(false)
      setHasStartedZqImport(false)
      setZqImportMode('resume')
      zqImportCancelRef.current = false
    }
  }

  const zqImportedCount = Number(zqSummaryData?.total ?? visibleMeta?.total ?? 0)
  const zqImportButtonLabel = isSyncingAllZq || isDiscoveringZqTotal
    ? 'Syncing Global Supplier Products...'
    : isSupplierPortal
      ? (zqImportedCount > 0 ? 'Sync Latest Global Supplier Products' : 'Sync Products from ZQ')
    : zqImportedCount > 0
      ? 'Refresh Global Supplier Products'
      : 'Start AF HOME GLOBAL SUPPLIER Import'
  const zqImportButtonMobileLabel = isSyncingAllZq || isDiscoveringZqTotal
    ? 'Syncing...'
    : isSupplierPortal
      ? (zqImportedCount > 0 ? 'Sync' : 'Sync ZQ')
    : zqImportedCount > 0
      ? 'Refresh'
      : 'Start Import'
  const handleStartZqImport = () => {
    void syncAllZqProducts(zqImportedCount > 0 ? 'resume' : 'rescan')
  }

  const handleDelete = async (id: number) => {
    setDeletingIds(prev => [...prev, id])
    try {
      await deleteProduct(id).unwrap()
      await revalidateStorefront()
      setProductOverrides((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setCreatedProducts((prev) => prev.filter((product) => product.id !== id))
      setSelectedIds(prev => prev.filter(item => item !== id))
      showSuccessToast('Product deleted successfully.')
    } catch {
      showErrorToast('Failed to delete product.')
    } finally {
      setDeletingIds(prev => prev.filter(item => item !== id))
    }
  }

  const handleToggleSelect    = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleToggleSelectAll = () => {
    const matchingIds = selectableProducts.map((product) => product.id)
    const allSelected = matchingIds.length > 0 && matchingIds.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !selectableIds.has(id)))
      return
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...matchingIds])))
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    const ids = [...selectedIds]
    setDeletingIds(prev => Array.from(new Set([...prev, ...ids])))
    try {
      await Promise.all(ids.map(id => deleteProduct(id).unwrap()))
      await revalidateStorefront()
      setProductOverrides((prev) => {
        const next = { ...prev }
        ids.forEach((id) => delete next[id])
        return next
      })
      setCreatedProducts((prev) => prev.filter((product) => !ids.includes(product.id)))
      setSelectedIds([])
      showSuccessToast(`${ids.length} product(s) deleted successfully.`)
    } catch {
      showErrorToast('Failed to delete selected products.')
    } finally {
      setDeletingIds(prev => prev.filter(id => !ids.includes(id)))
    }
  }

  const selectedProducts = useMemo(
    () => selectableProducts.filter((product) => selectedIds.includes(product.id)),
    [selectableProducts, selectedIds],
  )

  const manualCheckoutProducts = useMemo(
    () => selectableProducts.filter((product) => Boolean(product.manualCheckoutEnabled)),
    [selectableProducts],
  )

  const openManualSelectionModal = (products: Product[], mode: 'review' | 'view' = 'review') => {
    if (products.length === 0) {
      showErrorToast(mode === 'view' ? 'No manual checkout products found yet.' : 'Select at least one product first.')
      return
    }

    setManualSelectionProducts(products)
    setManualSelectionMode(mode)
    setShowManualSelectionModal(true)
  }

  const closeManualSelectionModal = () => {
    setShowManualSelectionModal(false)
    setManualSelectionProducts([])
    setManualSelectionMode('review')
  }

  const [isExporting, setIsExporting] = useState(false)

  const downloadExportCSV = async (params: Record<string, string | number | undefined>) => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const searchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '' && value !== null) {
          searchParams.set(key, String(value))
        }
      }
      const qs = searchParams.toString()
      const url = `${process.env.NEXT_PUBLIC_LARAVEL_API_URL}/api/admin/products/export${qs ? `?${qs}` : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionAccessToken}`,
          Accept: 'text/csv,application/octet-stream,*/*',
        },
      })
      if (!response.ok) {
        showErrorToast('Export failed. Please try again.')
        return
      }
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      const disposition = response.headers.get('content-disposition')
      const match = disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      const now = new Date()
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
      a.download = match?.[1]?.replace(/['"]/g, '') ?? `products-export-${timestamp}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)
    } catch {
      showErrorToast('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = () => {
    exportToCSV(visibleProducts)
  }

  const handleExportAllZqCSV = async () => {
    if (isExportingZq) return
    setIsExportingZq(true)
    try {
      const apiBase = (process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').replace(/\/+$/, '')
      const url = `${apiBase}/api/supplier/products/zq/cached/export`
      const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${sessionAccessToken}`, Accept: 'application/json' },
      })
      if (!res.ok) { showErrorToast('Export failed. Please try again.'); return }
      const json = await res.json() as { products: ZqCachedProduct[]; total: number }
      exportZqToCSV(json.products)
    } catch {
      showErrorToast('Export failed. Please try again.')
    } finally {
      setIsExportingZq(false)
    }
  }

  const handleExportAllCSV = () => {
    downloadExportCSV({
      supplier_id: isSupplierPortal && linkedSupplierId > 0 ? linkedSupplierId : undefined,
    })
  }


  const handleApplyManualCheckout = async () => {
    if (manualSelectionProducts.length === 0) {
      showErrorToast('Select at least one product first.')
      return
    }

    try {
      const result = await applyManualCheckout({
        product_ids: manualSelectionProducts.map((product) => product.id),
        enabled: true,
      }).unwrap()

      const updatedIds = new Set(
        result.results
          .filter((row) => row.status === 'updated')
          .map((row) => row.product_id),
      )
      const failedCount = Number(result.summary?.failed ?? 0)

      if (updatedIds.size > 0) {
        setProductOverrides((current) => {
          const next = { ...current }
          manualSelectionProducts.forEach((product) => {
            if (updatedIds.has(product.id)) {
              next[product.id] = {
                ...product,
                manualCheckoutEnabled: true,
              }
            }
          })
          return next
        })
      }

      setSelectedIds((current) => current.filter((id) => !updatedIds.has(id)))
      closeManualSelectionModal()

      if (updatedIds.size > 0 && failedCount === 0) {
        showSuccessToast(result.message || 'Selected products were added to manual checkout.')
        return
      }

      if (updatedIds.size > 0 && failedCount > 0) {
        showSuccessToast(`${updatedIds.size} product(s) added to manual checkout.`)
        const firstFailure = result.results.find((row) => row.status === 'failed')?.message
        if (firstFailure) {
          showErrorToast(firstFailure)
        }
        return
      }

      showErrorToast(result.results.find((row) => row.status === 'failed')?.message || result.message || 'No products were added to manual checkout.')
    } catch (error) {
      const apiError = error as { data?: { message?: string } }
      showErrorToast(apiError?.data?.message || 'Failed to save manual checkout products.')
    }
  }

  const handleRemoveManualCheckout = async (product: Product) => {
    setRemovingManualCheckoutIds((current) => Array.from(new Set([...current, product.id])))
    try {
      const result = await applyManualCheckout({
        product_ids: [product.id],
        enabled: false,
      }).unwrap()

      const updated = result.results.find((row) => row.product_id === product.id && row.status === 'updated')
      if (!updated) {
        showErrorToast(result.results.find((row) => row.product_id === product.id)?.message || result.message || 'Failed to remove product from manual checkout.')
        return
      }

      setProductOverrides((current) => ({
        ...current,
        [product.id]: {
          ...product,
          manualCheckoutEnabled: false,
        },
      }))
      setManualSelectionProducts((current) => {
        const next = current.filter((item) => item.id !== product.id)
        if (next.length === 0) {
          setShowManualSelectionModal(false)
          setManualSelectionMode('review')
        }
        return next
      })
      showSuccessToast(updated.message || `${product.name} removed from manual checkout.`)
    } catch (error) {
      const apiError = error as { data?: { message?: string } }
      showErrorToast(apiError?.data?.message || 'Failed to remove product from manual checkout.')
    } finally {
      setRemovingManualCheckoutIds((current) => current.filter((id) => id !== product.id))
    }
  }

  const loadErrorMessage = useMemo(() => {
    if (!error || typeof error !== 'object') {
      return 'Failed to load products. Please try again.'
    }

    if ('status' in error && error.status === 401) {
      return 'Your session may have expired. Please sign in again.'
    }

    if ('data' in error && error.data && typeof error.data === 'object' && 'message' in error.data) {
      const message = error.data.message
      if (typeof message === 'string' && message.trim().length > 0) {
        return message
      }
    }

    if ('error' in error && typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error
    }

    return 'Failed to load products. Please try again.'
  }, [error])

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Products</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-300">
            {manualHeaderToggle ? 'Viewing products assigned to manual checkout.' : 'Manage your product catalog'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleManualCheckoutMode}
              disabled={isSavingManualMode}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors border ${
                manualHeaderToggle
                  ? 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/40 dark:bg-teal-900/20 dark:text-teal-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className={`relative h-5 w-9 rounded-full transition-colors ${manualHeaderToggle ? 'bg-teal-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${manualHeaderToggle ? 'left-4' : 'left-0.5'}`} />
              </div>
              <span className="hidden sm:inline">
                {isSavingManualMode
                  ? 'Saving...'
                  : manualHeaderToggle
                    ? 'Manual Checkout On'
                    : 'Manual Checkout Off'}
              </span>
              <span className="sm:hidden">Manual</span>
            </button>
          {canShowZqSupplierSide ? (
            <button
              type="button"
              onClick={handleStartZqImport}
              disabled={isSyncingAllZq || isDiscoveringZqTotal}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors border ${
                zqInlineActive
                  ? 'border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-300'
                  : 'border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-300 dark:hover:bg-sky-900/30'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v4H4zm0 8h16v8H4zm4 4h.01M12 16h4" />
              </svg>
              <span className="hidden sm:inline">
                {zqImportButtonLabel}
              </span>
              <span className="sm:hidden">{zqImportButtonMobileLabel}</span>
            </button>
          ) : null}
          <button
            onClick={() => setShowActivityLogs(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m-6 9 2 2 4-4"/>
            </svg>
            <span className="hidden sm:inline">Upload History</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            <span className="hidden sm:inline">Add Product</span>
          </button>
        </div>
      </motion.div>

      {/* ── Stats strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <StatCard
          label="Total Products"
          value={zqInlineActive ? (zqSummaryData?.total ?? visibleMeta?.total ?? 0).toLocaleString() : (isLoading ? '—' : (meta?.total ?? products.length).toLocaleString())}
          colorClass="bg-teal-100"
          icon={
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          }
        />
        <StatCard
          label="Active"
          value={zqInlineActive ? (zqSummaryData?.active ?? 0).toLocaleString() : (activeCountData ? (activeCountData.meta?.total ?? 0).toLocaleString() : '—')}
          colorClass="bg-emerald-100"
          icon={
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        />
        <StatCard
          label="Inactive"
          value={zqInlineActive ? (zqSummaryData?.inactive ?? 0).toLocaleString() : (inactiveCountData ? (inactiveCountData.meta?.total ?? 0).toLocaleString() : '—')}
          colorClass="bg-slate-100"
          icon={
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        />
        <StatCard
          label="Low Stock"
          value={zqInlineActive ? (zqSummaryData?.low_stock ?? lowStockCount) : (isLoading ? '—' : lowStockCount)}
          sub="on this page (qty ≤ 5)"
          colorClass={lowStockCount > 0 ? 'bg-orange-100' : 'bg-slate-100'}
          icon={
            <svg className={`w-5 h-5 ${lowStockCount > 0 ? 'text-orange-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          }
        />
      </motion.div>

      {/* ── Toolbar ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <ProductsToolbar
          search={search} onSearch={handleSearch}
          status={status} onStatus={handleStatus}
          catId={catId}   onCatId={handleCatId}
          brandType={brandType} onBrandType={handleBrandType}
          showBrandFilter={!isSupplierPortal}
          resultCount={visibleMeta?.total ?? visibleProducts.length}
          supplierId={isSupplierPortal && linkedSupplierId > 0 ? linkedSupplierId : undefined}
          supplierFilterId={!isSupplierPortal ? supplierFilterId : undefined}
          onSupplierFilterId={!isSupplierPortal ? handleSupplierFilterId : undefined}
          supplierOptions={!isSupplierPortal ? supplierOptions : undefined}
          selectedCount={selectedIds.length}
          onViewSelected={() => openManualSelectionModal(selectedProducts)}
          manualCheckoutCount={manualCheckoutProducts.length}
          onViewManualCheckout={() => openManualSelectionModal(manualCheckoutProducts, 'view')}
        />
      </motion.div>

      {zqInlineActive && isSupplierPortal ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ZqCategoryMappingPanel
            categories={zqCategoryMappings}
            localCategories={zqLocalCategories}
            selectedZqKey={selectedZqCategoryKey}
            selectedLocalCategoryId={selectedZqLocalCategoryId}
            mappingStatus={zqMappingStatus}
            isSaving={isSavingZqCategoryMapping}
            onSelectZq={handleSelectZqCategory}
            onSelectLocalCategory={setSelectedZqLocalCategoryId}
            onMappingStatusChange={(value) => {
              setZqMappingStatus(value)
              setPage(1)
            }}
            onSave={handleSaveZqCategoryMapping}
          />
        </motion.div>
      ) : null}

      {/* ── Content ── */}
      <ZqSyncProgressModal
        isOpen={showZqSyncModal}
        progress={zqSyncProgress}
        isImporting={isSyncingAllZq}
        hasStarted={hasStartedZqImport}
        totalToImport={zqTotalToImport}
        isDiscoveringTotal={isDiscoveringZqTotal}
        hasSavedCursor={Boolean(zqSummaryData?.has_saved_cursor)}
        hasImportedProducts={Number(zqSummaryData?.total ?? 0) > 0}
        importMode={zqImportMode}
        onStartImport={() => {
          void syncAllZqProducts('resume')
        }}
        onStartRescan={() => {
          void syncAllZqProducts('rescan')
        }}
        onCancel={handleCancelZqImport}
      />


      {!zqInlineActive && isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadErrorMessage}</div>
      ) : !zqInlineActive && isLoading && !data && !initialData ? (
        <SkeletonTable />
      ) : (
        <div className="space-y-2">
          {/* Fetching indicator */}
          {(isFetching || (zqInlineActive && isFetchingZqCached)) && (
            <div className="google-loading-bar" />
          )}

          {/* Bulk action bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 dark:border-red-900/40 dark:bg-red-950/20">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300">
                  <span className="font-semibold">{selectedIds.length}</span> product{selectedIds.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openManualSelectionModal(selectedProducts)}
                  className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:border-teal-300 hover:bg-teal-50 dark:border-teal-900/40 dark:bg-slate-900 dark:text-teal-300 dark:hover:bg-slate-800"
                >
                  Add to Manual Checkout
                </button>
                <button
                  onClick={() => setShowBulkEdit(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-teal-300 hover:text-teal-700 dark:border-red-900/40 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-teal-300"
                >
                  Bulk Edit
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-xs font-semibold text-red-500 transition-colors hover:text-red-700 dark:text-red-300 dark:hover:text-red-200"
                >
                  Clear
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={deletingIds.length > 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                >
                  {deletingIds.length > 0 ? 'Deleting…' : `Delete ${selectedIds.length}`}
                </button>
              </div>
            </div>
          )}

          {/* Export section */}
          <div className="flex items-center justify-between gap-6 rounded-lg border border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 dark:bg-slate-800">
                <svg className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                  Export
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {visibleMeta?.from || 0} to {visibleMeta?.to || 0} of {visibleMeta?.total || visibleProducts.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Show:</label>
                <div className="relative">
                  <select
                    value={userPerPage}
                    onChange={(e) => {
                      const newValue = e.target.value === 'all' ? 'all' : Number(e.target.value)
                      setUserPerPage(newValue)
                      setPage(1)
                    }}
                    className="cursor-pointer appearance-none rounded border border-slate-200 bg-white px-3 py-2 pr-8 text-sm font-semibold text-slate-700 hover:border-slate-300 focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-600"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                    <option value="all">All</option>
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                    <svg className="h-3 w-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>
              {zqInlineActive ? (
                <>
                  <PrimaryButton
                    onClick={() => void handleExportAllZqCSV()}
                    disabled={isExportingZq}
                    className="!px-5 !py-2.5 !text-sm"
                  >
                    {isExportingZq ? 'Exporting…' : 'Export ZQ Excel'}
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => setShowImportZq(true)}
                    className="!px-5 !py-2.5 !text-sm"
                  >
                    Import CSV
                  </PrimaryButton>
                </>
              ) : (
                <>
                  <PrimaryButton onClick={handleExportCSV} className="!px-5 !py-2.5 !text-sm">
                    Export CSV
                  </PrimaryButton>
                  <PrimaryButton onClick={handleExportAllCSV} disabled={isExporting} className="!px-5 !py-2.5 !text-sm">
                    {isExporting ? 'Exporting...' : 'Export All CSV'}
                  </PrimaryButton>
                </>
              )}
            </div>
          </div>

          <DataTableShell
            title={zqInlineActive ? 'Global Supplier Product Table' : undefined}
            subtitle={zqInlineActive ? 'Fetched global supplier products are now displayed in the same products table area.' : undefined}
          >
            {zqInlineActive
              && Number(zqSummaryData?.total ?? visibleMeta?.total ?? 0) === 0
              && !isLoadingZqCached
              && !isFetchingZqCached
              && !isSyncingAllZq
              && !isDiscoveringZqTotal ? (
              <div className="border-b border-slate-200 bg-sky-50/80 px-5 py-4 dark:border-slate-800 dark:bg-sky-950/20">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {isSupplierPortal ? 'No synced Global Supplier products yet' : 'AF HOME GLOBAL SUPPLIER import is empty'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                      {isSupplierPortal
                        ? 'Sync products from ZQ to save them into tbl_zqproducts, then they will stay visible after refresh.'
                        : 'Start the import to fetch products from the Global Supplier API and save them into tbl_zqproducts.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartZqImport}
                    disabled={isSyncingAllZq || isDiscoveringZqTotal}
                    className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700"
                  >
                    {isSupplierPortal ? 'Sync Products from ZQ' : 'Start AF HOME GLOBAL SUPPLIER Import'}
                  </button>
                </div>
              </div>
            ) : null}
            <ProductsTable
              rows={visibleProducts}
              currentPage={visibleMeta?.current_page ?? 1}
              totalPages={visibleMeta?.last_page ?? 1}
              totalRecords={visibleMeta?.total ?? visibleProducts.length}
              from={visibleMeta?.from ?? null}
              to={visibleMeta?.to ?? null}
              onPageChange={setPage}
              onEdit={setEditProduct}
              onEditPricing={(product) => {
                const externalId = product.sku ?? ''
                const cached = zqCachedData?.products.find((p) => p.externalId === externalId)
                if (cached) {
                  setEditZqPricing(cached)
                } else {
                  setEditZqPricing({
                    id: Math.abs(product.id),
                    externalId,
                    subject: product.name,
                    sourceType: product.supplierName,
                    primaryImage: product.image,
                    totalStock: 0,
                    variantCount: 0,
                  })
                }
              }}
              onDelete={handleDelete}
              isDeletingIds={deletingIds}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onViewProduct={(product) => {
                if (zqInlineActive) {
                  window.open(`/global-product/${Math.abs(product.id)}?preview=1`, '_blank', 'noopener,noreferrer')
                  return
                }

                const productPath = buildStorefrontProductPath(product.name, product.id)
                window.open(productPath, '_blank', 'noopener,noreferrer')
              }}
              readOnly={zqInlineActive}
              isLoading={zqInlineActive && (isLoadingZqCached || isFetchingZqCached)}
              tableMode={zqInlineActive ? 'zq' : 'local'}
            />
          </DataTableShell>
        </div>
      )}

      <AddProductModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          if ((searchParams.get('modal') ?? '').toLowerCase() === 'add-product') {
            router.replace(pathname)
          }
        }}
        onSaved={handleProductsSaved}
      />
      <ProductActivityLogsModal isOpen={showActivityLogs} onClose={() => setShowActivityLogs(false)} />
      <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} onSaved={handleProductsSaved}/>
      <EditZqPricingModal product={editZqPricing} onClose={() => setEditZqPricing(null)} />
      <ImportZqPricingModal
        isOpen={showImportZq}
        onClose={() => setShowImportZq(false)}
        onSuccess={() => void refetchZqCachedProducts()}
      />
      <BulkEditProductsModal
        products={showBulkEdit ? selectedProducts : []}
        onClose={() => setShowBulkEdit(false)}
        onSaved={() => {
          setSelectedIds([])
          handleProductsSaved()
        }}
      />
      {showManualSelectionModal ? (
        <ManualCheckoutSelectionModal
          products={manualSelectionProducts}
          onConfirm={handleApplyManualCheckout}
          onRemove={handleRemoveManualCheckout}
          onClose={closeManualSelectionModal}
          isSaving={isApplyingManualCheckout}
          removingIds={removingManualCheckoutIds}
          mode={manualSelectionMode}
        />
      ) : null}
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 animate-pulse dark:border-slate-800 dark:bg-slate-950">
      <div className="grid grid-cols-9 gap-3 mb-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-3 rounded bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, ri) => (
        <div key={ri} className="grid grid-cols-9 gap-3">
          {Array.from({ length: 9 }).map((_, ci) => (
            <div key={ci} className="h-8 rounded bg-slate-100 dark:bg-slate-900" />
          ))}
        </div>
      ))}
    </div>
  )
}



