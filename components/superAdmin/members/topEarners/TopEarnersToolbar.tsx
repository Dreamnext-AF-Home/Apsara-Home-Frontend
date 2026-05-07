'use client'

import { motion } from 'framer-motion'
import { SortKey, TIERS } from './types'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'earnings',   label: 'Earnings'   },
  { key: 'orders',     label: 'Orders'     },
  { key: 'referrals',  label: 'Referrals'  },
  { key: 'totalSpent', label: 'Spent'      },
]

const PERIODS = ['All Time', 'This Month', 'Last 30 Days', 'This Year']

interface TopEarnersToolbarProps {
  search: string; onSearch: (v: string) => void
  tierFilter: string; onTierFilter: (v: string) => void
  period: string; onPeriod: (v: string) => void
  sortKey: SortKey; onSortKey: (v: SortKey) => void
}

export default function TopEarnersToolbar({ search, onSearch, tierFilter, onTierFilter, period, onPeriod, sortKey, onSortKey }: TopEarnersToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" value={search} onChange={e => onSearch(e.target.value)}
            placeholder="Search member or email..."
            className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 dark:focus:border-sky-500 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 transition"
          />
          {search && (
            <button onClick={() => onSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tier filter */}
        <select value={tierFilter} onChange={e => onTierFilter(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400">
          {TIERS.map(t => <option key={t}>{t}</option>)}
        </select>

        {/* Period filter */}
        <select value={period} onChange={e => onPeriod(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400">
          {PERIODS.map(p => <option key={p}>{p}</option>)}
        </select>

        {/* Sort pills */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-0.5">
          {SORT_OPTIONS.map(opt => (
            <button key={opt.key} onClick={() => onSortKey(opt.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sortKey === opt.key
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
