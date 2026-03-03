'use client'

import { useMemo, useState } from 'react'
import { AdminEncashmentItem, useGetAdminEncashmentRequestsQuery } from '@/store/api/encashmentApi'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(value || 0)

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

const sanitize = (value?: string | null) => {
  const text = value ?? ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const openPrintView = (row: AdminEncashmentItem) => {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${sanitize(row.invoice_no || row.reference_no)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 24px; }
    .title { font-size: 24px; font-weight: 700; }
    .muted { color:#64748b; font-size: 12px; }
    .box { border:1px solid #e2e8f0; border-radius:10px; padding:14px; margin-bottom: 14px; }
    .row { display:flex; justify-content:space-between; gap:16px; margin-bottom:8px; }
    .label { color:#475569; font-size:12px; text-transform: uppercase; letter-spacing: .04em; }
    .value { font-size:14px; font-weight:600; }
    .total { font-size: 22px; font-weight:700; color:#0f766e; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">AF Home Payout Invoice</div>
      <div class="muted">Auto-generated accounting document</div>
    </div>
    <div style="text-align:right">
      <div class="label">Invoice No</div>
      <div class="value">${sanitize(row.invoice_no || 'Pending')}</div>
    </div>
  </div>

  <div class="box">
    <div class="row"><div><div class="label">Encashment Ref</div><div class="value">${sanitize(row.reference_no)}</div></div><div><div class="label">Released At</div><div class="value">${sanitize(formatDate(row.released_at))}</div></div></div>
    <div class="row"><div><div class="label">Affiliate</div><div class="value">${sanitize(row.affiliate_name || 'Affiliate')}</div></div><div><div class="label">Email</div><div class="value">${sanitize(row.affiliate_email || '-')}</div></div></div>
    <div class="row"><div><div class="label">Channel</div><div class="value">${sanitize((row.channel || '').toUpperCase())}</div></div><div><div class="label">Account</div><div class="value">${sanitize(row.account_name || '-')} (${sanitize(row.account_number || '-')})</div></div></div>
  </div>

  <div class="box">
    <div class="label">Total Released Amount</div>
    <div class="total">${sanitize(formatMoney(row.amount))}</div>
  </div>

  <div class="muted">Generated ${sanitize(formatDate(new Date().toISOString()))}</div>
  <script>window.print();</script>
</body>
</html>
`

  win.document.open()
  win.document.write(html)
  win.document.close()
}

export default function InvoicesPageMain() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState<AdminEncashmentItem | null>(null)

  const { data, isLoading, isError, isFetching } = useGetAdminEncashmentRequestsQuery({
    filter: 'released',
    search: search.trim() || undefined,
    page,
    perPage: 20,
  })

  const rows = data?.requests ?? []
  const totalReleased = useMemo(() => rows.reduce((sum, row) => sum + row.amount, 0), [rows])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Invoices</h1>
        <p className="text-sm text-slate-500 mt-0.5">Issued payout invoices from released encashment requests.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search invoice, reference, affiliate..."
            className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
          />
          <div className="text-right">
            <p className="text-xs text-slate-500">Total Released (Current Page)</p>
            <p className="text-sm font-bold text-slate-800">{formatMoney(totalReleased)}</p>
          </div>
        </div>
      </div>

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to load invoices data.
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 animate-pulse">
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-slate-100" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {isFetching ? (
            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-teal-500" />
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-4 py-3 font-semibold">Invoice</th>
                    <th className="px-4 py-3 font-semibold">Encashment Ref</th>
                    <th className="px-4 py-3 font-semibold">Affiliate</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Channel</th>
                    <th className="px-4 py-3 font-semibold">Released At</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? (
                    rows.map((row) => (
                      <tr key={row.id} className="border-b border-slate-50 last:border-b-0 text-sm">
                        <td className="px-4 py-3 font-semibold text-slate-800">{row.invoice_no || 'Pending'}</td>
                        <td className="px-4 py-3 text-slate-700">{row.reference_no}</td>
                        <td className="px-4 py-3">
                          <p className="text-slate-800">{row.affiliate_name || 'Affiliate'}</p>
                          <p className="text-xs text-slate-500">{row.affiliate_email || '-'}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{formatMoney(row.amount)}</td>
                        <td className="px-4 py-3 uppercase text-slate-600">{row.channel}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(row.released_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedRow(row)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              View
                            </button>
                            <button
                              onClick={() => openPrintView(row)}
                              className="rounded-lg border border-teal-200 px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                            >
                              Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                        No invoice records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
            <p>
              Showing {data?.meta?.from ?? 0} - {data?.meta?.to ?? 0} of {data?.meta?.total ?? 0}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={(data?.meta?.current_page ?? 1) <= 1}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 disabled:opacity-40"
              >
                Prev
              </button>
              <span>
                Page {data?.meta?.current_page ?? 1} / {data?.meta?.last_page ?? 1}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={(data?.meta?.current_page ?? 1) >= (data?.meta?.last_page ?? 1)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Invoice Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedRow.invoice_no || selectedRow.reference_no}</p>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Invoice No</p>
                  <p className="mt-1 font-semibold text-slate-800">{selectedRow.invoice_no || 'Pending'}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Encashment Ref</p>
                  <p className="mt-1 font-semibold text-slate-800">{selectedRow.reference_no}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Affiliate</p>
                  <p className="mt-1 text-slate-800">{selectedRow.affiliate_name || 'Affiliate'}</p>
                  <p className="text-slate-500">{selectedRow.affiliate_email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Payout Details</p>
                  <p className="mt-1 text-slate-800 uppercase">{selectedRow.channel}</p>
                  <p className="text-slate-500">{selectedRow.account_name || '-'}</p>
                  <p className="text-slate-500">{selectedRow.account_number || '-'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                <p className="text-xs uppercase tracking-wide text-emerald-700">Released Amount</p>
                <p className="mt-1 text-2xl font-bold text-emerald-800">{formatMoney(selectedRow.amount)}</p>
                <p className="text-xs text-emerald-700">Released at {formatDate(selectedRow.released_at)}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
              <button
                onClick={() => openPrintView(selectedRow)}
                className="rounded-xl border border-teal-200 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50"
              >
                Download / Print
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
