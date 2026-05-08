'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useGetAdminPaymentsOverviewQuery } from '@/store/api/adminPaymentsApi'
import { useGetAdminAffiliateVouchersQuery } from '@/store/api/encashmentApi'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value || 0)

const formatDateTime = (value?: string | null) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const getStatusStyles = (status: string) => {
  const normalized = String(status).toLowerCase()
  if (normalized === 'active') return { badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-400' }
  if (normalized === 'redeemed') return { badge: 'border-sky-200 bg-sky-50 text-sky-700', dot: 'bg-sky-400' }
  if (normalized === 'expired') return { badge: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-400' }
  return { badge: 'border-slate-200 bg-slate-50 text-slate-600', dot: 'bg-slate-400' }
}

const colorGradients = [
  'from-orange-400 to-orange-600',
  'from-emerald-400 to-emerald-600',
  'from-red-400 to-red-600',
  'from-purple-500 to-purple-700',
  'from-blue-500 to-blue-700',
  'from-teal-400 to-teal-600',
]

const getGradientColor = (id: number | string) => {
  const index = String(id).charCodeAt(0) % colorGradients.length
  return colorGradients[index]
}

export default function PaymentsVouchersPageMain() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'redeemed' | 'expired'>('all')
  const [page, setPage] = useState(1)

  const { data: vouchersData, isLoading: vouchersLoading, isFetching: vouchersFetching, isError: vouchersError } =
    useGetAdminAffiliateVouchersQuery({
      page,
      per_page: 12,
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: search.trim() || undefined,
    })

  // Keep existing query (payments overview) for parity if it is used elsewhere.
  // But this page only renders vouchers, so we don't depend on paymentsData.
  const { isLoading: paymentsLoading, isFetching: paymentsFetching, isError: paymentsError } =
    useGetAdminPaymentsOverviewQuery()

  const isLoading = paymentsLoading || vouchersLoading
  const isFetching = paymentsFetching || vouchersFetching
  const isError = paymentsError || vouchersError

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900"
      >
        <div className="relative p-5 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-semibold text-sky-700 uppercase tracking-wide">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-600" />
                Admin • Vouchers
              </div>
              <p className="mt-2 text-base font-bold text-gray-900 dark:text-white">
                VOUCHER
              </p>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Share these codes to give discounts or rewards.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-semibold whitespace-nowrap">
              📊 <span>{vouchersData?.meta?.total ?? 0} total – {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {isFetching ? <div className="google-loading-bar" /> : null}

      {isError ? (
        <div className="rounded-2xl border border-red-200/70 bg-red-50/80 dark:border-red-900/40 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          Failed to load vouchers.
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            className="rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                {/* Search */}
                <div className="relative flex-1 sm:max-w-sm">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Search code, username, or email..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200/80 dark:border-gray-800 rounded-lg bg-gray-50/80 dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 dark:focus:ring-orange-400/20 dark:focus:border-orange-400/50 transition"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any)
                      setPage(1)
                    }}
                    className="rounded-lg border border-gray-200/80 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/70 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 dark:focus:ring-orange-400/20 dark:focus:border-orange-400/50"
                  >
                    <option value="all">All Vouchers</option>
                    <option value="active">Active</option>
                    <option value="redeemed">Redeemed</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Showing{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {vouchersData?.data?.length ?? 0}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {vouchersData?.meta?.total ?? 0}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Voucher cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-56 rounded-3xl animate-pulse bg-gray-200 dark:bg-gray-800" />
                  <div className="h-12 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-800" />
                </div>
              ))}
            </div>
          ) : vouchersData?.data && vouchersData.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {vouchersData.data.map((voucher, index) => {
                  const statusStyles = getStatusStyles(voucher.status)
                  const gradient = getGradientColor(voucher.id)

                  return (
                    <motion.div
                      key={voucher.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group"
                    >
                      {/* Card */}
                      <div className={`relative bg-linear-to-br ${gradient} rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow overflow-hidden`}
                        style={{
                          clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), 98% calc(100% - 5px), 96% calc(100% - 10px), 94% calc(100% - 5px), 92% calc(100% - 10px), 90% calc(100% - 5px), 88% calc(100% - 10px), 86% calc(100% - 5px), 84% calc(100% - 10px), 82% calc(100% - 5px), 80% calc(100% - 10px), 78% calc(100% - 5px), 76% calc(100% - 10px), 74% calc(100% - 5px), 72% calc(100% - 10px), 70% calc(100% - 5px), 68% calc(100% - 10px), 66% calc(100% - 5px), 64% calc(100% - 10px), 62% calc(100% - 5px), 60% calc(100% - 10px), 58% calc(100% - 5px), 56% calc(100% - 10px), 54% calc(100% - 5px), 52% calc(100% - 10px), 50% calc(100% - 5px), 48% calc(100% - 10px), 46% calc(100% - 5px), 44% calc(100% - 10px), 42% calc(100% - 5px), 40% calc(100% - 10px), 38% calc(100% - 5px), 36% calc(100% - 10px), 34% calc(100% - 5px), 32% calc(100% - 10px), 30% calc(100% - 5px), 28% calc(100% - 10px), 26% calc(100% - 5px), 24% calc(100% - 10px), 22% calc(100% - 5px), 20% calc(100% - 10px), 18% calc(100% - 5px), 16% calc(100% - 10px), 14% calc(100% - 5px), 12% calc(100% - 10px), 10% calc(100% - 5px), 8% calc(100% - 10px), 6% calc(100% - 5px), 4% calc(100% - 10px), 2% calc(100% - 5px), 0 calc(100% - 10px))',
                        }}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="text-[10px] font-bold tracking-widest uppercase opacity-90">
                              🎟️ Voucher
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold capitalize bg-white/20 backdrop-blur-sm`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusStyles.dot}`} />
                            {voucher.status}
                          </span>
                        </div>

                        {/* Amount Display */}
                        <div className="mb-3 flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-black">₱{(voucher.amount || 0).toLocaleString('en-PH', { maximumFractionDigits: 0 })}</span>
                          <span className="text-sm font-bold opacity-90">OFF</span>
                        </div>

                        {/* Code */}
                        <div className="font-mono text-xs font-bold tracking-wider opacity-95 mb-3">
                          {voucher.code}
                        </div>

                        {/* Bottom info */}
                        <div className="flex items-end justify-between pt-2 border-t border-white/20">
                          <div>
                            <p className="text-[8px] font-semibold opacity-75 uppercase">Uses</p>
                            <p className="text-xs font-bold">
                              {voucher.max_uses ? `${voucher.used_count ?? 0} / ${voucher.max_uses}` : '∞'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Creator Info Below Card */}
                      <div className="mt-3 rounded-xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 shadow-sm">
                        <div className="grid grid-cols-2 gap-3">
                          {/* Left: Creator Info */}
                          <div>
                            <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Creator</p>
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {voucher.customer.name}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">@{voucher.customer.username}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{voucher.customer.email}</p>
                          </div>

                          {/* Right: Dates */}
                          <div>
                            <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Dates</p>
                            <div className="space-y-1 text-[10px] text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <span>📅</span>
                                <span>{formatDateTime(voucher.created_at)}</span>
                              </div>
                              {voucher.expires_at ? (
                                <div className="flex items-center gap-1">
                                  <span>⏰</span>
                                  <span>{formatDateTime(voucher.expires_at)}</span>
                                </div>
                              ) : null}
                              {voucher.redeemed_at ? (
                                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                  <span>✓</span>
                                  <span>{formatDateTime(voucher.redeemed_at)}</span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900 p-10 sm:p-14 text-center">
              <svg
                className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No vouchers found</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search or filter</p>
            </div>
          )}

          {/* Pagination */}
          {vouchersData?.meta && vouchersData.meta.last_page > 1 ? (
            <div className="mt-8 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
              >
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Page{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {vouchersData.meta.current_page}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {vouchersData.meta.last_page}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-lg border border-gray-200/80 dark:border-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition"
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= vouchersData.meta.last_page}
                    className="px-4 py-2 rounded-lg border border-gray-200/80 dark:border-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition"
                  >
                    Next →
                  </button>
                </div>
              </motion.div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

