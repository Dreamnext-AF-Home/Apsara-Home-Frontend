'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMeQuery } from '@/store/api/userApi';
import {
  EncashmentChannel,
  useCreateEncashmentRequestMutation,
  useGetEncashmentRequestsQuery,
  useSubmitEncashmentVerificationRequestMutation,
} from '@/store/api/encashmentApi';

const money = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
});

const formatCooldownRemaining = (minutes: number) => {
  const totalMinutes = Math.max(0, Math.ceil(Number(minutes || 0)));
  if (totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours <= 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

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

type PaymentMethod = {
  id: string;
  label: string;
  channel: EncashmentChannel;
  accountName: string;
  accountNumber: string;
};

const initialForm: FormState = {
  amount: '',
  channel: 'gcash',
  accountName: '',
  accountNumber: '',
  notes: '',
};

const STORAGE_KEY = 'afhome_encashment_methods_v1';
const VERIFICATION_ID_TYPES = [
  'National ID',
  'Passport',
  'Driver License',
  'UMID',
  'PRC ID',
  'Postal ID',
  'PhilHealth ID',
];

const EncashmentTab = () => {
  const { data: session } = useSession();
  const { data: meData } = useMeQuery();
  const role = String((session?.user as { role?: string } | undefined)?.role ?? '').toLowerCase();
  const isCustomerSession = role === 'customer' || role === '';

  const { data, isLoading, isFetching, isError, refetch, error } = useGetEncashmentRequestsQuery(undefined, {
    skip: !isCustomerSession,
  });
  const [createRequest, { isLoading: isSubmitting }] = useCreateEncashmentRequestMutation();
  const [submitVerificationRequest, { isLoading: isSubmittingVerification }] = useSubmitEncashmentVerificationRequestMutation();

  const [form, setForm] = useState<FormState>(initialForm);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [methodForm, setMethodForm] = useState<{ label: string; channel: EncashmentChannel; accountName: string; accountNumber: string }>({
    label: '',
    channel: 'gcash',
    accountName: '',
    accountNumber: '',
  });
  const [verificationForm, setVerificationForm] = useState({
    fullName: '',
    birthDate: '',
    idType: 'National ID',
    idNumber: '',
    contactNumber: '',
    addressLine: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Philippines',
    notes: '',
    idFrontUrl: '',
    idBackUrl: '',
    selfieUrl: '',
  });
  const [verificationUploadState, setVerificationUploadState] = useState<{
    idFront: boolean;
    idBack: boolean;
    selfie: boolean;
  }>({ idFront: false, idBack: false, selfie: false });

  const rows = data?.requests ?? [];
  const policy = data?.policy;
  const eligibility = data?.eligibility;
  const verification = data?.verification;
  const isEligibleByPolicy = Boolean(eligibility?.eligible ?? true);
  const needsVerification = Boolean(eligibility && !eligibility.has_active_account);
  const isVerificationPending = verification?.status === 'pending_review';
  const showMessageInVerificationCard = Boolean(message) && needsVerification && !isVerificationPending;

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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PaymentMethod[];
      if (Array.isArray(parsed)) {
        setMethods(parsed);
      }
    } catch {
      // ignore malformed local cache
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(methods));
  }, [methods]);

  const applyMethodToForm = (id: string) => {
    setSelectedMethodId(id);
    const method = methods.find((item) => item.id === id);
    if (!method) return;
    setForm((prev) => ({
      ...prev,
      channel: method.channel,
      accountName: method.accountName,
      accountNumber: method.accountNumber,
    }));
  };

  const addMethod = () => {
    const label = methodForm.label.trim();
    const accountName = methodForm.accountName.trim();
    const accountNumber = methodForm.accountNumber.trim();
    if (!label || !accountName || !accountNumber) {
      setMessage({ type: 'error', text: 'Please complete label, account name, and account number to save payment method.' });
      return;
    }

    const next: PaymentMethod = {
      id: `${Date.now()}`,
      label,
      channel: methodForm.channel,
      accountName,
      accountNumber,
    };

    setMethods((prev) => [next, ...prev]);
    setMethodForm({ label: '', channel: 'gcash', accountName: '', accountNumber: '' });
    setMessage({ type: 'success', text: 'Payment method saved. You can use it for your next requests.' });
  };

  const handleVerificationImageUpload = async (field: 'idFrontUrl' | 'idBackUrl' | 'selfieUrl', file: File) => {
    const loadingKey = field === 'idFrontUrl' ? 'idFront' : field === 'idBackUrl' ? 'idBack' : 'selfie';
    setVerificationUploadState((prev) => ({ ...prev, [loadingKey]: true }));
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'verification');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result?.url) {
        throw new Error(result?.error || 'Failed to upload file.');
      }

      setVerificationForm((prev) => ({ ...prev, [field]: result.url as string }));
      setMessage({ type: 'success', text: 'Document uploaded successfully.' });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMessage({ type: 'error', text: e?.message || 'Document upload failed.' });
    } finally {
      setVerificationUploadState((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleSubmitVerificationRequest = async () => {
    setMessage(null);
    if (!verificationForm.fullName.trim()) {
      setMessage({ type: 'error', text: 'Full name is required for verification.' });
      return;
    }
    if (!verificationForm.idFrontUrl || !verificationForm.selfieUrl) {
      setMessage({ type: 'error', text: 'ID front and selfie are required before submitting verification.' });
      return;
    }
    try {
      const res = await submitVerificationRequest({
        full_name: verificationForm.fullName.trim(),
        birth_date: verificationForm.birthDate || undefined,
        id_type: verificationForm.idType,
        id_number: verificationForm.idNumber.trim() || undefined,
        contact_number: verificationForm.contactNumber.trim() || undefined,
        address_line: verificationForm.addressLine.trim() || undefined,
        city: verificationForm.city.trim() || undefined,
        province: verificationForm.province.trim() || undefined,
        postal_code: verificationForm.postalCode.trim() || undefined,
        country: verificationForm.country.trim() || undefined,
        notes: verificationForm.notes.trim() || undefined,
        id_front_url: verificationForm.idFrontUrl,
        id_back_url: verificationForm.idBackUrl || undefined,
        selfie_url: verificationForm.selfieUrl,
        profile_photo_url: meData?.avatar_url || undefined,
      }).unwrap();
      setMessage({
        type: 'success',
        text: `${res.message} Ref: ${res.reference_no ?? 'N/A'} | Approval owner: ${res.approval_owner.toUpperCase()}.`,
      });
      await refetch();
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setMessage({
        type: 'error',
        text: apiErr?.data?.message || 'Failed to submit verification request.',
      });
    }
  };

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

      {message && !showMessageInVerificationCard && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-red-50 text-red-700 border-red-100'
          }`}
        >
          {message.text}
        </div>
      )}

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
                  Cooldown remaining: {formatCooldownRemaining(eligibility.remaining_cooldown_minutes)}
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-slate-100 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Account Verification</p>
              <p className={`mt-1 font-semibold ${eligibility.has_active_account ? 'text-emerald-700' : 'text-red-700'}`}>
                {eligibility.has_active_account ? 'Verified / Active' : 'Not Verified'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Required before encashment request.</p>
            </div>
            <div className="rounded-xl border border-slate-100 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Current Points</p>
              <p className="mt-1 font-semibold text-slate-800">{(eligibility.current_points || 0).toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-0.5">Minimum required: {(policy.min_points || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-100 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Request Eligibility</p>
              <p className={`mt-1 font-semibold ${eligibility.eligible ? 'text-emerald-700' : 'text-red-700'}`}>
                {eligibility.eligible ? 'Can Submit Request' : 'Cannot Submit Yet'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Cooldown and policy checks apply.</p>
            </div>
          </div>
        </div>
      )}

      {isCustomerSession && isEligibleByPolicy && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Saved Payment Methods</h3>
            <p className="text-xs text-gray-500 mt-0.5">Add and select your payout accounts (GCash/Maya/Bank) before requesting encashment.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Saved Method</label>
              <select
                value={selectedMethodId}
                onChange={(e) => applyMethodToForm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              >
                <option value="">Manual entry (no saved method)</option>
                {methods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label} - {method.channel.toUpperCase()} - {method.accountNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              value={methodForm.label}
              onChange={(e) => setMethodForm((prev) => ({ ...prev, label: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              placeholder="Label (ex: Main GCash)"
            />
            <select
              value={methodForm.channel}
              onChange={(e) => setMethodForm((prev) => ({ ...prev, channel: e.target.value as EncashmentChannel }))}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            >
              <option value="gcash">GCash</option>
              <option value="maya">Maya</option>
              <option value="bank">Bank</option>
            </select>
            <input
              type="text"
              value={methodForm.accountName}
              onChange={(e) => setMethodForm((prev) => ({ ...prev, accountName: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              placeholder="Account Name"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={methodForm.accountNumber}
                onChange={(e) => setMethodForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                placeholder="Account Number"
              />
              <button
                type="button"
                onClick={addMethod}
                className="rounded-xl border border-orange-200 px-3 py-2.5 text-xs font-semibold text-orange-700 hover:bg-orange-50"
              >
                Add
              </button>
            </div>
          </div>
      </div>
      )}

      {isCustomerSession && needsVerification && !isVerificationPending && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-6">
          <h3 className="text-base font-bold text-amber-900">Verification Required</h3>
          <p className="mt-1 text-sm text-amber-800">
            To submit an encashment request, your account must be verified and active first. Complete the form and required documents for Admin/KYC review.
          </p>
          {message && showMessageInVerificationCard && (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-red-50 text-red-700 border-red-100'
              }`}
            >
              {message.text}
            </div>
          )}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={verificationForm.fullName}
              onChange={(e) => setVerificationForm((prev) => ({ ...prev, fullName: e.target.value }))}
              className="w-full rounded-xl border border-amber-200 px-3.5 py-2.5 text-sm text-amber-900 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="Full Name (required)"
            />
            <input
              type="date"
              value={verificationForm.birthDate}
              onChange={(e) => setVerificationForm((prev) => ({ ...prev, birthDate: e.target.value }))}
              className="w-full rounded-xl border border-amber-200 px-3.5 py-2.5 text-sm text-amber-900 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
            <select
              value={verificationForm.idType}
              onChange={(e) => setVerificationForm((prev) => ({ ...prev, idType: e.target.value }))}
              className="w-full rounded-xl border border-amber-200 px-3.5 py-2.5 text-sm text-amber-900 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              {VERIFICATION_ID_TYPES.map((idType) => (
                <option key={idType} value={idType}>{idType}</option>
              ))}
            </select>
            <input
              type="text"
              value={verificationForm.idNumber}
              onChange={(e) => setVerificationForm((prev) => ({ ...prev, idNumber: e.target.value }))}
              className="w-full rounded-xl border border-amber-200 px-3.5 py-2.5 text-sm text-amber-900 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="ID Number"
            />
            <input
              type="text"
              value={verificationForm.contactNumber}
              onChange={(e) => setVerificationForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
              className="w-full rounded-xl border border-amber-200 px-3.5 py-2.5 text-sm text-amber-900 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="Contact Number"
            />
            <input
              type="text"
              value={verificationForm.addressLine}
              onChange={(e) => setVerificationForm((prev) => ({ ...prev, addressLine: e.target.value }))}
              className="w-full rounded-xl border border-amber-200 px-3.5 py-2.5 text-sm text-amber-900 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="Address Line"
            />
            <input
              type="text"
              value={verificationForm.city}
              onChange={(e) => setVerificationForm((prev) => ({ ...prev, city: e.target.value }))}
              className="w-full rounded-xl border border-amber-200 px-3.5 py-2.5 text-sm text-amber-900 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="City"
            />
            <input
              type="text"
              value={verificationForm.province}
              onChange={(e) => setVerificationForm((prev) => ({ ...prev, province: e.target.value }))}
              className="w-full rounded-xl border border-amber-200 px-3.5 py-2.5 text-sm text-amber-900 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="Province"
            />
            <input
              type="text"
              value={verificationForm.postalCode}
              onChange={(e) => setVerificationForm((prev) => ({ ...prev, postalCode: e.target.value }))}
              className="w-full rounded-xl border border-amber-200 px-3.5 py-2.5 text-sm text-amber-900 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="Postal Code"
            />
            <input
              type="text"
              value={verificationForm.country}
              onChange={(e) => setVerificationForm((prev) => ({ ...prev, country: e.target.value }))}
              className="w-full rounded-xl border border-amber-200 px-3.5 py-2.5 text-sm text-amber-900 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="Country"
            />
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="rounded-xl border border-amber-200 bg-white/90 px-3.5 py-2.5 text-xs text-amber-900">
              ID Front (required)
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="mt-2 block w-full text-xs"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void handleVerificationImageUpload('idFrontUrl', file);
                }}
              />
              <span className="mt-1 block text-[11px] text-amber-700">{verificationUploadState.idFront ? 'Uploading...' : verificationForm.idFrontUrl ? 'Uploaded' : 'Not uploaded'}</span>
            </label>
            <label className="rounded-xl border border-amber-200 bg-white/90 px-3.5 py-2.5 text-xs text-amber-900">
              ID Back (optional)
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="mt-2 block w-full text-xs"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void handleVerificationImageUpload('idBackUrl', file);
                }}
              />
              <span className="mt-1 block text-[11px] text-amber-700">{verificationUploadState.idBack ? 'Uploading...' : verificationForm.idBackUrl ? 'Uploaded' : 'Not uploaded'}</span>
            </label>
            <label className="rounded-xl border border-amber-200 bg-white/90 px-3.5 py-2.5 text-xs text-amber-900">
              Selfie (required)
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="mt-2 block w-full text-xs"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void handleVerificationImageUpload('selfieUrl', file);
                }}
              />
              <span className="mt-1 block text-[11px] text-amber-700">{verificationUploadState.selfie ? 'Uploading...' : verificationForm.selfieUrl ? 'Uploaded' : 'Not uploaded'}</span>
            </label>
          </div>
          <div className="mt-3">
            <textarea
              rows={3}
              value={verificationForm.notes}
              onChange={(e) => setVerificationForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full rounded-xl border border-amber-200 px-3.5 py-2.5 text-sm text-amber-900 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="Verification notes (optional)"
            />
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleSubmitVerificationRequest}
              disabled={isSubmittingVerification || verificationUploadState.idFront || verificationUploadState.idBack || verificationUploadState.selfie}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {isSubmittingVerification ? 'Submitting...' : 'Submit for Verification Approval'}
            </button>
          </div>
          <p className="mt-2 text-xs text-amber-800/80">
            Verification requests are reviewed by the Admin/KYC team.
          </p>
        </div>
      )}

      {isCustomerSession && needsVerification && isVerificationPending && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
              i
            </div>
            <div>
              <h3 className="text-base font-bold text-blue-900">Approval Pending</h3>
              <p className="mt-1 text-sm text-blue-800">
                Your verification request has been submitted and is currently under Admin/KYC review.
              </p>
              <div className="mt-2 text-xs text-blue-900/80 space-y-1">
                <p>Reference: <span className="font-semibold">{verification?.reference_no || 'N/A'}</span></p>
                <p>Submitted: <span className="font-semibold">{verification?.submitted_at ? new Date(verification.submitted_at).toLocaleString() : 'N/A'}</span></p>
                <p>Status: <span className="font-semibold uppercase">Pending Review</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCustomerSession && isEligibleByPolicy && (
      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">Request Encashment</h3>
          <p className="text-xs text-gray-500 mt-0.5">Submit payout request from your available earnings.</p>
        </div>

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
            disabled={isSubmitting || !isCustomerSession}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm shadow-orange-200"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
      )}

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
                  <th className="py-2 pr-4 font-semibold">Proof</th>
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
                    <td className="py-2.5 pr-4 text-gray-700">
                      {row.proof_url ? (
                        <a
                          href={row.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          View
                        </a>
                      ) : '-'}
                    </td>
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
