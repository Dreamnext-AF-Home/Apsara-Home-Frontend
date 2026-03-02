'use client';

import { useEffect } from "react";
import { usePhAddress } from "@/hooks/usePhAddress";
import { FormErrors, GuestForm } from "@/types/CustomerCheckout/types";

interface CustomerCheckoutAddressFormProps {
    form: GuestForm;
    errors: FormErrors;
    setField: (key: keyof GuestForm, value: string) => void;
}

const Field = ({ label, value, onChange, placeholder, required = false, error, fieldKey }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder: string; required?: boolean; error?: string; fieldKey?: keyof GuestForm;
}) => (
    <div data-error-field={fieldKey} className="transition-transform duration-200">
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                    : 'border-slate-200 focus:ring-orange-200 focus:border-orange-400'
                }`}
        />
        {error && <p className="text-red-500 text-[11px] mt-1">{error}</p>}
    </div>
)

const CustomerCheckoutAddressForm = ({ form, errors, setField }: CustomerCheckoutAddressFormProps) => {
    const ph = usePhAddress();

    useEffect(() => {
        setField('region', ph.address.region);
        setField('province', ph.noProvince ? ph.address.region : ph.address.province);
        setField('city', ph.address.city);
        setField('barangay', ph.address.barangay);
    }, [ph.address.region, ph.address.province, ph.address.city, ph.address.barangay, ph.noProvince, setField]);

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

                {!ph.noProvince && (
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
                )}

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
                    <p className="text-xs texxt-orange-700 leading-relaxed">
                        Nationwide delivery available. Delivery time may vary per location.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default CustomerCheckoutAddressForm
