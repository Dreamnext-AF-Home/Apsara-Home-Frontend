'use client';

import { FormEvent, useMemo, useState } from 'react';
import PvStatCard from './PvStatCard';
import { AffiliateVoucherItem } from '@/store/api/encashmentApi';

interface RewardsWalletTabProps {
  isVerified: boolean;
  afVoucherBalance: number;
  afVoucherSourceBalance: number;
  afVoucherReservedBalance: number;
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
    cls: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    dot: 'bg-sky-500',
  },
  redeemed: {
    label: 'Redeemed',
    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    cls: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    dot: 'bg-rose-500',
  },
  expired: {
    label: 'Expired',
    cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    dot: 'bg-amber-500',
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
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
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
  isVerified,
  afVoucherBalance,
  afVoucherSourceBalance,
  afVoucherReservedBalance,
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
          accent="amber"
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Voucher Studio</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Create Affiliate Voucher</h3>
            </div>
            <div className="flex items-center gap-2">
              {isVerified ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  Verified
                </span>
              ) : null}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Active Coupon</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">{activeVoucherCount}</p>
              </div>
            </div>
          </div>

          <div className="mb-5 grid gap-2.5 sm:grid-cols-3">
            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-600">Cashback Source</p>
              <p className="mt-1.5 text-lg font-bold text-slate-900">{peso(cashbackSourceBalance)}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600">Cashback Reserved</p>
              <p className="mt-1.5 text-lg font-bold text-slate-900">{peso(cashbackReservedBalance)}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">Cashback Available</p>
              <p className="mt-1.5 text-lg font-bold text-slate-900">{peso(cashbackBalance)}</p>
            </div>
          </div>

          {isVerified ? (
            <form className="space-y-4" onSubmit={handleCreateVoucher}>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Voucher Amount <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">P</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={voucherAmount}
                    onChange={(e) => setVoucherAmount(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-4 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Valid Until
                    <span className="ml-1 text-[10px] font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Leave blank for no expiry.</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Max Uses
                    <span className="ml-1 text-[10px] font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                    placeholder="e.g. 1"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Leave blank for unlimited uses.</p>
                </div>
              </div>

              {message ? (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                    message.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                      : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                  }`}
                >
                  {message.text}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isCreatingVoucher}
                className="w-full rounded-2xl bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingVoucher ? 'Creating...' : 'Create Voucher'}
              </button>

              <p className="text-[11px] leading-5 text-slate-400">
                The reserved amount is deducted from your available cashback balance immediately and returned if the code is cancelled.
              </p>
            </form>
          ) : (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-5 py-5">
              <div className="mb-2 flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </span>
                <h4 className="text-sm font-bold text-slate-900">Verification required</h4>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Only verified affiliate accounts can create customer voucher codes. Complete your AF Home verification to unlock this feature.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Program Notes</p>

          <div className="rounded-2xl bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cashback Rate</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">
              {displayCashbackRate.toLocaleString('en-PH', {
                minimumFractionDigits: displayCashbackRate % 1 === 0 ? 0 : 2,
                maximumFractionDigits: 2,
              })}
              %
            </p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Current program cashback percentage from migrated rewards settings.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">AF Voucher Pool</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">{peso(afVoucherSourceBalance)}</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Existing AF Voucher rewards in your account, separate from cashback-backed shareable voucher creation.
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 space-y-2.5">
            <p className="text-xs font-semibold text-slate-700">How voucher creation works</p>
            {[
              'Create a voucher from your available cashback balance.',
              'Set an optional expiry date and usage limit.',
              'Share the generated code with your customer.',
              'The amount stays reserved until redeemed, cancelled, or expired.',
            ].map((step, index) => (
              <div key={index} className="flex items-start gap-2.5 text-xs leading-5 text-slate-500">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">
                  {index + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Issued Vouchers</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">Your shareable codes</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {vouchers.length} total · {activeVoucherCount} active
          </span>
        </div>

        {vouchers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
            <svg className="mx-auto mb-3 h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
            <p className="text-sm font-semibold text-slate-600">No vouchers yet</p>
            <p className="mt-1 text-xs text-slate-400">Once you create an affiliate voucher, it will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Voucher Code', 'Amount', 'Valid Until', 'Uses', 'Created', 'Status'].map((heading) => (
                    <th
                      key={heading}
                      className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 last:pr-0"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {vouchers.map((voucher) => (
                  <tr key={voucher.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center">
                        <span className="font-mono text-sm font-bold text-slate-800">{voucher.code}</span>
                        {voucher.status === 'active' ? <CopyButton text={voucher.code} /> : null}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-sm font-semibold text-slate-800">{peso(voucher.amount)}</td>
                    <td className="py-3.5 pr-4 whitespace-nowrap text-xs text-slate-500">
                      {voucher.expires_at ? formatDate(voucher.expires_at) : <span className="text-slate-300">No expiry</span>}
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-slate-500">
                      {voucher.max_uses != null ? `${voucher.used_count ?? 0} / ${voucher.max_uses}` : <span className="text-slate-300">Unlimited</span>}
                    </td>
                    <td className="py-3.5 pr-4 whitespace-nowrap text-xs text-slate-500">{formatDate(voucher.created_at)}</td>
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
