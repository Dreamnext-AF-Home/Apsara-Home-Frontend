'use client'

import { useCallback, useRef, useState } from 'react'
import { cn } from 'tailwind-variants'
import Image from 'next/image'
import { RefreshCw, Search, Warehouse, PackageCheck, PackageMinus, PackageX, Boxes } from 'lucide-react'
import { useGetZqCachedProductsQuery, useLazyGetZqInventoryQuery, ZqCachedProduct } from '@/store/api/productsApi'

function StockBadge({ qty }: { qty: number }) {
  if (qty === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Out of stock
      </span>
    )
  }
  if (qty <= 5) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
        Low — {qty.toLocaleString()}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {qty.toLocaleString()}
    </span>
  )
}

function InventoryRow({ product, index }: { product: ZqCachedProduct; index: number }) {
  const [checkLive, { data, isFetching, isError }] = useLazyGetZqInventoryQuery()
  const hasResult = data !== undefined || isError
  const isPublished = String(product.status ?? '').toLowerCase() === 'published'

  return (
    <tr className={cn(
      'border-b border-slate-100 transition-colors hover:bg-white dark:border-slate-800/50 dark:hover:bg-slate-900',
      index % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-900/30' : '',
    )}>
      {/* Product */}
      <td className="px-5 py-4 align-top">
        <div className="flex items-start gap-3">
          <div className="relative mt-0.5 h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
            {product.primaryImage ? (
              <Image src={product.primaryImage} alt={product.subject} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Warehouse className="h-5 w-5 text-slate-300 dark:text-slate-600" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800 dark:text-slate-100">{product.subject}</p>
            <span className="mt-1.5 inline-block rounded-md border border-slate-100 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-500">
              {product.externalId}
            </span>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-5 py-4 align-top">
        <div className="min-w-[120px]">
          <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
            {product.localCategoryName || product.categoryName || '—'}
          </p>
          {product.sourceType ? (
            <span className="mt-1 inline-block rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
              {product.sourceType}
            </span>
          ) : null}
        </div>
      </td>

      {/* Cached Stock */}
      <td className="px-5 py-4 align-top">
        <StockBadge qty={product.totalStock} />
        <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          {product.variantCount} variant{product.variantCount !== 1 ? 's' : ''}
        </p>
      </td>

      {/* Live Check */}
      <td className="px-5 py-4 align-top">
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            disabled={isFetching || !product.externalId}
            onClick={() => checkLive(product.externalId)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
              hasResult && !isFetching
                ? 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/15'
                : 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/15',
            )}
          >
            <RefreshCw className={cn('h-3 w-3', isFetching ? 'animate-spin' : '')} />
            {isFetching ? 'Checking...' : hasResult ? 'Refresh' : 'Check Live'}
          </button>

          {isError ? (
            <p className="text-[10px] font-medium text-red-500 dark:text-red-400">Failed to fetch</p>
          ) : data ? (
            <div className="min-w-[110px] rounded-xl border border-violet-200/60 bg-[linear-gradient(135deg,rgba(139,92,246,0.06),rgba(99,102,241,0.04))] px-3 py-2 dark:border-violet-500/15 dark:bg-violet-500/5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-violet-400 dark:text-violet-500">ZQ Live</p>
              <p className={cn(
                'mt-0.5 text-base font-bold leading-none',
                data.available === 0 ? 'text-red-600 dark:text-red-400' : data.available <= 5 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-700 dark:text-emerald-300',
              )}>
                {data.available.toLocaleString()}
              </p>
              {data.variant_count ? (
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">{data.variant_count} variants</p>
              ) : null}
              {data.source === 'product_detail_fallback' ? (
                <p className="mt-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">Detail stock fallback</p>
              ) : null}
              {typeof data.locked === 'number' || typeof data.on_transit === 'number' ? (
                <p className="mt-1 text-[10px] leading-tight text-slate-400 dark:text-slate-500">
                  Locked {(data.locked ?? 0).toLocaleString()} · Transit {(data.on_transit ?? 0).toLocaleString()}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-4 align-top">
        <span className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
          isPublished
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
        )}>
          <span className={cn('h-1.5 w-1.5 rounded-full', isPublished ? 'bg-emerald-500' : 'bg-slate-400')} />
          {isPublished ? 'Published' : (product.status ?? 'Draft')}
        </span>
      </td>

      {/* Last Synced */}
      <td className="px-5 py-4 align-top">
        {product.syncedAt ? (
          <div>
            <p className="text-[12px] font-medium text-slate-600 dark:text-slate-300">
              {new Date(product.syncedAt).toLocaleDateString('en-CA')}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
              {new Date(product.syncedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </p>
          </div>
        ) : (
          <span className="text-[12px] text-slate-300 dark:text-slate-600">—</span>
        )}
      </td>
    </tr>
  )
}

export default function SupplierInventoryPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 25

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

  const { data, isLoading, isFetching, refetch } = useGetZqCachedProductsQuery({
    page,
    perPage,
    search: search || undefined,
  })

  const products = data?.products ?? []
  const meta = data?.meta

  const stats = [
    {
      label: 'Total Products',
      value: meta?.total ?? 0,
      icon: Boxes,
      color: 'text-slate-700 dark:text-slate-100',
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      iconColor: 'text-slate-500 dark:text-slate-400',
    },
    {
      label: 'In Stock',
      value: products.filter((p) => p.totalStock > 5).length,
      icon: PackageCheck,
      color: 'text-emerald-700 dark:text-emerald-300',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      note: 'this page',
    },
    {
      label: 'Low Stock',
      value: products.filter((p) => p.totalStock > 0 && p.totalStock <= 5).length,
      icon: PackageMinus,
      color: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-50 dark:bg-orange-500/10',
      iconColor: 'text-orange-500 dark:text-orange-400',
      note: 'this page',
    },
    {
      label: 'Out of Stock',
      value: products.filter((p) => p.totalStock === 0).length,
      icon: PackageX,
      color: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-50 dark:bg-red-500/10',
      iconColor: 'text-red-500 dark:text-red-400',
      note: 'this page',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-400">Global Supplier</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">ZQ Inventory</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Live warehouse stock from Global Supplier (ZQ) — check per product on demand.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-10 w-56 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-violet-500 dark:focus:ring-violet-500/15"
            />
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching ? 'animate-spin' : '')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{stat.label}</p>
                  <p className={cn('mt-2 text-3xl font-bold leading-none', stat.color)}>
                    {stat.value.toLocaleString()}
                  </p>
                  {stat.note ? (
                    <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-600">{stat.note}</p>
                  ) : null}
                </div>
                <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', stat.iconBg)}>
                  <Icon className={cn('h-4.5 w-4.5', stat.iconColor)} />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-[0_24px_70px_-34px_rgba(139,92,246,0.12)]">
        {/* loading bar */}
        {isFetching && (
          <div className="h-0.5 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            <div className="h-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-linear-to-r from-violet-400 via-sky-400 to-violet-400 bg-[length:200%_100%]" />
          </div>
        )}

        {/* Table with drag scroll */}
        <div
          ref={scrollRef}
          className={cn('overflow-x-auto', isDragging ? 'cursor-grabbing select-none' : 'cursor-grab')}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
        >
          <table className="w-full min-w-[900px] border-separate border-spacing-0 text-sm">
            <thead className="bg-slate-50/95 dark:bg-slate-900">
              <tr>
                {[
                  { label: 'Product', width: 'min-w-[300px]' },
                  { label: 'Category', width: 'min-w-[150px]' },
                  { label: 'Cached Stock', width: 'min-w-[130px]' },
                  { label: 'Live Check', width: 'min-w-[160px]' },
                  { label: 'Status', width: 'min-w-[110px]' },
                  { label: 'Last Synced', width: 'min-w-[120px]' },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={cn(
                      'border-b border-slate-200 px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:border-slate-800 dark:text-slate-500',
                      col.width,
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className={cn('border-b border-slate-100 dark:border-slate-800/50', i % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-900/30' : '')}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                          <div className="h-2.5 w-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                        </div>
                      </div>
                    </td>
                    {[1, 2, 3, 4, 5].map((c) => (
                      <td key={c} className="px-5 py-4">
                        <div className="h-6 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                      <Warehouse className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">No products found</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {search ? 'Try a different search term.' : 'Sync products from Global Supplier first.'}
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <InventoryRow key={product.id} product={product} index={index} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="border-t border-slate-200 bg-slate-50/90 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {meta
                ? <>{(meta.from ?? 0).toLocaleString()} – {(meta.to ?? 0).toLocaleString()} of <span className="font-semibold text-slate-700 dark:text-slate-200">{meta.total.toLocaleString()}</span> products</>
                : 'Loading…'}
            </p>

            {meta && meta.last_page > 1 ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                >
                  ← Prev
                </button>
                <span className="min-w-[90px] text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                  {page} / {meta.last_page}
                </span>
                <button
                  type="button"
                  disabled={page === meta.last_page}
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                >
                  Next →
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
