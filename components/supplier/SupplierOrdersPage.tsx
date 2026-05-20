'use client'

import { useEffect, useMemo, useState } from 'react'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import {
  SupplierFulfillmentStatus,
  SupplierShipmentStatus,
  useGetSupplierOrdersQuery,
  useUpdateSupplierOrderFulfillmentMutation,
  useUpdateSupplierOrderTrackingMutation,
} from '@/store/api/supplierOrdersApi'

const statConfig = [
  { key: 'total', label: 'Total Orders', icon: 'clipboard', accent: 'text-slate-500 dark:text-slate-300', ring: 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700' },
  { key: 'toPay', label: 'To Pay', icon: 'clock', accent: 'text-amber-600 dark:text-amber-300', ring: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20' },
  { key: 'toShip', label: 'To Ship', icon: 'sync', accent: 'text-blue-600 dark:text-blue-300', ring: 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20' },
  { key: 'toReceive', label: 'To Receive', icon: 'box', accent: 'text-indigo-600 dark:text-indigo-300', ring: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20' },
  { key: 'completed', label: 'Completed', icon: 'check', accent: 'text-emerald-600 dark:text-emerald-300', ring: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' },
  { key: 'cancelled', label: 'Cancelled', icon: 'x', accent: 'text-rose-600 dark:text-rose-300', ring: 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20' },
  { key: 'return', label: 'Return', icon: 'undo', accent: 'text-teal-600 dark:text-teal-300', ring: 'bg-teal-50 border-teal-200 dark:bg-teal-500/10 dark:border-teal-500/20' },
] as const

const fulfillmentOptions: Array<{ value: SupplierFulfillmentStatus; label: string }> = [
  { value: 'processing', label: 'Processing' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
]

const shipmentOptions: Array<{ value: SupplierShipmentStatus; label: string }> = [
  { value: 'for_pickup', label: 'For Pickup' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed_delivery', label: 'Failed Delivery' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned_to_sender', label: 'Returned to Sender' },
]

const StatIcon = ({ name, className }: { name: string; className?: string }) => {
  if (name === 'clipboard') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M9 4h6a2 2 0 0 1 2 2v1H7V6a2 2 0 0 1 2-2Z" />
        <path d="M7 7h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7Z" />
      </svg>
    )
  }
  if (name === 'clock') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    )
  }
  if (name === 'sync') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M4 12a8 8 0 0 1 13.66-5.66" />
        <path d="M20 12a8 8 0 0 1-13.66 5.66" />
        <path d="M17 3v4h-4" />
        <path d="M7 21v-4h4" />
      </svg>
    )
  }
  if (name === 'x') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6}>
        <circle cx="12" cy="12" r="8" />
        <path d="M9 9l6 6M15 9l-6 6" />
      </svg>
    )
  }
  if (name === 'box') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z" />
        <path d="M12 12v9" />
        <path d="M4 7.5v9L12 21l8-4.5v-9" />
      </svg>
    )
  }
  if (name === 'undo') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M9 7H4v5" />
        <path d="M4 12a8 8 0 0 1 13.66-4.66" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6}>
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 12.5 11 15l4.5-6" />
    </svg>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(value || 0)
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleString()
}

function getSupplierStatusLabel(order: { payment_status?: string | null; fulfillment_status?: string | null }) {
  const payment = String(order.payment_status ?? '').toLowerCase()
  const fulfillment = String(order.fulfillment_status ?? '').toLowerCase()

  if (['pending', 'unpaid', 'failed'].includes(payment)) return 'To Pay'
  if (['processing', 'packed'].includes(fulfillment)) return 'To Ship'
  if (['shipped', 'out_for_delivery'].includes(fulfillment)) return 'To Receive'
  if (['delivered'].includes(fulfillment)) return 'Completed'
  if (['cancelled', 'refunded'].includes(fulfillment)) return 'Cancelled'
  if (['returned_refunded', 'return', 'returned'].includes(fulfillment)) return 'Return'

  return 'Pending'
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const payload = error as { data?: { message?: string } }
  return payload?.data?.message || fallback
}

type TrackingDraft = {
  courier: string
  tracking_no: string
  shipment_status: SupplierShipmentStatus
}

