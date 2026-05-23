'use client'

import { cn } from 'tailwind-variants'
import { Eye, Pencil, Trash2, TriangleAlert } from 'lucide-react'
import Image from 'next/image'
import { Fragment, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { Product, useLazyGetZqInventoryQuery } from '@/store/api/productsApi'

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
  onViewProduct: (product: Product) => void
  onEditPricing?: (product: Product) => void
  readOnly?: boolean
  isLoading?: boolean
  tableMode?: 'local' | 'zq'
}

type SortableProductColumn =
  | 'name'
  | 'sku'
  | 'supplier'
  | 'uploader'
  | 'priceSrp'
  | 'priceDp'
  | 'priceMember'
  | 'stock'
  | 'status'
  | 'createdAt'

type SortDirection = 'ascending' | 'descending'

type SortDescriptor = {
  column: SortableProductColumn
  direction: SortDirection
}

const isActiveStatus = (status: number) => status === 1 || status === 2

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value)

const NEW_BADGE_DAYS = 7

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

const getSortableValue = (product: Product, column: SortableProductColumn) => {
  switch (column) {
    case 'name':
      return (product.name ?? '').toLowerCase()
    case 'sku':
      return (product.sku ?? '').toLowerCase()
    case 'supplier':
      return (product.supplierName?.trim() || product.brand?.trim() || '').toLowerCase()
    case 'uploader':
      return (product.uploaderName?.trim() || product.uploaderEmail?.trim() || '').toLowerCase()
    case 'priceSrp':
      return Number(product.priceSrp ?? 0)
    case 'priceDp':
      return Number(product.priceDp ?? 0)
    case 'priceMember':
      return Number(product.priceMember ?? 0)
    case 'stock':
      return getEffectiveStockQty(product)
    case 'status':
      return isActiveStatus(product.status) ? 1 : 0
    case 'createdAt':
      return product.createdAt ? new Date(product.createdAt).getTime() : 0
    default:
      return ''
  }
}

const compareValues = (first: string | number, second: string | number) => {
  if (typeof first === 'number' && typeof second === 'number') {
    return first - second
  }

  return String(first).localeCompare(String(second), undefined, { numeric: true, sensitivity: 'base' })
}

const getPaginationPages = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((first, second) => first - second)
}

function SortableColumnHeader({
  children,
  sortDirection,
}: {
  children: ReactNode
  sortDirection?: SortDirection
}) {
  return (
    <span className="flex items-center justify-between gap-2 whitespace-nowrap">
      <span className="whitespace-nowrap">{children}</span>
      {!!sortDirection && (
        <svg
          className={cn(
            'h-3 w-3 shrink-0 transform text-slate-400 transition-transform duration-100 ease-out dark:text-slate-500',
            sortDirection === 'descending' ? 'rotate-180' : '',
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="m6 15 6-6 6 6" />
        </svg>
      )}
    </span>
  )
}

function TableChip({
  children,
  className,
}: {
  children: ReactNode
  className: string
}) {
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', className)}>
      {children}
    </span>
  )
}

function StockCell({ qty }: { qty: number }) {
  if (qty === 0) {
    return <span className="whitespace-nowrap font-semibold text-red-500">{qty.toLocaleString()}</span>
  }

  if (qty <= 5) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-orange-500">
        <TriangleAlert className="h-3.5 w-3.5" />
        {qty.toLocaleString()}
      </span>
    )
  }

  return <span className="whitespace-nowrap text-slate-600 dark:text-slate-300">{qty.toLocaleString()}</span>
}

