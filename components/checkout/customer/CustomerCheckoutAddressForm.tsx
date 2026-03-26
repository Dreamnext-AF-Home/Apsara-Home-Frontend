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
import { CheckoutAddressDraft, FormErrors, GuestForm } from "@/types/CustomerCheckout/types";

interface CustomerCheckoutAddressFormProps {
    form: GuestForm;
    errors: FormErrors;
    setField: (key: keyof GuestForm, value: string) => void;
    isLoggedIn?: boolean;
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
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                : 'border-slate-200 focus:ring-orange-200 focus:border-orange-400'
                }`}
        />
        {error && <p className="text-red-500 text-[11px] mt-1">{error}</p>}
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
                ? 'border-orange-300 bg-linear-to-br from-orange-50 to-amber-50 shadow-md shadow-orange-100'
                : 'border-slate-200 bg-white hover:border-orange-200 hover:shadow-sm'
                }`}
            onClick={() => onSelect(address)}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${active ? 'border-orange-500' : 'border-slate-300'}`}>
                        <AnimatePresence>
                            {active && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    className="h-2.5 w-2.5 rounded-full bg-orange-500"
                                />
                            )}
                        </AnimatePresence>
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-bold text-slate-900">{address.full_name}</p>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                {address.address_type || 'Address'}
                            </span>
                            {address.is_default ? (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                    Default
                                </span>
                            ) : null}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{address.phone}</p>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{address.full_address}</p>
                        {address.notes ? (
                            <p className="text-xs text-slate-400 mt-1.5 italic">Note: {address.notes}</p>
                        ) : null}
                    </div>
                </div>

                {!address.is_default ? (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void onMakeDefault(address); }}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors shrink-0"
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
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 animate-pulse">
            <div className="h-3 w-16 bg-slate-200 rounded-full mb-3" />
            <div className="h-5 w-40 bg-slate-200 rounded-full mb-2" />
            <div className="h-4 w-28 bg-slate-100 rounded-full mb-2" />
            <div className="h-4 w-64 bg-slate-100 rounded-full" />
        </div>
    );
}

export default function CustomerCheckoutAddressForm({
    form,
    errors,
    setField,
    isLoggedIn = false,
}: CustomerCheckoutAddressFormProps) {
    const ph = usePhAddress({ source: 'psgc' });
    const { data, isLoading } = useCustomerAddressesQuery(undefined, { skip: !isLoggedIn });
    const [setDefaultAddress, { isLoading: settingDefault }] = useSetDefaultCustomerAddressMutation();
    const [createAddress, { isLoading: creatingAddress }] = useCreateCustomerAddressMutation();
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalView, setModalView] = useState<'list' | 'add'>('list');
    const [actionError, setActionError] = useState('');
    const [draft, setDraft] = useState<CheckoutAddressDraft>(emptyAddressDraft);

    const addresses = useMemo(() => data?.addresses ?? [], [data?.addresses]);

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
        if (isLoggedIn) return;
        setField('region', ph.address.region);
        setField('province', ph.noProvince ? ph.address.region : ph.address.province);
        setField('city', ph.address.city);
        setField('barangay', ph.address.barangay);
    }, [isLoggedIn, ph.address.region, ph.address.province, ph.address.city, ph.address.barangay, ph.noProvince, setField]);

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
            const apiError = error as { data?: { message?: string; errors?: Record<string, string[]> } };
            const firstValidationMessage = Object.values(apiError?.data?.errors ?? {})[0]?.[0];
            setActionError(firstValidationMessage || apiError?.data?.message || 'Unable to save the new shipping address right now.');
        }
    };

    useEffect(() => {
        if (!isLoggedIn || addresses.length === 0) return;
        const currentSelection = addresses.find(address => address.id === selectedAddressId);
        if (currentSelection) return;
        const nextAddress = addresses.find(address => address.is_default) ?? addresses[0];
        if (nextAddress.id === selectedAddressId) return;
        queueMicrotask(() => { setSelectedAddressId(nextAddress.id); applyAddressToForm(nextAddress); });
    }, [addresses, applyAddressToForm, isLoggedIn, selectedAddressId]);

    useEffect(() => {
        if (!isModalOpen || addresses.length > 0) return;
        queueMicrotask(() => { setModalView('add'); });
    }, [addresses.length, isModalOpen]);

    /* ─── Guest mode ─── */
    if (!isLoggedIn) {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</div>
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
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Region<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <select
                            value={ph.regionCode}
                            onChange={(e) => {
                                const option = e.target.options[e.target.selectedIndex];
                                ph.setRegion(e.target.value, option.text);
                            }}
                            className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all ${errors.region ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-slate-200 focus:ring-orange-200 focus:border-orange-400'}`}
                        >
                            <option value="">- Select Region -</option>
                            {ph.regions.map((region) => (
                                <option key={region.code} value={region.code}>{region.name}</option>
                            ))}
                        </select>
                        {errors.region && <p className="text-red-500 text-[11px] mt-1">{errors.region}</p>}
                    </div>

                    {!ph.noProvince ? (
                        <div data-error-field="province" className="transition-transform duration-200">
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Province<span className="text-red-500 ml-0.5">*</span>
                            </label>
                            <select
                                value={ph.provinceCode}
                                disabled={!ph.regionCode || ph.loadingProvinces}
                                onChange={(e) => {
                                    const option = e.target.options[e.target.selectedIndex];
                                    ph.setProvince(e.target.value, option.text);
                                }}
                                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all ${errors.province ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-slate-200 focus:ring-orange-200 focus:border-orange-400'}`}
                            >
                                <option value="">{ph.loadingProvinces ? 'Loading provinces...' : '- Select Province -'}</option>
                                {ph.provinces.map((province) => (
                                    <option key={province.code} value={province.code}>{province.name}</option>
                                ))}
                            </select>
                            {errors.province && <p className="text-red-500 text-[11px] mt-1">{errors.province}</p>}
                        </div>
                    ) : null}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div data-error-field="city" className="transition-transform duration-200">
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                City / Municipality<span className="text-red-500 ml-0.5">*</span>
                            </label>
                            <select
                                value={ph.cityCode}
                                disabled={ph.noProvince ? !ph.regionCode : (!ph.provinceCode || ph.loadingCities)}
                                onChange={(e) => {
                                    const option = e.target.options[e.target.selectedIndex];
                                    ph.setCity(e.target.value, option.text);
                                }}
                                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all ${errors.city ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-slate-200 focus:ring-orange-200 focus:border-orange-400'}`}
                            >
                                <option value="">{ph.loadingCities || ph.loadingProvinces ? 'Loading cities...' : '- Select City / Municipality -'}</option>
                                {ph.cities.map((city) => (
                                    <option key={city.code} value={city.code}>{city.name}</option>
                                ))}
                            </select>
                            {errors.city && <p className="text-red-500 text-[11px] mt-1">{errors.city}</p>}
                        </div>

                        <div data-error-field="barangay" className="transition-transform duration-200">
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Barangay<span className="text-red-500 ml-0.5">*</span>
                            </label>
                            <select
                                value={ph.address.barangay}
                                disabled={!ph.cityCode || ph.loadingBarangays}
                                onChange={(e) => ph.setBarangay(e.target.value)}
                                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all ${errors.barangay ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-slate-200 focus:ring-orange-200 focus:border-orange-400'}`}
                            >
                                <option value="">{ph.loadingBarangays ? 'Loading barangays...' : '- Select Barangay -'}</option>
                                {ph.barangays.map((barangay) => (
                                    <option key={barangay.code} value={barangay.name}>{barangay.name}</option>
                                ))}
                            </select>
                            {errors.barangay && <p className="text-red-500 text-[11px] mt-1">{errors.barangay}</p>}
                        </div>
                    </div>

                    <Field label="ZIP Code" value={form.zip} onChange={v => setField('zip', v)} placeholder="e.g. 1234" fieldKey="zip" />

                    <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-orange-100 mt-1">
                        <svg className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-orange-700 leading-relaxed">
                            Nationwide delivery available. Delivery time may vary per location.
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
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-slate-50">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2.5">
                                <div className="h-6 w-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</div>
                                Shipping Address
                            </h2>
                            <p className="text-xs text-slate-400 mt-1 ml-8.5">Your default address is preselected.</p>
                        </div>
                        <div className="flex gap-2">
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={openAddressList}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
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
                                className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
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
                            className="rounded-2xl border border-dashed border-orange-200 bg-orange-50 px-4 py-8 text-center"
                        >
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
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
                                    {/* Gradient background */}
                                    <div className="absolute inset-0 bg-linear-to-br from-orange-50 via-amber-50/60 to-white rounded-2xl" />
                                    <div className="absolute inset-0 rounded-2xl border border-orange-200" />

                                    <div className="relative px-5 py-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3 min-w-0">
                                                {/* Pin icon */}
                                                <div className="mt-0.5 h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                                                    <svg className="w-4.5 h-4.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>

                                                <div className="min-w-0">
                                                    {/* Badges */}
                                                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500">Deliver to</span>
                                                        {selectedAddress.is_default && (
                                                            <motion.span
                                                                initial={{ scale: 0.8, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700"
                                                            >
                                                                Default
                                                            </motion.span>
                                                        )}
                                                        <span className="rounded-full border border-orange-100 bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                                            {selectedAddress.address_type || 'Address'}
                                                        </span>
                                                    </div>

                                                    <p className="text-base font-bold text-slate-900 leading-tight">{selectedAddress.full_name}</p>
                                                    <p className="text-sm text-slate-500 mt-0.5">{selectedAddress.phone}</p>
                                                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{selectedAddress.full_address}</p>
                                                    {selectedAddress.notes && (
                                                        <p className="text-xs text-slate-400 mt-1.5 italic">Note: {selectedAddress.notes}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Saved addresses count */}
                                            <div className="rounded-xl border border-orange-100 bg-white/80 px-3 py-2 text-center shrink-0">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 leading-tight">Saved</p>
                                                <p className="text-xl font-bold text-slate-900 leading-tight">{addresses.length}</p>
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
                                className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
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
                            className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col"
                        >
                            {/* Modal header */}
                            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-500">Shipping Address</p>
                                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                                        {modalView === 'list' ? 'Choose an address' : 'Add new address'}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
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
                                    className="h-9 w-9 rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors flex items-center justify-center shrink-0"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Tab switcher */}
                            <div className="px-6 pt-4">
                                <div className="flex gap-0 rounded-xl bg-slate-100 p-1">
                                    {(['list', 'add'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            type="button"
                                            onClick={() => setModalView(tab)}
                                            className={`relative flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${modalView === tab ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {modalView === tab && (
                                                <motion.div
                                                    layoutId="tab-bg"
                                                    className="absolute inset-0 bg-white rounded-lg shadow-sm"
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
                                                <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50 px-4 py-8 text-center">
                                                    <p className="text-sm font-semibold text-slate-800">No saved addresses yet</p>
                                                    <p className="text-xs text-slate-500 mt-1">Add one now so you can use it for this order.</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setModalView('add')}
                                                        className="mt-4 inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
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
                                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Recipient</p>
                                                <p className="mt-1.5 text-sm font-semibold text-slate-900">{form.name || 'No name yet'}</p>
                                                <p className="mt-0.5 text-sm text-slate-500">{form.phone || 'No phone yet'}</p>
                                                <p className="mt-1.5 text-xs text-slate-400">Uses the name and phone entered in your contact info.</p>
                                            </div>

                                            <Field label="Street / House No." value={draft.address} onChange={v => updateDraft('address', v)} placeholder="Street, building, house no." required />

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Region<span className="text-red-500 ml-0.5">*</span></label>
                                                <select
                                                    value={ph.regionCode}
                                                    onChange={(e) => {
                                                        const option = e.target.options[e.target.selectedIndex];
                                                        ph.setRegion(e.target.value, option.text);
                                                        setDraft(prev => ({ ...prev, region: option.text, province: '', city: '', barangay: '' }));
                                                    }}
                                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                                                >
                                                    <option value="">- Select Region -</option>
                                                    {ph.regions.map(region => (
                                                        <option key={region.code} value={region.code}>{region.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {!ph.noProvince ? (
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Province<span className="text-red-500 ml-0.5">*</span></label>
                                                    <select
                                                        value={ph.provinceCode}
                                                        disabled={!ph.regionCode || ph.loadingProvinces}
                                                        onChange={(e) => {
                                                            const option = e.target.options[e.target.selectedIndex];
                                                            ph.setProvince(e.target.value, option.text);
                                                            setDraft(prev => ({ ...prev, province: option.text, city: '', barangay: '' }));
                                                        }}
                                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 disabled:opacity-60"
                                                    >
                                                        <option value="">{ph.loadingProvinces ? 'Loading provinces...' : '- Select Province -'}</option>
                                                        {ph.provinces.map(province => (
                                                            <option key={province.code} value={province.code}>{province.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : null}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">City / Municipality<span className="text-red-500 ml-0.5">*</span></label>
                                                    <select
                                                        value={ph.cityCode}
                                                        disabled={ph.noProvince ? !ph.regionCode : (!ph.provinceCode || ph.loadingCities)}
                                                        onChange={(e) => {
                                                            const option = e.target.options[e.target.selectedIndex];
                                                            ph.setCity(e.target.value, option.text);
                                                            setDraft(prev => ({ ...prev, city: option.text, barangay: '' }));
                                                        }}
                                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 disabled:opacity-60"
                                                    >
                                                        <option value="">{ph.loadingCities || ph.loadingProvinces ? 'Loading cities...' : '- Select City / Municipality -'}</option>
                                                        {ph.cities.map(city => (
                                                            <option key={city.code} value={city.code}>{city.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Barangay<span className="text-red-500 ml-0.5">*</span></label>
                                                    <select
                                                        value={draft.barangay}
                                                        disabled={!ph.cityCode || ph.loadingBarangays}
                                                        onChange={(e) => {
                                                            ph.setBarangay(e.target.value);
                                                            setDraft(prev => ({ ...prev, barangay: e.target.value }));
                                                        }}
                                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 disabled:opacity-60"
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

                                            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={draft.set_default}
                                                    onChange={(e) => updateDraft('set_default', e.target.checked)}
                                                    className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-200"
                                                />
                                                <span className="text-sm text-slate-700 font-medium">Set as my default shipping address</span>
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
                                            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                                        >
                                            {actionError}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Modal footer */}
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5">
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 font-semibold hover:bg-white transition-colors"
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
                                        className="px-5 py-2.5 rounded-xl bg-orange-500 text-sm text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
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
