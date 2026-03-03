'use client';

import { useMemo, useState } from 'react';
import { WalletTypeFilter, useGetWalletOverviewQuery } from '@/store/api/encashmentApi';

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
  { key: 'pv', label: 'PV Wallet' },
];

export default function WalletTab() {
  const [walletType, setWalletType] = useState<WalletTypeFilter>('all');
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError } = useGetWalletOverviewQuery({
    page,
    perPage: 15,
    walletType,
  });

  const summary = data?.summary;
  const ledger = data?.ledger ?? [];
  const meta = data?.meta;

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
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Wallet Center</h3>
            <p className="text-xs text-gray-500 mt-1">Track balances, deductions, and PV credits from approved orders.</p>
          </div>
          <div className="flex items-center gap-2">
            {walletOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setWalletType(item.key);
                  setPage(1);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  walletType === item.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
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
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-[11px] uppercase tracking-wide text-emerald-700 font-semibold">Cash Balance</p>
                <p className="mt-1 text-2xl font-black text-emerald-800">{peso(summary?.cash_balance ?? 0)}</p>
                <p className="text-xs text-emerald-700/80 mt-1">Available for encashment flow</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-[11px] uppercase tracking-wide text-blue-700 font-semibold">PV Balance</p>
                <p className="mt-1 text-2xl font-black text-blue-800">{numberFmt(summary?.pv_balance ?? 0)} PV</p>
                <p className="text-xs text-blue-700/80 mt-1">Credits after order approval</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-[11px] uppercase tracking-wide text-amber-700 font-semibold">Locked Encashment</p>
                <p className="mt-1 text-2xl font-black text-amber-800">{peso(summary?.encashment_locked ?? 0)}</p>
                <p className="text-xs text-amber-700/80 mt-1">Pending + ready-for-release requests</p>
              </div>
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <p className="text-[11px] uppercase tracking-wide text-orange-700 font-semibold">Encashment Available</p>
                <p className="mt-1 text-2xl font-black text-orange-800">{peso(summary?.encashment_available ?? 0)}</p>
                <p className="text-xs text-orange-700/80 mt-1">Can be requested now</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-800">Encashment Capacity</p>
                  <p className="text-xs text-gray-500">Lock ratio {utilizationPct.toFixed(0)}%</p>
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" style={{ width: `${utilizationPct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                  <span>Locked: {peso(summary?.encashment_locked ?? 0)}</span>
                  <span>Available: {peso(summary?.encashment_available ?? 0)}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-sm font-bold text-gray-800">Wallet Flow Breakdown</p>
                <div className="mt-3 space-y-2.5">
                  {progressRows.map((row) => (
                    <div key={row.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-gray-600">{row.label}</span>
                        <span className="font-semibold text-gray-800">{row.isPv ? `${numberFmt(row.value)} PV` : peso(row.value)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full ${row.color} rounded-full`} style={{ width: `${row.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Wallet Ledger</h3>
            <p className="text-xs text-gray-500 mt-0.5">Detailed transaction history for audit and member transparency.</p>
          </div>
          <span className="text-xs text-gray-500">{isFetching ? 'Refreshing...' : `Total: ${meta?.total ?? 0}`}</span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2 border-b border-gray-200 font-semibold">Date</th>
                <th className="px-3 py-2 border-b border-gray-200 font-semibold">Wallet</th>
                <th className="px-3 py-2 border-b border-gray-200 font-semibold">Type</th>
                <th className="px-3 py-2 border-b border-gray-200 font-semibold">Source</th>
                <th className="px-3 py-2 border-b border-gray-200 font-semibold">Reference</th>
                <th className="px-3 py-2 border-b border-gray-200 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-sm text-gray-500 text-center">
                    No wallet ledger entries yet.
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
                    <tr key={row.id} className="text-sm text-gray-700">
                      <td className="px-3 py-2 border-b border-gray-100 whitespace-nowrap">{formatDate(row.created_at)}</td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.wallet_type === 'cash' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                          {row.wallet_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isCredit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {row.entry_type}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100">{row.source_type ?? '-'}</td>
                      <td className="px-3 py-2 border-b border-gray-100 max-w-[240px] truncate" title={row.reference_no ?? ''}>
                        {row.reference_no || row.notes || '-'}
                      </td>
                      <td className={`px-3 py-2 border-b border-gray-100 text-right font-bold ${isCredit ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {amountLabel}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {meta?.from ?? 0} - {meta?.to ?? 0} of {meta?.total ?? 0}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!meta || page <= 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => (meta && prev < meta.last_page ? prev + 1 : prev))}
              disabled={!meta || page >= (meta?.last_page ?? 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