function ZqStockCell({ qty, sku }: { qty: number; sku: string }) {
  const [checkInventory, { data, isFetching, isError }] = useLazyGetZqInventoryQuery()
  const hasResult = data !== undefined || isError

  return (
    <div className="flex flex-col items-end gap-1.5">
      <StockCell qty={qty} />
      <button
        type="button"
        disabled={isFetching || !sku}
        onClick={() => checkInventory(sku)}
        className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/15"
      >
        {isFetching ? (
          <>
            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Checking...
          </>
        ) : hasResult ? 'Refresh' : 'Check Live'}
      </button>
      {isError ? (
        <span className="text-[10px] text-red-500">Failed</span>
      ) : data ? (
        <div className="rounded-lg border border-violet-200/70 bg-violet-50/60 px-2 py-1 text-right dark:border-violet-500/20 dark:bg-violet-500/8">
          <p className="text-[9px] font-bold uppercase tracking-widest text-violet-400 dark:text-violet-500">ZQ Live</p>
          <p className={cn(
            'text-xs font-semibold',
            data.available === 0 ? 'text-red-500' : data.available <= 5 ? 'text-orange-500' : 'text-emerald-600 dark:text-emerald-400',
          )}>
            {data.available.toLocaleString()} avail
          </p>
        </div>
      ) : null}
    </div>
  )
}

function EmptyProductsState() {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <svg className="h-7 w-7 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No products found</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">Try adjusting your search or filter.</p>
    </div>
  )
}

function LoadingProductsState() {
  return (
    <div className="space-y-3 px-4 py-8">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  )
}

function ActionButton({
  children,
  ariaLabel,
  onClick,
  variant = 'default',
  disabled = false,
}: {
  children: ReactNode
  ariaLabel: string
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'danger'
          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15'
          : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:bg-sky-500/10 dark:hover:text-sky-200',
      )}
    >
      {children}
    </button>
  )
}

