'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
  PackagePlus,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
  Box,
  Users,
  AlertTriangle,
  Archive,
} from 'lucide-react'

import { showErrorToast, showSuccessToast } from '@/libs/toast'
import { Product, useGetProductsQuery, useLazyGetProductsQuery, useUpdateProductMutation } from '@/store/api/productsApi'
import { useGetProductBrandsQuery } from '@/store/api/productBrandsApi'


type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock'
type StockModalMode = 'adjust' | 'restock'

const LOW_STOCK_THRESHOLD = 10
const PAGE_SIZE = 16
const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error('Request timed out.')), ms)
    })
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
    }
  }
}

const formatNumber = (value: number) => value.toLocaleString('en-PH')
const formatDate = (value?: string | null) => {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const toQuantity = (product: Product) => {
  const qty = Number(product.qty ?? 0)
  return Number.isFinite(qty) ? Math.max(0, qty) : 0
}

const normalizeImageUrl = (url?: unknown) => {
  const value = typeof url === 'string' ? url.trim() : ''
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) return value
  if (value.toLowerCase().startsWith('null')) return ''

  if (value.startsWith('/')) return value
  return `/${value}`
}

const getProductThumbnail = (product: Product) => {
  const fallback = '/Images/af_home_logo.png'

  // 1) product.images[0]
  const productImages = Array.isArray((product as any).images) ? ((product as any).images as unknown[]) : []
  const firstProductImage = normalizeImageUrl(productImages[0])
  if (firstProductImage) return firstProductImage

  // 2) first active variant.images[0]
  const variants = Array.isArray((product as any).variants) ? ((product as any).variants as any[]) : []
  const firstActive = variants.find((v) => Number(v?.status ?? 1) === 1)
  const variantImages = Array.isArray(firstActive?.images) ? firstActive.images : []
  const firstVariantImage = normalizeImageUrl(variantImages[0])
  if (firstVariantImage) return firstVariantImage

  // 3) fallback
  return fallback
}


const getStockStatus = (quantity: number): StockFilter => {
  if (quantity <= 0) return 'out-of-stock'
  if (quantity <= LOW_STOCK_THRESHOLD) return 'low-stock'
  return 'in-stock'
}

const stockLabel: Record<StockFilter, string> = {
  all: 'All',
  'in-stock': 'In stock',
  'low-stock': 'Low stock',
  'out-of-stock': 'Out of stock',
}

const dedupeAndSortProducts = (source: Product[]) => {
  const unique = Array.from(
    source.reduce((map, product) => {
      map.set(product.id, product)
      return map
    }, new Map<number, Product>()).values(),
  )
  unique.sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))
  return unique
}

const buildVariantStockPayload = (product: Product, targetTotalQty: number) => {
  const variants = Array.isArray(product.variants) ? product.variants : []
  const activeIndexes = variants
    .map((variant, index) => ({ variant, index }))
    .filter(({ variant }) => Number(variant.status ?? 1) === 1)

  if (activeIndexes.length === 0) {
    return null
  }

  const nextQtyByIndex = variants.map((variant) => Math.max(0, Math.floor(Number(variant.qty ?? 0))))
  const currentTotal = activeIndexes.reduce((sum, { index }) => sum + nextQtyByIndex[index], 0)

  if (targetTotalQty > currentTotal) {
    const firstActiveIndex = activeIndexes[0].index
    nextQtyByIndex[firstActiveIndex] += targetTotalQty - currentTotal
  } else if (targetTotalQty < currentTotal) {
    let remainingToReduce = currentTotal - targetTotalQty
    for (const { index } of activeIndexes) {
      if (remainingToReduce <= 0) break
      const reducible = Math.min(remainingToReduce, nextQtyByIndex[index])
      nextQtyByIndex[index] -= reducible
      remainingToReduce -= reducible
    }
  }

  return variants.map((variant, index) => ({
    pv_sku: variant.sku,
    pv_name: variant.name,
    pv_color: variant.color,
    pv_color_hex: variant.colorHex,
    pv_size: variant.size,
    pv_style: variant.style,
    pv_width: variant.width,
    pv_dimension: variant.dimension,
    pv_height: variant.height,
    pv_price_srp: variant.priceSrp,
    pv_price_dp: variant.priceDp,
    pv_price_member: variant.priceMember,
    pv_prodpv: variant.prodpv,
    pv_qty: nextQtyByIndex[index],
    pv_status: variant.status,
    pv_images: variant.images,
  }))
}

