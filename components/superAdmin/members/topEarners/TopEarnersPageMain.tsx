'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useGetTopEarnersQuery } from '@/store/api/membersApi'
import { SortKey, TIERS, TopEarner } from './types'
import TopEarnersStats from './TopEarnersStats'
import TopEarnersPodium from './TopEarnersPodium'
import TopEarnersToolbar from './TopEarnersToolbar'
import TopEarnersTable from './TopEarnersTable'

export default function TopEarnersPageMain() {
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('All Tiers')
  const [period, setPeriod] = useState('All Time')
  const [sortKey, setSortKey] = useState<SortKey>('earnings')

  const apiSortKey = sortKey === 'totalSpent' ? 'total_spent' : sortKey
  const { data, isLoading, isError } = useGetTopEarnersQuery({
    search,
    tier: tierFilter as (typeof TIERS)[number],
    sort: apiSortKey,
  })

  const sorted = useMemo(() => {
    const list = [...(data?.members ?? [])] as TopEarner[]
    list.sort((a, b) => b[sortKey] - a[sortKey])
    return list
  }, [data?.members, sortKey])

  const top3 = sorted.slice(0, 3)
  const summary = data?.summary

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Top Earners</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Members ranked by total commission earnings</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-600">
          <svg className="h-4 w-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </motion.div>

      <TopEarnersStats
        totalEarnings={summary?.totalEarnings ?? 0}
        activeEarners={summary?.activeEarners ?? 0}
        avgEarnings={summary?.avgEarnings ?? 0}
        topEarnerAmount={summary?.topEarnerAmount ?? 0}
      />

      <TopEarnersPodium top3={top3} />

      <TopEarnersToolbar
        search={search}
        onSearch={setSearch}
        tierFilter={tierFilter}
        onTierFilter={setTierFilter}
        period={period}
        onPeriod={setPeriod}
        sortKey={sortKey}
        onSortKey={setSortKey}
      />

      <TopEarnersTable earners={sorted} sortKey={sortKey} isLoading={isLoading} isError={isError} />
    </div>
  )
}
