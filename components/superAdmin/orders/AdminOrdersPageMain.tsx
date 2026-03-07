'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import {
  AdminFulfillmentStatus,
  useApproveAdminOrderMutation,
  useGetAdminOrdersQuery,
  useRejectAdminOrderMutation,
  useUpdateAdminOrderStatusMutation,
} from '@/store/api/adminOrdersApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'

const FILTER_LABELS: Record<string, string> = {
  all: 'All Orders',
  pending: 'Pending Approval',
  processing: 'Processing',
  paid: 'Paid',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  returned_refunded: 'Returned / Refunded',
  failed_payments: 'Failed Payments',
  order_history: 'Order History',
  completed: 'Completed',
}

const STATUS_OPTIONS: Array<{ value: AdminFulfillmentStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'rejected':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'pending_approval':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'paid':
      return 'bg-teal-50 text-teal-700 border-teal-200'
    case 'active':
    case 'pending':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(value || 0)

const formatDateTime = (value?: string | null) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const formatDuration = (minutes: number | null | undefined) => {
  if (minutes == null) return '-'
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hrs <= 0) return `${mins}m`
  return `${hrs}h ${mins}m`
}

interface Props {
  initialFilter?: string
}

export default function AdminOrdersPageMain({ initialFilter = 'all' }: Props) {
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [overdueFirst, setOverdueFirst] = useState(true)
  const [sortBy, setSortBy] = useState<'default' | 'customer_az' | 'amount_low_high'>('default')
  const role = (session?.user?.role ?? '').toLowerCase()
  const canApprove = role === 'super_admin' || role === 'admin'
  const canTrack = canApprove || role === 'csr'

  const effectiveFilter = useMemo(() => {
    const normalized = initialFilter
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')

    const aliases: Record<string, string> = {
      returned: 'refunded',
      returned_refunded: 'refunded',
      history: 'order_history',
      deliverd: 'delivered',
      outfordelivery: 'out_for_delivery',
    }

    const mapped = aliases[normalized] ?? normalized
    const supported = ['all', 'pending', 'processing', 'paid', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded', 'returned_refunded', 'failed_payments', 'order_history', 'completed']
    return supported.includes(mapped) ? mapped : 'all'
  }, [initialFilter])

  const { data, isLoading, isError, isFetching } = useGetAdminOrdersQuery({
    filter: effectiveFilter,
    search: search.trim() || undefined,
    page,
    perPage: 20,
  })

  const [approveOrder] = useApproveAdminOrderMutation()
  const [rejectOrder] = useRejectAdminOrderMutation()
  const [updateStatus] = useUpdateAdminOrderStatusMutation()

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
        const aName = (a.customer_name ?? '').trim().toLowerCase()
        const bName = (b.customer_name ?? '').trim().toLowerCase()
        return aName.localeCompare(bName, 'en', { sensitivity: 'base' })
      }

      if (sortBy === 'amount_low_high') {
        return (a.amount ?? 0) - (b.amount ?? 0)
      }

      return 0
    })
  }, [data?.orders, overdueFirst, sortBy])

  const handleApprove = async (id: number) => {
    setBusyId(id)
    try {
      await approveOrder({ id }).unwrap()
      showSuccessToast('Order approved successfully.')
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to approve order.')
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (id: number) => {
    setBusyId(id)
    try {
      await rejectOrder({ id }).unwrap()
      showSuccessToast('Order rejected successfully.')
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to reject order.')
    } finally {
      setBusyId(null)
    }
  }

  const handleStatusChange = async (id: number, status: AdminFulfillmentStatus) => {
    setBusyId(id)
    try {
      await updateStatus({ id, status }).unwrap()
      showSuccessToast(`Order status updated to ${status.replace(/_/g, ' ')}.`)
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to update order status.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track checkout orders and handle approval workflow.</p>
        </div>
      </motion.div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search checkout id, customer, product..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
          />
          <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-slate-500">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'default' | 'customer_az' | 'amount_low_high')}
              className="px-2.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white"
            >
              <option value="default">Sort: Default</option>
              <option value="customer_az">Sort: Customer (A-Z)</option>
              <option value="amount_low_high">Sort: Amount (Low to High)</option>
            </select>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={overdueFirst}
                onChange={(e) => setOverdueFirst(e.target.checked)}
                className="accent-teal-600"
              />
              <span>Overdue first</span>
            </label>
            <span className="mx-2">•</span>
            <span>{FILTER_LABELS[effectiveFilter] ?? 'All Orders'}</span>
          </div>
        </div>

        {data?.counts ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              ['all', data.counts.all],
              ['pending', data.counts.pending],
              ['processing', data.counts.processing],
              ['cancelled', data.counts.cancelled],
              ['completed', data.counts.completed],
            ].map(([key, value]) => (
              <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{FILTER_LABELS[key]}</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
          Role: <span className="font-semibold">{role || 'staff'}</span>
          {!canApprove ? ' • Approval actions are disabled for this role.' : ''}
          {!canTrack ? ' • Fulfillment tracking is disabled for this role.' : ''}
        </div>
      </div>

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to load orders.
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 animate-pulse">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded bg-slate-100" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {isFetching ? (
            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-teal-500" />
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-4 py-3 font-semibold">Checkout</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Approval</th>
                    <th className="px-4 py-3 font-semibold">SLA</th>
                    <th className="px-4 py-3 font-semibold">Tracking</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders?.length ? (
                    visibleOrders.map((order) => {
                      const isBusy = busyId === order.id
                      const canApproveThisOrder = canApprove && order.approval_status === 'pending_approval'
                      const canTrackThisOrder = canTrack && order.approval_status === 'approved'

                      return (
                        <tr key={order.id} className="border-b border-slate-50 last:border-b-0">
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-slate-800">{order.checkout_id}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{order.payment_status}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-800">{formatDateTime(order.created_at)}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Paid: {formatDateTime(order.paid_at)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-800">{order.customer_name || 'N/A'}</p>
                            <p className="text-xs text-slate-500">{order.customer_email || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-800">{order.product_name}</p>
                            <p className="text-xs text-slate-500">Qty: {order.quantity}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-bold text-slate-800">{formatMoney(order.amount)}</p>
                            <p className="text-xs text-slate-500">{order.payment_method || '-'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 rounded-full border text-xs font-semibold ${statusBadgeClass(order.approval_status)}`}>
                              {order.approval_status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {order.sla?.state === 'overdue' ? (
                              <div className="space-y-1">
                                <span className="inline-flex px-2 py-1 rounded-full border text-xs font-semibold bg-red-50 text-red-700 border-red-200">
                                  Overdue
                                </span>
                                <p className="text-[11px] text-red-600">+{formatDuration(order.sla?.overdue_minutes)}</p>
                              </div>
                            ) : order.sla?.state === 'due_soon' ? (
                              <div className="space-y-1">
                                <span className="inline-flex px-2 py-1 rounded-full border text-xs font-semibold bg-amber-50 text-amber-700 border-amber-200">
                                  Due Soon
                                </span>
                                <p className="text-[11px] text-amber-700">Left: {formatDuration(order.sla?.remaining_minutes)}</p>
                              </div>
                            ) : order.sla?.state === 'on_track' ? (
                              <div className="space-y-1">
                                <span className="inline-flex px-2 py-1 rounded-full border text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                                  On Track
                                </span>
                                <p className="text-[11px] text-slate-500">Elapsed: {formatDuration(order.sla?.elapsed_minutes)}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">No SLA</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              disabled={isBusy || !canTrackThisOrder}
                              value={order.fulfillment_status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as AdminFulfillmentStatus)}
                              className="px-2.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white disabled:opacity-50"
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                disabled={isBusy || !canApproveThisOrder}
                                onClick={() => handleApprove(order.id)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                disabled={isBusy || !canApproveThisOrder}
                                onClick={() => handleReject(order.id)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                        No orders found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-slate-500">
              Showing {data?.meta?.from ?? 0} - {data?.meta?.to ?? 0} of {data?.meta?.total ?? 0}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={(data?.meta?.current_page ?? 1) <= 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs text-slate-600">
                Page {data?.meta?.current_page ?? 1} / {data?.meta?.last_page ?? 1}
              </span>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={(data?.meta?.current_page ?? 1) >= (data?.meta?.last_page ?? 1)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
