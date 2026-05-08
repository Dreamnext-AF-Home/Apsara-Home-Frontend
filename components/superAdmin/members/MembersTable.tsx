'use client'

import { Button } from '@heroui/react/button'
import { Card } from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { Member } from "@/types/members/types"
import { motion, AnimatePresence } from "framer-motion"
import MembersStatusBadge from "./MembersStatusBadge"
import TierBadge from "@/components/ui/TierBadge"
import { useEffect, useRef, useState } from "react"
import AdminPagination from '@/components/superAdmin/AdminPagination'
import { MemberStatus, MemberTier } from "@/types/members/types"
import { useAssignSponsorMutation, useDeleteMemberMutation, useGenerateMemberTemporaryPasswordMutation, useLazyGetMembersQuery, useUpdateMemberMutation } from "@/store/api/membersApi"
import { createPortal } from "react-dom"
import DataTableShell from '@/components/superAdmin/DataTableShell'

const avatarColors = [
  'bg-teal-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500',
  'bg-sky-500', 'bg-green-500', 'bg-indigo-500', 'bg-rose-500',
]
const getAvatarColor = (name: string) => {
  const safeName = name.trim()
  const index = safeName ? safeName.charCodeAt(0) % avatarColors.length : 0
  return avatarColors[index]
}
const getInitials = (name: string) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return initials || 'MB'
}
const RECENT_MEMBER_DAYS = 7
const PH_TIMEZONE = 'Asia/Manila'

function resolveMemberRegisteredAt(member: Member) {
  return member.createdAt ?? member.created_at ?? member.joinedAt
}

