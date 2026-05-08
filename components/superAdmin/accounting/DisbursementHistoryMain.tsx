'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useGetAdminEncashmentRequestsQuery } from '@/store/api/encashmentApi'
import AdminPagination from '@/components/superAdmin/AdminPagination'
import AvatarImg from '@/components/superAdmin/AvatarImg'

const formatMoney = (v: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(v || 0)

const formatDate = (v?: string | null) => {
  if (!v) return 'N/A'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d)
}

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

const CHANNEL_STYLE: Record<string, string> = {
  gcash: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/25',
  maya:  'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25',
  bank:  'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/25',
}

export default function DisbursementHistoryMain() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, isFetching } = useGetAdminEncashmentRequestsQuery({
    filter: 'released',
    search: search.trim() || undefined,
    page,
    perPage: 20,
  })

  const rows = data?.requests ?? []

  const handleExportCSV = () => {
    if (!rows.length) return
    const ts = new Date().toISOString().slice(0, 10)
    downloadCSV(
      `disbursement-history-${ts}.csv`,
      ['#', 'Reference', 'Invoice No', 'Affiliate Name', 'Email', 'Channel', 'Account Name', 'Account No', 'Amount (PHP)', 'Net Amount (PHP)', 'Withholding Tax', 'Processing Fee', 'Released Date'],
      rows.map((r, idx) => [
        String(((page - 1) * 20) + idx + 1),
        r.reference_no ?? '',
        r.invoice_no ?? '',
        r.affiliate_name ?? '',
        r.affiliate_email ?? '',
        r.channel ?? '',
        r.account_name ?? '',
        r.account_number ?? '',
        String(r.amount ?? 0),
        String(r.net_amount ?? r.amount ?? 0),
        String(r.withholding_tax ?? 0),
        String(r.processing_fee ?? 0),
        r.released_at ?? '',
      ]),
    )
  }

  const summary = useMemo(() => ({
    total: rows.reduce((s, r) => s + r.amount, 0),
    gcash: rows.filter((r) => r.channel === 'gcash').reduce((s, r) => s + r.amount, 0),
    maya:  rows.filter((r) => r.channel === 'maya').reduce((s, r) => s + r.amount, 0),
    bank:  rows.filter((r) => r.channel === 'bank').reduce((s, r) => s + r.amount, 0),
  }), [rows])

  return (
    <div className="space-y-5">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 dark:from-emerald-900 dark:via-slate-900 dark:to-black shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.07),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.04]" style={STRIPE} />
        <div className="relative px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-md bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-200">
                  Accounting
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                  Released Payouts
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Disbursement History</h1>
              <p className="mt-0.5 text-sm text-emerald-300/80">Track completed payout releases, references, and channels</p>
            </div>
            <div className="sm:text-right flex flex-col items-start sm:items-end gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/60 mb-1">Page Total Released</p>
                <p className="text-3xl font-black text-white tracking-tight">{formatMoney(summary.total)}</p>
                <p className="mt-0.5 text-xs text-emerald-400/50">{rows.length} records on this page</p>
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
          <div className="mt-5 pt-4 border-t border-white/[0.08] grid grid-cols-3 gap-4">
            {[
              { label: 'GCash', value: formatMoney(summary.gcash), color: 'text-cyan-300',    dot: 'bg-cyan-400' },
              { label: 'Maya',  value: formatMoney(summary.maya),  color: 'text-emerald-200', dot: 'bg-emerald-400' },
              { label: 'Bank',  value: formatMoney(summary.bank),  color: 'text-indigo-300',  dot: 'bg-indigo-400' },
            ].map(({ label, value, color, dot }) => (
              <div key={label} className="flex items-start gap-2.5">
                <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${dot}`} />
                <div>
                  <p className={`text-sm font-black leading-tight tabular-nums ${color}`}>{value}</p>
                  <p className="text-[10px] font-medium text-emerald-600/70 leading-tight mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Search Toolbar ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by reference, affiliate, invoice..."
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
            <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Disbursement Records</h2>
          {isFetching && <span className="ml-2 h-1.5 w-16 rounded-full bg-emerald-200 dark:bg-emerald-500/30 animate-pulse" />}
        </div>

        {isError ? (
          <div className="flex items-center gap-3 m-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 px-4 py-3">
            <svg className="shrink-0 h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Failed to load disbursement records.</p>
          </div>
        ) : isLoading ? (
          <div className="p-4 space-y-2.5 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800" style={{ opacity: 1 - i * 0.12 }} />
            ))}
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/60 text-left">
                  {['#', 'Affiliate', 'Reference / Invoice', 'Channel', 'Account', 'Amount', 'Released'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {rows.length ? rows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                      {((page - 1) * 20) + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <AvatarImg src={row.affiliate_avatar} name={row.affiliate_name ?? ''} size="h-8 w-8" bg="bg-gradient-to-br from-emerald-600 to-teal-700" textSize="text-[10px]" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                            {row.affiliate_name || 'Affiliate'}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{row.affiliate_email || ''}</p>
                          {row.affiliate_tier && TIER_BADGE[row.affiliate_tier] && (
                            <img src={TIER_BADGE[row.affiliate_tier]} alt={row.affiliate_tier} title={row.affiliate_tier} className="mt-1 h-5 w-auto object-contain" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{row.reference_no}</p>
                      {row.invoice_no && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{row.invoice_no}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase ${CHANNEL_STYLE[row.channel] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {row.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{row.account_name || '—'}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{row.account_number || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-black tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatMoney(row.amount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">{formatDate(row.released_at)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No disbursements found</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Try a different search term</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
