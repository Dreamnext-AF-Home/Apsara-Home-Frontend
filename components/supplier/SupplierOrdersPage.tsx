'use client'

import { useEffect, useMemo, useState } from 'react'
import { useGetSupplierOrdersQuery } from '@/store/api/supplierOrdersApi'

const statConfig = [
  { key: 'total', label: 'Total Orders', icon: 'clipboard', accent: 'text-slate-500', ring: 'bg-slate-100 border-slate-200' },
  { key: 'toPay', label: 'To Pay', icon: 'clock', accent: 'text-amber-600', ring: 'bg-amber-50 border-amber-200' },
  { key: 'toShip', label: 'To Ship', icon: 'sync', accent: 'text-blue-600', ring: 'bg-blue-50 border-blue-200' },
  { key: 'toReceive', label: 'To Receive', icon: 'box', accent: 'text-indigo-600', ring: 'bg-indigo-50 border-indigo-200' },
  { key: 'completed', label: 'Completed', icon: 'check', accent: 'text-emerald-600', ring: 'bg-emerald-50 border-emerald-200' },
  { key: 'cancelled', label: 'Cancelled', icon: 'x', accent: 'text-rose-600', ring: 'bg-rose-50 border-rose-200' },
  { key: 'return', label: 'Return', icon: 'undo', accent: 'text-teal-600', ring: 'bg-teal-50 border-teal-200' },
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

const getSupplierStatusLabel = (order: { payment_status?: string | null; fulfillment_status?: string | null }) => {
  const payment = String(order.payment_status ?? '').toLowerCase()
  const fulfillment = String(order.fulfillment_status ?? '').toLowerCase()

  if (['pending', 'unpaid', 'failed'].includes(payment)) return 'To Pay'
  if (['processing', 'packed'].includes(fulfillment)) return 'To Ship'
  if (['shipped', 'out_for_delivery'].includes(fulfillment)) return 'To Receive'
  if (['delivered'].includes(fulfillment)) return 'Completed'
  if (['cancelled', 'refunded'].includes(fulfillment)) return 'Cancelled'
  if (['returned_refunded', 'return'].includes(fulfillment)) return 'Return'

  return 'Pending'
}

export default function SupplierOrdersPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('to_pay')
  const [userSelectedFilter, setUserSelectedFilter] = useState(false)
  const [sortBy, setSortBy] = useState('default')
  const [overdueFirst, setOverdueFirst] = useState(true)
  const { data, isLoading, isError } = useGetSupplierOrdersQuery({
    filter,
    search: search.trim() || undefined,
    page: 1,
    perPage: 20,
  })

  const orders = useMemo(() => data?.orders ?? [], [data?.orders])

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

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {statConfig.map((stat) => (
            <div key={stat.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${stat.ring}`}>
                  <StatIcon name={stat.icon} className={`h-5 w-5 ${stat.accent}`} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{stat.label}</p>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{counts[stat.key as keyof typeof counts]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search checkout ID, customer, product..."
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filter}
              onChange={(event) => {
                setUserSelectedFilter(true)
                setFilter(event.target.value)
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm"
            >
              <option value="to_pay">To Pay</option>
              <option value="to_ship">To Ship</option>
              <option value="to_receive">To Receive</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="return">Return</option>
              <option value="all">All Orders</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm"
            >
              <option value="default">Sort: Default</option>
              <option value="latest">Latest</option>
              <option value="amount_low_high">Amount: Low to High</option>
              <option value="amount_high_low">Amount: High to Low</option>
            </select>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Overdue first</span>
              <button
                type="button"
                onClick={() => setOverdueFirst((prev) => !prev)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${overdueFirst ? 'bg-teal-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${overdueFirst ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </label>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
              {orders.length} orders
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-0 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Order Queue</h2>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
            {orders.length} orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3">Checkout</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Approval</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">SLA</th>
                <th className="px-6 py-3">Tracking</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-sm text-slate-500">
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
                  <td colSpan={9} className="px-6 py-16 text-center text-sm text-slate-500">
                    No orders yet. New supplier orders will appear here once customers start checking out.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{order.checkout_id || `#${order.id}`}</p>
                      <p className="text-xs text-slate-400">{order.payment_method ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{order.customer_name ?? 'Customer'}</p>
                      <p className="text-xs text-slate-400">{order.customer_email ?? ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{order.product_name}</p>
                      <p className="text-xs text-slate-400">Qty: {order.quantity}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      ₱{Number(order.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {order.approval_status ?? 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        {getSupplierStatusLabel(order)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {order.fulfillment_status ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {order.courier ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                        Use Tracking
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