export default function ProductsTable({
  rows,
  currentPage,
  totalPages,
  totalRecords,
  from,
  to,
  onPageChange,
  onEdit,
  onDelete,
  isDeletingIds = [],
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewProduct,
  onEditPricing,
  readOnly = false,
  isLoading = false,
  tableMode = 'local',
}: ProductsTableProps) {
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button, input, a, [role="button"]')) return
    const el = scrollRef.current
    if (!el) return
    dragState.current = { isDragging: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft }
    setIsDragging(true)
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.current.isDragging) return
    e.preventDefault()
    const el = scrollRef.current
    if (!el) return
    const x = e.pageX - el.offsetLeft
    el.scrollLeft = dragState.current.scrollLeft - (x - dragState.current.startX) * 1.2
  }, [])

  const stopDrag = useCallback(() => {
    dragState.current.isDragging = false
    setIsDragging(false)
  }, [])

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'createdAt',
    direction: 'descending',
  })

  const isDeleting = (id: number) => isDeletingIds.includes(id)
  const paginationPages = useMemo(() => getPaginationPages(currentPage, totalPages), [currentPage, totalPages])
  const isZqMode = tableMode === 'zq'
  const columnCount = isZqMode ? 12 : 14
  const allVisibleSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id))

  const sortedRows = useMemo(() => {
    const column = sortDescriptor.column ?? 'name'
    const direction = sortDescriptor.direction === 'descending' ? -1 : 1

    return [...rows].sort((first, second) => {
      const left = getSortableValue(first, column)
      const right = getSortableValue(second, column)
      const comparison = compareValues(left, right)

      if (comparison !== 0) return comparison * direction
      return first.id - second.id
    })
  }, [rows, sortDescriptor])

  const handleDeleteClick = (id: number) => {
    if (confirmId === id) {
      onDelete(id)
      setConfirmId(null)
      return
    }

    setConfirmId(id)
  }

  const handleSortChange = (column: SortableProductColumn) => {
    setSortDescriptor((current) => {
      if (current.column === column) {
        return {
          column,
          direction: current.direction === 'ascending' ? 'descending' : 'ascending',
        }
      }

      return {
        column,
        direction: 'ascending',
      }
    })
  }

  const renderSortableHeader = (
    label: string,
    column: SortableProductColumn,
    align: 'left' | 'center' | 'right' = 'left',
  ) => {
    const isActive = sortDescriptor.column === column
    const direction = isActive ? sortDescriptor.direction : undefined

    return (
      <button
        type="button"
        onClick={() => handleSortChange(column)}
        className={cn(
          'flex w-full items-center gap-2 text-left transition hover:text-sky-600 dark:hover:text-sky-300',
          align === 'center' ? 'justify-center' : '',
          align === 'right' ? 'justify-end' : '',
        )}
      >
        <SortableColumnHeader sortDirection={direction}>{label}</SortableColumnHeader>
      </button>
    )
  }

  return (
    <div className="w-full overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-[0_24px_70px_-34px_rgba(2,132,199,0.18)]">
      <div
        ref={scrollRef}
        className={cn('overflow-x-auto', isDragging ? 'cursor-grabbing select-none' : 'cursor-grab')}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        <table className={cn('w-full border-separate border-spacing-0 text-sm text-slate-700 dark:text-slate-200', isZqMode ? 'min-w-[1240px]' : 'min-w-[1540px]')}>
          <thead className="bg-slate-50/95 dark:bg-slate-900">
            <tr>
              <th className="w-12 min-w-12 border-b border-slate-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {!readOnly ? (
                  <input
                    type="checkbox"
                    aria-label="Select all products in current page"
                    checked={allVisibleSelected}
                    onChange={onToggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 bg-white text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900"
                  />
                ) : null}
              </th>
              <th className="w-20 min-w-20 border-b border-slate-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">Image</th>
              <th className="min-w-[240px] border-b border-slate-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {renderSortableHeader('Product', 'name')}
              </th>
              <th className="min-w-[140px] border-b border-slate-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {renderSortableHeader('SKU', 'sku')}
              </th>
              <th className="min-w-[180px] border-b border-slate-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {renderSortableHeader('Supplier', 'supplier')}
              </th>
              <th className="min-w-[180px] border-b border-slate-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {renderSortableHeader(isZqMode ? 'Source' : 'Uploader', 'uploader')}
              </th>
              <th className="min-w-[110px] border-b border-slate-200 px-4 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {renderSortableHeader('Price', 'priceSrp', 'right')}
              </th>
              {!isZqMode ? (
                <th className="min-w-[110px] border-b border-slate-200 px-4 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  {renderSortableHeader('Dealer', 'priceDp', 'right')}
                </th>
              ) : null}
              {!isZqMode ? (
                <th className="min-w-[110px] border-b border-slate-200 px-4 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  {renderSortableHeader('Member', 'priceMember', 'right')}
                </th>
              ) : null}
              <th className="min-w-[100px] border-b border-slate-200 px-4 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {renderSortableHeader('Stock', 'stock', 'right')}
              </th>
              <th className="min-w-[140px] border-b border-slate-200 px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {isZqMode ? 'Import Status' : 'Badges'}
              </th>
              <th className="min-w-[120px] border-b border-slate-200 px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {renderSortableHeader('Status', 'status', 'center')}
              </th>
              <th className="min-w-[160px] border-b border-slate-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {renderSortableHeader('Uploaded', 'createdAt')}
              </th>
              <th className="sticky right-0 z-20 min-w-[150px] border-b border-l border-slate-200 bg-slate-50/95 px-4 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-[-4px_0_8px_-2px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.25)]">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr key="loading">
                <td colSpan={columnCount} className="px-4 py-10">
                  <LoadingProductsState />
                </td>
              </tr>
            ) : sortedRows.length === 0 ? (
              <tr key="empty">
                <td colSpan={columnCount} className="px-4 py-10">
                  <EmptyProductsState />
                </td>
              </tr>
            ) : (
                sortedRows.map((product) => {
                  const effectiveStockQty = getEffectiveStockQty(product)
                  const isSelected = selectedIds.includes(product.id)
                  const variantCount = getVariantCount(product)
                  const statusLabel = isActiveStatus(product.status) ? 'Active' : 'Inactive'

                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        'border-b border-slate-200 transition-colors hover:bg-white dark:border-slate-700 dark:hover:bg-slate-900',
                        isSelected ? 'bg-teal-50/40 dark:bg-teal-500/10' : '',
                      )}
                    >
                      <td className="w-12 border-b border-slate-100 px-4 py-4 pr-0 dark:border-slate-800/70">
                        {!readOnly ? (
                          <input
                            type="checkbox"
                            aria-label={`Select product ${product.name}`}
                            checked={isSelected}
                            onChange={() => onToggleSelect(product.id)}
                            className="h-4 w-4 rounded border-slate-300 bg-white text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900"
                          />
                        ) : null}
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 dark:border-slate-800/70">
                        <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <svg className="h-5 w-5 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>

                    <td className="border-b border-slate-100 px-4 py-4 dark:border-slate-800/70">
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium leading-snug text-slate-800 dark:text-slate-100">{product.name || 'N/A'}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">#{product.id}</span>
                          {isZqMode ? (
                            <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-500/12 dark:text-sky-200">
                              {product.specifications?.trim() || 'Global Supplier Product'}
                            </span>
                          ) : variantCount > 0 ? (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              {variantCount} variant{variantCount !== 1 ? 's' : ''}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4 dark:border-slate-800/70">
                      <span className="inline-flex rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                        {product.sku || 'N/A'}
                      </span>
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4 dark:border-slate-800/70">
                      <div className="min-w-[150px]">
                        <p className="line-clamp-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                          {isZqMode ? (product.brand?.trim() || 'AF HOME GLOBAL SUPPLIER') : (product.supplierName?.trim() || product.brand?.trim() || 'No supplier')}
                        </p>
                        {!isZqMode && product.supplierId ? (
                          <p className="line-clamp-1 text-[11px] text-slate-400 dark:text-slate-500">Supplier #{product.supplierId}</p>
                        ) : product.brand ? (
                          <p className="line-clamp-1 text-[11px] text-slate-400 dark:text-slate-500">Brand</p>
                        ) : null}
                      </div>
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4 dark:border-slate-800/70">
                      <div className="min-w-[150px]">
                        <p className="line-clamp-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                          {isZqMode ? 'Global Supplier API' : (product.uploaderName?.trim() || 'Unknown user')}
                        </p>
                        {isZqMode ? (
                          <p className="line-clamp-1 text-[11px] text-slate-400 dark:text-slate-500">
                            {product.updatedAt ? `Updated ${new Date(product.updatedAt).toLocaleDateString()}` : 'Imported from database'}
                          </p>
                        ) : product.uploaderRole ? (
                          <p className="line-clamp-1 text-[10px] uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                            {product.uploaderRole.replace(/_/g, ' ')}
                          </p>
                        ) : product.uploaderEmail ? (
                          <p className="line-clamp-1 text-[11px] text-slate-400 dark:text-slate-500">{product.uploaderEmail}</p>
                        ) : null}
                      </div>
                    </td>

                    <td className="whitespace-nowrap border-b border-slate-100 px-4 py-4 text-right font-semibold text-slate-700 dark:border-slate-800/70 dark:text-slate-200">
                      {formatPrice(product.priceSrp)}
                    </td>
                    {!isZqMode ? (
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-4 text-right text-slate-500 dark:border-slate-800/70 dark:text-slate-400">
                        {formatPrice(product.priceDp)}
                      </td>
                    ) : null}
                    {!isZqMode ? (
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-4 text-right text-slate-500 dark:border-slate-800/70 dark:text-slate-400">
                        {formatPrice(product.priceMember ?? 0)}
                      </td>
                    ) : null}

                    <td className="border-b border-slate-100 px-4 py-4 text-right dark:border-slate-800/70">
                      {isZqMode ? (
                        <ZqStockCell qty={effectiveStockQty} sku={product.sku} />
                      ) : (
                        <span className="whitespace-nowrap">
                          <StockCell qty={effectiveStockQty} />
                        </span>
                      )}
                    </td>

                    <td className="min-w-[140px] border-b border-slate-100 px-4 py-4 dark:border-slate-800/70">
                      {isZqMode ? (
                        <div className="flex justify-center">
                          <TableChip className="bg-sky-50 text-sky-700 dark:bg-sky-500/12 dark:text-sky-200">
                            {product.description?.replace('Global Supplier import status: ', '').trim() || 'Imported'}
                          </TableChip>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          {isNewProduct(product) ? (
                            <TableChip className="bg-violet-50 text-violet-700 dark:bg-violet-500/12 dark:text-violet-200">New</TableChip>
                          ) : null}
                          {product.musthave ? (
                            <TableChip className="bg-amber-50 text-amber-700 dark:bg-amber-500/12 dark:text-amber-200">Must Have</TableChip>
                          ) : null}
                          {product.bestseller ? (
                            <TableChip className="bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/12 dark:text-fuchsia-200">Bestseller</TableChip>
                          ) : null}
                          {!isNewProduct(product) && !product.musthave && !product.bestseller ? (
                            <span className="text-xs text-slate-300 dark:text-slate-600">N/A</span>
                          ) : null}
                        </div>
                      )}
                    </td>

                    <td className="min-w-[120px] whitespace-nowrap border-b border-slate-100 px-4 py-4 text-center dark:border-slate-800/70">
                      <TableChip
                        className={
                          statusLabel === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }
                      >
                        {statusLabel}
                      </TableChip>
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4 dark:border-slate-800/70">
                      {product.createdAt ? (
                        <div className="min-w-[140px]">
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            {new Date(product.createdAt).toLocaleDateString('en-CA')}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                            {new Date(product.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>

                    <td className={cn(
                      'sticky right-0 z-10 min-w-[150px] border-b border-l border-slate-100 px-4 py-4 shadow-[-4px_0_8px_-2px_rgba(15,23,42,0.06)] dark:border-slate-800/70 dark:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.25)]',
                      isSelected ? 'bg-teal-50/40 dark:bg-teal-500/10' : 'bg-white dark:bg-slate-950',
                    )}>
                      <div className="flex items-center justify-end gap-1">
                        <ActionButton
                          ariaLabel={`View ${product.name}`}
                          onClick={() => {
                            setConfirmId(null)
                            onViewProduct(product)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </ActionButton>
                        {isZqMode && onEditPricing ? (
                          <ActionButton
                            ariaLabel={`Edit pricing for ${product.name}`}
                            onClick={() => {
                              setConfirmId(null)
                              onEditPricing(product)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </ActionButton>
                        ) : null}
                        {!readOnly ? (
                          <>
                            <ActionButton
                              ariaLabel={`Edit ${product.name}`}
                              onClick={() => {
                                setConfirmId(null)
                                onEdit(product)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </ActionButton>
                            {confirmId === product.id ? (
                              <button
                                type="button"
                                aria-label={`Confirm delete ${product.name}`}
                                disabled={isDeleting(product.id)}
                                onClick={() => handleDeleteClick(product.id)}
                                className="inline-flex h-9 items-center justify-center rounded-xl bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
                              >
                                {isDeleting(product.id) ? 'Deleting...' : 'Confirm'}
                              </button>
                            ) : (
                              <ActionButton
                                ariaLabel={`Delete ${product.name}`}
                                variant="danger"
                                onClick={() => handleDeleteClick(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </ActionButton>
                            )}
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-200 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {(from ?? 0).toLocaleString()} to {(to ?? 0).toLocaleString()} of {totalRecords.toLocaleString()} results
          </p>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:bg-sky-500/10 dark:hover:text-sky-200"
              >
                Prev
              </button>

              {paginationPages.map((page, index) => {
                const previousPage = paginationPages[index - 1]
                const shouldShowEllipsis = typeof previousPage === 'number' && page - previousPage > 1

                return (
                  <Fragment key={`fragment-${page}`}>
                    {shouldShowEllipsis ? (
                      <span className="px-1 text-slate-400 dark:text-slate-600">...</span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onPageChange(page)}
                      className={cn(
                        'min-w-9 rounded-xl border px-3 py-2 text-sm font-semibold transition',
                        page === currentPage
                          ? 'border-sky-500 bg-sky-500 text-white shadow-sm shadow-sky-500/25 dark:border-sky-400 dark:bg-sky-500 dark:text-slate-950'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:bg-sky-500/10 dark:hover:text-sky-200',
                      )}
                    >
                      {page}
                    </button>
                  </Fragment>
                )
              })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:bg-sky-500/10 dark:hover:text-sky-200"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
