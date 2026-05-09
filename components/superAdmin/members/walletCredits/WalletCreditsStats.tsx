'use client'

import { motion } from 'framer-motion'
import { MemberWallet, php, pv } from './types'

const total = (wallets: MemberWallet[], key: keyof MemberWallet) =>
  wallets.reduce((s, m) => s + (Number(m[key]) || 0), 0)

export default function WalletCreditsStats({ wallets }: { wallets: MemberWallet[] }) {
  const stats = [
    {
      label: 'Page Cash Balance',
      value: php(total(wallets, 'cashBalance')),
      sub: 'Real member records shown',
      bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Page PV Balance',
      value: pv(total(wallets, 'pvBalance')),
      sub: 'Real member records shown',
      bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Page Locked',
      value: php(total(wallets, 'lockedAmount')),
      sub: 'Pending encashments',
      bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      label: 'Page Available',
      value: php(total(wallets, 'availableAmount')),
      sub: 'Cash minus locked',
      bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {stats.map((s, i) => (
        <div key={i} className={`bg-white border ${s.border} rounded-2xl p-4 dark:bg-slate-900`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`h-9 w-9 rounded-xl ${s.bg} ${s.text} flex items-center justify-center shrink-0`}>
              {s.icon}
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">{s.label}</p>
          </div>
          <p className="text-lg font-bold text-slate-800">{s.value}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
        </div>
      ))}
    </motion.div>
  )
}
