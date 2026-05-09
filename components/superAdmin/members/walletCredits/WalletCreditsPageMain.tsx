'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useGetMembersQuery } from '@/store/api/membersApi'
import { MemberWallet, SortKey } from './types'
import WalletCreditsStats from './WalletCreditsStats'
import WalletCreditsToolbar from './WalletCreditsToolbar'
import WalletCreditsTable from './WalletCreditsTable'
import AdjustWalletModal from './AdjustWalletModal'
import type { MemberStatus, MemberTier } from '@/types/members/types'

type TierFilter = 'All Tiers' | MemberWallet['tier']
type StatusFilter = 'All Status' | 'Active' | 'Pending' | 'Blocked'

const PV_ALLOCATION_ROWS = [
  { label: 'Cashback / e-GC', rate: 0.04, rateLabel: '4%', tone: 'emerald' },
  { label: 'Unilevel Pool', rate: 0.06, rateLabel: '6%', tone: 'sky' },
  { label: '50K Points Reward', rate: 0.029, rateLabel: '2.9%', tone: 'amber' },
  { label: 'Global Purchase Bonus', rate: 0.01, rateLabel: '1%', tone: 'violet' },
  { label: 'Product Purchase Points', rate: 0.861, rateLabel: '86.1%', tone: 'slate' },
] as const

const formatPvAmount = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

const statusToQuery = (status: StatusFilter): MemberStatus | undefined => {
  if (status === 'Active') return 'active'
  if (status === 'Pending') return 'pending'
  if (status === 'Blocked') return 'blocked'
  return undefined
}

const mapMemberStatus = (status: MemberStatus): MemberWallet['status'] => {
  if (status === 'active') return 'active'
  if (status === 'blocked') return 'blocked'
  return 'pending'
}

export default function WalletCreditsPageMain() {
  const [search,        setSearch]        = useState('')
  const [tierFilter,    setTierFilter]    = useState<TierFilter>('All Tiers')
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>('All Status')
  const [sortKey,       setSortKey]       = useState<SortKey>('cashBalance')
  const [adjustTarget,  setAdjustTarget]  = useState<MemberWallet | null>(null)
  const [breakdownTarget, setBreakdownTarget] = useState<MemberWallet | null>(null)
  const [page, setPage] = useState(1)

  const queryTier = tierFilter === 'All Tiers' ? undefined : tierFilter as MemberTier
  const queryStatus = statusToQuery(statusFilter)
  const { data, isLoading, isFetching, isError, refetch } = useGetMembersQuery({
    page,
    perPage: 25,
    search: search.trim() || undefined,
    tier: queryTier,
    status: queryStatus,
  })

  const walletRows = useMemo<MemberWallet[]>(() => {
    return (data?.members ?? []).map((member) => {
      const cashBalance = Number(member.walletCashBalance ?? member.walletCashCredits ?? member.earnings ?? 0)
      const pvBalance = Number(member.walletPvBalance ?? member.walletPvCredits ?? 0)
      const lockedAmount = 0

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        avatar: member.avatar ?? null,
        tier: member.tier,
        status: mapMemberStatus(member.status),
        cashBalance,
        pvBalance,
        cashCredits: Number(member.walletCashCredits ?? 0),
        cashDebits: Math.max(0, Number(member.walletCashCredits ?? 0) - cashBalance),
        lockedAmount,
        availableAmount: Math.max(0, cashBalance - lockedAmount),
        lastTransaction: member.lastActiveAt || member.joinedAt || new Date().toISOString(),
      }
    })
  }, [data?.members])

  const filtered = useMemo(() => {
    const list = [...walletRows]

    list.sort((a, b) => b[sortKey] - a[sortKey])
    return list
  }, [sortKey, walletRows])

  const handleAdjustSubmit = (
    memberId:   number,
    walletType: 'cash' | 'pv',
    adjustType: 'credit' | 'debit',
    amount:     number,
    note:       string
  ) => {
    // TODO: call API — PATCH /api/admin/wallets/:memberId/adjust
    console.log('Adjust wallet:', { memberId, walletType, adjustType, amount, note })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-bold text-slate-800">Wallet & Credits</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage member cash and PV wallet balances</p>
        </div>
        <button className="flex items-center gap-2 rounded-[18px] border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 dark:border-white/18 dark:bg-white/12 dark:text-slate-200">
          <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </motion.div>

      <WalletCreditsStats wallets={filtered} />

      <WalletCreditsToolbar
        search={search}             onSearch={(value) => { setSearch(value); setPage(1) }}
        tierFilter={tierFilter}     onTierFilter={(value) => { setTierFilter(value as TierFilter); setPage(1) }}
        statusFilter={statusFilter} onStatusFilter={(value) => { setStatusFilter(value as StatusFilter); setPage(1) }}
        sortKey={sortKey}           onSortKey={setSortKey}
      />

      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          Failed to load member wallet records.
        </div>
      )}

      {isFetching && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs font-semibold text-sky-700">
          Refreshing wallet records...
        </div>
      )}

      <WalletCreditsTable
        wallets={filtered}
        sortKey={sortKey}
        onAdjust={setAdjustTarget}
        onViewBreakdown={setBreakdownTarget}
      />

      {data?.meta && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <span>
            Showing <span className="font-semibold text-slate-800 dark:text-slate-100">{data.meta.from ?? 0}-{data.meta.to ?? 0}</span>
            {' '}of <span className="font-semibold text-slate-800 dark:text-slate-100">{data.meta.total}</span> real members
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              Prev
            </button>
            <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {data.meta.current_page} / {data.meta.last_page}
            </span>
            <button
              type="button"
              disabled={page >= data.meta.last_page || isLoading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      <AdjustWalletModal
        member={adjustTarget}
        onClose={() => setAdjustTarget(null)}
        onSubmit={handleAdjustSubmit}
      />

      {breakdownTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBreakdownTarget(null)}
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="bg-gradient-to-br from-slate-950 via-sky-950 to-teal-900 px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-sky-300">PV allocation preview</p>
                  <h2 className="mt-1 text-lg font-bold">{breakdownTarget.name}</h2>
                  <p className="text-xs text-slate-300">{breakdownTarget.email}</p>
                </div>
                <button
                  onClick={() => setBreakdownTarget(null)}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/10"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-300">PV basis</p>
                <p className="mt-1 text-3xl font-black text-cyan-200">
                  {formatPvAmount(breakdownTarget.pvBalance)} PV
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Display-only computation. Actual posted credits still come from order delivery and backend wallet ledger.
                </p>
              </div>
            </div>

            <div className="space-y-3 px-6 py-5">
              {PV_ALLOCATION_ROWS.map((row) => {
                const value = breakdownTarget.pvBalance * row.rate
                return (
                  <div
                    key={row.label}
                    className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:grid-cols-[1fr_auto] dark:border-slate-800 dark:bg-slate-900/80"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-100 dark:bg-slate-950 dark:ring-slate-800">
                          {row.rateLabel}
                        </span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{row.label}</p>
                      </div>
                      <p className="mt-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {formatPvAmount(breakdownTarget.pvBalance)} PV x {row.rateLabel} = {formatPvAmount(value)}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-black text-slate-950 dark:text-white">{formatPvAmount(value)}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">computed value</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
