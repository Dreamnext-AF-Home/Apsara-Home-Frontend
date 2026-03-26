'use client'

import React, { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import {
  AdminUserItem,
  CreateAdminUserResponse,
  useCreateAdminUserMutation,
  useDeleteAdminUserMutation,
  useGetAdminUsersQuery,
  useUpdateAdminUserMutation,
} from '@/store/api/adminUsersApi'
import { useGetAdminMeQuery } from '@/store/api/authApi'
import { useGetSuppliersQuery } from '@/store/api/suppliersApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import {
  ADMIN_PERMISSION_OPTIONS,
  AdminPermissionId,
  DEFAULT_ADMIN_PERMISSIONS,
  normalizeAdminPermissions,
} from '@/libs/adminPermissions'

/* ─── types ──────────────────────────────────────────────── */

type CreateForm = {
  name: string
  username: string
  email: string
  user_level_id: number
  supplier_id: number | null
  admin_permissions: AdminPermissionId[]
}

type EditForm = CreateForm & {
  password: string
}

const initialForm: CreateForm = {
  name: '', username: '', email: '', user_level_id: 3, supplier_id: null, admin_permissions: [],
}

const initialEditForm: EditForm = {
  ...initialForm,
  password: '',
}

/* ─── config ─────────────────────────────────────────────── */

const ROLE_OPTIONS = [
  {
    value: 1, label: 'Super Admin', colorKey: 'purple',
    description: 'Full system access, manage all settings and users',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    value: 2, label: 'Admin', colorKey: 'teal',
    description: 'General administrative privileges across the platform',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    value: 3, label: 'CSR', colorKey: 'blue',
    description: 'Handle customer inquiries and support requests',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
  },
  {
    value: 4, label: 'Web Content', colorKey: 'amber',
    description: 'Manage website content and digital media assets',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: 5, label: 'Accounting', colorKey: 'emerald',
    description: 'Manage invoices, transactions, and financial records',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    value: 6, label: 'Finance Officer', colorKey: 'indigo',
    description: 'Oversee financial planning, budgets, and reporting',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: 7, label: 'Merchant Admin', colorKey: 'rose',
    description: 'Manage merchant-side orders, products, and shipping workflows',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7l1.664 9.152A2 2 0 006.632 18h10.736a2 2 0 001.968-1.848L21 7M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2M9 11h6" />
      </svg>
    ),
  },
]

