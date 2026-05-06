'use client';

import { FormEvent, useMemo, useState } from 'react';
import PvStatCard from './PvStatCard';
import { AffiliateVoucherItem } from '@/store/api/encashmentApi';

interface RewardsWalletTabProps {
  afVoucherBalance: number;
  afVoucherSourceBalance: number;
  cashbackSourceBalance: number;
  cashbackReservedBalance: number;
  availableEgcBalance: number;
  cashbackBalance: number;
  cashbackRate?: number;
  vouchers: AffiliateVoucherItem[];
  isCreatingVoucher?: boolean;
  onCreateVoucher: (payload: {
    amount: number;
    expires_at?: string;
    max_uses?: number;
  }) => Promise<void>;
}

const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value || 0);

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  active: {
    label: 'Active',
    cls: 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 ring-1 ring-sky-200 dark:ring-sky-800',
    dot: 'bg-sky-500',
  },
  redeemed: {
    label: 'Redeemed',
    cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    cls: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800',
    dot: 'bg-rose-500',
  },
  expired: {
    label: 'Expired',
    cls: 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 ring-1 ring-sky-200 dark:ring-sky-800',
    dot: 'bg-sky-500',
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    cls: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy code"
      className={`ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
        copied
          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
          : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-700 dark:hover:text-gray-300'
      }`}
    >
      {copied ? (
        <>
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

export default function RewardsWalletTab({
  afVoucherBalance,
  afVoucherSourceBalance,
  cashbackSourceBalance,
  cashbackReservedBalance,
  availableEgcBalance,
  cashbackBalance,
  cashbackRate = 0,
  vouchers,
  isCreatingVoucher = false,
  onCreateVoucher,
}: RewardsWalletTabProps) {
  const displayCashbackRate = cashbackRate > 0 && cashbackRate <= 1 ? cashbackRate * 100 : cashbackRate;
  const [voucherAmount, setVoucherAmount] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeVoucherCount = useMemo(
    () => vouchers.filter((voucher) => voucher.status === 'active').length,
    [vouchers]
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCreateVoucher = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const amount = Number(voucherAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid voucher amount greater than zero.' });
      return;
    }

    const uses = maxUses.trim() ? Number(maxUses) : undefined;
    if (uses !== undefined && (!Number.isInteger(uses) || uses < 1)) {
      setMessage({ type: 'error', text: 'Max uses must be a whole number of at least 1.' });
      return;
    }

    try {
      await onCreateVoucher({
        amount,
        expires_at: expiresAt || undefined,
        max_uses: uses,
      });

      setVoucherAmount('');
      setExpiresAt('');
      setMaxUses('');
      setMessage({ type: 'success', text: 'Affiliate voucher created and reserved from cashback successfully.' });
    } catch (error) {
      const fallback = 'Failed to create affiliate voucher.';
      const text =
        typeof error === 'object' && error && 'data' in error
          ? ((error as { data?: { message?: string } }).data?.message ?? fallback)
          : fallback;

      setMessage({ type: 'error', text });
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <PvStatCard
          label="Available AF Voucher"
          value={peso(afVoucherBalance)}
          accent="sky"
          helper="Reward vouchers currently available in your account"
        />
        <PvStatCard
          label="Available E-GC"
          value={peso(availableEgcBalance)}
          accent="blue"
          helper="Digital gift card balance ready for future use"
        />
        <PvStatCard
          label="Available Cashback"
          value={peso(cashbackBalance)}
          accent="emerald"
          helper="Cashback that can be converted into shareable AF vouchers"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-gray-500">Voucher Studio</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">Create Affiliate Voucher</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-gray-900 px-4 py-2 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-gray-500">Active Coupon</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">{activeVoucherCount}</p>
              </div>
            </div>
          </div>

          <div className="mb-5 grid gap-2.5 sm:grid-cols-3">
            <div className="rounded-2xl border border-sky-200 dark:border-sky-800 dark:bg-sky-900/30 px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">Cashback Source</p>
              <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white">{peso(cashbackSourceBalance)}</p>
            </div>
            <div className="rounded-2xl border border-sky-200 dark:border-sky-800 dark:bg-sky-900/30 px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">Cashback Reserved</p>
              <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white">{peso(cashbackReservedBalance)}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-900/30 px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">Cashback Available</p>
              <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white">{peso(cashbackBalance)}</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleCreateVoucher}>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-gray-300">
                  Voucher Amount <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 dark:text-gray-500">P</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={voucherAmount}
                    onChange={(e) => setVoucherAmount(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-gray-900 py-2.5 pl-8 pr-4 text-sm text-slate-900 dark:text-white outline-none transition focus:border-sky-400 dark:focus:border-sky-600 focus:dark:bg-gray-800 focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-gray-300">
                    Valid Until
                    <span className="ml-1 text-[10px] font-normal text-slate-400 dark:text-gray-500">(optional)</span>
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-gray-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition focus:border-sky-400 dark:focus:border-sky-600 focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50"
                  />
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-gray-500">Leave blank for no expiry.</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-gray-300">
                    Max Uses
                    <span className="ml-1 text-[10px] font-normal text-slate-400 dark:text-gray-500">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-gray-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition focus:border-sky-400 dark:focus:border-sky-600 focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50"
                    placeholder="e.g. 1"
                  />
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-gray-500">Leave blank for unlimited uses.</p>
                </div>
              </div>

              {message ? (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                    message.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800'
                  }`}
                >
                  {message.text}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isCreatingVoucher}
                className="w-full rounded-2xl bg-sky-500 py-3 text-sm font-bold text-white transition hover:bg-sky-600 dark:hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingVoucher ? 'Creating...' : 'Create Voucher'}
              </button>

              <p className="text-[11px] leading-5 text-slate-400 dark:text-gray-500">
                The reserved amount is deducted from your available cashback balance immediately and returned if the code is cancelled.
              </p>
          </form>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-gray-500">Program Notes</p>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-gray-900 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-gray-400">Cashback Rate</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">
              {displayCashbackRate.toLocaleString('en-PH', {
                minimumFractionDigits: displayCashbackRate % 1 === 0 ? 0 : 2,
                maximumFractionDigits: 2,
              })}
              %
            </p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-gray-400">
              Current program cashback percentage from migrated rewards settings.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-gray-900 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-gray-400">AF Voucher Pool</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{peso(afVoucherSourceBalance)}</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-gray-400">
              Existing AF Voucher rewards in your account, separate from cashback-backed shareable voucher creation.
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 px-4 py-4 space-y-2.5">
            <p className="text-xs font-semibold text-slate-700 dark:text-gray-300">How voucher creation works</p>
            {[
              'Create a voucher from your available cashback balance.',
              'Set an optional expiry date and usage limit.',
              'Share the generated code with your customer.',
              'The amount stays reserved until redeemed, cancelled, or expired.',
            ].map((step, index) => (
              <div key={index} className="flex items-start gap-2.5 text-xs leading-5 text-slate-500 dark:text-gray-400">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30 text-[10px] font-bold text-teal-700 dark:text-teal-400">
                  {index + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-gray-500">Issued Vouchers</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">Your shareable codes</h3>
          </div>
          <span className="rounded-full border border-slate-200 dark:border-slate-700 dark:bg-gray-900 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-gray-400">
            {vouchers.length} total - {activeVoucherCount} active
          </span>
        </div>

        {vouchers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 px-6 py-12 text-center">
            <svg className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
            <p className="text-sm font-semibold text-slate-600 dark:text-gray-400">No vouchers yet</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-gray-500">Once you create an affiliate voucher, it will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  {['Voucher Code', 'Amount', 'Valid Until', 'Uses', 'Created', 'Status'].map((heading) => (
                    <th
                      key={heading}
                      className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-gray-500 last:pr-0"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {vouchers.map((voucher) => (
                  <tr key={voucher.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-gray-700/50">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center">
                        <span className="font-mono text-sm font-bold text-slate-800 dark:text-white">{voucher.code}</span>
                        {voucher.status === 'active' ? <CopyButton text={voucher.code} /> : null}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-sm font-semibold text-slate-800 dark:text-white">{peso(voucher.amount)}</td>
                    <td className="py-3.5 pr-4 whitespace-nowrap text-xs text-slate-500 dark:text-gray-400">
                      {voucher.expires_at ? formatDate(voucher.expires_at) : <span className="text-slate-300 dark:text-gray-600">No expiry</span>}
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-slate-500 dark:text-gray-400">
                      {voucher.max_uses != null ? `${voucher.used_count ?? 0} / ${voucher.max_uses}` : <span className="text-slate-300 dark:text-gray-600">Unlimited</span>}
                    </td>
                    <td className="py-3.5 pr-4 whitespace-nowrap text-xs text-slate-500 dark:text-gray-400">{formatDate(voucher.created_at)}</td>
                    <td className="py-3.5">
                      <StatusBadge status={voucher.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
