import type { MemberStatus, MemberTier } from '@/types/members/types'

export interface TopEarner {
  id: number
  name: string
  email: string
  tier: MemberTier | string
  earnings: number
  orders: number
  referrals: number
  status: MemberStatus
  joinedAt: string
  lastActive: string
  totalSpent: number
  avatar?: string
}

export type SortKey = 'earnings' | 'orders' | 'referrals' | 'totalSpent'

export const TIER_COLORS: Record<string, string> = {
  'Lifestyle Elite': 'bg-purple-100 text-purple-700 border-purple-200',
  'Lifestyle Consultant': 'bg-blue-100 text-blue-700 border-blue-200',
  'Home Stylist': 'bg-teal-100 text-teal-700 border-teal-200',
  'Home Builder': 'bg-sky-100 text-sky-700 border-sky-200',
  'Home Starter': 'bg-slate-100 text-slate-600 border-slate-200',
}

export const STATUS_CONFIG: Record<string, { dot: string; text: string; label: string }> = {
  active: { dot: 'bg-emerald-400', text: 'text-emerald-600', label: 'Active' },
  pending: { dot: 'bg-sky-400', text: 'text-sky-600', label: 'Pending' },
  kyc_review: { dot: 'bg-amber-400', text: 'text-amber-600', label: 'KYC Review' },
  blocked: { dot: 'bg-red-400', text: 'text-red-500', label: 'Blocked' },
}

export const MEDALS: Record<number, { label: string; ring: string; bg: string; glow: string; crown: string }> = {
  1: { label: '1st', ring: 'ring-2 ring-yellow-400/80', bg: 'bg-gradient-to-br from-yellow-400 to-amber-500',   glow: 'shadow-yellow-400/40',  crown: '👑' },
  2: { label: '2nd', ring: 'ring-2 ring-slate-300/80',  bg: 'bg-gradient-to-br from-slate-400 to-slate-500',   glow: 'shadow-slate-400/30',   crown: '🥈' },
  3: { label: '3rd', ring: 'ring-2 ring-orange-400/80', bg: 'bg-gradient-to-br from-orange-400 to-amber-600',  glow: 'shadow-orange-400/30',  crown: '🥉' },
}

export const TIERS = [
  'All Tiers',
  'Lifestyle Elite',
  'Lifestyle Consultant',
  'Home Stylist',
  'Home Builder',
  'Home Starter',
] as const

export const php = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n)

export const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((word) => word[0]).join('').toUpperCase()
