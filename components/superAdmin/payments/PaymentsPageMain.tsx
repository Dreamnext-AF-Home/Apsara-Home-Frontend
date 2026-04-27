'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useGetAdminPaymentsOverviewQuery } from '@/store/api/adminPaymentsApi'

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

const statusTone = (status: string) => {
  const normalized = String(status).toLowerCase()
  if (['paid', 'success', 'succeeded'].includes(normalized)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
  }
  if (['pending', 'active', 'unpaid'].includes(normalized)) {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
  }
  if (['failed', 'cancelled', 'expired'].includes(normalized)) {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
  }
  return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-300'
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint: string
  tone: 'teal' | 'emerald' | 'amber' | 'rose'
}) {
  const toneMap = {
    teal: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-200',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
    rose: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className={`inline-flex rounded-xl border px-2.5 py-1 text-[11px] font-semibold ${toneMap[tone]}`}>
        {label}
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{hint}</p>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="h-7 w-28 rounded-xl bg-slate-100 dark:bg-slate-700" />
            <div className="mt-4 h-8 w-32 rounded-lg bg-slate-100 dark:bg-slate-700" />
            <div className="mt-2 h-4 w-40 rounded bg-slate-100 dark:bg-slate-700" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="h-6 w-48 rounded bg-slate-100 dark:bg-slate-700" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-700" />
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="h-6 w-40 rounded bg-slate-100 dark:bg-slate-700" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-700" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentsPageMain() {
  const { data, isLoading, isFetching, isError } = useGetAdminPaymentsOverviewQuery()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Payments</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Live overview of checkout transactions, payment methods, vouchers, and encashment activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/payments/ewallet" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-teal-500 dark:hover:text-teal-300">
            Open E-Wallet
          </Link>
          <Link href="/admin/payments/giftcards" className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-100 dark:border-teal-600 dark:bg-teal-900/40 dark:text-teal-200 dark:hover:bg-teal-900/60">
            Open Vouchers
          </Link>
        </div>
      </motion.div>

      {isFetching ? <div className="google-loading-bar" /> : null}

      {isError || !data ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
          Failed to load the payments overview.
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Collected Today"
              value={formatMoney(data.summary.today_paid_amount)}
              hint={`${data.summary.today_paid_count.toLocaleString()} paid transaction(s) today`}
              tone="teal"
            />
            <StatCard
              label="Successful Payments"
              value={data.summary.successful_payments_count.toLocaleString()}
              hint={`Gross collected ${formatMoney(data.summary.gross_collected_amount)}`}
              tone="emerald"
            />
            <StatCard
              label="Pending Payments"
              value={data.summary.pending_payments_count.toLocaleString()}
              hint="Checkout sessions still waiting for payment completion"
              tone="amber"
            />
            <StatCard
              label="Failed / Cancelled"
              value={data.summary.failed_payments_count.toLocaleString()}
              hint="Failed, cancelled, or expired payment attempts"
              tone="rose"
            />
          </motion.div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-300">Latest checkout records from the current payment flow</p>
                </div>
                <Link href="/admin/orders" className="text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200">
                  View Orders
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      {['Checkout', 'Customer', 'Method', 'Amount', 'Status', 'Paid At'].map((label) => (
                        <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {data.recent_transactions.length ? data.recent_transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{transaction.checkout_id || `#${transaction.id}`}</p>
                          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-400">{transaction.payment_intent_id || 'No payment intent yet'}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{transaction.customer_name}</p>
                          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-400">{transaction.customer_email || transaction.product_name || 'No extra details'}</p>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-200">{transaction.payment_method}</td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100">{formatMoney(transaction.amount)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusTone(transaction.status)}`}>
                            {String(transaction.status).replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-300">
                          {formatDateTime(transaction.paid_at || transaction.created_at)}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-400">
                          No transactions found yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.section>

            <div className="space-y-6">
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Payment Method Breakdown</h2>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-300">Based on successful transactions</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {data.payment_methods.length ? data.payment_methods.map((method) => {
                    const percentage = data.summary.successful_payments_count > 0
                      ? Math.round((method.count / data.summary.successful_payments_count) * 100)
                      : 0

                    return (
                      <div key={method.key} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-700/50">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{method.label}</p>
                            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-300">{method.count.toLocaleString()} transaction(s)</p>
                          </div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatMoney(method.amount)}</p>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white dark:bg-slate-600">
                          <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.max(8, percentage)}%` }} />
                        </div>
                      </div>
                    )
                  }) : (
                    <p className="text-sm text-slate-400 dark:text-slate-300">No successful payment mix available yet.</p>
                  )}
                </div>
              </motion.section>

              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Connected Sections</h2>
                <div className="mt-4 grid gap-3">
                  <Link href="/admin/payments/ewallet" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-teal-300 hover:bg-teal-50 dark:border-slate-600 dark:bg-slate-700/50 dark:hover:border-teal-500 dark:hover:bg-teal-900/40">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">E-Wallet</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                      {data.encashment_summary.pending_requests.toLocaleString()} payout request(s) waiting in encashment flow
                    </p>
                  </Link>
                  <Link href="/admin/payments/giftcards" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-teal-300 hover:bg-teal-50 dark:border-slate-600 dark:bg-slate-700/50 dark:hover:border-teal-500 dark:hover:bg-teal-900/40">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Vouchers</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                      {data.voucher_summary.total_issued.toLocaleString()} issued voucher(s), {data.voucher_summary.active.toLocaleString()} currently active
                    </p>
                  </Link>
                </div>
              </motion.section>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
