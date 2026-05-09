'use client'

import { motion } from 'framer-motion'
import DataTableShell from '@/components/superAdmin/DataTableShell'
import { MemberWallet, TIER_COLORS, STATUS_CONFIG, php, pv, getInitials, timeAgo } from './types'
import AvatarImg from '@/components/superAdmin/AvatarImg'

interface WalletCreditsTableProps {
  wallets:    MemberWallet[]
  sortKey:    string
  onAdjust:   (member: MemberWallet) => void
  onViewBreakdown: (member: MemberWallet) => void
}

function WalletRow({
  wallet,
  onAdjust,
  onViewBreakdown,
}: {
  wallet: MemberWallet
  onAdjust: () => void
  onViewBreakdown: () => void
}) {
  const tier   = TIER_COLORS[wallet.tier]   ?? 'bg-slate-100 text-slate-600 border-slate-200'
  const status = STATUS_CONFIG[wallet.status]

  return (
    <tr className="hover:bg-slate-50/70 transition-colors">
      {/* Member */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <AvatarImg src={wallet.avatar} name={wallet.name} size="h-9 w-9" bg="bg-gradient-to-br from-teal-400 to-teal-600" textSize="text-xs" />
          <div>
            <p className="text-sm font-semibold text-slate-800">{wallet.name}</p>
            <p className="text-xs text-slate-400">{wallet.email}</p>
          </div>
        </div>
      </td>

      {/* Tier */}
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${tier}`}>
          {wallet.tier}
        </span>
      </td>

      {/* Cash Balance */}
      <td className="px-4 py-3.5">
        <p className="text-sm font-bold text-emerald-700">{php(wallet.cashBalance)}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          <span className="text-teal-600">+{php(wallet.cashCredits)}</span>
          {' / '}
          <span className="text-rose-500">-{php(wallet.cashDebits)}</span>
        </p>
      </td>

      {/* PV Balance */}
      <td className="px-4 py-3.5">
        <p className="text-sm font-bold text-blue-700">{pv(wallet.pvBalance)}</p>
      </td>

      {/* Locked */}
      <td className="px-4 py-3.5">
        <span className="text-sm font-semibold text-sky-700">{php(wallet.lockedAmount)}</span>
      </td>

      {/* Available */}
      <td className="px-4 py-3.5">
        <span className="text-sm font-semibold text-teal-700">{php(wallet.availableAmount)}</span>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full shrink-0 ${status.dot}`} />
          <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
        </div>
      </td>

      {/* Last transaction */}
      <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
        {timeAgo(wallet.lastTransaction)}
      </td>

      {/* Action */}
      <td className="px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onViewBreakdown}
            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition-all hover:bg-sky-100"
          >
            PV Breakdown
          </button>
          <button
            onClick={onAdjust}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Adjust
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function WalletCreditsTable({ wallets, sortKey, onAdjust, onViewBreakdown }: WalletCreditsTableProps) {
  const totalCash = wallets.reduce((s, m) => s + m.cashBalance, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-0"
    >
      <DataTableShell
        title="Member Wallets"
        subtitle="Review cash and PV wallet balances"
        badge={(
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            By {sortKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </span>
        )}
        footer={(
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing <span className="font-semibold text-slate-600 dark:text-slate-300">{wallets.length}</span> members
            </span>
            <span>
              Total cash balance:{' '}
              <span className="font-bold text-emerald-600">{php(totalCash)}</span>
            </span>
          </div>
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Member</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Tier</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Cash Balance</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">PV Balance</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Locked</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Available</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Last Txn</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {wallets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-sm font-semibold text-slate-500">No members found</p>
                      <p className="text-xs text-slate-400">Try adjusting your search or filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                wallets.map((w) => (
                  <WalletRow
                    key={w.id}
                    wallet={w}
                    onAdjust={() => onAdjust(w)}
                    onViewBreakdown={() => onViewBreakdown(w)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </DataTableShell>
    </motion.div>
  )
}
