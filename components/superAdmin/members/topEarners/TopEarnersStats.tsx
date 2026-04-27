'use client'

import { motion } from 'framer-motion'
import { php } from './types'

interface TopEarnersStatsProps {
  totalEarnings: number
  activeEarners: number
  avgEarnings: number
  topEarnerAmount: number
}

export default function TopEarnersStats({
  totalEarnings,
  activeEarners,
  avgEarnings,
  topEarnerAmount,
}: TopEarnersStatsProps) {
  const stats = [
    {
      label: 'Total Earnings (All)',
      value: php(totalEarnings),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-teal-50',
      text: 'text-teal-600',
    },
    {
      label: 'Active Earners',
      value: String(activeEarners),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'Avg. Earnings / Member',
      value: php(Math.round(avgEarnings)),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      bg: 'bg-purple-50',
      text: 'text-purple-600',
    },
    {
      label: 'Top Earner',
      value: php(topEarnerAmount),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      bg: 'bg-sky-50',
      text: 'text-sky-600',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bg} ${stat.text}`}>
            {stat.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className="truncate text-base font-bold text-gray-800 dark:text-white">{stat.value}</p>
          </div>
        </div>
      ))}
    </motion.div>
  )
}
