'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
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
}: {
    address: CustomerAddress;
    active: boolean;
    settingDefault: boolean;
    onSelect: (address: CustomerAddress) => void;
    onMakeDefault: (address: CustomerAddress) => Promise<void>;
}) {
    return (
        <div
            className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${active
                ? 'border-orange-300 bg-orange-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/50'
                }`}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <button
                        type="button"
                        onClick={() => onSelect(address)}
                        className="flex items-start gap-3 text-left flex-1"
                    >
                        <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center ${active ? 'border-orange-500' : 'border-slate-300'}`}>
                            {active ? <div className="h-2.5 w-2.5 rounded-full bg-orange-500" /> : null}
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-slate-900">{address.full_name}</p>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                    {address.address_type || 'Address'}
                                </span>
                                {address.is_default ? (
                                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                        Default
                                    </span>
                                ) : null}
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{address.phone}</p>
                            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{address.full_address}</p>
                            {address.notes ? (
                                <p className="text-xs text-slate-500 mt-2">Note: {address.notes}</p>
                            ) : null}
                        </div>
                    </button>
                </div>

                {!address.is_default ? (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            void onMakeDefault(address);
                        }}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white"
                    >
                        {settingDefault ? 'Saving...' : 'Make default'}
                    </button>
                ) : null}
            </div>
        </div>
    );
}

