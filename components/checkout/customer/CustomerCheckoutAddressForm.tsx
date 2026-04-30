'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePhAddress } from "@/hooks/usePhAddress";
import {
    useCreateCustomerAddressMutation,
    useCustomerAddressesQuery,
    useSetDefaultCustomerAddressMutation,
    type CustomerAddress,
} from "@/store/api/userApi";
import type { ShippingRate } from "@/store/api/shippingRatesApi";
import { CheckoutAddressDraft, FormErrors, GuestForm } from "@/types/CustomerCheckout/types";
import { MapPin, Plus, X, AlertCircle, Check } from 'lucide-react';

interface CustomerCheckoutAddressFormProps {
    form: GuestForm;
    errors: FormErrors;
    setField: (key: keyof GuestForm, value: string) => void;
    isLoggedIn?: boolean;
    shippingRates?: ShippingRate[];
    restrictToShippingRates?: boolean;
}

const emptyAddressDraft: CheckoutAddressDraft = {
    full_name: '',
    phone: '',
    address: '',
    region: '',
    province: '',
    city: '',
    barangay: '',
    zip_code: '',
    address_type: 'Home',
    notes: '',
    set_default: true,
};

const normalizeLocationKey = (value: string) =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\([^)]*\)/g, '')
        .replace(/\bcity of\b/g, '')
        .replace(/\b(city|municipality|province)\b/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');

const PROVINCE_ALIASES: Record<string, string> = {
    ncr: 'manila',
    'metro manila': 'manila',
    'national capital region': 'manila',
    'city of manila': 'manila',
};

const CITY_ALIASES: Record<string, string> = {
    'san jose del monte': 'sjdm bulacan',
    'san jose del monte bulacan': 'sjdm bulacan',
    'las pinas': 'las pinas',
    'general mariano alvarez': 'general mariano alvarez',
};

const normalizeProvinceKey = (value: string) =>
    PROVINCE_ALIASES[normalizeLocationKey(value)] ?? normalizeLocationKey(value);

const normalizeCityKey = (value: string) =>
    CITY_ALIASES[normalizeLocationKey(value)] ?? normalizeLocationKey(value);

const regionSupportsProvince = (regionName: string, supportedProvinceKeys: Set<string>) => {
    const region = normalizeLocationKey(regionName);

    if (supportedProvinceKeys.has('manila') && (region.includes('national capital') || region === 'ncr')) return true;
    if ((supportedProvinceKeys.has('bulacan') || supportedProvinceKeys.has('pampanga')) && region.includes('central luzon')) return true;
    if (
        (supportedProvinceKeys.has('rizal') ||
            supportedProvinceKeys.has('cavite') ||
            supportedProvinceKeys.has('laguna') ||
            supportedProvinceKeys.has('batangas')) &&
        (region.includes('calabarzon') || region.includes('region iv a'))
    ) {
        return true;
    }

    return false;
};

const Field = ({ label, value, onChange, placeholder, required = false, error, fieldKey, disabled = false }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    required?: boolean;
    error?: string;
    fieldKey?: keyof GuestForm | string;
    disabled?: boolean;
}) => (
    <div data-error-field={fieldKey} className="transition-transform duration-200">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${error ? 'border-red-300 dark:border-red-600 focus:ring-red-200 dark:focus:ring-red-900 focus:border-red-400 dark:focus:border-red-500'
                : 'border-slate-200 dark:border-slate-700 focus:ring-sky-200 dark:focus:ring-sky-900 focus:border-sky-400 dark:focus:border-sky-500'
                }`}
        />
        {error && <p className="text-red-500 dark:text-red-400 text-[11px] mt-1">{error}</p>}
    </div>
);

function AddressCard({
    address,
    active,
    settingDefault,
    onSelect,
    onMakeDefault,
    index,
}: {
    address: CustomerAddress;
    active: boolean;
    settingDefault: boolean;
    onSelect: (address: CustomerAddress) => void;
    onMakeDefault: (address: CustomerAddress) => Promise<void>;
    index: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.06, ease: 'easeOut' }}
            whileHover={{ y: -1 }}
            className={`w-full rounded-2xl border px-4 py-4 text-left transition-all cursor-pointer ${active
                ? 'border-sky-300 dark:border-sky-600 bg-sky-50 dark:bg-sky-900/20 shadow-md shadow-sky-100 dark:shadow-none'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-sky-200 dark:hover:border-sky-700 hover:'
                }`}
            onClick={() => onSelect(address)}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${active ? 'border-sky-500 dark:border-sky-400' : 'border-slate-300 dark:border-slate-600'}`}>
                        <AnimatePresence>
                            {active && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    className="h-2.5 w-2.5 rounded-full bg-sky-500"
                                />
                            )}
                        </AnimatePresence>
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{address.full_name}</p>
                            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                {address.address_type || 'Address'}
                            </span>
                            {address.is_default ? (
                                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                                    Default
                                </span>
                            ) : null}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{address.phone}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{address.full_address}</p>
                        {address.notes ? (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 italic">Note: {address.notes}</p>
                        ) : null}
                    </div>
                </div>

                {!address.is_default ? (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void onMakeDefault(address); }}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shrink-0"
                    >
                        {settingDefault ? 'Saving...' : 'Make default'}
                    </button>
                ) : null}
            </div>
        </motion.div>
    );
}

