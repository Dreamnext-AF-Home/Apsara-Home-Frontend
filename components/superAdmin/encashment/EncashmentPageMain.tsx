'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

/* â”€â”€â”€ config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const FILTER_LABELS: Record<string, string> = {
  all:               'All Requests',
  pending:           'Pending',
  released:          'Released',
  approved_by_admin: 'Approved by Admin',
  rejected:          'Rejected',
  on_hold:           'On Hold',
}

const STATUS_CONFIG: Record<AdminEncashmentStatus, { dot: string; badge: string; label: string }> = {
  pending:           { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200',     label: 'Pending'           },
  approved_by_admin: { dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700 border-blue-200',        label: 'Approved by Admin' },
  released:          { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Released'        },
  rejected:          { dot: 'bg-red-400',     badge: 'bg-red-50 text-red-700 border-red-200',           label: 'Rejected'          },
  on_hold:           { dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border-slate-300',    label: 'On Hold'           },
}

type ActionType = 'approve' | 'release' | 'reject'

/* â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value || 0)

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(d)
}

const getInitials = (name?: string | null) => {
  if (!name) return '?'
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

/* â”€â”€â”€ stat card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function StatCard({ label, value, bg, text, border, icon }: {
  label: string; value: number; bg: string; text: string; border: string; icon: React.ReactNode
}) {
  return (
    <div className={`bg-white border ${border} rounded-2xl p-4 dark:bg-slate-900`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`h-9 w-9 rounded-xl ${bg} ${text} flex items-center justify-center shrink-0`}>{icon}</div>
        <p className="text-[11px] text-slate-400 font-medium leading-tight">{label}</p>
      </div>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
  )
}

/* â”€â”€â”€ detail modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function DetailModal({ item, onClose, onAction, canApprove, canRelease }: {
  item: AdminEncashmentItem
  onClose: () => void
  onAction: (action: ActionType, id: number) => void
  canApprove: boolean
  canRelease: boolean
}) {
  const cfg = STATUS_CONFIG[item.status]
  const canApproveThis = canApprove && (item.status === 'pending' || item.status === 'on_hold')
  const canRejectThis  = canApprove && item.status !== 'released' && item.status !== 'rejected'
  const canReleaseThis = canRelease && item.status === 'approved_by_admin' && (item.can_release_by_balance ?? true)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white z-10 dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {getInitials(item.affiliate_name)}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">{item.affiliate_name || 'Affiliate'}</h2>
              <p className="text-xs text-slate-400">{item.reference_no} Â· {item.affiliate_email || 'No email'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto space-y-4">
          {/* Amount + balance row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 dark:border-teal-900/30 dark:bg-teal-500/10">
              <p className="text-[10px] text-teal-600 font-semibold uppercase tracking-wide">Gross Request</p>
              <p className="text-lg font-bold text-teal-700 mt-1">{formatMoney(item.amount)}</p>
              <p className="text-xs text-teal-600 mt-1">Net payout: {formatMoney(item.net_amount ?? item.amount)}</p>
            </div>
            <div className={`rounded-xl border px-4 py-3 ${
              (item.can_release_by_balance ?? true)
                ? 'bg-emerald-50 border-emerald-100'
                : 'bg-red-50 border-red-100'
            }`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${(item.can_release_by_balance ?? true) ? 'text-emerald-600' : 'text-red-500'}`}>
                Release Check
              </p>
              <p className={`text-sm font-bold mt-1 ${(item.can_release_by_balance ?? true) ? 'text-emerald-700' : 'text-red-700'}`}>
                {(item.can_release_by_balance ?? true) ? 'Ready to Release' : 'Insufficient Balance'}
              </p>
              {item.can_release_by_balance === false && (
                <p className="text-xs text-red-500 mt-0.5">Shortfall: {formatMoney(item.balance_shortfall ?? 0)}</p>
              )}
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Invoice No',     value: item.invoice_no || 'Pending'          },
              { label: 'Payout Channel', value: (item.channel || '').toUpperCase()    },
              { label: 'Account Name',   value: item.account_name || 'Not provided'   },
              { label: 'Account No',     value: item.account_number || 'Not provided' },
              { label: 'Cash Balance',   value: formatMoney(item.wallet_cash_balance ?? 0) },
              { label: 'Locked',         value: formatMoney(item.wallet_locked_amount ?? 0) },
              { label: 'Available',      value: formatMoney(item.wallet_available_amount ?? 0) },
              { label: 'Withholding Tax', value: formatMoney(item.withholding_tax ?? 0) },
              { label: 'Processing Fee',  value: formatMoney(item.processing_fee ?? 0) },
              { label: 'Net Payout',      value: formatMoney(item.net_amount ?? item.amount) },
              { label: 'Requested',      value: formatDate(item.created_at) },
              { label: 'Approved',       value: formatDate(item.approved_at) },
              { label: 'Released',       value: formatDate(item.released_at) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-700 mt-1">{value}</p>
              </div>
            ))}
          </div>

          {/* Notes */}
          {(item.notes || item.admin_notes || item.accounting_notes) && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 space-y-1.5 dark:border-slate-800 dark:bg-slate-950">
              {item.notes && (
                <p className="text-sm text-slate-700">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mr-2">Member:</span>
                  {item.notes}
                </p>
              )}
              {item.admin_notes && (
                <p className="text-sm text-slate-700">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mr-2">Admin:</span>
                  {item.admin_notes}
                </p>
              )}
              {item.accounting_notes && (
                <p className="text-sm text-slate-700">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mr-2">Accounting:</span>
                  {item.accounting_notes}
                </p>
              )}
            </div>
          )}

          {/* Proof */}
          {item.proof_url && (
            <a
              href={item.proof_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 transition-all hover:bg-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-500/10"
            >
              <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700">View Release Proof</p>
                <p className="text-[11px] text-emerald-600">Uploaded screenshot</p>
              </div>
            </a>
          )}
        </div>

        {/* Footer */}
        {(canApproveThis || canRejectThis || canReleaseThis) && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 dark:border-slate-800">
            {canRejectThis && (
              <button
                onClick={() => { onClose(); onAction('reject', item.id) }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all"
              >
                Reject
              </button>
            )}
            {canApproveThis && (
              <button
                onClick={() => { onClose(); onAction('approve', item.id) }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all"
              >
                Approve
              </button>
            )}
            {canReleaseThis && (
              <button
                onClick={() => { onClose(); onAction('release', item.id) }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
              >
                Release
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}

/* â”€â”€â”€ action modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const ACTION_META = {
  approve: { title: 'Approve Request',   icon: 'bg-blue-50 text-blue-600',    btn: 'bg-blue-600 hover:bg-blue-700',       label: 'Confirm Approval'  },
  release: { title: 'Release Request',   icon: 'bg-emerald-50 text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700', label: 'Confirm Release'   },
  reject:  { title: 'Reject Request',   icon: 'bg-red-50 text-red-500',      btn: 'bg-red-500 hover:bg-red-600',         label: 'Confirm Rejection' },
}

function ActionModal({ action, busy, uploading, notes, proofUrl, proofFileName, onNotes, onFileChange, onConfirm, onClose }: {
  action: ActionType; busy: boolean; uploading: boolean; notes: string; proofUrl: string; proofFileName: string
  onNotes: (v: string) => void; onFileChange: (f: File) => void; onConfirm: () => void; onClose: () => void
}) {
  const meta = ACTION_META[action]
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white z-10 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${meta.icon}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {action === 'approve' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
              {action === 'release' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />}
              {action === 'reject'  && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />}
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-800">{meta.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Note required for audit trail.</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              Approval Note <span className="text-red-400">*</span>
            </label>
            <textarea
              value={notes}
              onChange={e => onNotes(e.target.value)}
              rows={4}
              placeholder="Write clear reason / details (min 5 characters)â€¦"
              className="w-full rounded-[18px] border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all focus:border-sky-400 dark:border-white/18 dark:bg-white/12 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-sky-400/60 resize-none"
            />
          </div>

          {action === 'release' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                Release Screenshot Proof <span className="text-red-400">*</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 cursor-pointer transition-all hover:border-sky-400 hover:bg-sky-50/30 dark:border-slate-700 dark:hover:bg-slate-800/40">
                <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-600">
                    {proofFileName || 'Click to upload screenshot'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WebP accepted</p>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={e => { const f = e.target.files?.[0]; if (f) onFileChange(f) }}
                  className="sr-only"
                />
              </label>
              {uploading && (
                <p className="text-xs text-teal-600 mt-1.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                  Uploading proofâ€¦
                </p>
              )}
              {proofUrl && !uploading && (
                <a
                  href={proofUrl} target="_blank" rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Proof uploaded â€” view file
                </a>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-[18px] border border-gray-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 dark:border-white/18 dark:text-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy || uploading}
            className={`flex-1 rounded-[18px] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 transition-all ${meta.btn}`}
          >
            {uploading ? 'Uploadingâ€¦' : busy ? 'Processingâ€¦' : meta.label}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* â”€â”€â”€ main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface Props { initialFilter?: string }

export default function EncashmentPageMain({ initialFilter = 'all' }: Props) {
  const { data: session } = useSession()
  const role       = (session?.user?.role ?? '').toLowerCase()
  const canApprove = role === 'accounting'
  const canRelease = role === 'finance_officer' || role === 'super_admin'

  const [search,      setSearch]      = useState('')
  const [page,        setPage]        = useState(1)
  const [busyId,      setBusyId]      = useState<number | null>(null)
  const [selectedRow, setSelectedRow] = useState<AdminEncashmentItem | null>(null)
  const [isUploadingProof, setIsUploadingProof] = useState(false)
  const [actionModal, setActionModal] = useState<{
    open: boolean; action: ActionType; id: number | null
    notes: string; proofUrl: string; proofPublicId: string; proofFileName: string
  }>({ open: false, action: 'approve', id: null, notes: '', proofUrl: '', proofPublicId: '', proofFileName: '' })

  const effectiveFilter = useMemo(() => {
    const normalized = initialFilter.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
    const aliases: Record<string, string> = { all_requests: 'all', approved: 'approved_by_admin', hold: 'on_hold' }
    const mapped    = aliases[normalized] ?? normalized
    const supported = ['all', 'pending', 'released', 'approved_by_admin', 'rejected', 'on_hold']
    return supported.includes(mapped) ? mapped : 'all'
  }, [initialFilter])

  const { data, isLoading, isFetching, isError } = useGetAdminEncashmentRequestsQuery({
    filter: effectiveFilter, search: search.trim() || undefined, page, perPage: 20,
  })

  const [approveRequest] = useApproveAdminEncashmentMutation()
  const [rejectRequest]  = useRejectAdminEncashmentMutation()
  const [releaseRequest] = useReleaseAdminEncashmentMutation()

  const openActionModal = (action: ActionType, id: number) =>
    setActionModal({ open: true, action, id, notes: '', proofUrl: '', proofPublicId: '', proofFileName: '' })

  const closeActionModal = () => {
    setActionModal(prev => ({ ...prev, open: false, id: null, notes: '', proofUrl: '', proofPublicId: '', proofFileName: '' }))
    setIsUploadingProof(false)
  }

  const handleProofUpload = async (file: File) => {
    setIsUploadingProof(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'encashment')
      const response = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const result   = (await response.json()) as { url?: string; public_id?: string; error?: string }
      if (!response.ok || !result?.url) throw new Error(result?.error || 'Upload failed.')
      setActionModal(prev => ({
        ...prev, proofUrl: result.url ?? '', proofPublicId: result.public_id ?? '', proofFileName: file.name,
      }))
      showSuccessToast('Proof uploaded successfully.')
    } catch (err: unknown) {
      showErrorToast((err as { message?: string })?.message || 'Failed to upload proof.')
    } finally {
      setIsUploadingProof(false)
    }
  }

  const handleActionConfirm = async () => {
    const id    = actionModal.id
    const notes = actionModal.notes.trim()
    if (!id) return
    if (notes.length < 5) { showErrorToast('Action note is required (minimum 5 characters).'); return }
    if (actionModal.action === 'release' && !actionModal.proofUrl) {
      showErrorToast('Screenshot proof is required before release.'); return
    }
    setBusyId(id)
    try {
      if (actionModal.action === 'approve') {
        await approveRequest({ id, notes }).unwrap()
        showSuccessToast('Request approved successfully.')
      } else if (actionModal.action === 'release') {
        await releaseRequest({ id, notes, proof_url: actionModal.proofUrl, proof_public_id: actionModal.proofPublicId || undefined }).unwrap()
        showSuccessToast('Request released successfully.')
      } else {
        await rejectRequest({ id, notes }).unwrap()
        showSuccessToast('Request rejected successfully.')
      }
      closeActionModal()
    } catch (err: unknown) {
      const fallback = actionModal.action === 'approve' ? 'Failed to approve.' : actionModal.action === 'release' ? 'Failed to release.' : 'Failed to reject.'
      showErrorToast((err as { data?: { message?: string } })?.data?.message || fallback)
    } finally {
      setBusyId(null)
    }
  }

  const counts = data?.counts

  return (
    <div className="space-y-6">
      {/* â”€â”€ Header â”€â”€ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-xl font-bold text-slate-800">Encashment</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review affiliate payout requests and coordinate release with accounting</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border ${
            canApprove || canRelease ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${canApprove || canRelease ? 'bg-teal-500' : 'bg-slate-400'}`} />
            {role || 'staff'}
          </span>
          <button className="flex items-center gap-2 rounded-[18px] border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 dark:border-white/18 dark:bg-white/12 dark:text-slate-200">
            <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </motion.div>

      {/* â”€â”€ Stat Cards â”€â”€ */}
      {counts && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <StatCard label="All Requests" value={counts.all}      bg="bg-slate-100"  text="text-slate-600"   border="border-slate-200"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          />
          <StatCard label="Pending"      value={counts.pending}  bg="bg-amber-50"   text="text-amber-600"   border="border-amber-100"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="Released"     value={counts.released} bg="bg-emerald-50" text="text-emerald-600" border="border-emerald-100"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
          />
        </motion.div>
      )}

      {/* â”€â”€ Toolbar â”€â”€ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center gap-3 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="relative flex-1 min-w-50">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search reference, affiliate, emailâ€¦"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 bg-slate-50 text-slate-700 placeholder-slate-400 transition"
          />
        </div>
        <span className="text-xs text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full font-medium ml-auto">
          {FILTER_LABELS[effectiveFilter] ?? 'All Requests'}
        </span>
      </motion.div>

      {/* â”€â”€ Error â”€â”€ */}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Failed to load encashment requests.
        </div>
      )}

      {/* â”€â”€ Loading â”€â”€ */}
      {isLoading ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="h-4 w-32 bg-slate-100 rounded-lg" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/70 dark:divide-slate-800/70">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-36 bg-slate-100 rounded" />
                  <div className="h-2.5 w-24 bg-slate-100 rounded" />
                </div>
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
                <div className="h-7 w-16 bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          {isFetching && (
            <div className="google-loading-bar" />
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-800">Encashment Requests</h2>
              <span className="text-xs text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full font-medium dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {data?.requests?.length ?? 0} shown
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-310">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                    {['Reference', 'Affiliate', 'Amount', 'Wallet', 'Dates', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 dark:divide-slate-800/70">
                  {data?.requests?.length ? (
                    data.requests.map(row => {
                      const isBusy        = busyId === row.id
                      const canApproveThis = canApprove && (row.status === 'pending' || row.status === 'on_hold')
                      const canRejectThis  = canApprove && row.status !== 'released' && row.status !== 'rejected'
                      const canReleaseThis = canRelease && row.status === 'approved_by_admin' && (row.can_release_by_balance ?? true)
                      const cfg = STATUS_CONFIG[row.status]

                      return (
                        <tr key={row.id} className="hover:bg-slate-50/70 transition-colors dark:hover:bg-slate-800/40">
                          {/* Reference */}
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-semibold text-slate-800">{row.reference_no}</p>
                            <p className="text-xs text-slate-400 mt-0.5 capitalize">{row.channel}</p>
                            <p className="text-xs text-slate-400">{row.invoice_no || 'Invoice pending'}</p>
                          </td>

                          {/* Affiliate */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {getInitials(row.affiliate_name)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{row.affiliate_name || 'Affiliate'}</p>
                                <p className="text-xs text-slate-400">{row.affiliate_email || 'No email'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-bold text-slate-800">{formatMoney(row.amount)}</p>
                            <p className="text-[11px] text-slate-400">Net: {formatMoney(row.net_amount ?? row.amount)}</p>
                            <p className="text-[11px] text-slate-400">
                              Tax/Fee: {formatMoney((row.withholding_tax ?? 0) + (row.processing_fee ?? 0))}
                            </p>
                          </td>

                          {/* Wallet */}
                          <td className="px-4 py-3.5 text-xs text-slate-600 space-y-0.5">
                            <p>Cash: <span className="font-semibold text-slate-700">{formatMoney(row.wallet_cash_balance ?? 0)}</span></p>
                            <p>Locked: {formatMoney(row.wallet_locked_amount ?? 0)}</p>
                            <p>Avail: {formatMoney(row.wallet_available_amount ?? 0)}</p>
                            {row.can_release_by_balance === false && (
                              <p className="text-red-500 font-semibold">-{formatMoney(row.balance_shortfall ?? 0)}</p>
                            )}
                          </td>

                          {/* Dates */}
                          <td className="px-4 py-3.5 text-xs text-slate-500 space-y-0.5 whitespace-nowrap">
                            <p>{formatDate(row.created_at)}</p>
                            {row.approved_at && <p className="text-slate-400">Approved: {formatDate(row.approved_at)}</p>}
                            {row.released_at && <p className="text-slate-400">Released: {formatDate(row.released_at)}</p>}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col gap-1.5">
                              <button
                                onClick={() => setSelectedRow(row)}
                                className="rounded-[18px] border border-gray-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-slate-400 hover:bg-slate-50 dark:border-white/18 dark:text-slate-200 dark:hover:bg-white/10"
                              >
                                View
                              </button>
                              {row.proof_url && (
                                <a
                                  href={row.proof_url} target="_blank" rel="noreferrer"
                                  className="rounded-[18px] border border-emerald-200 px-3 py-1.5 text-center text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                                >
                                  Proof
                                </a>
                              )}
                              {canApproveThis && (
                                <button
                                  disabled={isBusy}
                                  onClick={() => openActionModal('approve', row.id)}
                                  className="rounded-[18px] border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-100 disabled:opacity-50 dark:border-blue-900/30 dark:bg-blue-500/10 dark:text-blue-300"
                                >
                                  Approve
                                </button>
                              )}
                              {canReleaseThis && (
                                <button
                                  disabled={isBusy}
                                  onClick={() => openActionModal('release', row.id)}
                                  className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                                >
                                  Release
                                </button>
                              )}
                              {canRejectThis && (
                                <button
                                  disabled={isBusy}
                                  onClick={() => openActionModal('reject', row.id)}
                                  className="rounded-[18px] border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50 dark:border-red-900/30 dark:bg-red-500/10 dark:text-red-300"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-14 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm font-semibold text-slate-500">No encashment requests found</p>
                          <p className="text-xs text-slate-400">Try adjusting your search or filter</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 dark:border-slate-800 dark:text-slate-300">
              <span>
                Showing{' '}
                <span className="font-semibold text-slate-600">{data?.meta?.from ?? 0}â€“{data?.meta?.to ?? 0}</span>
                {' '}of <span className="font-semibold text-slate-600">{data?.meta?.total ?? 0}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={(data?.meta?.current_page ?? 1) <= 1}
                  className="rounded-[18px] border border-gray-300 px-3 py-1.5 text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-40 dark:border-white/18 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Prev
                </button>
                <span className="px-2">{data?.meta?.current_page ?? 1} / {data?.meta?.last_page ?? 1}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={(data?.meta?.current_page ?? 1) >= (data?.meta?.last_page ?? 1)}
                  className="rounded-[18px] border border-gray-300 px-3 py-1.5 text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-40 dark:border-white/18 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* â”€â”€ Detail Modal â”€â”€ */}
      <AnimatePresence>
        {selectedRow && (
          <DetailModal
            item={selectedRow}
            onClose={() => setSelectedRow(null)}
            onAction={openActionModal}
            canApprove={canApprove}
            canRelease={canRelease}
          />
        )}
      </AnimatePresence>

      {/* â”€â”€ Action Modal â”€â”€ */}
      <AnimatePresence>
        {actionModal.open && (
          <ActionModal
            action={actionModal.action}
            busy={busyId === actionModal.id}
            uploading={isUploadingProof}
            notes={actionModal.notes}
            proofUrl={actionModal.proofUrl}
            proofFileName={actionModal.proofFileName}
            onNotes={v => setActionModal(prev => ({ ...prev, notes: v }))}
            onFileChange={handleProofUpload}
            onConfirm={handleActionConfirm}
            onClose={closeActionModal}
          />
        )}
      </AnimatePresence>
    </div>
  )
}