export default function SupplierOrdersPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('to_pay')
  const [userSelectedFilter, setUserSelectedFilter] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [fulfillmentDrafts, setFulfillmentDrafts] = useState<Record<number, SupplierFulfillmentStatus>>({})
  const [trackingDrafts, setTrackingDrafts] = useState<Record<number, TrackingDraft>>({})

  const { data, isLoading, isError } = useGetSupplierOrdersQuery({
    filter,
    search: search.trim() || undefined,
    page: 1,
    perPage: 20,
  })
  const [updateFulfillment] = useUpdateSupplierOrderFulfillmentMutation()
  const [updateTracking] = useUpdateSupplierOrderTrackingMutation()

  const orders = useMemo(() => data?.orders ?? [], [data?.orders])

  useEffect(() => {
    if (!orders.length) return

    setFulfillmentDrafts((current) => {
      const next = { ...current }
      for (const order of orders) {
        next[order.id] = (order.fulfillment_status as SupplierFulfillmentStatus) || 'processing'
      }
      return next
    })

    setTrackingDrafts((current) => {
      const next = { ...current }
      for (const order of orders) {
        next[order.id] = {
          courier: order.courier ?? '',
          tracking_no: order.tracking_no ?? '',
          shipment_status: (order.shipment_status as SupplierShipmentStatus) || 'in_transit',
        }
      }
      return next
    })
  }, [orders])

  const counts = useMemo(() => ({
    total: data?.counts?.total ?? orders.length,
    toPay: data?.counts?.to_pay ?? 0,
    toShip: data?.counts?.to_ship ?? 0,
    toReceive: data?.counts?.to_receive ?? 0,
    cancelled: data?.counts?.cancelled ?? 0,
    completed: data?.counts?.completed ?? 0,
    return: data?.counts?.return ?? 0,
  }), [data?.counts, orders.length])

  useEffect(() => {
    if (userSelectedFilter) return
    if (filter !== 'to_pay') return
    if ((counts.toPay ?? 0) > 0 || (counts.total ?? 0) === 0) return

    let nextFilter = 'all'
    if (counts.toShip > 0) nextFilter = 'to_ship'
    else if (counts.toReceive > 0) nextFilter = 'to_receive'
    else if (counts.completed > 0) nextFilter = 'completed'
    else if (counts.cancelled > 0) nextFilter = 'cancelled'
    else if (counts.return > 0) nextFilter = 'return'

    if (nextFilter !== filter) {
      setFilter(nextFilter)
    }
  }, [counts, filter, userSelectedFilter])

  async function handleSaveFulfillment(id: number) {
    const fulfillment_status = fulfillmentDrafts[id]
    if (!fulfillment_status) return

    setBusyId(id)
    try {
      const result = await updateFulfillment({ id, fulfillment_status }).unwrap()
      showSuccessToast(result.message || 'Fulfillment status updated.')
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Failed to update fulfillment status.'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleSaveTracking(id: number) {
    const draft = trackingDrafts[id]
    if (!draft?.courier.trim() || !draft?.tracking_no.trim()) {
      showErrorToast('Courier at tracking number are required.')
      return
    }

    setBusyId(id)
    try {
      const result = await updateTracking({
        id,
        courier: draft.courier.trim(),
        tracking_no: draft.tracking_no.trim(),
        shipment_status: draft.shipment_status,
      }).unwrap()
      showSuccessToast(result.message || 'Tracking details updated.')
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Failed to update tracking details.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">AF HOME GLOBAL SUPPLIER Workspace</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">Supplier order fulfillment</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Dito i-aacknowledge ng supplier ang paid orders, ilalagay ang courier at tracking number, at ia-update ang fulfillment progress hanggang delivery.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-100">
            <strong className="block">Workflow</strong>
            <span>Approve sa admin, then supplier na ang bahala sa pack, ship, at tracking.</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {statConfig.map((stat) => (
            <div key={stat.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${stat.ring}`}>
                  <StatIcon name={stat.icon} className={`h-5 w-5 ${stat.accent}`} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{stat.label}</p>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">{counts[stat.key as keyof typeof counts]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
            <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search checkout ID, customer, product..."
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filter}
              onChange={(event) => {
                setUserSelectedFilter(true)
                setFilter(event.target.value)
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="to_pay">To Pay</option>
              <option value="to_ship">To Ship</option>
              <option value="to_receive">To Receive</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="return">Return</option>
              <option value="all">All Orders</option>
            </select>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              {orders.length} orders
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-0 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Order Queue</h2>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {orders.length} orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1380px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-900 dark:text-slate-500">
              <tr>
                <th className="px-6 py-3">Checkout</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Approval</th>
                <th className="px-6 py-3">Supplier Status</th>
                <th className="px-6 py-3">Tracking Setup</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-sm text-rose-600">
                    Failed to load orders.
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    No orders yet. New supplier orders will appear here once customers start checking out.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isBusy = busyId === order.id
                  const canManage = order.approval_status === 'approved'
                  const trackingDraft = trackingDrafts[order.id] ?? {
                    courier: '',
                    tracking_no: '',
                    shipment_status: 'in_transit' as SupplierShipmentStatus,
                  }

                  return (
                    <tr key={order.id} className="border-t border-slate-100 align-top dark:border-slate-800">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{order.checkout_id || `#${order.id}`}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{order.payment_method ?? '—'}</p>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        <p>{formatDateTime(order.created_at)}</p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Paid: {formatDateTime(order.paid_at)}</p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{order.customer_name ?? 'Customer'}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{order.customer_email ?? ''}</p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{order.customer_phone ?? ''}</p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{order.product_name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Qty: {order.quantity}</p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{order.product_description ?? 'No product description'}</p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{formatMoney(order.amount)}</p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{getSupplierStatusLabel(order)}</p>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            canManage
                              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'
                              : 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200'
                          }`}
                        >
                          {order.approval_status ?? 'Pending'}
                        </span>
                        {order.approval_notes ? (
                          <p className="mt-2 max-w-[220px] text-xs leading-5 text-slate-500 dark:text-slate-400">{order.approval_notes}</p>
                        ) : null}
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-3">
                          <div>
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                              Current
                            </p>
                            <p className="text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">
                              {(order.fulfillment_status ?? 'pending').replace(/_/g, ' ')}
                            </p>
                          </div>

                          <select
                            disabled={!canManage || isBusy}
                            value={fulfillmentDrafts[order.id] ?? 'processing'}
                            onChange={(event) =>
                              setFulfillmentDrafts((current) => ({
                                ...current,
                                [order.id]: event.target.value as SupplierFulfillmentStatus,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:disabled:bg-slate-800"
                          >
                            {fulfillmentOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            disabled={!canManage || isBusy}
                            onClick={() => handleSaveFulfillment(order.id)}
                            className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                          >
                            Save status
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-3">
                          <div className="grid gap-2">
                            <input
                              disabled={!canManage || isBusy}
                              value={trackingDraft.courier}
                              onChange={(event) =>
                                setTrackingDrafts((current) => ({
                                  ...current,
                                  [order.id]: {
                                    ...trackingDraft,
                                    courier: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Courier e.g. Global Supplier / J&T / LBC"
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800"
                            />

                            <input
                              disabled={!canManage || isBusy}
                              value={trackingDraft.tracking_no}
                              onChange={(event) =>
                                setTrackingDrafts((current) => ({
                                  ...current,
                                  [order.id]: {
                                    ...trackingDraft,
                                    tracking_no: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Tracking number"
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800"
                            />

                            <select
                              disabled={!canManage || isBusy}
                              value={trackingDraft.shipment_status}
                              onChange={(event) =>
                                setTrackingDrafts((current) => ({
                                  ...current,
                                  [order.id]: {
                                    ...trackingDraft,
                                    shipment_status: event.target.value as SupplierShipmentStatus,
                                  },
                                }))
                              }
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:disabled:bg-slate-800"
                            >
                              {shipmentOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                            <p><strong>Current courier:</strong> {order.courier ?? '—'}</p>
                            <p className="mt-1"><strong>Current tracking:</strong> {order.tracking_no ?? '—'}</p>
                            <p className="mt-1"><strong>Shipment status:</strong> {(order.shipment_status ?? '—').replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            disabled={!canManage || isBusy}
                            onClick={() => handleSaveTracking(order.id)}
                            className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                          >
                            Save tracking
                          </button>

                          <div className="max-w-[220px] text-right text-xs text-slate-400 dark:text-slate-500">
                            {canManage
                              ? 'Use this after Global Supplier or your courier provides the tracking details.'
                              : 'Waiting for admin approval before supplier fulfillment can begin.'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
