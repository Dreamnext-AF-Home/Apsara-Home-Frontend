'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import TierBadge from '@/components/ui/TierBadge'
import { TopEarner, STATUS_CONFIG, MEDALS, php } from './types'

function MemberAvatar({ src, name, bgCls, size }: { src?: string; name: string; bgCls: string; size: string }) {
  const [err, setErr] = useState(false)
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  if (src && !err) {
    return (
      <img src={src} alt={name} onError={() => setErr(true)}
        className={`rounded-full object-cover shrink-0 ${size}`} />
    )
  }
  return (
    <div className={`rounded-full shrink-0 flex items-center justify-center font-bold text-white ${size} ${bgCls}`}>
      {initials}
    </div>
  )
}

interface TableRowProps { earner: TopEarner; rank: number; maxEarnings: number }

function TableRow({ earner, rank, maxEarnings }: TableRowProps) {
  const status = STATUS_CONFIG[earner.status] ?? STATUS_CONFIG.active
  const medal  = MEDALS[rank]
  const pct    = maxEarnings > 0 ? Math.min((earner.earnings / maxEarnings) * 100, 100) : 0
  const avatarBg = medal?.bg ?? 'bg-gradient-to-br from-slate-500 to-slate-600'

  return (
    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group">
      {/* Rank */}
      <td className="px-4 py-3.5 text-center w-14">
        {medal ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg leading-none">{medal.crown}</span>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">{medal.label}</span>
          </div>
        ) : (
          <span className="text-sm font-black text-slate-400 dark:text-slate-500">#{rank}</span>
        )}
      </td>

      {/* Member */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <MemberAvatar src={earner.avatar} name={earner.name} bgCls={avatarBg} size="h-9 w-9 text-xs" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-none">{earner.name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[160px]">{earner.email}</p>
          </div>
        </div>
      </td>

      {/* Tier */}
      <td className="px-4 py-5">
        <TierBadge tier={earner.tier} sizeClassName="h-20 w-20" />
      </td>

      {/* Earnings + bar */}
      <td className="px-4 py-3.5 min-w-[160px]">
        <p className="text-sm font-black text-teal-700 dark:text-teal-300 tabular-nums mb-1.5">{php(earner.earnings)}</p>
        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden w-full max-w-[120px]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </td>

      {/* Orders */}
      <td className="px-4 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{earner.orders}</td>

      {/* Referrals */}
      <td className="px-4 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{earner.referrals}</td>

      {/* Total Spent */}
      <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400 tabular-nums">{php(earner.totalSpent)}</td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-[11px] font-semibold
          bg-white dark:bg-transparent border-slate-200 dark:border-slate-700">
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${status.dot}`} />
          <span className={status.text}>{status.label}</span>
        </div>
      </td>

      {/* Joined */}
      <td className="px-4 py-3.5 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
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
      className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-500/15">
            <svg className="h-4 w-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
            </svg>
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Full Rankings</h2>
          <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
            {earners.length}
          </span>
        </div>
        <span className="text-xs font-semibold capitalize text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
          Sorted by {sortKey}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[860px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700/60 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <th className="px-4 py-3 text-center w-14">Rank</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Earnings</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Referrals</th>
              <th className="px-4 py-3">Total Spent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4"><div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto" /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-800" />
                        <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-slate-800" />
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-4"><div className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-800" /></td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={9} className="px-5 py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                      <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-red-500">Unable to load top earners.</p>
                  </div>
                </td>
              </tr>
            ) : earners.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No members found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Try adjusting your search or filter</p>
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
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
        <span>
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{earners.length}</span> members
        </span>
        <span>
          Total earnings:{' '}
          <span className="font-black text-teal-600 dark:text-teal-400">{php(totalShown)}</span>
        </span>
      </div>
    </motion.div>
  )
}
