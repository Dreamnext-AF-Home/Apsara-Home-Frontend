'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useFetchZqImportPreviewMutation } from '@/store/api/productsApi'
import { showErrorToast } from '@/libs/toast'

type ZqLiveProduct = {
  id: string
  subject: string
  subjectCn?: string | null
  primaryImage?: string | null
  sourceType?: string | null
  status?: string | null
  importStatus?: string | null
  productUrl?: string | null
  createdAt?: string | null
}

type ZqPageData = {
  products: ZqLiveProduct[]
  hasMore: boolean
  nextCursor: string | null
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

const enumText = (value: unknown) => {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const label = record.label
    const rawValue = record.value
    if (typeof label === 'string' && label.trim() !== '') return label
    if (typeof rawValue === 'string' || typeof rawValue === 'number') return String(rawValue)
  }
  return null
}

const extractZqPage = (payload: Record<string, unknown> | undefined): ZqPageData => {
  const rootData = payload?.data && typeof payload.data === 'object'
    ? payload.data as Record<string, unknown>
    : payload

  const rawRecords = Array.isArray(rootData?.records)
    ? rootData.records
    : Array.isArray(payload?.records)
      ? payload.records
      : []

  const products: ZqLiveProduct[] = rawRecords
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => {
      const images = Array.isArray(item.images)
        ? item.images.filter((image): image is Record<string, unknown> => !!image && typeof image === 'object')
        : []

      const mainImage = images.find((image) => image.isMain === true) ?? images[0]

      return {
        id: String(item.id ?? ''),
        subject: String(item.subject ?? item.subjectCn ?? 'Untitled product'),
        subjectCn: typeof item.subjectCn === 'string' ? item.subjectCn : null,
        primaryImage: typeof mainImage?.image === 'string' ? mainImage.image : null,
        sourceType: enumText(item.sourceType),
        status: enumText(item.status),
        importStatus: enumText(item.importproStatus ?? item.importProductStatus),
        productUrl: typeof item.productUrl === 'string' ? item.productUrl : null,
        createdAt: typeof item.createdAt === 'string'
          ? item.createdAt
          : typeof item.published === 'string'
            ? item.published
            : null,
      }
    })
    .filter((product) => product.id !== '')

  const nextCursor = rootData?.nextCursor
  const hasMore = Boolean(rootData?.hasMore)

  return {
    products,
    hasMore,
    nextCursor: nextCursor == null ? null : String(nextCursor),
  }
}

