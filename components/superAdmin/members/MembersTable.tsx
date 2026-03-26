'use client'

import { Member } from "@/types/members/types"
import { motion, AnimatePresence } from "framer-motion"
import MembersStatusBadge from "./MembersStatusBadge"
import TierBadge from "@/components/ui/TierBadge"
import { useEffect, useRef, useState } from "react"
import AdminPagination from '@/components/superAdmin/AdminPagination'
import { MemberStatus, MemberTier } from "@/types/members/types"
import { useUpdateMemberMutation } from "@/store/api/membersApi"
import { createPortal } from "react-dom"

const avatarColors = [
  'bg-teal-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500',
  'bg-orange-500', 'bg-green-500', 'bg-indigo-500', 'bg-rose-500',
]
const getAvatarColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length]
const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

interface EditMemberForm {
  id: number
  name: string
  username: string
  email: string
  contactNumber: string
  status: MemberStatus
  tier: MemberTier
  addressLine: string
  barangay: string
  city: string
  province: string
  region: string
  zipCode: string
}

type ApiErrorShape = {
  data?: {
    message?: string
    errors?: Record<string, string[] | string>
  }
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiErrorShape
  const validationErrors = apiError?.data?.errors
  const firstValidationError = validationErrors
    ? Object.values(validationErrors)
        .flatMap((messages) => Array.isArray(messages) ? messages : [messages])
        .find((message) => typeof message === 'string' && message.trim().length > 0)
    : undefined

  return String(apiError?.data?.message || firstValidationError || fallback)
}

function MemberAvatar({
  member,
  className,
  initialsClassName,
}: {
  member: Member
  className: string
  initialsClassName: string
}) {
  const [failed, setFailed] = useState(false)

  if (member.avatar && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.avatar}
        alt={member.name}
        className={`${className} object-cover`}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div className={`${getAvatarColor(member.name)} ${className} flex items-center justify-center`}>
      <span className={initialsClassName}>{getInitials(member.name)}</span>
    </div>
  )
}