export default function CustomerCheckoutAddressForm({
    form,
    errors,
    setField,
    isLoggedIn = false,
}: CustomerCheckoutAddressFormProps) {
    const ph = usePhAddress();
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

    useEffect(() => {
        if (!isLoggedIn || addresses.length === 0) return;

        const currentSelection = addresses.find(address => address.id === selectedAddressId);
        if (currentSelection) return;

        const nextAddress = addresses.find(address => address.is_default) ?? addresses[0];
        setSelectedAddressId(nextAddress.id);
        applyAddressToForm(nextAddress);
    }, [addresses, applyAddressToForm, isLoggedIn, selectedAddressId]);

    useEffect(() => {
        if (!isModalOpen) return;

        ph.reset();
        setActionError('');
        setDraft({
            ...emptyAddressDraft,
            full_name: form.name,
            phone: form.phone,
        });
    }, [form.name, form.phone, isModalOpen, ph]);

    useEffect(() => {
        if (!isModalOpen || modalView !== 'add') return;

        setDraft(prev => ({
            ...prev,
            region: ph.address.region,
            province: ph.noProvince ? ph.address.region : ph.address.province,
            city: ph.address.city,
            barangay: ph.address.barangay,
        }));
    }, [isModalOpen, modalView, ph.address.region, ph.address.province, ph.address.city, ph.address.barangay, ph.noProvince]);

    useEffect(() => {
        if (!isModalOpen) return;
        if (addresses.length === 0) {
            setModalView('add');
        }
    }, [addresses.length, isModalOpen]);

    const selectedAddress = useMemo(
        () => addresses.find(address => address.id === selectedAddressId) ?? null,
        [addresses, selectedAddressId]
    );

    const updateDraft = (key: keyof CheckoutAddressDraft, value: string | boolean) => {
        setDraft(prev => ({ ...prev, [key]: value }));
    };

    const openAddressList = () => {
        setModalView('list');
        setIsModalOpen(true);
    };

    const openAddAddress = () => {
        setModalView('add');
        setIsModalOpen(true);
    };

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
        } catch {
            setActionError('Unable to set that address as default right now.');
        }
    };

    const handleCreateAddress = async () => {
        if (!draft.full_name.trim() || !draft.phone.trim() || !draft.address.trim() || !draft.region.trim() || !draft.province.trim() || !draft.city.trim() || !draft.barangay.trim()) {
            setActionError('Complete the required shipping address fields first.');
            return;
        }

        try {
            const response = await createAddress({
                full_name: draft.full_name.trim(),
                phone: draft.phone.trim(),
                address: draft.address.trim(),
                region: draft.region.trim(),
                province: draft.province.trim(),
                city: draft.city.trim(),
                barangay: draft.barangay.trim(),
                zip_code: draft.zip_code.trim(),
                address_type: draft.address_type.trim() || 'Home',
                notes: draft.notes.trim(),
                set_default: draft.set_default,
            }).unwrap();

            setSelectedAddressId(response.address.id);
            applyAddressToForm(response.address);
            setIsModalOpen(false);
        } catch {
            setActionError('Unable to save the new shipping address right now.');
        }
    };

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
                            className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all ${errors.region ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                                : 'border-slate-200 focus:ring-orange-200 focus:border-orange-400'
                                }`}
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
                                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all ${errors.province ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                                    : 'border-slate-200 focus:ring-orange-200 focus:border-orange-400'
                                    }`}
                            >
                                <option value="">
                                    {ph.loadingProvinces ? 'Loading provinces...' : '- Select Province -'}
                                </option>
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
                                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all ${errors.city ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                                    : 'border-slate-200 focus:ring-orange-200 focus:border-orange-400'
                                    }`}
                            >
                                <option value="">
                                    {ph.loadingCities || ph.loadingProvinces ? 'Loading cities...' : '- Select City / Municipality -'}
                                </option>
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
                                value={form.barangay}
                                disabled={!ph.cityCode || ph.loadingBarangays}
                                onChange={(e) => ph.setBarangay(e.target.value)}
                                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all ${errors.barangay ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                                    : 'border-slate-200 focus:ring-orange-200 focus:border-orange-400'
                                    }`}
                            >
                                <option value="">
                                    {ph.loadingBarangays ? 'Loading barangays...' : '- Select Barangay -'}
                                </option>
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

    return (
        <>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2.5">
                            <div className="h-6 w-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</div>
                            Shipping Address
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Your default address is preselected. You can switch or add another one here.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={openAddressList}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Change address
                        </button>
                        <button
                            type="button"
                            onClick={openAddAddress}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-100 transition-colors"
                        >
                            <span className="text-base leading-none">+</span>
                            Add new
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        Loading your saved addresses...
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50 px-4 py-8 text-center">
                        <p className="text-sm font-semibold text-slate-800">No saved shipping address yet</p>
                        <p className="text-xs text-slate-500 mt-1">Add your first shipping address so we can use it for this checkout.</p>
                        <button
                            type="button"
                            onClick={openAddAddress}
                            className="mt-4 inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                        >
                            Add shipping address
                        </button>
                    </div>
                ) : selectedAddress ? (
                    <div className="rounded-[28px] border border-orange-200 bg-linear-to-br from-orange-50 via-white to-amber-50 px-5 py-5 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-500">Deliver To</p>
                                    {selectedAddress.is_default ? (
                                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                            Default
                                        </span>
                                    ) : null}
                                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                        {selectedAddress.address_type || 'Address'}
                                    </span>
                                </div>
                                <p className="mt-3 text-base font-bold text-slate-900">{selectedAddress.full_name}</p>
                                <p className="mt-1 text-sm font-medium text-slate-600">{selectedAddress.phone}</p>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{selectedAddress.full_address}</p>
                                {selectedAddress.notes ? (
                                    <p className="mt-2 text-xs text-slate-500">Note: {selectedAddress.notes}</p>
                                ) : null}
                            </div>

                            <div className="rounded-2xl border border-orange-100 bg-white/90 px-3 py-2 text-right">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Saved addresses</p>
                                <p className="text-lg font-bold text-slate-900">{addresses.length}</p>
                            </div>
                        </div>
                    </div>
                ) : null}

                {selectedAddress ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Selected for this order</p>
                        <p className="text-sm font-semibold text-slate-900 mt-2">{selectedAddress.full_name} - {selectedAddress.phone}</p>
                        <p className="text-sm text-slate-600 mt-1">{selectedAddress.full_address}</p>
                    </div>
                ) : null}

                {actionError ? (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {actionError}
                    </div>
                ) : null}
            </div>
            {isModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
                    <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-500">Shipping Address</p>
                                <h3 className="text-xl font-bold text-slate-900 mt-1">
                                    {modalView === 'list' ? 'Choose shipping address' : 'Add another address'}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    {modalView === 'list'
                                        ? 'Pick from your saved addresses or switch to add a new one.'
                                        : 'This will be available to select during checkout.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="h-10 w-10 rounded-full border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors"
                            >
                                x
                            </button>
                        </div>

                        <div className="overflow-y-auto px-6 py-5 space-y-4">
                            <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1">
                                <button
                                    type="button"
                                    onClick={() => setModalView('list')}
                                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${modalView === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Saved addresses
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModalView('add')}
                                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${modalView === 'add' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Add new
                                </button>
                            </div>

                            {modalView === 'list' ? (
                                addresses.length === 0 ? (
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
                                    <div className="space-y-3">
                                        {addresses.map(address => (
                                            <AddressCard
                                                key={address.id}
                                                address={address}
                                                active={address.id === selectedAddressId}
                                                settingDefault={settingDefault}
                                                onSelect={handleSelect}
                                                onMakeDefault={handleMakeDefault}
                                            />
                                        ))}
                                    </div>
                                )
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Field label="Recipient Name" value={draft.full_name} onChange={v => updateDraft('full_name', v)} placeholder="Full name" required />
                                        <Field label="Phone Number" value={draft.phone} onChange={v => updateDraft('phone', v)} placeholder="09XXXXXXXXX" required />
                                    </div>

                                    <Field label="Street / House No." value={draft.address} onChange={v => updateDraft('address', v)} placeholder="Street, building, house no." required />
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Region<span className="text-red-500 ml-0.5">*</span></label>
                                        <select
                                            value={ph.regionCode}
                                            onChange={(e) => {
                                                const option = e.target.options[e.target.selectedIndex];
                                                ph.setRegion(e.target.value, option.text);
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
                                                onChange={(e) => ph.setBarangay(e.target.value)}
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

                                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={draft.set_default}
                                            onChange={(e) => updateDraft('set_default', e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-200"
                                        />
                                        <span className="text-sm text-slate-700 font-medium">Set this as my default shipping address</span>
                                    </label>
                                </>
                            )}

                            {actionError ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {actionError}
                                </div>
                            ) : null}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-white transition-colors"
                            >
                                Cancel
                            </button>
                            {modalView === 'add' ? (
                                <button
                                    type="button"
                                    onClick={() => void handleCreateAddress()}
                                    disabled={creatingAddress}
                                    className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
                                >
                                    {creatingAddress ? 'Saving...' : 'Save Address'}
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
