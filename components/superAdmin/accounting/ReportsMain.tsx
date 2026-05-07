'use client'

import Link from 'next/link'

const STRIPE = {
  backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
  backgroundSize: '10px 10px',
}

const REPORTS = [
  {
    group: 'Payout Reports',
    items: [
      {
        title: 'Payout Summary',
        description: 'Aggregate payout totals by period, channel, and status with drill-down by affiliate.',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
          </svg>
        ),
        from: 'from-sky-500', to: 'to-blue-600', shadow: 'shadow-sky-500/20',
        tag: 'Available',
        href: '/admin/accounting/disbursement-history',
      },
      {
        title: 'Disbursement History',
        description: 'Full ledger of all released payments with invoice numbers, channels, and account details.',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
        ),
        from: 'from-emerald-500', to: 'to-teal-600', shadow: 'shadow-emerald-500/20',
        tag: 'Available',
        href: '/admin/accounting/disbursement-history',
      },
      {
        title: 'Channel Mix Report',
        description: 'Breakdown of payout volumes across GCash, Maya, and Bank with percentage share analysis.',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
          </svg>
        ),
        from: 'from-cyan-500', to: 'to-cyan-600', shadow: 'shadow-cyan-500/20',
        tag: 'Available',
        href: '/admin/accounting/reconciliation',
      },
    ],
  },
  {
    group: 'Risk & Compliance',
    items: [
      {
        title: 'Exception Report',
        description: 'Flagged transactions — rejected requests, on-hold queue, and outlier payout amounts.',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        ),
        from: 'from-red-500', to: 'to-rose-600', shadow: 'shadow-red-500/20',
        tag: 'Coming Soon',
        href: null,
      },
      {
        title: 'Audit Log Export',
        description: 'Full activity trail export for compliance — approval events, rejections, releases, and holds.',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
        ),
        from: 'from-slate-700', to: 'to-slate-800', shadow: '',
        tag: 'Available',
        href: '/admin/accounting/audit',
      },
      {
        title: 'Reconciliation Report',
        description: 'Period-based balance reconciliation across all channels, statuses, and settlement entries.',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
          </svg>
        ),
        from: 'from-violet-500', to: 'to-purple-600', shadow: 'shadow-violet-500/20',
        tag: 'Available',
        href: '/admin/accounting/reconciliation',
      },
    ],
  },
  {
    group: 'Financial Analytics',
    items: [
      {
        title: 'Queue Aging Report',
        description: 'How long requests have been waiting for approval or release — identify bottlenecks.',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        from: 'from-amber-500', to: 'to-orange-500', shadow: 'shadow-amber-500/20',
        tag: 'Coming Soon',
        href: null,
      },
      {
        title: 'Affiliate Payout Report',
        description: 'Per-affiliate payout history, lifetime disbursements, and frequency analysis.',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        ),
        from: 'from-indigo-500', to: 'to-indigo-600', shadow: 'shadow-indigo-500/20',
        tag: 'Coming Soon',
        href: null,
      },
      {
        title: 'Revenue Throughput',
        description: 'Completion rate trends, average processing time, and pipeline efficiency metrics.',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
        ),
        from: 'from-teal-500', to: 'to-teal-600', shadow: 'shadow-teal-500/20',
        tag: 'Coming Soon',
        href: null,
      },
    ],
  },
]

export default function ReportsMain() {
  return (
    <div className="space-y-5">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-black shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(14,165,233,0.08),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={STRIPE} />
        <div className="relative px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-md bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Accounting
                </span>
                <span className="rounded-full bg-indigo-400/15 border border-indigo-400/30 px-2.5 py-1 text-[10px] font-semibold text-indigo-300">
                  9 report types
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Accounting Reports</h1>
              <p className="mt-0.5 text-sm text-slate-400">Generate payout summaries, queue aging, and exception analytics</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Quick Links</p>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Link href="/admin/accounting/invoices" className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors">
                  Invoices
                </Link>
                <Link href="/admin/accounting/reconciliation" className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors">
                  Reconciliation
                </Link>
                <Link href="/admin/accounting/audit" className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors">
                  Audit Trail
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Report Groups ── */}
      {REPORTS.map(({ group, items }) => (
        <div key={group} className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{group}</h2>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/60" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map(({ title, description, icon, from, to, shadow, tag, href }) => {
              const isAvailable = tag === 'Available'
              const card = (
                <div className={`group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm ${isAvailable ? 'hover:shadow-md transition-all duration-200 cursor-pointer' : 'opacity-80'}`}>
                  <div className={`relative overflow-hidden bg-gradient-to-br ${from} ${to} px-5 py-4 shadow-md ${shadow}`}>
                    <div className="absolute inset-0 opacity-[0.07]" style={STRIPE} />
                    <div className="relative flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white">
                        {icon}
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        isAvailable
                          ? 'bg-white/20 text-white'
                          : 'bg-black/20 text-white/70'
                      }`}>
                        {tag}
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
                    {isAvailable && (
                      <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:gap-2 transition-all">
                        View report
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    )}
                    {!isAvailable && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        In development
                      </div>
                    )}
                  </div>
                </div>
              )

              return href ? <Link key={title} href={href}>{card}</Link> : <div key={title}>{card}</div>
            })}
          </div>
        </div>
      ))}

    </div>
  )
}
