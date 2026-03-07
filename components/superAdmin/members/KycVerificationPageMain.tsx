'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  MemberKycItem,
  MemberKycStatus,
  useApproveMemberKycMutation,
  useGetMembersKycQuery,
  useRejectMemberKycMutation,
} from '@/store/api/membersApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'

const FILTER_LABELS: Record<string, string> = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  on_hold: 'On Hold',
  all: 'All Requests',
}

const badgeClass = (status: MemberKycStatus) => {
  switch (status) {
    case 'pending_review':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'approved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'rejected':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'on_hold':
      return 'bg-slate-100 text-slate-700 border-slate-300'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

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

type ActionType = 'approve' | 'reject'

export default function KycVerificationPageMain() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected' | 'on_hold'>('pending_review')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [selected, setSelected] = useState<MemberKycItem | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [actionModal, setActionModal] = useState<{ open: boolean; action: ActionType; id: number | null; notes: string }>({
    open: false,
    action: 'approve',
    id: null,
    notes: '',
  })

  const { data, isLoading, isFetching, isError } = useGetMembersKycQuery({
    page,
    perPage: 20,
    search: search.trim() || undefined,
    filter,
  })

  const [approveKyc] = useApproveMemberKycMutation()
  const [rejectKyc] = useRejectMemberKycMutation()

  const rows = useMemo(() => data?.requests ?? [], [data?.requests])

  const openActionModal = (action: ActionType, id: number) => {
    setActionModal({ open: true, action, id, notes: '' })
  }

  const closeActionModal = () => {
    setActionModal({ open: false, action: 'approve', id: null, notes: '' })
  }

  const handleConfirmAction = async () => {
    if (!actionModal.id) return
    const notes = actionModal.notes.trim()
    if (actionModal.action === 'reject' && notes.length < 5) {
      const msg = 'Rejection note is required (minimum 5 characters).'
      setMessage({ type: 'error', text: msg })
      showErrorToast(msg)
      return
    }

    setBusyId(actionModal.id)
    setMessage(null)
    try {
      if (actionModal.action === 'approve') {
        await approveKyc({ id: actionModal.id, notes: notes || undefined }).unwrap()
        const msg = 'KYC request approved successfully.'
        setMessage({ type: 'success', text: msg })
        showSuccessToast(msg)
      } else {
        await rejectKyc({ id: actionModal.id, notes }).unwrap()
        const msg = 'KYC request rejected.'
        setMessage({ type: 'success', text: msg })
        showSuccessToast(msg)
      }
      closeActionModal()
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } }
      const msg = apiErr?.data?.message || 'Failed to update KYC request.'
      setMessage({ type: 'error', text: msg })
      showErrorToast(msg)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-slate-800">KYC / Verifications</h1>
        <p className="text-sm text-slate-500 mt-0.5">Review affiliate/member identity submissions before account activation.</p>
      </motion.div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search reference, full name, id number..."
            className="md:col-span-2 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
          />
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as typeof filter)
              setPage(1)
            }}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
          >
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="on_hold">On Hold</option>
            <option value="all">All</option>
          </select>
        </div>

        {data?.counts ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Pending</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{data.counts.pending_review}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Approved</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{data.counts.approved}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Rejected</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{data.counts.rejected}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">All</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{data.counts.all}</p>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
          Active filter: <span className="font-semibold">{FILTER_LABELS[filter]}</span>
        </div>
      </div>

      {message ? (
        <div
          className={`rounded-xl border p-3 text-sm ${
            message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to load KYC verification queue.
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 animate-pulse">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded bg-slate-100" />
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
              <table className="w-full min-w-[1140px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-4 py-3 font-semibold">Reference</th>
                    <th className="px-4 py-3 font-semibold">Member</th>
                    <th className="px-4 py-3 font-semibold">KYC Data</th>
                    <th className="px-4 py-3 font-semibold">Submitted</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? (
                    rows.map((row) => {
                      const isPending = row.status === 'pending_review' || row.status === 'on_hold'
                      const isBusy = busyId === row.id
                      return (
                        <tr key={row.id} className="border-b border-slate-50 last:border-b-0">
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-slate-800">{row.reference_no}</p>
                            <p className="text-xs text-slate-500 mt-0.5">#{row.id}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-800">{row.customer?.name || row.full_name || 'Member'}</p>
                            <p className="text-xs text-slate-500">{row.customer?.email || 'No email'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-800">{row.id_type}</p>
                            <p className="text-xs text-slate-500">{row.id_number || 'No ID number'}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            <p>{formatDate(row.created_at)}</p>
                            <p className="mt-0.5">Reviewed: {formatDate(row.reviewed_at)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 rounded-full border text-xs font-semibold ${badgeClass(row.status)}`}>
                              {row.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelected(row)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50"
                              >
                                View
                              </button>
                              <button
                                onClick={() => openActionModal('approve', row.id)}
                                disabled={isBusy || !isPending}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openActionModal('reject', row.id)}
                                disabled={isBusy || !isPending}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                        No KYC requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-slate-500">
              Showing {data?.meta?.from ?? 0} - {data?.meta?.to ?? 0} of {data?.meta?.total ?? 0}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={(data?.meta?.current_page ?? 1) <= 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs text-slate-600">
                Page {data?.meta?.current_page ?? 1} / {data?.meta?.last_page ?? 1}
              </span>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={(data?.meta?.current_page ?? 1) >= (data?.meta?.last_page ?? 1)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">KYC Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selected.reference_no}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[75vh] overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Member</p>
                  <p className="mt-1 font-semibold text-slate-800">{selected.customer?.name || selected.full_name}</p>
                  <p className="text-slate-500">{selected.customer?.email || 'No email'}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Verification Status</p>
                  <span className={`mt-1 inline-flex px-2 py-1 rounded-full border text-xs font-semibold ${badgeClass(selected.status)}`}>
                    {selected.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-slate-100 px-3 py-2.5">
                  <p className="text-xs uppercase tracking-wide text-slate-500">ID Type</p>
                  <p className="mt-1 text-slate-800">{selected.id_type}</p>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2.5">
                  <p className="text-xs uppercase tracking-wide text-slate-500">ID Number</p>
                  <p className="mt-1 text-slate-800">{selected.id_number || 'Not provided'}</p>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2.5">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Contact Number</p>
                  <p className="mt-1 text-slate-800">{selected.contact_number || 'Not provided'}</p>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2.5">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Birth Date</p>
                  <p className="mt-1 text-slate-800">{selected.birth_date || 'Not provided'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 px-3 py-2.5 text-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Address</p>
                <p className="mt-1 text-slate-700">
                  {[selected.address_line, selected.city, selected.province, selected.postal_code, selected.country].filter(Boolean).join(', ') ||
                    'No address provided.'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 px-3 py-2.5 text-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Submitted Notes</p>
                <p className="mt-1 text-slate-700">{selected.notes || 'No notes provided.'}</p>
                {selected.review_notes ? (
                  <p className="mt-2 text-slate-700">
                    <span className="font-semibold">Review Notes:</span> {selected.review_notes}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <a href={selected.id_front_url} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-100 px-3 py-2.5 hover:bg-slate-50">
                  <p className="text-xs uppercase tracking-wide text-slate-500">ID Front</p>
                  <p className="mt-1 text-teal-700 font-semibold">View document</p>
                </a>
                <a
                  href={selected.id_back_url || selected.id_front_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-100 px-3 py-2.5 hover:bg-slate-50"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500">ID Back</p>
                  <p className="mt-1 text-teal-700 font-semibold">{selected.id_back_url ? 'View document' : 'Not provided'}</p>
                </a>
                <a href={selected.selfie_url} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-100 px-3 py-2.5 hover:bg-slate-50">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Selfie with ID</p>
                  <p className="mt-1 text-teal-700 font-semibold">View document</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {actionModal.open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">{actionModal.action === 'approve' ? 'Approve KYC' : 'Reject KYC'}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {actionModal.action === 'approve' ? 'Optional note for approval log.' : 'Add reason for rejection (required).'}
                </p>
              </div>
              <button
                onClick={closeActionModal}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Review Note</label>
              <textarea
                value={actionModal.notes}
                onChange={(e) => setActionModal((prev) => ({ ...prev, notes: e.target.value }))}
                rows={5}
                placeholder={actionModal.action === 'approve' ? 'Optional note for audit trail...' : 'Explain rejection reason...'}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                onClick={closeActionModal}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={busyId === actionModal.id}
                className={`rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-60 ${
                  actionModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {busyId === actionModal.id ? 'Processing...' : actionModal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
