'use client';

import type { ReactNode } from "react";
import PvStatCard from "./PvStatCard";

type PvHistoryItem = {
    id: number;
    description: string;
    source: string;
    amount: number;
    status: 'pending' | 'approved' | 'cancelled';
    created_at: string;
}

type MonthlyActivation = {
    status: 'active' | 'inactive';
    threshold_pv: number;
    current_month_pv: number;
    qualifying_pv: number;
    remaining_pv: number;
    deadline_day: number;
    deadline_at?: string | null;
    window_open: boolean;
    month_label: string;
}

type UnilevelAwardItem = {
    id: number;
    source_name?: string | null;
    source_username?: string | null;
    source_email?: string | null;
    level_no: number;
    checkout_id?: string | null;
    product_name?: string | null;
    earned_pv: number;
    bonus_rate: number;
    bonus_amount: number;
    awarded_at?: string | null;
}

interface PvWalletTabProps {
    currentPv: number;
    pendingPv: number;
    lifetimePv: number;
    lifetimePersonalPerformanceValue?: number;
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
    monthlyActivation?: MonthlyActivation;
    unilevelAwards?: UnilevelAwardItem[];
    showUnilevelBreakdown?: boolean;
}

function statusClasses(status: PvHistoryItem['status']) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-700'
    case 'pending':
      return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-700'
    case 'cancelled':
      return 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-700'
    default:
      return 'bg-slate-50 dark:bg-gray-700 text-slate-700 dark:text-gray-300 ring-1 ring-slate-200 dark:ring-gray-600'
  }
}

const SectionHeader = ({
  eyebrow,
  title,
  description,
  badge,
}: {
  eyebrow: string
  title: string
  description?: string
  badge?: ReactNode
}) => (
  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-gray-500">
        {eyebrow}
      </p>
      <h3 className="mt-1.5 text-xl font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-slate-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
    {badge && <div className="shrink-0 self-start">{badge}</div>}
  </div>
)

