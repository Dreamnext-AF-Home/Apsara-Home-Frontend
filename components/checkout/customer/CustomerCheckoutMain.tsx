'use client';

import LoadingScreen from "@/components/ui/LoadingScreen";
import Footer from "@/components/landing-page/Footer";
import ProductPageWrapper from "@/components/product/ProductPageWrapper";
import { GuestForm, FormErrors, CustomerCheckoutData, PaymentMethod, PaymentMode } from "@/types/CustomerCheckout/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import CustomerCheckoutContactForm from "./CustomerCheckoutContactForm";
import CustomerCheckoutAddressForm from "./CustomerCheckoutAddressForm";
import CustomerCheckoutPaymentMethod from "./CustomerCheckoutPaymentMethod";
import CustomerCheckoutOrderSummary from "./CustomerCheckoutOrderSummary";
import { CheckoutOnlineBankingProvider, useCreateCheckoutSessionMutation, useValidateVoucherMutation } from "@/store/api/paymentApi";
import { useGetPublicGeneralSettingsQuery } from "@/store/api/adminSettingsApi";
import { useGetPublicShippingRatesQuery } from "@/store/api/shippingRatesApi";
import { getStoredReferralCode } from "@/libs/referral";
import { normalizeReferralCode } from "@/libs/referral";
import { useMeQuery } from "@/store/api/userApi";
import { useLazyGetPublicProductQuery } from "@/store/api/productsApi";
import type { Category } from '@/store/api/categoriesApi';
import { User, ArrowLeft } from 'lucide-react';
import { resolveShippingFee } from "@/libs/shippingRates";

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
    'address',
    'region',
    'province',
    'city',
    'barangay',
];

const LOCAL_PAYMENT_MODE_HOSTS = new Set(['localhost', '127.0.0.1']);

function PartnerOrderFooter({ partnerName }: { partnerName: string }) {
    return (
        <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400 sm:px-6 lg:px-8">
                Orders from <span className="font-semibold text-slate-800 dark:text-slate-200">{partnerName}</span> are still processed through AF Home.
            </div>
        </footer>
    );
}

type DraftCheckoutItem = NonNullable<CustomerCheckoutData['items']>[number];

const toPositiveDraftNumber = (value: unknown): number | undefined => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

function readCheckoutDraft(): CustomerCheckoutData | null {
    if (typeof window === 'undefined') return null;

    try {
        const raw = localStorage.getItem('guest_checkout');
        if (!raw) return null;

        const parsed = JSON.parse(raw) as CustomerCheckoutData & {
            product?: CustomerCheckoutData['product'] & { id?: number | string };
            variantId?: number | string | null;
            items?: Array<DraftCheckoutItem & {
                id?: number | string;
                cartItemId?: number | string;
                productId?: number | string;
                variantId?: number | string;
            }>;
        };

        const normalizedProductId = toPositiveDraftNumber(parsed?.product?.id)
            ?? toPositiveDraftNumber(parsed?.items?.[0]?.productId)
            ?? toPositiveDraftNumber(parsed?.items?.[0]?.id);
        const normalizedItems = Array.isArray(parsed.items)
            ? parsed.items.map((item) => ({
                ...item,
                id: String(item.id),
                cartItemId: toPositiveDraftNumber(item.cartItemId),
                productId: toPositiveDraftNumber(item.productId),
                variantId: toPositiveDraftNumber(item.variantId),
            }))
            : parsed.items;

        return {
            ...parsed,
            variantId: toPositiveDraftNumber(parsed.variantId) ?? null,
            product: parsed.product
                ? {
                    ...parsed.product,
                    id: normalizedProductId,
                }
                : parsed.product,
            items: normalizedItems,
        } as CustomerCheckoutData;
    } catch {
        return null;
    }
}

function readStoredReferral(): string {
    if (typeof window === 'undefined') return '';
    return getStoredReferralCode() || '';
}

const toPositiveNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

