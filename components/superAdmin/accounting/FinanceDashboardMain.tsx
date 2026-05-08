'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useGetAdminEncashmentRequestsQuery } from '@/store/api/encashmentApi'
import AvatarImg from '@/components/superAdmin/AvatarImg'

const formatMoney = (v: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(v || 0)

const formatDate = (v?: string | null) => {
  if (!v) return 'N/A'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d)
}

const STRIPE = {
  backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
  backgroundSize: '10px 10px',
}

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function FinanceDashboardMain() {
  const { data, isLoading, isError } = useGetAdminEncashmentRequestsQuery({
    filter: 'approved_by_admin',
    page: 1,
    perPage: 50,
  })

  const queue = data?.requests ?? []
  const count = queue.length
  const totalAmt = queue.reduce((s, r) => s + (r.amount || 0), 0)
  const avgAmt = count > 0 ? totalAmt / count : 0

  const byChannel = useMemo(
    () =>
      queue.reduce(
        (acc, r) => {
          acc[r.channel as 'bank' | 'gcash' | 'maya'] = (acc[r.channel as 'bank' | 'gcash' | 'maya'] || 0) + r.amount
          return acc
        },
        { bank: 0, gcash: 0, maya: 0 },
      ),
    [queue],
  )

  return (
    <div className="space-y-5">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-700 via-sky-800 to-blue-900 dark:from-sky-900 dark:via-slate-900 dark:to-black shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.07),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.04]" style={STRIPE} />
        <div className="relative px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-md bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-sky-200">
                  Finance Officer
                </span>
                {count > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-1 text-[10px] font-semibold text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    {count} awaiting release
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Release Center</h1>
              <p className="mt-0.5 text-sm text-sky-300/80">Final payout release workspace — approved and ready to disburse</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400/60 mb-1">Queue Release Amount</p>
              <p className="text-3xl font-black text-white tracking-tight">{formatMoney(totalAmt)}</p>
              <p className="mt-0.5 text-xs text-sky-400/50">{count} request{count !== 1 ? 's' : ''} pending release</p>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-white/[0.08] grid grid-cols-3 gap-4">
            {[
              { label: 'Ready for Release', value: String(count),         color: 'text-amber-300', dot: 'bg-amber-400' },
              { label: 'Queue Amount',       value: formatMoney(totalAmt), color: 'text-white',     dot: 'bg-sky-400' },
              { label: 'Avg. Payout',        value: formatMoney(avgAmt),   color: 'text-sky-200',   dot: 'bg-emerald-400' },
            ].map(({ label, value, color, dot }) => (
              <div key={label} className="flex items-start gap-2.5">
                <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${dot}`} />
                <div>
                  <p className={`text-sm font-black leading-tight ${color}`}>{value}</p>
                  <p className="text-[10px] font-medium text-sky-500/60 leading-tight mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Channel Breakdown ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {([
          { label: 'GCash', amount: byChannel.gcash, from: 'from-cyan-500',    to: 'to-cyan-600',    shadow: 'shadow-cyan-500/20' },
          { label: 'Maya',  amount: byChannel.maya,  from: 'from-emerald-500', to: 'to-teal-600',    shadow: 'shadow-emerald-500/20' },
          { label: 'Bank',  amount: byChannel.bank,  from: 'from-indigo-500',  to: 'to-indigo-600',  shadow: 'shadow-indigo-500/20' },
        ] as const).map(({ label, amount, from, to, shadow }) => (
          <div key={label} className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${from} ${to} p-4 shadow-md ${shadow}`}>
            <div className="absolute inset-0 opacity-[0.06]" style={STRIPE} />
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">{label}</p>
              <p className="mt-1.5 text-2xl font-black text-white">{formatMoney(amount)}</p>
              <p className="mt-0.5 text-xs text-white/60">
                {queue.filter((r) => r.channel === label.toLowerCase()).length} items
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Release Queue ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-500/20">
              <svg className="h-4 w-4 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Release Queue</h2>
            <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
              {queue.length}
            </span>
          </div>
          <Link
            href="/admin/encashment/approved_by_admin"
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 px-3 py-1.5 text-xs font-bold text-white transition-colors shadow-sm"
          >
            Open Full Release Queue →
          </Link>
        </div>

        {isError ? (
          <div className="flex items-center gap-3 m-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 px-4 py-3">
            <svg className="shrink-0 h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Failed to load release queue.</p>
          </div>
        ) : isLoading ? (
          <div className="p-4 space-y-2.5 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        ) : queue.length ? (
          <div className="overflow-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/60 text-left">
                  {['Affiliate', 'Reference', 'Channel', 'Account', 'Amount', 'Approved', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {queue.slice(0, 10).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <AvatarImg src={row.affiliate_avatar} name={row.affiliate_name ?? ''} size="h-8 w-8" bg="bg-gradient-to-br from-sky-600 to-blue-700" textSize="text-[10px]" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[110px]">
                          {row.affiliate_name || 'Affiliate'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{row.reference_no}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
                        {row.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{row.account_name || '—'}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{row.account_number || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-black tabular-nums text-slate-800 dark:text-white">{formatMoney(row.amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">{formatDate(row.approved_at)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href="/admin/encashment/approved_by_admin"
                        className="inline-flex items-center gap-1 rounded-lg border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"
                      >
                        Release →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {queue.length > 10 && (
              <div className="flex items-center justify-center py-3 border-t border-slate-100 dark:border-slate-800">
                <Link href="/admin/encashment/approved_by_admin" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                  View all {queue.length} items in the release queue →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <svg className="h-7 w-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">All clear!</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">No approved requests pending release.</p>
          </div>
        )}
      </div>

    </div>
  )
}
