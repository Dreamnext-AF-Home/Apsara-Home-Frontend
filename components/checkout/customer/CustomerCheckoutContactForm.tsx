'use client';

import { FormErrors, GuestForm } from "@/types/CustomerCheckout/types";
import { AlertCircle, Check, Gift } from 'lucide-react';

interface CustomerCheckoutContactFormProps {
    form: GuestForm;
    errors: FormErrors;
    setField: (key: keyof GuestForm, value: string) => void;
    lockReferralField?: boolean;
    referralSourceCode?: string;
    showReferral?: boolean;
    voucherStatus?: {
        loading?: boolean;
        error?: string | null;
        appliedAmount?: number | null;
    };
}

const Field = ({ label, value, onChange, placeholder, type = 'text', required = false, error, fieldKey }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder: string; type?: string; required?: boolean; error?: string; fieldKey?: keyof GuestForm;
}) => (
    <div data-error-field={fieldKey} className="transition-transform duration-200">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-300 dark:border-red-600 focus:ring-red-200 dark:focus:ring-red-900 focus:border-red-400 dark:focus:border-red-500'
                : 'border-slate-200 dark:border-slate-700 focus:ring-sky-200 dark:focus:ring-sky-900 focus:border-sky-400 dark:focus:border-sky-500'
                }`}
        />
        {error && <p className="text-red-500 dark:text-red-400 text-[11px] mt-1">{error}</p>}
    </div>
);

const CustomerCheckoutContactForm = ({
    form,
    errors,
    setField,
    lockReferralField = false,
    referralSourceCode = '',
    showReferral = true,
    voucherStatus
}: CustomerCheckoutContactFormProps) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</div>
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
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Optional</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                </div>

                {/* REFERRAL + VOUCHER */}
                {showReferral && (
                    <div data-error-field="referred_by" className="transition-transform duration-200">
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Referred By <span className="text-red-500 ml-0.5">*</span></label>
                        <div className="relative">
                            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                            <input
                                type="text"
                                value={form.referred_by}
                                onChange={e => setField('referred_by', e.target.value)}
                                placeholder="Enter name or referral ID"
                                maxLength={60}
                                disabled={lockReferralField}
                                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                                    lockReferralField
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 cursor-not-allowed focus:ring-emerald-100 dark:focus:ring-emerald-900 focus:border-emerald-300 dark:focus:border-emerald-600'
                                        : errors.referred_by
                                            ? 'bg-white dark:bg-slate-900 border-red-300 dark:border-red-600 text-slate-700 dark:text-slate-200 focus:ring-red-200 dark:focus:ring-red-900 focus:border-red-400 dark:focus:border-red-500'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-sky-200 dark:focus:ring-sky-900 focus:border-sky-400 dark:focus:border-sky-500'
                                }`}
                                required
                            />
                        </div>
                        {errors.referred_by ? (
                            <p className="text-red-500 dark:text-red-400 text-[11px] mt-1">{errors.referred_by}</p>
                        ) : lockReferralField && referralSourceCode ? (
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1.5 flex items-center gap-1">
                                <Check className="w-3 h-3 shrink-0" />
                                Shared shopping link detected. Referral <span className="font-semibold">@{referralSourceCode}</span> is locked for this checkout.
                            </p>
                        ) : (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            Enter who referred you only if no affiliate shopping link was shared with you.
                        </p>
                        )}
                    </div>
                )}

                <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Voucher Coupon</label>
                    <div className="relative">
                        <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            value={form.voucher_coupon}
                            onChange={e => setField('voucher_coupon', e.target.value.toUpperCase())}
                            placeholder="Enter voucher code"
                            maxLength={30}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900 focus:border-sky-400 dark:focus:border-sky-500 transition-all tracking-widest font-mono uppercase"
                        />
                    </div>
                    {voucherStatus?.loading ? (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">Checking voucher…</p>
                    ) : voucherStatus?.error ? (
                        <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1.5">{voucherStatus.error}</p>
                    ) : (voucherStatus?.appliedAmount ?? 0) > 0 ? (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5">
                            Voucher applied: -PHP {(voucherStatus?.appliedAmount ?? 0).toLocaleString()}
                        </p>
                    ) : (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            Apply your voucher coupon code if available.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default CustomerCheckoutContactForm
