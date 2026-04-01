'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WalletTypeFilter, useCreateAffiliateVoucherMutation, useGetWalletOverviewQuery } from '@/store/api/encashmentApi';
import PvWalletTab from './PvWalletTab';
import RewardsWalletTab from './RewardsWalletTab';

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

const walletOptions: Array<{ key: WalletTypeFilter; label: string }> = [
  { key: 'all', label: 'All Wallets' },
  { key: 'cash', label: 'Cash Wallet' },
  { key: 'pv', label: 'AF Voucher' },
  { key: 'rewards', label: 'Rewards' },
];

const walletMeta = {
  all: {
    title: 'Wallet Center',
    subtitle: 'Track balances, deductions, and PV credits from approved orders.',
  },
  cash: {
    title: 'Cash Wallet',
    subtitle: 'Review your available balance, deductions, and encashment activity.',
  },
  pv: {
    title: 'AF Voucher',
    subtitle: 'Monitor your AF Home voucher balances, referral metrics, and approved voucher history.',
  },
  rewards: {
    title: 'Rewards Center',
    subtitle: 'Track your AF Voucher, cashback, and available digital reward balances.',
  },
};

type WalletTabProps = {
  isVerified?: boolean;
};

export default function WalletTab({ isVerified = false }: WalletTabProps) {
  const [walletType, setWalletType] = useState<WalletTypeFilter>('all');
  const [page, setPage] = useState(1);
  const [createAffiliateVoucher, { isLoading: isCreatingVoucher }] = useCreateAffiliateVoucherMutation();
  const { data, isLoading, isFetching, isError } = useGetWalletOverviewQuery({
    page,
    perPage: 15,
    walletType,
  });

  const summary = data?.summary;
  const ledger = data?.ledger ?? [];
  const meta = data?.meta;
  const currentWalletMeta = walletMeta[walletType as keyof typeof walletMeta] ?? walletMeta.all;
  const pvHistory = useMemo(
    () =>
      ledger
        .filter((row) => row.wallet_type === 'pv')
        .map((row) => ({
          id: row.id,
          description: row.notes || row.reference_no || 'PV wallet entry',
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
    const items = [
      { label: 'Cash Credits', value: summary.cash_credits, total: Math.max(summary.cash_credits + summary.cash_debits, 1), color: 'bg-emerald-500', isPv: false },
      { label: 'Cash Debits', value: summary.cash_debits, total: Math.max(summary.cash_credits + summary.cash_debits, 1), color: 'bg-rose-500', isPv: false },
      { label: 'PV Credits', value: summary.pv_credits, total: Math.max(summary.pv_credits + summary.pv_debits, 1), color: 'bg-blue-500', isPv: true },
      { label: 'PV Debits', value: summary.pv_debits, total: Math.max(summary.pv_credits + summary.pv_debits, 1), color: 'bg-amber-500', isPv: true },
    ];
    return items.map((item) => ({
      ...item,
      pct: Math.min(100, Math.max(0, (item.value / item.total) * 100)),
    }));
  }, [summary]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
          <div>
            <h3 className="text-base font-bold text-slate-900 sm:text-lg">{currentWalletMeta.title}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{currentWalletMeta.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {walletOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setWalletType(item.key);
                  setPage(1);
                }}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  walletType === item.key
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={walletType}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(3px)' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {walletType === 'pv' ? (
              isLoading ? (
                <div className="mt-5 space-y-3 animate-pulse">
                  <div className="h-24 rounded-2xl bg-gray-100" />
                  <div className="h-24 rounded-2xl bg-gray-100" />
                </div>
              ) : isError ? (
                <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Failed to load AF Voucher data.
                </div>
              ) : (
                <div className="mt-5">
                  <PvWalletTab
                    currentPv={Number(summary?.affiliate_retail_profit ?? summary?.current_pv ?? 0)}
                    pendingPv={Number(summary?.pending_pv ?? 0)}
                    lifetimePv={Number(summary?.affiliate_performance_bonus ?? summary?.lifetime_pv ?? 0)}
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
                  />
                </div>
              )
            ) : walletType === 'rewards' ? (
              isLoading ? (
                <div className="mt-5 space-y-3 animate-pulse">
                  <div className="h-24 rounded-2xl bg-gray-100" />
                  <div className="h-24 rounded-2xl bg-gray-100" />
                </div>
              ) : isError ? (
                <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Failed to load rewards wallet data.
                </div>
              ) : (
                <div className="mt-5">
                  <RewardsWalletTab
                    isVerified={isVerified && Boolean(summary?.can_create_affiliate_voucher)}
                    afVoucherBalance={Number(summary?.af_voucher_balance ?? 0)}
                    afVoucherSourceBalance={Number(summary?.af_voucher_source_balance ?? 0)}
                    afVoucherReservedBalance={Number(summary?.af_voucher_reserved_balance ?? 0)}
                    cashbackSourceBalance={Number(summary?.cashback_source_balance ?? 0)}
                    cashbackReservedBalance={Number(summary?.cashback_reserved_balance ?? 0)}
                    availableEgcBalance={Number(summary?.available_egc_balance ?? 0)}
                    cashbackBalance={Number(summary?.cashback_balance ?? 0)}
                    cashbackRate={Number(summary?.cashback_rate ?? 0)}
                    vouchers={data?.affiliate_vouchers ?? []}
                    isCreatingVoucher={isCreatingVoucher}
                    onCreateVoucher={async (payload) => {
                      await createAffiliateVoucher(payload).unwrap();
                    }}
                  />
                </div>
              )
            ) : isLoading ? (
              <div className="mt-5 space-y-3 animate-pulse">
                <div className="h-24 rounded-2xl bg-gray-100" />
                <div className="h-24 rounded-2xl bg-gray-100" />
              </div>
            ) : isError ? (
              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                Failed to load wallet overview.
              </div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {[
                    { label: 'Cash Balance',         value: peso(summary?.cash_balance ?? 0),          sub: 'Available for encashment',       border: 'border-emerald-100', bg: 'bg-emerald-50', text: 'text-emerald-700', val: 'text-emerald-900' },
                    { label: 'PV Balance',            value: `${numberFmt(summary?.pv_balance ?? 0)} PV`, sub: 'Credits after order approval',  border: 'border-blue-100',    bg: 'bg-blue-50',    text: 'text-blue-700',    val: 'text-blue-900'    },
                    { label: 'Locked Encashment',     value: peso(summary?.encashment_locked ?? 0),     sub: 'Pending & ready-for-release',    border: 'border-amber-100',   bg: 'bg-amber-50',   text: 'text-amber-700',   val: 'text-amber-900'   },
                    { label: 'Encashment Available',  value: peso(summary?.encashment_available ?? 0),  sub: 'Can be requested now',           border: 'border-orange-100',  bg: 'bg-orange-50',  text: 'text-orange-700',  val: 'text-orange-900'  },
                  ].map(({ label, value, sub, border, bg, text, val }) => (
                    <div key={label} className={`rounded-2xl border ${border} ${bg} p-4`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-wide ${text}`}>{label}</p>
                      <p className={`mt-1.5 text-xl font-black ${val}`}>{value}</p>
                      <p className={`mt-1 text-xs ${text} opacity-80`}>{sub}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-slate-800">Encashment Capacity</p>
                      <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                        {utilizationPct.toFixed(0)}% locked
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" style={{ width: `${utilizationPct}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Locked: {peso(summary?.encashment_locked ?? 0)}</span>
                      <span>Available: {peso(summary?.encashment_available ?? 0)}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="mb-3 text-sm font-bold text-slate-800">Wallet Flow Breakdown</p>
                    <div className="space-y-2.5">
                      {progressRows.map((row) => (
                        <div key={row.label}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-slate-500">{row.label}</span>
                            <span className="font-semibold text-slate-800">{row.isPv ? `${numberFmt(row.value)} PV` : peso(row.value)}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full ${row.color} rounded-full transition-all`} style={{ width: `${row.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {walletType !== 'pv' && walletType !== 'rewards' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Wallet Ledger</h3>
              <p className="mt-0.5 text-xs text-slate-500">Detailed transaction history for audit and member transparency.</p>
            </div>
            <div className="flex items-center gap-2">
              {isFetching && (
                <span className="text-[11px] font-medium text-slate-400 animate-pulse">Refreshing…</span>
              )}
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {meta?.total ?? 0} entries
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Date', 'Wallet', 'Type', 'Source', 'Reference', 'Amount'].map((h) => (
                    <th
                      key={h}
                      className={`pb-2.5 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 last:pr-0 ${h === 'Amount' ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <p className="text-sm font-medium text-slate-500">No ledger entries yet.</p>
                      <p className="mt-1 text-xs text-slate-400">Transactions will appear here once activity is recorded.</p>
                    </td>
                  </tr>
                ) : (
                  ledger.map((row) => {
                    const isCredit = row.entry_type === 'credit';
                    const amountLabel =
                      row.wallet_type === 'pv'
                        ? `${isCredit ? '+' : '−'}${numberFmt(row.amount)} PV`
                        : `${isCredit ? '+' : '−'}${peso(row.amount)}`;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 pr-4 text-xs text-slate-500 whitespace-nowrap">{formatDate(row.created_at)}</td>
                        <td className="py-3.5 pr-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            row.wallet_type === 'cash'
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                              : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${row.wallet_type === 'cash' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                            {row.wallet_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            isCredit
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                              : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isCredit ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {isCredit ? 'Credit' : 'Debit'}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-xs text-slate-500">{row.source_type ?? '—'}</td>
                        <td className="py-3.5 pr-4 max-w-50">
                          <p className="truncate text-xs text-slate-600" title={row.reference_no ?? ''}>
                            {row.reference_no || row.notes || '—'}
                          </p>
                        </td>
                        <td className={`py-3.5 text-right text-sm font-bold ${isCredit ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {amountLabel}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-700">{meta?.from ?? 0}–{meta?.to ?? 0}</span>
              {' '}of{' '}
              <span className="font-semibold text-slate-700">{meta?.total ?? 0}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={!meta || page <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Prev
              </button>
              <span className="px-2 text-xs text-slate-500">
                {page} / {meta?.last_page ?? 1}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => (meta && prev < meta.last_page ? prev + 1 : prev))}
                disabled={!meta || page >= (meta?.last_page ?? 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
