'use client'

import { motion } from 'framer-motion'
import { TopEarner, TIER_COLORS, STATUS_CONFIG, MEDALS, php, getInitials } from './types'

interface TableRowProps {
  earner: TopEarner
  rank: number
  maxEarnings: number
}

function TableRow({ earner, rank, maxEarnings }: TableRowProps) {
  const tier   = TIER_COLORS[earner.tier] ?? 'bg-slate-100 text-slate-600 border-slate-200'
  const status = STATUS_CONFIG[earner.status]
  const medal  = MEDALS[rank]
  const pct    = maxEarnings > 0 ? (earner.earnings / maxEarnings) * 100 : 0

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      {/* Rank */}
      <td className="px-4 py-3.5 text-center">
        {medal ? (
          <span className="text-xl leading-none">{medal.emoji}</span>
        ) : (
          <span className="text-sm font-bold text-gray-400 dark:text-gray-500">#{rank}</span>
        )}
      </td>

      {/* Member */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold ${medal?.bg ?? 'bg-gradient-to-br from-gray-400 to-gray-600'}`}>
            {getInitials(earner.name)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">{earner.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{earner.email}</p>
          </div>
        </div>
      </td>

      {/* Tier */}
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${tier}`}>
          {earner.tier}
        </span>
      </td>

      {/* Earnings with progress bar */}
      <td className="px-4 py-3.5 min-w-[170px]">
        <p className="text-sm font-bold text-teal-700 dark:text-teal-300 mb-1">{php(earner.earnings)}</p>
        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden w-full max-w-[110px]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </td>

      {/* Orders */}
      <td className="px-4 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-100">{earner.orders}</td>

      {/* Referrals */}
      <td className="px-4 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-100">{earner.referrals}</td>

      {/* Total Spent */}
      <td className="px-4 py-3.5 text-sm font-medium text-gray-600 dark:text-gray-300">{php(earner.totalSpent)}</td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full shrink-0 ${status.dot}`} />
          <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
        </div>
      </td>

      {/* Joined */}
      <td className="px-4 py-3.5 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
        {new Date(earner.joinedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
      </td>
    </tr>
  )
}

interface TopEarnersTableProps {
  earners: TopEarner[]
  sortKey: string
  isLoading?: boolean
  isError?: boolean
}

export default function TopEarnersTable({ earners, sortKey, isLoading = false, isError = false }: TopEarnersTableProps) {
  const maxEarnings = earners[0]?.earnings ?? 1
  const totalShown  = earners.reduce((s, m) => s + m.earnings, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
    >
      {/* Card header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-800 dark:text-white">Full Rankings</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{earners.length} members listed</p>
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2.5 py-1 rounded-full font-medium capitalize">
          By {sortKey}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-14">Rank</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Member</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tier</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Earnings</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Orders</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Referrals</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Spent</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-5 py-14 text-center">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Loading top earners...</p>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={9} className="px-5 py-14 text-center">
                  <p className="text-sm font-semibold text-red-500">Unable to load top earners right now.</p>
                </td>
              </tr>
            ) : earners.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No members found</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Try adjusting your search or filter</p>
                  </div>
                </td>
              </tr>
            ) : (
              earners.map((earner, i) => (
                <TableRow key={earner.id} earner={earner} rank={i + 1} maxEarnings={maxEarnings} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          Showing <span className="font-semibold text-gray-700 dark:text-gray-200">{earners.length}</span> members
        </span>
        <span>
          Total earnings:{' '}
          <span className="font-bold text-teal-600 dark:text-teal-400">{php(totalShown)}</span>
        </span>
      </div>
    </motion.div>
  )
}
