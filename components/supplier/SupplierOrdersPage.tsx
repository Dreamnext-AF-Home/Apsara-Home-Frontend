'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import {
  type SupplierFulfillmentStatus,
  type SupplierOrdersResponse,
  type SupplierShipmentStatus,
  useApproveSupplierOrderMutation,
  useGetSupplierOrdersQuery,
  usePushSupplierOrderToZqMutation,
  useUpdateSupplierOrderFulfillmentMutation,
  useUpdateSupplierOrderTrackingMutation,
} from '@/store/api/supplierOrdersApi'

/* ── constants ─────────────────────────────────────────── */

const STAT_CONFIG = [
  { key: 'total',     filterVal: 'all',        label: 'Total',     color: 'text-slate-600 dark:text-slate-300' },
  { key: 'toPay',     filterVal: 'to_pay',     label: 'To Pay',    color: 'text-amber-600 dark:text-amber-400' },
  { key: 'toShip',    filterVal: 'to_ship',    label: 'To Ship',   color: 'text-blue-600 dark:text-blue-400'   },
  { key: 'toReceive', filterVal: 'to_receive', label: 'Receiving', color: 'text-indigo-600 dark:text-indigo-400' },
  { key: 'completed', filterVal: 'completed',  label: 'Completed', color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'cancelled', filterVal: 'cancelled',  label: 'Cancelled', color: 'text-rose-600 dark:text-rose-400'   },
  { key: 'return',    filterVal: 'return',     label: 'Return',    color: 'text-orange-600 dark:text-orange-400' },
] as const

const FULFILLMENT_OPTIONS: Array<{ value: SupplierFulfillmentStatus; label: string }> = [
  { value: 'processing',       label: 'Processing'       },
  { value: 'packed',           label: 'Packed'           },
  { value: 'shipped',          label: 'Shipped'          },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered',        label: 'Delivered'        },
  { value: 'cancelled',        label: 'Cancelled'        },
  { value: 'returned',         label: 'Returned'         },
]

const SHIPMENT_OPTIONS: Array<{ value: SupplierShipmentStatus; label: string }> = [
  { value: 'for_pickup',        label: 'For Pickup'         },
  { value: 'picked_up',         label: 'Picked Up'          },
  { value: 'in_transit',        label: 'In Transit'         },
  { value: 'out_for_delivery',  label: 'Out for Delivery'   },
  { value: 'delivered',         label: 'Delivered'          },
  { value: 'failed_delivery',   label: 'Failed Delivery'    },
  { value: 'cancelled',         label: 'Cancelled'          },
  { value: 'returned_to_sender',label: 'Returned to Sender' },
]

const APPROVAL_BADGE: Record<string, string> = {
  approved:         'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25',
  pending_approval: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25',
  rejected:         'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/25',
}

const FULFILLMENT_BADGE: Record<string, string> = {
  pending:          'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  processing:       'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  packed:           'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  shipped:          'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300',
  out_for_delivery: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  delivered:        'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  cancelled:        'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  returned:         'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
}

/* ── helpers ───────────────────────────────────────────── */

function formatMoney(v: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(v || 0)
}

