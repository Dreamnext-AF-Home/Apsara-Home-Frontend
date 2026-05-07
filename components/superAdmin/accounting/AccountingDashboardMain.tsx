'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useGetAdminEncashmentRequestsQuery } from '@/store/api/encashmentApi'
import AvatarImg from '@/components/superAdmin/AvatarImg'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value || 0)

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d)
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending:           { label: 'Pending',         cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30' },
  on_hold:           { label: 'On Hold',          cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  approved_by_admin: { label: 'Ready to Release', cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30' },
  released:          { label: 'Released',         cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30' },
  rejected:          { label: 'Rejected',         cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30' },
}

const STRIPE = {
  backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
  backgroundSize: '10px 10px',
}

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function AccountingDashboardMain() {
  const { data, isLoading, isError } = useGetAdminEncashmentRequestsQuery({ filter: 'all', page: 1, perPage: 40 })

  const s = useMemo(() => {
    const rows = data?.requests ?? []
    const forApproval = rows.filter((r) => r.status === 'pending' || r.status === 'on_hold')
    const forRelease  = rows.filter((r) => r.status === 'approved_by_admin')
    const released    = rows.filter((r) => r.status === 'released')
    const rejected    = rows.filter((r) => r.status === 'rejected')
    const onHold      = rows.filter((r) => r.status === 'on_hold')
    const channelTotal = rows.reduce(
      (acc, row) => { acc[row.channel as 'bank' | 'gcash' | 'maya'] += row.amount; return acc },
      { bank: 0, gcash: 0, maya: 0 },
    )
    const queue = [...forApproval, ...forRelease]
      .sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime())
      .slice(0, 8)
    const sum = (arr: typeof rows) => arr.reduce((t, r) => t + r.amount, 0)
    return {
      total:       rows.length,
      totalAmt:    sum(rows),
      approvalCnt: forApproval.length,  approvalAmt: sum(forApproval),
      releaseCnt:  forRelease.length,   releaseAmt:  sum(forRelease),
      releasedCnt: released.length,     releasedAmt: sum(released),
      rejectedCnt: rejected.length,     rejectedAmt: sum(rejected),
      onHoldCnt:   onHold.length,
      channelTotal,
      queue,
    }
  }, [data?.requests])

  const N          = Math.max(1, s.total)
  const pct        = (n: number) => Math.round((n / N) * 100)
  const donePct    = pct(s.releasedCnt)
  const chanSum    = s.channelTotal.gcash + s.channelTotal.maya + s.channelTotal.bank
  const chanMax    = Math.max(1, chanSum)
  const chanPct    = (v: number) => Math.round((v / chanMax) * 100)

  return (
    <div className="space-y-5">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-black shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.09),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={STRIPE} />
        <div className="relative px-6 py-6">
          {/* Top row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-md bg-sky-500/15 border border-sky-500/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-sky-400">
                  Finance
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live · Auto-updated
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Accounting Dashboard</h1>
              <p className="mt-0.5 text-sm text-slate-400">Payout approvals, release processing &amp; risk monitoring</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Snapshot Volume</p>
              <p className="text-3xl font-black text-white tracking-tight">{formatMoney(s.totalAmt)}</p>
              <p className="mt-0.5 text-xs text-slate-500">{s.total} request{s.total !== 1 ? 's' : ''} loaded</p>
            </div>
          </div>
          {/* Mini KPI strip */}
          <div className="mt-5 pt-4 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Awaiting Approval', value: s.approvalCnt, color: 'text-amber-400',   dot: 'bg-amber-400' },
              { label: 'Ready to Release',  value: s.releaseCnt,  color: 'text-sky-400',     dot: 'bg-sky-400' },
              { label: 'Released',          value: s.releasedCnt, color: 'text-emerald-400', dot: 'bg-emerald-400' },
              { label: 'On Hold',           value: s.onHoldCnt,   color: 'text-slate-400',   dot: 'bg-slate-500' },
            ].map(({ label, value, color, dot }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
                <div>
                  <p className={`text-xl font-black leading-tight ${color}`}>{value}</p>
                  <p className="text-[10px] font-medium text-slate-500 leading-tight">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {([
          {
            label: 'Total Requests', count: s.total, amt: s.totalAmt,
            from: 'from-slate-700', to: 'to-slate-800', shadow: '', muted: 'text-slate-400',
            icon: (
              <svg className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            ),
          },
          {
            label: 'For Approval', count: s.approvalCnt, amt: s.approvalAmt,
            from: 'from-amber-500', to: 'to-orange-500', shadow: 'shadow-amber-500/25', muted: 'text-amber-100',
            icon: (
              <svg className="h-5 w-5 text-amber-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            label: 'For Release', count: s.releaseCnt, amt: s.releaseAmt,
            from: 'from-sky-500', to: 'to-blue-600', shadow: 'shadow-sky-500/25', muted: 'text-sky-100',
            icon: (
              <svg className="h-5 w-5 text-sky-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            ),
          },
          {
            label: 'Released', count: s.releasedCnt, amt: s.releasedAmt,
            from: 'from-emerald-500', to: 'to-teal-600', shadow: 'shadow-emerald-500/25', muted: 'text-emerald-100',
            icon: (
              <svg className="h-5 w-5 text-emerald-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
        ] as const).map(({ label, count, amt, from, to, shadow, muted, icon }) => (
          <div key={label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${from} ${to} p-5 shadow-lg ${shadow}`}>
            <div className="absolute inset-0 opacity-[0.06]" style={STRIPE} />
            <div className="relative flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}>{label}</p>
                <p className="mt-2 text-4xl font-black text-white leading-none">{count}</p>
                <p className={`mt-1.5 text-xs font-medium tabular-nums ${muted}`}>{formatMoney(amt)}</p>
              </div>
              <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                {icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pipeline + Channel Mix ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Processing Pipeline */}
        <div className="lg:col-span-7 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700">
              <svg className="h-4 w-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Processing Pipeline</h2>
          </div>
          <div className="p-5 space-y-5">
            {([
              { label: 'Waiting Approval', sub: 'Pending & On Hold', count: s.approvalCnt, amt: s.approvalAmt, p: pct(s.approvalCnt), bar: 'bg-amber-500',   cc: 'text-amber-600 dark:text-amber-400',   dot: 'bg-amber-500' },
              { label: 'Ready to Release', sub: 'Approved by admin', count: s.releaseCnt,  amt: s.releaseAmt,  p: pct(s.releaseCnt),  bar: 'bg-sky-500',     cc: 'text-sky-600 dark:text-sky-400',       dot: 'bg-sky-500' },
              { label: 'Completed',        sub: 'Successfully paid', count: s.releasedCnt, amt: s.releasedAmt, p: donePct,            bar: 'bg-emerald-500', cc: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
              { label: 'Rejected',         sub: 'Declined requests', count: s.rejectedCnt, amt: s.rejectedAmt, p: pct(s.rejectedCnt), bar: 'bg-red-500',     cc: 'text-red-600 dark:text-red-400',       dot: 'bg-red-400' },
            ] as const).map(({ label, sub, count, amt, p, bar, cc, dot }) => (
              <div key={label}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`shrink-0 h-2 w-2 rounded-full ${dot}`} />
                  <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
                      <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">{sub}</span>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-sm font-black ${cc}`}>{count}</span>
                      <span className="text-xs text-slate-400">({p}%)</span>
                      <span className="hidden sm:block text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">{formatMoney(amt)}</span>
                    </div>
                  </div>
                </div>
                <div className="ml-5 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${p}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Mix */}
        <div className="lg:col-span-5 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700">
              <svg className="h-4 w-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
              </svg>
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Channel Mix</h2>
            <span className="ml-auto text-[10px] font-medium tabular-nums text-slate-400 dark:text-slate-500">{formatMoney(chanSum)}</span>
          </div>
          <div className="p-5 space-y-5">
            {([
              { label: 'GCash', amount: s.channelTotal.gcash, bar: 'bg-gradient-to-r from-cyan-400 to-cyan-500',     badge: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/25' },
              { label: 'Maya',  amount: s.channelTotal.maya,  bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25' },
              { label: 'Bank',  amount: s.channelTotal.bank,  bar: 'bg-gradient-to-r from-indigo-400 to-indigo-500',  badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/25' },
            ] as const).map(({ label, amount, bar, badge }) => {
              const p = chanPct(amount)
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge}`}>{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">{formatMoney(amount)}</span>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 w-8 text-right">{p}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${p}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700">
              <svg className="h-4 w-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Quick Actions</h2>
          </div>
          <Link href="/admin/encashment" className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors">
            Open Full Queue →
          </Link>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            {
              href: '/admin/encashment/pending', label: 'Review Pending', sub: `${s.approvalCnt} awaiting`,
              from: 'from-amber-500', to: 'to-orange-500', shadow: 'shadow-amber-500/20',
              icon: <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            },
            {
              href: '/admin/encashment/approved_by_admin', label: 'Process Releases', sub: `${s.releaseCnt} ready`,
              from: 'from-sky-500', to: 'to-blue-600', shadow: 'shadow-sky-500/20',
              icon: <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>,
            },
            {
              href: '/admin/encashment/released', label: 'View Released', sub: `${s.releasedCnt} completed`,
              from: 'from-emerald-500', to: 'to-teal-600', shadow: 'shadow-emerald-500/20',
              icon: <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            },
            {
              href: '/admin/encashment/rejected', label: 'Audit Rejected', sub: `${s.rejectedCnt} declined`,
              from: 'from-red-500', to: 'to-rose-600', shadow: 'shadow-red-500/20',
              icon: <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
            },
          ] as const).map(({ href, label, sub, from, to, shadow, icon }) => (
            <Link
              key={href}
              href={href}
              className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${from} ${to} p-4 shadow-md ${shadow} hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center gap-3`}
            >
              <div className="absolute inset-0 opacity-[0.06]" style={STRIPE} />
              <div className="relative shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                {icon}
              </div>
              <div className="relative min-w-0">
                <p className="text-sm font-bold text-white leading-tight">{label}</p>
                <p className="text-xs text-white/70 mt-0.5">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Priority Queue ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700">
              <svg className="h-4 w-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Priority Queue</h2>
            <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
              {s.queue.length}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Oldest first · max 8</span>
        </div>

        {isError ? (
          <div className="flex items-center gap-3 m-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 px-4 py-3">
            <svg className="shrink-0 h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Failed to load accounting queue. Please refresh.</p>
          </div>
        ) : isLoading ? (
          <div className="p-4 space-y-2.5 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        ) : s.queue.length ? (
          <div className="overflow-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/60 text-left">
                  {['Affiliate', 'Reference', 'Channel', 'Amount', 'Status', 'Requested', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {s.queue.map((row) => {
                  const meta     = STATUS_META[row.status] ?? STATUS_META.pending
                  return (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <AvatarImg src={row.affiliate_avatar} name={row.affiliate_name ?? ''} size="h-8 w-8" bg="bg-gradient-to-br from-slate-600 to-slate-700" textSize="text-[10px]" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
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
                      <td className="px-4 py-3 text-sm font-black tabular-nums text-slate-800 dark:text-white">{formatMoney(row.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">{formatDate(row.created_at)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={row.status === 'approved_by_admin' ? '/admin/encashment/approved_by_admin' : '/admin/encashment/pending'}
                          className="inline-flex items-center gap-1 rounded-lg border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400 dark:text-slate-500">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <svg className="h-7 w-7 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Queue is clear</p>
            <p className="text-xs">No pending or release items right now.</p>
          </div>
        )}
      </div>

      {/* ── Risk & Exceptions ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15">
              <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Risk &amp; Exceptions</h2>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">For finance audit</span>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rejected */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-rose-600 p-5 shadow-lg shadow-red-500/20">
            <div className="absolute inset-0 opacity-[0.06]" style={STRIPE} />
            <div className="absolute right-4 top-4 opacity-20">
              <svg className="h-14 w-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-100">Rejected Requests</p>
              <p className="mt-2 text-4xl font-black text-white leading-none">{s.rejectedCnt}</p>
              <p className="mt-1.5 text-xs font-medium tabular-nums text-red-100">{formatMoney(s.rejectedAmt)}</p>
            </div>
          </div>
          {/* On Hold */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 shadow-lg shadow-amber-500/20">
            <div className="absolute inset-0 opacity-[0.06]" style={STRIPE} />
            <div className="absolute right-4 top-4 opacity-20">
              <svg className="h-14 w-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-100">On Hold Queue</p>
              <p className="mt-2 text-4xl font-black text-white leading-none">{s.onHoldCnt}</p>
              <p className="mt-1.5 text-xs font-medium text-amber-100">Needs manual review</p>
            </div>
          </div>
          {/* Throughput */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 shadow-lg shadow-emerald-500/20">
            <div className="absolute inset-0 opacity-[0.06]" style={STRIPE} />
            <div className="absolute right-4 top-4 opacity-20">
              <svg className="h-14 w-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Release Throughput</p>
              <p className="mt-2 text-4xl font-black text-white leading-none">{donePct}%</p>
              <p className="mt-1.5 text-xs font-medium text-emerald-100">Completion ratio</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