const PV_ALLOCATION_RATES = [
  {
    label: 'Cashback / e-GC',
    rateLabel: '4%',
    rate: 0.04,
    helper: 'Issued to the buyer as cashback / e-GC.',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'Unilevel Pool',
    rateLabel: '6%',
    rate: 0.06,
    helper: 'Total Unilevel pool. Standard level display is 6% / 10 = 0.6% per level.',
    accent: 'text-sky-600 dark:text-sky-400',
  },
  {
    label: '50K Points Reward',
    rateLabel: '2.9%',
    rate: 0.029,
    helper: 'Direct-affiliate progress toward the 50,000 point reward.',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  {
    label: 'Global Purchase Bonus',
    rateLabel: '1%',
    rate: 0.01,
    helper: 'Year-end global pool allocation.',
    accent: 'text-violet-600 dark:text-violet-400',
  },
  {
    label: 'Product Purchase Points',
    rateLabel: '86.1%',
    rate: 0.861,
    helper: 'Remaining product point allocation after bonus pools.',
    accent: 'text-slate-700 dark:text-slate-200',
  },
] as const

const formatPvValue = (value: number) =>
  Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const PvWalletTab = ({
    currentPv,
    pendingPv,
    lifetimePv,
    lifetimePersonalPerformanceValue,
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
    monthlyActivation,
    unilevelAwards = [],
    showUnilevelBreakdown = true,
}: PvWalletTabProps) => {
  const goalCurrent = typeof goalProgressPv === 'number' ? goalProgressPv : currentPv
  const progress = Math.min((goalCurrent / goalPv) * 100, 100)
  const activationCurrent = monthlyActivation?.current_month_pv ?? monthlyActivation?.qualifying_pv ?? 0
  const activationTarget = monthlyActivation?.threshold_pv ?? 100
  const activationProgress = Math.min((activationCurrent / Math.max(activationTarget, 1)) * 100, 100)
  const isUnilevelActive = monthlyActivation?.status === 'active'
  const allocationBasis = Math.max(
    0,
    Number(lifetimePersonalPerformanceValue ?? 0) ||
      Number(yearlyPurchasePv ?? 0) ||
      Number(goalCurrent ?? 0)
  )
  const unilevelPerLevelRate = 0.06 / 10
  const activationDeadline = monthlyActivation?.deadline_at
    ? new Date(monthlyActivation.deadline_at).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
      })
    : `Day ${monthlyActivation?.deadline_day ?? 7}`

  return (
    <div className="space-y-5">

      {/* ── Unilevel Qualification Banner ── */}
      <section
        className={`relative overflow-hidden rounded-2xl border p-5 md:p-6 ${
          isUnilevelActive
            ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:border-emerald-800/60 dark:from-emerald-950/60 dark:to-teal-950/40'
            : 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/40 dark:border-amber-800/60 dark:from-amber-950/60 dark:to-orange-950/40'
        }`}
      >
        {/* decorative circle */}
        <div
          className={`pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10 ${
            isUnilevelActive ? 'bg-emerald-400' : 'bg-amber-400'
          }`}
        />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <p className={`text-[11px] font-bold uppercase tracking-widest ${isUnilevelActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              Unilevel Qualification
            </p>
            <h3 className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {activationCurrent.toLocaleString()}
              <span className="ml-1 text-base font-medium text-slate-400 dark:text-gray-500">
                / {activationTarget.toLocaleString()} PV
              </span>
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-gray-300">
              Personal PV this {monthlyActivation?.month_label ?? 'month'} determines if you can receive Unilevel bonuses.
            </p>
          </div>

          <span className={`inline-flex shrink-0 items-center gap-2 self-start rounded-xl px-4 py-2 text-sm font-bold shadow-sm ${
            isUnilevelActive
              ? 'bg-emerald-500 text-white shadow-emerald-500/25'
              : 'bg-amber-500 text-white shadow-amber-500/25'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isUnilevelActive ? 'bg-emerald-200' : 'bg-amber-200'}`} />
            {isUnilevelActive ? 'Active for Unilevel' : 'Inactive for Unilevel'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative mt-5">
          <div className="h-2.5 overflow-hidden rounded-full bg-black/10 dark:bg-black/30">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isUnilevelActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-amber-500 to-orange-400'
              }`}
              style={{ width: `${activationProgress}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
            <span>
              {isUnilevelActive
                ? 'You can receive Unilevel from delivered downline purchases.'
                : `${(monthlyActivation?.remaining_pv ?? activationTarget).toLocaleString()} PV more needed from your own delivered purchases.`}
            </span>
            <span className="ml-4 shrink-0 font-medium">Deadline: {activationDeadline}</span>
          </div>
        </div>

        {/* Sub-stat row */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Personal PV This Month',
              value: (monthlyActivation?.current_month_pv ?? 0).toLocaleString(),
            },
            {
              label: 'Lifetime Personal PV',
              value: (lifetimePersonalPerformanceValue ?? 0).toLocaleString(),
            },
            {
              label: 'Pending Personal PV',
              value: pendingPv.toLocaleString(),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/70 bg-white/60 px-4 py-3 backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500">
                {item.label}
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                {item.value}
                <span className="ml-1 text-xs font-normal text-slate-400 dark:text-gray-500">PV</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Primary stat row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PvStatCard
          label="Cashback / e-GC"
          value={currentPv}
          accent="blue"
          helper="4% cashback from delivered personal purchase PV, issued as e-GC"
        />
        <PvStatCard
          label="Yearly Personal PV"
          value={yearlyPurchasePv}
          accent="sky"
          helper="Your own delivered purchase PV accumulated this year"
        />
        <PvStatCard
          label="Affiliate Performance Bonus"
          value={lifetimePv}
          accent="emerald"
          helper="Bonus earned based on affiliate performance metrics"
        />
      </div>

      {/* ── Secondary stat row ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      {/* ── Pending row ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <PvStatCard
          label="Pending Earnings"
          value={pendingReferralEarnings}
          accent="sky"
          helper="Bonus earnings waiting for delivery release"
        />
        <PvStatCard
          label="Pending Performance Value"
          value={pendingPv}
          accent="blue"
          helper="Paid purchases waiting for delivery before PV posting"
        />
      </div>

      {/* ── Unilevel Breakdown ── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-gray-800/60">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-sky-50 px-5 py-4 dark:border-slate-700 dark:from-slate-900 dark:to-sky-950/40 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <SectionHeader
              eyebrow="PV Allocation Formula"
              title="How product PV is distributed"
              description="Read-only guide based on the agreed allocation. Actual credits are still posted by delivered orders."
            />
            <div className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-right shadow-sm dark:border-sky-800/60 dark:bg-slate-900">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">PV Basis</p>
              <p className="mt-1 text-xl font-black tabular-nums text-sky-700 dark:text-sky-300">
                {formatPvValue(allocationBasis)} PV
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-2 md:p-6 xl:grid-cols-5">
          {PV_ALLOCATION_RATES.map((row) => {
            const computed = allocationBasis * row.rate
            return (
              <div
                key={row.label}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-700/70 dark:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-sky-700 ring-1 ring-sky-100 dark:bg-slate-950 dark:text-sky-300 dark:ring-slate-700">
                    {row.rateLabel}
                  </span>
                  <p className={`text-right text-lg font-black tabular-nums ${row.accent}`}>
                    {formatPvValue(computed)}
                  </p>
                </div>
                <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{row.label}</p>
                <p className="mt-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  {formatPvValue(allocationBasis)} x {row.rateLabel}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{row.helper}</p>
              </div>
            )
          })}
        </div>

        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-700 md:px-6">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900/60 dark:bg-blue-950/30">
            <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
              Unilevel level rate: 6% / 10 levels = {(unilevelPerLevelRate * 100).toFixed(1)}% per level.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-blue-700/80 dark:text-blue-300/80">
              The 50,000 PV progress uses the direct-affiliate point allocation, not the Unilevel cash bonus amount.
            </p>
          </div>
        </div>
      </section>

      {showUnilevelBreakdown && (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 dark:border-slate-700 dark:bg-gray-800/60">
        <SectionHeader
          eyebrow="Unilevel Breakdown"
          title="Earned by Compressed Level"
          description="Shows who generated your Unilevel bonus, the paid level, rate, and delivered PV used."
          badge={
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-800/60 dark:bg-sky-900/30 dark:text-sky-300">
              6% / 10 = 0.6% per level
            </span>
          }
        />

        <div className="mt-5 overflow-x-auto">
          {unilevelAwards.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-700">
              <p className="font-medium text-slate-700 dark:text-gray-300">No Unilevel bonuses yet</p>
              <p className="mt-1.5 text-sm text-slate-400 dark:text-gray-500">
                Delivered downline purchases will appear here once you are active for Unilevel.
              </p>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500">
                  <th className="pb-3 pr-4 font-semibold">Source Member</th>
                  <th className="pb-3 pr-4 font-semibold">Level</th>
                  <th className="pb-3 pr-4 font-semibold">Order</th>
                  <th className="pb-3 pr-4 text-right font-semibold">PV</th>
                  <th className="pb-3 pr-4 text-right font-semibold">Rate</th>
                  <th className="pb-3 pr-4 text-right font-semibold">Bonus</th>
                  <th className="pb-3 text-right font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {unilevelAwards.map((award, i) => {
                  const sourceLabel = award.source_name || award.source_username || award.source_email || 'Unknown member'
                  const awardedAt = award.awarded_at
                    ? new Date(award.awarded_at).toLocaleString('en-PH', {
                        timeZone: 'Asia/Manila',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : '-'

                  return (
                    <tr
                      key={award.id}
                      className={`border-b border-slate-100 dark:border-slate-700/60 last:border-0 ${
                        i % 2 === 0 ? '' : 'bg-slate-50/60 dark:bg-white/[0.02]'
                      }`}
                    >
                      <td className="py-3.5 pr-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{sourceLabel}</p>
                        {(award.source_username || award.source_email) && (
                          <p className="mt-0.5 text-xs text-slate-400 dark:text-gray-500">
                            {award.source_username ? `@${award.source_username}` : award.source_email}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800/60">
                          L{award.level_no}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="max-w-[200px] truncate font-medium text-slate-700 dark:text-gray-300">
                          {award.product_name || 'Delivered order'}
                        </p>
                        {award.checkout_id && (
                          <p className="mt-0.5 max-w-[200px] truncate text-xs text-slate-400 dark:text-gray-500">
                            {award.checkout_id}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                        {Number(award.earned_pv ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 pr-4 text-right tabular-nums text-slate-500 dark:text-gray-400">
                        {(Number(award.bonus_rate ?? 0) * 100).toFixed(2).replace(/\.00$/, '')}%
                      </td>
                      <td className="py-3.5 pr-4 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        +₱{Number(award.bonus_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 text-right text-xs text-slate-400 dark:text-gray-500">
                        {awardedAt}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
      )}

      {/* ── PV Goal + Referral Summary ── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 dark:border-slate-700 dark:bg-gray-800/60">
          <div className="flex items-start justify-between gap-4">
            <SectionHeader
              eyebrow="Performance Value Goal"
              title={`${goalCurrent.toLocaleString()} / ${goalPv.toLocaleString()} PV`}
              description="Track your direct referral PV progress toward your next target."
            />
            <span className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold tabular-nums text-slate-700 dark:border-slate-700 dark:bg-gray-900 dark:text-gray-200">
              {progress.toFixed(1)}%
            </span>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex justify-between text-xs text-slate-400 dark:text-gray-500">
            <span>0 PV</span>
            <span>{goalPv.toLocaleString()} PV</span>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-gray-800/60">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-gray-500">
            Referral Summary
          </p>
          <div className="mt-4 space-y-2.5">
            {[
              { label: 'Total Referrals', value: totalReferrals },
              { label: 'Verified Referrals', value: verifiedReferrals },
              { label: 'Active Referrals', value: activeReferrals },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-700/60 dark:bg-white/[0.03]"
              >
                <span className="text-sm text-slate-600 dark:text-gray-400">{item.label}</span>
                <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* ── Transaction History ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 dark:border-slate-700 dark:bg-gray-800/60">
        <SectionHeader
          eyebrow="Transaction History"
          title="Performance Value History"
        />

        <div className="mt-5 overflow-x-auto">
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-700">
              <p className="font-medium text-slate-700 dark:text-gray-300">
                No Performance Value transactions yet
              </p>
              <p className="mt-1.5 text-sm text-slate-400 dark:text-gray-500">
                Delivered purchases and future PV credits will appear here.
              </p>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500">
                  <th className="pb-3 pr-4 font-semibold">Description</th>
                  <th className="pb-3 pr-4 font-semibold">Source</th>
                  <th className="pb-3 pr-4 font-semibold">Date</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">PV</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, i) => (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-100 dark:border-slate-700/60 last:border-0 ${
                      i % 2 === 0 ? '' : 'bg-slate-50/60 dark:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-3.5 pr-4 font-medium text-slate-900 dark:text-white">
                      {item.description}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-500 dark:text-gray-400">
                      {item.source}
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-slate-400 dark:text-gray-500">
                      {new Date(item.created_at).toLocaleString('en-PH', {
                        timeZone: 'Asia/Manila',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusClasses(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                      +{item.amount.toLocaleString()}
                      <span className="ml-1 text-xs font-normal text-slate-400 dark:text-gray-500">PV</span>
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
