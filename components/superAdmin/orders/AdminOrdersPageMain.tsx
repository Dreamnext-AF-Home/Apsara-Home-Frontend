'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import {
  AdminCourier,
  AdminShipmentStatus,
  useBookAdminOrderCourierMutation,
  useApproveAdminOrderMutation,
  useGetAdminOrdersQuery,
  useRejectAdminOrderMutation,
  useTrackAdminOrderCourierMutation,
  useUpdateAdminOrderShipmentStatusMutation,
} from '@/store/api/adminOrdersApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import AdminPagination from '@/components/superAdmin/AdminPagination'

/* ─── constants ────────────────────────────────────────────── */

const FILTER_LABELS: Record<string, string> = {
  all:               'All Orders',
  pending:           'Pending Approval',
  processing:        'Processing',
  paid:              'Paid',
  packed:            'Packed',
  shipped:           'Shipped',
  out_for_delivery:  'Out for Delivery',
  delivered:         'Delivered',
  cancelled:         'Cancelled',
  refunded:          'Refunded',
  returned_refunded: 'Returned / Refunded',
  failed_payments:   'Failed Payments',
  order_history:     'Order History',
  completed:         'Completed',
}

const SHIPMENT_STATUS_OPTIONS: Array<{ value: AdminShipmentStatus; label: string }> = [
  { value: 'for_pickup', label: 'For Pickup' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed_delivery', label: 'Failed Delivery' },
  { value: 'returned_to_sender', label: 'Returned to Sender' },
]

const COURIER_OPTIONS: Array<{ value: AdminCourier; label: string }> = [
  { value: 'jnt', label: 'J&T Express' },
  { value: 'xde', label: 'XDE' },
]

const APPROVAL_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  approved:        { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Approved'        },
  rejected:        { dot: 'bg-red-400',     badge: 'bg-red-50 text-red-700 border-red-200',             label: 'Rejected'        },
  pending_approval:{ dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Pending'         },
  paid:            { dot: 'bg-teal-400',    badge: 'bg-teal-50 text-teal-700 border-teal-200',          label: 'Paid'            },
  active:          { dot: 'bg-orange-400',  badge: 'bg-orange-50 text-orange-700 border-orange-200',    label: 'Active'          },
  pending:         { dot: 'bg-orange-400',  badge: 'bg-orange-50 text-orange-700 border-orange-200',    label: 'Pending'         },
}

const SLA_CONFIG = {
  overdue:   { badge: 'bg-red-50 text-red-700 border-red-200',       dot: 'bg-red-400',   label: 'Overdue'  },
  due_soon:  { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400', label: 'Due Soon' },
  on_track:  { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', label: 'On Track' },
}

/* ─── helpers ──────────────────────────────────────────────── */

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value || 0)

const formatDateTime = (value?: string | null) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(date)
}

const formatDuration = (minutes: number | null | undefined) => {
  if (minutes == null) return '-'
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hrs <= 0 ? `${mins}m` : `${hrs}h ${mins}m`
}

const getInitials = (name?: string | null) => {
  if (!name) return '?'
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

/* ─── stat card ────────────────────────────────────────────── */

function StatCard({ label, value, bg, text, border, icon }: {
  label: string; value: number; bg: string; text: string; border: string; icon: React.ReactNode
}) {
  return (
    <div className={`bg-white border ${border} rounded-2xl p-4 shadow-sm`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`h-9 w-9 rounded-xl ${bg} ${text} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <p className="text-[11px] text-slate-400 font-medium leading-tight">{label}</p>
      </div>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
  )
}

/* ─── main ─────────────────────────────────────────────────── */

interface Props { initialFilter?: string }

export default function AdminOrdersPageMain({ initialFilter = 'all' }: Props) {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [search,      setSearch]      = useState('')
  const [page,        setPage]        = useState(1)
  const [busyId,      setBusyId]      = useState<number | null>(null)
  const [courierByOrder, setCourierByOrder] = useState<Record<number, AdminCourier>>({})
  const [overdueFirst, setOverdueFirst] = useState(true)
  const [sortBy,      setSortBy]      = useState<'default' | 'customer_az' | 'amount_low_high'>('default')
  const [highlightedOrderId, setHighlightedOrderId] = useState<number | null>(null)

  const role       = (session?.user?.role ?? '').toLowerCase()
  const canApprove = role === 'super_admin' || role === 'admin' || role === 'merchant_admin'
  const canTrack   = canApprove || role === 'csr'

  const effectiveFilter = useMemo(() => {
    const normalized = initialFilter.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
    const aliases: Record<string, string> = {
      returned: 'refunded', returned_refunded: 'refunded', history: 'order_history',
      deliverd: 'delivered', outfordelivery: 'out_for_delivery',
    }
    const mapped = aliases[normalized] ?? normalized
    const supported = ['all','pending','processing','paid','packed','shipped','out_for_delivery','delivered','cancelled','refunded','returned_refunded','failed_payments','order_history','completed']
    return supported.includes(mapped) ? mapped : 'all'
  }, [initialFilter])

  const { data, isLoading, isError, isFetching } = useGetAdminOrdersQuery({
    filter: effectiveFilter, search: search.trim() || undefined, page, perPage: 20,
  })

  const [approveOrder] = useApproveAdminOrderMutation()
  const [rejectOrder]  = useRejectAdminOrderMutation()
  const [bookCourier] = useBookAdminOrderCourierMutation()
  const [trackCourier] = useTrackAdminOrderCourierMutation()
  const [updateShipmentStatus] = useUpdateAdminOrderShipmentStatusMutation()

  const visibleOrders = useMemo(() => {
    const list = [...(data?.orders ?? [])]
    return list.sort((a, b) => {
      if (overdueFirst) {
        const aOver = a.sla?.state === 'overdue' ? 1 : 0
        const bOver = b.sla?.state === 'overdue' ? 1 : 0
        if (aOver !== bOver) return bOver - aOver
        if (aOver === 1 && bOver === 1) {
          const aOverMin = a.sla?.overdue_minutes ?? 0
          const bOverMin = b.sla?.overdue_minutes ?? 0
          if (aOverMin !== bOverMin) return bOverMin - aOverMin
        }
      }
      if (sortBy === 'customer_az') {
        return (a.customer_name ?? '').trim().toLowerCase()
          .localeCompare((b.customer_name ?? '').trim().toLowerCase(), 'en', { sensitivity: 'base' })
      }
      if (sortBy === 'amount_low_high') return (a.amount ?? 0) - (b.amount ?? 0)
      return 0
    })
  }, [data?.orders, overdueFirst, sortBy])

  useEffect(() => {
    if (!data?.orders?.length) return

    setCourierByOrder((prev) => {
      const next = { ...prev }
      for (const order of data.orders) {
        const courier = ((order.courier ?? '').toLowerCase() === 'xde' ? 'xde' : 'jnt') as AdminCourier
        if (!next[order.id]) {
          next[order.id] = courier
        }
      }
      return next
    })
  }, [data?.orders])

  useEffect(() => {
    const raw = searchParams.get('highlightOrderId')
    if (!raw) {
      return
    }

    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) {
      return
    }

    setHighlightedOrderId(parsed)
    const timeout = window.setTimeout(() => setHighlightedOrderId(null), 8000)
    return () => window.clearTimeout(timeout)
  }, [searchParams])

  useEffect(() => {
    if (!highlightedOrderId) return

    const row = document.getElementById(`admin-order-row-${highlightedOrderId}`)
    if (!row) return
    row.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightedOrderId, visibleOrders])

  const handleApprove = async (id: number) => {
    setBusyId(id)
    try {
      await approveOrder({ id }).unwrap()
      showSuccessToast('Order approved successfully.')
    } catch (err: unknown) {
      showErrorToast((err as { data?: { message?: string } })?.data?.message || 'Failed to approve order.')
    } finally { setBusyId(null) }
  }

  const handleReject = async (id: number) => {
    setBusyId(id)
    try {
      await rejectOrder({ id }).unwrap()
      showSuccessToast('Order rejected successfully.')
    } catch (err: unknown) {
      showErrorToast((err as { data?: { message?: string } })?.data?.message || 'Failed to reject order.')
    } finally { setBusyId(null) }
  }

  const handleShipmentStatusChange = async (id: number, shipmentStatus: AdminShipmentStatus) => {
    setBusyId(id)
    try {
      await updateShipmentStatus({ id, shipment_status: shipmentStatus, courier: courierByOrder[id] ?? 'jnt' }).unwrap()
      showSuccessToast(`Shipment status updated to ${shipmentStatus.replace(/_/g, ' ')}.`)
    } catch (err: unknown) {
      showErrorToast((err as { data?: { message?: string } })?.data?.message || 'Failed to update shipment status.')
    } finally { setBusyId(null) }
  }

  const handleBookCourier = async (id: number) => {
    setBusyId(id)
    try {
      const courier = courierByOrder[id] ?? 'jnt'
      const result = await bookCourier({ id, courier }).unwrap()
      showSuccessToast(result.message || `${courier.toUpperCase()} shipment booked.`)
    } catch (err: unknown) {
      showErrorToast((err as { data?: { message?: string } })?.data?.message || 'Failed to book courier shipment.')
    } finally { setBusyId(null) }
  }

  const handleTrackCourier = async (id: number) => {
    setBusyId(id)
    try {
      const courier = courierByOrder[id] ?? 'jnt'
      const result = await trackCourier({ id, courier }).unwrap()
      showSuccessToast(result.shipment_status ? `Latest status: ${result.shipment_status.replace(/_/g, ' ')}` : 'Tracking refreshed.')
    } catch (err: unknown) {
      showErrorToast((err as { data?: { message?: string } })?.data?.message || 'Failed to refresh courier tracking.')
    } finally { setBusyId(null) }
  }

  const counts = data?.counts

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-xl font-bold text-slate-800">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track checkout orders and handle approval workflow</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border ${
            canApprove ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${canApprove ? 'bg-teal-500' : 'bg-slate-400'}`} />
            {role || 'staff'}
          </span>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow">
            <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      {counts && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <StatCard label="Total Orders"   value={counts.all}        bg="bg-slate-100"   text="text-slate-600"   border="border-slate-200"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          />
          <StatCard label="Pending"        value={counts.pending}    bg="bg-amber-50"    text="text-amber-600"   border="border-amber-100"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="Processing"     value={counts.processing} bg="bg-blue-50"     text="text-blue-600"    border="border-blue-100"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
          />
          <StatCard label="Cancelled"      value={counts.cancelled}  bg="bg-red-50"      text="text-red-500"     border="border-red-100"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="Completed"      value={counts.completed}  bg="bg-emerald-50"  text="text-emerald-600" border="border-emerald-100"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </motion.div>
      )}

      {/* ── Toolbar ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-3"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-50">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search checkout ID, customer, product…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 bg-slate-50 text-slate-700 placeholder-slate-400 transition"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition"
        >
          <option value="default">Sort: Default</option>
          <option value="customer_az">Customer A–Z</option>
          <option value="amount_low_high">Amount: Low to High</option>
        </select>

        {/* Overdue toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setOverdueFirst(v => !v)}
            className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${overdueFirst ? 'bg-teal-500' : 'bg-slate-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${overdueFirst ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-xs font-medium text-slate-600">Overdue first</span>
        </label>

        {/* Active filter pill */}
        <span className="text-xs text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full font-medium ml-auto">
          {FILTER_LABELS[effectiveFilter] ?? 'All Orders'}
        </span>
      </motion.div>

      {/* ── Error ── */}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Failed to load orders.
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden animate-pulse">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="h-4 w-28 bg-slate-100 rounded-lg" />
          </div>
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-slate-100 rounded" />
                  <div className="h-2.5 w-20 bg-slate-100 rounded" />
                </div>
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
                <div className="h-7 w-16 bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          {isFetching && (
            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-teal-400" />
            </div>
          )}

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Order Queue</h2>
              <span className="text-xs text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full font-medium">
                {visibleOrders.length} orders
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-240">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Checkout', 'Date', 'Customer', 'Product', 'Amount', 'Approval', 'SLA', 'Tracking', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {visibleOrders.length ? (
                    visibleOrders.map(order => {
                      const isBusy             = busyId === order.id
                      const canApproveThisOrder = canApprove && order.approval_status === 'pending_approval'
                      const canTrackThisOrder   = canTrack && order.approval_status === 'approved'
                      const approval = APPROVAL_CONFIG[order.approval_status] ?? APPROVAL_CONFIG.pending
                      const sla      = order.sla?.state ? SLA_CONFIG[order.sla.state as keyof typeof SLA_CONFIG] : null

                      return (
                        <tr
                          id={`admin-order-row-${order.id}`}
                          key={order.id}
                          className={`transition-colors ${
                            highlightedOrderId === order.id
                              ? 'bg-teal-50/80 ring-1 ring-inset ring-teal-200 animate-pulse'
                              : 'hover:bg-slate-50/70'
                          }`}
                        >
                          {/* Checkout */}
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-semibold text-slate-800">{order.checkout_id}</p>
                            <p className="text-xs text-slate-400 mt-0.5 capitalize">{order.payment_status}</p>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                            <p>{formatDateTime(order.created_at)}</p>
                            {order.paid_at && (
                              <p className="mt-0.5 text-slate-400">Paid: {formatDateTime(order.paid_at)}</p>
                            )}
                          </td>

                          {/* Customer */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {getInitials(order.customer_name)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{order.customer_name || 'N/A'}</p>
                                <p className="text-xs text-slate-400">{order.customer_email || ''}</p>
                              </div>
                            </div>
                          </td>

                          {/* Product */}
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-medium text-slate-700">{order.product_name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Qty: {order.quantity}</p>
                          </td>

                          {/* Amount */}
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-bold text-slate-800">{formatMoney(order.amount)}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{order.payment_method || '-'}</p>
                          </td>

                          {/* Approval badge */}
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${approval.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${approval.dot}`} />
                              {approval.label}
                            </span>
                          </td>

                          {/* SLA */}
                          <td className="px-4 py-3.5">
                            {sla ? (
                              <div className="space-y-1">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${sla.badge}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${sla.dot}`} />
                                  {sla.label}
                                </span>
                                {order.sla?.state === 'overdue' && (
                                  <p className="text-[11px] text-red-500">+{formatDuration(order.sla?.overdue_minutes)}</p>
                                )}
                                {order.sla?.state === 'due_soon' && (
                                  <p className="text-[11px] text-amber-600">Left: {formatDuration(order.sla?.remaining_minutes)}</p>
                                )}
                                {order.sla?.state === 'on_track' && (
                                  <p className="text-[11px] text-slate-400">Elapsed: {formatDuration(order.sla?.elapsed_minutes)}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300">No SLA</span>
                            )}
                          </td>

                          {/* Tracking select */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-1.5">
                              <select
                                disabled={isBusy || !canTrackThisOrder}
                                value={courierByOrder[order.id] ?? (((order.courier ?? '').toLowerCase() === 'xde' ? 'xde' : 'jnt') as AdminCourier)}
                                onChange={e => setCourierByOrder(prev => ({ ...prev, [order.id]: e.target.value as AdminCourier }))}
                                className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-50 transition"
                              >
                                {COURIER_OPTIONS.map(o => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                              <select
                                disabled={isBusy || !canTrackThisOrder}
                                value={(order.shipment_status as AdminShipmentStatus | undefined) ?? 'for_pickup'}
                                onChange={e => handleShipmentStatusChange(order.id, e.target.value as AdminShipmentStatus)}
                                className="text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-50 transition"
                              >
                                {SHIPMENT_STATUS_OPTIONS.map(o => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  disabled={isBusy || !canTrackThisOrder}
                                  onClick={() => handleBookCourier(order.id)}
                                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                  Book
                                </button>
                                <button
                                  disabled={isBusy || !canTrackThisOrder || !order.tracking_no}
                                  onClick={() => handleTrackCourier(order.id)}
                                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                  Track
                                </button>
                              </div>
                              {order.courier || order.tracking_no || order.shipment_status ? (
                                <div className="text-[11px] text-slate-500 leading-relaxed">
                                  {order.courier ? <p className="uppercase">Courier: {order.courier}</p> : null}
                                  {order.tracking_no ? <p className="font-semibold text-slate-700">Tracking: {order.tracking_no}</p> : null}
                                  {order.shipment_status ? <p className="capitalize">Shipment: {order.shipment_status.replace(/_/g, ' ')}</p> : null}
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-300">
                                  {order.approval_status === 'approved' ? 'No shipment info yet' : 'Awaiting approval'}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5">
                            {canApproveThisOrder ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  disabled={isBusy}
                                  onClick={() => handleApprove(order.id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                  Approve
                                </button>
                                <button
                                  disabled={isBusy}
                                  onClick={() => handleReject(order.id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                {order.approval_status === 'approved' ? 'Use Tracking' : 'No actions'}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-5 py-14 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="text-sm font-semibold text-slate-500">No orders found</p>
                          <p className="text-xs text-slate-400">Try adjusting your search or filter</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <AdminPagination
              currentPage={data?.meta?.current_page ?? 1}
              totalPages={data?.meta?.last_page ?? 1}
              from={data?.meta?.from}
              to={data?.meta?.to}
              totalRecords={data?.meta?.total ?? 0}
              onPageChange={setPage}
            />
          </div>
        </motion.div>
      )}
    </div>
  )
}
