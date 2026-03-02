'use client';

import { FormErrors, GuestForm } from "@/types/CustomerCheckout/types";

interface CustomerCheckoutContactFormProps {
    form: GuestForm;
    errors: FormErrors;
    setField: (key: keyof GuestForm, value: string) => void;
}

const Field = ({ label, value, onChange, placeholder, type = 'text', required = false, error, fieldKey }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder: string; type?: string; required?: boolean; error?: string; fieldKey?: keyof GuestForm;
}) => (
    <div data-error-field={fieldKey} className="transition-transform duration-200">
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                : 'border-slate-200 focus:ring-orange-200 focus:border-orange-400'
                }`}
        />
        {error && <p className="text-red-500 text-[11px] mt-1">{error}</p>}
    </div>
);

const CustomerCheckoutContactForm = ({
    form,
    errors,
    setField
}: CustomerCheckoutContactFormProps) => {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</div>
                Contact information
            </h2>
            <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Full Name" value={form.name} onChange={v => setField('name', v)} placeholder="Enter Full Name" required error={errors.name} fieldKey="name" />
                    <Field label="Email" value={form.email} onChange={v => setField('email', v)} placeholder="Enter Email" required error={errors.email} fieldKey="email" />
                </div>
                <Field label="Phone Number" value={form.phone} onChange={v => setField('phone', v)} placeholder="Enter Phone Number" required error={errors.phone} fieldKey="phone" />

                {/* DIVIDER */}
                <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-3 pt-1" />
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Optional</span>
                    <div />
                </div>

                {/* REFERRAL CODE */}
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Referral Code</label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                        <input
                            type="text"
                            value={form.referral_code}
                            onChange={e => setField('referral_code', e.target.value.toUpperCase())}
                            placeholder="Enter referral code"
                            maxLength={20}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300f focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all tracking-widest font-mono uppercase"
                        />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Enter your promo code to get a discount or reward.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default CustomerCheckoutContactForm
