'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { getPartnerStorefrontConfig } from '@/libs/partnerStorefront'
import { useGetAdminMeQuery } from '@/store/api/authApi'
import { useGetPartnerStorefrontOrdersQuery } from '@/store/api/adminOrdersApi'
import { useGetAdminWebPageItemsQuery } from '@/store/api/webPagesApi'
import { useGetCategoriesQuery } from '@/store/api/categoriesApi'

const money = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
})

const dateTime = new Intl.DateTimeFormat('en-PH', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const statusClass = (status?: string | null) => {
  const normalized = String(status ?? '').toLowerCase()
  if (normalized === 'delivered') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
  if (normalized === 'cancelled' || normalized === 'rejected') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
  if (normalized === 'pending' || normalized === 'pending_approval') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

const extractErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') return 'Unknown error.'

  const e = error as {
    status?: number | string
    data?: { message?: string; error?: string }
    error?: string
  }

  const message = e.data?.message || e.data?.error || e.error
  if (message && String(message).trim() !== '') {
    if (e.status !== undefined) {
      return `${e.status}: ${String(message)}`
    }
    return String(message)
  }

  if (e.status !== undefined) {
    return `${e.status}: Request failed.`
  }

  return 'Request failed.'
}

export default function PartnerOrdersPage() {
  const { data: me, isLoading: isMeLoading } = useGetAdminMeQuery()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const storefrontIds = useMemo(() => me?.storefront_ids ?? [], [me?.storefront_ids])
  const { data: storefrontItems, isLoading: isStorefrontLoading } = useGetAdminWebPageItemsQuery(
    { type: 'partner-storefront', page: 1, perPage: 100, status: 'all' },
    { skip: storefrontIds.length === 0 },
  )
  const { data: ordersData, isLoading: isOrdersLoading, isFetching: isOrdersFetching, error } = useGetPartnerStorefrontOrdersQuery({
    filter: 'all',
    page: 1,
    perPage: 25,
  })

  const storefrontSlugs = useMemo(() => {
    if (storefrontIds.length === 0) return []

    return (storefrontItems?.items ?? [])
      .filter((item) => storefrontIds.includes(item.id))
      .map((item) => getPartnerStorefrontConfig(item)?.slug)
      .filter((slug): slug is string => Boolean(slug))
  }, [storefrontIds, storefrontItems?.items])

  const storefrontNameBySlug = useMemo(() => {
    const entries = (storefrontItems?.items ?? [])
      .filter((item) => storefrontIds.includes(item.id))
      .map((item) => {
        const config = getPartnerStorefrontConfig(item)
        if (!config) return null
        return [config.slug, config.displayName] as const
      })
      .filter((entry): entry is readonly [string, string] => Boolean(entry))

    return Object.fromEntries(entries)
  }, [storefrontIds, storefrontItems?.items])

  const allowedCategoryIds = useMemo(() => {
    const allowed = new Set<number>()

    if (!storefrontItems?.items || storefrontIds.length === 0) return []

    for (const item of storefrontItems.items) {
      if (!storefrontIds.includes(item.id)) continue
      const config = getPartnerStorefrontConfig(item)
      for (const catId of config?.allowedCategoryIds ?? []) {
        if (Number.isFinite(catId) && catId > 0) allowed.add(catId)
      }
    }

    return Array.from(allowed.values()).sort((a, b) => a - b)
  }, [storefrontIds, storefrontItems?.items])

  const { data: categoriesData, isLoading: isCategoriesLoading } = useGetCategoriesQuery(
    { page: 1, per_page: 500, used_only: true },
    { skip: allowedCategoryIds.length === 0 },
  )

  const allowedCategories = useMemo(() => {
    const all = categoriesData?.categories ?? []
    const allowed = new Set(allowedCategoryIds)
    return all.filter((c) => allowed.has(c.id))
  }, [categoriesData?.categories, allowedCategoryIds])

  const partnerOrders = useMemo(() => {
    return (ordersData?.orders ?? []).filter((order) => {
      if (statusFilter !== 'all') {
        const fulfillmentStatus = String(order.fulfillment_status ?? '').trim().toLowerCase()
        const normalized = statusFilter.trim().toLowerCase()
        if (fulfillmentStatus !== normalized) return false
      }

      if (categoryFilter !== 'all') {
        const selectedCategoryId = Number(categoryFilter)
        const orderCategoryId = Number(order.product_category_id ?? 0)
        if (!Number.isFinite(selectedCategoryId) || selectedCategoryId <= 0) return false
        if (!Number.isFinite(orderCategoryId) || orderCategoryId <= 0) return false
        if (selectedCategoryId !== orderCategoryId) return false
      }

      return true
    })
  }, [ordersData?.orders, statusFilter, categoryFilter])

  const loading =
    isMeLoading || isStorefrontLoading || isOrdersLoading || isCategoriesLoading
  const ordersErrorMessage = useMemo(() => extractErrorMessage(error), [error])

  const statusOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All statuses' },
      { value: 'pending', label: 'Pending' },
      { value: 'processing', label: 'Processing' },
      { value: 'packed', label: 'Packed' },
      { value: 'shipped', label: 'Shipped' },
      { value: 'out_for_delivery', label: 'Out for delivery' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'refunded', label: 'Refunded' },
    ]
  }, [])

  const categoryOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [{ value: 'all', label: 'All categories' }]
    for (const c of allowedCategories) {
      options.push({ value: String(c.id), label: c.name })
    }
    return options
  }, [allowedCategories])

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-teal-500/20 via-emerald-500/20 to-indigo-500/20 dark:from-teal-500/10 dark:via-emerald-500/10 dark:to-indigo-500/10" />
        <div className="relative p-6 sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Partner Orders</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Orders placed from your assigned storefronts.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                {partnerOrders.length} shown
              </div>
            </div>
          </div>

          {isOrdersFetching && !loading ? (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Refreshing orders...</p>
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={loading}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                disabled={loading || allowedCategoryIds.length === 0}
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                className="w-full rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
                onClick={() => {
                  setStatusFilter('all')
                  setCategoryFilter('all')
                }}
                disabled={loading && statusFilter === 'all' && categoryFilter === 'all'}
              >
                Reset
              </button>
              <p className="mt-2 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">Use dropdowns to refine results</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading orders...</div>
        ) : null}

        {!loading && error ? (
          <div className="space-y-1 p-6 text-sm text-rose-600 dark:text-rose-300">
            <p>Failed to load orders.</p>
            <p className="text-xs">{ordersErrorMessage}</p>
          </div>
        ) : null}

        {!loading && !error && storefrontIds.length === 0 ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">No storefront assigned to this partner account.</div>
        ) : null}

        {!loading && !error && storefrontIds.length > 0 && partnerOrders.length === 0 ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">No orders match your current filters.</div>
        ) : null}

        {!loading && !error && partnerOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Storefront</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {partnerOrders.map((order) => {
                  const sourceSlug = String(order.source_slug ?? '').trim().toLowerCase()
                  const storefrontName = storefrontNameBySlug[sourceSlug] || order.source_label || sourceSlug || '-'
                  return (
                    <tr
                      key={order.id}
                      className="align-top transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">#{order.id}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{order.checkout_id}</p>
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{storefrontName}</td>

                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{order.customer_name || '-'}</td>

                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex max-w-[360px] gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                            {order.product_image ? (
                              <Image
                                src={order.product_image}
                                alt={order.product_name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">N/A</div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium">{order.product_name}</p>

                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {order.product_sku ? (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  SKU: {order.product_sku}
                                </span>
                              ) : null}
                              {order.selected_type ? (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  {order.selected_type}
                                </span>
                              ) : null}
                              {order.selected_color ? (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  {order.selected_color}
                                </span>
                              ) : null}
                              {order.selected_size ? (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  {order.selected_size}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Qty: {order.quantity} · Unit: {money.format(Number(order.amount ?? 0) / Math.max(1, Number(order.quantity ?? 1)))}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{money.format(Number(order.amount ?? 0))}</td>

                      <td className="px-4 py-3">
                        {order.payment_method ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                            {String(order.payment_method).replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(order.fulfillment_status)}`}>
                          {order.fulfillment_status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {order.created_at ? dateTime.format(new Date(order.created_at)) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  )
}
