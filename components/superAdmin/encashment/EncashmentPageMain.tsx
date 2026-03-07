'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import {
  AdminEncashmentItem,
  AdminEncashmentStatus,
  useApproveAdminEncashmentMutation,
  useGetAdminEncashmentRequestsQuery,
  useRejectAdminEncashmentMutation,
  useReleaseAdminEncashmentMutation,
} from '@/store/api/encashmentApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'

const FILTER_LABELS: Record<string, string> = {
  all: 'All Requests',
  pending: 'Pending',
  released: 'Released',
  approved_by_admin: 'Approved by Admin',
  rejected: 'Rejected',
  on_hold: 'On Hold',
}

const badgeClass = (status: AdminEncashmentStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'approved_by_admin':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'released':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'rejected':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'on_hold':
      return 'bg-slate-100 text-slate-700 border-slate-300'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

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

interface Props {
  initialFilter?: string
}

type ActionType = 'approve' | 'release' | 'reject'

type ActionModalState = {
  open: boolean
  action: ActionType
  id: number | null
  notes: string
  proofUrl: string
  proofPublicId: string
  proofFileName: string
}

export default function EncashmentPageMain({ initialFilter = 'all' }: Props) {
  const { data: session } = useSession()
  const role = (session?.user?.role ?? '').toLowerCase()
  const canApprove = role === 'accounting'
  const canRelease = role === 'finance_officer' || role === 'super_admin'

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [selectedRow, setSelectedRow] = useState<AdminEncashmentItem | null>(null)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [actionModal, setActionModal] = useState<ActionModalState>({
    open: false,
    action: 'approve',
    id: null,
    notes: '',
    proofUrl: '',
    proofPublicId: '',
    proofFileName: '',
  })
  const [isUploadingProof, setIsUploadingProof] = useState(false)

  const effectiveFilter = useMemo(() => {
    const normalized = initialFilter
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')

    const aliases: Record<string, string> = {
      all_requests: 'all',
      approved: 'approved_by_admin',
      hold: 'on_hold',
    }

    const mapped = aliases[normalized] ?? normalized
    const supported = ['all', 'pending', 'released', 'approved_by_admin', 'rejected', 'on_hold']
    return supported.includes(mapped) ? mapped : 'all'
  }, [initialFilter])

  const { data, isLoading, isFetching, isError } = useGetAdminEncashmentRequestsQuery({
    filter: effectiveFilter,
    search: search.trim() || undefined,
    page,
    perPage: 20,
  })

  const [approveRequest] = useApproveAdminEncashmentMutation()
  const [rejectRequest] = useRejectAdminEncashmentMutation()
  const [releaseRequest] = useReleaseAdminEncashmentMutation()

  const openActionModal = (action: ActionType, id: number) => {
    setActionModal({
      open: true,
      action,
      id,
      notes: '',
      proofUrl: '',
      proofPublicId: '',
      proofFileName: '',
    })
  }

  const closeActionModal = () => {
    setActionModal((prev) => ({
      ...prev,
      open: false,
      id: null,
      notes: '',
      proofUrl: '',
      proofPublicId: '',
      proofFileName: '',
    }))
    setIsUploadingProof(false)
  }

  const getActionTitle = (action: ActionType) => {
    if (action === 'approve') return 'Approve Request'
    if (action === 'release') return 'Release Request'
    return 'Reject Request'
  }

  const getActionButtonLabel = (action: ActionType) => {
    if (action === 'approve') return 'Confirm Approval'
    if (action === 'release') return 'Confirm Release'
    return 'Confirm Rejection'
  }

  const getActionButtonClass = (action: ActionType) => {
    if (action === 'approve') return 'bg-blue-600 hover:bg-blue-700'
    if (action === 'release') return 'bg-emerald-600 hover:bg-emerald-700'
    return 'bg-red-600 hover:bg-red-700'
  }

  const handleActionConfirm = async () => {
    const id = actionModal.id
    const notes = actionModal.notes.trim()
    if (!id) return
    if (notes.length < 5) {
      const msg = 'Action note is required (minimum 5 characters).'
      setActionMessage({ type: 'error', text: msg })
      showErrorToast(msg)
      return
    }
    if (actionModal.action === 'release' && !actionModal.proofUrl) {
      const msg = 'Screenshot proof is required before release.'
      setActionMessage({ type: 'error', text: msg })
      showErrorToast(msg)
      return
    }

    setBusyId(id)
    try {
      if (actionModal.action === 'approve') {
        await approveRequest({ id, notes }).unwrap()
        const msg = 'Request approved successfully.'
        setActionMessage({ type: 'success', text: msg })
        showSuccessToast(msg)
      } else if (actionModal.action === 'release') {
        await releaseRequest({
          id,
          notes,
          proof_url: actionModal.proofUrl,
          proof_public_id: actionModal.proofPublicId || undefined,
        }).unwrap()
        const msg = 'Request released successfully.'
        setActionMessage({ type: 'success', text: msg })
        showSuccessToast(msg)
      } else {
        await rejectRequest({ id, notes }).unwrap()
        const msg = 'Request rejected successfully.'
        setActionMessage({ type: 'success', text: msg })
        showSuccessToast(msg)
      }
      closeActionModal()
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } }
      const fallback =
        actionModal.action === 'approve'
          ? 'Failed to approve request.'
          : actionModal.action === 'release'
          ? 'Failed to release request.'
          : 'Failed to reject request.'
      const msg = apiErr?.data?.message || fallback
      setActionMessage({ type: 'error', text: msg })
      showErrorToast(msg)
    } finally {
      setBusyId(null)
    }
  }

  const handleProofUpload = async (file: File) => {
    setActionMessage(null)
    setIsUploadingProof(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'encashment')

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      const result = (await response.json()) as { url?: string; public_id?: string; error?: string }
      if (!response.ok || !result?.url) {
        throw new Error(result?.error || 'Upload failed.')
      }

      setActionModal((prev) => ({
        ...prev,
        proofUrl: result.url ?? '',
        proofPublicId: result.public_id ?? '',
        proofFileName: file.name,
      }))
      const msg = 'Proof uploaded successfully.'
      setActionMessage({ type: 'success', text: msg })
      showSuccessToast(msg)
    } catch (err: unknown) {
      const error = err as { message?: string }
      const msg = error?.message || 'Failed to upload proof.'
      setActionMessage({ type: 'error', text: msg })
      showErrorToast(msg)
    } finally {
      setIsUploadingProof(false)
    }
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-slate-800">Encashment</h1>
        <p className="text-sm text-slate-500 mt-0.5">Review affiliate payout requests and coordinate release with accounting.</p>
      </motion.div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search reference, affiliate, email..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
          />
          <div className="flex items-center justify-end text-xs text-slate-500">
            {FILTER_LABELS[effectiveFilter] ?? 'All Requests'}
          </div>
        </div>

        {data?.counts ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">All</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{data.counts.all}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Pending</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{data.counts.pending}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Released</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{data.counts.released}</p>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
          Role: <span className="font-semibold">{role || 'staff'}</span>
          {!canApprove ? ' - Approval is restricted to accounting.' : ''}
          {!canRelease ? ' - Release is restricted to finance officer.' : ''}
        </div>
      </div>

      {actionMessage ? (
        <div
          className={`rounded-xl border p-3 text-sm ${
            actionMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {actionMessage.text}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to load encashment requests.
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
              <table className="w-full min-w-[1240px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-4 py-3 font-semibold">Reference</th>
                    <th className="px-4 py-3 font-semibold">Invoice</th>
                    <th className="px-4 py-3 font-semibold">Affiliate</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Wallet</th>
                    <th className="px-4 py-3 font-semibold">Requested</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.requests?.length ? (
                    data.requests.map((row) => {
                      const isBusy = busyId === row.id
                      const canApproveThis = canApprove && (row.status === 'pending' || row.status === 'on_hold')
                      const canRejectThis = canApprove && row.status !== 'released' && row.status !== 'rejected'
                      const canReleaseThis = canRelease && row.status === 'approved_by_admin' && (row.can_release_by_balance ?? true)

                      return (
                        <tr key={row.id} className="border-b border-slate-50 last:border-b-0">
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-slate-800">{row.reference_no}</p>
                            <p className="text-xs text-slate-500 mt-0.5 capitalize">{row.channel}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">{row.invoice_no || 'Pending'}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-800">{row.affiliate_name || 'Affiliate'}</p>
                            <p className="text-xs text-slate-500">{row.affiliate_email || 'No email'}</p>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-slate-800">{formatMoney(row.amount)}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            <p>Cash: <span className="font-semibold text-slate-800">{formatMoney(row.wallet_cash_balance ?? 0)}</span></p>
                            <p className="mt-0.5">Locked: {formatMoney(row.wallet_locked_amount ?? 0)}</p>
                            <p className="mt-0.5">Available: {formatMoney(row.wallet_available_amount ?? 0)}</p>
                            {(row.can_release_by_balance === false) ? (
                              <p className="mt-1 text-red-600 font-semibold">
                                Shortfall: {formatMoney(row.balance_shortfall ?? 0)}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            <p>{formatDate(row.created_at)}</p>
                            <p className="mt-0.5">Approved: {formatDate(row.approved_at)}</p>
                            <p className="mt-0.5">Released: {formatDate(row.released_at)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 rounded-full border text-xs font-semibold ${badgeClass(row.status)}`}>
                              {row.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedRow(row)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50"
                              >
                                View
                              </button>
                              {row.proof_url ? (
                                <a
                                  href={row.proof_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                >
                                  Proof
                                </a>
                              ) : null}
                              <button
                                disabled={isBusy || !canApproveThis}
                                onClick={() => openActionModal('approve', row.id)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                disabled={isBusy || !canReleaseThis}
                                onClick={() => openActionModal('release', row.id)}
                                title={row.can_release_by_balance === false ? 'Insufficient affiliate cash balance.' : undefined}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white disabled:opacity-50"
                              >
                                Release
                              </button>
                              <button
                                disabled={isBusy || !canRejectThis}
                                onClick={() => openActionModal('reject', row.id)}
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
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                        No encashment requests found.
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

      {selectedRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Encashment Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedRow.reference_no}</p>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Status</p>
                  <span className={`mt-1 inline-flex px-2 py-1 rounded-full border text-xs font-semibold ${badgeClass(selectedRow.status)}`}>
                    {selectedRow.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Amount</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{formatMoney(selectedRow.amount)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Wallet Cash</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{formatMoney(selectedRow.wallet_cash_balance ?? 0)}</p>
                  <p className="mt-0.5 text-xs text-slate-600">Locked: {formatMoney(selectedRow.wallet_locked_amount ?? 0)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Release Check</p>
                  <p className={`mt-1 text-sm font-bold ${(selectedRow.can_release_by_balance ?? true) ? 'text-emerald-700' : 'text-red-700'}`}>
                    {(selectedRow.can_release_by_balance ?? true) ? 'Ready' : 'Insufficient'}
                  </p>
                  {(selectedRow.can_release_by_balance === false) ? (
                    <p className="mt-0.5 text-xs text-red-600">Shortfall: {formatMoney(selectedRow.balance_shortfall ?? 0)}</p>
                  ) : (
                    <p className="mt-0.5 text-xs text-slate-600">Available: {formatMoney(selectedRow.wallet_available_amount ?? 0)}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Affiliate</p>
                  <p className="mt-1 text-slate-800">{selectedRow.affiliate_name || 'Affiliate'}</p>
                  <p className="text-slate-500">{selectedRow.affiliate_email || 'No email'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payout Channel</p>
                  <p className="mt-1 text-slate-800 uppercase">{selectedRow.channel}</p>
                  <p className="text-slate-500">{selectedRow.account_name || 'No account name'}</p>
                  <p className="text-slate-500">{selectedRow.account_number || 'No account number'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-slate-100 px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reference No</p>
                  <p className="mt-1 text-slate-800">{selectedRow.reference_no}</p>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice No</p>
                  <p className="mt-1 text-slate-800">{selectedRow.invoice_no || 'Pending'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 px-3 py-2.5 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                <p className="mt-1 text-slate-700">{selectedRow.notes || 'No customer notes.'}</p>
                {selectedRow.admin_notes ? <p className="mt-2 text-slate-700">Admin: {selectedRow.admin_notes}</p> : null}
                {selectedRow.accounting_notes ? <p className="mt-1 text-slate-700">Accounting: {selectedRow.accounting_notes}</p> : null}
                {selectedRow.proof_url ? (
                  <a
                    href={selectedRow.proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    View Release Proof
                  </a>
                ) : null}
              </div>

              <div className="rounded-xl border border-slate-100 px-3 py-2.5 text-xs text-slate-600 space-y-1">
                <p>Requested: {formatDate(selectedRow.created_at)}</p>
                <p>Approved: {formatDate(selectedRow.approved_at)}</p>
                <p>Released: {formatDate(selectedRow.released_at)}</p>
                <p>Updated: {formatDate(selectedRow.updated_at)}</p>
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
                <h2 className="text-base font-bold text-slate-800">{getActionTitle(actionModal.action)}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Add approval note for audit trail.</p>
              </div>
              <button
                onClick={closeActionModal}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approval Note</label>
              <textarea
                value={actionModal.notes}
                onChange={(e) => setActionModal((prev) => ({ ...prev, notes: e.target.value }))}
                rows={5}
                placeholder="Write clear reason/details (minimum 5 characters)..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
              />
              {actionModal.action === 'release' ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release Screenshot Proof (required)</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      void handleProofUpload(file)
                    }}
                    className="block w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                  />
                  {isUploadingProof ? <p className="text-xs text-slate-500">Uploading proof...</p> : null}
                  {actionModal.proofUrl ? (
                    <a
                      href={actionModal.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      Proof uploaded: {actionModal.proofFileName || 'View file'}
                    </a>
                  ) : null}
                </div>
              ) : null}
              <p className="text-xs text-slate-500">
                Note is required. This will be visible in encashment details for audit and tracking.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                onClick={closeActionModal}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleActionConfirm}
                disabled={busyId === actionModal.id || isUploadingProof}
                className={`rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-60 ${getActionButtonClass(actionModal.action)}`}
              >
                {isUploadingProof ? 'Uploading proof...' : busyId === actionModal.id ? 'Processing...' : getActionButtonLabel(actionModal.action)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
