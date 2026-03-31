'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Product } from '@/store/api/productsApi'
import AdminPagination from '@/components/superAdmin/AdminPagination'

interface ProductsTableProps {
  rows: Product[]
  currentPage: number
  totalPages: number
  totalRecords: number
  from: number | null
  to: number | null
  onPageChange: (page: number) => void
  onEdit: (product: Product) => void
  onDelete: (id: number) => void
  isDeletingIds?: number[]
  selectedIds: number[]
  onToggleSelect: (id: number) => void
  onToggleSelectAll: () => void
}

const isActiveStatus = (status: number) => status === 1 || status === 2

const statusBadge = (status: number) =>
  isActiveStatus(status)
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : 'bg-slate-100 text-slate-500 border border-slate-200'

const formatPrice = (v: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(v)

const NEW_BADGE_DAYS = 7

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const buildProductPath = (product: Product) => {
  const safeName = (product.name || 'product').trim()
  const slug = slugify(safeName)
  return product.id > 0 ? `/product/${slug}-i${product.id}` : `/product/${slug}`
}

const normalizeVariantLabel = (value?: string | null) => (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()

const normalizeSkuSegment = (value?: string | null) =>
  (value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'COLOR'

const stripVariantColorSuffix = (sku?: string | null, colorName?: string | null) => {
  const normalizedSku = (sku ?? '').trim()
  const normalizedColorSegment = normalizeSkuSegment(colorName)

  if (!normalizedSku || !normalizedColorSegment) {
    return normalizedSku
  }

  const suffix = `-${normalizedColorSegment}`
  return normalizedSku.toUpperCase().endsWith(suffix)
    ? normalizedSku.slice(0, -suffix.length)
    : normalizedSku
}

const getVariantCoreGroupKey = (variant: NonNullable<Product['variants']>[number]) => [
  normalizeVariantLabel(variant.name),
  normalizeVariantLabel(variant.size),
  String(variant.width ?? ''),
  String(variant.dimension ?? ''),
  String(variant.height ?? ''),
  String(variant.priceSrp ?? ''),
  String(variant.priceDp ?? ''),
  String(variant.priceMember ?? ''),
  String(variant.prodpv ?? ''),
  String(variant.qty ?? ''),
  String(variant.status ?? ''),
  variant.images?.filter(Boolean).join('|') ?? '',
].join('|')

const getVariantCount = (product: Product) => {
  const variants = product.variants ?? []
  if (variants.length === 0) return 0

  const groupedSkuCounts = variants.reduce((map, variant) => {
    const groupKey = `${getVariantCoreGroupKey(variant)}|${stripVariantColorSuffix(variant.sku, variant.color)}`
    map.set(groupKey, (map.get(groupKey) ?? 0) + 1)
    return map
  }, new Map<string, number>())

  return new Set(
    variants.map((variant) => {
      const coreKey = getVariantCoreGroupKey(variant)
      const strippedSku = stripVariantColorSuffix(variant.sku, variant.color)
      const candidateKey = `${coreKey}|${strippedSku}`
      const resolvedSku = (groupedSkuCounts.get(candidateKey) ?? 0) > 1
        ? strippedSku
        : (variant.sku ?? '').trim()

      return `${coreKey}|${resolvedSku.toLowerCase()}`
    }),
  ).size
}

const getEffectiveStockQty = (product: Product) => {
  const activeVariants = (product.variants ?? []).filter((variant) => Number(variant.status ?? 1) === 1)

  if (activeVariants.length === 0) {
    return Number(product.qty ?? 0)
  }

  return activeVariants.reduce((total, variant) => total + Number(variant.qty ?? 0), 0)
}

const isNewProduct = (product: Product) => {
  if (!product.createdAt) return false

  const createdAt = new Date(product.createdAt)
  if (Number.isNaN(createdAt.getTime())) return false

  const diffDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays < NEW_BADGE_DAYS
}

/* ── Stock badge ── */
function StockBadge({ qty }: { qty: number }) {
  if (qty === 0) return (
    <span className="font-semibold text-red-500">{qty.toLocaleString()}</span>
  )
  if (qty <= 5) return (
    <span className="font-semibold text-orange-500">{qty.toLocaleString()}
      <span className="ml-1 text-[10px] font-medium text-orange-400">low</span>
    </span>
  )
  return <span className="text-slate-600">{qty.toLocaleString()}</span>
}

export default function ProductsTable({
  rows, currentPage, totalPages, totalRecords, from, to,
  onPageChange, onEdit, onDelete, isDeletingIds = [], selectedIds, onToggleSelect, onToggleSelectAll,
}: ProductsTableProps) {
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const allSelected = rows.length > 0 && rows.every(row => selectedIds.includes(row.id))
  const isDeleting  = (id: number) => isDeletingIds.includes(id)

  const handleDeleteClick = (id: number) => {
    if (confirmId === id) { onDelete(id); setConfirmId(null) }
    else setConfirmId(id)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-3 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  aria-label="Select all products in current page"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-14">Image</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">SKU</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Supplier</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Uploader</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">SRP</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Dealer</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Member</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Stock</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Badges</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-500">No products found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search or filter</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map(p => {
                const effectiveStockQty = getEffectiveStockQty(p)

                return (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50/60 transition-colors group"
                  onClick={() => confirmId === p.id && setConfirmId(null)}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => onToggleSelect(p.id)}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      aria-label={`Select product ${p.name}`}
                    />
                  </td>

                  {/* Image */}
                  <td className="px-3 py-2.5">
                    <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} fill className="object-cover" unoptimized/>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Name + meta */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 line-clamp-1 leading-snug">{p.name || '—'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">#{p.id}</span>
                      {getVariantCount(p) > 0 && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md font-medium">
                          {getVariantCount(p)} variant{getVariantCount(p) !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* SKU */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      {p.sku || '—'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="min-w-[140px]">
                      <p className="text-sm font-medium text-slate-700 line-clamp-1">{p.supplierName?.trim() || 'No supplier'}</p>
                      {p.supplierId ? (
                        <p className="text-[11px] text-slate-400 line-clamp-1">Supplier #{p.supplierId}</p>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="min-w-[140px]">
                      <p className="text-sm font-medium text-slate-700 line-clamp-1">{p.uploaderName?.trim() || 'Unknown user'}</p>
                      {p.uploaderRole ? (
                        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 line-clamp-1">
                          {p.uploaderRole.replace(/_/g, ' ')}
                        </p>
                      ) : p.uploaderEmail ? (
                        <p className="text-[11px] text-slate-400 line-clamp-1">{p.uploaderEmail}</p>
                      ) : null}
                    </div>
                  </td>

                  {/* Prices */}
                  <td className="px-4 py-3 text-right font-semibold text-slate-700 text-sm">{formatPrice(p.priceSrp)}</td>
                  <td className="px-4 py-3 text-right text-slate-500 text-sm">{formatPrice(p.priceDp)}</td>
                  <td className="px-4 py-3 text-right text-slate-500 text-sm">{formatPrice(p.priceMember ?? 0)}</td>

                  {/* Stock */}
                  <td className="px-4 py-3 text-right text-sm">
                    <StockBadge qty={effectiveStockQty} />
                  </td>

                  {/* Badges (Must Have / Bestseller) */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-1">
                      {isNewProduct(p) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] border border-sky-200 font-semibold whitespace-nowrap">
                          <svg className="w-2.5 h-2.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2.5 12.317 7.183 17.5 7.936 13.75 11.59 14.635 16.75 10 14.313 5.365 16.75 6.25 11.59 2.5 7.936 7.683 7.183 10 2.5Z"/>
                          </svg>
                          New
                        </span>
                      )}
                      {p.musthave && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] border border-amber-200 font-semibold whitespace-nowrap">
                          <svg className="w-2.5 h-2.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                          Must Have
                        </span>
                      )}
                      {p.bestseller && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] border border-purple-200 font-semibold whitespace-nowrap">
                          <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                          </svg>
                          Bestseller
                        </span>
                      )}
                      {!isNewProduct(p) && !p.musthave && !p.bestseller && <span className="text-slate-300 text-xs">—</span>}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(p.status)}`}>
                      {isActiveStatus(p.status) ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={buildProductPath(p)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        title="View product"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6m0 0v6m0-6L10 14"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5h5M5 5v14h14v-5"/>
                        </svg>
                      </Link>
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmId(null); onEdit(p) }}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>

                      {confirmId === p.id ? (
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteClick(p.id) }}
                          disabled={isDeleting(p.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                        >
                          {isDeleting(p.id) ? (
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                          ) : 'Confirm'}
                        </button>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteClick(p.id) }}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        from={from}
        to={to}
        totalRecords={totalRecords}
        onPageChange={onPageChange}
      />
    </div>
  )
}
