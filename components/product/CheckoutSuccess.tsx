'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLazyVerifyCheckoutSessionQuery } from '@/store/api/paymentApi';

function CheckoutSuccessPage() {
  const [verifyCheckoutSession] = useLazyVerifyCheckoutSessionQuery();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    checkout_id: string;
    status: string | null;
    payment_intent_id: string | null;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    let pollCount = 0;
    const maxPolls = 24; // up to ~2 minutes
    const pollMs = 5000;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const normalizeStatus = (status: string | null | undefined) => typeof status === 'string' ? status.toLowerCase() : '';
    const isPaidStatus = (status: string | null | undefined) => ['paid', 'succeeded', 'success'].includes(normalizeStatus(status));
    const isPendingStatus = (status: string | null | undefined) => ['active', 'unpaid', 'pending'].includes(normalizeStatus(status));
    const isFailedStatus = (status: string | null | undefined) => ['failed', 'cancelled', 'expired'].includes(normalizeStatus(status));

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const verify = async (isInitial = false) => {
      const checkoutId = localStorage.getItem('last_checkout_id');
      if (!checkoutId) {
        if (!isMounted) return;
        setError('No checkout reference found in local storage.');
        setLoading(false);
        stopPolling();
        return;
      }
      try {
        const data = await verifyCheckoutSession(checkoutId).unwrap();
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
        setError(e instanceof Error ? e.message : 'Verification failed');
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

  // ── LOADING ──────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/40 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-5"
        >
          {/* Spinner with logo */}
          <div className="relative h-24 w-24 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
                <span className="text-white font-black text-sm">AF</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-slate-800 font-bold text-lg">Verifying Payment</p>
            <p className="text-slate-400 text-sm mt-1">Please wait while we confirm your transaction...</p>
          </div>

          {/* Bouncing dots */}
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-orange-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </motion.div>
      </main>
    );
  }

  // ── ERROR ─────────────────────────────────────────────────────
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
              <Link href="/"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-sm text-center transition-all shadow-md shadow-orange-100 flex items-center justify-center gap-2"
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

  // ── RESULT ────────────────────────────────────────────────────
  const bgClass = isPaid
    ? 'from-green-50/60 to-teal-50/30'
    : isPending
    ? 'from-amber-50/60 to-orange-50/30'
    : 'from-red-50/50 to-slate-50';

  const iconBg = isPaid ? 'bg-green-500' : isPending ? 'bg-amber-500' : 'bg-red-500';
  const headerBg = isPaid ? 'from-green-50 to-white' : isPending ? 'from-amber-50 to-white' : 'from-red-50 to-white';
  const titleColor = isPaid ? 'text-green-700' : isPending ? 'text-amber-700' : 'text-red-700';
  const badgeClass = isPaid ? 'bg-green-100 text-green-700' : isPending ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';

  const title = isPaid ? 'Payment Successful!' : isPending ? 'Payment Pending' : 'Payment Failed';
  const subtitle = isPaid
    ? 'Your order is confirmed and is now being prepared.'
    : isPending
    ? "Your payment is still being processed. We're rechecking automatically."
    : 'Something went wrong with your payment. Please try again.';

  return (
    <main className={`min-h-screen bg-gradient-to-br ${bgClass} flex items-center justify-center p-4`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">

          {/* Status Header */}
          <div className={`px-8 py-8 text-center bg-gradient-to-b ${headerBg}`}>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, delay: 0.1 }}
              className={`h-20 w-20 rounded-full mx-auto flex items-center justify-center shadow-lg ${iconBg}`}
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
              <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">{subtitle}</p>
            </motion.div>
          </div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="px-6 pb-6 space-y-4"
          >
            {/* Transaction details */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden divide-y divide-slate-100">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Checkout ID</span>
                <span className="text-xs font-mono font-semibold text-slate-700 truncate max-w-[190px]">
                  {result?.checkout_id ?? 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeClass}`}>
                  {result?.status ?? 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Payment Intent</span>
                <span className="text-xs font-mono font-semibold text-slate-700 truncate max-w-[190px]">
                  {result?.payment_intent_id ?? 'N/A'}
                </span>
              </div>
            </div>

            {/* What's next — success only */}
            {isPaid && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border border-green-100 bg-green-50/70 p-4"
              >
                <p className="text-xs font-bold text-green-700 mb-3">What happens next?</p>
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
                      <p className="text-xs text-green-700 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-2.5 pt-1">
              <Link href={`/track-order?order=${encodeURIComponent(result?.checkout_id ?? '')}`}
                className="w-full py-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 font-semibold text-sm text-center transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 17h4V5H2v12h3m9 0h4m0 0a2 2 0 100 4 2 2 0 000-4zm-10 0a2 2 0 100 4 2 2 0 000-4m10 0V12l-4-4h-4" />
                </svg>
                Track This Order
              </Link>
              <Link href="/"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-sm text-center transition-all shadow-md shadow-orange-100 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                Back to Home
              </Link>
              <Link href="/orders"
                className="w-full py-3 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600 font-semibold text-sm text-center transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                View My Orders
              </Link>
            </div>

            {/* Footer */}
            <p className="text-center text-[11px] text-slate-300 flex items-center justify-center gap-1.5 pt-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              Secured by <span className="font-semibold text-slate-400 ml-0.5">PayMongo</span> · AF Home
            </p>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}

export default CheckoutSuccessPage;
