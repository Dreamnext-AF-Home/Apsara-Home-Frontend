'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import RankingPodium from './RankingPodium'
import RankingLeaderboard from './RankingLeaderboard'
import RankingFilters from './RankingFilters'
import { php } from '@/components/superAdmin/members/topEarners/types'
import { useGetTopEarnersQuery } from '@/store/api/membersApi'

const PREVIOUS_RANKS: Record<number, number> = {
  1: 2, 2: 1, 3: 4, 4: 3, 5: 7,
  6: 5, 7: 8, 8: 6, 9: 11, 10: 9,
  11: 12, 12: 10,
}

export default function RankingPageClient() {
  const [period, setPeriod] = useState('all-time')
  const [search, setSearch] = useState('')
  const [demoStep, setDemoStep] = useState(0)
  const { data, isLoading, isError } = useGetTopEarnersQuery()

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDemoStep((step) => (step + 1) % 3)
    }, 3500)

    return () => window.clearInterval(timer)
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = data?.members ?? []
    if (q) {
      list = list.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.tier.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => b.earnings - a.earnings)
    return list
  }, [search, data?.members])

  const top3 = filtered.slice(0, 3)
  const remaining = filtered.slice(3)

  const animatedTop3 = useMemo(() => {
    if (top3.length < 3) return top3

    if (demoStep === 1) return [top3[1], top3[0], top3[2]]
    if (demoStep === 2) return [top3[1], top3[2], top3[0]]
    return top3
  }, [demoStep, top3])

  const animatedRemaining = useMemo(() => {
    if (remaining.length < 2) return remaining

    if (demoStep === 1) {
      return [remaining[1], remaining[0], ...remaining.slice(2)]
    }

    if (demoStep === 2 && remaining.length >= 4) {
      return [remaining[0], remaining[2], remaining[1], ...remaining.slice(3)]
    }

    return remaining
  }, [demoStep, remaining])

  const totalEarnings = filtered.reduce((sum, m) => sum + m.earnings, 0)
  const totalReferrals = filtered.reduce((sum, m) => sum + m.referrals, 0)

  const getMovement = (currentRank: number, earnerId: number) => {
    const previousRank = PREVIOUS_RANKS[earnerId] ?? currentRank
    const delta = previousRank - currentRank
    if (delta > 0) return `UP ${delta}`
    if (delta < 0) return `DOWN ${Math.abs(delta)}`
    return 'SAME'
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: '#FFFDF5', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
    >
      {/* Dot grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(#1E293B 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.06,
        }}
      />

      {/* Floating decorative shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top-left violet circle */}
        <motion.div
          animate={{ y: [0, -14, 0], rotate: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          className="absolute -left-16 -top-16 h-64 w-64 rounded-full border-4 border-[#8B5CF6]"
          style={{ backgroundColor: '#8B5CF620' }}
        />
        {/* Top-right yellow blob */}
        <motion.div
          animate={{ y: [0, 12, 0], rotate: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut', delay: 1 }}
          className="absolute -right-20 -top-10 h-56 w-56 rounded-full"
          style={{ backgroundColor: '#FBBF2430', border: '4px solid #FBBF24' }}
        />
        {/* Bottom-left pink triangle */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
          className="absolute bottom-24 left-8 h-16 w-16"
          style={{
            background: '#F472B6',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            opacity: 0.5,
          }}
        />
        {/* Mid-right emerald circle */}
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.5 }}
          className="absolute right-10 top-1/3 h-20 w-20 rounded-full"
          style={{ backgroundColor: '#34D39940', border: '3px solid #34D399' }}
        />
        {/* Small violet square */}
        <motion.div
          animate={{ rotate: [0, 45, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
          className="absolute bottom-40 right-24 h-10 w-10 rounded-md"
          style={{ backgroundColor: '#8B5CF650', border: '2px solid #8B5CF6' }}
        />
        {/* Pink dot cluster */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -8 - i * 2, 0] }}
            transition={{ repeat: Infinity, duration: 3 + i * 0.4, ease: 'easeInOut', delay: i * 0.2 }}
            className="absolute h-3 w-3 rounded-full"
            style={{
              backgroundColor: ['#F472B6', '#FBBF24', '#8B5CF6', '#34D399', '#F472B6'][i],
              left: `${15 + i * 8}%`,
              bottom: `${10 + (i % 3) * 6}%`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-12 lg:py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <p
              className="mb-1 text-xs font-bold uppercase tracking-[0.3em]"
              style={{ color: '#8B5CF6', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
            >
              Live Ranking
            </p>
            <h1
              className="text-3xl font-extrabold sm:text-4xl"
              style={{ fontFamily: '"Outfit", system-ui, sans-serif', color: '#1E293B' }}
            >
              Realtime Leaderboard
            </h1>
            {/* Squiggle underline */}
            <svg className="mt-1" width="180" height="10" viewBox="0 0 180 10" fill="none">
              <path d="M0 5 Q22 0 45 5 Q68 10 90 5 Q112 0 135 5 Q158 10 180 5" stroke="#F472B6" strokeWidth="3" fill="none" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Live badge */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-bold uppercase tracking-widest"
            style={{ borderColor: '#1E293B', backgroundColor: '#34D399', color: '#1E293B', boxShadow: '4px 4px 0px #1E293B' }}
          >
            <span className="h-2 w-2 rounded-full bg-[#1E293B]" />
            Live
          </motion.div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, type: 'spring', bounce: 0.35 }}
          className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {/* Total Earnings */}
          <div
            className="col-span-2 flex items-center gap-4 rounded-2xl border-2 bg-white px-5 py-4 sm:col-span-1"
            style={{ borderColor: '#1E293B', boxShadow: '5px 5px 0px #FBBF24' }}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2" style={{ borderColor: '#1E293B', backgroundColor: '#FBBF2420' }}>
              <svg className="h-6 w-6" fill="none" stroke="#F59E0B" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Total Earnings</p>
              <motion.p
                key={totalEarnings}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-0.5 truncate text-lg font-black"
                style={{ fontFamily: '"Outfit", system-ui, sans-serif', color: '#1E293B' }}
              >
                {php(totalEarnings)}
              </motion.p>
            </div>
          </div>

          {/* Total Referrals */}
          <div
            className="col-span-2 flex items-center gap-4 rounded-2xl border-2 bg-white px-5 py-4 sm:col-span-1"
            style={{ borderColor: '#1E293B', boxShadow: '5px 5px 0px #8B5CF6' }}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2" style={{ borderColor: '#1E293B', backgroundColor: '#8B5CF620' }}>
              <svg className="h-6 w-6" fill="none" stroke="#8B5CF6" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Total Referrals</p>
              <motion.p
                key={totalReferrals}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-0.5 text-lg font-black"
                style={{ fontFamily: '"Outfit", system-ui, sans-serif', color: '#1E293B' }}
              >
                {totalReferrals.toLocaleString()}
              </motion.p>
            </div>
          </div>

          {/* Active Members */}
          <div
            className="flex items-center gap-4 rounded-2xl border-2 bg-white px-5 py-4"
            style={{ borderColor: '#1E293B', boxShadow: '5px 5px 0px #34D399' }}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2" style={{ borderColor: '#1E293B', backgroundColor: '#34D39920' }}>
              <svg className="h-6 w-6" fill="none" stroke="#10B981" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Members</p>
              <p className="mt-0.5 text-lg font-black" style={{ fontFamily: '"Outfit", system-ui, sans-serif', color: '#1E293B' }}>
                {filtered.length.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Top Earner */}
          <div
            className="flex items-center gap-4 rounded-2xl border-2 bg-white px-5 py-4"
            style={{ borderColor: '#1E293B', boxShadow: '5px 5px 0px #F472B6' }}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2" style={{ borderColor: '#1E293B', backgroundColor: '#F472B620' }}>
              <svg className="h-6 w-6" fill="none" stroke="#EC4899" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Top Earner</p>
              <p className="mt-0.5 truncate text-sm font-black" style={{ fontFamily: '"Outfit", system-ui, sans-serif', color: '#1E293B' }}>
                {filtered[0]?.name ?? '—'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="mb-6">
          <RankingFilters period={period} onPeriod={setPeriod} search={search} onSearch={setSearch} />
        </div>

        {/* Podium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', bounce: 0.3 }}
          className="mb-6"
        >
          {filtered.length > 0 ? (
            <RankingPodium top3={animatedTop3} demoStep={demoStep} />
          ) : (
            <div
              className="rounded-2xl border-2 py-16 text-center"
              style={{ borderColor: '#1E293B', backgroundColor: '#fff', boxShadow: '6px 6px 0px #1E293B' }}
            >
              <p className="text-lg font-bold" style={{ color: '#1E293B', fontFamily: '"Outfit", system-ui, sans-serif' }}>
                No challengers found
              </p>
            </div>
          )}
        </motion.div>

        {/* Leaderboard */}
        {remaining.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, type: 'spring', bounce: 0.3 }}
          >
            <RankingLeaderboard earners={animatedRemaining} startRank={4} getMovement={getMovement} demoStep={demoStep} />
          </motion.div>
        )}
      </div>
    </div>
  )
}
