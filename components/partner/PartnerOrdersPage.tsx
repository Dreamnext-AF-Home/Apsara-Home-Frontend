'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { getPartnerStorefrontConfig } from '@/libs/partnerStorefront'
import { useGetAdminMeQuery } from '@/store/api/authApi'
import { useGetPartnerStorefrontOrdersQuery } from '@/store/api/adminOrdersApi'
import { useGetAdminWebPageItemsQuery } from '@/store/api/webPagesApi'

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
  const storefrontIds = useMemo(() => me?.storefront_ids ?? [], [me?.storefront_ids])
  const { data: storefrontItems, isLoading: isStorefrontLoading } = useGetAdminWebPageItemsQuery(
    { type: 'partner-storefront', page: 1, perPage: 100, status: 'all' },
    { skip: storefrontIds.length === 0 },
  )
  const { data: ordersData, isLoading: isOrdersLoading, isFetching: isOrdersFetching, error } = useGetPartnerStorefrontOrdersQuery({
    filter: 'all',
    page: 1,
    perPage: 200,
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

  const partnerOrders = useMemo(() => {
    const allowedSlugs = new Set(storefrontSlugs.map((slug) => slug.toLowerCase()))
    if (allowedSlugs.size === 0) return []

    return (ordersData?.orders ?? []).filter((order) => {
      const sourceSlug = String(order.source_slug ?? '').trim().toLowerCase()
      return sourceSlug !== '' && allowedSlugs.has(sourceSlug)
    })
  }, [ordersData?.orders, storefrontSlugs])

  const loading = isMeLoading || isStorefrontLoading || isOrdersLoading
  const ordersErrorMessage = useMemo(() => extractErrorMessage(error), [error])

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Storefront Orders</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Showing orders placed from your assigned storefronts.
        </p>
        {isOrdersFetching && !loading ? (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Refreshing orders...</p>
        ) : null}
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
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">No orders found for your storefront yet.</div>
        ) : null}

        {!loading && !error && partnerOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Storefront</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {partnerOrders.map((order) => {
                  const sourceSlug = String(order.source_slug ?? '').trim().toLowerCase()
                  const storefrontName = storefrontNameBySlug[sourceSlug] ?? sourceSlug
                  return (
                    <tr key={order.id} className="align-top">
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
                            <div className="mt-1 flex flex-wrap gap-1">
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
