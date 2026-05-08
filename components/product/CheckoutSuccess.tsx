'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLazyVerifyCheckoutSessionQuery } from '@/store/api/paymentApi';
import { useGetPublicWebPageItemsQuery } from '@/store/api/webPagesApi';
import TopBar from '@/components/layout/TopBar';
import Navbar from '@/components/layout/Navbar';
import TrustBar from '@/components/layout/TrustBar';
import Footer from '@/components/landing-page/Footer';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { extractPartnerSlugFromPath } from '@/libs/storefrontRouting';
import { getPartnerStorefrontConfig } from '@/libs/partnerStorefront';

const LOCAL_PAYMENT_MODE_HOSTS = new Set(['localhost', '127.0.0.1']);

function CheckoutSuccessPage() {
  const getVerifyErrorMessage = (err: unknown): string => {
    if (err instanceof Error && err.message.trim() !== '') {
      return err.message;
    }

    if (err && typeof err === 'object') {
      const apiErr = err as {
        data?: {
          message?: string;
          error?: {
            errors?: Array<{ detail?: string }>;
          };
        };
        error?: string;
        status?: number | string;
      };

      const gatewayDetail = apiErr?.data?.error?.errors?.[0]?.detail;
      if (gatewayDetail && gatewayDetail.trim() !== '') return gatewayDetail;

      const apiMessage = apiErr?.data?.message;
      if (apiMessage && apiMessage.trim() !== '') return apiMessage;

      if (typeof apiErr.error === 'string' && apiErr.error.trim() !== '') {
        return apiErr.error;
      }

      if (apiErr.status) {
        return `Verification request failed (HTTP ${apiErr.status}).`;
      }
    }

    return 'Verification failed';
  };

  const readCookieValue = (name: string): string => {
    if (typeof document === 'undefined') return '';
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
    return match?.[1] ? decodeURIComponent(match[1]) : '';
  };

  const [verifyCheckoutSession] = useLazyVerifyCheckoutSessionQuery();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const partnerSlugFromPath = extractPartnerSlugFromPath(pathname);
  // Only treat as partner storefront checkout when the URL itself is partner-scoped.
  // This prevents stale local/session storage from leaking partner branding into /checkout/success.
  const effectiveCheckoutSourceSlug = (partnerSlugFromPath || '').trim().toLowerCase();
  const trackOrderBaseHref = effectiveCheckoutSourceSlug ? `/${effectiveCheckoutSourceSlug}/track-order` : '/track-order';
  const homeHref = effectiveCheckoutSourceSlug ? `/shop/${effectiveCheckoutSourceSlug}` : '/';
  const { data: partnerStorefrontData } = useGetPublicWebPageItemsQuery('partner-storefront', {
    skip: !effectiveCheckoutSourceSlug,
  });
  const matchedStorefront = (partnerStorefrontData?.items ?? []).find(
    (item) => getPartnerStorefrontConfig(item)?.slug === effectiveCheckoutSourceSlug,
  );
  const partnerStorefrontConfig = getPartnerStorefrontConfig(matchedStorefront);
  const partnerLogoSrc = partnerStorefrontConfig?.logoUrl
    ? `${partnerStorefrontConfig.logoUrl}${partnerStorefrontConfig.logoUrl.includes('?') ? '&' : '?'}v=${partnerStorefrontConfig.logoVersion || '1'}`
    : '/Images/af_home_logo.png';
  const partnerLogoAlt = partnerStorefrontConfig?.displayName || 'Partner Storefront';
  const [result, setResult] = useState<{
    checkout_id: string;
    status: string | null;
    payment_intent_id: string | null;
    customer?: {
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
    };
    order_summary?: {
      description?: string | null;
      amount?: number | null;
      shipping_fee?: number | null;
      payment_method?: string | null;
      product_name?: string | null;
      product_sku?: string | null;
      quantity?: number | null;
    };
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    let pollCount = 0;
    const maxPolls = 24; // up to ~2 minutes
    const pollMs = 5000;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const normalizeStatus = (status: string | null | undefined) =>
      typeof status === 'string' ? status.toLowerCase() : '';
    const isPaidStatus = (status: string | null | undefined) =>
      ['paid', 'succeeded', 'success'].includes(normalizeStatus(status));
    const isPendingStatus = (status: string | null | undefined) =>
      ['active', 'unpaid', 'pending'].includes(normalizeStatus(status));
    const isFailedStatus = (status: string | null | undefined) =>
      ['failed', 'cancelled', 'expired'].includes(normalizeStatus(status));

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const verify = async (isInitial = false) => {
      const searchParams =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const checkoutIdFromQuery =
        (searchParams?.get('checkout_id') || '').trim() ||
        (searchParams?.get('checkoutId') || '').trim() ||
        (searchParams?.get('order') || '').trim() ||
        (searchParams?.get('reference') || '').trim();
      const checkoutIdFromStorage =
        localStorage.getItem('last_checkout_id') ||
        sessionStorage.getItem('last_checkout_id') ||
        readCookieValue('last_checkout_id') ||
        '';
      const checkoutId = checkoutIdFromQuery || checkoutIdFromStorage;
      const canUseLocalPaymentMode =
        typeof window !== 'undefined' && LOCAL_PAYMENT_MODE_HOSTS.has(window.location.hostname);

      const paymentMode = canUseLocalPaymentMode
        ? localStorage.getItem('last_checkout_payment_mode') ||
          sessionStorage.getItem('last_checkout_payment_mode') ||
          undefined
        : 'live';

      if (checkoutIdFromQuery) {
        localStorage.setItem('last_checkout_id', checkoutIdFromQuery);
        sessionStorage.setItem('last_checkout_id', checkoutIdFromQuery);
      }

      if (!checkoutId) {
        if (!isMounted) return;
        setError(
          'No checkout reference found. Please use the checkout link with order reference, or track your order manually.',
        );
        setLoading(false);
        stopPolling();
        return;
      }

      try {
        const requestedMode = paymentMode === 'test' || paymentMode === 'live' ? paymentMode : undefined;

        let data: {
          checkout_id: string;
          status: string | null;
          payment_intent_id: string | null;
          customer?: {
            name?: string | null;
            email?: string | null;
            phone?: string | null;
            address?: string | null;
          };
          order_summary?: {
            description?: string | null;
            amount?: number | null;
            shipping_fee?: number | null;
            payment_method?: string | null;
            product_name?: string | null;
            product_sku?: string | null;
            quantity?: number | null;
          };
        };

        try {
          data = await verifyCheckoutSession({ checkoutId, paymentMode: requestedMode }).unwrap();
        } catch (verifyErr) {
          // Some sessions are created in a different mode than local storage hints.
          // Retry once without forced mode so backend can auto-resolve it.
          if (requestedMode) {
            data = await verifyCheckoutSession({ checkoutId }).unwrap();
          } else {
            throw verifyErr;
          }
        }

        if (!isMounted) return;
        setResult(data);

        if (isInitial) {
          setLoading(false);
        }

        if (isPaidStatus(data?.status) || isFailedStatus(data?.status)) {
          stopPolling();
          return;
        }

        if (isPendingStatus(data?.status)) {
          if (!intervalId) {
            intervalId = setInterval(() => {
              if (!isMounted) return;
              pollCount += 1;
              if (pollCount > maxPolls) {
                stopPolling();
                return;
              }
              verify(false);
            }, pollMs);
          }
        }
      } catch (e) {
        if (!isMounted) return;

        // IMPORTANT: if backend/payments verification throws 500,
        // don't hard-fail the success page. Mark as pending and allow user to proceed.
        const searchParams =
          typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const checkoutIdFromQuery =
          (searchParams?.get('checkout_id') || '').trim() ||
          (searchParams?.get('checkoutId') || '').trim() ||
          (searchParams?.get('order') || '').trim() ||
          (searchParams?.get('reference') || '').trim();
        const checkoutIdFromStorage =
          localStorage.getItem('last_checkout_id') ||
          sessionStorage.getItem('last_checkout_id') ||
          readCookieValue('last_checkout_id') ||
          '';
        const fallbackCheckoutId = checkoutIdFromQuery || checkoutIdFromStorage;

        if (fallbackCheckoutId) {
          // Show a friendly message but keep page usable.
          setResult({
            checkout_id: fallbackCheckoutId,
            status: 'pending',
            payment_intent_id: null,
          });
          setError('We’re still confirming your payment. If this takes too long, you can track your order instead.');
          setLoading(false);
          stopPolling();
          return;
        }

        setError(getVerifyErrorMessage(e));
        setLoading(false);
        stopPolling();
      }
    };

    verify(true);
    return () => {
      isMounted = false;
      stopPolling();
    };
  }, [verifyCheckoutSession]);

  const normalizedStatus = result?.status?.toLowerCase() ?? '';
  const isPaid = normalizedStatus === 'paid' || normalizedStatus === 'succeeded' || normalizedStatus === 'success';
  const isPending = !isPaid && (normalizedStatus === 'unpaid' || normalizedStatus === 'active' || normalizedStatus === 'pending');
  const isPartnerStorefrontCheckout = effectiveCheckoutSourceSlug !== '';

  // -- LOADING --------------------------------------------------
  if (loading) {
    const loadingBrandText = partnerStorefrontConfig?.displayName
      || (effectiveCheckoutSourceSlug
        ? effectiveCheckoutSourceSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'AF Home');
    // When on a partner storefront but the API hasn't resolved the logo yet,
    // pass null explicitly so LoadingScreen hides the image (no AF Home flash).
    const loadingLogoSrc: string | null = partnerStorefrontConfig?.logoUrl
      ? `${partnerStorefrontConfig.logoUrl}${partnerStorefrontConfig.logoUrl.includes('?') ? '&' : '?'}v=${partnerStorefrontConfig.logoVersion || '1'}`
      : effectiveCheckoutSourceSlug ? null : '/Images/af_home_logo.png';
    return (
      <LoadingScreen
        tagline="Verifying your checkout"
        brandText={loadingBrandText}
        logoSrc={loadingLogoSrc}
        logoAlt={`${loadingBrandText} Logo`}
      />
    );
  }

  // -- ERROR -----------------------------------------------------
  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl border border-red-100 shadow-xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto"
            >
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </motion.div>

            <h1 className="text-xl font-black text-slate-800 mt-5">Verification Error</h1>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">{error}</p>

            <div className="mt-7 flex flex-col gap-2.5">
              <Link
                href={`${trackOrderBaseHref}?order=${encodeURIComponent(result?.checkout_id ?? '')}`}
                className="w-full py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-sky-200 text-slate-700 hover:text-sky-700 font-semibold text-sm text-center transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 17h4V5H2v12h3m9 0h4m0 0a2 2 0 100 4 2 2 0 000-4zm-10 0a2 2 0 100 4 2 2 0 000-4m10 0V12l-4-4h-4" />
                </svg>
                Track This Order
              </Link>
              <Link href={homeHref}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold text-sm text-center transition-all shadow-md shadow-sky-100 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    );
  }

  // -- RESULT ----------------------------------------------------
  const titleColor = isPaid ? 'text-green-700' : isPending ? 'text-sky-700' : 'text-red-700';
  const badgeClass = isPaid ? 'bg-green-100 text-green-700' : isPending ? 'bg-sky-100 text-sky-700' : 'bg-red-100 text-red-700';

  const title = isPaid ? 'Payment Successful!' : isPending ? 'Payment Pending' : 'Payment Failed';
  const subtitle = isPaid
    ? 'Your order is confirmed and is now being prepared.'
    : isPending
    ? "Your payment is still being processed. We're rechecking automatically."
    : 'Something went wrong with your payment. Please try again.';

  return (
    <>
      {!isPartnerStorefrontCheckout && <TopBar />}
      <Navbar
        initialCategories={[]}
        noBorder
        logoSrc={isPartnerStorefrontCheckout ? partnerLogoSrc : '/Images/af_home_logo.png'}
        logoAlt={isPartnerStorefrontCheckout ? partnerLogoAlt : 'AF Home'}
        logoHref={homeHref}
        hideSignIn={isPartnerStorefrontCheckout}
        hideNavLinks={isPartnerStorefrontCheckout}
        stickToTop={isPartnerStorefrontCheckout}
        showGuestCartWishlist={isPartnerStorefrontCheckout}
      />
      {!isPartnerStorefrontCheckout && <TrustBar />}
      <main className="min-h-screen bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-10 md:py-14 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-none overflow-hidden">

              {/* Status Header */}
              <div className="px-8 py-8 text-center border-b border-gray-100 dark:border-slate-700">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, delay: 0.1 }}
                  className={`h-20 w-20 rounded-full mx-auto flex items-center justify-center border ${isPaid ? 'bg-emerald-500 border-emerald-500' : isPending ? 'bg-sky-500 border-sky-500' : 'bg-red-500 border-red-500'}`}
              >
              {isPaid ? (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>
              ) : isPending ? (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              ) : (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              )}
            </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <h1 className={`text-2xl font-black mt-4 ${titleColor}`}>{title}</h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5 leading-relaxed">{subtitle}</p>
              </motion.div>
              </div>

              {/* Details */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="px-6 pb-6 pt-6 space-y-4"
              >
            {/* Transaction details */}
                <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-950 overflow-hidden divide-y divide-gray-100 dark:divide-slate-700">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Checkout ID</span>
                <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[190px]">
                  {result?.checkout_id ?? 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Status</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeClass}`}>
                  {result?.status ?? 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Payment Intent</span>
                <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[190px]">
                  {result?.payment_intent_id ?? 'N/A'}
                </span>
              </div>
            </div>

            {(result?.customer?.name || result?.customer?.email || result?.customer?.phone) && (
              <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-950 overflow-hidden divide-y divide-gray-100 dark:divide-slate-700">
                <div className="px-4 py-2.5">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Customer</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Name</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[190px]">
                    {result?.customer?.name ?? 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Email</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[190px]">
                    {result?.customer?.email ?? 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Phone</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[190px]">
                    {result?.customer?.phone ?? 'N/A'}
                  </span>
                </div>
              </div>
            )}

            {(result?.order_summary?.product_name || result?.order_summary?.description) && (
              <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-950 overflow-hidden divide-y divide-gray-100 dark:divide-slate-700">
                <div className="px-4 py-2.5">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Order Summary</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Item</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[190px]">
                    {result?.order_summary?.product_name ?? result?.order_summary?.description ?? 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Qty</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    {result?.order_summary?.quantity ?? 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Total</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    {typeof result?.order_summary?.amount === 'number' ? `PHP ${result.order_summary.amount.toLocaleString()}` : 'N/A'}
                  </span>
                </div>
              </div>
            )}

            {/* What's next - success only */}
            {isPaid && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  transition={{ delay: 0.4 }}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30"
                >
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-3">What happens next?</p>
                <div className="space-y-2.5">
                  {[
                    'Order confirmation will be sent to your email',
                    'Our team will prepare your items for delivery',
                    "You'll receive a shipping update soon",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-2.5 pt-1">
              <Link href={`${trackOrderBaseHref}?order=${encodeURIComponent(result?.checkout_id ?? '')}`}
                className="w-full py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-sky-200 text-slate-700 hover:text-sky-700 dark:border-slate-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-200 dark:hover:border-sky-800 font-semibold text-sm text-center transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 17h4V5H2v12h3m9 0h4m0 0a2 2 0 100 4 2 2 0 000-4zm-10 0a2 2 0 100 4 2 2 0 000-4m10 0V12l-4-4h-4" />
                </svg>
                Track This Order
              </Link>
              <Link href={homeHref}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm text-center transition-all flex items-center justify-center gap-2 dark:bg-sky-600 dark:hover:bg-sky-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                Back to Home
              </Link>
              {!isPartnerStorefrontCheckout && (
                <Link href="/orders"
                  className="w-full py-3 rounded-xl border border-dashed border-slate-300 bg-transparent hover:bg-slate-50 hover:border-slate-400 text-slate-600 hover:text-slate-800 dark:border-slate-600 dark:hover:bg-slate-900/40 dark:hover:text-slate-200 font-semibold text-sm text-center transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  View My Orders
                </Link>
              )}
            </div>

            {/* Footer */}
            <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5 pt-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              Secured by <span className="font-semibold text-gray-500 dark:text-gray-400 ml-0.5">PayMongo</span>  ·  AF Home
            </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default CheckoutSuccessPage;
