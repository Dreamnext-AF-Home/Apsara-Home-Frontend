'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  EncashmentChannel,
  useCreateEncashmentRequestMutation,
  useGetEncashmentRequestsQuery,
} from '@/store/api/encashmentApi';

const money = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
});

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  released: 'bg-blue-50 text-blue-700 border-blue-200',
};

type FormState = {
  amount: string;
  channel: EncashmentChannel;
  accountName: string;
  accountNumber: string;
  notes: string;
};

const initialForm: FormState = {
  amount: '',
  channel: 'gcash',
  accountName: '',
  accountNumber: '',
  notes: '',
};

const EncashmentTab = () => {
  const { data: session } = useSession();
  const role = String((session?.user as { role?: string } | undefined)?.role ?? '').toLowerCase();
  const isCustomerSession = role === 'customer' || role === '';

  const { data, isLoading, isFetching, isError, refetch, error } = useGetEncashmentRequestsQuery(undefined, {
    skip: !isCustomerSession,
  });
  const [createRequest, { isLoading: isSubmitting }] = useCreateEncashmentRequestMutation();

  const [form, setForm] = useState<FormState>(initialForm);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const rows = data?.requests ?? [];
  const policy = data?.policy;
  const eligibility = data?.eligibility;
  const isEligibleByPolicy = Boolean(eligibility?.eligible ?? true);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, item) => {
        acc.total += item.amount;
        if (item.status === 'pending') acc.pending += 1;
        if (item.status === 'released') acc.released += item.amount;
        return acc;
      },
      { total: 0, pending: 0, released: 0 },
    );
  }, [rows]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!isCustomerSession) {
      setMessage({ type: 'error', text: 'Encashment is only available for customer/affiliate accounts.' });
      return;
    }

    if (!isEligibleByPolicy) {
      setMessage({
        type: 'error',
        text: eligibility?.message || 'You are currently not eligible to submit an encashment request.',
      });
      return;
    }

    const numericAmount = Number(form.amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 1) {
      setMessage({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }

    try {
      const res = await createRequest({
        amount: numericAmount,
        channel: form.channel,
        account_name: form.accountName.trim() || undefined,
        account_number: form.accountNumber.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }).unwrap();

      setMessage({
        type: 'success',
        text: `Request submitted. Reference: ${res.request.reference_no}`,
      });
      setForm(initialForm);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      const firstValidation = apiErr?.data?.errors ? Object.values(apiErr.data.errors)[0]?.[0] : undefined;
      setMessage({
        type: 'error',
        text: firstValidation || apiErr?.data?.message || 'Failed to submit encashment request.',
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total Requested</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{money.format(summary.total)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Pending Requests</p>
          <p className="mt-1 text-lg font-bold text-amber-700">{summary.pending}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total Released</p>
          <p className="mt-1 text-lg font-bold text-emerald-700">{money.format(summary.released)}</p>
        </div>
      </div>

      {isCustomerSession && policy && eligibility && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
          <div className="mb-3">
            <h3 className="text-base font-bold text-gray-900">Encashment Requirements</h3>
            <p className="text-xs text-gray-500 mt-0.5">Rules before you can submit a payout request.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Minimum Amount</p>
              <p className="mt-1 font-semibold text-slate-800">{money.format(policy.min_amount || 0)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Minimum Points</p>
              <p className="mt-1 font-semibold text-slate-800">{(policy.min_points || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Cooldown</p>
              <p className="mt-1 font-semibold text-slate-800">
                {policy.cooldown_hours > 0 ? `${policy.cooldown_hours} hour(s)` : 'No cooldown'}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-100 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Available Balance</p>
              <p className="mt-1 font-semibold text-slate-800">{money.format(eligibility.available_amount || 0)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Locked in active requests: {money.format(eligibility.locked_amount || 0)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Eligibility Status</p>
              <p className={`mt-1 font-semibold ${eligibility.eligible ? 'text-emerald-700' : 'text-red-700'}`}>
                {eligibility.eligible ? 'Eligible' : 'Not Eligible'}
              </p>
              {!eligibility.eligible && (
                <p className="text-xs text-red-700 mt-0.5">{eligibility.message}</p>
              )}
              {eligibility.remaining_cooldown_minutes > 0 && (
                <p className="text-xs text-amber-700 mt-0.5">
                  Cooldown remaining: {eligibility.remaining_cooldown_minutes} minute(s)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">Request Encashment</h3>
          <p className="text-xs text-gray-500 mt-0.5">Submit payout request from your available earnings.</p>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-red-50 text-red-700 border-red-100'
              }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount (PHP)</label>
            <input
              type="number"
              min={1}
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              placeholder="e.g. 1500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Channel</label>
            <select
              required
              value={form.channel}
              onChange={(e) => setForm((prev) => ({ ...prev, channel: e.target.value as EncashmentChannel }))}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            >
              <option value="gcash">GCash</option>
              <option value="maya">Maya</option>
              <option value="bank">Bank</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account Name</label>
            <input
              type="text"
              value={form.accountName}
              onChange={(e) => setForm((prev) => ({ ...prev, accountName: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              placeholder="Account holder name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account Number</label>
            <input
              type="text"
              value={form.accountNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              placeholder="0917xxxxxxx / bank account no."
            />
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes (optional)</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            placeholder="Optional notes for finance team"
          />
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !isCustomerSession || !isEligibleByPolicy}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm shadow-orange-200"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Encashment History</h3>
            <p className="text-xs text-gray-500 mt-0.5">Track approval and release status for each request.</p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-orange-200 hover:text-orange-600 disabled:opacity-60"
          >
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {!isCustomerSession && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            You are currently signed in with an admin account. Please sign in as customer/affiliate to view encashment history.
          </div>
        )}

        {isCustomerSession && isError && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {(error as { data?: { message?: string } } | undefined)?.data?.message || 'Failed to load encashment history.'}
          </div>
        )}

        {isCustomerSession && !isError && isLoading && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500">Loading requests...</div>
        )}

        {isCustomerSession && !isError && !isLoading && rows.length === 0 && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500">
            No encashment requests yet.
          </div>
        )}

        {isCustomerSession && !isError && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4 font-semibold">Reference</th>
                  <th className="py-2 pr-4 font-semibold">Amount</th>
                  <th className="py-2 pr-4 font-semibold">Channel</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 font-semibold">Invoice</th>
                  <th className="py-2 pr-0 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 last:border-b-0">
                    <td className="py-2.5 pr-4 font-medium text-gray-800">{row.reference_no}</td>
                    <td className="py-2.5 pr-4 text-gray-700">{money.format(row.amount)}</td>
                    <td className="py-2.5 pr-4 text-gray-700 uppercase">{row.channel}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle[row.status] || 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-700">{row.invoice_no || '-'}</td>
                    <td className="py-2.5 pr-0 text-gray-500">{row.created_at ? new Date(row.created_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EncashmentTab;
