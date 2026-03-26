'use client';

import PvStatCard from "./PvStatCard";

type PvHistoryItem = {
    id: number;
    description: string;
    source: string;
    amount: number;
    status: 'pending' | 'approved' | 'cancelled';
    created_at: string;
}

interface PvWalletTabProps {
    currentPv: number;
    pendingPv: number;
    lifetimePv: number;
    personalPurchasePv?: number;
    groupPv?: number;
    currentMonthGroupPv?: number;
    currentCv?: number;
    goalPv?: number;
    history: PvHistoryItem[];
    totalReferrals?: number;
    verifiedReferrals?: number;
    activeReferrals?: number;
}

function statusClasses(status: PvHistoryItem['status']) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    case 'pending':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
    case 'cancelled':
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
    default:
      return 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'
  }
}


const PvWalletTab = ({
    currentPv,
    pendingPv,
    lifetimePv,
    personalPurchasePv = 0,
    groupPv = 0,
    currentMonthGroupPv = 0,
    currentCv = 0,
    goalPv = 50000,
    history,
    totalReferrals = 0,
    verifiedReferrals = 0,
    activeReferrals = 0,
}: PvWalletTabProps) => {
  const progress = Math.min((currentPv / goalPv) * 100, 100)
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <PvStatCard 
            label="Affiliate Retail Profit"
            value={currentPv}
            accent="blue"
            helper="Profit earned from your retail affiliate sales"
        />
        <PvStatCard 
            label="Yearly Purchases"
            value={pendingPv}
            accent="amber"
            helper="Your Purchase Accumulated this Year"
        />
        <PvStatCard 
            label="Affiliate Performance Bonus"
            value={lifetimePv}
            accent="emerald"
            helper="Bonus earned based on affiliate performance metrics"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PvStatCard
          label="Global Purchase Bonus"
          value={personalPurchasePv}
          accent="violet"
          helper="Earnings from worldwide purchases"
        />
        <PvStatCard
          label="Group Purchase Bonus"
          value={groupPv}
          accent="blue"
          helper="Bonus from your group’s purchases"
        />
        <PvStatCard
          label="Monthly Purchase Points"
          value={currentMonthGroupPv}
          accent="emerald"
          helper="Purchase Points this Month"
        />
        <PvStatCard
          label="Total Bonus"
          value={currentCv}
          accent="amber"
          helper="Total earnings from all bonus sources"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                        Performance Value Goal
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                        {currentPv.toLocaleString()} / {goalPv.toLocaleString()} PV
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                        Track your progress toward your next target.
                    </p>
                </div>

                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    {progress.toFixed(1)}%
                </div>
            </div>

            <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100">
                <div 
                    className="h-full rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 transition-all duration-500"
                    style={{ width: `${progress}%`}}
                />
            </div>

            <div className="mt-4 flex justify-between text-xs text-slate-400">
                <span>0 PV</span>
                <span>{goalPv.toLocaleString()}</span>
            </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                Referral Summary
            </p>
            <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-600">Total Referrals</span>
                    <span className="text-lg font-semibold text-slate-900">
                        {totalReferrals}
                    </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-600">Verified Referrals</span>
                    <span className="text-lg font-semibold text-slate-900">
                        {verifiedReferrals}
                    </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-600">Active Referrals</span>
                    <span className="text-lg font-semibold text-slate-900">
                        {activeReferrals}
                    </span>
                </div>
            </div>
        </aside>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                    Transaction History
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                    PV History
                </h3>
            </div>
        </div>

        <div className="mt-6 overflow-x-auto">
            {history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
                    <p className="text-sm font-medium text-slate-700">
                        No PV transactions yet
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                        Approved referral purchases and future PV credits will appear here.
                    </p>
                </div>
            ): (
                <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                  <th className="pb-3 pr-4">Description</th>
                  <th className="pb-3 pr-4">Source</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">PV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-slate-900">{item.description}</p>
                    </td>
                    <td className="py-4 pr-4 text-sm text-slate-600">{item.source}</td>
                    <td className="py-4 pr-4 text-sm text-slate-500">
                      {new Date(item.created_at).toLocaleString('en-PH', {
                        timeZone: 'Asia/Manila',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClasses(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 text-right text-sm font-semibold text-slate-900">
                      +{item.amount.toLocaleString()} PV
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
        </div>
      </section>
    </div>
  )
}

export default PvWalletTab