function parseDate(v?: string | null) {
  if (!v) return null
  const s = v.trim().replace(' ', 'T')
  const d = new Date(/([zZ]|[+-]\d{2}:\d{2})$/.test(s) ? s : `${s}+08:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function fmtDate(v?: string | null) {
  const d = parseDate(v)
  return d ? d.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}

function fmtTime(v?: string | null) {
  const d = parseDate(v)
  return d ? d.toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }) : ''
}

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

function isNew(v?: string | null) {
  const d = parseDate(v)
  return d ? Date.now() - d.getTime() < 86_400_000 : false
}

function getApiError(err: unknown, fallback: string) {
  return (err as { data?: { message?: string } })?.data?.message || fallback
}

function SpinIcon() {
  return (
    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
    </svg>
  )
}

/* ── types ─────────────────────────────────────────────── */

type TrackingDraft = { courier: string; tracking_no: string; shipment_status: SupplierShipmentStatus }

/* ── component ─────────────────────────────────────────── */

export default function SupplierOrdersPage({ initialData }: { initialData?: SupplierOrdersResponse }) {
  const [search, setSearch]               = useState('')
  const [filter, setFilter]               = useState('all')
  const [, setUserPicked]                 = useState(false)
  const [busyId, setBusyId]               = useState<number | null>(null)
  const [fulfillDrafts, setFulfillDrafts] = useState<Record<number, SupplierFulfillmentStatus>>({})
  const [trackDrafts, setTrackDrafts]     = useState<Record<number, TrackingDraft>>({})

  const scrollRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0 })
  const [dragging, setDragging] = useState(false)

  const { data, isLoading, isError } = useGetSupplierOrdersQuery(
    { filter, search: search.trim() || undefined, page: 1, perPage: 20 },
    { skip: false },
  )

  const [updateFulfillment] = useUpdateSupplierOrderFulfillmentMutation()
  const [updateTracking]    = useUpdateSupplierOrderTrackingMutation()
  const [approveOrder]      = useApproveSupplierOrderMutation()
  const [pushToZq]          = usePushSupplierOrderToZqMutation()

  const effectiveData = data ?? initialData ?? null
  const orders = useMemo(() => effectiveData?.orders ?? [], [effectiveData])

  useEffect(() => {
    if (!orders.length) return
    setFulfillDrafts(cur => {
      const next = { ...cur }
      for (const o of orders) next[o.id] = (o.fulfillment_status as SupplierFulfillmentStatus) || 'processing'
      return next
    })
    setTrackDrafts(cur => {
      const next = { ...cur }
      for (const o of orders) {
        if (!next[o.id]) next[o.id] = { courier: o.courier ?? '', tracking_no: o.tracking_no ?? '', shipment_status: (o.shipment_status as SupplierShipmentStatus) || 'in_transit' }
      }
      return next
    })
  }, [orders])

  const counts = useMemo(() => ({
    total:     effectiveData?.counts?.total      ?? orders.length,
    toPay:     effectiveData?.counts?.to_pay     ?? 0,
    toShip:    effectiveData?.counts?.to_ship    ?? 0,
    toReceive: effectiveData?.counts?.to_receive ?? 0,
    completed: effectiveData?.counts?.completed  ?? 0,
    cancelled: effectiveData?.counts?.cancelled  ?? 0,
    return:    effectiveData?.counts?.return     ?? 0,
  }), [effectiveData, orders.length])

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button,input,select,a')) return
    const el = scrollRef.current; if (!el) return
    dragState.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft }
    setDragging(true)
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragState.current.active) return
    e.preventDefault()
    const el = scrollRef.current; if (!el) return
    el.scrollLeft = dragState.current.scrollLeft - (e.pageX - el.offsetLeft - dragState.current.startX) * 1.2
  }
  const stopDrag = () => { dragState.current.active = false; setDragging(false) }

  async function handleApprove(id: number) {
    setBusyId(id)
    try {
      const r = await approveOrder({ id }).unwrap()
      showSuccessToast(r.message || 'Order approved.')
    } catch (e) { showErrorToast(getApiError(e, 'Failed to approve order.')) }
    finally { setBusyId(null) }
  }

  async function handlePushToZq(id: number) {
    setBusyId(id)
    try {
      const r = await pushToZq({ id }).unwrap()
      showSuccessToast(r.message || 'Order pushed to ZQ.')
    } catch (e) { showErrorToast(getApiError(e, 'Failed to push order to ZQ.')) }
    finally { setBusyId(null) }
  }

  async function saveFulfillment(id: number) {
    const fulfillment_status = fulfillDrafts[id]; if (!fulfillment_status) return
    setBusyId(id)
    try {
      const r = await updateFulfillment({ id, fulfillment_status }).unwrap()
      showSuccessToast(r.message || 'Fulfillment updated.')
    } catch (e) { showErrorToast(getApiError(e, 'Failed to update fulfillment.')) }
    finally { setBusyId(null) }
  }

  async function saveTracking(id: number) {
    const d = trackDrafts[id]
    if (!d?.tracking_no.trim()) { showErrorToast('Tracking number is required.'); return }
    setBusyId(id)
    try {
      const r = await updateTracking({ id, courier: d.courier.trim() || 'zq', tracking_no: d.tracking_no.trim(), shipment_status: d.shipment_status }).unwrap()
      showSuccessToast(r.message || 'Tracking updated.')
    } catch (e) { showErrorToast(getApiError(e, 'Failed to update tracking.')) }
    finally { setBusyId(null) }
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">AF HOME GLOBAL SUPPLIER WORKSPACE</p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Order Fulfillment</h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-2.5 text-xs dark:border-cyan-500/20 dark:bg-cyan-500/10">
          <svg className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>
          <span className="font-medium text-cyan-800 dark:text-cyan-200">Approve → Push to ZQ → Update tracking</span>
        </div>
      </div>

      {/* ── Stat tabs ── */}
      <div className="flex flex-wrap gap-2">
        {STAT_CONFIG.map(stat => (
          <button
            key={stat.key}
            type="button"
            onClick={() => { setUserPicked(true); setFilter(stat.filterVal) }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              filter === stat.filterVal
                ? 'border-cyan-300 bg-cyan-50 text-cyan-700 shadow-sm dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-300'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600'
            }`}
          >
            <span className={`text-base font-bold ${stat.color}`}>{counts[stat.key as keyof typeof counts]}</span>
            <span>{stat.label}</span>
          </button>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 dark:border-slate-700 dark:bg-slate-800/60">
            <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search checkout ID, customer, product…"
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
          <select
            value={filter}
            onChange={e => { setUserPicked(true); setFilter(e.target.value) }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">All Orders</option>
            <option value="to_pay">To Pay</option>
            <option value="to_ship">To Ship</option>
            <option value="to_receive">To Receive</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="return">Return</option>
          </select>
          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            {orders.length} orders
          </span>
        </div>

        {/* Table */}
        <div
          ref={scrollRef}
          className={`overflow-x-auto ${dragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
        >
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/30">
                <th className="min-w-52 px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Product</th>
                <th className="min-w-36 px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Checkout</th>
                <th className="min-w-32 px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Date</th>
                <th className="min-w-56 px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Customer / Delivery</th>
                <th className="min-w-28 px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Amount</th>
                <th className="min-w-32 px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Approval</th>
                <th className="min-w-52 px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tracking</th>
                <th className="min-w-44 px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Status</th>
              </tr>
            </thead>

            <tbody>
              {isLoading && !initialData ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <svg className="h-4 w-4 animate-spin text-cyan-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                      </svg>
                      <span className="text-sm">Loading orders…</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-sm text-rose-500 dark:text-rose-400">Failed to load orders.</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-sm text-slate-400 dark:text-slate-500">
                    No orders found. ZQ orders will appear here after customers check out.
                  </td>
                </tr>
              ) : orders.map((order, idx) => {
                const busy      = busyId === order.id
                const canManage = order.approval_status === 'approved'
                const td        = trackDrafts[order.id] ?? { courier: '', tracking_no: '', shipment_status: 'in_transit' as SupplierShipmentStatus }
                const approvalStatus = order.approval_status ?? 'pending_approval'
                const fulfillStatus  = order.fulfillment_status ?? 'pending'
                const newOrder = isNew(order.created_at)

                return (
                  <tr
                    key={order.id}
                    className={`group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-900/60'}`}
                  >

                    {/* ── Product ── */}
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                          {order.product_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={order.product_image} alt={order.product_name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <svg className="h-5 w-5 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <div className="flex items-center gap-1.5">
                            {newOrder && (
                              <span className="shrink-0 rounded-full bg-cyan-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">NEW</span>
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800 dark:text-slate-100">{order.product_name}</p>
                          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Qty {order.quantity}</p>
                        </div>
                      </div>
                    </td>

                    {/* ── Checkout ── */}
                    <td className="px-5 py-4 align-top">
                      <p className="font-mono text-[12px] font-semibold text-slate-800 dark:text-slate-100">{order.checkout_id || `#${order.id}`}</p>
                      <div className="mt-1.5 space-y-1">
                        <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {order.payment_status ?? '—'}
                        </span>
                        {order.payment_method && (
                          <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{order.payment_method}</p>
                        )}
                      </div>
                    </td>

                    {/* ── Date ── */}
                    <td className="whitespace-nowrap px-5 py-4 align-top">
                      <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{fmtDate(order.created_at)}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{fmtTime(order.created_at)}</p>
                      {order.paid_at && (
                        <p className="mt-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Paid · {fmtDate(order.paid_at)}</p>
                      )}
                    </td>

                    {/* ── Customer / Delivery ── */}
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-teal-400 to-cyan-600 text-[10px] font-bold text-white shadow-sm">
                          {getInitials(order.customer_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-[13px] font-semibold text-slate-800 dark:text-slate-100">{order.customer_name || '—'}</p>
                          <p className="line-clamp-1 text-[11px] text-slate-400 dark:text-slate-500">{order.customer_email || '—'}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">{order.customer_phone || '—'}</p>
                        </div>
                      </div>
                      {order.customer_address && (
                        <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700/60 dark:bg-slate-800/40">
                          <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Delivery Address</p>
                          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">{order.customer_address}</p>
                        </div>
                      )}
                    </td>

                    {/* ── Amount ── */}
                    <td className="px-5 py-4 align-top">
                      <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{formatMoney(order.amount)}</p>
                    </td>

                    {/* ── Approval ── */}
                    <td className="px-5 py-4 align-top">
                      <div className="space-y-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${APPROVAL_BADGE[approvalStatus] ?? APPROVAL_BADGE.pending_approval}`}>
                          {approvalStatus === 'approved' ? 'Approved' : approvalStatus === 'rejected' ? 'Rejected' : 'Pending'}
                        </span>
                        {order.approval_notes && (
                          <p className="max-w-36 text-[11px] leading-4 text-slate-400 dark:text-slate-500">{order.approval_notes}</p>
                        )}
                        {approvalStatus !== 'approved' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleApprove(order.id)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {busy ? <SpinIcon /> : <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7"/></svg>}
                            Approve
                          </button>
                        )}
                        {approvalStatus === 'approved' && !order.zq_platform_order_id && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handlePushToZq(order.id)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {busy ? <SpinIcon /> : <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 19V5M5 12l7-7 7 7"/></svg>}
                            Push to ZQ
                          </button>
                        )}
                        {approvalStatus !== 'approved' && (
                          <p className="text-[10px] leading-4 text-slate-400 dark:text-slate-500">Approve first before fulfillment actions.</p>
                        )}
                      </div>
                    </td>

                    {/* ── Tracking ── */}
                    <td className="px-5 py-4 align-top">
                      <div className="space-y-2">
                        {/* ZQ Global flow card */}
                        <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 dark:border-violet-500/25 dark:bg-violet-500/8">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-700 dark:text-violet-300">Global Supplier Flow</p>
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${order.zq_platform_order_id ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300'}`}>
                              {order.zq_platform_order_id ? 'Pushed' : 'Not sent'}
                            </span>
                          </div>
                          {order.zq_platform_order_id ? (
                            <p className="mt-1 font-mono text-[10px] text-violet-600 dark:text-violet-400">ID: {order.zq_platform_order_id}</p>
                          ) : (
                            <p className="mt-1 text-[11px] leading-relaxed text-violet-600 dark:text-violet-400">
                              {canManage ? 'Enter tracking number from ZQ after they ship.' : 'Approve the order first before updating tracking.'}
                            </p>
                          )}
                        </div>

                        {/* Tracking input */}
                        <input
                          disabled={!canManage || busy}
                          value={td.tracking_no}
                          onChange={e => setTrackDrafts(cur => ({ ...cur, [order.id]: { ...td, tracking_no: e.target.value } }))}
                          placeholder="Tracking number from ZQ"
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-600 dark:disabled:bg-slate-800/50"
                        />
                        <select
                          disabled={!canManage || busy}
                          value={td.shipment_status}
                          onChange={e => setTrackDrafts(cur => ({ ...cur, [order.id]: { ...td, shipment_status: e.target.value as SupplierShipmentStatus } }))}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-violet-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500"
                        >
                          {SHIPMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <button
                          type="button"
                          disabled={!canManage || busy}
                          onClick={() => saveTracking(order.id)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:bg-violet-500 dark:hover:bg-violet-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
                        >
                          {busy ? <SpinIcon /> : <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
                          Save Tracking
                        </button>

                        {order.tracking_no && (
                          <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 dark:border-teal-500/25 dark:bg-teal-500/8">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">Tracking Number</p>
                            <p className="mt-0.5 break-all font-mono text-[12px] font-bold text-slate-900 dark:text-white">{order.tracking_no}</p>
                            {order.shipment_status && (
                              <p className="mt-0.5 capitalize text-[10px] text-teal-600 dark:text-teal-400">{order.shipment_status.replace(/_/g, ' ')}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* ── Supplier Status ── */}
                    <td className="px-5 py-4 align-top">
                      <div className="space-y-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${FULFILLMENT_BADGE[fulfillStatus] ?? FULFILLMENT_BADGE.pending}`}>
                          {fulfillStatus.replace(/_/g, ' ')}
                        </span>
                        <select
                          disabled={!canManage || busy}
                          value={fulfillDrafts[order.id] ?? 'processing'}
                          onChange={e => setFulfillDrafts(cur => ({ ...cur, [order.id]: e.target.value as SupplierFulfillmentStatus }))}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-cyan-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500"
                        >
                          {FULFILLMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <button
                          type="button"
                          disabled={!canManage || busy}
                          onClick={() => saveFulfillment(order.id)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                        >
                          {busy ? <SpinIcon /> : <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7"/></svg>}
                          Save Status
                        </button>
                        {!canManage && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">Approve order first.</p>
                        )}
                      </div>
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
