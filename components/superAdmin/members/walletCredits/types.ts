export interface MemberWallet {
  id: number
  name: string
  email: string
  avatar?: string | null
  tier: string
  status: 'active' | 'pending' | 'blocked'
  cashBalance: number
  pvBalance: number
  cashCredits: number
  cashDebits: number
  lockedAmount: number
  availableAmount: number
  lastTransaction: string
}

export type AdjustType = 'credit' | 'debit'
export type WalletType = 'cash' | 'pv'
export type SortKey = 'cashBalance' | 'pvBalance' | 'lockedAmount' | 'availableAmount'

export const TIER_COLORS: Record<string, string> = {
  'Lifestyle Elite':      'bg-purple-100 text-purple-700 border-purple-200',
  'Lifestyle Consultant': 'bg-blue-100   text-blue-700   border-blue-200',
  'Home Stylist':         'bg-teal-100   text-teal-700   border-teal-200',
  'Home Builder':         'bg-sky-100  text-sky-700  border-sky-200',
  'Home Starter':         'bg-slate-100  text-slate-600  border-slate-200',
}

export const STATUS_CONFIG: Record<string, { dot: string; text: string; label: string }> = {
  active:  { dot: 'bg-emerald-400', text: 'text-emerald-600', label: 'Active'  },
  pending: { dot: 'bg-sky-400',   text: 'text-sky-600',   label: 'Pending' },
  blocked: { dot: 'bg-red-400',     text: 'text-red-500',     label: 'Blocked' },
}

export const MOCK_WALLETS: MemberWallet[] = [
  { id: 1,  name: 'Maria Santos',      email: 'maria.santos@email.com',     tier: 'Lifestyle Elite',      status: 'active',  cashBalance: 48500,  pvBalance: 12300, cashCredits: 148500, cashDebits: 100000, lockedAmount: 15000, availableAmount: 33500, lastTransaction: '2026-03-09T08:14:22Z' },
  { id: 2,  name: 'Ramon dela Cruz',   email: 'ramon.delacruz@email.com',   tier: 'Lifestyle Consultant', status: 'active',  cashBalance: 31200,  pvBalance: 8750,  cashCredits: 112300, cashDebits: 81100,  lockedAmount: 8000,  availableAmount: 23200, lastTransaction: '2026-03-09T07:02:10Z' },
  { id: 3,  name: 'Luisa Fernandez',   email: 'luisa.fernandez@email.com',  tier: 'Lifestyle Consultant', status: 'active',  cashBalance: 22700,  pvBalance: 6200,  cashCredits: 98750,  cashDebits: 76050,  lockedAmount: 8000,  availableAmount: 14700, lastTransaction: '2026-03-09T07:55:00Z' },
  { id: 4,  name: 'Carla Villanueva',  email: 'carla.villanueva@email.com', tier: 'Lifestyle Consultant', status: 'active',  cashBalance: 19400,  pvBalance: 5100,  cashCredits: 87400,  cashDebits: 68000,  lockedAmount: 0,     availableAmount: 19400, lastTransaction: '2026-03-09T06:30:00Z' },
  { id: 5,  name: 'Jose Reyes',        email: 'jose.reyes@email.com',       tier: 'Home Stylist',         status: 'active',  cashBalance: 14200,  pvBalance: 3800,  cashCredits: 74200,  cashDebits: 60000,  lockedAmount: 5000,  availableAmount: 9200,  lastTransaction: '2026-03-09T07:41:38Z' },
  { id: 6,  name: 'Rosa Garcia',       email: 'rosa.garcia@email.com',      tier: 'Home Stylist',         status: 'active',  cashBalance: 11600,  pvBalance: 3100,  cashCredits: 62100,  cashDebits: 50500,  lockedAmount: 0,     availableAmount: 11600, lastTransaction: '2026-03-08T19:05:30Z' },
  { id: 7,  name: 'Dante Ocampo',      email: 'dante.ocampo@email.com',     tier: 'Home Stylist',         status: 'active',  cashBalance: 8900,   pvBalance: 2400,  cashCredits: 53900,  cashDebits: 45000,  lockedAmount: 15000, availableAmount: 0,     lastTransaction: '2026-03-08T22:40:17Z' },
  { id: 8,  name: 'Elena Bautista',    email: 'elena.bautista@email.com',   tier: 'Home Builder',         status: 'active',  cashBalance: 7300,   pvBalance: 1900,  cashCredits: 45800,  cashDebits: 38500,  lockedAmount: 2500,  availableAmount: 4800,  lastTransaction: '2026-03-08T17:30:11Z' },
  { id: 9,  name: 'Ana Cruz',          email: 'ana.cruz@email.com',         tier: 'Home Builder',         status: 'active',  cashBalance: 5900,   pvBalance: 1500,  cashCredits: 38400,  cashDebits: 32500,  lockedAmount: 5000,  availableAmount: 900,   lastTransaction: '2026-03-09T06:58:12Z' },
  { id: 10, name: 'Carlos Tan',        email: 'carlos.tan@email.com',       tier: 'Home Builder',         status: 'active',  cashBalance: 4200,   pvBalance: 1100,  cashCredits: 29700,  cashDebits: 25500,  lockedAmount: 0,     availableAmount: 4200,  lastTransaction: '2026-03-09T06:30:33Z' },
  { id: 11, name: 'Pedro Lim',         email: 'pedro.lim@email.com',        tier: 'Home Starter',         status: 'pending', cashBalance: 1800,   pvBalance: 450,   cashCredits: 18200,  cashDebits: 16400,  lockedAmount: 0,     availableAmount: 1800,  lastTransaction: '2026-03-09T06:12:04Z' },
  { id: 12, name: 'Miguel Torres',     email: 'miguel.torres@email.com',    tier: 'Home Starter',         status: 'blocked', cashBalance: 600,    pvBalance: 150,   cashCredits: 11600,  cashDebits: 11000,  lockedAmount: 0,     availableAmount: 0,     lastTransaction: '2026-01-15T10:00:00Z' },
]

export const php = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n)

export const pv = (n: number) =>
  `${new Intl.NumberFormat('en-PH', { maximumFractionDigits: 2 }).format(n)} PV`

export const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

export const timeAgo = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
