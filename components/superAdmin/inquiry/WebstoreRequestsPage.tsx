'use client'

import { useMemo, useState } from 'react'
import {
  useApproveWebstoreRequestMutation,
  useDeleteWebstoreRequestMutation,
  useGetWebstoreRequestsQuery,
} from '@/store/api/adminInquiriesApi'

type RequestStatus = 'all' | 'pending_review' | 'approved' | 'rejected'

export default function WebstoreRequestsPage() {
  const { data, isLoading, isError, refetch } = useGetWebstoreRequestsQuery()
  const [approveRequest, { isLoading: isApproving }] = useApproveWebstoreRequestMutation()
  const [deleteRequest, { isLoading: isDeleting }] = useDeleteWebstoreRequestMutation()
  const [statusFilter, setStatusFilter] = useState<RequestStatus>('all')
  const [confirm, setConfirm] = useState<{
    open: boolean
    action: 'approve' | 'delete'
    id: number | null
    displayName?: string | null
  }>({ open: false, action: 'approve', id: null, displayName: null })

  const rows = useMemo(() => {
    const source = data?.requests ?? []
    if (statusFilter === 'all') return source
    return source.filter((item) => item.status === statusFilter)
  }, [data?.requests, statusFilter])

  const onApprove = async (id: number) => {
    await approveRequest({ id }).unwrap()
  }

  const onDelete = async (id: number) => {
    await deleteRequest({ id }).unwrap()
  }

  const openConfirm = (action: 'approve' | 'delete', id: number, displayName?: string | null) => {
    setConfirm({ open: true, action, id, displayName: displayName ?? null })
  }

  const closeConfirm = () => {
    setConfirm({ open: false, action: 'approve', id: null, displayName: null })
  }

  const handleConfirm = async () => {
    if (!confirm.id) return
    if (confirm.action === 'approve') {
      await onApprove(confirm.id)
    } else {
      await onDelete(confirm.id)
    }
    closeConfirm()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setStatusFilter('all')} className="rounded-full border px-3 py-1 text-xs font-semibold">
          All
        </button>
        <button onClick={() => setStatusFilter('pending_review')} className="rounded-full border px-3 py-1 text-xs font-semibold">
          Pending
        </button>
        <button onClick={() => setStatusFilter('approved')} className="rounded-full border px-3 py-1 text-xs font-semibold">
          Approved
        </button>
        <button onClick={() => setStatusFilter('rejected')} className="rounded-full border px-3 py-1 text-xs font-semibold">
          Rejected
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="p-5 text-sm text-slate-500 dark:text-slate-300">Loading webstore requests...</div>
        ) : null}
        {isError ? <div className="p-5 text-sm text-rose-600 dark:text-rose-300">Failed to load webstore requests.</div> : null}
        {isError ? (
          <div className="px-5 pb-5">
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Retry
            </button>
          </div>
        ) : null}
        {!isLoading && !rows.length && !isError ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">No webstore requests yet.</div>
        ) : null}
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Ticket</th>
                  <th className="px-5 py-3 text-left font-semibold">Customer</th>
                  <th className="px-5 py-3 text-left font-semibold">Slug</th>
                  <th className="px-5 py-3 text-left font-semibold">Display</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Submitted</th>
                  <th className="px-5 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">#{item.ticket_id}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{item.customer_name || item.full_name || '-'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.customer_email || item.email || '-'}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-200">{item.slug_name || '-'}</td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-200">{item.display_name || '-'}</td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-200">{item.status}</td>
                    <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {item.status === 'pending_review' ? (
                          <button
                            type="button"
                            disabled={isApproving || isDeleting}
                            onClick={() => openConfirm('approve', item.id, item.display_name)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                            title="Approve request"
                          >
                            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={isApproving || isDeleting}
                          onClick={() => openConfirm('delete', item.id, item.display_name)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                          title="Delete request"
                        >
                          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.1">
                            <path d="M4 7h16" strokeLinecap="round" />
                            <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M7 7l1 12a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9L17 7" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M10 11v5M14 11v5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {confirm.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {confirm.action === 'approve' ? 'Approve Webstore Request' : 'Delete Webstore Request'}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {confirm.action === 'approve'
                  ? 'Are you sure you want to approve this webstore request?'
                  : 'Are you sure you want to delete this webstore request?'}
              </p>
            </div>

            <div className="p-5">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Store Display Name</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                  {confirm.displayName || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
              <button
                type="button"
                onClick={closeConfirm}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isApproving || isDeleting}
                onClick={handleConfirm}
                className={
                  'rounded-2xl px-4 py-2 text-sm font-bold text-white ' +
                  (confirm.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700')
                }
              >
                {confirm.action === 'approve'
                  ? isApproving
                    ? 'Approving...'
                    : 'Yes, Approve'
                  : isDeleting
                    ? 'Deleting...'
                    : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