function EditMemberModal({
  member,
  onClose,
}: {
  member: Member
  onClose: () => void
}) {
  const [updateMember, { isLoading }] = useUpdateMemberMutation()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState<EditMemberForm>({
    id: member.id,
    name: member.name,
    username: member.username ?? '',
    email: member.email,
    contactNumber: member.contactNumber ?? '',
    status: member.status,
    tier: member.tier,
    addressLine: member.addressLine ?? '',
    barangay: member.barangay ?? '',
    city: member.city ?? '',
    province: member.province ?? '',
    region: member.region ?? '',
    zipCode: member.zipCode ?? '',
  })

  const updateField = <K extends keyof EditMemberForm>(key: K, value: EditMemberForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage(null)

    try {
      const response = await updateMember(form).unwrap()
      setMessage({ type: 'success', text: response.message || 'Member updated successfully.' })
      setTimeout(() => onClose(), 800)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: getApiErrorMessage(error, 'Failed to update member.') })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="mx-auto mt-8 w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#f8fafc,#ffffff)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Edit Member</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">{member.name}</h3>
              <p className="mt-1 text-sm text-slate-500">Update profile, tier, status, and address details.</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {message && (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {message.text}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</span>
              <input value={form.name} onChange={(e) => updateField('name', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Username</span>
              <input value={form.username} onChange={(e) => updateField('username', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100" />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
              <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100" />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Contact Number</span>
              <input value={form.contactNumber} onChange={(e) => updateField('contactNumber', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
              <select value={form.status} onChange={(e) => updateField('status', e.target.value as MemberStatus)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100">
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="blocked">Blocked</option>
                <option value="kyc_review">KYC Review</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tier</span>
              <select value={form.tier} onChange={(e) => updateField('tier', e.target.value as MemberTier)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100">
                <option value="Home Starter">Home Starter</option>
                <option value="Home Builder">Home Builder</option>
                <option value="Home Stylist">Home Stylist</option>
                <option value="Lifestyle Consultant">Lifestyle Consultant</option>
                <option value="Lifestyle Elite">Lifestyle Elite</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Address Line</span>
              <input value={form.addressLine} onChange={(e) => updateField('addressLine', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Barangay</span>
              <input value={form.barangay} onChange={(e) => updateField('barangay', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">City</span>
              <input value={form.city} onChange={(e) => updateField('city', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Province</span>
              <input value={form.province} onChange={(e) => updateField('province', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Region</span>
              <input value={form.region} onChange={(e) => updateField('region', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Zip Code</span>
              <input value={form.zipCode} onChange={(e) => updateField('zipCode', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100" />
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isLoading} className="rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-500/30 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ── Portal dropdown ─────────────────────────────────────── */

function MemberMenuPortal({
  member,
  isUpdating,
  onView,
  onEdit,
  onBanToggle,
  onCopy,
  onQuickStatus,
}: {
  member: Member
  isUpdating: boolean
  onView: () => void
  onEdit: () => void
  onBanToggle: () => void
  onCopy: (value: string, label: string) => void
  onQuickStatus: (status: MemberStatus) => void
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)

  const MENU_HEIGHT = 340 // approximate dropdown height

  const openMenu = () => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const flipUp = spaceBelow < MENU_HEIGHT && rect.top > MENU_HEIGHT
    setPos({
      top: flipUp ? rect.top - MENU_HEIGHT - 6 : rect.bottom + 6,
      right: window.innerWidth - rect.right,
    })
  }

  const closeMenu = () => setPos(null)

  useEffect(() => {
    if (!pos) return
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return
      closeMenu()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', handler)
    }
  }, [pos])

  const quickActions = [
    { key: 'active',     label: 'Set Active',     desc: 'Mark member as active and unlocked.' },
    { key: 'pending',    label: 'Set Pending',     desc: 'Move member back to pending state.' },
    { key: 'kyc_review', label: 'Set KYC Review',  desc: 'Flag member for verification review.' },
    { key: 'blocked',    label: 'Block Member',    desc: 'Lock the account from normal use.' },
  ]

  return (
    <>
      <button
        ref={btnRef}
        title="More options"
        onClick={(e) => {
          e.stopPropagation()
          if (pos) {
            closeMenu()
            return
          }

          openMenu()
        }}
        className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
        </svg>
      </button>
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {pos && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onMouseDown={e => e.stopPropagation()}
              style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999 }}
              className="w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-300/60"
            >
              <button onClick={() => { onView(); closeMenu() }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                <span>Open member details</span><span className="text-xs text-slate-400">View</span>
              </button>
              <button onClick={() => { onEdit(); closeMenu() }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                <span>Edit member profile</span><span className="text-xs text-slate-400">Edit</span>
              </button>
              <button onClick={() => { onBanToggle(); closeMenu() }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                  member.status === 'blocked' ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                <span>{member.status === 'blocked' ? 'Unban member account' : 'Ban member account'}</span>
                <span className="text-xs text-slate-400">{member.status === 'blocked' ? 'Restore' : 'Restrict'}</span>
              </button>
              <button onClick={() => { onCopy(member.email ?? '', 'Email copied to clipboard.'); closeMenu() }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                <span>Copy email</span><span className="text-xs text-slate-400">Clipboard</span>
              </button>
              <button onClick={() => { onCopy(member.contactNumber ?? '', 'Contact number copied.'); closeMenu() }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                <span>Copy contact number</span><span className="text-xs text-slate-400">Clipboard</span>
              </button>
              <button onClick={() => { onCopy(member.fullAddress ?? '', 'Address copied.'); closeMenu() }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                <span>Copy full address</span><span className="text-xs text-slate-400">Clipboard</span>
              </button>

              <div className="my-2 border-t border-slate-100" />
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Quick Status</p>
              {quickActions.map(a => (
                <button key={a.key} disabled={isUpdating}
                  onClick={() => { onQuickStatus(a.key as MemberStatus); closeMenu() }}
                  className="block w-full rounded-xl px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-60">
                  <p className="text-sm font-medium text-slate-700">{a.label}</p>
                  <p className="text-xs text-slate-400">{a.desc}</p>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
      when: 'beforeChildren',
      staggerChildren: 0.02,
    },
  },
  exit: { opacity: 0, transition: { duration: 0.14 } },
}

const rowVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.16 } },
}

interface MembersTableProps {
  rows: Member[]
  currentPage: number
  totalPages: number
  totalRecords: number
  from: number | null
  to: number | null
  onPageChange: (page: number) => void
}

const MembersTable = ({
  rows,
  currentPage,
  totalPages,
  totalRecords,
  from,
  to,
  onPageChange,
}: MembersTableProps) => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [banTarget, setBanTarget] = useState<Member | null>(null)
  const [quickMessage, setQuickMessage] = useState<string | null>(null)
  const [updateMember, { isLoading: isUpdating }] = useUpdateMemberMutation()

  useEffect(() => {
    if (!quickMessage) return
    const timeout = setTimeout(() => setQuickMessage(null), 2200)
    return () => clearTimeout(timeout)
  }, [quickMessage])

  const verificationBadge = (member: Member) => {
    const status = member.verificationStatus ?? 'not_verified'
    if (status === 'verified') {
      return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Verified</span>
    }
    if (status === 'pending_review') {
      return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending Review</span>
    }
    if (status === 'blocked') {
      return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Blocked</span>
    }
    return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Not Verified</span>
  }

  const handleCopy = async (value: string, successText: string) => {
    try {
      if (!value.trim()) {
        setQuickMessage('Nothing to copy.')
        return
      }
      await navigator.clipboard.writeText(value)
      setQuickMessage(successText)
    } catch {
      setQuickMessage('Copy failed on this browser.')
    }
  }

  const handleQuickStatus = async (member: Member, status: MemberStatus) => {
    try {
      await updateMember({
        id: member.id,
        name: member.name,
        email: member.email,
        contactNumber: member.contactNumber ?? '',
        status,
        tier: member.tier,
        addressLine: member.addressLine ?? '',
        barangay: member.barangay ?? '',
        city: member.city ?? '',
        province: member.province ?? '',
        region: member.region ?? '',
        zipCode: member.zipCode ?? '',
      }).unwrap()
      setQuickMessage(`Member status updated to ${status.replace('_', ' ')}.`)
    } catch (error: unknown) {
      setQuickMessage(getApiErrorMessage(error, 'Failed to update member status.'))
    }
  }

  const handleBanToggle = async () => {
    if (!banTarget) return

    const nextStatus: MemberStatus = banTarget.status === 'blocked' ? 'active' : 'blocked'

    try {
      await updateMember({
        id: banTarget.id,
        name: banTarget.name,
        email: banTarget.email,
        contactNumber: banTarget.contactNumber ?? '',
        status: nextStatus,
        tier: banTarget.tier,
        addressLine: banTarget.addressLine ?? '',
        barangay: banTarget.barangay ?? '',
        city: banTarget.city ?? '',
        province: banTarget.province ?? '',
        region: banTarget.region ?? '',
        zipCode: banTarget.zipCode ?? '',
      }).unwrap()

      setQuickMessage(
        nextStatus === 'blocked'
          ? `${banTarget.name} has been banned successfully.`
          : `${banTarget.name} has been unbanned successfully.`,
      )
      setBanTarget(null)
    } catch (error: unknown) {
      setQuickMessage(getApiErrorMessage(error, 'Failed to update member ban status.'))
    }
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-16 gap-3">
        <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <p className="text-slate-600 font-semibold text-sm">No members found</p>
        <p className="text-slate-400 text-xs">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-visible">
      {quickMessage && (
        <div className="border-b border-slate-100 bg-teal-50 px-4 py-2 text-sm text-teal-700">
          {quickMessage}
        </div>
      )}
      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Member</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Tier</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Orders</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden 2xl:table-cell">Address</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Total Spent</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Earnings</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">Wallet Credits</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Referrals</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">Joined</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <AnimatePresence mode="wait" initial={false}>
            <motion.tbody
              key={`members-page-${currentPage}`}
              className="divide-y divide-slate-50"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {rows.map((member) => {
                return (
                  <motion.tr
                    key={member.id}
                    variants={rowVariants}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  >
                    {/* Member */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                        <MemberAvatar
                          member={member}
                          className="h-9 w-9 rounded-full shrink-0 shadow-sm"
                          initialsClassName="text-white font-bold text-xs"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{member.name}</p>
                          <p className="text-xs text-slate-400 truncate">{member.email}</p>
                          {member.contactNumber && member.contactNumber !== '0' && (
                            <p className="text-[11px] text-slate-400 truncate">{member.contactNumber}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 relative">
                      <MembersStatusBadge status={member.status} />
                    </td>

                    {/* Tier */}
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <TierBadge tier={member.tier} />
                    </td>

                    {/* Orders */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-slate-700 font-medium">{member.orders}</span>
                    </td>

                    {/* Address */}
                    <td className="px-5 py-3.5 hidden 2xl:table-cell">
                      <span className="block max-w-xs truncate text-xs text-slate-500">
                        {member.fullAddress || 'No address provided'}
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-slate-800 font-semibold">₱ {member.totalSpent.toLocaleString()}</span>
                    </td>

                    {/* Earnings */}
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-teal-700 font-semibold">₱ {member.earnings.toLocaleString()}</span>
                    </td>

                    {/* Wallet Credits */}
                    <td className="px-5 py-3.5 hidden xl:table-cell">
                      <div className="flex flex-col leading-tight">
                        <span className="text-[11px] font-semibold text-emerald-700">
                          Cash +{Number(member.walletCashCredits ?? 0).toLocaleString()}
                        </span>
                        <span className="text-[11px] font-semibold text-indigo-700">
                          PV +{Number(member.walletPvCredits ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* Referrals */}
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-700 font-medium">{member.referrals}</span>
                        {member.referrals > 10 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                        )}
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5 hidden xl:table-cell">
                      <span className="text-slate-400 text-xs">{member.joinedAt}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="View"
                          onClick={() => setSelectedMember(member)}
                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors flex items-center justify-center"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                        <button
                          title="Edit"
                          onClick={() => setEditingMember(member)}
                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                        <MemberMenuPortal
                          member={member}
                          isUpdating={isUpdating}
                          onView={() => setSelectedMember(member)}
                          onEdit={() => setEditingMember(member)}
                          onBanToggle={() => setBanTarget(member)}
                          onCopy={handleCopy}
                          onQuickStatus={(status) => handleQuickStatus(member, status)}
                        />
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </motion.tbody>
          </AnimatePresence>
        </table>
      </div>

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        from={from}
        to={to}
        totalRecords={totalRecords}
        onPageChange={onPageChange}
      />

      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm p-4"
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Member Details</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">{selectedMember.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <div className="mb-5 flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <MemberAvatar
                  member={selectedMember}
                  className="h-16 w-16 rounded-full shrink-0 ring-2 ring-white shadow"
                  initialsClassName="text-white font-bold text-lg"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{selectedMember.email}</p>
                  {selectedMember.username && (
                    <p className="mt-1 text-xs text-slate-500">@{selectedMember.username}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">{selectedMember.contactNumber && selectedMember.contactNumber !== '0' ? selectedMember.contactNumber : 'No contact number'}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <MembersStatusBadge status={selectedMember.status} />
                    {verificationBadge(selectedMember)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2 rounded-xl border border-slate-100 p-3">
                  <p className="text-xs text-slate-500">Address</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedMember.fullAddress || 'No address provided'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3">
                  <p className="text-xs text-slate-500">Tier</p>
                  <div className="mt-1"><TierBadge tier={selectedMember.tier} /></div>
                </div>
                <div className="rounded-xl border border-slate-100 p-3">
                  <p className="text-xs text-slate-500">Username</p>
                  <p className="mt-1 font-semibold text-slate-800">{selectedMember.username ? `@${selectedMember.username}` : 'No username'}</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3">
                  <p className="text-xs text-slate-500">Orders</p>
                  <p className="mt-1 font-semibold text-slate-800">{selectedMember.orders}</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3">
                  <p className="text-xs text-slate-500">Total Spent</p>
                  <p className="mt-1 font-semibold text-slate-800">PHP {selectedMember.totalSpent.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3">
                  <p className="text-xs text-slate-500">Earnings</p>
                  <p className="mt-1 font-semibold text-teal-700">PHP {selectedMember.earnings.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3">
                  <p className="text-xs text-slate-500">Wallet Cash Credits</p>
                  <p className="mt-1 font-semibold text-emerald-700">+{Number(selectedMember.walletCashCredits ?? 0).toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3">
                  <p className="text-xs text-slate-500">Wallet PV Credits</p>
                  <p className="mt-1 font-semibold text-indigo-700">+{Number(selectedMember.walletPvCredits ?? 0).toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3">
                  <p className="text-xs text-slate-500">Contact Number</p>
                  <p className="mt-1 font-semibold text-slate-800">{selectedMember.contactNumber && selectedMember.contactNumber !== '0' ? selectedMember.contactNumber : 'No contact number'}</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3">
                  <p className="text-xs text-slate-500">Referrals</p>
                  <p className="mt-1 font-semibold text-slate-800">{selectedMember.referrals}</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3">
                  <p className="text-xs text-slate-500">Joined</p>
                  <p className="mt-1 font-semibold text-slate-800">{selectedMember.joinedAt}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingMember && (
          <EditMemberModal member={editingMember} onClose={() => setEditingMember(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {banTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-slate-900/55 backdrop-blur-sm p-4"
            onClick={() => setBanTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="mx-auto mt-24 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  banTarget.status === 'blocked' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {banTarget.status === 'blocked' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414-1.414L12 9.172 7.05 4.222 5.636 5.636 10.586 10.586 5.636 15.536l1.414 1.414L12 12l4.95 4.95 1.414-1.414-4.95-4.95 4.95-4.95z" />
                    )}
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Member Account</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    {banTarget.status === 'blocked' ? 'Unban Member' : 'Ban Member'}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {banTarget.status === 'blocked'
                      ? <>Allow <span className="font-semibold text-slate-700">{banTarget.name}</span> to access their member account again?</>
                      : <>Ban <span className="font-semibold text-slate-700">{banTarget.name}</span>? They will be marked as blocked and normal member access will be restricted.</>}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBanTarget(null)}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBanToggle}
                  disabled={isUpdating}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    banTarget.status === 'blocked'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
                      : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                  }`}
                >
                  {isUpdating ? (banTarget.status === 'blocked' ? 'Unbanning...' : 'Banning...') : (banTarget.status === 'blocked' ? 'Unban Member' : 'Ban Member')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MembersTable