const CustomerCheckoutMain = ({
    initialCategories = [],
    storefrontPartner,
    storefrontReferralCode,
    storefrontDisplayName,
    storefrontLogoUrl,
    storefrontTabLogoUrl,
}: {
    initialCategories?: Category[];
    storefrontPartner?: string;
    storefrontReferralCode?: string;
    storefrontDisplayName?: string;
    storefrontLogoUrl?: string;
    storefrontTabLogoUrl?: string;
}) => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const role = String(session?.user?.role ?? '').toLowerCase();
    const isCustomerSession = status === 'authenticated' && (role === 'customer' || role === '');
    const normalizedPartner = (storefrontPartner ?? '').trim().toLowerCase();
    const isPartnerStorefront = normalizedPartner.length > 0;
    const hasPartnerContext = isPartnerStorefront || Boolean(storefrontDisplayName?.trim());
    const isLoggedIn = isPartnerStorefront ? false : isCustomerSession;
    const { data: meData } = useMeQuery(undefined, { skip: !isCustomerSession });
    const { data: publicSettingsData } = useGetPublicGeneralSettingsQuery();
    const { data: shippingRatesData, isLoading: shippingRatesLoading, isFetching: shippingRatesFetching } = useGetPublicShippingRatesQuery();
    const [fetchProduct, { data: fullProductData }] = useLazyGetPublicProductQuery();
    const [checkoutRefreshTrigger, setCheckoutRefreshTrigger] = useState(0);
    
    const partnerName = storefrontDisplayName?.trim() || (normalizedPartner ? normalizedPartner.replace(/-/g, ' ') : 'AF Home');
    const partnerLogo = storefrontLogoUrl || storefrontTabLogoUrl;
    const shouldShowReferralField = true;
    const backToShopHref = isPartnerStorefront ? `/shop/${normalizedPartner}/product` : '/shop';
    const checkoutHeaderLabel = isPartnerStorefront ? `${partnerName} Secure Checkout` : 'AF Home Secure Checkout';

    const checkoutData = useMemo(() => readCheckoutDraft(), [checkoutRefreshTrigger]);
    const isZqCheckout = checkoutData?.sourceType === 'zq' || checkoutData?.product?.sourceType === 'zq';
    const storedReferral = useMemo(() => readStoredReferral(), []);
    const storefrontReferral = useMemo(() => normalizeReferralCode(storefrontReferralCode ?? ''), [storefrontReferralCode]);
    const memberReferral = (meData?.referrer_username ?? '').trim();
    const effectiveReferral = memberReferral || storedReferral || storefrontReferral;
    const hasLockedReferral = effectiveReferral.trim() !== '';
    const shouldRequireReferral = !isLoggedIn && !hasLockedReferral;

    useEffect(() => {
        if (!isZqCheckout && checkoutData?.product?.id) {
            fetchProduct(checkoutData.product.id);
        }
    }, [checkoutData?.product?.id, fetchProduct, isZqCheckout]);

    useEffect(() => {
        const handleVariantChange = () => {
            setCheckoutRefreshTrigger(prev => prev + 1);
        };

        window.addEventListener('checkout-variant-changed', handleVariantChange);
        window.addEventListener('checkout-cart-updated', handleVariantChange);
        return () => {
            window.removeEventListener('checkout-variant-changed', handleVariantChange);
            window.removeEventListener('checkout-cart-updated', handleVariantChange);
        };
    }, []);

    const [formOverrides, setFormOverrides] = useState<Partial<GuestForm>>({});
    const [errors, setErrors] = useState<FormErrors>({});
    const requiredFieldOrder = useMemo(
        () => (isLoggedIn ? REQUIRED_FIELD_ORDER.filter((key) => key !== 'referred_by') : REQUIRED_FIELD_ORDER),
        [isLoggedIn]
    );
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('gcash');
    const [selectedOnlineBankingProvider, setSelectedOnlineBankingProvider] = useState<CheckoutOnlineBankingProvider>('dob');
    const paymentModeEnabledByAdmin = Boolean(publicSettingsData?.settings?.enable_test_payments);
    const manualCheckoutModeEnabledByAdmin = Boolean(publicSettingsData?.settings?.enable_manual_checkout_mode);
    const useManualCheckoutShipping = manualCheckoutModeEnabledByAdmin && !isZqCheckout;
    const isLocalPaymentHost = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return LOCAL_PAYMENT_MODE_HOSTS.has(window.location.hostname);
    }, []);
    const [paymentMode, setPaymentMode] = useState<PaymentMode>(() => {
        if (typeof window === 'undefined') return 'live';
        return LOCAL_PAYMENT_MODE_HOSTS.has(window.location.hostname) ? 'test' : 'live';
    });
    const [notice, setNotice] = useState('');
    const [createCheckoutSession, { isLoading: loading }] = useCreateCheckoutSessionMutation();
    const [validateVoucher, { isLoading: voucherLoading }] = useValidateVoucherMutation();
    const [voucherInfo, setVoucherInfo] = useState<{ code: string; amount: number; discount: number } | null>(null);
    const [voucherError, setVoucherError] = useState<string | null>(null);
    const canSwitchPaymentMode = isLocalPaymentHost || paymentModeEnabledByAdmin;
    const effectivePaymentMode: PaymentMode = canSwitchPaymentMode ? paymentMode : 'live';
    const paymentModeOptions = useMemo<PaymentMode[]>(
        () => (canSwitchPaymentMode ? ['test', 'live'] : ['live']),
        [canSwitchPaymentMode]
    );
    const showOnlineBankingProviderPicker = effectivePaymentMode === 'test';

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
        referred_by: formOverrides.referred_by || effectiveReferral,
    }), [effectiveReferral, formOverrides, isLoggedIn, meData]);

    const shippingFee = useMemo(() => {
        if (!useManualCheckoutShipping) return 0;
        if (!form.province.trim() || !form.city.trim()) return null;
        return resolveShippingFee(shippingRatesData?.rates ?? [], form.province, form.city);
    }, [form.city, form.province, shippingRatesData?.rates, useManualCheckoutShipping]);
    const hasShippingAddress = Boolean(form.province.trim() && form.city.trim());
    const shippingAddressLabel = [form.city.trim(), form.province.trim()].filter(Boolean).join(', ');
    const isShippingRatePending = useManualCheckoutShipping && hasShippingAddress && (shippingRatesLoading || shippingRatesFetching);
    const isShippingRateUnavailable = useManualCheckoutShipping && hasShippingAddress && !isShippingRatePending && shippingFee === null;
    const canProceedWithoutShippingRate = useManualCheckoutShipping && isShippingRateUnavailable;
    const resolvedShippingFee = shippingFee ?? 0;

    const voucherDiscount = useMemo(() => Math.max(0, Number(voucherInfo?.discount ?? 0)), [voucherInfo?.discount]);
    const hasMultiItemsCheckout = Boolean((checkoutData?.items?.length ?? 0) > 0);
    const guestPricing = useMemo(() => {
        if (!checkoutData || isLoggedIn || hasMultiItemsCheckout) {
            return {
                unitPrice: toPositiveNumber(checkoutData?.product?.price ?? 0),
                subtotal: toPositiveNumber(checkoutData?.subtotal ?? 0),
                productPv: toPositiveNumber(checkoutData?.product?.prodpv ?? 0),
            };
        }

        const normalizedSku = String(checkoutData.selectedSku ?? '').trim().toLowerCase();
        const normalizedVariantId = toPositiveNumber(checkoutData.variantId);
        const normalizedColor = String(checkoutData.selectedColor ?? '').trim().toLowerCase();
        const normalizedSize = String(checkoutData.selectedSize ?? '').trim().toLowerCase();
        const normalizedType = String(checkoutData.selectedType ?? '').trim().toLowerCase();
        const variants = fullProductData?.variants ?? [];

        const matchedVariant =
            variants.find((variant) => normalizedVariantId > 0 && Number(variant.id ?? 0) === normalizedVariantId)
            ?? variants.find((variant) =>
                normalizedSku !== '' &&
                String(variant.sku ?? '').trim().toLowerCase() === normalizedSku &&
                (normalizedType === '' || String(variant.name ?? '').trim().toLowerCase() === normalizedType)
            )
            ?? variants.find((variant) => normalizedSku !== '' && String(variant.sku ?? '').trim().toLowerCase() === normalizedSku)
            ?? variants.find((variant) => {
                const vColor = String(variant.color ?? '').trim().toLowerCase();
                const vSize = String(variant.size ?? '').trim().toLowerCase();
                const vType = String(variant.name ?? '').trim().toLowerCase();
                if (normalizedColor !== '' && normalizedSize !== '') {
                    return vColor === normalizedColor && vSize === normalizedSize;
                }
                if (normalizedType !== '') {
                    return vType === normalizedType;
                }
                return false;
            });

        const unitPrice = toPositiveNumber(
            matchedVariant?.priceSrp
            ?? fullProductData?.priceSrp
            ?? checkoutData.product.price
            ?? 0
        );

        const quantity = Math.max(1, Number(checkoutData.quantity || 1));
        const productPv = toPositiveNumber(
            matchedVariant?.prodpv
            ?? fullProductData?.prodpv
            ?? checkoutData.product.prodpv
            ?? 0
        );

        return {
            unitPrice,
            subtotal: unitPrice * quantity,
            productPv,
        };
    }, [checkoutData, fullProductData, hasMultiItemsCheckout, isLoggedIn]);

    const effectiveSubtotal = useMemo(() => {
        if (!checkoutData) return 0;
        return !isLoggedIn ? guestPricing.subtotal : toPositiveNumber(checkoutData.subtotal);
    }, [checkoutData, guestPricing.subtotal, isLoggedIn]);

    const effectiveProductPv = useMemo(() => {
        if (!checkoutData) return 0;
        return !isLoggedIn ? guestPricing.productPv : toPositiveNumber(checkoutData.product.prodpv ?? 0);
    }, [checkoutData, guestPricing.productPv, isLoggedIn]);

    const computedTotal = useMemo(() => {
        if (!checkoutData) return 0;
        return Math.max(0, effectiveSubtotal - voucherDiscount) + resolvedShippingFee;
    }, [checkoutData, effectiveSubtotal, resolvedShippingFee, voucherDiscount]);
    const effectiveSourceSlug = useMemo(() => {
        const draftSlug = String(checkoutData?.sourceSlug ?? '').trim().toLowerCase();
        if (draftSlug) return draftSlug;
        return normalizedPartner || '';
    }, [checkoutData?.sourceSlug, normalizedPartner]);
    const effectiveSourceUrl = useMemo(() => {
        const draftUrl = String(checkoutData?.sourceUrl ?? '').trim();
        if (draftUrl) return draftUrl;
        if (typeof window === 'undefined') return null;
        if (!effectiveSourceSlug) return window.location.href;
        return `${window.location.origin}/shop/${effectiveSourceSlug}/product`;
    }, [checkoutData?.sourceUrl, effectiveSourceSlug]);

    useEffect(() => {
        if (checkoutData) return;
        router.replace(backToShopHref);
    }, [backToShopHref, checkoutData, router]);

    useEffect(() => {
        if (!checkoutData?.product) return;
        if (!useManualCheckoutShipping) return;
        if (checkoutData.product.manualCheckoutEnabled === true) {
            return;
        }

        setNotice('Some items may not support manual checkout. Please review your cart items before placing the order.');
    }, [checkoutData, useManualCheckoutShipping]);

    useEffect(() => {
        if (!checkoutData) return;
        const code = form.voucher_coupon.trim();

        if (!code) return;

        const handle = setTimeout(async () => {
            try {
                setVoucherError(null);
                const res = await validateVoucher({ code, subtotal: effectiveSubtotal }).unwrap();
                const voucherAmount = Number(res.voucher.amount ?? 0);
                const requiredSubtotal = Math.max(0, voucherAmount * 2);
                const stillNeeded = Math.max(0, requiredSubtotal - effectiveSubtotal);

                if (stillNeeded > 0) {
                    setVoucherInfo(null);
                    setVoucherError(
                        `Minimum purchase for this voucher is PHP ${requiredSubtotal.toLocaleString()}. ` +
                        `You still need PHP ${stillNeeded.toLocaleString()}.`,
                    );
                    return;
                }

                setVoucherInfo({
                    code: res.voucher.code,
                    amount: voucherAmount,
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
    }, [effectiveSubtotal, form.voucher_coupon, checkoutData, validateVoucher]);

    const setField = useCallback((key: keyof GuestForm, value: string) => {
        setFormOverrides(prev => ({ ...prev, [key]: value }))
        setErrors(prev => ({ ...prev, [key]: undefined }))
        if (key === 'voucher_coupon') {
            setVoucherInfo(null)
            setVoucherError(null)
        }
    }, [])

    const validate = (): FormErrors => {
        const e: FormErrors = {};
        if (!form.name.trim()) e.name = 'Required';
        if (!form.email.trim()) e.email = 'Required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
        if (!form.phone.trim()) e.phone = 'Required';
        if (shouldRequireReferral && !form.referred_by.trim()) e.referred_by = 'Required';
        if (!form.address.trim()) e.address = 'Required';
        if (!form.region.trim()) e.region = 'Required';
        if (!form.barangay.trim()) e.barangay = 'Required';
        if (!form.city.trim()) e.city = 'Required';
        if (!form.province.trim()) e.province = 'Required';
        return e;
    }

    const focusFirstErrorField = useCallback((validationErrors: FormErrors) => {
        const firstErrorKey = requiredFieldOrder.find((key) => Boolean(validationErrors[key]));
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
    }, [requiredFieldOrder]);

    const handleSubmit = async () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            requestAnimationFrame(() => focusFirstErrorField(errs));
            return;
        }

        if (!checkoutData) return;
        if (isShippingRatePending) {
            alert('Shipping fee is still loading. Please wait a moment.');
            return;
        }
        if (isShippingRateUnavailable && !canProceedWithoutShippingRate) {
            alert('No shipping rate is configured for the selected province and city.');
            return;
        }
        if (form.voucher_coupon.trim() && !voucherInfo) {
            setVoucherError(voucherError || 'Voucher code is invalid or expired.');
            return;
        }

        try {
            const normalizedProductId = Number(checkoutData.product.id);
            const data = await createCheckoutSession({
                amount: computedTotal,
                description: checkoutData.product.name,
                payment_method: selectedMethod,
                payment_mode: canSwitchPaymentMode ? effectivePaymentMode : undefined,
                online_banking_provider: selectedMethod === 'online_banking' && showOnlineBankingProviderPicker
                    ? selectedOnlineBankingProvider
                    : undefined,
                voucher_code: voucherInfo?.code,
                source_label: checkoutData.sourceLabel ?? null,
                source_slug: effectiveSourceSlug || null,
                storefront_partner: effectiveSourceSlug || null,
                source_host: checkoutData.sourceHost ?? null,
                source_url: effectiveSourceUrl ?? null,
                customer: {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    address: `${form.address}, ${form.barangay}, ${form.city}, ${form.province}, ${form.region}${form.zip ? ` ${form.zip}` : ''}`,
                    referred_by: form.referred_by.trim(),
                    is_member: isLoggedIn,
                },
                order: {
                    product_name: checkoutData.product.name,
                    product_id: Number.isFinite(normalizedProductId) ? normalizedProductId : undefined,
                    product_sku: checkoutData.selectedSku ?? checkoutData.product.sku ?? null,
                    product_pv: effectiveProductPv,
                    product_image: checkoutData.product.image,
                    quantity: checkoutData.quantity,
                    selected_color: checkoutData.selectedColor ?? null,
                    selected_style: checkoutData.selectedStyle ?? null,
                    selected_size: checkoutData.selectedSize ?? null,
                    selected_type: checkoutData.selectedType ?? null,
                    subtotal: effectiveSubtotal,
                    handling_fee: resolvedShippingFee,
                    source_type: isZqCheckout ? 'zq' : 'local',
                    zq_product_id: checkoutData.zqProductId ?? checkoutData.product.zqProductId ?? null,
                    zq_external_id: checkoutData.zqExternalId ?? checkoutData.product.zqExternalId ?? null,
                    zq_offer_id: checkoutData.zqOfferId ?? checkoutData.product.zqOfferId ?? null,
                },
            }).unwrap();

            if (!data.checkout_url) {
                alert('Failed to create checkout session')
                return
            }

            if (data.checkout_id) {
                localStorage.setItem('last_checkout_id', data.checkout_id);
                sessionStorage.setItem('last_checkout_id', data.checkout_id);
                localStorage.setItem('last_checkout_payment_mode', canSwitchPaymentMode ? (data.payment_mode || effectivePaymentMode) : 'live');
                sessionStorage.setItem('last_checkout_payment_mode', canSwitchPaymentMode ? (data.payment_mode || effectivePaymentMode) : 'live');
                try {
                    const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
                    document.cookie = `last_checkout_id=${encodeURIComponent(data.checkout_id)}; Path=/; Max-Age=86400; SameSite=Lax${secureFlag}`;
                    if (typeof window !== 'undefined' && /(^|\\.)afhome\\.ph$/i.test(window.location.hostname)) {
                        document.cookie = `last_checkout_id=${encodeURIComponent(data.checkout_id)}; Path=/; Domain=.afhome.ph; Max-Age=86400; SameSite=Lax${secureFlag}`;
                    }
                } catch {
                    // Ignore cookie write failures.
                }
            }
            if (effectiveSourceSlug) {
                localStorage.setItem('last_checkout_source_slug', effectiveSourceSlug);
                sessionStorage.setItem('last_checkout_source_slug', effectiveSourceSlug);
                try {
                    const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
                    document.cookie = `last_checkout_source_slug=${encodeURIComponent(effectiveSourceSlug)}; Path=/; Max-Age=86400; SameSite=Lax${secureFlag}`;
                    if (typeof window !== 'undefined' && /(^|\\.)afhome\\.ph$/i.test(window.location.hostname)) {
                        document.cookie = `last_checkout_source_slug=${encodeURIComponent(effectiveSourceSlug)}; Path=/; Domain=.afhome.ph; Max-Age=86400; SameSite=Lax${secureFlag}`;
                    }
                } catch {
                    // Ignore cookie write failures.
                }
            } else {
                localStorage.removeItem('last_checkout_source_slug');
                sessionStorage.removeItem('last_checkout_source_slug');
            }
            localStorage.removeItem('guest_checkout');
            window.location.href = data.checkout_url;
        } catch (error) {
            const apiError = error as {
                data?: {
                    message?: string;
                    errors?: Record<string, string[]>;
                    error?: {
                        errors?: Array<{ detail?: string; code?: string; source?: Record<string, string> }>;
                    };
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
            const gatewayError = apiError?.data?.error?.errors?.[0]?.detail;
            alert(gatewayError || apiError?.data?.message || 'Something went wrong');
        }
    }

    if (!checkoutData) {
        return (
            <LoadingScreen
                logoSrc={hasPartnerContext ? (partnerLogo || null) : '/Images/af_home_logo.png'}
                logoAlt={`${partnerName} Logo`}
                brandText={partnerName.toUpperCase()}
                tagline={hasPartnerContext ? 'Partner Storefront' : 'Your Trusted Home Partner'}
            />
        );
    }

    const checkoutContent = (
        <main className="flex-1 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">{checkoutHeaderLabel}</p>
                                <h1 className="text-slate-900 dark:text-white font-bold text-lg leading-tight">
                                    {isLoggedIn ? 'Checkout Details' : 'Guest Checkout'}
                                </h1>
                            </div>
                        </div>
                        <Link href={backToShopHref} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                            <ArrowLeft className="w-3.5 h-3.5" />
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
                                showReferral={shouldShowReferralField}
                                lockReferralField={hasLockedReferral}
                                referralSourceCode={hasLockedReferral ? effectiveReferral : ''}
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
                                shippingRates={shippingRatesData?.rates ?? []}
                                restrictToShippingRates={manualCheckoutModeEnabledByAdmin}
                            />

                            <CustomerCheckoutPaymentMethod
                                selectedMethod={selectedMethod}
                                onSelect={(m) => {
                                    setSelectedMethod(m);
                                    setNotice('');
                                }}
                                paymentMode={effectivePaymentMode}
                                paymentModeOptions={paymentModeOptions}
                                onPaymentModeChange={setPaymentMode}
                                selectedOnlineBankingProvider={selectedOnlineBankingProvider}
                                onOnlineBankingProviderChange={setSelectedOnlineBankingProvider}
                                showOnlineBankingProviderPicker={showOnlineBankingProviderPicker}
                                paymentModeSource={isLocalPaymentHost ? 'local' : paymentModeEnabledByAdmin ? 'admin' : 'hidden'}
                                notice={notice}
                            />
                        </div>

                        <div className="lg:sticky lg:top-4">
                            <CustomerCheckoutOrderSummary
                                checkoutData={checkoutData}
                                loading={loading}
                                onSubmit={handleSubmit}
                                voucher={voucherInfo ? { code: voucherInfo.code, discount: voucherInfo.discount } : null}
                                computedTotal={computedTotal}
                                subtotalOverride={effectiveSubtotal}
                                unitPriceOverride={!isLoggedIn && !hasMultiItemsCheckout ? guestPricing.unitPrice : undefined}
                                shippingFee={shippingFee}
                                shippingRatePending={isShippingRatePending}
                                shippingRateUnavailable={isShippingRateUnavailable}
                                shippingAddressLabel={shippingAddressLabel}
                                checkoutDisabledReason={
                                    isShippingRatePending
                                        ? 'Checking shipping rate...'
                                        : (isShippingRateUnavailable && !canProceedWithoutShippingRate)
                                            ? 'No shipping rate for selected location'
                                            : undefined
                                }
                                fullProduct={fullProductData ?? null}
                            />
                        </div>
                    </div>
                </div>
        </main>
    );

    return (
        <ProductPageWrapper
            initialCategories={initialCategories}
            hideTopBar={isPartnerStorefront}
            logoSrc={partnerLogo || '/Images/af_home_logo.png'}
            logoAlt={partnerName}
            logoHref={backToShopHref}
            hideSignIn={isPartnerStorefront}
            hideNavLinks={isPartnerStorefront}
            stickToTop={isPartnerStorefront}
            showGuestCartWishlist={isPartnerStorefront}
        >
            {checkoutContent}
            {isPartnerStorefront ? <PartnerOrderFooter partnerName={partnerName} /> : <Footer />}
        </ProductPageWrapper>
    );
}

export default CustomerCheckoutMain
