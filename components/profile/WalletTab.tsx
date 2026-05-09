'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WalletTypeFilter, useCreateAffiliateVoucherMutation, useGetWalletOverviewQuery } from '@/store/api/encashmentApi';
import PvWalletTab from './PvWalletTab';
import RewardsWalletTab from './RewardsWalletTab';
import NetworkEarningsTab from './NetworkEarningsTab';

const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(value || 0);

const numberFmt = (value: number) =>
  new Intl.NumberFormat('en-PH', { maximumFractionDigits: 2 }).format(value || 0);

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// "Cash" tab removed — "All Wallets" is now the unified cash overview + ledger
type WalletViewType = WalletTypeFilter | 'network';

const walletOptions: Array<{ key: WalletViewType; label: string; icon: string }> = [
  { key: 'network', label: 'Network Earnings', icon: '↗' },
  { key: 'all',     label: 'Overview',    icon: '◈' },
  { key: 'pv',      label: 'AF Voucher',  icon: '◆' },
  { key: 'rewards', label: 'Rewards',     icon: '✦' },
];

const walletOptionOrder: WalletViewType[] = ['all', 'pv', 'rewards', 'network'];
const orderedWalletOptions = [...walletOptions].sort(
  (a, b) => walletOptionOrder.indexOf(a.key) - walletOptionOrder.indexOf(b.key),
);

const walletMeta = {
  all: {
    title: 'Wallet Overview',
    subtitle: 'All your balances at a glance — cash, vouchers, and rewards.',
    gradient: 'from-violet-600 via-indigo-600 to-blue-600',
    glow: 'shadow-indigo-500/20',
  },
  pv: {
    title: 'AF Voucher',
    subtitle: 'Monitor your AF Home voucher balances, referral metrics, and approved voucher history.',
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    glow: 'shadow-blue-500/20',
  },
  network: {
    title: 'Network Earnings',
    subtitle: 'See each Unilevel bonus, downline source, delivered PV, rate, and computation.',
    gradient: 'from-sky-500 via-cyan-500 to-emerald-500',
    glow: 'shadow-sky-500/20',
  },
  rewards: {
    title: 'Rewards Center',
    subtitle: 'Track your AF Voucher, cashback, and available digital reward balances.',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    glow: 'shadow-amber-500/20',
  },
};

type WalletTabProps = {
  isVerified?: boolean;
  initialWalletType?: WalletTypeFilter;
};

