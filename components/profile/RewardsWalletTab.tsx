'use client';

import { FormEvent, useMemo, useState } from 'react';
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

const colorGradients = [
  'from-orange-400 via-orange-500 to-amber-500',
  'from-violet-500 via-indigo-500 to-cyan-500',
  'from-emerald-400 via-teal-500 to-sky-500',
  'from-rose-500 via-fuchsia-500 to-purple-600',
];

const getGradientColor = (id: number | string) => {
  const key = String(id ?? '0');
  const index = key.charCodeAt(0) % colorGradients.length;
  return colorGradients[index];
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
      {/* ── Balance Summary ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {([
          {
            label: 'AF Voucher Balance',
            value: peso(afVoucherBalance),
            bg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
            border: 'border-amber-200/60 dark:border-amber-700/40',
            iconBg: 'from-amber-500 to-orange-500',
            icon: '🎟',
            helper: 'Reward vouchers available in your account',
          },
          {
            label: 'E-GC Balance',
            value: peso(availableEgcBalance),
            bg: 'from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20',
            border: 'border-sky-200/60 dark:border-sky-700/40',
            iconBg: 'from-sky-500 to-blue-500',
            icon: '💎',
            helper: 'Digital gift card balance ready for use',
          },
          {
            label: 'Available Cashback',
            value: peso(cashbackBalance),
            bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
            border: 'border-emerald-200/60 dark:border-emerald-700/40',
            iconBg: 'from-emerald-500 to-teal-500',
            icon: '💰',
            helper: 'Can be converted into shareable AF vouchers',
          },
        ] as const).map(({ label, value, bg, border, iconBg, icon, helper }) => (
          <div key={label} className={`relative overflow-hidden rounded-2xl border ${border} bg-gradient-to-br ${bg} p-4`}>
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${iconBg} text-white text-sm mb-3`}>
              {icon}
            </div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white">{value}</p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{helper}</p>
          </div>
        ))}
      </div>

      {/* ── Voucher Studio + Program Notes ── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Create Voucher */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-gray-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🎟</span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Affiliate Voucher</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Reserve cashback into a shareable promo code</p>
              </div>
            </div>
            <div className="shrink-0 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 px-3.5 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Active</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{activeVoucherCount}</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Cashback sub-balances */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-slate-700 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-sky-500 dark:text-sky-400">Source</p>
                <p className="mt-0.5 text-sm font-black text-slate-900 dark:text-white">{peso(cashbackSourceBalance)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-slate-700 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 dark:text-amber-400">Reserved</p>
                <p className="mt-0.5 text-sm font-black text-slate-900 dark:text-white">{peso(cashbackReservedBalance)}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Available</p>
                <p className="mt-0.5 text-sm font-black text-emerald-700 dark:text-emerald-300">{peso(cashbackBalance)}</p>
              </div>
            </div>

            <form className="space-y-3.5" onSubmit={handleCreateVoucher}>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                  Voucher Amount <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 dark:text-slate-500">₱</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={voucherAmount}
                    onChange={(e) => setVoucherAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white py-2.5 pl-8 pr-4 text-sm text-slate-900 outline-none transition focus:border-amber-400 dark:focus:border-amber-600 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800/50"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                    Valid Until <span className="text-slate-400 dark:text-slate-500 font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-400 dark:focus:border-amber-600 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800/50"
                  />
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Leave blank for no expiry.</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                    Max Uses <span className="text-slate-400 dark:text-slate-500 font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-400 dark:focus:border-amber-600 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800/50"
                    placeholder="e.g. 1"
                  />
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Leave blank for unlimited uses.</p>
                </div>
              </div>

              {message ? (
                <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ${
                  message.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800'
                }`}>
                  <span className="mt-0.5 shrink-0">{message.type === 'success' ? '✓' : '✕'}</span>
                  <span>{message.text}</span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isCreatingVoucher}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 py-2.5 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60 shadow-sm shadow-amber-200 dark:shadow-amber-900/20"
              >
                {isCreatingVoucher ? 'Creating…' : '✦ Create Voucher'}
              </button>

              <p className="text-[11px] leading-5 text-slate-400 dark:text-slate-500">
                The reserved amount is deducted from your available cashback balance immediately and returned if the code is cancelled.
              </p>
            </form>
          </div>
        </div>

        {/* Program Notes */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-gray-800/80">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Program Notes</p>
          </div>
          <div className="px-5 pb-5 pt-4 space-y-3">
            <div className="rounded-xl bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-slate-700 px-4 py-3.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Cashback Rate</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {displayCashbackRate.toLocaleString('en-PH', {
                  minimumFractionDigits: displayCashbackRate % 1 === 0 ? 0 : 2,
                  maximumFractionDigits: 2,
                })}%
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Current program cashback percentage from migrated rewards settings.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-slate-700 px-4 py-3.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">AF Voucher Pool</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{peso(afVoucherSourceBalance)}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Existing AF Voucher rewards, separate from cashback-backed voucher creation.
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-4 py-4 space-y-2.5">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">How voucher creation works</p>
              {[
                'Create a voucher from your available cashback balance.',
                'Set an optional expiry date and usage limit.',
                'Share the generated code with your customer.',
                'The amount stays reserved until redeemed, cancelled, or expired.',
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-2.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    {index + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Issued Vouchers ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-gray-800/80 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Issued Vouchers</p>
            <h3 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">Your shareable codes</h3>
          </div>
          <span className="shrink-0 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
            {vouchers.length} total · {activeVoucherCount} active
          </span>
        </div>

        <div className="p-5">
          {vouchers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
                <svg className="h-6 w-6 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No vouchers yet</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Create your first affiliate voucher above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vouchers.map((voucher) => {
                const gradient = getGradientColor(voucher.id);
                const usesText = voucher.max_uses != null ? `${voucher.used_count ?? 0} / ${voucher.max_uses}` : '∞ uses';

                return (
                  <div key={voucher.id} className={`relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-r ${gradient} p-4 shadow-[0_20px_60px_rgba(15,23,42,0.12)]`}>
                    <span className="pointer-events-none absolute left-0 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20" />
                    <span className="pointer-events-none absolute right-0 top-1/2 h-6 w-6 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20" />

                    <div className="grid gap-4 lg:grid-cols-[1.9fr_1.2fr_0.8fr] items-center">
                      <div className="space-y-3 text-white">
                        <div className="flex items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/15 text-xl">
                            <span>🎟</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/80">discount voucher</p>
                            <p className="mt-2 text-3xl font-black tracking-tight">₱{(voucher.amount || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">{voucher.code}</span>
                          <CopyButton text={voucher.code} />
                        </div>
                      </div>

                      <div className="grid gap-3 rounded-[28px] bg-white/10 p-3 text-sm text-white/95">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Valid until</p>
                          <p className="font-semibold">{voucher.expires_at ? formatDate(voucher.expires_at) : 'No expiry'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Uses</p>
                          <p className="font-semibold">{usesText}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Created</p>
                          <p className="font-semibold">{formatDate(voucher.created_at)}</p>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between gap-4 rounded-[28px] bg-white/10 p-4 text-white/95">
                        <div className="flex items-center justify-between gap-3">
                          <StatusBadge status={voucher.status} />
                        </div>
                        <p className="text-right text-xs uppercase tracking-[0.2em] text-white/75">{usesText}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
