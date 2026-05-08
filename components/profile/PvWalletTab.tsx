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
      {showUnilevelBreakdown && (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 dark:border-slate-700 dark:bg-gray-800/60">
        <SectionHeader
          eyebrow="Unilevel Breakdown"
          title="Earned by Compressed Level"
          description="Shows who generated your Unilevel bonus, the paid level, rate, and delivered PV used."
          badge={
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-800/60 dark:bg-sky-900/30 dark:text-sky-300">
              6% per eligible level
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