export default function ZqSupplierProductsPageMain({
  scope,
  embedded = false,
}: {
  scope: 'admin' | 'supplier'
  embedded?: boolean
}) {
  const previewBasePath = scope === 'supplier' ? '/supplier/products/zq-preview' : '/admin/products/zq-preview'
  const backHref = scope === 'supplier' ? '/supplier/products' : '/admin/products'

  const [fetchZqImportPreview, { isLoading }] = useFetchZqImportPreviewMutation()
  const [currentPage, setCurrentPage] = useState(1)
  const [draftSearch, setDraftSearch] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [pageCursors, setPageCursors] = useState<Record<number, string | null>>({ 1: null })
  const [pageData, setPageData] = useState<Record<number, ZqPageData>>({})
  const [lastError, setLastError] = useState<string | null>(null)

  const loadPage = async (page: number, cursor: string | null, keyword: string, replace = false) => {
    try {
      setLastError(null)

      const response = await fetchZqImportPreview({
        cursor,
        size: 20,
        keyword: keyword || undefined,
      }).unwrap()

      const nextPage = extractZqPage(response.zq as Record<string, unknown> | undefined)

      setPageData((current) => ({
        ...(replace ? {} : current),
        [page]: nextPage,
      }))

      setPageCursors((current) => ({
        ...(replace ? { 1: null } : current),
        [page]: cursor,
        ...(nextPage.nextCursor ? { [page + 1]: nextPage.nextCursor } : {}),
      }))
    } catch (error) {
      const apiError = error as { data?: { message?: string } }
      const message = apiError?.data?.message || 'Failed to load global supplier products.'
      setLastError(message)
      showErrorToast(message)
    }
  }

  useEffect(() => {
    if (pageData[currentPage]) return
    void loadPage(currentPage, pageCursors[currentPage] ?? null, searchKeyword)
  }, [currentPage, pageCursors, pageData, searchKeyword])

  useEffect(() => {
    if (!embedded || pageData[1]) return
    void loadPage(1, null, searchKeyword, true)
  }, [embedded, pageData, searchKeyword])

  const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextKeyword = draftSearch.trim()
    setCurrentPage(1)
    setSearchKeyword(nextKeyword)
    setPageData({})
    setPageCursors({ 1: null })
    await loadPage(1, null, nextKeyword, true)
  }

  const handleRefresh = async () => {
    const cursor = currentPage === 1 ? null : pageCursors[currentPage] ?? null
    await loadPage(currentPage, cursor, searchKeyword, currentPage === 1)
  }

  const current = pageData[currentPage]
  const products = current?.products ?? []
  const hasNextPage = Boolean(current?.hasMore && pageCursors[currentPage + 1])
  const totalLoaded = useMemo(
    () => Object.values(pageData).reduce((sum, page) => sum + page.products.length, 0),
    [pageData],
  )

  return (
    <div className="space-y-6">
      {!embedded ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-start justify-between gap-4"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">AF HOME GLOBAL SUPPLIER</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Get Global Supplier Product</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Live product list ito mula sa Global Supplier API. Pang-viewing muna ito sa table at hindi pa ini-import sa local catalog.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isLoading}
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
            >
              {isLoading ? 'Loading...' : 'Get Global Supplier Product'}
            </button>
            <Link
              href={backHref}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Back to Products
            </Link>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3"
        >
          <div>
            <p className="text-sm font-semibold text-sky-800">Get Global Supplier Product</p>
            <p className="mt-0.5 text-xs text-sky-700">
              Dito mismo sa table lumalabas ang live products mula sa Global Supplier API. Walang navigation sa ibang page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isLoading}
            className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Loading...' : 'Refresh Global Supplier Products'}
          </button>
        </motion.div>
      )}

      {!embedded ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="grid gap-3 sm:grid-cols-3"
          >
            <StatCard label="Current Page" value={currentPage} />
            <StatCard label="Loaded In Session" value={totalLoaded.toLocaleString()} />
            <StatCard label="This Page" value={products.length.toLocaleString()} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                placeholder="Search global supplier product name or external ID..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white"
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Search
              </button>
              {searchKeyword ? (
                <button
                  type="button"
                  onClick={() => {
                    setDraftSearch('')
                    setSearchKeyword('')
                    setCurrentPage(1)
                    setPageData({})
                    setPageCursors({ 1: null })
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Clear
                </button>
              ) : null}
            </form>
          </motion.div>
        </>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className={embedded ? '' : 'overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm'}
      >
        {!embedded ? (
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-bold text-slate-900">Global Supplier Product Table</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Ito na mismo ang live list ng global supplier products sa table. I-click ang <span className="font-semibold">View Preview</span> para sa sariling detail preview natin.
            </p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : lastError ? (
          <div className="px-5 py-16 text-center">
            <p className="text-base font-semibold text-slate-800">Failed to load global supplier products.</p>
            <p className="mt-1 text-sm text-slate-500">{lastError}</p>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="mt-4 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-base font-semibold text-slate-800">No global supplier products found.</p>
            <p className="mt-1 text-sm text-slate-500">
              {searchKeyword ? 'Walang tumamang products sa current search.' : 'I-click ang Get Global Supplier Product para kunin ang first page ng products mula sa Global Supplier API.'}
            </p>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Source</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Imported</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {products.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    previewHref={`${previewBasePath}/${product.id}`}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-sm text-slate-500">
            Page <span className="font-semibold text-slate-700">{currentPage}</span>
            {searchKeyword ? (
              <>
                {' '}for <span className="font-semibold text-slate-700">&quot;{searchKeyword}&quot;</span>
              </>
            ) : null}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={!hasNextPage || isLoading}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

function ProductRow({
  product,
  previewHref,
}: {
  product: ZqLiveProduct
  previewHref: string
}) {
  return (
    <tr>
      <td className="px-5 py-4 align-top">
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {product.primaryImage ? (
              <Image src={product.primaryImage} alt={product.subject} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No img</div>
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="line-clamp-2 font-semibold text-slate-900">{product.subject}</p>
            <p className="font-mono text-xs text-slate-400">ID: {product.id}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 align-top text-sm text-slate-600">{product.sourceType ?? '—'}</td>
      <td className="px-5 py-4 align-top">
        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          {product.status ?? '—'}
        </span>
      </td>
      <td className="px-5 py-4 align-top">
        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          {product.importStatus ?? '—'}
        </span>
      </td>
      <td className="px-5 py-4 align-top text-xs text-slate-500">{formatDate(product.createdAt)}</td>
      <td className="px-5 py-4 text-right align-top">
        <Link
          href={previewHref}
          className="inline-flex rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
        >
          View Preview
        </Link>
      </td>
    </tr>
  )
}
