'use client'

import Link from 'next/link'
import { useGetAdminEncashmentRequestsQuery } from '@/store/api/encashmentApi'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(value || 0)

export default function FinanceDashboardMain() {
  const { data, isLoading, isError } = useGetAdminEncashmentRequestsQuery({
    filter: 'approved_by_admin',
    page: 1,
    perPage: 50,
  })

  const queue = data?.requests ?? []
  const forReleaseCount = queue.length
  const forReleaseAmount = queue.reduce((sum, row) => sum + (row.amount || 0), 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Finance Officer Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Final payout release workspace after accounting approval.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Ready for Release</p>
          <p className="text-2xl font-black text-blue-800 mt-1">{forReleaseCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Queue Amount</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{formatMoney(forReleaseAmount)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Action</p>
          <Link
            href="/admin/encashment/approved_by_admin"
            className="mt-2 inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Open Release Center
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Top Queue Items</h2>
          <Link href="/admin/encashment/approved_by_admin" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
            View all
          </Link>
        </div>

        {isError ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Failed to load finance queue.
          </div>
        ) : isLoading ? (
          <div className="mt-3 space-y-2 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-slate-100" />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No approved requests waiting for release.</p>
        ) : (
          <div className="mt-3 overflow-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Reference</th>
                  <th className="px-3 py-2 text-left font-semibold">Affiliate</th>
                  <th className="px-3 py-2 text-left font-semibold">Channel</th>
                  <th className="px-3 py-2 text-left font-semibold">Amount</th>
                  <th className="px-3 py-2 text-left font-semibold">Approved At</th>
                </tr>
              </thead>
              <tbody>
                {queue.slice(0, 10).map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 text-sm last:border-b-0">
                    <td className="px-3 py-2 text-slate-800 font-medium">{row.reference_no}</td>
                    <td className="px-3 py-2 text-slate-700">{row.affiliate_name || 'Affiliate'}</td>
                    <td className="px-3 py-2 text-slate-700 uppercase">{row.channel}</td>
                    <td className="px-3 py-2 text-slate-800 font-semibold">{formatMoney(row.amount)}</td>
                    <td className="px-3 py-2 text-slate-600">{row.approved_at || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
