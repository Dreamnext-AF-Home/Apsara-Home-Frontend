'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useMeQuery } from '@/store/api/userApi';
import {
  EncashmentChannel,
  PayoutMethodType as PaymentMethodType,
  useCreateEncashmentPayoutMethodMutation,
  useCreateEncashmentRequestMutation,
  useDeleteEncashmentPayoutMethodMutation,
  useGetEncashmentRequestsQuery,
  useSubmitEncashmentVerificationRequestMutation,
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
  rejected: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  released: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
};

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

const getApiErrorText = (err: unknown, fallback: string) => {
  const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
  const firstValidation = apiErr?.data?.errors ? Object.values(apiErr.data.errors)[0]?.[0] : undefined;
  return firstValidation || apiErr?.data?.message || fallback;
};

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
  const [submitVerificationRequest, { isLoading: isSubmittingVerification }] = useSubmitEncashmentVerificationRequestMutation();

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
  const showMessageInVerificationCard = Boolean(message) && canSubmitVerification && !isVerificationPending;
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

  const handleSubmitVerificationRequest = async () => {
    setMessage(null);
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
      setVerificationErrors(nextErrors);
      const firstField = Object.keys(nextErrors)[0] as VerificationFieldKey;
      setMessage({ type: 'error', text: nextErrors[firstField] ?? 'Please complete the required KYC fields.' });
      scrollToVerificationField(firstField);
      return;
    }

    setVerificationErrors({});
    try {
      const composedAddressLine = [
        verificationForm.addressLine.trim(),
        selectedVerificationBarangay,
      ].filter(Boolean).join(', ');

      const res = await submitVerificationRequest({
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
      }).unwrap();
      setMessage({
        type: 'success',
        text: `${res.message} Ref: ${res.reference_no ?? 'N/A'} | Approval owner: ${res.approval_owner.toUpperCase()}.`,
      });
      await refetch();
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: getApiErrorText(err, 'Failed to submit verification request.'),
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
      if (canSubmitVerification && !isVerificationPending) {
        setIsVerificationSpotlightActive(true);
        verificationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => setIsVerificationSpotlightActive(false), 1800);
      }
      setMessage({
        type: 'error',
        text: canSubmitVerification && !isVerificationPending
          ? 'Submit your verification first before requesting encashment.'
          : needsVerification
            ? `Reach ${money.format(policy?.min_amount || 0)} available encashment balance first to unlock verification submission.`
          : (eligibility?.message || 'You are currently not eligible to submit an encashment request.'),
      });
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

    try {
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
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Requested</p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{money.format(summary.total)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Pending Requests</p>
          <p className="mt-1 text-lg font-bold text-sky-700 dark:text-sky-400">{summary.pending}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Released</p>
          <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">{money.format(summary.released)}</p>
        </div>
      </div>

      {message && !showMessageInVerificationCard && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {isCustomerSession && policy && eligibility && (
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 dark:bg-gray-800 p-5 md:p-6">
          <div className="mb-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Encashment Requirements</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Rules before you can submit a payout request.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-slate-100 dark:border-slate-700 dark:bg-gray-900/30 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">Minimum Amount</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-gray-300">{money.format(policy.min_amount || 0)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-700 dark:bg-gray-900/30 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">Minimum Points</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-gray-300">{(policy.min_points || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-700 dark:bg-gray-900/30 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">Cooldown</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-gray-300">
                {policy.cooldown_hours > 0 ? `${policy.cooldown_hours} hour(s)` : 'No cooldown'}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-100 dark:border-slate-700 dark:bg-gray-900/30 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">Withholding Tax</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-gray-300">{((policy.withholding_tax_rate || 0) * 100).toFixed(0)}%</p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-700 dark:bg-gray-900/30 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">Processing Fee</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-gray-300">{money.format(policy.processing_fee || 0)}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-100 dark:border-slate-700 dark:bg-gray-900/30 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">Available Balance</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-gray-300">{money.format(eligibility.available_amount || 0)}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Locked in active requests: {money.format(eligibility.locked_amount || 0)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-700 dark:bg-gray-900/30 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">Eligibility Status</p>
              <p className={`mt-1 font-semibold ${eligibility.eligible ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                {eligibility.eligible ? 'Eligible' : 'Not Eligible'}
              </p>
              {!eligibility.eligible && (
                <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{eligibility.message}</p>
              )}
              {eligibility.remaining_cooldown_minutes > 0 && (
                <p className="text-xs text-sky-700 dark:text-sky-400 mt-0.5">
                  Cooldown remaining: {formatCooldownRemaining(eligibility.remaining_cooldown_minutes)}
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-slate-100 dark:border-slate-700 dark:bg-gray-900/30 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">Account Verification</p>
              <p className={`mt-1 font-semibold ${eligibility.has_active_account ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                {eligibility.has_active_account ? 'Verified / Active' : 'Not Verified'}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Required before encashment request.</p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-700 dark:bg-gray-900/30 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">Current Points</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-gray-300">{(eligibility.current_points || 0).toLocaleString()}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Minimum required: {(policy.min_points || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-700 dark:bg-gray-900/30 px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">Request Eligibility</p>
              <p className={`mt-1 font-semibold ${eligibility.eligible ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                {eligibility.eligible ? 'Can Submit Request' : 'Cannot Submit Yet'}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Cooldown and policy checks apply.</p>
            </div>
          </div>
        </div>
      )}

      {isCustomerSession && isEligibleByPolicy && (
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 dark:bg-gray-800 p-5 md:p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Saved Payment Methods</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Add and select your payout accounts (GCash/Maya/Bank) before requesting encashment.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Select Saved Method</label>
              <select
                value={selectedMethodId}
                onChange={(e) => applyMethodToForm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
              >
                <option value="">Manual entry (no saved method)</option>
                {methods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label} - {method.methodType.replace('_', ' ').toUpperCase()} - {method.accountNumber}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end justify-end gap-2">
              <button
                type="button"
                onClick={() => applyMethodToForm('')}
                className="rounded-xl border border-gray-200 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-gray-700 px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={() => void removeSelectedMethod()}
                disabled={!selectedMethodId || isDeletingPayoutMethod}
                className="rounded-xl border border-red-200 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 px-3 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {isDeletingPayoutMethod ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={methodForm.label}
              onChange={(e) => setMethodForm((prev) => ({ ...prev, label: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
              placeholder="Label (ex: Main GCash / Payroll Bank)"
            />
            <select
              value={methodForm.methodType}
              onChange={(e) => {
                const methodType = e.target.value as PaymentMethodType;
                setMethodForm((prev) => ({
                  ...prev,
                  methodType,
                  channel: mapMethodTypeToChannel(methodType),
                }));
              }}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
            >
              <option value="gcash">GCash</option>
              <option value="maya">Maya</option>
              <option value="online_banking">Online Banking</option>
              <option value="card">Card</option>
            </select>
          </div>

          {(methodForm.methodType === 'gcash' || methodForm.methodType === 'maya') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={methodForm.accountName}
                onChange={(e) => setMethodForm((prev) => ({ ...prev, accountName: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="Account Name"
              />
              <input
                type="text"
                value={methodForm.mobileNumber}
                onChange={(e) => setMethodForm((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="Mobile Number (09xxxxxxxxx)"
              />
              <input
                type="email"
                value={methodForm.emailAddress}
                onChange={(e) => setMethodForm((prev) => ({ ...prev, emailAddress: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="Email (optional)"
              />
            </div>
          )}

          {methodForm.methodType === 'online_banking' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                type="text"
                value={methodForm.bankName}
                onChange={(e) => setMethodForm((prev) => ({ ...prev, bankName: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="Bank Name"
              />
              <input
                type="text"
                value={methodForm.bankCode}
                onChange={(e) => setMethodForm((prev) => ({ ...prev, bankCode: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="Bank Code (optional)"
              />
              <input
                type="text"
                value={methodForm.accountName}
                onChange={(e) => setMethodForm((prev) => ({ ...prev, accountName: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="Account Name"
              />
              <input
                type="text"
                value={methodForm.accountNumber}
                onChange={(e) => setMethodForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="Account Number"
              />
              <select
                value={methodForm.accountType}
                onChange={(e) => setMethodForm((prev) => ({ ...prev, accountType: e.target.value as '' | 'savings' | 'checking' }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
              >
                <option value="">Account Type</option>
                <option value="savings">Savings</option>
                <option value="checking">Checking</option>
              </select>
            </div>
          )}

          {methodForm.methodType === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                value={methodForm.cardHolderName}
                onChange={(e) => setMethodForm((prev) => ({ ...prev, cardHolderName: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="Card Holder Name"
              />
              <select
                value={methodForm.cardBrand}
                onChange={(e) => setMethodForm((prev) => ({ ...prev, cardBrand: e.target.value as FormState['cardBrand'] }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
              >
                <option value="">Card Brand</option>
                <option value="visa">VISA</option>
                <option value="mastercard">Mastercard</option>
                <option value="jcb">JCB</option>
                <option value="amex">Amex</option>
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={methodForm.cardLast4}
                onChange={(e) => setMethodForm((prev) => ({ ...prev, cardLast4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="Last 4 Digits"
              />
              <input
                type="text"
                value={methodForm.accountNumber}
                onChange={(e) => setMethodForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="Reference Token (optional)"
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void addMethod()}
              disabled={isSavingPayoutMethod}
              className="rounded-xl border border-sky-200 dark:border-sky-800 dark:text-sky-400 dark:hover:bg-sky-900/30 px-3 py-2.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-60"
            >
              {isSavingPayoutMethod ? 'Saving...' : 'Add Method'}
            </button>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Online Banking and Card are mapped to BANK channel in backend, with extra details saved in request notes.
          </p>
      </div>
      )}

      {isCustomerSession && needsVerification && !isVerificationPending && !canSubmitVerification && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-center text-sm font-bold">
              i
            </div>
            <div>
              <h3 className="text-base font-bold text-blue-900 dark:text-blue-300">Verification Unlocks at the Minimum Threshold</h3>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                Your KYC verification form will appear once your available encashment balance reaches {money.format(policy?.min_amount || 0)}.
              </p>
              <div className="mt-2 text-xs text-blue-900/80 dark:text-blue-200/80 space-y-1">
                <p>Available now: <span className="font-semibold">{money.format(eligibility?.available_amount || 0)}</span></p>
                <p>Required minimum: <span className="font-semibold">{money.format(policy?.min_amount || 0)}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

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
              ? [
                  '0 0 0 rgba(245,158,11,0)',
                  '0 0 0 12px rgba(245,158,11,0.16)',
                  '0 0 0 rgba(245,158,11,0)',
                ]
              : '0 0 0 rgba(245,158,11,0)',
          }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className={`scroll-mt-28 rounded-2xl border bg-sky-50 dark:bg-sky-900/20 p-5 md:p-6 transition-all duration-500 ${
            isVerificationSpotlightActive ? 'border-sky-400 dark:border-sky-700 ring-4 ring-sky-200/70 dark:ring-sky-900/50' : 'border-sky-200 dark:border-sky-800'
          }`}
        >
          <h3 className="text-base font-bold text-sky-900 dark:text-sky-300">Verification Required</h3>
          <p className="mt-1 text-sm text-sky-800 dark:text-sky-200">
            To submit an encashment request, your account must be verified and active first. Complete the form and required documents for Admin/KYC review.
          </p>
          {message && showMessageInVerificationCard && (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'
              }`}
            >
              {message.text}
            </div>
          )}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <VerificationField label="Full Name" required error={verificationErrors.fullName}>
              <input
                data-verification-field="fullName"
                type="text"
                required
                value={verificationForm.fullName}
                onChange={(e) => {
                  setVerificationForm((prev) => ({ ...prev, fullName: e.target.value }));
                  setVerificationErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                className={verificationInputClass('fullName')}
                placeholder="Enter full name"
              />
            </VerificationField>
            <VerificationField label="Birth Date" required error={verificationErrors.birthDate}>
              <input
                data-verification-field="birthDate"
                type="date"
                required
                value={verificationForm.birthDate}
                onChange={(e) => {
                  setVerificationForm((prev) => ({ ...prev, birthDate: e.target.value }));
                  setVerificationErrors((prev) => ({ ...prev, birthDate: undefined }));
                }}
                className={verificationInputClass('birthDate')}
              />
            </VerificationField>
            <VerificationField label="ID Type" required error={verificationErrors.idType}>
              <select
                data-verification-field="idType"
                required
                value={verificationForm.idType}
                onChange={(e) => {
                  setVerificationForm((prev) => ({ ...prev, idType: e.target.value }));
                  setVerificationErrors((prev) => ({ ...prev, idType: undefined }));
                }}
                className={verificationInputClass('idType')}
              >
                {VERIFICATION_ID_TYPES.map((idType) => (
                  <option key={idType} value={idType}>{idType}</option>
                ))}
              </select>
            </VerificationField>
            <VerificationField label="ID Number" required error={verificationErrors.idNumber}>
              <input
                data-verification-field="idNumber"
                type="text"
                required
                value={verificationForm.idNumber}
                onChange={(e) => {
                  setVerificationForm((prev) => ({ ...prev, idNumber: e.target.value }));
                  setVerificationErrors((prev) => ({ ...prev, idNumber: undefined }));
                }}
                className={verificationInputClass('idNumber')}
                placeholder="Enter ID number"
              />
            </VerificationField>
            <VerificationField label="Contact Number" required error={verificationErrors.contactNumber}>
              <input
                data-verification-field="contactNumber"
                type="text"
                required
                value={verificationForm.contactNumber}
                onChange={(e) => {
                  setVerificationForm((prev) => ({ ...prev, contactNumber: e.target.value }));
                  setVerificationErrors((prev) => ({ ...prev, contactNumber: undefined }));
                }}
                className={verificationInputClass('contactNumber')}
                placeholder="Enter contact number"
              />
            </VerificationField>
            <VerificationField label="Address Line" required error={verificationErrors.addressLine}>
              <input
                data-verification-field="addressLine"
                type="text"
                required
                value={verificationForm.addressLine}
                onChange={(e) => {
                  setVerificationForm((prev) => ({ ...prev, addressLine: e.target.value }));
                  setVerificationErrors((prev) => ({ ...prev, addressLine: undefined }));
                }}
                className={verificationInputClass('addressLine')}
                placeholder="House no., street, subdivision"
              />
            </VerificationField>
            <VerificationField label="Region" required error={verificationErrors.region}>
              <select
                data-verification-field="region"
                required
                value={phVerification.regionCode}
                onChange={(e) => {
                  const option = e.target.options[e.target.selectedIndex];
                  phVerification.setRegion(e.target.value, option.text);
                  setVerificationErrors((prev) => ({ ...prev, region: undefined }));
                }}
                className={verificationInputClass('region')}
              >
                <option value="">- Select Region -</option>
                {phVerification.regions.map((region) => (
                  <option key={region.code} value={region.code}>{region.name}</option>
                ))}
              </select>
            </VerificationField>
            {!phVerification.noProvince ? (
              <VerificationField label="Province" required error={verificationErrors.province}>
                <select
                  data-verification-field="province"
                  required
                  value={phVerification.provinceCode}
                  disabled={!phVerification.regionCode || phVerification.loadingProvinces}
                  onChange={(e) => {
                    const option = e.target.options[e.target.selectedIndex];
                    phVerification.setProvince(e.target.value, option.text);
                    setVerificationErrors((prev) => ({ ...prev, province: undefined }));
                  }}
                  className={verificationInputClass('province', 'disabled:bg-slate-100 disabled:text-slate-400')}
                >
                  <option value="">{phVerification.loadingProvinces ? 'Loading provinces...' : '- Select Province -'}</option>
                  {phVerification.provinces.map((province) => (
                    <option key={province.code} value={province.code}>{province.name}</option>
                  ))}
                </select>
              </VerificationField>
            ) : null}
            <VerificationField label="City / Municipality" required error={verificationErrors.city}>
              <select
                data-verification-field="city"
                required
                value={phVerification.cityCode}
                disabled={phVerification.noProvince ? !phVerification.regionCode : (!phVerification.provinceCode || phVerification.loadingCities)}
                onChange={(e) => {
                  const option = e.target.options[e.target.selectedIndex];
                  phVerification.setCity(e.target.value, option.text);
                  setVerificationErrors((prev) => ({ ...prev, city: undefined }));
                }}
                className={verificationInputClass('city', 'disabled:bg-slate-100 disabled:text-slate-400')}
              >
                <option value="">{phVerification.loadingCities || phVerification.loadingProvinces ? 'Loading cities...' : '- Select City / Municipality -'}</option>
                {phVerification.cities.map((city) => (
                  <option key={city.code} value={city.code}>{city.name}</option>
                ))}
              </select>
            </VerificationField>
            <VerificationField label="Barangay" required error={verificationErrors.barangay}>
              <select
                data-verification-field="barangay"
                required
                value={phVerification.address.barangay}
                disabled={!phVerification.cityCode || phVerification.loadingBarangays}
                onChange={(e) => {
                  phVerification.setBarangay(e.target.value);
                  setVerificationErrors((prev) => ({ ...prev, barangay: undefined }));
                }}
                className={verificationInputClass('barangay', 'disabled:bg-slate-100 disabled:text-slate-400')}
              >
                <option value="">{phVerification.loadingBarangays ? 'Loading barangays...' : '- Select Barangay -'}</option>
                {phVerification.barangays.map((barangay) => (
                  <option key={barangay.code} value={barangay.name}>{barangay.name}</option>
                ))}
              </select>
            </VerificationField>
            <VerificationField label="Postal Code" required error={verificationErrors.postalCode}>
              <input
                data-verification-field="postalCode"
                type="text"
                required
                value={verificationForm.postalCode}
                onChange={(e) => {
                  setVerificationForm((prev) => ({ ...prev, postalCode: e.target.value }));
                  setVerificationErrors((prev) => ({ ...prev, postalCode: undefined }));
                }}
                className={verificationInputClass('postalCode')}
                placeholder="Enter postal code"
              />
            </VerificationField>
            <VerificationField label="Country" required error={verificationErrors.country}>
              <input
                data-verification-field="country"
                type="text"
                required
                value={verificationForm.country}
                onChange={(e) => {
                  setVerificationForm((prev) => ({ ...prev, country: e.target.value }));
                  setVerificationErrors((prev) => ({ ...prev, country: undefined }));
                }}
                className={verificationInputClass('country')}
                placeholder="Enter country"
              />
            </VerificationField>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <VerificationField label="ID Front" required error={verificationErrors.idFrontUrl}>
              <span data-verification-field="idFrontUrl" className={`block rounded-xl bg-white/90 dark:bg-gray-900/90 px-3.5 py-2.5 text-xs ${verificationErrors.idFrontUrl ? 'border border-red-300 dark:border-red-800 text-red-900 dark:text-red-300' : 'border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100'}`}>
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
              <span className="mt-1 block text-[11px] text-sky-700 dark:text-sky-400">{verificationUploadState.idFront ? 'Uploading...' : verificationForm.idFrontUrl ? 'Uploaded' : 'Not uploaded'}</span>
              </span>
            </VerificationField>
            <VerificationField label="ID Back" required error={verificationErrors.idBackUrl}>
              <span data-verification-field="idBackUrl" className={`block rounded-xl bg-white/90 px-3.5 py-2.5 text-xs ${verificationErrors.idBackUrl ? 'border border-red-300 text-red-900' : 'border border-sky-200 text-sky-900'}`}>
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
              <span className="mt-1 block text-[11px] text-sky-700">{verificationUploadState.idBack ? 'Uploading...' : verificationForm.idBackUrl ? 'Uploaded' : 'Not uploaded'}</span>
              </span>
            </VerificationField>
            <VerificationField label="Selfie with ID" required error={verificationErrors.selfieUrl}>
              <span data-verification-field="selfieUrl" className={`block rounded-xl bg-white/90 px-3.5 py-2.5 text-xs ${verificationErrors.selfieUrl ? 'border border-red-300 text-red-900' : 'border border-sky-200 text-sky-900'}`}>
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
              <span className="mt-1 block text-[11px] text-sky-700">{verificationUploadState.selfie ? 'Uploading...' : verificationForm.selfieUrl ? 'Uploaded' : 'Not uploaded'}</span>
              </span>
            </VerificationField>
          </div>
          <div className="mt-4">
            <motion.button
              type="button"
              onClick={handleSubmitVerificationRequest}
              disabled={isSubmittingVerification || verificationUploadState.idFront || verificationUploadState.idBack || verificationUploadState.selfie}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 dark:bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 dark:hover:bg-sky-800 disabled:opacity-60"
            >
              {isSubmittingVerification ? 'Submitting...' : 'Submit for Verification Approval'}
            </motion.button>
          </div>
          <p className="mt-2 text-xs text-sky-800/80 dark:text-sky-300/60">
            Verification requests are reviewed by the Admin/KYC team.
          </p>
        </motion.div>
      )}

      {isCustomerSession && needsVerification && isVerificationPending && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-center text-sm font-bold">
              i
            </div>
            <div>
              <h3 className="text-base font-bold text-blue-900 dark:text-blue-300">Approval Pending</h3>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                Your verification request has been submitted and is currently under Admin/KYC review.
              </p>
              <div className="mt-2 text-xs text-blue-900/80 dark:text-blue-200/80 space-y-1">
                <p>Reference: <span className="font-semibold">{verification?.reference_no || 'N/A'}</span></p>
                <p>Submitted: <span className="font-semibold">{formatPhilippineDateTime(verification?.submitted_at)}</span></p>
                <p>Status: <span className="font-semibold uppercase">Pending Review</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCustomerSession && isEligibleByPolicy && (
      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 dark:border-slate-700 dark:bg-gray-800 p-5 md:p-6">
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Request Encashment</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Submit payout request from your available earnings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount (PHP)</label>
            <input
              type="number"
              min={1}
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
              placeholder="e.g. 1500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payout Method</label>
            <select
              required
              value={form.methodType}
              onChange={(e) => {
                const methodType = e.target.value as PaymentMethodType;
                setForm((prev) => ({
                  ...prev,
                  methodType,
                  channel: mapMethodTypeToChannel(methodType),
                }));
              }}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
            >
              <option value="gcash">GCash</option>
              <option value="maya">Maya</option>
              <option value="online_banking">Online Banking</option>
              <option value="card">Card</option>
            </select>
          </div>
        </div>

        {(form.methodType === 'gcash' || form.methodType === 'maya') && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Account Name</label>
              <input
                type="text"
                value={form.accountName}
                onChange={(e) => setForm((prev) => ({ ...prev, accountName: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="E-wallet owner name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mobile Number</label>
              <input
                type="text"
                value={form.mobileNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="09xxxxxxxxx"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email (optional)</label>
              <input
                type="email"
                value={form.emailAddress}
                onChange={(e) => setForm((prev) => ({ ...prev, emailAddress: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="you@email.com"
              />
            </div>
          </div>
        )}

        {form.methodType === 'online_banking' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bank Name</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="Bank of example"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bank Code (optional)</label>
              <input
                type="text"
                value={form.bankCode}
                onChange={(e) => setForm((prev) => ({ ...prev, bankCode: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="BPI / BDO / PNB"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Account Name</label>
              <input
                type="text"
                value={form.accountName}
                onChange={(e) => setForm((prev) => ({ ...prev, accountName: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="Account holder name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Account Number</label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="Bank account number"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Account Type</label>
              <select
                value={form.accountType}
                onChange={(e) => setForm((prev) => ({ ...prev, accountType: e.target.value as '' | 'savings' | 'checking' }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
              >
                <option value="">Select type</option>
                <option value="savings">Savings</option>
                <option value="checking">Checking</option>
              </select>
            </div>
          </div>
        )}

        {form.methodType === 'card' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Card Holder Name</label>
              <input
                type="text"
                value={form.cardHolderName}
                onChange={(e) => setForm((prev) => ({ ...prev, cardHolderName: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="Name on card"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Card Brand</label>
              <select
                value={form.cardBrand}
                onChange={(e) => setForm((prev) => ({ ...prev, cardBrand: e.target.value as FormState['cardBrand'] }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
              >
                <option value="">Select brand</option>
                <option value="visa">VISA</option>
                <option value="mastercard">Mastercard</option>
                <option value="jcb">JCB</option>
                <option value="amex">Amex</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last 4 Digits</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={form.cardLast4}
                onChange={(e) => setForm((prev) => ({ ...prev, cardLast4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="1234"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Reference Token (optional)</label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-gray-900 dark:text-white px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                placeholder="Processor token/ref"
              />
            </div>
          </div>
        )}

        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes (optional)</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
            placeholder="Optional notes for finance team"
          />
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !isCustomerSession}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 dark:bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 dark:hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
      )}

      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 dark:bg-gray-800 p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Encashment History</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Track approval and release status for each request.</p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center rounded-lg border border-gray-200 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-sky-200 hover:text-sky-600 disabled:opacity-60"
          >
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {!isCustomerSession && (
          <div className="rounded-xl border border-sky-100 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/30 px-4 py-3 text-sm text-sky-700 dark:text-sky-400">
            You are currently signed in with an admin account. Please sign in as customer/affiliate to view encashment history.
          </div>
        )}

        {isCustomerSession && isError && (
          <div className="rounded-xl border border-red-100 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {(error as { data?: { message?: string } } | undefined)?.data?.message || 'Failed to load encashment history.'}
          </div>
        )}

        {isCustomerSession && !isError && isLoading && (
          <div className="rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-gray-700/30 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Loading requests...</div>
        )}

        {isCustomerSession && !isError && !isLoading && rows.length === 0 && (
          <div className="rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-gray-700/30 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            No encashment requests yet.
          </div>
        )}

        {isCustomerSession && !isError && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-700">
                  <th className="py-2 pr-4 font-semibold">Reference</th>
                  <th className="py-2 pr-4 font-semibold">Gross</th>
                  <th className="py-2 pr-4 font-semibold">Deductions</th>
                  <th className="py-2 pr-4 font-semibold">Net</th>
                  <th className="py-2 pr-4 font-semibold">Channel</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 font-semibold">Invoice</th>
                  <th className="py-2 pr-4 font-semibold">Proof</th>
                  <th className="py-2 pr-0 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 dark:border-slate-700 last:border-b-0">
                    <td className="py-2.5 pr-4 font-medium text-gray-800 dark:text-white">{row.reference_no}</td>
                    <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">{money.format(row.amount)}</td>
                    <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">
                      <div className="text-xs leading-5">
                        <div>Tax: {money.format(row.withholding_tax || 0)}</div>
                        <div>Fee: {money.format(row.processing_fee || 0)}</div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 font-semibold text-gray-800 dark:text-gray-200">{money.format(row.net_amount ?? row.amount)}</td>
                    <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300 uppercase">{row.channel}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle[row.status] || 'bg-gray-50 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700'
                          }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">{row.invoice_no || '-'}</td>
                    <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">
                      {row.proof_url ? (
                        <a
                          href={row.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        >
                          View
                        </a>
                      ) : '-'}
                    </td>
                    <td className="py-2.5 pr-0 text-gray-500 dark:text-gray-400">{row.created_at ? new Date(row.created_at).toLocaleString() : '-'}</td>
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
