'use client'

import { useState } from 'react'
import { useGetAdminEncashmentRequestsQuery } from '@/store/api/encashmentApi'
import AdminPagination from '@/components/superAdmin/AdminPagination'
import AvatarImg from '@/components/superAdmin/AvatarImg'

const formatDate = (v?: string | null) => {
  if (!v) return 'N/A'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d)
}

const formatMoney = (v: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(v || 0)

const STRIPE = {
  backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
  backgroundSize: '10px 10px',
}

const TIER_BADGE: Record<string, string> = {
  'Lifestyle Elite':      '/Badge/lifestyleElite.png',
  'Lifestyle Consultant': '/Badge/lifestyleConsultant.png',
  'Home Stylist':         '/Badge/homeStylist.png',
  'Home Builder':         '/Badge/homeBuilder.png',
  'Home Starter':         '/Badge/homeStarter.png',
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; event: string }> = {
  pending:           { label: 'Pending',         dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',   event: 'Submitted' },
  on_hold:           { label: 'On Hold',          dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',        event: 'Placed on Hold' },
  approved_by_admin: { label: 'Ready to Release', dot: 'bg-sky-500',     badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30',             event: 'Approved' },
  released:          { label: 'Released',         dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30', event: 'Released' },
  rejected:          { label: 'Rejected',         dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',             event: 'Rejected' },
}

type FilterStatus = 'all' | 'pending' | 'on_hold' | 'approved_by_admin' | 'released' | 'rejected'

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function AuditTrailMain() {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const apiFilter = statusFilter === 'all' ? 'all' : statusFilter

  const { data, isLoading, isError, isFetching } = useGetAdminEncashmentRequestsQuery({
    filter: apiFilter,
    search: search.trim() || undefined,
    page,
    perPage: 20,
  })

  const rows = data?.requests ?? []

  const handleExportCSV = () => {
    if (!rows.length) return
    const ts = new Date().toISOString().slice(0, 10)
    const filterLabel = FILTERS.find(f => f.key === statusFilter)?.label ?? statusFilter
    downloadCSV(
      `audit-trail-${filterLabel.toLowerCase().replace(/\s+/g, '-')}-${ts}.csv`,
      ['Reference', 'Affiliate Name', 'Email', 'Event', 'Status', 'Amount (PHP)', 'Channel', 'Account Name', 'Account No', 'Invoice No', 'Submitted Date', 'Approved Date', 'Released Date', 'Admin Notes', 'Accounting Notes'],
      rows.map(r => {
        const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending
        return [
          r.reference_no ?? '',
          r.affiliate_name ?? '',
          r.affiliate_email ?? '',
          cfg.event,
          cfg.label,
          String(r.amount ?? 0),
          r.channel ?? '',
          r.account_name ?? '',
          r.account_number ?? '',
          r.invoice_no ?? '',
          r.created_at ?? '',
          r.approved_at ?? '',
          r.released_at ?? '',
          r.admin_notes ?? '',
          r.accounting_notes ?? '',
        ]
      }),
    )
  }

  const FILTERS: { key: FilterStatus; label: string; dot: string }[] = [
    { key: 'all',             label: 'All Events',     dot: 'bg-slate-400' },
    { key: 'pending',         label: 'Submitted',      dot: 'bg-amber-500' },
    { key: 'on_hold',         label: 'On Hold',        dot: 'bg-slate-400' },
    { key: 'approved_by_admin', label: 'Approved',     dot: 'bg-sky-500' },
    { key: 'released',        label: 'Released',       dot: 'bg-emerald-500' },
    { key: 'rejected',        label: 'Rejected',       dot: 'bg-red-500' },
  ]

  return (
    <div className="space-y-5">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-black shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.04]" style={STRIPE} />
        <div className="relative px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-md bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Accounting
                </span>
                <span className="rounded-full bg-indigo-400/15 border border-indigo-400/30 px-2.5 py-1 text-[10px] font-semibold text-indigo-300">
                  Compliance &amp; Governance
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Audit Trail</h1>
              <p className="mt-0.5 text-sm text-slate-400">Review approval, rejection, and release activity logs</p>
            </div>
            <div className="sm:text-right flex flex-col items-start sm:items-end gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Events Loaded</p>
                <p className="text-3xl font-black text-white tracking-tight">{data?.meta?.total ?? rows.length}</p>
                <p className="mt-0.5 text-xs text-slate-500">across all status types</p>
              </div>
              <button
                onClick={handleExportCSV}
                disabled={!rows.length}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-40 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters + Search ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700/60">
          {FILTERS.map(({ key, label, dot }) => (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); setPage(1) }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === key
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-sm'
                  : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2.5 px-4 py-3">
          <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by reference, affiliate name..."
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none"
          />
          {(search || isFetching) && (
            <div className="flex items-center gap-2">
              {isFetching && <span className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />}
              {search && (
                <button onClick={() => { setSearch(''); setPage(1) }} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Audit Log ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700">
            <svg className="h-4 w-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Activity Log</h2>
          <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
            {data?.meta?.total ?? rows.length}
          </span>
        </div>

        {isError ? (
          <div className="flex items-center gap-3 m-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 px-4 py-3">
            <svg className="shrink-0 h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Failed to load audit trail.</p>
          </div>
        ) : isLoading ? (
          <div className="p-4 space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 py-4 border-b border-slate-50 dark:border-slate-800 animate-pulse">
                <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : rows.length ? (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {rows.map((row) => {
              const cfg = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.pending
              const eventTime = row.released_at ?? row.approved_at ?? row.created_at
              return (
                <div key={row.id} className="flex items-start gap-4 px-4 py-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Avatar */}
                  <div className="shrink-0 relative">
                    <AvatarImg src={row.affiliate_avatar} name={row.affiliate_name ?? ''} size="h-9 w-9" bg="bg-gradient-to-br from-slate-600 to-slate-700" textSize="text-[10px]" />
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${cfg.dot}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {row.affiliate_name || 'Affiliate'}
                            <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">{row.affiliate_email || ''}</span>
                          </p>
                          {row.affiliate_tier && TIER_BADGE[row.affiliate_tier] && (
                            <img src={TIER_BADGE[row.affiliate_tier]} alt={row.affiliate_tier} title={row.affiliate_tier} className="h-5 w-auto object-contain" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="font-medium text-slate-600 dark:text-slate-300">{cfg.event}</span>
                          {' · '}
                          <span className="font-mono">{row.reference_no}</span>
                          {' · '}
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{formatMoney(row.amount)}</span>
                          {' via '}
                          <span className="uppercase font-semibold">{row.channel}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{formatDate(eventTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No activity found</p>
          </div>
        )}
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
  )
}
