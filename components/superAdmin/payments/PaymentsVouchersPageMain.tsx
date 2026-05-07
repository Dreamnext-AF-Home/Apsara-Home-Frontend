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
        className="relative overflow-hidden rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-gradient-to-br from-white via-white to-sky-50/40 dark:from-gray-900 dark:via-gray-900 dark:to-sky-950/20"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-200/30 via-transparent to-transparent" />
        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50/70 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200/80 dark:bg-sky-950/20 dark:text-sky-300 dark:ring-sky-900/60">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Admin • Vouchers
              </div>
              <h1 className="mt-3 text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Vouchers
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage and track affiliate voucher codes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/payments"
                className="inline-flex items-center rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-100 transition hover:border-sky-300/80 dark:hover:border-sky-700/80 hover:bg-sky-50 dark:hover:bg-sky-950/20"
              >
                Back to Payments
              </Link>
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
            className="rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search */}
                <div className="relative w-full sm:max-w-[380px]">
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
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200/80 dark:border-gray-800 rounded-xl bg-gray-50/80 dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/50 dark:focus:ring-sky-400/20 dark:focus:border-sky-400/50 transition"
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
                    className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/70 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/50 dark:focus:ring-sky-400/20 dark:focus:border-sky-400/50"
                  >
                    <option value="all">All Vouchers</option>
                    <option value="active">Active</option>
                    <option value="redeemed">Redeemed</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                Showing{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {vouchersData?.meta?.total ?? 0}
                </span>{' '}
                vouchers total
              </div>
            </div>
          </motion.div>

          {/* Voucher cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse"
                />
              ))}
            </div>
          ) : vouchersData?.data && vouchersData.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {vouchersData.data.map((voucher) => {
                  const statusStyles = getStatusStyles(voucher.status)

                  return (
                    <motion.div
                      key={voucher.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="group rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-gray-300/90 dark:hover:border-gray-700/90 transition"
                    >
                      {/* top row */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Code
                          </p>
                          <p className="mt-1 text-base sm:text-lg font-extrabold text-gray-900 dark:text-white font-mono tracking-wider">
                            {voucher.code}
                          </p>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${statusStyles.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusStyles.dot}`} />
                          {voucher.status}
                        </span>
                      </div>

                      {/* amount */}
                      <div className="mb-4 rounded-2xl bg-gradient-to-br from-sky-50 to-teal-50 dark:from-sky-950/30 dark:to-teal-950/30 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wide">
                              Amount
                            </p>
                            <p className="text-2xl font-extrabold text-sky-800 dark:text-sky-200 mt-1">
                              {formatMoney(voucher.amount)}
                            </p>
                          </div>
                          {voucher.max_uses ? (
                            <div className="text-right">
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                                Uses
                              </p>
                              <p className="text-[12px] font-bold text-gray-900 dark:text-white">
                                {voucher.used_count ?? 0} / {voucher.max_uses}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* creator */}
                      <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Creator
                        </p>
                        <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                          {voucher.customer.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{voucher.customer.username}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{voucher.customer.email}</p>
                      </div>

                      {/* dates */}
                      <div className="space-y-2 text-xs">
                        <p className="text-gray-600 dark:text-gray-300">
                          <span className="font-semibold">Created:</span> {formatDateTime(voucher.created_at)}
                        </p>
                        {voucher.expires_at ? (
                          <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-semibold">Expires:</span> {formatDateTime(voucher.expires_at)}
                          </p>
                        ) : null}
                        {voucher.redeemed_at ? (
                          <p className="text-sky-700 dark:text-sky-300">
                            <span className="font-semibold">Redeemed:</span> {formatDateTime(voucher.redeemed_at)}
                          </p>
                        ) : null}
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
            <div className="mt-4 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
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
                    className="px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= vouchersData.meta.last_page}
                    className="px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition"
                  >
                    Next
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

