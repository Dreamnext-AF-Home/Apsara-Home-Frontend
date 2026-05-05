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
    yearlyPurchasePv?: number;
    pendingReferralEarnings?: number;
    personalPurchasePv?: number;
    groupPv?: number;
    currentMonthGroupPv?: number;
    currentCv?: number;
    goalProgressPv?: number;
    goalPv?: number;
    history: PvHistoryItem[];
    totalReferrals?: number;
    verifiedReferrals?: number;
    activeReferrals?: number;
}

function statusClasses(status: PvHistoryItem['status']) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800'
    case 'pending':
      return 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 ring-1 ring-sky-200 dark:ring-sky-800'
    case 'cancelled':
      return 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800'
    default:
      return 'bg-slate-50 dark:bg-gray-700 text-slate-700 dark:text-gray-300 ring-1 ring-slate-200 dark:ring-gray-600'
  }
}


const PvWalletTab = ({
    currentPv,
    pendingPv,
    lifetimePv,
    yearlyPurchasePv = 0,
    pendingReferralEarnings = 0,
    personalPurchasePv = 0,
    groupPv = 0,
    currentMonthGroupPv = 0,
    currentCv = 0,
    goalProgressPv,
    goalPv = 50000,
    history,
    totalReferrals = 0,
    verifiedReferrals = 0,
    activeReferrals = 0,
}: PvWalletTabProps) => {
  const goalCurrent = typeof goalProgressPv === 'number' ? goalProgressPv : currentPv
  const progress = Math.min((goalCurrent / goalPv) * 100, 100)
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <PvStatCard 
            label="Cashback / e-GC"
            value={currentPv}
            accent="blue"
            helper="4% cashback from delivered personal purchase PV, issued as e-GC"
        />
        <PvStatCard 
            label="Yearly Purchases"
            value={yearlyPurchasePv}
            accent="sky"
            helper="Your credited PV purchases accumulated this year"
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
          label="Unilevel Bonus"
          value={groupPv}
          accent="blue"
          helper="6% per eligible compressed level from delivered group purchases"
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
          accent="sky"
          helper="Total earnings from all bonus sources"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PvStatCard
          label="Pending Earnings"
          value={pendingReferralEarnings}
          accent="sky"
          helper="Bonus earnings waiting for delivery release"
        />
        <PvStatCard
          label="Pending PV"
          value={pendingPv}
          accent="blue"
          helper="Paid purchases waiting for delivery before PV posting"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-gray-500">
                        Performance Value Goal
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                        {goalCurrent.toLocaleString()} / {goalPv.toLocaleString()} PV
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
                        Track your direct referral PV progress toward your next target.
                    </p>
                </div>

                <div className="rounded-full border border-slate-200 dark:border-slate-700 dark:bg-gray-900 px-3 py-1 text-sm font-medium text-slate-700 dark:text-gray-300">
                    {progress.toFixed(1)}%
                </div>
            </div>

            <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-gray-700">
                <div
                    className="h-full rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 transition-all duration-500"
                    style={{ width: `${progress}%`}}
                />
            </div>

            <div className="mt-4 flex justify-between text-xs text-slate-400 dark:text-gray-500">
                <span>0 PV</span>
                <span>{goalPv.toLocaleString()}</span>
            </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 p-6">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-gray-500">
                Referral Summary
            </p>
            <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-gray-900 px-4 py-3">
                    <span className="text-sm text-slate-600 dark:text-gray-400">Total Referrals</span>
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        {totalReferrals}
                    </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-gray-900 px-4 py-3">
                    <span className="text-sm text-slate-600 dark:text-gray-400">Verified Referrals</span>
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        {verifiedReferrals}
                    </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-gray-900 px-4 py-3">
                    <span className="text-sm text-slate-600 dark:text-gray-400">Active Referrals</span>
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        {activeReferrals}
                    </span>
                </div>
            </div>
        </aside>
      </div>

      <section className="rounded-3xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 p-6">
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-gray-500">
                    Transaction History
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    PV History
                </h3>
            </div>
        </div>

        <div className="mt-6 overflow-x-auto">
            {history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 px-6 py-12 text-center">
                    <p className="text-sm font-medium text-slate-700 dark:text-gray-300">
                        No PV transactions yet
                    </p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
                        Delivered purchases and future PV credits will appear here.
                    </p>
                </div>
            ): (
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-gray-500">
                  <th className="pb-3 pr-4">Description</th>
                  <th className="pb-3 pr-4">Source</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">PV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-slate-900 dark:text-white">{item.description}</p>
                    </td>
                    <td className="py-4 pr-4 text-sm text-slate-600 dark:text-gray-400">{item.source}</td>
                    <td className="py-4 pr-4 text-sm text-slate-500 dark:text-gray-400">
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
                    <td className="py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
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
