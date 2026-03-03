'use client';

import Loading from "@/app/loading";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import TopBar from "@/components/layout/TopBar";
import { GuestForm, FormErrors, CustomerCheckoutData, PaymentMethod } from "@/types/CustomerCheckout/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import CustomerCheckoutContactForm from "./CustomerCheckoutContactForm";
import CustomerCheckoutAddressForm from "./CustomerCheckoutAddressForm";
import CustomerCheckoutPaymentMethod from "./CustomerCheckoutPaymentMethod";
import CustomerCheckoutOrderSummary from "./CustomerCheckoutOrderSummary";
import { useCreateCheckoutSessionMutation } from "@/store/api/paymentApi";


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
    referral_code: ''

}

const REQUIRED_FIELD_ORDER: Array<keyof GuestForm> = [
    'name',
    'email',
    'phone',
    'address',
    'region',
    'province',
    'city',
    'barangay',
];


const CustomerCheckoutMain = () => {
    const router = useRouter();

    const [checkoutData, setCheckoutData] = useState<CustomerCheckoutData | null>(null);
    const [form, setForm] = useState<GuestForm>(defaultForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('gcash');
    const [notice, setNotice] = useState('');
    const [createCheckoutSession, { isLoading: loading }] = useCreateCheckoutSessionMutation();

    useEffect(() => {
        const raw = localStorage.getItem('guest_checkout');
        if (!raw) {
            router.replace('/');
            return;
        }
        try {
            setCheckoutData(JSON.parse(raw));
        } catch {
            router.replace('/');
        }
    }, [router]);

    const setField = useCallback((key: keyof GuestForm, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }))
        setErrors(prev => ({ ...prev, [key]: undefined }))
    }, [])

    const validate = (): FormErrors => {
        const e: FormErrors = {};
        if (!form.name.trim()) e.name = 'Required';
        if (!form.email.trim()) e.email = 'Required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
        if (!form.phone.trim()) e.phone = 'Required';
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

        try {
            const data = await createCheckoutSession({
                amount: checkoutData.total,
                description: checkoutData.product.name,
                payment_method: selectedMethod,
                customer: {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    address: `${form.address}, ${form.barangay}, ${form.city}, ${form.province}, ${form.region}${form.zip ? ` ${form.zip}` : ''}`,
                },
                order: {
                    product_name: checkoutData.product.name,
                    product_id: checkoutData.product.id,
                    product_sku: checkoutData.product.sku ?? null,
                    product_pv: checkoutData.product.prodpv ?? 0,
                    product_image: checkoutData.product.image,
                    quantity: checkoutData.quantity,
                    selected_color: checkoutData.selectedColor ?? null,
                    selected_size: checkoutData.selectedSize ?? null,
                    selected_type: checkoutData.selectedType ?? null,
                },
            }).unwrap();

            if (!data.checkout_url) {
                alert('Failed to create checkout session')
                return
            };

            if (data.checkout_id) {
                localStorage.setItem('last_checkout_id', data.checkout_id);
            }
            localStorage.removeItem('guest_checkout');
            window.location.href = data.checkout_url;
        } catch {
            alert('Something went wrong');
        }

    }

    if (!checkoutData) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loading />
        </div>
    );
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <TopBar />
            <Navbar />
            <main className="flex-1">
                {/* HEADER */}
                <div className="bg-white border-b border-gray-100">
                    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AF Home · Secure Checkout</p>
                            <h1 className="text-lg font-black text-slate-800">Checkout</h1>
                        </div>
                        <Link href="/" className="tex-xs text-slate-400 hover:text-orange-500 font-medium transition-colors flex items-center gap-0.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to shop
                        </Link>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                        {/* LEFT FORMS */}
                        <div className="lg:col-span-2 space-y-5">
                            <CustomerCheckoutContactForm
                                form={form}
                                errors={errors}
                                setField={setField}
                            />
                            <CustomerCheckoutAddressForm 
                                form={form}
                                errors={errors}
                                setField={setField}
                            />

                            <CustomerCheckoutPaymentMethod 
                                selectedMethod={selectedMethod}
                                onSelect={(m) => { setSelectedMethod(m); setNotice('')}}
                                notice={notice}
                            />
                        </div>

                        {/* RIGHT ORDER SUMMARY */}
                        <div className="lg:sticky lg:top-4">
                            <CustomerCheckoutOrderSummary 
                                checkoutData={checkoutData}
                                loading={loading}
                                onSubmit={handleSubmit}
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