function parseMemberDate(value?: string | null) {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? `${trimmed}T00:00:00+08:00`
    : trimmed.includes('T')
      ? trimmed
      : trimmed.replace(' ', 'T')

  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function hasExplicitTime(value?: string | null) {
  if (!value) return false
  return /T\d{2}:\d{2}/.test(value) || /\d{2}:\d{2}:\d{2}/.test(value) || /\d{2}:\d{2}(?::\d{2})?\s?(AM|PM)/i.test(value)
}

function formatMemberRegisteredDate(value?: string | null) {
  const parsed = parseMemberDate(value)
  if (!parsed) return 'Unknown date'

  return new Intl.DateTimeFormat('en-PH', {
    timeZone: PH_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(parsed)
}

function formatMemberRegisteredTime(value?: string | null) {
  if (!hasExplicitTime(value)) return 'Time unavailable'

  const parsed = parseMemberDate(value)
  if (!parsed) return 'Time unavailable'

  return new Intl.DateTimeFormat('en-PH', {
    timeZone: PH_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(parsed)
}

function getRecentMemberMeta(joinedAt?: string) {
  const parsed = parseMemberDate(joinedAt)
  if (!parsed) {
    return { isRecent: false, daysAgo: null as number | null }
  }

  const joinedTime = parsed.getTime()

  const diffMs = Date.now() - joinedTime
  const daysAgo = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

  return {
    isRecent: daysAgo <= RECENT_MEMBER_DAYS,
    daysAgo,
  }
}

function formatPhp(value: number) {
  return `PHP ${Number(value || 0).toLocaleString()}`
}

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
  const [assignSponsor, { isLoading: isAssigningSponsor }] = useAssignSponsorMutation()
  const [checkSponsor, { isFetching: isCheckingSponsor }] = useLazyGetMembersQuery()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [sponsorMessage, setSponsorMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [sponsorValidation, setSponsorValidation] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [sponsorValidationStatus, setSponsorValidationStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [sponsorUsername, setSponsorUsername] = useState(member.referredByUsername ?? '')
  const sponsorValidationRequestId = useRef(0)
  const sponsorValidationTimeoutRef = useRef<number | null>(null)
  const validSponsorUsernameRef = useRef(member.referredByUsername?.trim().toLowerCase() ?? '')
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

  const validateSponsorUsername = async (username: string, showEmptyError = true) => {
    const nextSponsorUsername = username.trim()
    const requestId = ++sponsorValidationRequestId.current
    setSponsorValidation(null)
    setSponsorValidationStatus('idle')
    validSponsorUsernameRef.current = ''

    if (!nextSponsorUsername) {
      if (showEmptyError) {
        setSponsorValidation({ type: 'error', text: 'Enter the sponsor username before assigning.' })
        setSponsorValidationStatus('invalid')
      }
      return false
    }

    if (nextSponsorUsername.toLowerCase() === form.username.trim().toLowerCase()) {
      setSponsorValidation({ type: 'error', text: 'A member cannot be their own sponsor.' })
      setSponsorValidationStatus('invalid')
      return false
    }

    setSponsorValidationStatus('checking')
    const response = await checkSponsor({ page: 1, perPage: 10, search: nextSponsorUsername }).unwrap()
    const matchedSponsor = response.members.find((candidate) =>
      candidate.username?.trim().toLowerCase() === nextSponsorUsername.toLowerCase()
    )

    if (requestId !== sponsorValidationRequestId.current) {
      return false
    }

    if (!matchedSponsor) {
      setSponsorValidation({ type: 'error', text: `No sponsor found with username "${nextSponsorUsername}".` })
      setSponsorValidationStatus('invalid')
      return false
    }

    setSponsorValidation({ type: 'success', text: `Sponsor found: ${matchedSponsor.name} (@${matchedSponsor.username})` })
    setSponsorValidationStatus('valid')
    validSponsorUsernameRef.current = nextSponsorUsername.toLowerCase()
    return true
  }

  const handleAssignSponsor = async () => {
    const nextSponsorUsername = sponsorUsername.trim()
    setSponsorMessage(null)

    if (!nextSponsorUsername) {
      setSponsorValidation({ type: 'error', text: 'Enter the sponsor username before assigning.' })
      return
    }

    if (isCheckingSponsor) {
      setSponsorValidationStatus('checking')
      return
    }

    if (validSponsorUsernameRef.current !== nextSponsorUsername.toLowerCase()) {
      setSponsorValidation({ type: 'error', text: 'Enter an existing sponsor username before assigning.' })
      return
    }

    try {
      const response = await assignSponsor({ id: member.id, sponsorUsername: nextSponsorUsername }).unwrap()
      setSponsorMessage({ type: 'success', text: response.message || 'Sponsor assigned successfully.' })
    } catch (error: unknown) {
      setSponsorMessage({ type: 'error', text: getApiErrorMessage(error, 'Failed to assign sponsor.') })
    }
  }

  const handleSponsorUsernameChange = (value: string) => {
    setSponsorUsername(value)
    setSponsorValidation(null)
    setSponsorMessage(null)
    setSponsorValidationStatus('idle')
    validSponsorUsernameRef.current = ''
    sponsorValidationRequestId.current += 1

    if (sponsorValidationTimeoutRef.current) {
      window.clearTimeout(sponsorValidationTimeoutRef.current)
    }

    if (!value.trim()) return

    setSponsorValidationStatus('checking')
    sponsorValidationTimeoutRef.current = window.setTimeout(() => {
      validateSponsorUsername(value, false).catch((error: unknown) => {
        setSponsorValidation({ type: 'error', text: getApiErrorMessage(error, 'Failed to check sponsor username.') })
        setSponsorValidationStatus('invalid')
      })
    }, 450)
  }

  useEffect(() => {
    return () => {
      if (sponsorValidationTimeoutRef.current) {
        window.clearTimeout(sponsorValidationTimeoutRef.current)
      }
    }
  }, [])

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
        className="mx-auto mt-8 flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 dark:border-slate-800 bg-[linear-gradient(135deg,#f8fafc,#ffffff)] px-6 py-5 dark:border-slate-800 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.98))]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Edit Member</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{member.name}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update profile, tier, status, and address details.</p>
            </div>
            <Button onPress={onClose} variant="secondary" className="rounded-xl">
              Close
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-5 px-6 py-5">
          {message && (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {message.text}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</span>
              <input value={form.name} onChange={(e) => updateField('name', e.target.value)} className="h-11 w-full rounded-[18px] border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-0 dark:border-white/18 dark:bg-white/12 dark:text-white dark:placeholder-white/55 dark:focus:border-sky-400/60 dark:focus:bg-white/18" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Username</span>
              <input value={form.username} onChange={(e) => updateField('username', e.target.value)} className="h-11 w-full rounded-[18px] border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-0 dark:border-white/18 dark:bg-white/12 dark:text-white dark:placeholder-white/55 dark:focus:border-sky-400/60 dark:focus:bg-white/18" />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
              <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className="h-11 w-full rounded-[18px] border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-0 dark:border-white/18 dark:bg-white/12 dark:text-white dark:placeholder-white/55 dark:focus:border-sky-400/60 dark:focus:bg-white/18" />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Contact Number</span>
              <input value={form.contactNumber} onChange={(e) => updateField('contactNumber', e.target.value)} className="h-11 w-full rounded-[18px] border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-0 dark:border-white/18 dark:bg-white/12 dark:text-white dark:placeholder-white/55 dark:focus:border-sky-400/60 dark:focus:bg-white/18" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
              <select value={form.status} onChange={(e) => updateField('status', e.target.value as MemberStatus)} className="h-11 w-full rounded-[18px] border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-0 dark:border-white/18 dark:bg-white/12 dark:text-white dark:focus:border-sky-400/60 dark:focus:bg-white/18">
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="blocked">Blocked</option>
                <option value="kyc_review">KYC Review</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tier</span>
              <select value={form.tier} onChange={(e) => updateField('tier', e.target.value as MemberTier)} className="h-11 w-full rounded-[18px] border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-0 dark:border-white/18 dark:bg-white/12 dark:text-white dark:focus:border-sky-400/60 dark:focus:bg-white/18">
                <option value="Home Starter">Home Starter</option>
                <option value="Home Builder">Home Builder</option>
                <option value="Home Stylist">Home Stylist</option>
                <option value="Lifestyle Consultant">Lifestyle Consultant</option>
                <option value="Lifestyle Elite">Lifestyle Elite</option>
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">Sponsor / Upline</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Assign or update the member sponsor by entering a valid sponsor username.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {member.referredByUsername
                  ? `Current: @${member.referredByUsername}`
                  : 'No sponsor assigned'}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Sponsor Username</span>
                <input
                  value={sponsorUsername}
                  onChange={(e) => handleSponsorUsernameChange(e.target.value)}
                  placeholder="Enter sponsor username"
                  className="h-11 w-full rounded-[18px] border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-0 dark:border-white/18 dark:bg-white/12 dark:text-white dark:placeholder-white/55 dark:focus:border-sky-400/60 dark:focus:bg-white/18"
                />
                {sponsorValidationStatus === 'checking' && (
                  <p className="mt-2 flex items-center gap-2 text-xs font-medium text-sky-600 dark:text-sky-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
                    Checking sponsor username...
                  </p>
                )}
                {sponsorValidationStatus !== 'checking' && sponsorValidation && (
                  <p className={`mt-2 text-xs font-medium ${sponsorValidation.type === 'success' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                    {sponsorValidation.text}
                  </p>
                )}
              </label>
              <Button
                type="button"
                onPress={handleAssignSponsor}
                isDisabled={isAssigningSponsor}
                className="self-end rounded-xl bg-slate-900 px-5 text-white transition hover:bg-slate-800 disabled:bg-slate-400 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
              >
                {isAssigningSponsor ? 'Assigning...' : 'Assign Sponsor'}
              </Button>
            </div>

            {sponsorMessage && (
              <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${sponsorMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'}`}>
                {sponsorMessage.text}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Address Line</span>
              <input value={form.addressLine} onChange={(e) => updateField('addressLine', e.target.value)} className="h-11 w-full rounded-[18px] border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-0 dark:border-white/18 dark:bg-white/12 dark:text-white dark:placeholder-white/55 dark:focus:border-sky-400/60 dark:focus:bg-white/18" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Barangay</span>
              <input value={form.barangay} onChange={(e) => updateField('barangay', e.target.value)} className="h-11 w-full rounded-[18px] border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-0 dark:border-white/18 dark:bg-white/12 dark:text-white dark:placeholder-white/55 dark:focus:border-sky-400/60 dark:focus:bg-white/18" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">City</span>
              <input value={form.city} onChange={(e) => updateField('city', e.target.value)} className="h-11 w-full rounded-[18px] border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-0 dark:border-white/18 dark:bg-white/12 dark:text-white dark:placeholder-white/55 dark:focus:border-sky-400/60 dark:focus:bg-white/18" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Province</span>
              <input value={form.province} onChange={(e) => updateField('province', e.target.value)} className="h-11 w-full rounded-[18px] border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-0 dark:border-white/18 dark:bg-white/12 dark:text-white dark:placeholder-white/55 dark:focus:border-sky-400/60 dark:focus:bg-white/18" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Region</span>
              <input value={form.region} onChange={(e) => updateField('region', e.target.value)} className="h-11 w-full rounded-[18px] border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-0 dark:border-white/18 dark:bg-white/12 dark:text-white dark:placeholder-white/55 dark:focus:border-sky-400/60 dark:focus:bg-white/18" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Zip Code</span>
              <input value={form.zipCode} onChange={(e) => updateField('zipCode', e.target.value)} className="h-11 w-full rounded-[18px] border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-0 dark:border-white/18 dark:bg-white/12 dark:text-white dark:placeholder-white/55 dark:focus:border-sky-400/60 dark:focus:bg-white/18" />
            </label>
          </div>

          </div>
          <div className="shrink-0 flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
            <Button type="button" onPress={onClose} variant="secondary" className="rounded-xl">Cancel</Button>
            <Button type="submit" isDisabled={isLoading} className="rounded-xl bg-teal-600 text-white transition hover:bg-teal-700 disabled:bg-teal-300">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function MemberDetailsModal({
  member,
  onClose,
  onCopy,
}: {
  member: Member
  onClose: () => void
  onCopy: (value: string, label: string) => Promise<void>
}) {
  const [generateTemporaryPassword, { isLoading }] = useGenerateMemberTemporaryPasswordMutation()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const registeredAt = resolveMemberRegisteredAt(member)
  const registeredDate = formatMemberRegisteredDate(registeredAt)
  const registeredTime = formatMemberRegisteredTime(registeredAt)

  const verificationBadge = (selectedMember: Member) => {
    const status = selectedMember.verificationStatus ?? 'not_verified'
    if (status === 'verified') {
      return <Chip size="sm" variant="soft" className="bg-emerald-50 text-emerald-700">Verified</Chip>
    }
    if (status === 'pending_review') {
      return <Chip size="sm" variant="soft" className="bg-sky-50 text-sky-700">Pending Review</Chip>
    }
    if (status === 'blocked') {
      return <Chip size="sm" variant="soft" className="bg-red-50 text-red-700">Blocked</Chip>
    }
    return <Chip size="sm" variant="soft">Not Verified</Chip>
  }

  const handleGeneratePassword = async () => {
    setMessage(null)

    try {
      const response = await generateTemporaryPassword(member.id).unwrap()
      setGeneratedPassword(response.temporary_password)
      setMessage({
        type: 'success',
        text: 'Temporary password generated. Share it with the member and they will be required to create a new password after login.',
      })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: getApiErrorMessage(error, 'Failed to generate a temporary password.'),
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/45 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="my-auto flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Member Details</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{member.name}</h3>
          </div>
          <Button onPress={onClose} variant="secondary" className="rounded-xl">
            Close
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
        <div className="mb-5 flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
          {member.avatar ? (
            <button
              type="button"
              onClick={() => setPhotoOpen(true)}
              className="group relative shrink-0 cursor-zoom-in"
              aria-label="View photo"
            >
              <MemberAvatar
                member={member}
                className="h-16 w-16 rounded-full ring-2 ring-white shadow"
                initialsClassName="text-white font-bold text-lg"
              />
              <div className="absolute inset-0 rounded-full bg-black/0 transition-colors group-hover:bg-black/30 flex items-center justify-center">
                <svg className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0zm0 0l2 2" />
                </svg>
              </div>
            </button>
          ) : (
            <MemberAvatar
              member={member}
              className="h-16 w-16 rounded-full shrink-0 ring-2 ring-white shadow"
              initialsClassName="text-white font-bold text-lg"
            />
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{member.email}</p>
            {member.username && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">@{member.username}</p>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{member.contactNumber && member.contactNumber !== '0' ? member.contactNumber : 'No contact number'}</p>
            <div className="mt-2 flex items-center gap-2">
              <MembersStatusBadge status={member.status} />
              {verificationBadge(member)}
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {message.text}
          </div>
        )}

        <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Security</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Generate Temporary Password</p>
              <p className="mt-1 text-xs text-slate-500">
                Use this when the member forgot their password. They can sign in once with the generated password,
                then they will be required to create a new one.
              </p>
            </div>
            <Button
              onPress={handleGeneratePassword}
              isDisabled={isLoading}
              className="rounded-xl bg-sky-500 text-white transition hover:bg-sky-600 disabled:bg-sky-300"
            >
              {isLoading ? 'Generating...' : 'Generate Password'}
            </Button>
          </div>

          {generatedPassword ? (
            <div className="mt-4 rounded-2xl border border-sky-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-500">Temporary Password</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <code className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">{generatedPassword}</code>
                <Button
                  variant="secondary"
                  className="rounded-xl"
                  onPress={() => void onCopy(generatedPassword, 'Temporary password copied to clipboard.')}
                >
                  Copy
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                This password is shown once in the admin panel. Share it with the member securely.
              </p>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2 rounded-xl border border-slate-100 p-3">
            <p className="text-xs text-slate-500">Address</p>
            <p className="mt-1 font-semibold text-slate-800">
              {member.fullAddress || 'No address provided'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs text-slate-500">Tier</p>
            <div className="mt-1"><TierBadge tier={member.tier} /></div>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs text-slate-500">Username</p>
            <p className="mt-1 font-semibold text-slate-800">{member.username ? `@${member.username}` : 'No username'}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs text-slate-500">Orders</p>
            <p className="mt-1 font-semibold text-slate-800">{member.orders}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs text-slate-500">Total Spent</p>
            <p className="mt-1 font-semibold text-slate-800">{formatPhp(member.totalSpent)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs text-slate-500">Earnings</p>
            <p className="mt-1 font-semibold text-teal-700">{formatPhp(member.earnings)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs text-slate-500">Wallet Cash Credits</p>
            <p className="mt-1 font-semibold text-emerald-700">+{Number(member.walletCashCredits ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs text-slate-500">Wallet PV Credits</p>
            <p className="mt-1 font-semibold text-indigo-700">+{Number(member.walletPvCredits ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs text-slate-500">Contact Number</p>
            <p className="mt-1 font-semibold text-slate-800">{member.contactNumber && member.contactNumber !== '0' ? member.contactNumber : 'No contact number'}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs text-slate-500">Referrals</p>
            <p className="mt-1 font-semibold text-slate-800">{member.referrals}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs text-slate-500">Joined</p>
            <p className="mt-1 font-semibold text-slate-800">{registeredDate}</p>
            <p className="mt-1 text-xs text-slate-500">{registeredTime} PH</p>
          </div>
        </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {photoOpen && member.avatar && (
          <motion.div
            key="photo-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md"
            onClick={() => { setPhotoOpen(false); setZoom(1); }}
          >
            <motion.div
              initial={{ scale: 0.82, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.82, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="relative flex flex-col items-center gap-3"
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => {
                setZoom((prev) => Math.min(4, Math.max(1, prev - e.deltaY * 0.003)));
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={member.avatar}
                alt={member.name}
                draggable={false}
                onClick={() => setZoom((prev) => (prev >= 2.5 ? 1 : prev + 0.5))}
                style={{ transform: `scale(${zoom})`, transition: 'transform 0.22s cubic-bezier(0.32,0.72,0,1)' }}
                className="max-h-[72vh] max-w-[80vw] rounded-2xl object-contain shadow-2xl cursor-zoom-in select-none"
              />

              <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.max(1, prev - 0.5))}
                  className="text-white/70 hover:text-white transition-colors text-lg font-bold leading-none"
                  aria-label="Zoom out"
                >−</button>
                <span className="min-w-[3rem] text-center text-sm font-semibold text-white">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.min(4, prev + 0.5))}
                  className="text-white/70 hover:text-white transition-colors text-lg font-bold leading-none"
                  aria-label="Zoom in"
                >+</button>
                {zoom > 1 && (
                  <button
                    type="button"
                    onClick={() => setZoom(1)}
                    className="ml-1 text-xs text-white/50 hover:text-white/90 transition-colors"
                  >Reset</button>
                )}
              </div>
            </motion.div>

            <button
              type="button"
              onClick={() => { setPhotoOpen(false); setZoom(1); }}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/40 select-none">
              Scroll or click to zoom · Click outside to close
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* -- Portal dropdown --------------------------------------- */

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
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
              className="w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-300/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40"
            >
              <button onClick={() => { onView(); closeMenu() }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/40">
                <span>Open member details</span><span className="text-xs text-slate-400 dark:text-slate-500">View</span>
              </button>
              <button onClick={() => { onEdit(); closeMenu() }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/40">
                <span>Edit member profile</span><span className="text-xs text-slate-400 dark:text-slate-500">Edit</span>
              </button>
              <button onClick={() => { onBanToggle(); closeMenu() }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                  member.status === 'blocked' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                }`}>
                <span>{member.status === 'blocked' ? 'Unban member account' : 'Ban member account'}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{member.status === 'blocked' ? 'Restore' : 'Restrict'}</span>
              </button>
              <button onClick={() => { onCopy(member.email ?? '', 'Email copied to clipboard.'); closeMenu() }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/40">
                <span>Copy email</span><span className="text-xs text-slate-400 dark:text-slate-500">Clipboard</span>
              </button>
              <button onClick={() => { onCopy(member.contactNumber ?? '', 'Contact number copied.'); closeMenu() }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/40">
                <span>Copy contact number</span><span className="text-xs text-slate-400 dark:text-slate-500">Clipboard</span>
              </button>
              <button onClick={() => { onCopy(member.fullAddress ?? '', 'Address copied.'); closeMenu() }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/40">
                <span>Copy full address</span><span className="text-xs text-slate-400 dark:text-slate-500">Clipboard</span>
              </button>

              <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Quick Status</p>
              {quickActions.map(a => (
                <button key={a.key} disabled={isUpdating}
                  onClick={() => { onQuickStatus(a.key as MemberStatus); closeMenu() }}
                  className="block w-full rounded-xl px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-60 dark:hover:bg-slate-800/40">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{a.label}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{a.desc}</p>
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
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null)
  const [quickMessage, setQuickMessage] = useState<string | null>(null)
  const [updateMember, { isLoading: isUpdating }] = useUpdateMemberMutation()
  const [deleteMember, { isLoading: isDeleting }] = useDeleteMemberMutation()

  useEffect(() => {
    if (!quickMessage) return
    const timeout = setTimeout(() => setQuickMessage(null), 2200)
    return () => clearTimeout(timeout)
  }, [quickMessage])

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
        username: member.username ?? '',
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
        username: banTarget.username ?? '',
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

  const handleDeleteMember = async () => {
    if (!deleteTarget) return

    try {
      const response = await deleteMember(deleteTarget.id).unwrap()
      setQuickMessage(response.message || `${deleteTarget.name} deleted successfully.`)
      setDeleteTarget(null)
      if (selectedMember?.id === deleteTarget.id) setSelectedMember(null)
      if (editingMember?.id === deleteTarget.id) setEditingMember(null)
    } catch (error: unknown) {
      setQuickMessage(getApiErrorMessage(error, 'Failed to delete member.'))
    }
  }

  if (rows.length === 0) {
    return (
      <Card className="border border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
        <Card.Content className="flex flex-col items-center justify-center gap-3 py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/60">
          <svg className="h-7 w-7 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">No members found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Try adjusting your search or filters</p>
        </Card.Content>
      </Card>
    )
  }

    return (
      <DataTableShell
        title="Members"
        subtitle="Browse, filter, and manage member records."
        footer={<AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          from={from}
          to={to}
          totalRecords={totalRecords}
          onPageChange={onPageChange}
        />}
      >
        {quickMessage && (
          <div className="border-b border-slate-100 bg-teal-50 px-4 py-2 text-sm text-teal-700 dark:border-slate-800 dark:bg-teal-500/10 dark:text-teal-300">
            {quickMessage}
          </div>
        )}
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/70">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">Member</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Status</th>
              <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300 sm:table-cell">Tier</th>
              <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300 md:table-cell">Orders</th>
              <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300 2xl:table-cell">Address</th>
              <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300 md:table-cell">Total Spent</th>
              <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300 lg:table-cell">Earnings</th>
              <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300 xl:table-cell">Wallet Credits</th>
              <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300 lg:table-cell">Referrals</th>
              <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300 xl:table-cell">Joined</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <AnimatePresence mode="wait" initial={false}>
            <motion.tbody
              key={`members-page-${currentPage}`}
              className="divide-y divide-slate-100 dark:divide-slate-800/70"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {rows.map((member) => {
                const recentMeta = getRecentMemberMeta(member.joinedAt)
                const registeredAt = resolveMemberRegisteredAt(member)
                const registeredDate = formatMemberRegisteredDate(registeredAt)
                const registeredTime = formatMemberRegisteredTime(registeredAt)

                return (
                  <motion.tr
                    key={member.id}
                    variants={rowVariants}
                    className="group cursor-pointer border-b border-slate-100 transition-colors hover:bg-sky-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    {/* Member */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                        <MemberAvatar
                          member={member}
                          className="h-10 w-10 rounded-full shrink-0 shadow-sm ring-2 ring-white dark:ring-slate-800"
                          initialsClassName="text-white font-bold text-xs"
                        />
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[15px] font-semibold leading-5 text-slate-800 dark:text-slate-100">{member.name}</p>
                            {recentMeta.isRecent && (
                              <Chip size="sm" variant="soft" className="h-5 border border-blue-100 bg-blue-50 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                                New
                              </Chip>
                            )}
                          </div>
                          <p className="truncate text-[12px] leading-4 text-slate-300 dark:text-slate-300">{member.email}</p>
                          {member.referredByName && (
                            <p className="truncate text-[12px] leading-4 text-teal-400">
                              Referred by {member.referredByName}{member.referredByUsername ? ` (@${member.referredByUsername})` : ''}
                            </p>
                          )}
                          {member.contactNumber && member.contactNumber !== '0' && (
                            <p className="truncate text-[12px] leading-4 text-slate-400 dark:text-slate-400">{member.contactNumber}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="relative min-w-[120px] px-5 py-3.5">
                      <MembersStatusBadge status={member.status} />
                    </td>

                    {/* Tier */}
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <TierBadge tier={member.tier} />
                    </td>

                    {/* Orders */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{member.orders}</span>
                    </td>

                    {/* Address */}
                    <td className="px-5 py-3.5 hidden 2xl:table-cell">
                      <span className="block max-w-xs truncate text-[12px] leading-5 text-slate-400 dark:text-slate-300">
                        {member.fullAddress || 'No address provided'}
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-slate-800 font-semibold">{formatPhp(member.totalSpent)}</span>
                    </td>

                    {/* Earnings */}
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-teal-700 font-semibold">{formatPhp(member.earnings)}</span>
                    </td>

                    {/* Wallet Credits */}
                    <td className="px-5 py-3.5 hidden xl:table-cell">
                      <div className="flex flex-col gap-0.5 leading-tight">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Cash {Number(member.walletCashCredits ?? 0).toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          PV {Number(member.walletPvCredits ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* Referrals */}
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{member.referrals}</span>
                        {member.referrals > 10 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                        )}
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5 hidden xl:table-cell">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-medium text-slate-300 dark:text-slate-200">{registeredDate}</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-400">{registeredTime} PH</span>
                        {recentMeta.isRecent && recentMeta.daysAgo !== null && (
                          <span className="text-[11px] font-medium text-blue-600">
                            {recentMeta.daysAgo === 0 ? 'Registered today' : `${recentMeta.daysAgo} day${recentMeta.daysAgo === 1 ? '' : 's'} ago`}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="tertiary"
                          aria-label={`View ${member.name}`}
                          onPress={() => setSelectedMember(member)}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="tertiary"
                          aria-label={`Edit ${member.name}`}
                          onPress={() => setEditingMember(member)}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="danger-soft"
                          aria-label={`Delete ${member.name}`}
                          onPress={() => setDeleteTarget(member)}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"/>
                          </svg>
                        </Button>
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

      <AnimatePresence>
        {selectedMember && (
          <MemberDetailsModal
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
            onCopy={handleCopy}
          />
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
              className="mx-auto mt-24 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  banTarget.status === 'blocked' ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'
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
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Member Account</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                    {banTarget.status === 'blocked' ? 'Unban Member' : 'Ban Member'}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {banTarget.status === 'blocked'
                      ? <>Allow <span className="font-semibold text-slate-700 dark:text-slate-200">{banTarget.name}</span> to access their member account again?</>
                      : <>Ban <span className="font-semibold text-slate-700 dark:text-slate-200">{banTarget.name}</span>? They will be marked as blocked and normal member access will be restricted.</>}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button type="button" onPress={() => setBanTarget(null)} variant="secondary" className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  type="button"
                  onPress={handleBanToggle}
                  isDisabled={isUpdating}
                  className={`rounded-xl text-white transition disabled:opacity-60 ${banTarget.status === 'blocked' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-500 hover:bg-sky-600'}`}
                >
                  {isUpdating ? (banTarget.status === 'blocked' ? 'Unbanning...' : 'Banning...') : (banTarget.status === 'blocked' ? 'Unban Member' : 'Ban Member')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-slate-900/55 backdrop-blur-sm p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="mx-auto mt-24 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"/>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Delete Member</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">Remove this member?</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    Delete <span className="font-semibold text-slate-700 dark:text-slate-200">{deleteTarget.name}</span> from the members list. This action cannot be undone.
                  </p>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    If the member still has related records like orders, payouts, or other linked data, deletion may be blocked.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button type="button" onPress={() => setDeleteTarget(null)} variant="secondary" className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  type="button"
                  onPress={handleDeleteMember}
                  isDisabled={isDeleting}
                  className="rounded-xl bg-red-600 text-white transition hover:bg-red-700 disabled:bg-red-300"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Member'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </DataTableShell>
  )
}

export default MembersTable
