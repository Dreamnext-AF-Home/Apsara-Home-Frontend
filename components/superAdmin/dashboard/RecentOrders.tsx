'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useGetAdminOrdersQuery, type AdminOrder } from '@/store/api/adminOrdersApi'

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  Completed: { bg: 'bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/30', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
  Pending: { bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-400' },
  Processing: { bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  Cancelled: { bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30', text: 'text-red-600 dark:text-red-300', dot: 'bg-red-500' },
  Unpaid: { bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-400' },
  default: { bg: 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700', text: 'text-gray-600 dark:text-gray-300', dot: 'bg-gray-400' },
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(value || 0)

const parseOrderDate = (value?: string | null) => {
  if (!value) return null
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const withTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(normalized) ? normalized : `${normalized}+08:00`
  const parsed = new Date(withTimezone)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatDateOnly = (value?: string | null) => {
  const date = parseOrderDate(value)
  if (!date) return 'N/A'

  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function avatarColor(name: string) {
  const colors = [
    'from-teal-400 to-teal-600',
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-rose-400 to-rose-600',
    'from-amber-400 to-amber-600',
    'from-indigo-400 to-indigo-600',
  ]
  return colors[name.charCodeAt(0) % colors.length]
}

const getOrderStatusLabel = (order: AdminOrder) => {
  const fulfillment = String(order.fulfillment_status ?? '').toLowerCase()
  const payment = String(order.payment_status ?? '').toLowerCase()
  const approval = String(order.approval_status ?? '').toLowerCase()

  if (['delivered'].includes(fulfillment)) return 'Completed'
  if (['cancelled', 'refunded'].includes(fulfillment)) return 'Cancelled'
  if (['unpaid', 'failed', 'void', 'expired'].includes(payment)) return 'Unpaid'
  if (approval === 'pending_approval' || ['pending'].includes(fulfillment)) return 'Pending'
  if (['processing', 'packed', 'shipped', 'out_for_delivery'].includes(fulfillment)) return 'Processing'
  if (payment === 'paid' || payment === 'succeeded' || payment === 'success') return 'Processing'
  return 'Pending'
}

const formatOrderId = (value?: string | null, fallbackId?: number) => {
  const raw = String(value ?? '').trim()
  if (raw) {
    return raw.startsWith('#') ? raw : `#${raw}`
  }
  return fallbackId ? `#ORD-${String(fallbackId).padStart(4, '0')}` : '#N/A'
}

const RecentOrders = () => {
  const { data, isLoading, isFetching, isError } = useGetAdminOrdersQuery({ page: 1, perPage: 6, filter: 'all' })
  const orders = data?.orders ?? []

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Recent Orders</h3>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            {isLoading ? 'Loading latest transactions...' : `Latest ${orders.length} transactions from the database`}
          </p>
        </div>
        <Link href="/admin/orders" className="text-xs font-semibold text-teal-500 hover:underline dark:text-teal-300">
          View all
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/60">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Customer</th>
              <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">Date</th>
              <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:table-cell">Method</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading &&
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" /></td>
                  <td className="hidden px-6 py-4 md:table-cell"><div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" /></td>
                  <td className="hidden px-6 py-4 sm:table-cell"><div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" /></td>
                  <td className="px-6 py-4"><div className="h-7 w-24 rounded-full bg-gray-200 dark:bg-gray-700" /></td>
                </tr>
              ))}

            {!isLoading && isError && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-red-500 dark:text-red-300">
                  Unable to load recent orders from the database.
                </td>
              </tr>
            )}

            {!isLoading && !isError && orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No orders were found in the database yet.
                </td>
              </tr>
            )}

            {!isLoading && !isError && orders.map((order, index) => {
              const customerName = order.customer_name?.trim() || 'Unknown Customer'
              const status = getOrderStatusLabel(order)
              const cfg = statusConfig[status] ?? statusConfig.default
              const orderDate = order.paid_at || order.created_at

              return (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/40"
                >
                  <td className="px-6 py-3.5">
                    <span className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-300">
                      {formatOrderId(order.checkout_id, order.id)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${avatarColor(customerName)}`}>
                        <span className="text-[10px] font-bold text-white">{customerName[0]?.toUpperCase() ?? '?'}</span>
                      </div>
                      <span className="whitespace-nowrap text-xs font-medium text-gray-700 dark:text-gray-200">{customerName}</span>
                    </div>
                  </td>
                  <td className="hidden px-6 py-3.5 md:table-cell">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDateOnly(orderDate)}</span>
                  </td>
                  <td className="hidden px-6 py-3.5 sm:table-cell">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{order.payment_method || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">{formatMoney(Number(order.amount ?? 0))}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
                      {status}
                    </span>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {isFetching && !isLoading && (
        <div className="border-t border-gray-200 px-6 py-2 text-right text-[11px] text-gray-400 dark:border-gray-700 dark:text-gray-500">
          Refreshing live order data...
        </div>
      )}
    </div>
  )
}

export default RecentOrders