export default function ProductsInventoryPageMain() {
  const [filter, setFilter] = useState<StockFilter>('all')
  const [brandFilter, setBrandFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [stockModalMode, setStockModalMode] = useState<StockModalMode>('adjust')
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('')
  const [quantityInput, setQuantityInput] = useState('0')
  const [isSavingStock, setIsSavingStock] = useState(false)
  const [summaryMetrics, setSummaryMetrics] = useState<{
    totalProducts: number
    totalStock: number
    lowStock: number
    outOfStock: number
    categoryCount: number
  } | null>(null)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [summaryReloadKey, setSummaryReloadKey] = useState(0)
  const [fetchProductsSummary] = useLazyGetProductsQuery()
  const [updateProduct] = useUpdateProductMutation()
  const searchQuery = search.trim()

  const { data: brandsData } = useGetProductBrandsQuery({ search: '' })

  const {
    data,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
    isError: hasProductsError,
    refetch,
  } = useGetProductsQuery(
    {
      page: currentPage,
      perPage: PAGE_SIZE,
      search: searchQuery || undefined,
      // backend expects brandType id
      brandType: (() => {
        const normalizedBrand = brandFilter.trim().toLowerCase()
        if (!normalizedBrand) return undefined
        const match = (brandsData?.brands ?? []).find(
          (b) => b.status === 0 && b.name.trim().toLowerCase() === normalizedBrand,
        )
        return match?.id
      })(),
    },
    { refetchOnMountOrArgChange: true },
  )

  const products = useMemo(() => dedupeAndSortProducts(data?.products ?? []), [data?.products])
  const hasBaseData = Boolean(data)


  const allBrands = useMemo(
    () => (brandsData?.brands ?? []).filter((b) => b.status === 0).map((b) => b.name).sort((a, b) => a.localeCompare(b)),
    [brandsData?.brands],
  )



  useEffect(() => {
    if (!hasBaseData || hasProductsError) return

    let isActive = true

    const loadSummaryMetrics = async () => {
      setIsSummaryLoading(true)
      try {
        const perPage = 5000
        const firstPage = await withTimeout(
          fetchProductsSummary({ page: 1, perPage }, false).unwrap(),
          15000,
        )
        const lastPage = Math.max(1, Number(firstPage.meta?.last_page ?? 1))
        const totalProducts = Number(firstPage.meta?.total ?? firstPage.products?.length ?? 0)
        const seenIds = new Set<number>()
        let totalStock = 0
        let lowStock = 0
        let outOfStock = 0
        const categoryIds = new Set<number>()

        const processPage = (items: Product[]) => {
          for (const product of items) {
            if (seenIds.has(product.id)) continue
            seenIds.add(product.id)
            const qty = toQuantity(product)
            totalStock += qty
            if (qty <= 0) {
              outOfStock += 1
            } else if (qty <= LOW_STOCK_THRESHOLD) {
              lowStock += 1
            }

            const categoryId = Number(product.catid ?? 0)
            if (categoryId > 0) {
              categoryIds.add(categoryId)
            }
          }
        }

        processPage(firstPage.products ?? [])

        if (lastPage > 1) {
          const pages: number[] = []
          for (let page = 2; page <= lastPage; page += 1) {
            pages.push(page)
          }

          const chunkSize = 8
          for (let index = 0; index < pages.length; index += chunkSize) {
            const chunk = pages.slice(index, index + chunkSize)
            const responses = await Promise.all(
              chunk.map((page) =>
                withTimeout(
                  fetchProductsSummary({ page, perPage }, false).unwrap(),
                  15000,
                ),
              ),
            )
            for (const response of responses) {
              processPage(response.products ?? [])
            }
          }
        }

        if (!isActive) return
        setSummaryMetrics({
          totalProducts,
          totalStock,
          lowStock,
          outOfStock,
          categoryCount: categoryIds.size,
        })
      } catch (error) {
        console.error(error)
        if (isActive) {
          setSummaryMetrics(null)
        }
      } finally {
        if (isActive) {
          setIsSummaryLoading(false)
        }
      }
    }

    void loadSummaryMetrics()

    return () => {
      isActive = false
    }
  }, [hasBaseData, data?.meta?.total, hasProductsError, fetchProductsSummary, summaryReloadKey])

  const metrics = useMemo(() => {
    if (summaryMetrics) return summaryMetrics
    const totalProducts = Number(data?.meta?.total ?? products.length)
    const totalStock = products.reduce((sum, product) => sum + toQuantity(product), 0)
    const lowStock = products.filter((product) => {
      const qty = toQuantity(product)
      return qty > 0 && qty <= LOW_STOCK_THRESHOLD
    }).length
    const outOfStock = products.filter((product) => toQuantity(product) <= 0).length
    const categoryCount = new Set(products.map((product) => Number(product.catid ?? 0)).filter((id) => id > 0)).size

    return { totalProducts, totalStock, lowStock, outOfStock, categoryCount }
  }, [products, data?.meta?.total, summaryMetrics])

  const filteredProducts = useMemo(() => {
    const normalizedBrand = brandFilter.trim().toLowerCase()

    // global brand list (name -> id) so we can match either by name or by brandType id
    const brandNameToId = new Map<string, number>(
      (brandsData?.brands ?? []).map((b) => [b.name.trim().toLowerCase(), b.id]),
    )

    const selectedBrandId = normalizedBrand ? brandNameToId.get(normalizedBrand) : undefined

    return products.filter((product) => {
      const qty = toQuantity(product)
      const status = getStockStatus(qty)
      const passStatus = filter === 'all' || status === filter

      const productBrandName = (product.brand ?? '').trim().toLowerCase()
      const productBrandId = product.brandType ? Number(product.brandType) : undefined

      const passBrand = !normalizedBrand
        ? true
        : productBrandName === normalizedBrand
          ? true
          : selectedBrandId !== undefined && productBrandId !== undefined && productBrandId === selectedBrandId

      return passStatus && passBrand
    })
  }, [products, filter, brandFilter, brandsData?.brands])




  const selectedProduct = useMemo(
    () => (typeof selectedProductId === 'number' ? (products.find((product) => product.id === selectedProductId) ?? null) : null),
    [products, selectedProductId],
  )

  const openAdjustModal = (product: Product) => {
    setStockModalMode('adjust')
    setSelectedProductId(product.id)
    setQuantityInput(String(toQuantity(product)))
    setIsStockModalOpen(true)
  }

  const openRestockModal = (product?: Product) => {
    setStockModalMode('restock')
    setSelectedProductId(product?.id ?? '')
    setQuantityInput('10')
    setIsStockModalOpen(true)
  }

  const closeStockModal = () => {
    setIsStockModalOpen(false)
    setSelectedProductId('')
    setQuantityInput('0')
    setIsSavingStock(false)
  }

  const handleSaveStock = async () => {
    if (typeof selectedProductId !== 'number') {
      showErrorToast('Please select a product.')
      return
    }

    const baseProduct = products.find((product) => product.id === selectedProductId)
    if (!baseProduct) {
      showErrorToast('Selected product is not available.')
      return
    }

    const parsed = Number(quantityInput)
    if (!Number.isFinite(parsed) || parsed < 0) {
      showErrorToast('Please enter a valid quantity.')
      return
    }

    const currentQty = toQuantity(baseProduct)
    const nextQty = stockModalMode === 'adjust' ? Math.floor(parsed) : currentQty + Math.floor(parsed)
    if (stockModalMode === 'restock' && parsed <= 0) {
      showErrorToast('Restock quantity must be greater than zero.')
      return
    }

    setIsSavingStock(true)
    try {
      const variantPayload = buildVariantStockPayload(baseProduct, nextQty)
      const payload = variantPayload
        ? { pd_qty: nextQty, pd_variants: variantPayload }
        : { pd_qty: nextQty }

      await updateProduct({ id: selectedProductId, data: payload }).unwrap()
      await refetch()
      setSummaryReloadKey((value) => value + 1)
      showSuccessToast(stockModalMode === 'adjust' ? 'Stock adjusted successfully.' : 'Restock applied successfully.')
      closeStockModal()
    } catch (error) {
      console.error(error)
      showErrorToast('Failed to update stock.')
      setIsSavingStock(false)
    }
  }

  const handleExportCsv = () => {
    const rows = filteredProducts.map((product) => {
      const qty = toQuantity(product)
      const status = getStockStatus(qty)
      return {
        name: product.name,
        sku: product.sku ?? '',
        qty,
        threshold: qty,
        status: stockLabel[status],
        updated_at: product.updatedAt ?? product.createdAt ?? '',
      }
    })

    const header = ['Product name', 'SKU', 'Current stock', 'Threshold', 'Status', 'Last updated']
    const csvRows = rows.map((row) =>
      [row.name, row.sku, row.qty, `>= ${row.threshold}`, row.status, row.updated_at]
        .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
        .join(','),
    )

    const csv = [header.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventory-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-sky-500/15 via-emerald-500/10 to-amber-500/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm dark:bg-orange-500">
              <Activity size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Inventory</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Track stock health and identify restocking priorities.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Download size={15} />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => openRestockModal()}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-orange-500 dark:hover:bg-orange-600"
            >
              <PackagePlus size={15} />
              Add restock
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total products"
          value={formatNumber(metrics.totalProducts)}
          subtitle={`${formatNumber(metrics.categoryCount)} categories`}
          accent="bg-sky-500"
          icon={<Archive size={16} className="text-sky-800 dark:text-sky-200" />}
        />
        <MetricCard
          title="Total stock"
          value={formatNumber(metrics.totalStock)}
          subtitle="units on hand"
          accent="bg-emerald-500"
          icon={<Box size={16} className="text-emerald-800 dark:text-emerald-200" />}
        />
        <MetricCard
          title="Low stock"
          value={isSummaryLoading && !summaryMetrics ? '...' : formatNumber(metrics.lowStock)}
          subtitle={`at or below ${LOW_STOCK_THRESHOLD}`}
          accent="bg-amber-500"
          icon={<AlertTriangle size={16} className="text-amber-800 dark:text-amber-200" />}
        />
        <MetricCard
          title="Out of stock"
          value={isSummaryLoading && !summaryMetrics ? '...' : formatNumber(metrics.outOfStock)}
          subtitle="needs restocking"
          accent="bg-rose-500"
          icon={<Users size={16} className="text-rose-800 dark:text-rose-200" />}
        />
      </div>


      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'in-stock', 'low-stock', 'out-of-stock'] as StockFilter[]).map((value) => {
              const active = filter === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold transition-all ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm dark:border-orange-500 dark:bg-orange-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {stockLabel[value]}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="w-full sm:w-[220px]">

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Brand</label>
              <select
                value={brandFilter}
                onChange={(event) => {
                  setBrandFilter(event.target.value)
                  setCurrentPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-800 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">All brands</option>
                {allBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}

              </select>
            </div>

            <div className="relative w-full md:w-[320px]">

              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search product or SKU..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-10 text-sm text-slate-800 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-orange-500 dark:focus:ring-orange-400/20"
              />
              {search.trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setCurrentPage(1)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          </div>

        </div>


        {isProductsLoading || isProductsFetching ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
            Loading inventory...
          </div>
        ) : hasProductsError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-300">
            Failed to load inventory products.
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
            No products match this inventory filter.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const quantity = toQuantity(product)
                const status = getStockStatus(quantity)

                const statusStyle =
                  status === 'in-stock'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : status === 'low-stock'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'

                const accentBar =
                  status === 'in-stock'
                    ? 'bg-emerald-600'
                    : status === 'low-stock'
                      ? 'bg-amber-600'
                      : 'bg-rose-600'

                const barWidth = `${Math.min(100, (quantity / Math.max(LOW_STOCK_THRESHOLD * 2, 1)) * 100)}%`
                const thumbnail = getProductThumbnail(product)

                return (
                  <div
                    key={product.id}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800/70">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumbnail} alt={product.name} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-40" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                              {product.name}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">SKU: {product.sku || '—'}</div>
                            <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">#{product.id}</div>
                          </div>

                          <span className={`mt-0.5 inline-flex items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle}`}>
                            {stockLabel[status]}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-1.5 w-full overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
                            <div className={`h-full ${accentBar}`} style={{ width: barWidth }} />
                          </div>
                          <div className="w-[52px] text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatNumber(quantity)}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <ShieldCheck size={14} className="text-slate-400" />
                            {formatDate(product.updatedAt ?? product.createdAt)}
                          </div>

                          <button
                            type="button"
                            onClick={() => (status === 'in-stock' ? openAdjustModal(product) : openRestockModal(product))}
                            className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors border border-slate-300 dark:border-slate-700 ${
                              status === 'in-stock'
                                ? 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                                : 'text-slate-700 hover:bg-amber-50 dark:text-slate-200 dark:hover:bg-amber-900/10'
                            }`}
                          >
                            <span className="inline-flex items-center gap-2">
                              {status === 'in-stock' ? <Sparkles size={14} /> : <Truck size={14} />}
                              {status === 'in-stock' ? 'Adjust' : 'Restock'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pointer-events-none absolute -right-12 -top-12 h-24 w-24 rounded-full bg-slate-900/5 blur-2xl dark:bg-white/5" />
                  </div>
                )
              })}
            </div>
          </div>
        )}


        {filteredProducts.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filter === 'all'
                ? `Showing ${Number(data?.meta?.from ?? 0)} to ${Number(data?.meta?.to ?? filteredProducts.length)} of ${Number(data?.meta?.total ?? filteredProducts.length)} items`
                : `Showing ${filteredProducts.length} filtered items on page ${Number(data?.meta?.current_page ?? currentPage)}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={Number(data?.meta?.current_page ?? currentPage) <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Page {Number(data?.meta?.current_page ?? currentPage)} of {Math.max(1, Number(data?.meta?.last_page ?? 1))}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(Math.max(1, Number(data?.meta?.last_page ?? 1)), page + 1))
                }
                disabled={Number(data?.meta?.current_page ?? currentPage) >= Math.max(1, Number(data?.meta?.last_page ?? 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {isStockModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {stockModalMode === 'adjust' ? 'Adjust stock' : 'Restock product'}
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                  {stockModalMode === 'adjust' ? 'Update Current Stock' : 'Add Stock Quantity'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeStockModal}
                className="rounded-full border border-slate-300 p-1 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Product</span>
                <select
                  value={selectedProductId === '' ? '' : String(selectedProductId)}
                  onChange={(event) => {
                    const value = event.target.value
                    setSelectedProductId(value ? Number(value) : '')
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Select product</option>
                  {filteredProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku || `#${product.id}`})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {stockModalMode === 'adjust' ? 'Set quantity' : 'Add quantity'}
                </span>
                <input
                  type="number"
                  min={0}
                  value={quantityInput}
                  onChange={(event) => setQuantityInput(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>

              {selectedProduct ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Current stock: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatNumber(toQuantity(selectedProduct))}</span>
                </p>
              ) : null}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeStockModal}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStock}
                disabled={isSavingStock}
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60 dark:bg-orange-500 dark:hover:bg-orange-600"
              >
                {isSavingStock ? 'Saving...' : stockModalMode === 'adjust' ? 'Save adjustment' : 'Apply restock'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MetricCard({
  title,
  value,
  subtitle,
  accent,
  icon,
  trend,
}: {
  title: string
  value: string
  subtitle: string
  accent: string
  icon: React.ReactNode
  trend?: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-gradient-to-br from-slate-500/10 via-transparent to-transparent opacity-70 blur-2xl" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-xl border bg-white/60 ${accent}`}>
              {icon}
            </span>
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
        </div>

        {trend ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-200">
            {trend}
          </div>
        ) : null}
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800/70">
        <div className={`h-full w-2/3 ${accent}`} />
      </div>
    </div>
  )
}