/* Full Tailwind class strings — must be static for purge */
const ROLE_CARD_STYLES: Record<string, { card: string; icon: string; label: string }> = {
  purple:  { card: 'border-purple-300 bg-purple-50 ring-2 ring-purple-200',  icon: 'bg-purple-100 text-purple-600',  label: 'text-purple-700'  },
  teal:    { card: 'border-teal-300 bg-teal-50 ring-2 ring-teal-200',        icon: 'bg-teal-100 text-teal-600',      label: 'text-teal-700'    },
  blue:    { card: 'border-blue-300 bg-blue-50 ring-2 ring-blue-200',        icon: 'bg-blue-100 text-blue-600',      label: 'text-blue-700'    },
  amber:   { card: 'border-amber-300 bg-amber-50 ring-2 ring-amber-200',     icon: 'bg-amber-100 text-amber-600',    label: 'text-amber-700'   },
  emerald: { card: 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200', icon: 'bg-emerald-100 text-emerald-600', label: 'text-emerald-700' },
  indigo:  { card: 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-200',  icon: 'bg-indigo-100 text-indigo-600',  label: 'text-indigo-700'  },
  rose:    { card: 'border-rose-300 bg-rose-50 ring-2 ring-rose-200',        icon: 'bg-rose-100 text-rose-600',      label: 'text-rose-700'    },
  cyan:    { card: 'border-cyan-300 bg-cyan-50 ring-2 ring-cyan-200',        icon: 'bg-cyan-100 text-cyan-600',      label: 'text-cyan-700'    },
}

const ROLE_COLORS: Record<string, string> = {
  super_admin:     'bg-purple-50 text-purple-700 border-purple-200',
  admin:           'bg-teal-50 text-teal-700 border-teal-200',
  csr:             'bg-blue-50 text-blue-700 border-blue-200',
  web_content:     'bg-amber-50 text-amber-700 border-amber-200',
  accounting:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  finance_officer: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  merchant_admin:  'bg-rose-50 text-rose-700 border-rose-200',
  supplier_admin:  'bg-cyan-50 text-cyan-700 border-cyan-200',
}

const AVATAR_COLORS = [
  'from-teal-400 to-teal-600', 'from-purple-400 to-purple-600',
  'from-blue-400 to-blue-600', 'from-indigo-400 to-indigo-600',
  'from-emerald-400 to-emerald-600',
]

/* ─── utilities ──────────────────────────────────────────── */

const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase()

const avatarGrad = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

function getPasswordStrength(password: string) {
  if (!password) return null
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { level: 1, label: 'Weak',       color: 'bg-red-500',     textColor: 'text-red-500'     }
  if (score === 2) return { level: 2, label: 'Fair',       color: 'bg-orange-400',  textColor: 'text-orange-500'  }
  if (score === 3) return { level: 3, label: 'Good',       color: 'bg-yellow-400',  textColor: 'text-yellow-600'  }
  return               { level: Math.min(score, 5), label: score >= 5 ? 'Very Strong' : 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600' }
}

function formatDateTime(value?: string | null) {
  if (!value) return ''

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleString()
}

/* ─── icons ──────────────────────────────────────────────── */

const UserIcon  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
const AtIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
const MailIcon  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
const LockIcon  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
const EyeIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
const EyeOffIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
const SpinIcon  = () => <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>

/* ─── InputField ─────────────────────────────────────────── */

function InputField({
  label, placeholder, type = 'text', value, onChange, required,
  icon, error, helper,
}: {
  label: string; placeholder: string; type?: string
  value: string; onChange: (v: string) => void; required?: boolean
  icon?: React.ReactNode; error?: string; helper?: string
}) {
  const [showPwd, setShowPwd] = useState(false)
  const isPassword = type === 'password'
  const inputType  = isPassword ? (showPwd ? 'text' : 'password') : type

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 block">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          className={[
            'w-full py-2.5 text-sm border rounded-xl',
            'focus:outline-none focus:ring-2 transition-all',
            'text-slate-700 placeholder-slate-400',
            icon ? 'pl-10' : 'pl-3.5',
            isPassword ? 'pr-10' : 'pr-3.5',
            error
              ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400 bg-red-50/40'
              : 'border-slate-200 focus:ring-teal-500/30 focus:border-teal-400 hover:border-slate-300 bg-white',
          ].join(' ')}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPwd(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPwd ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helper && !error && <p className="text-xs text-slate-400">{helper}</p>}
    </div>
  )
}

