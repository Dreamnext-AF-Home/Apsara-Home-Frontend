'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useGetTopEarnersQuery } from '@/store/api/membersApi'
import { SortKey, TIERS, TopEarner, php } from './types'
import TopEarnersPodium from './TopEarnersPodium'
import TopEarnersToolbar from './TopEarnersToolbar'
import TopEarnersTable from './TopEarnersTable'

const STRIPE = {
  backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
  backgroundSize: '10px 10px',
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function TopEarnersPageMain() {
  const [search,     setSearch]     = useState('')
  const [tierFilter, setTierFilter] = useState('All Tiers')
  const [period,     setPeriod]     = useState('All Time')
  const [sortKey,    setSortKey]    = useState<SortKey>('earnings')

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

  const top3    = sorted.slice(0, 3)
  const summary = data?.summary

  const handleExportCSV = () => {
    if (!sorted.length) return
    const ts = new Date().toISOString().slice(0, 10)
    downloadCSV(
      `top-earners-${ts}.csv`,
      ['Rank', 'Name', 'Email', 'Tier', 'Earnings (PHP)', 'Orders', 'Referrals', 'Total Spent (PHP)', 'Status', 'Joined'],
      sorted.map((e, i) => [
        String(i + 1),
        e.name,
        e.email,
        e.tier,
        String(e.earnings),
        String(e.orders),
        String(e.referrals),
        String(e.totalSpent),
        e.status,
        new Date(e.joinedAt).toLocaleDateString('en-PH'),
      ]),
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Hero ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 dark:from-slate-900 dark:to-black shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.12),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(20,184,166,0.08),transparent_55%)]" />
          <div className="absolute inset-0 opacity-[0.04]" style={STRIPE} />
          <div className="relative px-6 py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="rounded-md bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    Members
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400/15 border border-yellow-400/30 px-2.5 py-1 text-[10px] font-semibold text-yellow-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
                    Live Rankings
                  </span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">Top Earners</h1>
                <p className="mt-0.5 text-sm text-slate-400">Members ranked by total commission earnings</p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {summary && (
                  <div className="text-right mr-2 hidden sm:block">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Total Pool</p>
                    <p className="text-xl font-black text-white">{php(summary.totalEarnings)}</p>
                  </div>
                )}
                <button
                  onClick={handleExportCSV}
                  disabled={!sorted.length}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-40 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>

            {/* KPI strip */}
            {summary && (
              <div className="mt-5 pt-4 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Earnings',  value: php(summary.totalEarnings),          color: 'text-yellow-300' },
                  { label: 'Active Earners',  value: String(summary.activeEarners),        color: 'text-teal-300'   },
                  { label: 'Avg / Member',    value: php(Math.round(summary.avgEarnings)), color: 'text-sky-300'    },
                  { label: 'Top Earner',      value: php(summary.topEarnerAmount),         color: 'text-amber-300'  },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
                    <p className={`text-xl font-black tabular-nums ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <TopEarnersPodium top3={top3} isLoading={isLoading} />

      <TopEarnersToolbar
        search={search} onSearch={setSearch}
        tierFilter={tierFilter} onTierFilter={setTierFilter}
        period={period} onPeriod={setPeriod}
        sortKey={sortKey} onSortKey={setSortKey}
      />

      <TopEarnersTable earners={sorted} sortKey={sortKey} isLoading={isLoading} isError={isError} />
    </div>
  )
}
