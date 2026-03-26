'use client';

import Loading from "@/app/loading";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import TopBar from "@/components/layout/TopBar";
import { GuestForm, FormErrors, CustomerCheckoutData, PaymentMethod } from "@/types/CustomerCheckout/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import CustomerCheckoutContactForm from "./CustomerCheckoutContactForm";
import CustomerCheckoutAddressForm from "./CustomerCheckoutAddressForm";
import CustomerCheckoutPaymentMethod from "./CustomerCheckoutPaymentMethod";
import CustomerCheckoutOrderSummary from "./CustomerCheckoutOrderSummary";
import { useCreateCheckoutSessionMutation, useValidateVoucherMutation } from "@/store/api/paymentApi";
import { getStoredReferralCode } from "@/libs/referral";
import { useMeQuery } from "@/store/api/userApi";
import type { Category } from '@/store/api/categoriesApi';

const defaultForm: GuestForm = {
    name: '',
    email: '',
    phone: '',
    address: '',
    region: '',
    barangay: '',
    city: '',
    province: '',
    zip: '',
    referred_by: '',
    voucher_coupon: ''
}

const REQUIRED_FIELD_ORDER: Array<keyof GuestForm> = [
    'name',
    'email',
    'phone',
    'referred_by',
    'address',
    'region',
    'province',
    'city',
    'barangay',
];

function readCheckoutDraft(): CustomerCheckoutData | null {
    if (typeof window === 'undefined') return null;

    try {
        const raw = localStorage.getItem('guest_checkout');
        return raw ? JSON.parse(raw) as CustomerCheckoutData : null;
    } catch {
        return null;
    }
}

function readStoredReferral(): string {
    if (typeof window === 'undefined') return '';
    return getStoredReferralCode() || '';
}

