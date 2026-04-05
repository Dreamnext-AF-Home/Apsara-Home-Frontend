'use client'

import type { Selection, SortDescriptor } from 'react-aria-components'

import { Button, Checkbox, Chip, Pagination, Table, cn } from '@heroui/react'
import { Eye, Pencil, Trash2, TriangleAlert } from 'lucide-react'
import Image from 'next/image'
import { Fragment, useMemo, useState } from 'react'
import { Product } from '@/store/api/productsApi'

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

const isActiveStatus = (status: number) => status === 1 || status === 2

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value)

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

const statusColorMap: Record<'Active' | 'Inactive', 'success' | 'default'> = {
  Active: 'success',
  Inactive: 'default',
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
  children: React.ReactNode
  sortDirection?: 'ascending' | 'descending'
}) {
  return (
    <span className="flex items-center justify-between gap-2">
      <span>{children}</span>
      {!!sortDirection && (
        <svg
          className={cn(
            'h-3 w-3 shrink-0 transform text-slate-400 transition-transform duration-100 ease-out',
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

function StockCell({ qty }: { qty: number }) {
  if (qty === 0) {
    return <span className="font-semibold text-red-500">{qty.toLocaleString()}</span>
  }

  if (qty <= 5) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-orange-500">
        <TriangleAlert className="h-3.5 w-3.5" />
        {qty.toLocaleString()}
      </span>
    )
  }

  return <span className="text-slate-600">{qty.toLocaleString()}</span>
}

function EmptyProductsState() {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <svg className="h-7 w-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-500">No products found</p>
      <p className="text-xs text-slate-400">Try adjusting your search or filter.</p>
    </div>
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
}: ProductsTableProps) {
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  })

  const isDeleting = (id: number) => isDeletingIds.includes(id)
  const paginationPages = useMemo(() => getPaginationPages(currentPage, totalPages), [currentPage, totalPages])

  const sortedRows = useMemo(() => {
    const column = (sortDescriptor.column as SortableProductColumn | undefined) ?? 'name'
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

  const selectedKeys = useMemo(() => {
    return new Set(rows.filter((row) => selectedIds.includes(row.id)).map((row) => row.id))
  }, [rows, selectedIds])

  const handleSelectionChange = (keys: Selection) => {
    if (keys === 'all') {
      onToggleSelectAll()
      return
    }

    const nextIds = new Set(Array.from(keys).map((key) => Number(key)))

    rows.forEach((row) => {
      const isSelected = selectedIds.includes(row.id)
      const shouldBeSelected = nextIds.has(row.id)

      if (isSelected !== shouldBeSelected) {
        onToggleSelect(row.id)
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
      <Table className="w-full">
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Admin products table"
            className="min-w-[1260px]"
            selectedKeys={selectedKeys}
            selectionMode="multiple"
            sortDescriptor={sortDescriptor}
            onSelectionChange={handleSelectionChange}
            onSortChange={setSortDescriptor}
          >
            <Table.Header>
              <Table.Column className="w-12 pr-0">
                <Checkbox
                  aria-label="Select all products in current page"
                  slot="selection"
                  variant="secondary"
                  className="justify-center"
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox>
              </Table.Column>
              <Table.Column className="w-20 text-xs font-semibold uppercase tracking-wide text-slate-400">Image</Table.Column>
              <Table.Column allowsSorting isRowHeader id="name" className="min-w-[240px] text-xs font-semibold uppercase tracking-wide text-slate-400">
                {({ sortDirection }) => <SortableColumnHeader sortDirection={sortDirection}>Product</SortableColumnHeader>}
              </Table.Column>
              <Table.Column allowsSorting id="sku" className="min-w-[140px] text-xs font-semibold uppercase tracking-wide text-slate-400">
                {({ sortDirection }) => <SortableColumnHeader sortDirection={sortDirection}>SKU</SortableColumnHeader>}
              </Table.Column>
              <Table.Column allowsSorting id="supplier" className="min-w-[180px] text-xs font-semibold uppercase tracking-wide text-slate-400">
                {({ sortDirection }) => <SortableColumnHeader sortDirection={sortDirection}>Supplier</SortableColumnHeader>}
              </Table.Column>
              <Table.Column allowsSorting id="uploader" className="min-w-[180px] text-xs font-semibold uppercase tracking-wide text-slate-400">
                {({ sortDirection }) => <SortableColumnHeader sortDirection={sortDirection}>Uploader</SortableColumnHeader>}
              </Table.Column>
              <Table.Column allowsSorting id="priceSrp" className="text-end text-xs font-semibold uppercase tracking-wide text-slate-400">
                {({ sortDirection }) => <SortableColumnHeader sortDirection={sortDirection}>SRP</SortableColumnHeader>}
              </Table.Column>
              <Table.Column allowsSorting id="priceDp" className="text-end text-xs font-semibold uppercase tracking-wide text-slate-400">
                {({ sortDirection }) => <SortableColumnHeader sortDirection={sortDirection}>Dealer</SortableColumnHeader>}
              </Table.Column>
              <Table.Column allowsSorting id="priceMember" className="text-end text-xs font-semibold uppercase tracking-wide text-slate-400">
                {({ sortDirection }) => <SortableColumnHeader sortDirection={sortDirection}>Member</SortableColumnHeader>}
              </Table.Column>
              <Table.Column allowsSorting id="stock" className="text-end text-xs font-semibold uppercase tracking-wide text-slate-400">
                {({ sortDirection }) => <SortableColumnHeader sortDirection={sortDirection}>Stock</SortableColumnHeader>}
              </Table.Column>
              <Table.Column className="min-w-[130px] text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Badges</Table.Column>
              <Table.Column allowsSorting id="status" className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                {({ sortDirection }) => <SortableColumnHeader sortDirection={sortDirection}>Status</SortableColumnHeader>}
              </Table.Column>
              <Table.Column className="text-end text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</Table.Column>
            </Table.Header>

            <Table.Body>
              {sortedRows.length === 0 ? (
                <Table.Row key="empty">
                  <Table.Cell colSpan={13}>
                    <EmptyProductsState />
                  </Table.Cell>
                </Table.Row>
              ) : (
                sortedRows.map((product) => {
                  const effectiveStockQty = getEffectiveStockQty(product)
                  const isSelected = selectedIds.includes(product.id)
                  const variantCount = getVariantCount(product)
                  const statusLabel = isActiveStatus(product.status) ? 'Active' : 'Inactive'

                  return (
                    <Table.Row
                      key={product.id}
                      id={product.id}
                      className={cn(
                        'border-b border-slate-50 transition-colors hover:bg-slate-50/60',
                        isSelected ? 'bg-teal-50/40' : '',
                      )}
                    >
                      <Table.Cell className="pr-0">
                        <Checkbox
                          aria-label={`Select product ${product.name}`}
                          slot="selection"
                          variant="secondary"
                          className="justify-center"
                        >
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox>
                      </Table.Cell>

                      <Table.Cell>
                        <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
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
                      </Table.Cell>

                      <Table.Cell>
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-medium leading-snug text-slate-800">{product.name || 'N/A'}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400">#{product.id}</span>
                            {variantCount > 0 && (
                              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                                {variantCount} variant{variantCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        <span className="inline-flex rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-500">
                          {product.sku || 'N/A'}
                        </span>
                      </Table.Cell>

                      <Table.Cell>
                        <div className="min-w-[150px]">
                          <p className="line-clamp-1 text-sm font-medium text-slate-700">
                            {product.supplierName?.trim() || product.brand?.trim() || 'No supplier'}
                          </p>
                          {product.supplierId ? (
                            <p className="line-clamp-1 text-[11px] text-slate-400">Supplier #{product.supplierId}</p>
                          ) : product.brand ? (
                            <p className="line-clamp-1 text-[11px] text-slate-400">Brand</p>
                          ) : null}
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        <div className="min-w-[150px]">
                          <p className="line-clamp-1 text-sm font-medium text-slate-700">
                            {product.uploaderName?.trim() || 'Unknown user'}
                          </p>
                          {product.uploaderRole ? (
                            <p className="line-clamp-1 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                              {product.uploaderRole.replace(/_/g, ' ')}
                            </p>
                          ) : product.uploaderEmail ? (
                            <p className="line-clamp-1 text-[11px] text-slate-400">{product.uploaderEmail}</p>
                          ) : null}
                        </div>
                      </Table.Cell>

                      <Table.Cell className="text-end font-semibold text-slate-700">
                        {formatPrice(product.priceSrp)}
                      </Table.Cell>
                      <Table.Cell className="text-end text-slate-500">
                        {formatPrice(product.priceDp)}
                      </Table.Cell>
                      <Table.Cell className="text-end text-slate-500">
                        {formatPrice(product.priceMember ?? 0)}
                      </Table.Cell>

                      <Table.Cell className="text-end">
                        <StockCell qty={effectiveStockQty} />
                      </Table.Cell>

                      <Table.Cell>
                        <div className="flex flex-col items-center gap-1">
                          {isNewProduct(product) && (
                            <Chip color="accent" size="sm" variant="soft">
                              New
                            </Chip>
                          )}
                          {product.musthave && (
                            <Chip color="warning" size="sm" variant="soft">
                              Must Have
                            </Chip>
                          )}
                          {product.bestseller && (
                            <Chip size="sm" variant="soft" className="bg-fuchsia-50 text-fuchsia-700">
                              Bestseller
                            </Chip>
                          )}
                          {!isNewProduct(product) && !product.musthave && !product.bestseller && (
                            <span className="text-xs text-slate-300">N/A</span>
                          )}
                        </div>
                      </Table.Cell>

                      <Table.Cell className="text-center">
                        <Chip color={statusColorMap[statusLabel]} size="sm" variant="soft">
                          {statusLabel}
                        </Chip>
                      </Table.Cell>

                      <Table.Cell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="tertiary"
                            aria-label={`Preview ${product.name}`}
                            onPress={() => window.open(buildProductPath(product), '_blank', 'noopener,noreferrer')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="tertiary"
                            aria-label={`Edit ${product.name}`}
                            onPress={() => {
                              setConfirmId(null)
                              onEdit(product)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {confirmId === product.id ? (
                            <Button
                              size="sm"
                              variant="danger"
                              isDisabled={isDeleting(product.id)}
                              aria-label={`Confirm delete ${product.name}`}
                              onPress={() => handleDeleteClick(product.id)}
                            >
                              {isDeleting(product.id) ? 'Deleting...' : 'Confirm'}
                            </Button>
                          ) : (
                            <Button
                              isIconOnly
                              size="sm"
                              variant="danger-soft"
                              aria-label={`Delete ${product.name}`}
                              onPress={() => handleDeleteClick(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )
                })
              )}
            </Table.Body>

          </Table.Content>
        </Table.ScrollContainer>

        {totalPages > 1 && (
          <Table.Footer>
            <Pagination size="sm" className="w-full justify-between gap-3 px-4 py-3">
              <Pagination.Summary>
                {(from ?? 0).toLocaleString()} to {(to ?? 0).toLocaleString()} of {totalRecords.toLocaleString()} results
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={currentPage === 1}
                    onPress={() => onPageChange(Math.max(1, currentPage - 1))}
                  >
                    <Pagination.PreviousIcon />
                    Prev
                  </Pagination.Previous>
                </Pagination.Item>

                {paginationPages.map((page, index) => {
                  const previousPage = paginationPages[index - 1]
                  const shouldShowEllipsis = typeof previousPage === 'number' && page - previousPage > 1

                  return (
                    <Fragment key={`fragment-${page}`}>
                      {shouldShowEllipsis && (
                        <Pagination.Item>
                          <Pagination.Ellipsis />
                        </Pagination.Item>
                      )}
                      <Pagination.Item>
                        <Pagination.Link isActive={page === currentPage} onPress={() => onPageChange(page)}>
                          {page}
                        </Pagination.Link>
                      </Pagination.Item>
                    </Fragment>
                  )
                })}

                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={currentPage === totalPages}
                    onPress={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  >
                    Next
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </Table.Footer>
        )}
      </Table>
    </div>
  )
}
