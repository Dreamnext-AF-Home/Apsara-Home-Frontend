'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useMeQuery } from '@/store/api/userApi';
import {
  EncashmentChannel,
  EncashmentRequestItem,
  PayoutMethodType as PaymentMethodType,
  useCreateEncashmentPayoutMethodMutation,
  useCreateEncashmentRequestMutation,
  useDeleteEncashmentPayoutMethodMutation,
  useGetEncashmentRequestsQuery,
  useSubmitEncashmentVerificationWithPayoutMutation,
} from '@/store/api/encashmentApi';
import { usePhAddress } from '@/hooks/usePhAddress';

const money = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
});

const formatPhilippineDateTime = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';

  return date.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

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
  pending: 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800',
  approved: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  approved_by_admin: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  rejected: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  released: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
};

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  approved_by_admin: 'Approved by Accounting',
  rejected: 'Rejected',
  released: 'Released',
  on_hold: 'On Hold',
};

const maskAccountNumber = (value?: string | null) => {
  if (!value) return 'N/A';
  const visible = value.slice(-4);
  return `${'*'.repeat(Math.max(0, value.length - 4))}${visible}`;
};

function PayoutReceiptModal({
  request,
  onClose,
}: {
  request: EncashmentRequestItem;
  onClose: () => void;
}) {
  const releasedDate = request.released_at || request.updated_at || request.created_at;
  const netAmount = request.net_amount ?? request.amount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-600">Payout Receipt</p>
            <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">{request.invoice_no || request.reference_no}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto bg-slate-100 p-4 dark:bg-slate-900">
          <div className="mx-auto overflow-hidden rounded-[24px] bg-white shadow-sm dark:bg-slate-950">
            <div className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-cyan-500 to-emerald-400 px-8 py-7 text-white">
              <div className="absolute right-[-60px] top-[-70px] h-48 w-48 rounded-full bg-white/15" />
              <div className="absolute bottom-[-90px] left-[-40px] h-56 w-56 rounded-full bg-white/10" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-lg">
                  <img src="/af_home_logo.png" alt="AF Home" className="h-11 w-auto" />
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/75">Official Release Receipt</p>
                  <h2 className="mt-2 text-3xl font-black">Encashment Payout</h2>
                  <p className="mt-1 text-sm text-white/85">This confirms that AF Home has released the approved payout request.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 px-8 py-7 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Gross Amount</p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{money.format(request.amount)}</p>
              </div>
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
                <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">Deductions</p>
                <p className="mt-2 text-2xl font-black text-red-700 dark:text-red-300">
                  {money.format((request.withholding_tax || 0) + (request.processing_fee || 0))}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-500">Net Payout</p>
                <p className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">{money.format(netAmount)}</p>
              </div>
            </div>

            <div className="grid gap-6 px-8 pb-7 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Receipt Summary</h4>
                <div className="mt-4 grid gap-3 text-sm">
                  {[
                    ['Request Reference', request.reference_no],
                    ['Receipt / Invoice No.', request.invoice_no || 'Pending'],
                    ['Status', statusLabel[request.status] ?? request.status.replace(/_/g, ' ')],
                    ['Payout Channel', request.channel.toUpperCase()],
                    ['Account Name', request.account_name || 'N/A'],
                    ['Account No.', maskAccountNumber(request.account_number)],
                    ['Requested Date', formatPhilippineDateTime(request.created_at)],
                    ['Released Date', formatPhilippineDateTime(releasedDate)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">{label}</span>
                      <span className="text-right font-semibold text-slate-900 dark:text-slate-100">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Computation</h4>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Gross payout</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{money.format(request.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">10% withholding tax</span>
                    <span className="font-semibold text-red-600">{money.format(request.withholding_tax || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Processing fee</span>
                    <span className="font-semibold text-red-600">{money.format(request.processing_fee || 0)}</span>
                  </div>
                  <div className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 text-white">
                    <div className="flex justify-between">
                      <span className="text-white/65">Amount received</span>
                      <span className="text-xl font-black">{money.format(netAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-sky-50 p-4 text-xs leading-relaxed text-sky-800 dark:bg-sky-950/30 dark:text-sky-200">
                  Keep this payout receipt for your records. The attached release proof is a separate transfer screenshot uploaded by Finance.
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-8 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">Generated by AF Home Encashment System</p>
              <div className="flex gap-2">
                {request.proof_url ? (
                  <a
                    href={request.proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                  >
                    View Release Proof
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-full bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-700"
                >
                  Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type FormState = {
  amount: string;
  methodType: PaymentMethodType;
  channel: EncashmentChannel;
  accountName: string;
  accountNumber: string;
  mobileNumber: string;
  emailAddress: string;
  bankName: string;
  bankCode: string;
  accountType: '' | 'savings' | 'checking';
  cardHolderName: string;
  cardBrand: '' | 'visa' | 'mastercard' | 'jcb' | 'amex' | 'other';
  cardLast4: string;
  notes: string;
};

type PaymentMethod = {
  id: number;
  label: string;
  methodType: PaymentMethodType;
  channel: EncashmentChannel;
  accountName: string;
  accountNumber: string;
  mobileNumber?: string;
  emailAddress?: string;
  bankName?: string;
  bankCode?: string;
  accountType?: '' | 'savings' | 'checking';
  cardHolderName?: string;
  cardBrand?: '' | 'visa' | 'mastercard' | 'jcb' | 'amex' | 'other';
  cardLast4?: string;
};

const initialForm: FormState = {
  amount: '',
  methodType: 'gcash',
  channel: 'gcash',
  accountName: '',
  accountNumber: '',
  mobileNumber: '',
  emailAddress: '',
  bankName: '',
  bankCode: '',
  accountType: '',
  cardHolderName: '',
  cardBrand: '',
  cardLast4: '',
  notes: '',
};

const VERIFICATION_ID_TYPES = [
  'National ID',
  'TIN ID',
  'Passport',
  'Driver License',
  'UMID',
  'PRC ID',
  'Postal ID',
  'PhilHealth ID',
];

function VerificationField({
  label,
  error,
  required = false,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className={`block text-xs font-semibold ${error ? 'text-red-700 dark:text-red-400' : 'text-sky-900 dark:text-sky-300'}`}>
        {label}
        {required ? <span className="ml-1 text-red-500 dark:text-red-400">*</span> : null}
      </span>
      {children}
      {error ? <span className="block text-[11px] font-medium text-red-600 dark:text-red-400">{error}</span> : null}
    </label>
  );
}

type VerificationFieldKey =
  | 'fullName'
  | 'birthDate'
  | 'idType'
  | 'idNumber'
  | 'contactNumber'
  | 'addressLine'
  | 'region'
  | 'province'
  | 'city'
  | 'barangay'
  | 'postalCode'
  | 'country'
  | 'idFrontUrl'
  | 'idBackUrl'
  | 'selfieUrl';

type VerificationErrors = Partial<Record<VerificationFieldKey, string>>;

const EncashmentTab = () => {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const role = String((session?.user as { role?: string } | undefined)?.role ?? '').toLowerCase();
  const isCustomerSession = role === 'customer' || role === '';
  const verificationFormRef = useRef<HTMLDivElement | null>(null);
  const { data: meData } = useMeQuery(undefined, {
    skip: !isCustomerSession,
  });

  const { data, isLoading, isFetching, isError, refetch, error } = useGetEncashmentRequestsQuery(undefined, {
    skip: !isCustomerSession,
  });
  const [createRequest, { isLoading: isSubmitting }] = useCreateEncashmentRequestMutation();
  const [createPayoutMethod, { isLoading: isSavingPayoutMethod }] = useCreateEncashmentPayoutMethodMutation();
  const [deletePayoutMethod, { isLoading: isDeletingPayoutMethod }] = useDeleteEncashmentPayoutMethodMutation();
  const [submitVerificationWithPayout, { isLoading: isSubmittingVerificationWithPayout }] = useSubmitEncashmentVerificationWithPayoutMutation();

  const [form, setForm] = useState<FormState>(initialForm);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [methodForm, setMethodForm] = useState<{
    label: string;
    methodType: PaymentMethodType;
    channel: EncashmentChannel;
    accountName: string;
    accountNumber: string;
    mobileNumber: string;
    emailAddress: string;
    bankName: string;
    bankCode: string;
    accountType: '' | 'savings' | 'checking';
    cardHolderName: string;
    cardBrand: '' | 'visa' | 'mastercard' | 'jcb' | 'amex' | 'other';
    cardLast4: string;
  }>({
    label: '',
    methodType: 'gcash',
    channel: 'gcash',
    accountName: '',
    accountNumber: '',
    mobileNumber: '',
    emailAddress: '',
    bankName: '',
    bankCode: '',
    accountType: '',
    cardHolderName: '',
    cardBrand: '',
    cardLast4: '',
  });
  const [verificationForm, setVerificationForm] = useState({
    fullName: '',
    birthDate: '',
    idType: 'National ID',
    idNumber: '',
    contactNumber: '',
    addressLine: '',
    region: '',
    barangay: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Philippines',
    idFrontUrl: '',
    idBackUrl: '',
    selfieUrl: '',
  });
  const [verificationUploadState, setVerificationUploadState] = useState<{
    idFront: boolean;
    idBack: boolean;
    selfie: boolean;
  }>({ idFront: false, idBack: false, selfie: false });
  const [verificationErrors, setVerificationErrors] = useState<VerificationErrors>({});
  const [isVerificationSpotlightActive, setIsVerificationSpotlightActive] = useState(false);
  const [receiptRequest, setReceiptRequest] = useState<EncashmentRequestItem | null>(null);
  const phVerification = usePhAddress({ legacyNoProvinceRegions: true, source: 'auto' });

  const rows = useMemo(() => data?.requests ?? [], [data?.requests]);
  const methods = useMemo<PaymentMethod[]>(
    () =>
      (data?.payout_methods ?? []).map((method) => ({
        id: method.id,
        label: method.label,
        methodType: method.method_type,
        channel: method.channel,
        accountName: method.account_name ?? '',
        accountNumber: method.account_number ?? '',
        mobileNumber: method.mobile_number ?? '',
        emailAddress: method.email_address ?? '',
        bankName: method.bank_name ?? '',
        bankCode: method.bank_code ?? '',
        accountType: method.account_type ?? '',
        cardHolderName: method.card_holder_name ?? '',
        cardBrand: method.card_brand ?? '',
        cardLast4: method.card_last4 ?? '',
      })),
    [data?.payout_methods],
  );
  const policy = data?.policy;
  const eligibility = data?.eligibility;
  const verification = data?.verification;
  const isEligibleByPolicy = Boolean(eligibility?.eligible ?? true);
  const needsVerification = Boolean(eligibility && !eligibility.has_active_account);
  const hasReachedVerificationThreshold = Boolean(
    eligibility
      && policy
      && (eligibility.available_amount || 0) >= (policy.min_amount || 0)
      && (eligibility.current_points || 0) >= (policy.min_points || 0),
  );
  const canSubmitVerification = needsVerification && hasReachedVerificationThreshold;
  const isVerificationPending = verification?.status === 'pending_review';
  const shouldUseCombinedVerificationFlow = canSubmitVerification && !isVerificationPending && !isEligibleByPolicy;
  const showMessageInVerificationCard = Boolean(message) && canSubmitVerification && !isVerificationPending && isVerificationSpotlightActive;
  const focusVerification = searchParams.get('focus') === 'verification';
  const selectedVerificationRegion = phVerification.address.region || verificationForm.region.trim();
  const selectedVerificationProvince = (phVerification.noProvince
    ? (phVerification.address.region || verificationForm.province.trim())
    : (phVerification.address.province || verificationForm.province.trim()));
  const selectedVerificationCity = phVerification.address.city || verificationForm.city.trim();
  const selectedVerificationBarangay = phVerification.address.barangay || verificationForm.barangay.trim();

  useEffect(() => {
    if (!needsVerification) return;
    setVerificationForm((prev) => ({
      ...prev,
      fullName: prev.fullName || meData?.name || '',
      contactNumber: prev.contactNumber || meData?.phone || '',
      addressLine: prev.addressLine || meData?.address || '',
      region: prev.region || meData?.region || '',
      barangay: prev.barangay || meData?.barangay || '',
      city: prev.city || meData?.city || '',
      province: prev.province || meData?.province || '',
      postalCode: prev.postalCode || meData?.zip_code || '',
    }));
  }, [
    meData?.address,
    meData?.barangay,
    meData?.city,
    meData?.name,
    meData?.phone,
    meData?.province,
    meData?.region,
    meData?.zip_code,
    needsVerification,
  ]);

  useEffect(() => {
    if (!needsVerification || !verificationForm.region || phVerification.regions.length === 0 || phVerification.regionCode) return;
    const region = phVerification.regions.find((item) => item.name === verificationForm.region);
    if (region) {
      phVerification.setRegion(region.code, region.name);
    }
  }, [needsVerification, verificationForm.region, phVerification.regions, phVerification.regionCode]);

  useEffect(() => {
    if (
      !needsVerification ||
      !verificationForm.province ||
      phVerification.noProvince ||
      phVerification.provinces.length === 0 ||
      phVerification.provinceCode
    ) return;
    const province = phVerification.provinces.find((item) => item.name === verificationForm.province);
    if (province) {
      phVerification.setProvince(province.code, province.name);
    }
  }, [needsVerification, verificationForm.province, phVerification.noProvince, phVerification.provinces, phVerification.provinceCode]);

  useEffect(() => {
    if (!needsVerification || !verificationForm.city || phVerification.cities.length === 0 || phVerification.cityCode) return;
    const city = phVerification.cities.find((item) => item.name === verificationForm.city);
    if (city) {
      phVerification.setCity(city.code, city.name);
    }
  }, [needsVerification, verificationForm.city, phVerification.cities, phVerification.cityCode]);

  useEffect(() => {
    if (!needsVerification || !verificationForm.barangay || phVerification.address.barangay) return;
    const barangay = phVerification.barangays.find((item) => item.name === verificationForm.barangay);
    if (barangay) {
      phVerification.setBarangay(barangay.name);
    }
  }, [needsVerification, verificationForm.barangay, phVerification.barangays, phVerification.address.barangay]);

  useEffect(() => {
    if (!needsVerification) return;
    setVerificationForm((prev) => ({
      ...prev,
      region: phVerification.address.region || prev.region,
      province: phVerification.noProvince
        ? (phVerification.address.region || prev.province)
        : (phVerification.address.province || prev.province),
      city: phVerification.address.city || prev.city,
      barangay: phVerification.address.barangay || prev.barangay,
    }));
  }, [
    needsVerification,
    phVerification.address.region,
    phVerification.address.province,
    phVerification.address.city,
    phVerification.address.barangay,
    phVerification.noProvince,
  ]);

  useEffect(() => {
    if (!canSubmitVerification || isVerificationPending || !focusVerification) return;

    setIsVerificationSpotlightActive(true);
    const rafId = window.requestAnimationFrame(() => {
      verificationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    const timeoutId = window.setTimeout(() => setIsVerificationSpotlightActive(false), 1800);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [canSubmitVerification, focusVerification, isVerificationPending]);

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

  const verificationInputClass = (field: VerificationFieldKey, extra = '') =>
    [
      'w-full rounded-xl px-3.5 py-2.5 text-sm bg-white/90 dark:bg-gray-900/90 focus:outline-none focus:ring-2 transition-colors',
      verificationErrors[field]
        ? 'border border-red-300 dark:border-red-800 text-red-900 dark:text-red-300 placeholder:text-red-300 dark:placeholder:text-red-700 focus:ring-red-200 dark:focus:ring-red-900/50'
        : 'border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100 dark:placeholder:text-sky-700 focus:ring-sky-200 dark:focus:ring-sky-900/50',
      extra,
    ].join(' ');

  const scrollToVerificationField = (field: VerificationFieldKey) => {
    setIsVerificationSpotlightActive(true);
    verificationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(`[data-verification-field="${field}"]`);
      target?.animate(
        [
          { transform: 'translateY(0px)', boxShadow: '0 0 0 rgba(239,68,68,0)' },
          { transform: 'translateY(-2px)', boxShadow: '0 0 0 8px rgba(239,68,68,0.14)' },
          { transform: 'translateY(0px)', boxShadow: '0 0 0 rgba(239,68,68,0)' },
        ],
        { duration: 700, easing: 'ease-out' },
      );
      target?.focus?.();
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    window.setTimeout(() => setIsVerificationSpotlightActive(false), 1800);
  };

  const buildVerificationPayload = () => {
    const nextErrors: VerificationErrors = {};

    if (!verificationForm.fullName.trim()) nextErrors.fullName = 'Full name is required.';
    if (!verificationForm.birthDate) nextErrors.birthDate = 'Birth date is required.';
    if (!verificationForm.idType.trim()) nextErrors.idType = 'ID type is required.';
    if (!verificationForm.idNumber.trim()) nextErrors.idNumber = 'ID number is required.';
    if (!verificationForm.contactNumber.trim()) nextErrors.contactNumber = 'Contact number is required.';
    if (!verificationForm.addressLine.trim()) nextErrors.addressLine = 'Address line is required.';
    if (!selectedVerificationRegion) nextErrors.region = 'Region is required.';
    if (!selectedVerificationProvince) nextErrors.province = 'Province is required.';
    if (!selectedVerificationCity) nextErrors.city = 'City / Municipality is required.';
    if (!selectedVerificationBarangay) nextErrors.barangay = 'Barangay is required.';
    if (!verificationForm.postalCode.trim()) nextErrors.postalCode = 'Postal code is required.';
    if (!verificationForm.country.trim()) nextErrors.country = 'Country is required.';
    if (!verificationForm.idFrontUrl) nextErrors.idFrontUrl = 'ID front is required.';
    if (!verificationForm.idBackUrl) nextErrors.idBackUrl = 'ID back is required.';
    if (!verificationForm.selfieUrl) nextErrors.selfieUrl = 'Selfie is required.';

    if (Object.keys(nextErrors).length > 0) {
      return { errors: nextErrors, payload: null };
    }

    const composedAddressLine = [
      verificationForm.addressLine.trim(),
      selectedVerificationBarangay,
    ].filter(Boolean).join(', ');

    return {
      errors: {},
      payload: {
        full_name: verificationForm.fullName.trim(),
        birth_date: verificationForm.birthDate,
        id_type: verificationForm.idType,
        id_number: verificationForm.idNumber.trim(),
        contact_number: verificationForm.contactNumber.trim(),
        address_line: composedAddressLine,
        city: selectedVerificationCity,
        province: selectedVerificationProvince,
        postal_code: verificationForm.postalCode.trim(),
        country: verificationForm.country.trim(),
        id_front_url: verificationForm.idFrontUrl,
        id_back_url: verificationForm.idBackUrl,
        selfie_url: verificationForm.selfieUrl,
        profile_photo_url: meData?.avatar_url || undefined,
      },
    };
  };

  const mapMethodTypeToChannel = (methodType: PaymentMethodType): EncashmentChannel => {
    if (methodType === 'gcash') return 'gcash';
    if (methodType === 'maya') return 'maya';
    return 'bank';
  };

  const buildPayoutMeta = (values: {
    methodType: PaymentMethodType;
    mobileNumber?: string;
    emailAddress?: string;
    bankName?: string;
    bankCode?: string;
    accountType?: string;
    cardHolderName?: string;
    cardBrand?: string;
    cardLast4?: string;
  }) => {
    if (values.methodType === 'gcash' || values.methodType === 'maya') {
      return {
        method_type: values.methodType,
        mobile_number: values.mobileNumber || null,
        email: values.emailAddress || null,
      };
    }
    if (values.methodType === 'online_banking') {
      return {
        method_type: values.methodType,
        bank_name: values.bankName || null,
        bank_code: values.bankCode || null,
        account_type: values.accountType || null,
      };
    }
    return {
      method_type: values.methodType,
      card_holder_name: values.cardHolderName || null,
      card_brand: values.cardBrand || null,
      card_last4: values.cardLast4 || null,
    };
  };

  const applyMethodToForm = (id: string) => {
    setSelectedMethodId(id);
    const method = methods.find((item) => String(item.id) === id);
    if (!method) {
      setForm((prev) => ({
        ...prev,
        methodType: 'gcash',
        channel: 'gcash',
        accountName: '',
        accountNumber: '',
        mobileNumber: '',
        emailAddress: '',
        bankName: '',
        bankCode: '',
        accountType: '',
        cardHolderName: '',
        cardBrand: '',
        cardLast4: '',
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      methodType: method.methodType,
      channel: method.channel,
      accountName: method.accountName,
      accountNumber: method.accountNumber,
      mobileNumber: method.mobileNumber || '',
      emailAddress: method.emailAddress || '',
      bankName: method.bankName || '',
      bankCode: method.bankCode || '',
      accountType: method.accountType || '',
      cardHolderName: method.cardHolderName || '',
      cardBrand: method.cardBrand || '',
      cardLast4: method.cardLast4 || '',
    }));
  };

  const addMethod = async () => {
    const label = methodForm.label.trim();
    if (!label) {
      setMessage({ type: 'error', text: 'Please provide a label for the saved payment method.' });
      return;
    }

    let accountName = methodForm.accountName.trim();
    let accountNumber = methodForm.accountNumber.trim();

    if (methodForm.methodType === 'gcash' || methodForm.methodType === 'maya') {
      if (!accountName || !methodForm.mobileNumber.trim()) {
        setMessage({ type: 'error', text: 'Please provide account name and mobile number for e-wallet payout.' });
        return;
      }
      accountNumber = methodForm.mobileNumber.trim();
    }

    if (methodForm.methodType === 'online_banking') {
      if (!accountName || !accountNumber || !methodForm.bankName.trim()) {
        setMessage({ type: 'error', text: 'Please complete bank name, account name, and account number.' });
        return;
      }
    }

    if (methodForm.methodType === 'card') {
      if (!methodForm.cardHolderName.trim() || !methodForm.cardLast4.trim() || !methodForm.cardBrand) {
        setMessage({ type: 'error', text: 'Please complete card holder, card brand, and last 4 digits.' });
        return;
      }
      accountName = methodForm.cardHolderName.trim();
      accountNumber = `****${methodForm.cardLast4.trim()}`;
    }

    try {
      await createPayoutMethod({
        label,
        method_type: methodForm.methodType,
        account_name: accountName || undefined,
        account_number: accountNumber || undefined,
        mobile_number: methodForm.mobileNumber.trim() || undefined,
        email_address: methodForm.emailAddress.trim() || undefined,
        bank_name: methodForm.bankName.trim() || undefined,
        bank_code: methodForm.bankCode.trim() || undefined,
        account_type: methodForm.accountType || undefined,
        card_holder_name: methodForm.cardHolderName.trim() || undefined,
        card_brand: methodForm.cardBrand || undefined,
        card_last4: methodForm.cardLast4.trim() || undefined,
      }).unwrap();

      setMethodForm({
        label: '',
        methodType: 'gcash',
        channel: 'gcash',
        accountName: '',
        accountNumber: '',
        mobileNumber: '',
        emailAddress: '',
        bankName: '',
        bankCode: '',
        accountType: '',
        cardHolderName: '',
        cardBrand: '',
        cardLast4: '',
      });
      await refetch();
      setMessage({ type: 'success', text: 'Payment method saved to your account.' });
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      const firstValidation = apiErr?.data?.errors ? Object.values(apiErr.data.errors)[0]?.[0] : undefined;
      setMessage({
        type: 'error',
        text: firstValidation || apiErr?.data?.message || 'Failed to save payout method.',
      });
    }
  };

  const removeSelectedMethod = async () => {
    if (!selectedMethodId) {
      setMessage({ type: 'error', text: 'Please select a saved method to delete.' });
      return;
    }

    try {
      await deletePayoutMethod({ id: Number(selectedMethodId) }).unwrap();
      setSelectedMethodId('');
      setMessage({ type: 'success', text: 'Saved payout method deleted.' });
      await refetch();
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setMessage({
        type: 'error',
        text: apiErr?.data?.message || 'Failed to delete payout method.',
      });
    }
  };

  const handleVerificationImageUpload = async (field: 'idFrontUrl' | 'idBackUrl' | 'selfieUrl', file: File) => {
    const loadingKey = field === 'idFrontUrl' ? 'idFront' : field === 'idBackUrl' ? 'idBack' : 'selfie';
    setVerificationUploadState((prev) => ({ ...prev, [loadingKey]: true }));
    setMessage(null);
    setVerificationErrors((prev) => ({ ...prev, [field]: undefined }));

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!isCustomerSession) {
      setMessage({ type: 'error', text: 'Encashment is only available for customer/affiliate accounts.' });
      return;
    }

    const numericAmount = Number(form.amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 1) {
      setMessage({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }

    const mappedChannel = mapMethodTypeToChannel(form.methodType);
    let accountName = form.accountName.trim();
    let accountNumber = form.accountNumber.trim();

    if (form.methodType === 'gcash' || form.methodType === 'maya') {
      if (!accountName || !form.mobileNumber.trim()) {
        setMessage({ type: 'error', text: 'Please provide account name and mobile number.' });
        return;
      }
      accountNumber = form.mobileNumber.trim();
    }

    if (form.methodType === 'online_banking') {
      if (!accountName || !accountNumber || !form.bankName.trim()) {
        setMessage({ type: 'error', text: 'Please complete bank name, account name, and account number.' });
        return;
      }
    }

    if (form.methodType === 'card') {
      if (!form.cardHolderName.trim() || !form.cardLast4.trim() || !form.cardBrand) {
        setMessage({ type: 'error', text: 'Please complete card holder, card brand, and last 4 digits.' });
        return;
      }
      accountName = form.cardHolderName.trim();
      accountNumber = `****${form.cardLast4.trim()}`;
    }

    const payoutMeta = buildPayoutMeta({
      methodType: form.methodType,
      mobileNumber: form.mobileNumber.trim(),
      emailAddress: form.emailAddress.trim(),
      bankName: form.bankName.trim(),
      bankCode: form.bankCode.trim(),
      accountType: form.accountType,
      cardHolderName: form.cardHolderName.trim(),
      cardBrand: form.cardBrand,
      cardLast4: form.cardLast4.trim(),
    });
    const appendedNotes = [form.notes.trim(), `PAYOUT_META:${JSON.stringify(payoutMeta)}`]
      .filter(Boolean)
      .join('\n');

    const shouldSubmitCombinedVerification = shouldUseCombinedVerificationFlow;

    if (!isEligibleByPolicy && !shouldSubmitCombinedVerification) {
      setMessage({
        type: 'error',
        text: needsVerification
          ? `Reach ${money.format(policy?.min_amount || 0)} available encashment balance first to unlock verification submission.`
          : (eligibility?.message || 'You are currently not eligible to submit an encashment request.'),
      });
      return;
    }

    try {
      if (shouldSubmitCombinedVerification) {
        const verification = buildVerificationPayload();

        if (!verification.payload) {
          setVerificationErrors(verification.errors);
          const firstField = Object.keys(verification.errors)[0] as VerificationFieldKey;
          setMessage({ type: 'error', text: verification.errors[firstField] ?? 'Please complete the required KYC fields.' });
          scrollToVerificationField(firstField);
          return;
        }

        setVerificationErrors({});
        const res = await submitVerificationWithPayout({
          ...verification.payload,
          amount: numericAmount,
          channel: mappedChannel,
          account_name: accountName || undefined,
          account_number: accountNumber || undefined,
          notes: appendedNotes || undefined,
        }).unwrap();

        setMessage({
          type: 'success',
          text: `Verification and encashment request submitted. KYC Ref: ${res.reference_no ?? 'N/A'} | Payout Ref: ${res.request.reference_no}.`,
        });
        setForm(initialForm);
        await refetch();
        return;
      }

      const res = await createRequest({
        amount: numericAmount,
        channel: mappedChannel,
        account_name: accountName || undefined,
        account_number: accountNumber || undefined,
        notes: appendedNotes || undefined,
      }).unwrap();

      setMessage({
        type: 'success',
        text: `Request submitted. Reference: ${res.request.reference_no}`,
      });
      setForm(initialForm);
      await refetch();
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
      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-800 dark:to-slate-950 text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(-45deg,transparent,transparent 6px,rgba(255,255,255,.15) 6px,rgba(255,255,255,.15) 7px)' }} />
          <p className="text-[10px] uppercase tracking-widest text-slate-300 font-semibold">Total Requested</p>
          <p className="mt-2 text-2xl font-black tracking-tight">{money.format(summary.total)}</p>
          <span className="absolute bottom-3 right-4 text-3xl opacity-20 select-none">₱</span>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(-45deg,transparent,transparent 6px,rgba(255,255,255,.15) 6px,rgba(255,255,255,.15) 7px)' }} />
          <p className="text-[10px] uppercase tracking-widest text-amber-100 font-semibold">Pending Requests</p>
          <p className="mt-2 text-2xl font-black tracking-tight">{summary.pending}</p>
          <span className="absolute bottom-3 right-4 text-3xl opacity-20 select-none">⏳</span>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(-45deg,transparent,transparent 6px,rgba(255,255,255,.15) 6px,rgba(255,255,255,.15) 7px)' }} />
          <p className="text-[10px] uppercase tracking-widest text-emerald-100 font-semibold">Total Released</p>
          <p className="mt-2 text-2xl font-black tracking-tight">{money.format(summary.released)}</p>
          <span className="absolute bottom-3 right-4 text-3xl opacity-20 select-none">✓</span>
        </div>
      </div>

      {/* ── Global Message Banner ── */}
      {message && !showMessageInVerificationCard && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
          }`}
        >
          <span className="mt-0.5 shrink-0 font-bold">{message.type === 'success' ? '✓' : '✕'}</span>
          <span>{message.text}</span>
        </motion.div>
      )}

      {/* ── Encashment Requirements ── */}
      {isCustomerSession && policy && eligibility && (
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-gray-800/80 flex items-center gap-2.5">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Encashment Requirements</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Policy rules and your current eligibility status</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mb-2">Policy</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { label: 'Min. Amount', value: money.format(policy.min_amount || 0) },
                  { label: 'Min. Points', value: (policy.min_points || 0).toLocaleString() },
                  { label: 'Cooldown', value: policy.cooldown_hours > 0 ? `${policy.cooldown_hours}h` : 'None' },
                  { label: 'Withholding Tax', value: `${((policy.withholding_tax_rate || 0) * 100).toFixed(0)}%` },
                  { label: 'Processing Fee', value: money.format(policy.processing_fee || 0) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-slate-700 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
                    <p className="mt-0.5 font-semibold text-gray-800 dark:text-gray-200 text-xs">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mb-2">Your Status</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-slate-700 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Available Balance</p>
                  <p className="mt-0.5 font-bold text-gray-800 dark:text-gray-100 text-sm">{money.format(eligibility.available_amount || 0)}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Locked: {money.format(eligibility.locked_amount || 0)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-slate-700 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Current Points</p>
                  <p className="mt-0.5 font-bold text-gray-800 dark:text-gray-100 text-sm">{(eligibility.current_points || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Min. required: {(policy.min_points || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-slate-700 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Account Verification</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${eligibility.has_active_account ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <p className={`font-bold text-sm ${eligibility.has_active_account ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                      {eligibility.has_active_account ? 'Verified' : 'Not Verified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${eligibility.eligible ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
              <span className={`text-lg shrink-0 ${eligibility.eligible ? 'text-emerald-500' : 'text-red-500'}`}>{eligibility.eligible ? '✓' : '✕'}</span>
              <div>
                <p className={`text-sm font-bold ${eligibility.eligible ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
                  {eligibility.eligible ? 'You are eligible to submit a request' : 'Not eligible yet'}
                </p>
                {!eligibility.eligible && eligibility.message && (
                  <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{eligibility.message}</p>
                )}
                {eligibility.remaining_cooldown_minutes > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Cooldown remaining: {formatCooldownRemaining(eligibility.remaining_cooldown_minutes)}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Saved Payment Methods ── */}
      {isCustomerSession && isEligibleByPolicy && (
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-gray-800/80 flex items-center gap-2.5">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Saved Payment Methods</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage your GCash / Maya / Bank payout accounts</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Select Saved Method</label>
                <select
                  value={selectedMethodId}
                  onChange={(e) => applyMethodToForm(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                >
                  <option value="">Manual entry (no saved method)</option>
                  {methods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.label} - {method.methodType.replace('_', ' ').toUpperCase()} - {method.accountNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button type="button" onClick={() => applyMethodToForm('')}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-gray-700 px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
                <button type="button" onClick={() => void removeSelectedMethod()}
                  disabled={!selectedMethodId || isDeletingPayoutMethod}
                  className="flex-1 rounded-xl border border-red-200 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 px-3 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {isDeletingPayoutMethod ? 'Deleting...' : 'Delete Selected'}
                </button>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 dark:border-slate-700 pt-4 space-y-3">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Add New Method</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" value={methodForm.label}
                  onChange={(e) => setMethodForm((prev) => ({ ...prev, label: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                  placeholder="Label (e.g. Main GCash)"
                />
                <select value={methodForm.methodType}
                  onChange={(e) => {
                    const methodType = e.target.value as PaymentMethodType;
                    setMethodForm((prev) => ({ ...prev, methodType, channel: mapMethodTypeToChannel(methodType) }));
                  }}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                >
                  <option value="gcash">GCash</option>
                  <option value="maya">Maya</option>
                  <option value="online_banking">Online Banking</option>
                  <option value="card">Card</option>
                </select>
              </div>

              {(methodForm.methodType === 'gcash' || methodForm.methodType === 'maya') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="text" value={methodForm.accountName}
                    onChange={(e) => setMethodForm((prev) => ({ ...prev, accountName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                    placeholder="Account Name" />
                  <input type="text" value={methodForm.mobileNumber}
                    onChange={(e) => setMethodForm((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                    placeholder="Mobile Number (09xxxxxxxxx)" />
                  <input type="email" value={methodForm.emailAddress}
                    onChange={(e) => setMethodForm((prev) => ({ ...prev, emailAddress: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                    placeholder="Email (optional)" />
                </div>
              )}

              {methodForm.methodType === 'online_banking' && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <input type="text" value={methodForm.bankName} onChange={(e) => setMethodForm((prev) => ({ ...prev, bankName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50" placeholder="Bank Name" />
                  <input type="text" value={methodForm.bankCode} onChange={(e) => setMethodForm((prev) => ({ ...prev, bankCode: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50" placeholder="Bank Code (optional)" />
                  <input type="text" value={methodForm.accountName} onChange={(e) => setMethodForm((prev) => ({ ...prev, accountName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50" placeholder="Account Name" />
                  <input type="text" value={methodForm.accountNumber} onChange={(e) => setMethodForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50" placeholder="Account Number" />
                  <select value={methodForm.accountType} onChange={(e) => setMethodForm((prev) => ({ ...prev, accountType: e.target.value as '' | 'savings' | 'checking' }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50">
                    <option value="">Account Type</option>
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                  </select>
                </div>
              )}

              {methodForm.methodType === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input type="text" value={methodForm.cardHolderName} onChange={(e) => setMethodForm((prev) => ({ ...prev, cardHolderName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50" placeholder="Card Holder Name" />
                  <select value={methodForm.cardBrand} onChange={(e) => setMethodForm((prev) => ({ ...prev, cardBrand: e.target.value as FormState['cardBrand'] }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50">
                    <option value="">Card Brand</option>
                    <option value="visa">VISA</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="jcb">JCB</option>
                    <option value="amex">Amex</option>
                    <option value="other">Other</option>
                  </select>
                  <input type="text" inputMode="numeric" maxLength={4} value={methodForm.cardLast4}
                    onChange={(e) => setMethodForm((prev) => ({ ...prev, cardLast4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50" placeholder="Last 4 Digits" />
                  <input type="text" value={methodForm.accountNumber} onChange={(e) => setMethodForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50" placeholder="Reference Token (optional)" />
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Online Banking and Card use BANK channel; extra details saved in notes.</p>
                <button type="button" onClick={() => void addMethod()} disabled={isSavingPayoutMethod}
                  className="rounded-xl bg-sky-600 dark:bg-sky-700 hover:bg-sky-700 dark:hover:bg-sky-800 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60 transition-colors"
                >
                  {isSavingPayoutMethod ? 'Saving...' : '+ Add Method'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Verification Threshold Info ── */}
      {isCustomerSession && needsVerification && !isVerificationPending && !canSubmitVerification && (
        <div className="rounded-2xl border border-sky-200 dark:border-sky-800 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 p-5">
          <div className="flex items-start gap-4">
            <div className="shrink-0 h-10 w-10 rounded-full bg-sky-600 dark:bg-sky-700 text-white flex items-center justify-center font-bold text-base">i</div>
            <div>
              <h3 className="text-sm font-bold text-sky-900 dark:text-sky-300">Verification Unlocks at the Minimum Threshold</h3>
              <p className="mt-1 text-sm text-sky-800 dark:text-sky-200">
                Your KYC verification form will appear once your available balance reaches{' '}
                <span className="font-bold">{money.format(policy?.min_amount || 0)}</span>.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <div className="rounded-lg bg-white/60 dark:bg-sky-900/40 border border-sky-200 dark:border-sky-800 px-3 py-1.5">
                  <span className="text-sky-600 dark:text-sky-400">Available now: </span>
                  <span className="font-bold text-sky-900 dark:text-sky-200">{money.format(eligibility?.available_amount || 0)}</span>
                </div>
                <div className="rounded-lg bg-white/60 dark:bg-sky-900/40 border border-sky-200 dark:border-sky-800 px-3 py-1.5">
                  <span className="text-sky-600 dark:text-sky-400">Required: </span>
                  <span className="font-bold text-sky-900 dark:text-sky-200">{money.format(policy?.min_amount || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── KYC Verification Form ── */}
      {isCustomerSession && canSubmitVerification && !isVerificationPending && (
        <motion.div
          ref={verificationFormRef}
          id="verification-form"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: isVerificationSpotlightActive ? [1, 1.01, 1] : 1,
            boxShadow: isVerificationSpotlightActive
              ? ['0 0 0 rgba(245,158,11,0)', '0 0 0 12px rgba(245,158,11,0.16)', '0 0 0 rgba(245,158,11,0)']
              : '0 0 0 rgba(245,158,11,0)',
          }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className={`scroll-mt-28 rounded-2xl border bg-sky-50 dark:bg-sky-900/20 overflow-hidden transition-all duration-500 ${
            isVerificationSpotlightActive ? 'border-sky-400 dark:border-sky-700 ring-4 ring-sky-200/70 dark:ring-sky-900/50' : 'border-sky-200 dark:border-sky-800'
          }`}
        >
          <div className="px-5 py-4 border-b border-sky-100 dark:border-sky-800 bg-sky-100/60 dark:bg-sky-900/30 flex items-center gap-2.5">
            <svg className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg>
            <div>
              <h3 className="text-sm font-bold text-sky-900 dark:text-sky-300">KYC Verification & Encashment Request</h3>
              <p className="text-xs text-sky-700 dark:text-sky-400">Complete your identity details - reviewed together with your payout request</p>
            </div>
          </div>

          {message && showMessageInVerificationCard && (
            <div className={`mx-5 mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
            }`}>
              <span className="mt-0.5 shrink-0 font-bold">{message.type === 'success' ? '✓' : '✕'}</span>
              <span>{message.text}</span>
            </div>
          )}

          <div className="p-5 space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-500 mb-3">Personal Information</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <VerificationField label="Full Name" required error={verificationErrors.fullName}>
                  <input data-verification-field="fullName" type="text" required value={verificationForm.fullName}
                    onChange={(e) => { setVerificationForm((prev) => ({ ...prev, fullName: e.target.value })); setVerificationErrors((prev) => ({ ...prev, fullName: undefined })); }}
                    className={verificationInputClass('fullName')} placeholder="Enter full name" />
                </VerificationField>
                <VerificationField label="Birth Date" required error={verificationErrors.birthDate}>
                  <input data-verification-field="birthDate" type="date" required value={verificationForm.birthDate}
                    onChange={(e) => { setVerificationForm((prev) => ({ ...prev, birthDate: e.target.value })); setVerificationErrors((prev) => ({ ...prev, birthDate: undefined })); }}
                    className={verificationInputClass('birthDate')} />
                </VerificationField>
                <VerificationField label="ID Type" required error={verificationErrors.idType}>
                  <select data-verification-field="idType" required value={verificationForm.idType}
                    onChange={(e) => { setVerificationForm((prev) => ({ ...prev, idType: e.target.value })); setVerificationErrors((prev) => ({ ...prev, idType: undefined })); }}
                    className={verificationInputClass('idType')}>
                    {VERIFICATION_ID_TYPES.map((idType) => <option key={idType} value={idType}>{idType}</option>)}
                  </select>
                </VerificationField>
                <VerificationField label="ID Number" required error={verificationErrors.idNumber}>
                  <input data-verification-field="idNumber" type="text" required value={verificationForm.idNumber}
                    onChange={(e) => { setVerificationForm((prev) => ({ ...prev, idNumber: e.target.value })); setVerificationErrors((prev) => ({ ...prev, idNumber: undefined })); }}
                    className={verificationInputClass('idNumber')} placeholder="Enter ID number" />
                </VerificationField>
                <VerificationField label="Contact Number" required error={verificationErrors.contactNumber}>
                  <input data-verification-field="contactNumber" type="text" required value={verificationForm.contactNumber}
                    onChange={(e) => { setVerificationForm((prev) => ({ ...prev, contactNumber: e.target.value })); setVerificationErrors((prev) => ({ ...prev, contactNumber: undefined })); }}
                    className={verificationInputClass('contactNumber')} placeholder="Enter contact number" />
                </VerificationField>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-500 mb-3">Address</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <VerificationField label="Address Line" required error={verificationErrors.addressLine}>
                  <input data-verification-field="addressLine" type="text" required value={verificationForm.addressLine}
                    onChange={(e) => { setVerificationForm((prev) => ({ ...prev, addressLine: e.target.value })); setVerificationErrors((prev) => ({ ...prev, addressLine: undefined })); }}
                    className={verificationInputClass('addressLine')} placeholder="House no., street, subdivision" />
                </VerificationField>
                <VerificationField label="Region" required error={verificationErrors.region}>
                  <select data-verification-field="region" required value={phVerification.regionCode}
                    onChange={(e) => { const option = e.target.options[e.target.selectedIndex]; phVerification.setRegion(e.target.value, option.text); setVerificationErrors((prev) => ({ ...prev, region: undefined })); }}
                    className={verificationInputClass('region')}>
                    <option value="">- Select Region -</option>
                    {phVerification.regions.map((region) => <option key={region.code} value={region.code}>{region.name}</option>)}
                  </select>
                </VerificationField>
                {!phVerification.noProvince ? (
                  <VerificationField label="Province" required error={verificationErrors.province}>
                    <select data-verification-field="province" required value={phVerification.provinceCode}
                      disabled={!phVerification.regionCode || phVerification.loadingProvinces}
                      onChange={(e) => { const option = e.target.options[e.target.selectedIndex]; phVerification.setProvince(e.target.value, option.text); setVerificationErrors((prev) => ({ ...prev, province: undefined })); }}
                      className={verificationInputClass('province', 'disabled:bg-slate-100 disabled:text-slate-400')}>
                      <option value="">{phVerification.loadingProvinces ? 'Loading provinces...' : '- Select Province -'}</option>
                      {phVerification.provinces.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}
                    </select>
                  </VerificationField>
                ) : null}
                <VerificationField label="City / Municipality" required error={verificationErrors.city}>
                  <select data-verification-field="city" required value={phVerification.cityCode}
                    disabled={phVerification.noProvince ? !phVerification.regionCode : (!phVerification.provinceCode || phVerification.loadingCities)}
                    onChange={(e) => { const option = e.target.options[e.target.selectedIndex]; phVerification.setCity(e.target.value, option.text); setVerificationErrors((prev) => ({ ...prev, city: undefined })); }}
                    className={verificationInputClass('city', 'disabled:bg-slate-100 disabled:text-slate-400')}>
                    <option value="">{phVerification.loadingCities || phVerification.loadingProvinces ? 'Loading cities...' : '- Select City / Municipality -'}</option>
                    {phVerification.cities.map((city) => <option key={city.code} value={city.code}>{city.name}</option>)}
                  </select>
                </VerificationField>
                <VerificationField label="Barangay" required error={verificationErrors.barangay}>
                  <select data-verification-field="barangay" required value={phVerification.address.barangay}
                    disabled={!phVerification.cityCode || phVerification.loadingBarangays}
                    onChange={(e) => { phVerification.setBarangay(e.target.value); setVerificationErrors((prev) => ({ ...prev, barangay: undefined })); }}
                    className={verificationInputClass('barangay', 'disabled:bg-slate-100 disabled:text-slate-400')}>
                    <option value="">{phVerification.loadingBarangays ? 'Loading barangays...' : '- Select Barangay -'}</option>
                    {phVerification.barangays.map((barangay) => <option key={barangay.code} value={barangay.name}>{barangay.name}</option>)}
                  </select>
                </VerificationField>
                <VerificationField label="Postal Code" required error={verificationErrors.postalCode}>
                  <input data-verification-field="postalCode" type="text" required value={verificationForm.postalCode}
                    onChange={(e) => { setVerificationForm((prev) => ({ ...prev, postalCode: e.target.value })); setVerificationErrors((prev) => ({ ...prev, postalCode: undefined })); }}
                    className={verificationInputClass('postalCode')} placeholder="Enter postal code" />
                </VerificationField>
                <VerificationField label="Country" required error={verificationErrors.country}>
                  <input data-verification-field="country" type="text" required value={verificationForm.country}
                    onChange={(e) => { setVerificationForm((prev) => ({ ...prev, country: e.target.value })); setVerificationErrors((prev) => ({ ...prev, country: undefined })); }}
                    className={verificationInputClass('country')} placeholder="Enter country" />
                </VerificationField>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-500 mb-3">Identity Documents</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {([
                  { field: 'idFrontUrl' as const, loadingKey: 'idFront' as const, label: 'ID Front', icon: 'ID' },
                  { field: 'idBackUrl' as const, loadingKey: 'idBack' as const, label: 'ID Back', icon: 'BK' },
                  { field: 'selfieUrl' as const, loadingKey: 'selfie' as const, label: 'Selfie with ID', icon: 'SL' },
                ]).map(({ field, loadingKey, label, icon }) => {
                  const isUploaded = !!verificationForm[field];
                  const isUploading = verificationUploadState[loadingKey];
                  const hasError = !!verificationErrors[field];
                  return (
                    <VerificationField key={field} label={label} required error={verificationErrors[field]}>
                      <label
                        data-verification-field={field}
                        tabIndex={-1}
                        className={[
                          'flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-all min-h-[96px] px-3 py-4 border-2 border-dashed text-center',
                          hasError
                            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                            : isUploaded
                              ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-sky-200 dark:border-sky-700 bg-white/60 dark:bg-sky-900/10 hover:bg-sky-50 dark:hover:bg-sky-900/20',
                        ].join(' ')}
                      >
                        <span className="text-2xl">{isUploading ? '⏳' : isUploaded ? '✅' : icon}</span>
                        <span className={`text-xs font-semibold ${hasError ? 'text-red-700 dark:text-red-400' : isUploaded ? 'text-emerald-700 dark:text-emerald-400' : 'text-sky-700 dark:text-sky-400'}`}>
                          {isUploading ? 'Uploading...' : isUploaded ? 'Uploaded ✓' : 'Click to upload'}
                        </span>
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only"
                          onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; void handleVerificationImageUpload(field, file); }} />
                      </label>
                    </VerificationField>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-sky-100 dark:border-sky-800">
              <p className="text-xs text-sky-700/70 dark:text-sky-400/60">Submits together with your payout request below.</p>
              <motion.button
                type="button"
                onClick={() => document.getElementById('encashment-request-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                disabled={verificationUploadState.idFront || verificationUploadState.idBack || verificationUploadState.selfie}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 dark:bg-sky-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-700 dark:hover:bg-sky-800 disabled:opacity-60 transition-colors"
              >
                Continue to Payout ↓
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Verification Pending ── */}
      {isCustomerSession && needsVerification && isVerificationPending && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5">
          <div className="flex items-start gap-4">
            <div className="shrink-0 h-10 w-10 rounded-full bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300">Verification Under Review</h3>
                <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Pending Review</span>
              </div>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">Your KYC submission is currently being reviewed by our admin team.</p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                {[
                  { label: 'Reference', value: verification?.reference_no || 'N/A' },
                  { label: 'Submitted', value: formatPhilippineDateTime(verification?.submitted_at) },
                  { label: 'Status', value: 'Pending Review' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-white/60 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-2.5 py-2">
                    <p className="text-blue-500 dark:text-blue-500">{label}</p>
                    <p className="mt-0.5 font-bold text-blue-900 dark:text-blue-200">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Encashment Request Form ── */}
      {isCustomerSession && (isEligibleByPolicy || shouldUseCombinedVerificationFlow) && (
        <form id="encashment-request-form" onSubmit={handleSubmit} className="scroll-mt-28 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-gray-800/80 flex items-center gap-2.5">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {shouldUseCombinedVerificationFlow ? 'Submit Verification & Encashment Request' : 'Request Encashment'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {shouldUseCombinedVerificationFlow
                  ? 'KYC details above and payout details here will be reviewed together.'
                  : 'Submit a payout request from your available earnings.'}
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Amount (PHP)</label>
                <input type="number" min={1} step="0.01" required value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                  placeholder="e.g. 1500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Payout Method</label>
                <select required value={form.methodType}
                  onChange={(e) => { const methodType = e.target.value as PaymentMethodType; setForm((prev) => ({ ...prev, methodType, channel: mapMethodTypeToChannel(methodType) })); }}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50">
                  <option value="gcash">GCash</option>
                  <option value="maya">Maya</option>
                  <option value="online_banking">Online Banking</option>
                  <option value="card">Card</option>
                </select>
              </div>
            </div>

            {(form.methodType === 'gcash' || form.methodType === 'maya') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Account Name</label>
                  <input type="text" value={form.accountName} onChange={(e) => setForm((prev) => ({ ...prev, accountName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                    placeholder="E-wallet owner name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Mobile Number</label>
                  <input type="text" value={form.mobileNumber} onChange={(e) => setForm((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                    placeholder="09xxxxxxxxx" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Email (optional)</label>
                  <input type="email" value={form.emailAddress} onChange={(e) => setForm((prev) => ({ ...prev, emailAddress: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                    placeholder="you@email.com" />
                </div>
              </div>
            )}

            {form.methodType === 'online_banking' && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Bank Name</label>
                  <input type="text" value={form.bankName} onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                    placeholder="Bank of example" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Bank Code (optional)</label>
                  <input type="text" value={form.bankCode} onChange={(e) => setForm((prev) => ({ ...prev, bankCode: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                    placeholder="BPI / BDO / PNB" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Account Name</label>
                  <input type="text" value={form.accountName} onChange={(e) => setForm((prev) => ({ ...prev, accountName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                    placeholder="Account holder name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Account Number</label>
                  <input type="text" value={form.accountNumber} onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                    placeholder="Bank account number" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Account Type</label>
                  <select value={form.accountType} onChange={(e) => setForm((prev) => ({ ...prev, accountType: e.target.value as '' | 'savings' | 'checking' }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50">
                    <option value="">Select type</option>
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                  </select>
                </div>
              </div>
            )}

            {form.methodType === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Card Holder Name</label>
                  <input type="text" value={form.cardHolderName} onChange={(e) => setForm((prev) => ({ ...prev, cardHolderName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                    placeholder="Name on card" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Card Brand</label>
                  <select value={form.cardBrand} onChange={(e) => setForm((prev) => ({ ...prev, cardBrand: e.target.value as FormState['cardBrand'] }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50">
                    <option value="">Select brand</option>
                    <option value="visa">VISA</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="jcb">JCB</option>
                    <option value="amex">Amex</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Last 4 Digits</label>
                  <input type="text" inputMode="numeric" maxLength={4} value={form.cardLast4}
                    onChange={(e) => setForm((prev) => ({ ...prev, cardLast4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                    placeholder="1234" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Reference Token (optional)</label>
                  <input type="text" value={form.accountNumber} onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50"
                    placeholder="Processor token/ref" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Notes (optional)</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 resize-none"
                placeholder="Optional notes for finance team" />
            </div>

            <div className="flex justify-end pt-1">
              <motion.button type="submit"
                disabled={isSubmitting || isSubmittingVerificationWithPayout || !isCustomerSession}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 dark:bg-sky-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-sky-700 dark:hover:bg-sky-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting || isSubmittingVerificationWithPayout
                  ? 'Submitting...'
                  : shouldUseCombinedVerificationFlow
                    ? 'Submit Verification & Request'
                    : 'Submit Request'}
              </motion.button>
            </div>
          </div>
        </form>
      )}

      {/* ── Encashment History ── */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Encashment History</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Track approval and release status for each request</p>
            </div>
          </div>
          <button type="button" onClick={() => refetch()} disabled={isFetching}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-sky-200 hover:text-sky-600 disabled:opacity-60 transition-colors"
          >
            {isFetching ? '↻ Refreshing...' : '↻ Refresh'}
          </button>
        </div>

        <div className="p-5">
          {!isCustomerSession && (
            <div className="rounded-xl border border-sky-100 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/30 px-4 py-3 text-sm text-sky-700 dark:text-sky-400">
              You are signed in with an admin account. Please sign in as customer/affiliate to view encashment history.
            </div>
          )}
          {isCustomerSession && isError && (
            <div className="rounded-xl border border-red-100 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {(error as { data?: { message?: string } } | undefined)?.data?.message || 'Failed to load encashment history.'}
            </div>
          )}
          {isCustomerSession && !isError && isLoading && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
              ))}
            </div>
          )}
          {isCustomerSession && !isError && !isLoading && rows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg className="w-10 h-10 mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No encashment requests yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Submit a request above to get started.</p>
            </div>
          )}
          {isCustomerSession && !isError && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-slate-700">
                    <th className="pb-2.5 pr-4 font-bold">Reference</th>
                    <th className="pb-2.5 pr-4 font-bold">Gross</th>
                    <th className="pb-2.5 pr-4 font-bold">Deductions</th>
                    <th className="pb-2.5 pr-4 font-bold">Net</th>
                    <th className="pb-2.5 pr-4 font-bold">Channel</th>
                    <th className="pb-2.5 pr-4 font-bold">Status</th>
                    <th className="pb-2.5 pr-4 font-bold">Receipt</th>
                    <th className="pb-2.5 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs font-semibold text-gray-800 dark:text-white">{row.reference_no}</td>
                      <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{money.format(row.amount)}</td>
                      <td className="py-3 pr-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 leading-5">
                          <div>Tax: {money.format(row.withholding_tax || 0)}</div>
                          <div>Fee: {money.format(row.processing_fee || 0)}</div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">{money.format(row.net_amount ?? row.amount)}</td>
                      <td className="py-3 pr-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{row.channel}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[row.status] || 'bg-gray-50 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700'}`}>
                          {statusLabel[row.status] ?? row.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {row.status === 'released' ? (
                          <button
                            type="button"
                            onClick={() => setReceiptRequest(row)}
                            className="inline-flex items-center rounded-full border border-sky-200 px-2.5 py-1 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-900/30"
                          >
                            View Receipt
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Pending</span>
                        )}
                      </td>
                      <td className="py-3 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{formatPhilippineDateTime(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {receiptRequest ? (
        <PayoutReceiptModal request={receiptRequest} onClose={() => setReceiptRequest(null)} />
      ) : null}
    </div>
  );
};

export default EncashmentTab;