const CustomerCheckoutMain = ({ initialCategories = [] }: { initialCategories?: Category[] }) => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const role = String(session?.user?.role ?? '').toLowerCase();
    const isCustomerSession = status === 'authenticated' && (role === 'customer' || role === '');
    const isLoggedIn = isCustomerSession;
    const { data: meData } = useMeQuery(undefined, { skip: !isCustomerSession });

    const checkoutData = useMemo(() => readCheckoutDraft(), []);
    const storedReferral = useMemo(() => readStoredReferral(), []);

    const [formOverrides, setFormOverrides] = useState<GuestForm>(defaultForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('gcash');
    const [notice, setNotice] = useState('');
    const [createCheckoutSession, { isLoading: loading }] = useCreateCheckoutSessionMutation();
    const [validateVoucher, { isLoading: voucherLoading }] = useValidateVoucherMutation();
    const [voucherInfo, setVoucherInfo] = useState<{ code: string; amount: number; discount: number } | null>(null);
    const [voucherError, setVoucherError] = useState<string | null>(null);

    const form = useMemo<GuestForm>(() => ({
        ...defaultForm,
        ...(isLoggedIn ? {
            name: meData?.name || '',
            email: meData?.email || '',
            phone: meData?.phone || '',
            address: meData?.address || '',
            region: meData?.region || '',
            barangay: meData?.barangay || '',
            city: meData?.city || '',
            province: meData?.province || '',
            zip: meData?.zip_code || '',
        } : {}),
        ...formOverrides,
        referred_by: formOverrides.referred_by || storedReferral,
    }), [formOverrides, isLoggedIn, meData, storedReferral]);

    useEffect(() => {
        if (checkoutData) return;
        router.replace('/');
    }, [checkoutData, router]);

    useEffect(() => {
        if (!checkoutData) return;
        const code = form.voucher_coupon.trim();

        if (!code) {
            setVoucherInfo(null);
            setVoucherError(null);
            return;
        }

        setVoucherError(null);
        const handle = setTimeout(async () => {
            try {
                const res = await validateVoucher({ code, subtotal: checkoutData.subtotal }).unwrap();
                setVoucherInfo({
                    code: res.voucher.code,
                    amount: res.voucher.amount,
                    discount: res.discount,
                });
                setVoucherError(null);
            } catch (error) {
                const apiError = error as { data?: { message?: string } };
                setVoucherInfo(null);
                setVoucherError(apiError?.data?.message || 'Voucher code is invalid or expired.');
            }
        }, 450);

        return () => clearTimeout(handle);
    }, [form.voucher_coupon, checkoutData, validateVoucher]);

    const setField = useCallback((key: keyof GuestForm, value: string) => {
        setFormOverrides(prev => ({ ...prev, [key]: value }))
        setErrors(prev => ({ ...prev, [key]: undefined }))
    }, [])

    const validate = (): FormErrors => {
        const e: FormErrors = {};
        if (!form.name.trim()) e.name = 'Required';
        if (!form.email.trim()) e.email = 'Required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
        if (!form.phone.trim()) e.phone = 'Required';
        if (!form.referred_by.trim()) e.referred_by = 'Required';
        if (!form.address.trim()) e.address = 'Required';
        if (!form.region.trim()) e.region = 'Required';
        if (!form.barangay.trim()) e.barangay = 'Required';
        if (!form.city.trim()) e.city = 'Required';
        if (!form.province.trim()) e.province = 'Required';
        return e;
    }

    const focusFirstErrorField = useCallback((validationErrors: FormErrors) => {
        const firstErrorKey = REQUIRED_FIELD_ORDER.find((key) => Boolean(validationErrors[key]));
        if (!firstErrorKey) return;

        const target = document.querySelector<HTMLElement>(`[data-error-field="${firstErrorKey}"]`);
        if (!target) return;

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.animate(
            [
                { transform: 'translateX(0px)' },
                { transform: 'translateX(-8px)' },
                { transform: 'translateX(8px)' },
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(5px)' },
                { transform: 'translateX(0px)' },
            ],
            { duration: 420, easing: 'ease-in-out' }
        );

        const control = target.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea');
        control?.focus({ preventScroll: true });
    }, []);

    const handleSubmit = async () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            requestAnimationFrame(() => focusFirstErrorField(errs));
            return;
        }

        if (!checkoutData) return;
        if (selectedMethod === 'online_banking') {
            setNotice('Online Banking is coming soon.');
            return;
        }

        if (form.voucher_coupon.trim() && !voucherInfo) {
            setVoucherError(voucherError || 'Voucher code is invalid or expired.');
            return;
        }

        try {
            const voucherDiscount = voucherInfo?.discount ?? 0;
            const computedTotal = Math.max(0, checkoutData.subtotal - voucherDiscount) + checkoutData.handlingFee;
            const data = await createCheckoutSession({
                amount: computedTotal,
                description: checkoutData.product.name,
                payment_method: selectedMethod,
                voucher_code: voucherInfo?.code,
                customer: {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    address: `${form.address}, ${form.barangay}, ${form.city}, ${form.province}, ${form.region}${form.zip ? ` ${form.zip}` : ''}`,
                    referred_by: form.referred_by.trim(),
                },
                order: {
                    product_name: checkoutData.product.name,
                    product_id: checkoutData.product.id,
                    product_sku: checkoutData.selectedSku ?? checkoutData.product.sku ?? null,
                    product_pv: checkoutData.product.prodpv ?? 0,
                    product_image: checkoutData.product.image,
                    quantity: checkoutData.quantity,
                    selected_color: checkoutData.selectedColor ?? null,
                    selected_size: checkoutData.selectedSize ?? null,
                    selected_type: checkoutData.selectedType ?? null,
                    subtotal: checkoutData.subtotal,
                    handling_fee: checkoutData.handlingFee,
                },
            }).unwrap();

            if (!data.checkout_url) {
                alert('Failed to create checkout session')
                return
            }

            if (data.checkout_id) {
                localStorage.setItem('last_checkout_id', data.checkout_id);
            }
            localStorage.removeItem('guest_checkout');
            window.location.href = data.checkout_url;
        } catch (error) {
            const apiError = error as {
                data?: {
                    message?: string;
                    errors?: Record<string, string[]>;
                };
            };

            const referralError =
                apiError?.data?.errors?.['customer.referred_by']?.[0]
                ?? apiError?.data?.errors?.referred_by?.[0];

            if (referralError) {
                const nextErrors: FormErrors = { referred_by: referralError };
                setErrors((current) => ({ ...current, ...nextErrors }));
                requestAnimationFrame(() => focusFirstErrorField(nextErrors));
                return;
            }

            alert(apiError?.data?.message || 'Something went wrong');
        }
    }

    if (!checkoutData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <TopBar />
            <Navbar initialCategories={initialCategories} />
            <main className="flex-1">
                <div className="bg-linear-to-r from-orange-500 to-orange-600 shadow-sm">
                    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-orange-100 text-[10px] font-bold uppercase tracking-widest">AF Home Secure Checkout</p>
                                <h1 className="text-white font-bold text-lg leading-tight">
                                    {isLoggedIn ? 'Checkout Details' : 'Guest Checkout'}
                                </h1>
                            </div>
                        </div>
                        <Link href="/" className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-semibold transition-colors bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl border border-white/20">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to shop
                        </Link>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <div className="lg:col-span-2 space-y-5">
                            <CustomerCheckoutContactForm
                                form={form}
                                errors={errors}
                                setField={setField}
                                voucherStatus={{
                                    loading: voucherLoading,
                                    error: voucherError,
                                    appliedAmount: voucherInfo?.discount ?? 0,
                                }}
                            />
                            <CustomerCheckoutAddressForm
                                form={form}
                                errors={errors}
                                setField={setField}
                                isLoggedIn={isLoggedIn}
                            />

                            <CustomerCheckoutPaymentMethod
                                selectedMethod={selectedMethod}
                                onSelect={(m) => {
                                    setSelectedMethod(m);
                                    setNotice('');
                                }}
                                notice={notice}
                            />
                        </div>

                        <div className="lg:sticky lg:top-4">
                            <CustomerCheckoutOrderSummary
                                checkoutData={checkoutData}
                                loading={loading}
                                onSubmit={handleSubmit}
                                isLoggedIn={isLoggedIn}
                                voucher={voucherInfo ? { code: voucherInfo.code, discount: voucherInfo.discount } : null}
                                computedTotal={Math.max(0, checkoutData.subtotal - (voucherInfo?.discount ?? 0)) + checkoutData.handlingFee}
                            />
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default CustomerCheckoutMain