/* ─── PasswordStrengthBar ────────────────────────────────── */

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getPasswordStrength(password)
  if (!password) return null
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              strength && i < strength.level ? strength.color : 'bg-slate-100'
            }`}
          />
        ))}
      </div>
      {strength && (
        <p className={`text-xs font-medium ${strength.textColor}`}>
          {strength.label}
        </p>
      )}
    </div>
  )
}

/* ─── SectionLabel ───────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  )
}

/* ─── RoleCardGrid ───────────────────────────────────────── */

function RoleCardGrid({
  value,
  onChange,
  options = ROLE_OPTIONS,
}: {
  value: number
  onChange: (v: number) => void
  options?: typeof ROLE_OPTIONS
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-600 block">
        Role <span className="text-red-400">*</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map(role => {
          const isSelected = value === role.value
          const styles = ROLE_CARD_STYLES[role.colorKey]
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => onChange(role.value)}
              className={[
                'relative flex flex-col gap-2 p-3 rounded-xl border-2 text-left transition-all duration-150',
                isSelected
                  ? `${styles.card} shadow-sm`
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
              ].join(' ')}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                isSelected ? styles.icon : 'bg-slate-100 text-slate-400'
              }`}>
                {role.icon}
              </div>
              <div>
                <p className={`text-xs font-bold transition-colors ${
                  isSelected ? styles.label : 'text-slate-700'
                }`}>
                  {role.label}
                </p>
                <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                  {role.description}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Manual setup link: <span className="font-semibold text-slate-700">always available</span>
                  {latestInviteExpiresAt ? <> {' '}Â· Valid until: <span className="font-semibold text-slate-700">{latestInviteExpiresAt}</span></> : null}
                </p>
              </div>
              {isSelected && (
                <div className={`absolute top-2 right-2 h-4 w-4 rounded-full flex items-center justify-center ${styles.icon}`}>
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SupplierSelect({
  value,
  onChange,
  options,
}: {
  value: number | null
  onChange: (value: number | null) => void
  options: Array<{ id: number; label: string }>
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 block">
        Supplier Company <span className="text-red-400">*</span>
      </label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
      >
        <option value="">Select supplier company</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-slate-400">This controls which company data the supplier account can access.</p>
    </div>
  )
}

function PermissionCheckboxGrid({
  value,
  onChange,
}: {
  value: AdminPermissionId[]
  onChange: (value: AdminPermissionId[]) => void
}) {
  const selected = new Set(value)

  const togglePermission = (permissionId: AdminPermissionId) => {
    const next = new Set(selected)
    if (next.has(permissionId)) {
      next.delete(permissionId)
    } else {
      next.add(permissionId)
    }
    onChange(Array.from(next))
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs font-semibold text-slate-600 block">
          Custom Access
        </label>
        <p className="mt-1 text-xs text-slate-400">
          Check only the sections this admin should be able to open.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {ADMIN_PERMISSION_OPTIONS.map((permission) => {
          const isChecked = selected.has(permission.id)
          return (
            <label
              key={permission.id}
              className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-all cursor-pointer ${
                isChecked
                  ? 'border-teal-300 bg-teal-50'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => togglePermission(permission.id)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="block">
                <span className="block text-sm font-semibold text-slate-700">{permission.label}</span>
                <span className="mt-0.5 block text-xs text-slate-400 leading-relaxed">{permission.description}</span>
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

/* ─── EditModal ──────────────────────────────────────────── */

function EditModal({
  target, form, busy, onChange, onSubmit, onClose, supplierOptions, roleOptions,
}: {
  target: AdminUserItem; form: EditForm; busy: boolean
  onChange: (patch: Partial<EditForm>) => void
  onSubmit: (e: React.SyntheticEvent) => void
  onClose: () => void
  supplierOptions: Array<{ id: number; label: string }>
  roleOptions: typeof ROLE_OPTIONS
}) {
  const permissionsRef = useRef<HTMLDivElement | null>(null)
  const [isPermissionsSpotlightActive, setIsPermissionsSpotlightActive] = useState(false)

  const spotlightPermissions = () => {
    setIsPermissionsSpotlightActive(true)
    permissionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => setIsPermissionsSpotlightActive(false), 1600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className={`h-9 w-9 rounded-full bg-linear-to-br ${avatarGrad(target.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {getInitials(target.name)}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800">Edit Admin Account</h3>
            <p className="text-xs text-slate-400 mt-0.5">@{target.username}</p>
          </div>
          <button
            type="button" onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <SectionLabel>Account Information</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Full Name" placeholder="Full name" value={form.name} onChange={v => onChange({ name: v })} required icon={<UserIcon />} />
            <InputField label="Username"  placeholder="Username"  value={form.username} onChange={v => onChange({ username: v })} required icon={<AtIcon />} />
          </div>
          <InputField
            label="Email Address"
            type="email"
            placeholder="Optional email"
            value={form.email}
            onChange={v => onChange({ email: v })}
            icon={<MailIcon />}
            helper="Optional. Leave blank if this account does not need email recovery."
          />
          <SectionLabel>Role & Permissions</SectionLabel>
          <RoleCardGrid
            value={form.user_level_id}
            options={roleOptions}
            onChange={v => {
              onChange({
                user_level_id: v,
                admin_permissions: v === 2
                  ? (form.admin_permissions.length ? form.admin_permissions : DEFAULT_ADMIN_PERMISSIONS)
                  : [],
              })
              if (v === 2) {
                window.setTimeout(() => spotlightPermissions(), 80)
              }
            }}
          />
          {form.user_level_id === 2 && (
            <motion.div
              ref={permissionsRef}
              initial={false}
              animate={isPermissionsSpotlightActive ? { scale: [1, 1.01, 1], boxShadow: ['0 0 0 rgba(20,184,166,0)', '0 0 0 10px rgba(20,184,166,0.12)', '0 0 0 rgba(20,184,166,0)'] } : { scale: 1, boxShadow: '0 0 0 rgba(20,184,166,0)' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="rounded-2xl border border-teal-100 bg-teal-50/60 p-3"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                Choose Admin Access Before Saving
              </p>
              <PermissionCheckboxGrid
                value={form.admin_permissions}
                onChange={(admin_permissions) => onChange({ admin_permissions })}
              />
            </motion.div>
          )}
          {form.user_level_id === 8 && (
            <SupplierSelect
              value={form.supplier_id}
              onChange={(supplierId) => onChange({ supplier_id: supplierId })}
              options={supplierOptions}
            />
          )}
          <SectionLabel>Security</SectionLabel>
          <InputField
            label="New Password" type="password" placeholder="Leave blank to keep current"
            value={form.password} onChange={v => onChange({ password: v })}
            icon={<LockIcon />} helper="Leave blank to keep the current password"
          />
          {form.password && <PasswordStrengthBar password={form.password} />}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          <button
            type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit" disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 transition-all shadow-sm shadow-teal-500/20"
          >
            {busy ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </motion.form>
    </div>
  )
}

/* ─── main ───────────────────────────────────────────────── */

export default function AdminUsersPageMain() {
  const { data: session } = useSession()
  const sessionRole = String(session?.user?.role ?? '').toLowerCase()
  const sessionUserLevelId = Number((session?.user as { userLevelId?: number } | undefined)?.userLevelId ?? 0)
  const sessionAccessToken = String((session?.user as { accessToken?: string } | undefined)?.accessToken ?? '')
  const adminIdentityKey = sessionAccessToken
    ? `${String((session?.user as { id?: string } | undefined)?.id ?? 'unknown')}:${sessionAccessToken}`
    : undefined
  const { data: adminMe } = useGetAdminMeQuery(adminIdentityKey, { skip: !sessionAccessToken })
  const role = String(adminMe?.role ?? sessionRole).toLowerCase()
  const userLevelId = Number(adminMe?.user_level_id ?? sessionUserLevelId)
  const isSuperAdmin = role === 'super_admin' || userLevelId === 1
  const isAdmin = role === 'admin' || userLevelId === 2
  const canManageUsers = isSuperAdmin || isAdmin
  const [latestInvite, setLatestInvite] = useState<CreateAdminUserResponse | null>(null)
  const { data: suppliersData } = useGetSuppliersQuery(undefined, { skip: !isSuperAdmin })

  const [search,          setSearch]          = useState('')
  const [page,            setPage]            = useState(1)
  const [createForm,      setCreateForm]      = useState<CreateForm>(initialForm)
  const [busyUpdateId,    setBusyUpdateId]    = useState<number | null>(null)
  const [editTarget,      setEditTarget]      = useState<AdminUserItem | null>(null)
  const [editForm,        setEditForm]        = useState<EditForm>(initialEditForm)
  const createPermissionsRef = useRef<HTMLDivElement | null>(null)
  const [isCreatePermissionsSpotlightActive, setIsCreatePermissionsSpotlightActive] = useState(false)

  const { data, isLoading, isError } = useGetAdminUsersQuery(
    {
      search: search.trim() || undefined,
      page,
      perPage: 15,
    },
    {
      skip: !canManageUsers,
    },
  )
  const [createAdminUser, { isLoading: isCreating }] = useCreateAdminUserMutation()
  const [updateAdminUser] = useUpdateAdminUserMutation()
  const [deleteAdminUser] = useDeleteAdminUserMutation()
  const latestInviteRoleLabel = latestInvite?.invite.role_label
    ?? latestInvite?.invite.role.replace(/_/g, ' ')
    ?? 'Admin'
  const latestInviteExpiresAt = formatDateTime(latestInvite?.invite.expires_at)

  const rows = useMemo(() => data?.users ?? [], [data?.users])
  const supplierOptions = useMemo(
    () => (suppliersData?.suppliers ?? []).map((supplier) => ({
      id: supplier.id,
      label: supplier.company || supplier.name,
    })),
    [suppliersData?.suppliers],
  )
  const allowedRoleOptions = useMemo(() => {
    if (isSuperAdmin) return ROLE_OPTIONS
    if (isAdmin) return ROLE_OPTIONS.filter((roleOption) => [3, 4, 5, 6, 7].includes(roleOption.value))
    return []
  }, [isAdmin, isSuperAdmin])

  const spotlightCreatePermissions = () => {
    setIsCreatePermissionsSpotlightActive(true)
    createPermissionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => setIsCreatePermissionsSpotlightActive(false), 1600)
  }

  const handleCreate = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    try {
      const result = await createAdminUser({
        ...createForm,
        email: createForm.email.trim() || undefined,
        admin_permissions: createForm.user_level_id === 2 ? createForm.admin_permissions : [],
      }).unwrap()
      showSuccessToast(result.message)
      setLatestInvite(result)
      setCreateForm({
        ...initialForm,
        user_level_id: isSuperAdmin ? 2 : 3,
        admin_permissions: isSuperAdmin ? DEFAULT_ADMIN_PERMISSIONS : [],
      })
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } }
      const msg = (apiErr?.data?.errors ? Object.values(apiErr.data.errors)[0]?.[0] : undefined)
        || apiErr?.data?.message || 'Failed to create admin account.'
      showErrorToast(msg)
    }
  }

  const openEditModal = (row: AdminUserItem) => {
    setEditTarget(row)
    setEditForm({
      name: row.name,
      username: row.username,
      email: row.email,
      password: '',
      user_level_id: row.user_level_id,
      supplier_id: row.supplier_id ?? null,
      admin_permissions: row.user_level_id === 2
        ? (normalizeAdminPermissions(row.admin_permissions).length
          ? normalizeAdminPermissions(row.admin_permissions)
          : DEFAULT_ADMIN_PERMISSIONS)
        : [],
    })
  }

  const handleEditSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setBusyUpdateId(editTarget.id)
    try {
      await updateAdminUser({
        id: editTarget.id, name: editForm.name, username: editForm.username,
        email: editForm.email, user_level_id: editForm.user_level_id,
        supplier_id: editForm.user_level_id === 8 ? editForm.supplier_id : null,
        admin_permissions: editForm.user_level_id === 2 ? editForm.admin_permissions : [],
        password: editForm.password.trim() || undefined,
      }).unwrap()
      showSuccessToast(`Updated account for ${editTarget.username}.`)
      setEditTarget(null)
      setEditForm(initialEditForm)
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } }
      const msg = (apiErr?.data?.errors ? Object.values(apiErr.data.errors)[0]?.[0] : undefined)
        || apiErr?.data?.message || 'Failed to update admin account.'
      showErrorToast(msg)
    } finally { setBusyUpdateId(null) }
  }

  const handleDelete = async (row: AdminUserItem) => {
    if (!window.confirm(`Delete admin account "${row.username}"?`)) return
    setBusyUpdateId(row.id)
    try {
      await deleteAdminUser({ id: row.id }).unwrap()
      showSuccessToast(`Deleted account ${row.username}.`)
    } catch (err: unknown) {
      showErrorToast((err as { data?: { message?: string } })?.data?.message || 'Failed to delete admin account.')
    } finally { setBusyUpdateId(null) }
  }

  /* ── Access guard ── */
  const copyInviteLink = async () => {
    if (!latestInvite?.setup_url) return
    try {
      await navigator.clipboard.writeText(latestInvite.setup_url)
      showSuccessToast('Setup link copied.')
    } catch {
      showErrorToast('Unable to copy setup link.')
    }
  }

  if (!canManageUsers) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-800">Access Restricted</p>
          <p className="text-xs text-amber-600 mt-0.5">Only admin managers can manage Users & Roles.</p>
        </div>
      </div>
    )
  }

  /* Live avatar preview as name is typed */
  const nameInitials = createForm.name ? getInitials(createForm.name) : null
  const nameGrad     = createForm.name ? avatarGrad(createForm.name) : 'from-slate-300 to-slate-400'

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-slate-800">Users & Roles</h1>
        <p className="text-sm text-slate-500 mt-0.5">Create and manage internal admin accounts and their role permissions</p>
        <p className="text-xs text-slate-400 mt-1">Supplier company accounts should use the dedicated supplier portal, not admin roles.</p>
      </motion.div>

      {/* ── Create Form ── */}
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onSubmit={handleCreate}
        className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
      >
        {/* Form header with live avatar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl bg-linear-to-br ${nameGrad} flex items-center justify-center text-white text-sm font-bold shrink-0 transition-all duration-300`}>
            {nameInitials ?? (
              <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Invite Admin Account</h2>
            <p className="text-xs text-slate-400 mt-0.5">The invited user will receive an email to verify the account and set their password.</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Account info */}
          <SectionLabel>Account Information</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Full Name" placeholder="e.g. Juan dela Cruz"
              value={createForm.name}
              onChange={v => setCreateForm(p => ({ ...p, name: v }))}
              required icon={<UserIcon />}
            />
            <InputField
              label="Username" placeholder="e.g. juandc"
              value={createForm.username}
              onChange={v => setCreateForm(p => ({ ...p, username: v }))}
              required icon={<AtIcon />}
            />
          </div>
          <InputField
            label="Email Address" type="email" placeholder="Optional email for resets and notices"
            value={createForm.email}
            onChange={v => setCreateForm(p => ({ ...p, email: v }))}
            icon={<MailIcon />}
            helper="Optional. Leave blank if you will share the setup link manually."
          />

          {/* Role */}
          <SectionLabel>Role & Permissions</SectionLabel>
          <RoleCardGrid
            value={createForm.user_level_id}
            options={allowedRoleOptions}
            onChange={v => {
              setLatestInvite(null)
              setCreateForm(p => ({
                ...p,
                user_level_id: v,
                supplier_id: v === 8 ? p.supplier_id : null,
                admin_permissions: v === 2
                  ? (p.admin_permissions.length ? p.admin_permissions : DEFAULT_ADMIN_PERMISSIONS)
                  : [],
              }))
              if (v === 2) {
                window.setTimeout(() => spotlightCreatePermissions(), 80)
              }
            }}
          />
          {createForm.user_level_id === 2 && (
            <motion.div
              ref={createPermissionsRef}
              initial={false}
              animate={isCreatePermissionsSpotlightActive ? { scale: [1, 1.01, 1], boxShadow: ['0 0 0 rgba(20,184,166,0)', '0 0 0 10px rgba(20,184,166,0.12)', '0 0 0 rgba(20,184,166,0)'] } : { scale: 1, boxShadow: '0 0 0 rgba(20,184,166,0)' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="rounded-2xl border border-teal-100 bg-teal-50/60 p-3"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                Choose Admin Access Before Saving
              </p>
              <PermissionCheckboxGrid
                value={createForm.admin_permissions}
                onChange={(admin_permissions) => setCreateForm((prev) => ({ ...prev, admin_permissions }))}
              />
            </motion.div>
          )}
          {createForm.user_level_id === 8 && (
            <SupplierSelect
              value={createForm.supplier_id}
              onChange={(supplierId) => setCreateForm((prev) => ({ ...prev, supplier_id: supplierId }))}
              options={supplierOptions}
            />
          )}
        </div>

        {latestInvite && (
          <div className="mx-6 mb-5 rounded-2xl border border-teal-200 bg-teal-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold text-teal-800">{latestInviteRoleLabel} setup link ready</p>
                <p className="mt-1 text-xs text-teal-700">
                  {latestInvite.delivery === 'email_and_link'
                    ? `The ${latestInviteRoleLabel.toLowerCase()} invite email was sent, and you can also share this setup link manually.`
                    : `Share this setup link directly with your ${latestInviteRoleLabel.toLowerCase()} so they can set their password.`}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Role: <span className="font-semibold text-slate-700">{latestInviteRoleLabel}</span>
                  {' '}· Username: <span className="font-semibold text-slate-700">{latestInvite.invite.username}</span>
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <a
                  href={latestInvite.setup_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-teal-300 bg-white px-4 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50 transition-colors"
                >
                  Open Link
                </a>
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="rounded-xl border border-teal-300 bg-white px-4 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50 transition-colors"
                >
                  Copy Link
                </button>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-teal-100 bg-white px-3 py-2 text-xs text-slate-600 break-all">
              {latestInvite.setup_url}
            </div>
          </div>
        )}

        {/* Form footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Fields marked <span className="text-red-400 font-semibold">*</span> are required
          </p>
          <button
            type="submit"
            disabled={isCreating}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-sm font-bold disabled:opacity-60 transition-all shadow-sm shadow-teal-500/30"
          >
            {isCreating ? (
              <><SpinIcon />Creating…</>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create Invite Link
              </>
            )}
          </button>
        </div>
      </motion.form>

      {/* ── Users Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
      >
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-50">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search name, username, email…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 bg-slate-50 text-slate-700 placeholder-slate-400 transition"
            />
          </div>
          <span className="text-xs text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full font-medium shrink-0">
            {data?.meta?.total ?? 0} accounts
          </span>
        </div>

        {/* Error */}
        {isError && (
          <div className="px-5 py-3 border-b border-red-100 bg-red-50 text-sm text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Failed to load admin users.
          </div>
        )}

        {/* Table / Skeleton */}
        {isLoading ? (
          <div className="divide-y divide-slate-50 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-slate-100 rounded" />
                  <div className="h-2.5 w-20 bg-slate-100 rounded" />
                </div>
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
                <div className="h-7 w-12 bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-175">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Admin', 'Username', 'Email', 'Role', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.length ? rows.map(row => {
                  const roleKey = row.role.toLowerCase().replace(/\s+/g, '_')
                  const roleCls = ROLE_COLORS[roleKey] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                  const isBusy  = busyUpdateId === row.id
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full bg-linear-to-br ${avatarGrad(row.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {getInitials(row.name)}
                          </div>
                          <p className="text-sm font-semibold text-slate-800">{row.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-600 font-mono">@{row.username}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{row.email}</td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2.5 py-1 rounded-full border text-[11px] font-semibold capitalize ${roleCls}`}>
                            {row.role.replace(/_/g, ' ')}
                          </span>
                          {row.supplier_name && (
                            <p className="text-[11px] text-slate-400">{row.supplier_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={isBusy}
                            onClick={() => openEditModal(row)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
                          >
                            Edit
                          </button>
                          <button
                            disabled={isBusy}
                            onClick={() => handleDelete(row)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="text-sm font-semibold text-slate-500">No admin users found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing{' '}
            <span className="font-semibold text-slate-600">{data?.meta?.from ?? 0}–{data?.meta?.to ?? 0}</span>
            {' '}of <span className="font-semibold text-slate-600">{data?.meta?.total ?? 0}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={(data?.meta?.current_page ?? 1) <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              Prev
            </button>
            <span className="px-2">{data?.meta?.current_page ?? 1} / {data?.meta?.last_page ?? 1}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(data?.meta?.current_page ?? 1) >= (data?.meta?.last_page ?? 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {editTarget && (
          <EditModal
            target={editTarget}
            form={editForm}
            busy={busyUpdateId === editTarget.id}
            onChange={patch => setEditForm(prev => ({ ...prev, ...patch }))}
            onSubmit={handleEditSubmit}
            onClose={() => { setEditTarget(null); setEditForm(initialEditForm) }}
            supplierOptions={supplierOptions}
            roleOptions={allowedRoleOptions}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
