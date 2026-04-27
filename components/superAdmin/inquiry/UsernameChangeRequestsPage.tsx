'use client'

import { useMemo, useState } from 'react'
import {
  useApproveUsernameChangeMutation,
  useGetUsernameChangeRequestsQuery,
  useRejectUsernameChangeMutation,
} from '@/store/api/adminInquiriesApi'

const statusStyles: Record<string, string> = {
  pending_review:
    'border border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200',
  approved:
    'border border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200',
  rejected:
    'border border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200',
}

type RequestStatus = 'all' | 'pending_review' | 'approved' | 'rejected'

export default function UsernameChangeRequestsPage() {
  const { data, isLoading, isError } = useGetUsernameChangeRequestsQuery()
  const [approveRequest, { isLoading: isApproving }] = useApproveUsernameChangeMutation()
  const [rejectRequest, { isLoading: isRejecting }] = useRejectUsernameChangeMutation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequestStatus>('all')
  const [confirm, setConfirm] = useState<{
    open: boolean
    action: 'approve' | 'reject'
    id: number | null
    requested?: string | null
  }>({
    open: false,
    action: 'approve',
    id: null,
    requested: null,
  })

  const rows = useMemo(() => {
    const source = data?.requests ?? []
    const q = search.trim().toLowerCase()

    return source.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (!q) return true

      const haystack = [
        item.customer_name,
        item.customer_email,
        item.current_username,
        item.requested_username,
        String(item.ticket_id),
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [data?.requests, search, statusFilter])

  const openConfirm = (action: 'approve' | 'reject', id: number, requested?: string | null) => {
    setConfirm({ open: true, action, id, requested })
  }

  const closeConfirm = () =>
    setConfirm({ open: false, action: 'approve', id: null, requested: null })

  const handleConfirm = async () => {
    if (!confirm.id) return

    if (confirm.action === 'approve') {
      await approveRequest({ id: confirm.id }).unwrap()
    } else {
      await rejectRequest({ id: confirm.id }).unwrap()
    }

    closeConfirm()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Username Change Requests
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            All customer requests submitted via OTP and awaiting review.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RequestStatus)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-500/20"
          >
            <option value="all">All Status</option>
            <option value="pending_review">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, username, ticket..."
            className="w-64 max-w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400 dark:focus:ring-teal-500/20"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {rows.length} request{rows.length !== 1 ? 's' : ''}
          </p>
          {isLoading && (
            <span className="text-xs text-slate-400 dark:text-slate-500">Loading...</span>
          )}
        </div>

        {isError && (
          <div className="p-4 text-sm text-rose-600 dark:text-rose-300">
            Failed to load requests.
          </div>
        )}

        {!isLoading && !rows.length && !isError && (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
            No username change requests yet.
          </div>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900/80 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Ticket</th>
                  <th className="px-4 py-3 text-left font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold">Current</th>
                  <th className="px-4 py-3 text-left font-semibold">Requested</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Submitted</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                      #{item.ticket_id}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {item.customer_name ?? 'Unknown'}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {item.customer_email ?? 'No email'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {item.current_username ? `@${item.current_username}` : '-'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                      {item.requested_username ? `@${item.requested_username}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[item.status] ?? statusStyles.pending_review}`}
                      >
                        {item.status === 'pending_review' ? 'Pending' : item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'pending_review' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isApproving}
                            onClick={() =>
                              openConfirm('approve', item.id, item.requested_username)
                            }
                            className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/15 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={isRejecting}
                            onClick={() =>
                              openConfirm('reject', item.id, item.requested_username)
                            }
                            className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 p-5 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {confirm.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {confirm.action === 'approve'
                  ? 'This will update the customer username.'
                  : 'This will mark the request as rejected.'}
              </p>
            </div>

            <div className="p-5">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                <p className="text-xs text-slate-500 dark:text-slate-400">Requested username</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {confirm.requested ? `@${confirm.requested}` : '-'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-5 pt-0">
              <button
                type="button"
                onClick={closeConfirm}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirm.action === 'approve' ? isApproving : isRejecting}
                onClick={handleConfirm}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                  confirm.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {confirm.action === 'approve'
                  ? isApproving
                    ? 'Approving...'
                    : 'Confirm Approval'
                  : isRejecting
                    ? 'Rejecting...'
                    : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