export default function WalletTab({ initialWalletType = 'all' }: WalletTabProps) {
  // Treat the now-removed 'cash' type as 'all' if it arrives via prop/URL
  const resolvedInitial: WalletViewType = initialWalletType === 'cash' ? 'all' : initialWalletType;
  const [walletType, setWalletType] = useState<WalletViewType>(resolvedInitial);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [createAffiliateVoucher, { isLoading: isCreatingVoucher }] = useCreateAffiliateVoucherMutation();
  const queryWalletType: WalletTypeFilter = walletType === 'network' ? 'all' : walletType;
  const { data, isLoading, isFetching, isError, refetch } = useGetWalletOverviewQuery({
    page,
    perPage: 15,
    walletType: queryWalletType,
    refreshKey,
  });

  const summary = data?.summary;
  const ledger  = data?.ledger ?? [];
  const meta    = data?.meta;
  const currentWalletMeta = walletMeta[walletType as keyof typeof walletMeta] ?? walletMeta.all;

  const pvHistory = useMemo(
    () =>
      ledger
        .filter((row) => row.wallet_type === 'pv')
        .map((row) => ({
          id: row.id,
          description: row.notes || row.reference_no || 'Performance Value wallet entry',
          source: row.source_type || 'wallet',
          amount: Math.abs(Number(row.amount ?? 0)),
          status: (row.entry_type === 'debit' ? 'cancelled' : 'approved') as 'approved' | 'cancelled' | 'pending',
          created_at: row.created_at || new Date().toISOString(),
        })),
    [ledger]
  );

  const utilizationPct = useMemo(() => {
    if (!summary) return 0;
    const total = summary.encashment_locked + summary.encashment_available;
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, (summary.encashment_locked / total) * 100));
  }, [summary]);

  const progressRows = useMemo(() => {
    if (!summary) return [];
    return [
      { label: 'Cash Credits', value: summary.cash_credits, total: Math.max(summary.cash_credits + summary.cash_debits, 1), color: 'from-emerald-400 to-emerald-500', isPv: false },
      { label: 'Cash Debits',  value: summary.cash_debits,  total: Math.max(summary.cash_credits + summary.cash_debits, 1), color: 'from-rose-400 to-rose-500',    isPv: false },
      { label: 'PV Credits',   value: summary.pv_credits,   total: Math.max(summary.pv_credits + summary.pv_debits, 1),    color: 'from-blue-400 to-indigo-500',   isPv: true  },
      { label: 'PV Debits',    value: summary.pv_debits,    total: Math.max(summary.pv_credits + summary.pv_debits, 1),    color: 'from-sky-400 to-blue-400',      isPv: true  },
    ].map((item) => ({
      ...item,
      pct: Math.min(100, Math.max(0, (item.value / item.total) * 100)),
    }));
  }, [summary]);

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${currentWalletMeta.gradient}`} />

        <div className="p-5 md:p-6 pt-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${currentWalletMeta.gradient} shadow-lg`}>
                <span className="text-white text-base font-bold">W</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg leading-tight">{currentWalletMeta.title}</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs">{currentWalletMeta.subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setRefreshKey(Date.now()); refetch(); }}
              disabled={isFetching}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                isFetching
                  ? 'border-slate-200 dark:border-slate-700 text-slate-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <svg className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isFetching ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-5 flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-fit">
            {orderedWalletOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => { setWalletType(item.key); setPage(1); }}
                className={`relative rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                  walletType === item.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-600/80'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-sm leading-none">{item.icon}</span>
                  {item.label}
                </span>
                {walletType === item.key && (
                  <motion.div
                    layoutId="wallet-tab-indicator"
                    className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-gradient-to-r ${currentWalletMeta.gradient}`}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-5 pb-5 md:px-6 md:pb-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={walletType}
              initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -4, filter: 'blur(2px)' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {walletType === 'pv' ? (
                isLoading ? <SkeletonCards /> : isError ? <ErrorBanner msg="Failed to load AF Voucher data." /> : (
                  <PvWalletTab
                    currentPv={Number(summary?.cashback_balance ?? summary?.affiliate_retail_profit ?? summary?.current_pv ?? 0)}
                    pendingPv={Number(summary?.pending_pv ?? 0)}
                    lifetimePv={Number(summary?.affiliate_performance_bonus ?? summary?.lifetime_pv ?? 0)}
                    lifetimePersonalPerformanceValue={Number(summary?.lifetime_pv ?? 0)}
                    personalPurchasePv={Number(summary?.global_purchase_bonus ?? summary?.personal_purchase_pv ?? 0)}
                    groupPv={Number(summary?.group_purchase_bonus ?? summary?.group_pv ?? 0)}
                    currentMonthGroupPv={Number(summary?.monthly_purchase_points ?? summary?.current_month_group_pv ?? 0)}
                    currentCv={Number(summary?.total_bonus ?? summary?.current_cv ?? 0)}
                    yearlyPurchasePv={Number(summary?.yearly_purchase_pv ?? 0)}
                    pendingReferralEarnings={Number(summary?.pending_referral_earnings ?? 0)}
                    goalProgressPv={Number(summary?.direct_referral_total_pv ?? 0)}
                    goalPv={50000}
                    history={pvHistory}
                    totalReferrals={Number(summary?.referrals?.total ?? 0)}
                    verifiedReferrals={Number(summary?.referrals?.verified ?? 0)}
                    activeReferrals={Number(summary?.referrals?.active ?? 0)}
                    monthlyActivation={summary?.monthly_activation}
                    unilevelAwards={data?.unilevel_awards ?? []}
                  />
                )
              ) : walletType === 'network' ? (
                isLoading ? <SkeletonCards /> : isError ? <ErrorBanner msg="Failed to load Network Earnings data." /> : (
                  <NetworkEarningsTab
                    awards={data?.unilevel_awards ?? []}
                    monthlyActivation={summary?.monthly_activation}
                  />
                )
              ) : walletType === 'rewards' ? (
                isLoading ? <SkeletonCards /> : isError ? <ErrorBanner msg="Failed to load rewards wallet data." /> : (
                  <RewardsWalletTab
                    afVoucherBalance={Number(summary?.af_voucher_balance ?? 0)}
                    afVoucherSourceBalance={Number(summary?.af_voucher_source_balance ?? 0)}
                    cashbackSourceBalance={Number(summary?.cashback_source_balance ?? 0)}
                    cashbackReservedBalance={Number(summary?.cashback_reserved_balance ?? 0)}
                    availableEgcBalance={Number(summary?.available_egc_balance ?? 0)}
                    cashbackBalance={Number(summary?.cashback_balance ?? 0)}
                    cashbackRate={Number(summary?.cashback_rate ?? 0)}
                    vouchers={data?.affiliate_vouchers ?? []}
                    isCreatingVoucher={isCreatingVoucher}
                    onCreateVoucher={async (payload) => { await createAffiliateVoucher(payload).unwrap(); }}
                  />
                )
              ) : isLoading ? (
                <SkeletonCards />
              ) : isError ? (
                <ErrorBanner msg="Failed to load wallet overview." />
              ) : (
                /* ── All Wallets / Overview ── */
                <div className="space-y-5 pt-1">

                  {/* ── Section 1: Cash Wallet ── */}
                  <div>
                    <SectionLabel icon="₱" label="Cash Wallet" color="text-emerald-600 dark:text-emerald-400" />
                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <BalanceCard
                        label="Cash Balance"
                        value={peso(summary?.cash_balance ?? 0)}
                        sub="Available for encashment"
                        gradient="from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20"
                        border="border-emerald-200/60 dark:border-emerald-700/40"
                        iconBg="bg-emerald-100 dark:bg-emerald-900/40"
                        iconColor="text-emerald-600 dark:text-emerald-400"
                        valueColor="text-emerald-700 dark:text-emerald-300"
                        subColor="text-emerald-500"
                        icon="₱"
                        large
                      />
                      <BalanceCard
                        label="Locked Encashment"
                        value={peso(summary?.encashment_locked ?? 0)}
                        sub="Pending / ready-for-release"
                        gradient="from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20"
                        border="border-sky-200/60 dark:border-sky-700/40"
                        iconBg="bg-sky-100 dark:bg-sky-900/40"
                        iconColor="text-sky-600 dark:text-sky-400"
                        valueColor="text-sky-700 dark:text-sky-300"
                        subColor="text-sky-500"
                        icon="🔒"
                      />
                      <BalanceCard
                        label="Available to Encash"
                        value={peso(summary?.encashment_available ?? 0)}
                        sub="Can be requested now"
                        gradient="from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20"
                        border="border-violet-200/60 dark:border-violet-700/40"
                        iconBg="bg-violet-100 dark:bg-violet-900/40"
                        iconColor="text-violet-600 dark:text-violet-400"
                        valueColor="text-violet-700 dark:text-violet-300"
                        subColor="text-violet-500"
                        icon="✓"
                      />
                    </div>

                    {/* Encashment capacity bar — inside cash section */}
                    <div className="mt-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 px-4 py-3.5">
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Encashment Capacity</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          utilizationPct > 70 ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                          : utilizationPct > 40 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {utilizationPct.toFixed(0)}% locked
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${utilizationPct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        <span>Locked: <span className="font-bold text-slate-600 dark:text-slate-300">{peso(summary?.encashment_locked ?? 0)}</span></span>
                        <span>Available: <span className="font-bold text-emerald-600 dark:text-emerald-400">{peso(summary?.encashment_available ?? 0)}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* ── Section 2: AF Voucher (PV) ── */}
                  <div>
                    <SectionLabel icon="◆" label="AF Voucher (Performance Value)" color="text-blue-600 dark:text-blue-400" />
                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <BalanceCard
                        label="PV Balance"
                        value={`${numberFmt(summary?.pv_balance ?? 0)} PV`}
                        sub="Credits after order delivery"
                        gradient="from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                        border="border-blue-200/60 dark:border-blue-700/40"
                        iconBg="bg-blue-100 dark:bg-blue-900/40"
                        iconColor="text-blue-600 dark:text-blue-400"
                        valueColor="text-blue-700 dark:text-blue-300"
                        subColor="text-blue-500"
                        icon="◆"
                        large
                      />
                      <BalanceCard
                        label="Pending PV"
                        value={`${numberFmt(summary?.pending_pv ?? 0)} PV`}
                        sub="Awaiting order confirmation"
                        gradient="from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20"
                        border="border-indigo-200/60 dark:border-indigo-700/40"
                        iconBg="bg-indigo-100 dark:bg-indigo-900/40"
                        iconColor="text-indigo-600 dark:text-indigo-400"
                        valueColor="text-indigo-700 dark:text-indigo-300"
                        subColor="text-indigo-500"
                        icon="⏳"
                      />
                    </div>
                  </div>

                  {/* ── Section 3: Rewards ── */}
                  <div>
                    <SectionLabel icon="✦" label="Rewards" color="text-amber-600 dark:text-amber-400" />
                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <BalanceCard
                        label="AF Voucher Balance"
                        value={peso(summary?.af_voucher_balance ?? 0)}
                        sub="Redeemable on checkout"
                        gradient="from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20"
                        border="border-amber-200/60 dark:border-amber-700/40"
                        iconBg="bg-amber-100 dark:bg-amber-900/40"
                        iconColor="text-amber-600 dark:text-amber-400"
                        valueColor="text-amber-700 dark:text-amber-300"
                        subColor="text-amber-500"
                        icon="🎟"
                      />
                      <BalanceCard
                        label="Cashback Balance"
                        value={peso(summary?.cashback_balance ?? 0)}
                        sub={`${Number(summary?.cashback_rate ?? 0)}% cashback rate`}
                        gradient="from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20"
                        border="border-rose-200/60 dark:border-rose-700/40"
                        iconBg="bg-rose-100 dark:bg-rose-900/40"
                        iconColor="text-rose-600 dark:text-rose-400"
                        valueColor="text-rose-700 dark:text-rose-300"
                        subColor="text-rose-500"
                        icon="💸"
                      />
                      <BalanceCard
                        label="EGC Balance"
                        value={peso(summary?.available_egc_balance ?? 0)}
                        sub="Electronic gift credit"
                        gradient="from-fuchsia-50 to-purple-50 dark:from-fuchsia-900/20 dark:to-purple-900/20"
                        border="border-fuchsia-200/60 dark:border-fuchsia-700/40"
                        iconBg="bg-fuchsia-100 dark:bg-fuchsia-900/40"
                        iconColor="text-fuchsia-600 dark:text-fuchsia-400"
                        valueColor="text-fuchsia-700 dark:text-fuchsia-300"
                        subColor="text-fuchsia-500"
                        icon="🎁"
                      />
                    </div>
                  </div>

                  {/* ── Wallet Flow Breakdown ── */}
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 p-5">
                    <div className="mb-4">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Wallet Flow Breakdown</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Total credits and debits across all wallets</p>
                    </div>
                    <div className="space-y-3">
                      {progressRows.map((row) => (
                        <div key={row.label}>
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-500 dark:text-slate-400">{row.label}</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                              {row.isPv ? `${numberFmt(row.value)} PV` : peso(row.value)}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                            <motion.div
                              className={`h-full rounded-full bg-gradient-to-r ${row.color}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${row.pct}%` }}
                              transition={{ duration: 0.7, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Ledger — only on the Overview tab (all wallets) */}
      {walletType === 'all' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-4 flex-wrap px-5 py-4 md:px-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Wallet Ledger</h3>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Full transaction history across all wallet types.</p>
            </div>
            <div className="flex items-center gap-2">
              {isFetching && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 animate-pulse">
                  <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refreshing
                </span>
              )}
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {meta?.total ?? 0} entries
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/40">
                  {['Date', 'Wallet', 'Type', 'Source', 'Reference', 'Amount'].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 first:pl-5 md:first:pl-6 last:pr-5 md:last:pr-6 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ${h === 'Amount' ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-xl">◈</div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No transactions yet</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Transactions will appear here once activity is recorded.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  ledger.map((row) => {
                    const isCredit = row.entry_type === 'credit';
                    const amountLabel =
                      row.wallet_type === 'pv'
                        ? `${isCredit ? '+' : '-'}${numberFmt(row.amount)} PV`
                        : `${isCredit ? '+' : '-'}${peso(row.amount)}`;
                    return (
                      <tr key={row.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors duration-150">
                        <td className="px-4 py-3.5 first:pl-5 md:first:pl-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(row.created_at)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            row.wallet_type === 'cash'
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${row.wallet_type === 'cash' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                            {row.wallet_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            isCredit
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isCredit ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {isCredit ? 'Credit' : 'Debit'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">{row.source_type ?? '-'}</td>
                        <td className="px-4 py-3.5 max-w-[180px]">
                          <p className="truncate text-xs text-slate-600 dark:text-slate-300" title={row.reference_no ?? ''}>
                            {row.reference_no || row.notes || '-'}
                          </p>
                        </td>
                        <td className={`px-4 py-3.5 last:pr-5 md:last:pr-6 text-right text-sm font-bold tabular-nums ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {amountLabel}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-4 md:px-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{meta?.from ?? 0}–{meta?.to ?? 0}</span>
              {' '}of{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{meta?.total ?? 0}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={!meta || page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Prev
              </button>
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[60px] text-center">
                {page} / {meta?.last_page ?? 1}
              </div>
              <button
                type="button"
                onClick={() => setPage((prev) => (meta && prev < meta.last_page ? prev + 1 : prev))}
                disabled={!meta || page >= (meta?.last_page ?? 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Small reusable components ── */

function SectionLabel({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm leading-none ${color}`}>{icon}</span>
      <p className={`text-xs font-black uppercase tracking-widest ${color}`}>{label}</p>
      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

type BalanceCardProps = {
  label: string;
  value: string;
  sub: string;
  gradient: string;
  border: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  subColor: string;
  icon: string;
  large?: boolean;
};

function BalanceCard({ label, value, sub, gradient, border, iconBg, iconColor, valueColor, subColor, icon, large }: BalanceCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${gradient} ${border} p-4 transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${iconBg} ${iconColor} font-bold shrink-0`}>
          {icon}
        </span>
      </div>
      <p className={`mt-3 font-black leading-tight ${large ? 'text-xl' : 'text-lg'} ${valueColor}`}>{value}</p>
      <p className={`mt-1 text-[11px] font-medium ${subColor}`}>{sub}</p>
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="space-y-5 animate-pulse pt-1">
      <div className="space-y-2">
        <div className="h-4 w-32 rounded-lg bg-slate-100 dark:bg-slate-800" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800" />)}
        </div>
        <div className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-40 rounded-lg bg-slate-100 dark:bg-slate-800" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800" />)}
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800" />)}
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 px-4 py-3">
      <span className="text-rose-500 text-base">⚠</span>
      <p className="text-sm font-medium text-rose-700 dark:text-rose-400">{msg}</p>
    </div>
  );
}
