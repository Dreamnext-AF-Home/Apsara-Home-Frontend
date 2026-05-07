'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import TierBadge from '@/components/ui/TierBadge'
import { TopEarner, STATUS_CONFIG, MEDALS, php } from './types'

function MemberAvatar({
  src, name, size, ringCls, bgCls,
}: { src?: string; name: string; size: string; ringCls: string; bgCls: string }) {
  const [err, setErr] = useState(false)
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  if (src && !err) {
    return (
      <img
        src={src} alt={name} onError={() => setErr(true)}
        className={`rounded-full object-cover ${size} ${ringCls}`}
      />
    )
  }
  return (
    <div className={`rounded-full flex items-center justify-center font-bold text-white ${size} ${ringCls} ${bgCls}`}>
      {initials}
    </div>
  )
}

const RANK_STYLE = {
  1: {
    card:    'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 dark:from-yellow-500/10 dark:to-amber-500/10 dark:border-yellow-500/30',
    crown:   'bg-gradient-to-r from-yellow-400 to-amber-500 text-white',
    earningsBox: 'bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30',
    earningsText: 'text-yellow-700 dark:text-yellow-300',
    earningsLabel: 'text-yellow-600/70 dark:text-yellow-400/70',
    badgeCrown: 'text-yellow-500',
    scale: 'sm:scale-105',
    order: 'sm:order-2',
  },
  2: {
    card:    'bg-white border-slate-200 dark:bg-slate-800/60 dark:border-slate-700',
    crown:   'bg-slate-500 text-white',
    earningsBox: 'bg-slate-50 border-slate-200 dark:bg-slate-700/50 dark:border-slate-600',
    earningsText: 'text-slate-700 dark:text-slate-200',
    earningsLabel: 'text-slate-500 dark:text-slate-400',
    badgeCrown: 'text-slate-400',
    scale: '',
    order: 'sm:order-1',
  },
  3: {
    card:    'bg-white border-orange-100 dark:bg-slate-800/60 dark:border-orange-500/20',
    crown:   'bg-gradient-to-r from-orange-400 to-amber-500 text-white',
    earningsBox: 'bg-orange-50 border-orange-100 dark:bg-orange-500/10 dark:border-orange-500/20',
    earningsText: 'text-orange-700 dark:text-orange-300',
    earningsLabel: 'text-orange-500/70 dark:text-orange-400/60',
    badgeCrown: 'text-orange-400',
    scale: '',
    order: 'sm:order-3',
  },
} as const

interface PodiumCardProps { earner: TopEarner; rank: 1 | 2 | 3 }

function PodiumCard({ earner, rank }: PodiumCardProps) {
  const medal  = MEDALS[rank]
  const style  = RANK_STYLE[rank]
  const status = STATUS_CONFIG[earner.status] ?? STATUS_CONFIG.active

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
      className={`relative overflow-hidden rounded-2xl border shadow-sm flex flex-col items-center text-center p-5 transition-transform ${style.card} ${style.order} ${style.scale}`}
    >
      {/* Crown / rank badge */}
      <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest ${style.crown}`}>
        <span>{medal.crown}</span>
        <span>{medal.label} Place</span>
      </div>

      {/* Avatar */}
      <div className={`relative mb-3 shadow-lg ${style.scale === '' ? '' : 'shadow-yellow-400/20'}`}>
        <MemberAvatar
          src={earner.avatar}
          name={earner.name}
          size="h-20 w-20 text-xl"
          ringCls={medal.ring}
          bgCls={medal.bg}
        />
        {rank === 1 && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl leading-none select-none">👑</span>
        )}
      </div>

      {/* Name + email */}
      <p className="text-sm font-black text-slate-800 dark:text-white leading-tight">{earner.name}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[160px]">{earner.email}</p>

      {/* Tier */}
      <div className="mt-2.5">
        <TierBadge tier={earner.tier} sizeClassName="h-14 w-14" />
      </div>

      {/* Earnings */}
      <div className={`mt-3 w-full rounded-xl border px-4 py-3 ${style.earningsBox}`}>
        <p className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${style.earningsLabel}`}>Total Earnings</p>
        <p className={`text-xl font-black tabular-nums ${style.earningsText}`}>{php(earner.earnings)}</p>
      </div>

      {/* Mini stats */}
      <div className="mt-2.5 w-full grid grid-cols-3 gap-1.5">
        {[
          { label: 'Orders',   value: earner.orders    },
          { label: 'Referrals', value: earner.referrals },
          { label: 'Status',   value: status.label, custom: <span className={`text-xs font-bold ${status.text}`}>{status.label}</span> },
        ].map(({ label, value, custom }) => (
          <div key={label} className="rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 py-2">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none mb-1">{label}</p>
            {custom ?? <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{value}</p>}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

interface TopEarnersPodiumProps { top3: TopEarner[]; isLoading?: boolean }

export default function TopEarnersPodium({ top3, isLoading }: TopEarnersPodiumProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[2, 1, 3].map(i => (
          <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 animate-pulse">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-24 rounded-full bg-slate-100 dark:bg-slate-700" />
              <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-700" />
              <div className="h-4 w-28 rounded bg-slate-100 dark:bg-slate-700" />
              <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-700" />
              <div className="h-14 w-full rounded-xl bg-slate-100 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (top3.length === 0) return null

  const ordered: (TopEarner | undefined)[] = [top3[1], top3[0], top3[2]]

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Podium</span>
        <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
        <span className="text-xs text-slate-400 dark:text-slate-500">{top3.length} of {top3.length + (top3.length < 3 ? 0 : 0)} shown</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        {ordered.map((earner) => {
          if (!earner) return null
          const rank = (earner === top3[0] ? 1 : earner === top3[1] ? 2 : 3) as 1 | 2 | 3
          return <PodiumCard key={earner.id} earner={earner} rank={rank} />
        })}
      </div>
    </motion.div>
  )
}
