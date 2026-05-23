'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
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
import AvatarImg from '@/components/superAdmin/AvatarImg'

/* ── constants ── */

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

const STATUS_CONFIG: Record<AdminEncashmentStatus, { dot: string; badge: string; label: string }> = {
  pending:           { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',         label: 'Pending'          },
  approved_by_admin: { dot: 'bg-sky-400',     badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30',                   label: 'Ready to Release' },
  released:          { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30', label: 'Released'         },
  rejected:          { dot: 'bg-red-400',     badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',                   label: 'Rejected'         },
  on_hold:           { dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600',          label: 'On Hold'          },
}

const CHANNEL_PILL: Record<string, string> = {
  gcash: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/30',
  maya:  'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/30',
  bank:  'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30',
}

const FILTER_NAV = [
  { key: 'all',               label: 'All Requests',      href: '/admin/encashment',                   color: 'bg-slate-700 text-white',                         countKey: 'all'               },
  { key: 'pending',           label: 'Queue / Pending',   href: '/admin/encashment/pending',            color: 'bg-amber-500 text-white shadow-amber-500/30',     countKey: 'pending'           },
  { key: 'approved_by_admin', label: 'Ready for Release', href: '/admin/encashment/approved_by_admin',  color: 'bg-sky-600 text-white shadow-sky-500/30',         countKey: 'approved_by_admin' },
  { key: 'released',          label: 'Released',          href: '/admin/encashment/released',           color: 'bg-emerald-600 text-white shadow-emerald-500/30', countKey: 'released'          },
  { key: 'rejected',          label: 'Rejected',          href: '/admin/encashment/rejected',           color: 'bg-red-500 text-white shadow-red-500/30',         countKey: 'rejected'          },
  { key: 'on_hold',           label: 'Failed / On Hold',  href: '/admin/encashment/on_hold',            color: 'bg-slate-500 text-white',                         countKey: 'on_hold'           },
] as const

type ActionType = 'approve' | 'release' | 'reject'

/* ── helpers ── */

const formatMoney = (v: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(v || 0)

const formatDate = (v?: string | null) => {
  if (!v) return 'N/A'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d)
}

const formatDateShort = (v?: string | null) => {
  if (!v) return 'N/A'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

const getInitials = (name?: string | null) => {
  if (!name) return '?'
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

type PayoutMeta = {
  method_type?: string | null; mobile_number?: string | null; email?: string | null
  bank_name?: string | null; bank_code?: string | null; account_type?: string | null
  card_holder_name?: string | null; card_brand?: string | null; card_last4?: string | null
}

const parsePayoutMeta = (notes?: string | null): PayoutMeta | null => {
  const match = notes?.match(/(?:^|\n)PAYOUT_META:(\{.*?\})(?:\n|$)/)
  if (!match?.[1]) return null
  try { return JSON.parse(match[1]) as PayoutMeta } catch { return null }
}

const cleanMemberNotes = (notes?: string | null) => {
  if (!notes) return ''
  return notes
    .split('\n')
    .filter(l => !l.trim().startsWith('PAYOUT_META:'))
    .filter(l => !l.trim().startsWith('KYC_REFERENCE:'))
    .filter(l => !l.trim().startsWith('Combined verification and encashment request submitted by member.'))
    .join('\n').trim()
}

const fmtMeta = (v?: string | null) => v ? v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

/* ── detail modal ── */

function DetailModal({ item, onClose, onAction, canApprove, canRelease }: {
  item: AdminEncashmentItem; onClose: () => void
  onAction: (a: ActionType, id: number) => void; canApprove: boolean; canRelease: boolean
}) {
  const cfg            = STATUS_CONFIG[item.status]
  const canApproveThis = canApprove && (item.status === 'pending' || item.status === 'on_hold')
  const canRejectThis  = canApprove && item.status !== 'released' && item.status !== 'rejected'
  const canReleaseThis = canRelease && item.status === 'approved_by_admin' && (item.can_release_by_balance ?? true)
  const payoutMeta     = parsePayoutMeta(item.notes)
  const memberNotes    = cleanMemberNotes(item.notes)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 shadow-2xl z-10"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AvatarImg src={item.affiliate_avatar} name={item.affiliate_name ?? ''} size="h-10 w-10" bg="bg-gradient-to-br from-teal-400 to-teal-600" textSize="text-sm" />
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.affiliate_name || 'Affiliate'}</h2>
              <p className="text-xs text-slate-400">{item.reference_no} · {item.affiliate_email || 'No email'}</p>
              {item.affiliate_tier && TIER_BADGE[item.affiliate_tier] && (
                <img src={TIER_BADGE[item.affiliate_tier]} alt={item.affiliate_tier} title={item.affiliate_tier} className="mt-1 h-6 w-auto object-contain" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} /> {cfg.label}
            </span>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 dark:border-teal-900/30 dark:bg-teal-500/10">
              <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold uppercase tracking-wide">Gross Request</p>
              <p className="text-lg font-bold text-teal-700 dark:text-teal-300 mt-1">{formatMoney(item.amount)}</p>
              <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">Net payout: {formatMoney(item.net_amount ?? item.amount)}</p>
            </div>
            <div className={`rounded-xl border px-4 py-3 ${(item.can_release_by_balance ?? true) ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-red-50 border-red-100 dark:bg-red-500/10 dark:border-red-500/20'}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${(item.can_release_by_balance ?? true) ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>Release Check</p>
              <p className={`text-sm font-bold mt-1 ${(item.can_release_by_balance ?? true) ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                {(item.can_release_by_balance ?? true) ? 'Ready to Release' : 'Insufficient Balance'}
              </p>
              {item.can_release_by_balance === false && (
                <p className="text-xs text-red-500 mt-0.5">Shortfall: {formatMoney(item.balance_shortfall ?? 0)}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Invoice No',      value: item.invoice_no || 'Pending'                  },
              { label: 'Payout Channel',  value: (item.channel || '').toUpperCase()            },
              { label: 'Account Name',    value: item.account_name || 'Not provided'           },
              { label: 'Account No',      value: item.account_number || 'Not provided'         },
              { label: 'Cash Balance',    value: formatMoney(item.wallet_cash_balance ?? 0)    },
              { label: 'Locked',          value: formatMoney(item.wallet_locked_amount ?? 0)   },
              { label: 'Available',       value: formatMoney(item.wallet_available_amount ?? 0)},
              { label: 'Withholding Tax', value: formatMoney(item.withholding_tax ?? 0)        },
              { label: 'Processing Fee',  value: formatMoney(item.processing_fee ?? 0)         },
              { label: 'Net Payout',      value: formatMoney(item.net_amount ?? item.amount)   },
              { label: 'Requested',       value: formatDate(item.created_at)                   },
              { label: 'Approved',        value: formatDate(item.approved_at)                  },
              { label: 'Released',        value: formatDate(item.released_at)                  },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-1">{value}</p>
              </div>
            ))}
          </div>

          {(memberNotes || payoutMeta || item.admin_notes || item.accounting_notes) && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 space-y-1.5 dark:border-slate-800 dark:bg-slate-950">
              {memberNotes && (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mr-2">Member:</span>{memberNotes}
                </p>
              )}
              {payoutMeta && (
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mr-2">Payout Details:</span>
                  <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {payoutMeta.method_type      && <p>Method: <span className="font-semibold">{fmtMeta(payoutMeta.method_type)}</span></p>}
                    {payoutMeta.mobile_number    && <p>Mobile: <span className="font-semibold">{payoutMeta.mobile_number}</span></p>}
                    {payoutMeta.email            && <p>Email: <span className="font-semibold">{payoutMeta.email}</span></p>}
                    {payoutMeta.bank_name        && <p>Bank: <span className="font-semibold">{payoutMeta.bank_name}</span></p>}
                    {payoutMeta.bank_code        && <p>Bank Code: <span className="font-semibold">{payoutMeta.bank_code}</span></p>}
                    {payoutMeta.account_type     && <p>Account Type: <span className="font-semibold">{fmtMeta(payoutMeta.account_type)}</span></p>}
                    {payoutMeta.card_holder_name && <p>Card Holder: <span className="font-semibold">{payoutMeta.card_holder_name}</span></p>}
                    {payoutMeta.card_brand       && <p>Card Brand: <span className="font-semibold">{fmtMeta(payoutMeta.card_brand)}</span></p>}
                    {payoutMeta.card_last4       && <p>Card Last 4: <span className="font-semibold">{payoutMeta.card_last4}</span></p>}
                  </div>
                </div>
              )}
              {item.admin_notes      && <p className="text-sm text-slate-700 dark:text-slate-300"><span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mr-2">Admin:</span>{item.admin_notes}</p>}
              {item.accounting_notes && <p className="text-sm text-slate-700 dark:text-slate-300"><span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mr-2">Accounting:</span>{item.accounting_notes}</p>}
            </div>
          )}

          {item.proof_url && (
            <a href={item.proof_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 hover:bg-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-500/10 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">View Release Proof</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Uploaded screenshot</p>
              </div>
            </a>
          )}
        </div>

        {(canApproveThis || canRejectThis || canReleaseThis) && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            {canRejectThis && (
              <button onClick={() => { onClose(); onAction('reject', item.id) }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
                Reject
              </button>
            )}
            {canApproveThis && (
              <button onClick={() => { onClose(); onAction('approve', item.id) }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors">
                Approve
              </button>
            )}
            {canReleaseThis && (
              <button onClick={() => { onClose(); onAction('release', item.id) }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
                Release
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}

/* ── action modal ── */

const ACTION_META = {
  approve: { title: 'Approve Request', iconBg: 'bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400',       btn: 'bg-sky-600 hover:bg-sky-700',         label: 'Confirm Approval'  },
  release: { title: 'Release Payout',  iconBg: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-700', label: 'Confirm Release'   },
  reject:  { title: 'Reject Request',  iconBg: 'bg-red-50 dark:bg-red-500/15 text-red-500 dark:text-red-400',       btn: 'bg-red-500 hover:bg-red-600',         label: 'Confirm Rejection' },
}

function ActionModal({ action, busy, uploading, notes, proofUrl, proofFileName, onNotes, onFileChange, onConfirm, onClose }: {
  action: ActionType; busy: boolean; uploading: boolean; notes: string; proofUrl: string; proofFileName: string
  onNotes: (v: string) => void; onFileChange: (f: File) => void; onConfirm: () => void; onClose: () => void
}) {
  const meta = ACTION_META[action]
  const noteLabel = action === 'reject' ? 'Reject Reason' : action === 'release' ? 'Release Note' : 'Approval Note'
  const noteRequired = action !== 'approve'
  const noteHint = action === 'reject' ? 'Reason is required to notify the member.' : action === 'release' ? 'Note required for audit trail.' : 'Optional note for audit trail.'
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 shadow-2xl z-10"
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${meta.iconBg}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {action === 'approve' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
              {action === 'release' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />}
              {action === 'reject'  && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />}
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{meta.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{noteHint}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
              {noteLabel} {noteRequired ? <span className="text-red-400">*</span> : null}
            </label>
            <textarea
              value={notes} onChange={e => onNotes(e.target.value)} rows={4}
              placeholder={action === 'approve' ? 'Optional note for this approval...' : 'Write clear reason / details (min 5 characters)...'}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-sky-400 dark:focus:border-sky-500 focus:ring-1 focus:ring-sky-400/30 resize-none transition-all"
            />
          </div>

          {action === 'release' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                Release Screenshot Proof <span className="text-red-400">*</span>
              </label>
              <label className={`flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-all ${
                uploading ? 'cursor-wait border-sky-300 bg-sky-50/60 dark:border-sky-800 dark:bg-sky-900/20'
                          : 'cursor-pointer border-slate-300 dark:border-slate-600 hover:border-sky-400 hover:bg-sky-50/30 dark:hover:bg-slate-800/40'
              }`}>
                <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center shrink-0">
                  {uploading
                    ? <span className="h-4 w-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {uploading ? 'Uploading screenshot...' : proofFileName || 'Click to upload screenshot'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {uploading ? 'Please wait, do not close this window.' : 'PNG, JPG, WebP accepted'}
                  </p>
                </div>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploading}
                  onChange={e => { const f = e.target.files?.[0]; if (f) onFileChange(f); e.currentTarget.value = '' }}
                  className="sr-only" />
              </label>
              {proofUrl && !uploading && (
                <a href={proofUrl} target="_blank" rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Proof uploaded — view file
                </a>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy || uploading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 transition-all ${meta.btn}`}>
            {uploading ? 'Uploading...' : busy ? 'Processing...' : meta.label}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ── main page ── */

interface Props { initialFilter?: string }

export default function EncashmentPageMain({ initialFilter = 'all' }: Props) {
  const { data: session } = useSession()
  const role       = (session?.user?.role ?? '').toLowerCase()
  const canApprove = role === 'accounting' || role === 'super_admin'
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
    const n = initialFilter.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
    const aliases: Record<string, string> = { all_requests: 'all', approved: 'approved_by_admin', hold: 'on_hold' }
    const mapped    = aliases[n] ?? n
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
    setActionModal(prev => ({ ...prev, proofUrl: '', proofPublicId: '', proofFileName: file.name }))
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'encashment')
      const response = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const result   = (await response.json()) as { url?: string; public_id?: string; error?: string }
      if (!response.ok || !result?.url) throw new Error(result?.error || 'Upload failed.')
      setActionModal(prev => ({ ...prev, proofUrl: result.url ?? '', proofPublicId: result.public_id ?? '', proofFileName: file.name }))
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
    if (actionModal.action === 'reject' && notes.length < 5) { showErrorToast('Reject reason is required (minimum 5 characters).'); return }
    if (actionModal.action === 'release' && notes.length < 5) { showErrorToast('Release note is required (minimum 5 characters).'); return }
    if (actionModal.action === 'release' && !actionModal.proofUrl) { showErrorToast('Screenshot proof is required before release.'); return }
    setBusyId(id)
    try {
      if (actionModal.action === 'approve') {
        await approveRequest({ id, notes: notes || undefined }).unwrap()
        showSuccessToast('Encashment approved. Status updated and member wallet debited.')
      } else if (actionModal.action === 'release') {
        await releaseRequest({ id, notes, proof_url: actionModal.proofUrl, proof_public_id: actionModal.proofPublicId || undefined }).unwrap()
        showSuccessToast('Request released successfully.')
      } else {
        await rejectRequest({ id, notes }).unwrap()
        showSuccessToast('Encashment rejected. Member has been notified.')
      }
      closeActionModal()
    } catch (err: unknown) {
      const fallback = actionModal.action === 'approve' ? 'Failed to approve.' : actionModal.action === 'release' ? 'Failed to release.' : 'Failed to reject.'
      showErrorToast((err as { data?: { message?: string } })?.data?.message || fallback)
    } finally {
      setBusyId(null)
    }
  }

  const counts = data?.counts as Record<string, number> | undefined
  const activeNav = FILTER_NAV.find(n => n.key === effectiveFilter) ?? FILTER_NAV[0]

  const pageTotal = useMemo(
    () => (data?.requests ?? []).reduce((s, r) => s + r.amount, 0),
    [data?.requests],
  )

  const handleExportCSV = () => {
    const rows = data?.requests ?? []
    if (!rows.length) return
    const ts = new Date().toISOString().slice(0, 10)
    downloadCSV(
      `encashment-${effectiveFilter}-${ts}.csv`,
      ['Reference', 'Affiliate Name', 'Email', 'Amount (PHP)', 'Net Amount (PHP)', 'Withholding Tax', 'Processing Fee', 'Channel', 'Account Name', 'Account No', 'Invoice No', 'Status', 'Requested', 'Approved', 'Released'],
      rows.map(r => [
        r.reference_no ?? '',
        r.affiliate_name ?? '',
        r.affiliate_email ?? '',
        String(r.amount ?? 0),
        String(r.net_amount ?? r.amount ?? 0),
        String(r.withholding_tax ?? 0),
        String(r.processing_fee ?? 0),
        r.channel ?? '',
        r.account_name ?? '',
        r.account_number ?? '',
        r.invoice_no ?? '',
        STATUS_CONFIG[r.status]?.label ?? r.status,
        r.created_at ?? '',
        r.approved_at ?? '',
        r.released_at ?? '',
      ]),
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 dark:from-slate-900 dark:to-black shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.12),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.04]" style={STRIPE} />
        <div className="relative px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-md bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Finance
                </span>
                {(canApprove || canRelease) && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 px-2.5 py-1 text-[10px] font-semibold text-teal-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                    {role}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Encashment Requests</h1>
              <p className="mt-0.5 text-sm text-slate-400">Review affiliate payout requests and coordinate release with accounting.</p>
            </div>
            <div className="flex items-center gap-2 self-start">
              <button
                onClick={handleExportCSV}
                disabled={!data?.requests?.length}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-40 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* KPI strip */}
          {counts && (
            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total',           value: counts['all']               ?? 0, color: 'text-white'         },
                { label: 'Pending',         value: counts['pending']           ?? 0, color: 'text-amber-300'     },
                { label: 'Ready to Release',value: counts['approved_by_admin'] ?? 0, color: 'text-sky-300'       },
                { label: 'Released',        value: counts['released']          ?? 0, color: 'text-emerald-300'   },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
                  <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Filter Nav ── */}
      <div className="flex flex-wrap gap-2">
        {FILTER_NAV.map(({ key, label, href, color, countKey }) => {
          const isActive = key === effectiveFilter
          const cnt = counts?.[countKey]
          return (
            <Link key={key} href={href}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? `${color} shadow-md`
                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}>
              {label}
              {cnt !== undefined && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  {cnt}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* ── Toolbar ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search reference, affiliate, email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 transition"
            />
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm ${activeNav.color}`}>
            {activeNav.label}
            {data?.meta?.total !== undefined && (
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-black">{data.meta.total}</span>
            )}
          </span>
        </div>
      </div>

      {/* ── Error ── */}
      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3">
          <svg className="shrink-0 h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">Failed to load encashment requests.</p>
        </div>
      )}

      {/* ── Table ── */}
      {isLoading ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 animate-pulse">
          <div className="border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-5 py-3">
            <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-36 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
                <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
                <div className="h-7 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {isFetching && <div className="google-loading-bar" />}

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm">
            {/* Card header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-500/15">
                  <svg className="h-4 w-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  {activeNav.label}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {pageTotal > 0 && (
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-400">{formatMoney(pageTotal)}</span>
                )}
                <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {data?.requests?.length ?? 0} shown
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[860px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/60 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    <th className="px-4 py-3 w-8">#</th>
                    <th className="px-4 py-3">Affiliate</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Channel / Ref</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {data?.requests?.length ? (
                    data.requests.map((row, idx) => {
                      const isBusy         = busyId === row.id
                      const canApproveThis = canApprove && (row.status === 'pending' || row.status === 'on_hold')
                      const canRejectThis  = canApprove && row.status !== 'released' && row.status !== 'rejected'
                      const canReleaseThis = canRelease && row.status === 'approved_by_admin' && (row.can_release_by_balance ?? true)
                      const cfg            = STATUS_CONFIG[row.status]
                      const channelCls     = CHANNEL_PILL[row.channel?.toLowerCase()] ?? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                      const offset         = ((page - 1) * 20) + idx + 1

                      return (
                        <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group">
                          {/* # */}
                          <td className="px-4 py-3.5 text-xs font-bold text-slate-400 dark:text-slate-600 tabular-nums">{offset}</td>

                          {/* Affiliate */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <AvatarImg src={row.affiliate_avatar} name={row.affiliate_name ?? ''} size="h-8 w-8" bg="bg-gradient-to-br from-teal-400 to-teal-600" textSize="text-[10px]" />
                              <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-none">{row.affiliate_name || 'Affiliate'}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{row.affiliate_email || 'No email'}</p>
                                {row.affiliate_tier && TIER_BADGE[row.affiliate_tier] && (
                                  <img src={TIER_BADGE[row.affiliate_tier]} alt={row.affiliate_tier} title={row.affiliate_tier} className="mt-1 h-5 w-auto object-contain" />
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-black text-slate-800 dark:text-white tabular-nums">{formatMoney(row.amount)}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Net: {formatMoney(row.net_amount ?? row.amount)}</p>
                          </td>

                          {/* Channel / Ref */}
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${channelCls}`}>
                              {row.channel}
                            </span>
                            <p className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-1">{row.reference_no}</p>
                            <p className="text-[11px] text-slate-400">{row.invoice_no || 'Invoice pending'}</p>
                          </td>

                          {/* Balance */}
                          <td className="px-4 py-3.5">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Avail: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatMoney(row.wallet_available_amount ?? 0)}</span>
                            </p>
                            {row.can_release_by_balance === false
                              ? <p className="text-[11px] font-semibold text-red-500 mt-0.5">-{formatMoney(row.balance_shortfall ?? 0)}</p>
                              : row.status === 'approved_by_admin'
                                ? <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">OK to release</p>
                                : null
                            }
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cfg.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            <p>{formatDateShort(row.created_at)}</p>
                            {row.released_at && <p className="text-emerald-600 dark:text-emerald-400 mt-0.5">Rel: {formatDateShort(row.released_at)}</p>}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              <button onClick={() => setSelectedRow(row)}
                                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                View
                              </button>
                              {row.proof_url && (
                                <a href={row.proof_url} target="_blank" rel="noreferrer"
                                  className="rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                                  Proof
                                </a>
                              )}
                              {canApproveThis && (
                                <button disabled={isBusy} onClick={() => openActionModal('approve', row.id)}
                                  className="rounded-lg border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors disabled:opacity-50">
                                  Approve
                                </button>
                              )}
                              {canReleaseThis && (
                                <button disabled={isBusy} onClick={() => openActionModal('release', row.id)}
                                  className="rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                                  Release
                                </button>
                              )}
                              {canRejectThis && (
                                <button disabled={isBusy} onClick={() => openActionModal('reject', row.id)}
                                  className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50">
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
                      <td colSpan={8}>
                        <div className="flex flex-col items-center justify-center gap-3 py-14">
                          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No requests found</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">Try adjusting your search or select a different filter</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-700/60 px-4 py-3">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-600 dark:text-slate-300">{data?.meta?.from ?? 0}–{data?.meta?.to ?? 0}</span>
                {' '}of{' '}
                <span className="font-semibold text-slate-600 dark:text-slate-300">{data?.meta?.total ?? 0}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={(data?.meta?.current_page ?? 1) <= 1}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40">
                  Prev
                </button>
                <span className="rounded-lg bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300">
                  {data?.meta?.current_page ?? 1} / {data?.meta?.last_page ?? 1}
                </span>
                <button onClick={() => setPage(p => p + 1)}
                  disabled={(data?.meta?.current_page ?? 1) >= (data?.meta?.last_page ?? 1)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selectedRow && (
          <DetailModal item={selectedRow} onClose={() => setSelectedRow(null)}
            onAction={openActionModal} canApprove={canApprove} canRelease={canRelease} />
        )}
      </AnimatePresence>

      {/* ── Action Modal ── */}
      <AnimatePresence>
        {actionModal.open && (
          <ActionModal
            action={actionModal.action} busy={busyId === actionModal.id} uploading={isUploadingProof}
            notes={actionModal.notes} proofUrl={actionModal.proofUrl} proofFileName={actionModal.proofFileName}
            onNotes={v => setActionModal(prev => ({ ...prev, notes: v }))}
            onFileChange={handleProofUpload} onConfirm={handleActionConfirm} onClose={closeActionModal}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
