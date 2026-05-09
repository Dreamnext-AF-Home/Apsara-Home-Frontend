'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminEncashmentItem, useGetAdminEncashmentRequestsQuery } from '@/store/api/encashmentApi'
import AdminPagination from '@/components/superAdmin/AdminPagination'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value || 0)

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d)
}

const toDateKey = (value?: string | null) => {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const normalizeDateInput = (value?: string) => {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return undefined
  return `${m[3]}-${String(Number(m[1])).padStart(2, '0')}-${String(Number(m[2])).padStart(2, '0')}`
}

const sanitize = (value?: string | null) =>
  (value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const STRIPE = {
  backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
  backgroundSize: '10px 10px',
}

const openPrintView = (row: AdminEncashmentItem) => {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return
  win.document.open()
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>Invoice ${sanitize(row.invoice_no || row.reference_no)}</title>
<style>body{font-family:Arial,sans-serif;margin:32px;color:#0f172a}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}.title{font-size:24px;font-weight:700}.muted{color:#64748b;font-size:12px}.box{border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:14px}.row{display:flex;justify-content:space-between;gap:16px;margin-bottom:8px}.label{color:#475569;font-size:12px;text-transform:uppercase;letter-spacing:.04em}.value{font-size:14px;font-weight:600}.total{font-size:22px;font-weight:700;color:#0f766e}</style>
</head><body onload="window.print()">
<div class="header"><div><div class="title">AF Home Payout Invoice</div><div class="muted">Auto-generated accounting document</div></div><div style="text-align:right"><div class="label">Invoice No</div><div class="value">${sanitize(row.invoice_no || 'Pending')}</div></div></div>
<div class="box"><div class="row"><div><div class="label">Encashment Ref</div><div class="value">${sanitize(row.reference_no)}</div></div><div><div class="label">Released At</div><div class="value">${sanitize(formatDate(row.released_at))}</div></div></div><div class="row"><div><div class="label">Affiliate</div><div class="value">${sanitize(row.affiliate_name || 'Affiliate')}</div></div><div><div class="label">Email</div><div class="value">${sanitize(row.affiliate_email || '-')}</div></div></div><div class="row"><div><div class="label">Channel</div><div class="value">${sanitize((row.channel || '').toUpperCase())}</div></div><div><div class="label">Account</div><div class="value">${sanitize(row.account_name || '-')} (${sanitize(row.account_number || '-')})</div></div></div></div>
<div class="box"><div class="label">Total Released Amount</div><div class="total">${sanitize(formatMoney(row.amount))}</div></div>
<div class="muted">Generated ${sanitize(formatDate(new Date().toISOString()))}</div>
</body></html>`)
  win.document.close()
}

const openBulkPrintView = (rows: AdminEncashmentItem[]) => {
  if (!rows.length) return
  const win = window.open('', '_blank', 'width=1000,height=760')
  if (!win) return
  const invoices = rows.map((row) => `<section class="invoice"><div class="header"><div><div class="title">AF Home Payout Invoice</div><div class="muted">Auto-generated accounting document</div></div><div style="text-align:right"><div class="label">Invoice No</div><div class="value">${sanitize(row.invoice_no || 'Pending')}</div></div></div><div class="box"><div class="row"><div><div class="label">Encashment Ref</div><div class="value">${sanitize(row.reference_no)}</div></div><div><div class="label">Released At</div><div class="value">${sanitize(formatDate(row.released_at))}</div></div></div><div class="row"><div><div class="label">Affiliate</div><div class="value">${sanitize(row.affiliate_name || 'Affiliate')}</div></div><div><div class="label">Email</div><div class="value">${sanitize(row.affiliate_email || '-')}</div></div></div><div class="row"><div><div class="label">Channel</div><div class="value">${sanitize((row.channel || '').toUpperCase())}</div></div><div><div class="label">Account</div><div class="value">${sanitize(row.account_name || '-')} (${sanitize(row.account_number || '-')})</div></div></div></div><div class="box"><div class="label">Total Released Amount</div><div class="total">${sanitize(formatMoney(row.amount))}</div></div></section>`).join('<div class="page-break"></div>')
  win.document.open()
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>Bulk Invoices (${rows.length})</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#0f172a}.invoice{margin-bottom:28px}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}.title{font-size:22px;font-weight:700}.muted{color:#64748b;font-size:12px}.box{border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:12px}.row{display:flex;justify-content:space-between;gap:16px;margin-bottom:8px}.label{color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.04em}.value{font-size:13px;font-weight:600}.total{font-size:20px;font-weight:700;color:#0f766e}.page-break{page-break-after:always}.summary{margin-bottom:16px;color:#334155;font-size:13px}</style></head><body onload="window.print()"><div class="summary">Generated ${sanitize(formatDate(new Date().toISOString()))} | Selected invoices: ${rows.length}</div>${invoices}</body></html>`)
  win.document.close()
}

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function InvoicesPageMain() {
  const [search, setSearch] = useState('')
  const [releasedFrom, setReleasedFrom] = useState('')
  const [releasedTo, setReleasedTo] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState<AdminEncashmentItem | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const normalizedRange = useMemo(() => {
    const from = normalizeDateInput(releasedFrom)
    const to = normalizeDateInput(releasedTo)
    if (from && to && from > to) return { from: to, to: from }
    return { from, to }
  }, [releasedFrom, releasedTo])

  const { data, isLoading, isError, isFetching } = useGetAdminEncashmentRequestsQuery({
    filter: 'released',
    search: search.trim() || undefined,
    releasedFrom: normalizedRange.from,
    releasedTo: normalizedRange.to,
    page,
    perPage: 20,
  })

  const rows = data?.requests ?? []
  const displayRows = useMemo(() => {
    if (!normalizedRange.from && !normalizedRange.to) return rows
    return rows.filter((row) => {
      const key = toDateKey(row.released_at)
      if (!key) return false
      if (normalizedRange.from && key < normalizedRange.from) return false
      if (normalizedRange.to && key > normalizedRange.to) return false
      return true
    })
  }, [rows, normalizedRange.from, normalizedRange.to])

  const totalReleased = useMemo(() => displayRows.reduce((s, r) => s + r.amount, 0), [displayRows])
  const selectedRows = useMemo(() => displayRows.filter((r) => selectedIds.includes(r.id)), [displayRows, selectedIds])
  const allSelectedOnPage = displayRows.length > 0 && displayRows.every((r) => selectedIds.includes(r.id))

  useEffect(() => {
    const ids = new Set(displayRows.map((r) => r.id))
    setSelectedIds((prev) => prev.filter((id) => ids.has(id)))
  }, [displayRows])

  const toggleRow = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const toggleAll = () =>
    allSelectedOnPage ? setSelectedIds([]) : setSelectedIds(displayRows.map((r) => r.id))

  return (
    <div className="space-y-5">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 dark:from-teal-900 dark:via-slate-900 dark:to-black shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.07),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.04]" style={STRIPE} />
        <div className="relative px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-md bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-teal-200">
                  Accounting
                </span>
                <span className="rounded-full bg-emerald-400/15 border border-emerald-400/30 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                  Released Payouts
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Invoices</h1>
              <p className="mt-0.5 text-sm text-teal-300/80">Issued payout invoices from released encashment requests</p>
            </div>
            <div className="flex flex-col sm:items-end gap-2">
              <div className="sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-teal-400/60 mb-1">Page Total Released</p>
                <p className="text-2xl font-black text-white tabular-nums">{formatMoney(totalReleased)}</p>
              </div>
              <button
                type="button"
                onClick={() => openBulkPrintView(selectedRows)}
                disabled={selectedRows.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 px-3 py-2 text-xs font-bold text-white transition-all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
                Print Selected ({selectedRows.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50">
          <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by invoice no, reference, or affiliate..."
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none"
          />
        </div>
        <div className="px-4 py-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">From</span>
            <input
              type="date"
              value={releasedFrom}
              onChange={(e) => { setReleasedFrom(e.target.value); setPage(1) }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-sky-400 transition-colors"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">To</span>
            <input
              type="date"
              value={releasedTo}
              onChange={(e) => { setReleasedTo(e.target.value); setPage(1) }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-sky-400 transition-colors"
            />
          </label>
          {(releasedFrom || releasedTo || search) && (
            <button
              onClick={() => { setReleasedFrom(''); setReleasedTo(''); setSearch(''); setPage(1) }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {isError ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 px-4 py-3">
          <svg className="shrink-0 h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">Failed to load invoices.</p>
        </div>
      ) : isLoading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-4 space-y-2.5 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800" style={{ opacity: 1 - i * 0.12 }} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {isFetching && <div className="h-0.5 w-full rounded-full bg-teal-200 dark:bg-teal-500/30 overflow-hidden"><div className="h-full w-1/3 bg-teal-500 rounded-full animate-pulse" /></div>}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-500/15">
                <svg className="h-4 w-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Invoice Records</h2>
              <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {data?.meta?.total ?? displayRows.length}
              </span>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/60 text-left">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelectedOnPage}
                        onChange={toggleAll}
                        aria-label="Select all on page"
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                    </th>
                    {['Invoice', 'Affiliate', 'Reference', 'Channel', 'Amount', 'Released At', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {displayRows.length ? displayRows.map((row) => (
                    <tr key={row.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${selectedIds.includes(row.id) ? 'bg-teal-50/50 dark:bg-teal-500/5' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleRow(row.id)}
                          aria-label={`Select ${row.invoice_no || row.reference_no}`}
                          className="rounded border-slate-300 dark:border-slate-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold font-mono ${row.invoice_no ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500 italic'}`}>
                          {row.invoice_no || 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center">
                            <span className="text-[10px] font-black text-white">{getInitials(row.affiliate_name)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{row.affiliate_name || 'Affiliate'}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{row.affiliate_email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{row.reference_no}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
                          {row.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-black tabular-nums text-teal-700 dark:text-teal-400">{formatMoney(row.amount)}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">{formatDate(row.released_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedRow(row)}
                            className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openPrintView(row)}
                            className="rounded-lg border border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors"
                          >
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No invoices found</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">Try adjusting your search or date range</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
      )}

      {/* ── Invoice Detail Modal ── */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white">Invoice Details</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{selectedRow.invoice_no || selectedRow.reference_no}</p>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Invoice No',     value: selectedRow.invoice_no || 'Pending' },
                  { label: 'Encashment Ref', value: selectedRow.reference_no },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
                    <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Affiliate</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedRow.affiliate_name || 'Affiliate'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedRow.affiliate_email || '-'}</p>
                </div>
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Payout Channel</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 uppercase">{selectedRow.channel}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedRow.account_name || '-'}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{selectedRow.account_number || '-'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Total Released Amount</p>
                <p className="mt-1 text-2xl font-black text-emerald-800 dark:text-emerald-300 tabular-nums">{formatMoney(selectedRow.amount)}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Released at {formatDate(selectedRow.released_at)}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 px-5 py-3">
              <button
                onClick={() => setSelectedRow(null)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => openPrintView(selectedRow)}
                className="inline-flex items-center gap-2 rounded-lg border border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
                Download / Print
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