function SkeletonCard() {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-5 animate-pulse">
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded-full mb-3" />
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded-full mb-2" />
            <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded-full mb-2" />
            <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800 rounded-full" />
        </div>
    );
}

export default function CustomerCheckoutAddressForm({
    form,
    errors,
    setField,
    isLoggedIn = false,
    shippingRates = [],
    restrictToShippingRates = false,
}: CustomerCheckoutAddressFormProps) {
    const ph = usePhAddress({ source: 'auto' });
    const { data, isLoading, error: addressesError } = useCustomerAddressesQuery(undefined, { skip: !isLoggedIn });
    const [setDefaultAddress, { isLoading: settingDefault }] = useSetDefaultCustomerAddressMutation();
    const [createAddress, { isLoading: creatingAddress }] = useCreateCustomerAddressMutation();
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalView, setModalView] = useState<'list' | 'add'>('list');
    const [actionError, setActionError] = useState('');
    const [draft, setDraft] = useState<CheckoutAddressDraft>(emptyAddressDraft);
    const [forceGuestMode, setForceGuestMode] = useState(false);

    const hasUnauthorizedAddressAccess = useMemo(() => {
        const status = (addressesError as { status?: number } | undefined)?.status;
        return status === 401;
    }, [addressesError]);

    const effectiveLoggedIn = isLoggedIn && !forceGuestMode && !hasUnauthorizedAddressAccess;

    const addresses = useMemo(() => data?.addresses ?? [], [data?.addresses]);
    const activeShippingRates = useMemo(() => shippingRates.filter((rate) => rate.status), [shippingRates]);
    const shouldRestrictToShippingRates = restrictToShippingRates && activeShippingRates.length > 0;
    const supportedProvinceKeys = useMemo(
        () => new Set(activeShippingRates.map((rate) => normalizeProvinceKey(rate.provinceKey || rate.province))),
        [activeShippingRates],
    );
    const supportedRegions = useMemo(
        () => shouldRestrictToShippingRates
            ? ph.regions.filter((region) => regionSupportsProvince(region.name, supportedProvinceKeys))
            : ph.regions,
        [ph.regions, shouldRestrictToShippingRates, supportedProvinceKeys],
    );
    const supportedProvinces = useMemo(
        () => shouldRestrictToShippingRates
            ? ph.provinces.filter((province) => supportedProvinceKeys.has(normalizeProvinceKey(province.name)))
            : ph.provinces,
        [ph.provinces, shouldRestrictToShippingRates, supportedProvinceKeys],
    );
    const supportedCities = useMemo(() => {
        if (!shouldRestrictToShippingRates) return ph.cities;

        const selectedProvinceKey = ph.noProvince
            ? normalizeProvinceKey(ph.address.region)
            : normalizeProvinceKey(ph.address.province);

        return ph.cities.filter((city) =>
            activeShippingRates.some((rate) => {
                const rateProvinceKey = normalizeProvinceKey(rate.provinceKey || rate.province);
                const rateCityKey = normalizeCityKey(rate.cityKey || rate.city);

                return rateProvinceKey === selectedProvinceKey && rateCityKey === normalizeCityKey(city.name);
            }),
        );
    }, [activeShippingRates, ph.address.province, ph.address.region, ph.cities, ph.noProvince, shouldRestrictToShippingRates]);

    const applyAddressToForm = useCallback((address: CustomerAddress) => {
        setField('name', address.full_name);
        setField('phone', address.phone);
        setField('address', address.address);
        setField('region', address.region);
        setField('province', address.province);
        setField('city', address.city);
        setField('barangay', address.barangay);
        setField('zip', address.zip_code ?? '');
    }, [setField]);

    useEffect(() => {
        if (effectiveLoggedIn) return;
        setField('region', ph.address.region);
        setField('province', ph.noProvince ? ph.address.region : ph.address.province);
        setField('city', ph.address.city);
        setField('barangay', ph.address.barangay);
    }, [effectiveLoggedIn, ph.address.region, ph.address.province, ph.address.city, ph.address.barangay, ph.noProvince, setField]);

    const selectedAddress = useMemo(
        () => addresses.find(address => address.id === selectedAddressId) ?? null,
        [addresses, selectedAddressId]
    );

    const updateDraft = (key: keyof CheckoutAddressDraft, value: string | boolean) => {
        setDraft(prev => ({ ...prev, [key]: value }));
    };

    const bootstrapDraft = () => {
        ph.reset();
        setActionError('');
        setDraft({ ...emptyAddressDraft, full_name: form.name, phone: form.phone });
    };

    const openAddressList = () => { bootstrapDraft(); setModalView('list'); setIsModalOpen(true); };
    const openAddAddress = () => { bootstrapDraft(); setModalView('add'); setIsModalOpen(true); };

    const handleSelect = (address: CustomerAddress) => {
        setSelectedAddressId(address.id);
        applyAddressToForm(address);
        setActionError('');
        setIsModalOpen(false);
    };

    const handleMakeDefault = async (address: CustomerAddress) => {
        try {
            await setDefaultAddress(address.id).unwrap();
            setSelectedAddressId(address.id);
            applyAddressToForm(address);
            setActionError('');
        } catch (error) {
            const status = (error as { status?: number; data?: { message?: string } })?.status;
            if (status === 401) {
                setForceGuestMode(true);
                setIsModalOpen(false);
                setActionError('');
                return;
            }
            const message = (error as { data?: { message?: string } })?.data?.message;
            setActionError(message || 'Unable to set that address as default right now.');
        }
    };

    const handleCreateAddress = async () => {
        const normalizedProvince = draft.province.trim() || draft.region.trim();
        const normalizedFullName = form.name.trim() || draft.full_name.trim();
        const normalizedPhone = form.phone.trim() || draft.phone.trim();

        if (!normalizedFullName || !normalizedPhone || !draft.address.trim() || !draft.region.trim() || !normalizedProvince || !draft.city.trim() || !draft.barangay.trim()) {
            setActionError('Complete the required shipping address fields first.');
            return;
        }

        try {
            const response = await createAddress({
                full_name: normalizedFullName,
                phone: normalizedPhone,
                address: draft.address.trim(),
                region: draft.region.trim(),
                province: normalizedProvince,
                city: draft.city.trim(),
                barangay: draft.barangay.trim(),
                zip_code: draft.zip_code.trim(),
                address_type: draft.address_type.trim() || 'Home',
                notes: draft.notes.trim(),
                set_default: draft.set_default,
            }).unwrap();

            setSelectedAddressId(response.address.id);
            applyAddressToForm(response.address);
            setActionError('');
            setIsModalOpen(false);
        } catch (error) {
            const status = (error as { status?: number; data?: { message?: string; errors?: Record<string, string[]> } })?.status;
            if (status === 401) {
                setForceGuestMode(true);
                setIsModalOpen(false);
                setActionError('');
                return;
            }
            const apiError = error as { data?: { message?: string; errors?: Record<string, string[]> } };
            const firstValidationMessage = Object.values(apiError?.data?.errors ?? {})[0]?.[0];
            setActionError(firstValidationMessage || apiError?.data?.message || 'Unable to save the new shipping address right now.');
        }
    };

    useEffect(() => {
        if (!effectiveLoggedIn || addresses.length === 0) return;
        const currentSelection = addresses.find(address => address.id === selectedAddressId);
        if (currentSelection) return;
        const nextAddress = addresses.find(address => address.is_default) ?? addresses[0];
        if (nextAddress.id === selectedAddressId) return;
        queueMicrotask(() => { setSelectedAddressId(nextAddress.id); applyAddressToForm(nextAddress); });
    }, [addresses, applyAddressToForm, effectiveLoggedIn, selectedAddressId]);

    useEffect(() => {
        if (!isModalOpen || addresses.length > 0) return;
        queueMicrotask(() => { setModalView('add'); });
    }, [addresses.length, isModalOpen]);

    /* ─── Guest mode ─── */
    if (!effectiveLoggedIn) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700  p-6">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</div>
                    Delivery Address
                </h2>
                <div className="space-y-3">
                    <Field
                        label="Street / House No."
                        value={form.address}
                        onChange={v => setField('address', v)}
                        placeholder="e.g. 123 Rizal St."
                        required
                        error={errors.address}
                        fieldKey="address"
                    />
                    <div data-error-field="region" className="transition-transform duration-200">
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                            Region<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <select
                            value={ph.regionCode}
                            onChange={(e) => {
                                const option = e.target.options[e.target.selectedIndex];
                                ph.setRegion(e.target.value, option.text);
                            }}
                            className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all ${errors.region ? 'border-red-300 dark:border-red-600 focus:ring-red-200 dark:focus:ring-red-900 focus:border-red-400 dark:focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-sky-200 dark:focus:ring-sky-900 focus:border-sky-400 dark:focus:border-sky-500'}`}
                        >
                            <option value="">- Select Region -</option>
                            {supportedRegions.map((region) => (
                                <option key={region.code} value={region.code}>{region.name}</option>
                            ))}
                        </select>
                        {errors.region && <p className="text-red-500 dark:text-red-400 text-[11px] mt-1">{errors.region}</p>}
                    </div>

                    {!ph.noProvince ? (
                        <div data-error-field="province" className="transition-transform duration-200">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                                Province<span className="text-red-500 ml-0.5">*</span>
                            </label>
                            <select
                                value={ph.provinceCode}
                                disabled={!ph.regionCode || ph.loadingProvinces}
                                onChange={(e) => {
                                    const option = e.target.options[e.target.selectedIndex];
                                    ph.setProvince(e.target.value, option.text);
                                }}
                                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all disabled:opacity-60 ${errors.province ? 'border-red-300 dark:border-red-600 focus:ring-red-200 dark:focus:ring-red-900 focus:border-red-400 dark:focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-sky-200 dark:focus:ring-sky-900 focus:border-sky-400 dark:focus:border-sky-500'}`}
                            >
                                <option value="">{ph.loadingProvinces ? 'Loading provinces...' : '- Select Province -'}</option>
                                {supportedProvinces.map((province) => (
                                    <option key={province.code} value={province.code}>{province.name}</option>
                                ))}
                            </select>
                            {errors.province && <p className="text-red-500 dark:text-red-400 text-[11px] mt-1">{errors.province}</p>}
                        </div>
                    ) : null}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div data-error-field="city" className="transition-transform duration-200">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                                City / Municipality<span className="text-red-500 ml-0.5">*</span>
                            </label>
                            <select
                                value={ph.cityCode}
                                disabled={ph.noProvince ? !ph.regionCode : (!ph.provinceCode || ph.loadingCities)}
                                onChange={(e) => {
                                    const option = e.target.options[e.target.selectedIndex];
                                    ph.setCity(e.target.value, option.text);
                                }}
                                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all disabled:opacity-60 ${errors.city ? 'border-red-300 dark:border-red-600 focus:ring-red-200 dark:focus:ring-red-900 focus:border-red-400 dark:focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-sky-200 dark:focus:ring-sky-900 focus:border-sky-400 dark:focus:border-sky-500'}`}
                            >
                                <option value="">{ph.loadingCities || ph.loadingProvinces ? 'Loading cities...' : '- Select City / Municipality -'}</option>
                                {supportedCities.map((city) => (
                                    <option key={city.code} value={city.code}>{city.name}</option>
                                ))}
                            </select>
                            {errors.city && <p className="text-red-500 dark:text-red-400 text-[11px] mt-1">{errors.city}</p>}
                        </div>

                        <div data-error-field="barangay" className="transition-transform duration-200">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                                Barangay<span className="text-red-500 ml-0.5">*</span>
                            </label>
                            <select
                                value={ph.address.barangay}
                                disabled={!ph.cityCode || ph.loadingBarangays}
                                onChange={(e) => ph.setBarangay(e.target.value)}
                                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all disabled:opacity-60 ${errors.barangay ? 'border-red-300 dark:border-red-600 focus:ring-red-200 dark:focus:ring-red-900 focus:border-red-400 dark:focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-sky-200 dark:focus:ring-sky-900 focus:border-sky-400 dark:focus:border-sky-500'}`}
                            >
                                <option value="">{ph.loadingBarangays ? 'Loading barangays...' : '- Select Barangay -'}</option>
                                {ph.barangays.map((barangay) => (
                                    <option key={barangay.code} value={barangay.name}>{barangay.name}</option>
                                ))}
                            </select>
                            {errors.barangay && <p className="text-red-500 dark:text-red-400 text-[11px] mt-1">{errors.barangay}</p>}
                        </div>
                    </div>

                    <Field label="ZIP Code" value={form.zip} onChange={v => setField('zip', v)} placeholder="e.g. 1234" fieldKey="zip" />

                    <div className="flex items-start gap-2.5 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-100 dark:border-sky-900/30 mt-1">
                        <AlertCircle className="w-4 h-4 text-sky-500 dark:text-sky-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
                            {shouldRestrictToShippingRates
                                ? 'Only admin-configured delivery locations are available for manual checkout.'
                                : 'Delivery coverage is still being configured. You can still enter your address while shipping rates are being set up.'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Logged-in mode ─── */
    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700  overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
                                <div className="h-6 w-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</div>
                                Shipping Address
                            </h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 ml-8.5">Your default address is preselected.</p>
                        </div>
                        <div className="flex gap-2">
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={openAddressList}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                                Change
                            </motion.button>
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={openAddAddress}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 px-3.5 py-2 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add new
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Address display */}
                <div className="p-5">
                    {isLoading ? (
                        <SkeletonCard />
                    ) : addresses.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-2xl border border-dashed border-sky-200 bg-sky-50 px-4 py-8 text-center"
                        >
                            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-3">
                                <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <p className="text-sm font-semibold text-slate-800">No saved addresses yet</p>
                            <p className="text-xs text-slate-500 mt-1">Add your first shipping address to continue.</p>
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={openAddAddress}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
                            >
                                Add shipping address
                            </motion.button>
                        </motion.div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {selectedAddress ? (
                                <motion.div
                                    key={selectedAddress.id}
                                    initial={{ opacity: 0, y: 8, scale: 0.99 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.99 }}
                                    transition={{ duration: 0.28, ease: 'easeOut' }}
                                    className="relative rounded-2xl overflow-hidden"
                                >
                                    {/* Solid background */}
                                    <div className="absolute inset-0 bg-sky-50 dark:bg-sky-900/20 rounded-2xl" />
                                    <div className="absolute inset-0 rounded-2xl border border-sky-200 dark:border-sky-800" />

                                    <div className="relative px-5 py-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3 min-w-0">
                                                {/* Pin icon */}
                                                <div className="mt-0.5 h-9 w-9 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center shrink-0">
                                                    <MapPin className="w-4.5 h-4.5 text-sky-500 dark:text-sky-400" />
                                                </div>

                                                <div className="min-w-0">
                                                    {/* Badges */}
                                                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-500 dark:text-sky-400">Deliver to</span>
                                                        {selectedAddress.is_default && (
                                                            <motion.span
                                                                initial={{ scale: 0.8, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300"
                                                            >
                                                                Default
                                                            </motion.span>
                                                        )}
                                                        <span className="rounded-full border border-sky-100 dark:border-sky-900 bg-white dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                            {selectedAddress.address_type || 'Address'}
                                                        </span>
                                                    </div>

                                                    <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">{selectedAddress.full_name}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{selectedAddress.phone}</p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{selectedAddress.full_address}</p>
                                                    {selectedAddress.notes && (
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 italic">Note: {selectedAddress.notes}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Saved addresses count */}
                                            <div className="rounded-xl border border-sky-100 dark:border-sky-900 bg-white dark:bg-slate-800 px-3 py-2 text-center shrink-0">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 leading-tight">Saved</p>
                                                <p className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{addresses.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    )}

                    <AnimatePresence>
                        {actionError && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="mt-4 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400"
                            >
                                {actionError}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
                        style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)' }}
                        onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 40, scale: 0.97 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden max-h-[92vh] flex flex-col"
                        >
                            {/* Modal header */}
                            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200 dark:border-slate-700">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-sky-500 dark:text-sky-400">Shipping Address</p>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                                        {modalView === 'list' ? 'Choose an address' : 'Add new address'}
                                    </h3>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                        {modalView === 'list'
                                            ? 'Pick from your saved addresses or add a new one.'
                                            : 'This will be saved to your address book.'}
                                    </p>
                                </div>
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsModalOpen(false)}
                                    className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-colors flex items-center justify-center shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>

                            {/* Tab switcher */}
                            <div className="px-6 pt-4">
                                <div className="flex gap-0 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                                    {(['list', 'add'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            type="button"
                                            onClick={() => setModalView(tab)}
                                            className={`relative flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${modalView === tab ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        >
                                            {modalView === tab && (
                                                <motion.div
                                                    layoutId="tab-bg"
                                                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg "
                                                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                                />
                                            )}
                                            <span className="relative z-10">
                                                {tab === 'list' ? `Saved (${addresses.length})` : '+ Add new'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Modal content */}
                            <div className="overflow-y-auto px-6 py-4 space-y-3 flex-1">
                                <AnimatePresence mode="wait">
                                    {modalView === 'list' ? (
                                        <motion.div
                                            key="list"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {addresses.length === 0 ? (
                                                <div className="rounded-2xl border border-dashed border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 px-4 py-8 text-center">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">No saved addresses yet</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add one now so you can use it for this order.</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setModalView('add')}
                                                        className="mt-4 inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
                                                    >
                                                        Add address
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2.5">
                                                    {addresses.map((address, i) => (
                                                        <AddressCard
                                                            key={address.id}
                                                            address={address}
                                                            active={address.id === selectedAddressId}
                                                            settingDefault={settingDefault}
                                                            onSelect={handleSelect}
                                                            onMakeDefault={handleMakeDefault}
                                                            index={i}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="add"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-3"
                                        >
                                            <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Recipient</p>
                                                <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-white">{form.name || 'No name yet'}</p>
                                                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{form.phone || 'No phone yet'}</p>
                                                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">Uses the name and phone entered in your contact info.</p>
                                            </div>

                                            <Field label="Street / House No." value={draft.address} onChange={v => updateDraft('address', v)} placeholder="Street, building, house no." required />

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Region<span className="text-red-500 ml-0.5">*</span></label>
                                                <select
                                                    value={ph.regionCode}
                                                    onChange={(e) => {
                                                        const option = e.target.options[e.target.selectedIndex];
                                                        ph.setRegion(e.target.value, option.text);
                                                        setDraft(prev => ({ ...prev, region: option.text, province: '', city: '', barangay: '' }));
                                                    }}
                                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900 focus:border-sky-400 dark:focus:border-sky-500"
                                                >
                                                    <option value="">- Select Region -</option>
                                                    {supportedRegions.map(region => (
                                                        <option key={region.code} value={region.code}>{region.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {!ph.noProvince ? (
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Province<span className="text-red-500 ml-0.5">*</span></label>
                                                    <select
                                                        value={ph.provinceCode}
                                                        disabled={!ph.regionCode || ph.loadingProvinces}
                                                        onChange={(e) => {
                                                            const option = e.target.options[e.target.selectedIndex];
                                                            ph.setProvince(e.target.value, option.text);
                                                            setDraft(prev => ({ ...prev, province: option.text, city: '', barangay: '' }));
                                                        }}
                                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900 focus:border-sky-400 dark:focus:border-sky-500 disabled:opacity-60"
                                                    >
                                                        <option value="">{ph.loadingProvinces ? 'Loading provinces...' : '- Select Province -'}</option>
                                                        {supportedProvinces.map(province => (
                                                            <option key={province.code} value={province.code}>{province.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : null}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">City / Municipality<span className="text-red-500 ml-0.5">*</span></label>
                                                    <select
                                                        value={ph.cityCode}
                                                        disabled={ph.noProvince ? !ph.regionCode : (!ph.provinceCode || ph.loadingCities)}
                                                        onChange={(e) => {
                                                            const option = e.target.options[e.target.selectedIndex];
                                                            ph.setCity(e.target.value, option.text);
                                                            setDraft(prev => ({ ...prev, city: option.text, barangay: '' }));
                                                        }}
                                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900 focus:border-sky-400 dark:focus:border-sky-500 disabled:opacity-60"
                                                    >
                                                        <option value="">{ph.loadingCities || ph.loadingProvinces ? 'Loading cities...' : '- Select City / Municipality -'}</option>
                                                        {supportedCities.map(city => (
                                                            <option key={city.code} value={city.code}>{city.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Barangay<span className="text-red-500 ml-0.5">*</span></label>
                                                    <select
                                                        value={draft.barangay}
                                                        disabled={!ph.cityCode || ph.loadingBarangays}
                                                        onChange={(e) => {
                                                            ph.setBarangay(e.target.value);
                                                            setDraft(prev => ({ ...prev, barangay: e.target.value }));
                                                        }}
                                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900 focus:border-sky-400 dark:focus:border-sky-500 disabled:opacity-60"
                                                    >
                                                        <option value="">{ph.loadingBarangays ? 'Loading barangays...' : '- Select Barangay -'}</option>
                                                        {ph.barangays.map(barangay => (
                                                            <option key={barangay.code} value={barangay.name}>{barangay.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Field label="ZIP Code" value={draft.zip_code} onChange={v => updateDraft('zip_code', v)} placeholder="e.g. 1100" />
                                                <Field label="Address Type" value={draft.address_type} onChange={v => updateDraft('address_type', v)} placeholder="Home / Office" />
                                            </div>

                                            <Field label="Notes" value={draft.notes} onChange={v => updateDraft('notes', v)} placeholder="Landmark or delivery notes" />

                                            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={draft.set_default}
                                                    onChange={(e) => updateDraft('set_default', e.target.checked)}
                                                    className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-200"
                                                />
                                                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Set as my default shipping address</span>
                                            </label>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence>
                                    {actionError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400"
                                        >
                                            {actionError}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Modal footer */}
                            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-end gap-2.5">
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 font-semibold hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </motion.button>
                                {modalView === 'add' && (
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => void handleCreateAddress()}
                                        disabled={creatingAddress}
                                        className="px-5 py-2.5 rounded-xl bg-sky-500 text-sm text-white font-semibold hover:bg-sky-600 transition-colors disabled:opacity-60"
                                    >
                                        {creatingAddress ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Saving...
                                            </span>
                                        ) : 'Save Address'}
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
