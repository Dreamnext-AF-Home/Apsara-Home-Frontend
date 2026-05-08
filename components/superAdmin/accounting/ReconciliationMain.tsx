'use client'

import { useMemo, useState } from 'react'
import { useGetAdminEncashmentRequestsQuery } from '@/store/api/encashmentApi'

const formatMoney = (v: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(v || 0)

const STRIPE = {
  backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
  backgroundSize: '10px 10px',
}

type Period = 'all' | '7d' | '30d' | '90d'

export default function ReconciliationMain() {
  const [period, setPeriod] = useState<Period>('30d')

  const { data, isLoading, isError } = useGetAdminEncashmentRequestsQuery({ filter: 'released', page: 1, perPage: 200 })
  const { data: allData } = useGetAdminEncashmentRequestsQuery({ filter: 'all', page: 1, perPage: 200 })

  const rows = useMemo(() => {
    const released = data?.requests ?? []
    if (period === 'all') return released
    const now = Date.now()
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const cutoff = now - days * 24 * 60 * 60 * 1000
    return released.filter((r) => r.released_at && new Date(r.released_at).getTime() >= cutoff)
  }, [data?.requests, period])

  const allRows = allData?.requests ?? []

  const stats = useMemo(() => {
    const total    = rows.reduce((s, r) => s + r.amount, 0)
    const byChannel = rows.reduce(
      (acc, r) => { acc[r.channel as 'bank' | 'gcash' | 'maya'] += r.amount; return acc },
      { bank: 0, gcash: 0, maya: 0 },
    )
    const pending   = allRows.filter((r) => r.status === 'pending').reduce((s, r) => s + r.amount, 0)
    const onHold    = allRows.filter((r) => r.status === 'on_hold').reduce((s, r) => s + r.amount, 0)
    const rejected  = allRows.filter((r) => r.status === 'rejected').reduce((s, r) => s + r.amount, 0)
    const grandTotal = allRows.reduce((s, r) => s + r.amount, 0)
    return { total, byChannel, pending, onHold, rejected, grandTotal, count: rows.length }
  }, [rows, allRows])

  const PERIODS: { key: Period; label: string }[] = [
    { key: '7d',  label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' },
    { key: '90d', label: 'Last 90 days' },
    { key: 'all', label: 'All time' },
  ]

  return (
    <div className="space-y-5">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-purple-800 to-indigo-900 dark:from-violet-900 dark:via-slate-900 dark:to-black shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.06),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.04]" style={STRIPE} />
        <div className="relative px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-md bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-200">
                  Accounting
                </span>
                <span className="rounded-full bg-violet-400/15 border border-violet-400/30 px-2.5 py-1 text-[10px] font-semibold text-violet-300">
                  Month-end Reconciliation
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Reconciliation</h1>
              <p className="mt-0.5 text-sm text-violet-300/80">Match payout records, channel totals, and settlement entries</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400/60 mb-1">Released (Period)</p>
              <p className="text-3xl font-black text-white tracking-tight">{formatMoney(stats.total)}</p>
              <p className="mt-0.5 text-xs text-violet-400/50">{stats.count} disbursements</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Period Filter ── */}
      <div className="flex flex-wrap gap-2">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              period === key
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isError ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 px-4 py-3">
          <svg className="shrink-0 h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">Failed to load reconciliation data.</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-56 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : (
        <>
          {/* ── Channel Reconciliation Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {([
              { label: 'GCash', amount: stats.byChannel.gcash, count: rows.filter(r => r.channel === 'gcash').length, from: 'from-cyan-500', to: 'to-cyan-600', shadow: 'shadow-cyan-500/20', muted: 'text-cyan-100' },
              { label: 'Maya',  amount: stats.byChannel.maya,  count: rows.filter(r => r.channel === 'maya').length,  from: 'from-emerald-500', to: 'to-teal-600', shadow: 'shadow-emerald-500/20', muted: 'text-emerald-100' },
              { label: 'Bank',  amount: stats.byChannel.bank,  count: rows.filter(r => r.channel === 'bank').length,  from: 'from-indigo-500', to: 'to-indigo-600', shadow: 'shadow-indigo-500/20', muted: 'text-indigo-100' },
            ] as const).map(({ label, amount, count, from, to, shadow, muted }) => (
              <div key={label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${from} ${to} p-5 shadow-lg ${shadow}`}>
                <div className="absolute inset-0 opacity-[0.06]" style={STRIPE} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}>{label}</p>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">{count} txn</span>
                  </div>
                  <p className="text-3xl font-black text-white tabular-nums">{formatMoney(amount)}</p>
                  <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
                    <span className={`text-xs ${muted}`}>Share of total</span>
                    <span className="text-sm font-black text-white">
                      {stats.total > 0 ? Math.round((amount / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Reconciliation Summary Table ── */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/15">
                <svg className="h-4 w-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                </svg>
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Balance Reconciliation</h2>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/60 text-left">
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Category</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 text-right">Count</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 text-right">Amount</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {[
                    { label: 'Released (Disbursed)', count: rows.length,                                                        amt: stats.total,           cls: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
                    { label: 'Pending Approval',     count: allRows.filter(r => r.status === 'pending').length,                 amt: stats.pending,         cls: 'text-amber-600 dark:text-amber-400',   dot: 'bg-amber-500' },
                    { label: 'On Hold',              count: allRows.filter(r => r.status === 'on_hold').length,                 amt: stats.onHold,          cls: 'text-slate-600 dark:text-slate-400',   dot: 'bg-slate-400' },
                    { label: 'Rejected',             count: allRows.filter(r => r.status === 'rejected').length,                amt: stats.rejected,        cls: 'text-red-600 dark:text-red-400',       dot: 'bg-red-500' },
                    { label: 'Grand Total (All)',     count: allRows.length,                                                     amt: stats.grandTotal,      cls: 'text-slate-800 dark:text-white font-black', dot: 'bg-slate-700' },
                  ].map(({ label, count, amt, cls, dot }) => (
                    <tr key={label} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
                          <span className={`text-sm font-medium ${cls}`}>{label}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-bold tabular-nums ${cls}`}>{count}</td>
                      <td className={`px-4 py-3 text-right text-sm font-bold tabular-nums ${cls}`}>{formatMoney(amt)}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                        {stats.grandTotal > 0 ? Math.round((amt / stats.grandTotal) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
