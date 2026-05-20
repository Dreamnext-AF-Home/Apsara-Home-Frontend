'use client';

import type { FormEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import TopBar from '@/components/layout/TopBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/landing-page/Footer';
import ProductPageWrapper from '@/components/product/ProductPageWrapper';
import PrimaryButton from '@/components/ui/buttons/PrimaryButton';
import { TRACK_STEPS } from '@/types/Data';
import formatDate from '@/helpers/FormatDate';
import formatPrice from '@/helpers/FormatPrice';
import { useConfirmOrderMutation, useLazyTrackGuestOrderQuery, useRefundOrderMutation } from '@/store/api/paymentApi';
import type { Category } from '@/store/api/categoriesApi';

const formatCourierLabel = (courier?: string | null) => {
  const normalized = String(courier ?? '').trim().toLowerCase();
  if (normalized === 'afhome') return 'AF Home';
  if (normalized === 'jnt') return 'J&T';
  if (normalized === 'xde') return 'XDE';
  if (normalized === 'zq') return 'Global Supplier';
  return courier ?? 'To be assigned';
};

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string; step: number }> = {
  pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30', dot: 'bg-amber-400', step: 1 },
  processing: { label: 'Processing', badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30', dot: 'bg-blue-500', step: 2 },
  packed: { label: 'Packed', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30', dot: 'bg-indigo-500', step: 2 },
  for_pickup: { label: 'For Pickup', badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30', dot: 'bg-violet-500', step: 3 },
  picked_up: { label: 'Picked Up', badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30', dot: 'bg-violet-500', step: 3 },
  shipped: { label: 'Shipped', badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30', dot: 'bg-violet-500', step: 3 },
  in_transit: { label: 'In Transit', badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30', dot: 'bg-violet-500', step: 3 },
  out_for_delivery: { label: 'Out for Delivery', badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/30', dot: 'bg-orange-500', step: 4 },
  delivered: { label: 'Delivered', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30', dot: 'bg-emerald-500', step: 5 },
  cancelled: { label: 'Cancelled', badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30', dot: 'bg-red-500', step: 0 },
  failed_delivery: { label: 'Failed Delivery', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30', dot: 'bg-rose-500', step: 0 },
  returned_to_sender: { label: 'Returned to Sender', badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/30', dot: 'bg-slate-500', step: 0 },
  refunded: { label: 'Refunded', badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/30', dot: 'bg-slate-500', step: 0 },
};

const getStatusConfig = (status: string) => {
  const normalized = status.toLowerCase();
  return STATUS_CONFIG[normalized] ?? {
    label: normalized.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/30',
    dot: 'bg-slate-500',
    step: 0,
  };
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null) {
    const maybeData = (error as { data?: { message?: string } }).data;
    if (typeof maybeData?.message === 'string' && maybeData.message.trim()) {
      return maybeData.message;
    }
  }

  return 'We could not find a matching order. Double-check your order number and email or mobile number.';
};

type PartnerShellConfig = {
  partnerSlug: string;
  displayName: string;
  logoUrl?: string | null;
  logoVersion?: string | null;
};

function PartnerTrackOrderFooter({ partnerName }: { partnerName: string }) {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400 sm:px-6 lg:px-8">
        Orders from <span className="font-semibold text-slate-800 dark:text-slate-200">{partnerName}</span> are still processed through AF Home.
      </div>
    </footer>
  );
}

type GuestTrackOrderPageProps = {
  initialCategories?: Category[];
  partnerShell?: PartnerShellConfig;
};

export default function GuestTrackOrderPage({ initialCategories = [], partnerShell }: GuestTrackOrderPageProps) {
  const searchParams = useSearchParams();
  const { status: authStatus } = useSession();
  const [lookupOrder, { data, isFetching }] = useLazyTrackGuestOrderQuery();
  const [confirmOrder, { isLoading: isConfirming }] = useConfirmOrderMutation();
  const [refundOrder, { isLoading: isRefunding }] = useRefundOrderMutation();
  const initialOrderNumber = searchParams.get('order') || (typeof window !== 'undefined' ? window.localStorage.getItem('last_checkout_id') || '' : '');
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewVideos, setReviewVideos] = useState<File[]>([]);
  const [refundReason, setRefundReason] = useState('');
  const [refundImages, setRefundImages] = useState<File[]>([]);
  const [refundVideos, setRefundVideos] = useState<File[]>([]);
  const resultSectionRef = useRef<HTMLElement | null>(null);

  const order = data?.order;
  const statusConfig = useMemo(() => getStatusConfig(order?.status ?? 'pending'), [order?.status]);
  const hasPendingRefundRequest = Boolean(order?.refund_requested_at || order?.refund_reason);
  const canShowOrderActions = order?.status === 'out_for_delivery' && !hasPendingRefundRequest;
  const isMemberSession = authStatus === 'authenticated';
  const isPartnerShell = Boolean(partnerShell);
  const partnerLogoSrc = partnerShell?.logoUrl
    ? `${partnerShell.logoUrl}${partnerShell.logoUrl.includes('?') ? '&' : '?'}v=${partnerShell.logoVersion || '1'}`
    : '/Images/af_home_logo.png';
  const heroBadgeLabel = isPartnerShell
    ? (isMemberSession ? 'Partner Member Order Tracking' : 'Partner Storefront Order Tracking')
    : (isMemberSession ? 'Member Order Tracking' : 'Guest Order Tracking');
  const heroTitle = isPartnerShell
    ? (isMemberSession
      ? `Track and manage your ${partnerShell?.displayName || 'partner storefront'} orders.`
      : `Track your ${partnerShell?.displayName || 'partner storefront'} order without logging in.`)
    : (isMemberSession
      ? 'Track and manage your AF Home orders.'
      : 'Track your AF Home order even without logging in.');
  const heroDescription = isPartnerShell
    ? (isMemberSession
      ? 'You are signed in as a member. You can use My Orders for full history, or manually track a specific order below.'
      : 'Enter your order number plus the email address or mobile number used during checkout. This partner storefront tracking page still uses AF Home order processing in the background.')
    : (isMemberSession
      ? 'You are signed in as a member. You can use My Orders for full history, or manually track a specific order below.'
      : 'Enter your order number plus the email address or mobile number you used during checkout. This page is for guest customers and non-member buyers who still want real-time order visibility.');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmitted(true);

    if (!orderNumber.trim() || !contact.trim()) {
      setError('Please enter your order number and the email or mobile number used during checkout.');
      return;
    }

    setError('');

    try {
      await lookupOrder({
        orderNumber: orderNumber.trim(),
        contact: contact.trim(),
      }).unwrap();

      requestAnimationFrame(() => {
        resultSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const content = (
    <>
      <div className="relative min-h-screen bg-[#faf8f5] text-slate-900 dark:bg-[#030712] dark:text-white">
      <main>
        <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-700 dark:bg-slate-950/35">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <span className="inline-flex rounded-full border border-orange-200 bg-white/90 dark:bg-white/10 dark:border-orange-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">
                  {heroBadgeLabel}
                </span>
                <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight text-slate-900 dark:text-white md:text-5xl">
                  {heroTitle}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-gray-300 md:text-base">
                  {heroDescription}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    'Use your checkout reference',
                    'Works with guest purchases',
                    'No account login required',
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4">
                      <div className="mb-2 h-8 w-8 rounded-xl bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m5 12 5 5L20 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-gray-200">{item}</p>
                    </div>
                  ))}
                </div>
                {isMemberSession ? (
                  <div className="mt-4">
                    <Link
                      href={isPartnerShell && partnerShell ? `/${partnerShell.partnerSlug}/orders` : '/orders'}
                      className="inline-flex items-center rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-300 dark:hover:bg-sky-900/40"
                    >
                      Open My Orders
                    </Link>
                  </div>
                ) : null}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-7"
              >
                <div className="mb-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-500 dark:text-orange-400">Track Order</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Find your order status</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-gray-400">
                    If you just checked out, your order number may already be prefilled here.
                  </p>
                  {isPartnerShell && partnerShell ? (
                    <div className="mt-3">
                      <Link
                        href={`/shop/${partnerShell.partnerSlug}/product`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      >
                        Back to shop
                      </Link>
                    </div>
                  ) : null}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">
                      Order Number
                    </label>
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(event) => setOrderNumber(event.target.value)}
                      placeholder="Example: cs_123456789"
                      className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm text-slate-800 dark:text-white outline-none transition focus:border-orange-500 focus:bg-white dark:focus:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">
                      Email or Mobile Number
                    </label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(event) => setContact(event.target.value)}
                      placeholder="Use the same contact detail from checkout"
                      className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm text-slate-800 dark:text-white outline-none transition focus:border-orange-500 focus:bg-white dark:focus:bg-gray-800"
                    />
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  {!error && hasSubmitted && !order && !isFetching && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-500/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-400">
                      No result yet. Try checking the exact contact details used in your checkout.
                    </div>
                  )}

                  <PrimaryButton
                    type="submit"
                    disabled={isFetching}
                    className="w-full"
                  >
                    {isFetching ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Checking order...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 17h4V5H2v12h3" />
                          <path d="M14 8h4l4 4v5h-4" />
                          <circle cx="7" cy="17" r="2" />
                          <circle cx="17" cy="17" r="2" />
                        </svg>
                        Track Order
                      </>
                    )}
                  </PrimaryButton>
                </form>

                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 dark:bg-gray-800 dark:border-white/10 px-4 py-3 text-xs leading-6 text-slate-500 dark:text-gray-400">
                  {isMemberSession ? (
                    <>
                      You are signed in. For full order history, open{' '}
                      <Link
                        href={isPartnerShell && partnerShell ? `/${partnerShell.partnerSlug}/orders` : '/orders'}
                        className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                      >
                        My Orders
                      </Link>
                      . You can still use this page to track a specific checkout reference.
                    </>
                  ) : (
                    <>
                      Signed-in members can still use their regular{' '}
                      <Link href="/orders" className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300">
                        My Orders
                      </Link>{' '}
                      page. This screen is mainly for guest and non-member purchases.
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section ref={resultSectionRef} className="container mx-auto px-4 py-10 md:py-12">
          {order ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-5 py-5 md:px-7">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-500 dark:text-orange-400">Order Located</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Order #{order.order_number}</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
                      Placed on <span className="font-semibold text-slate-700 dark:text-gray-200">{formatDate(order.created_at)}</span>
                      {' '}by <span className="font-semibold text-slate-700 dark:text-gray-200">{order.customer_name}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${statusConfig.badge}`}>
                      <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
                      {statusConfig.label}
                    </span>
                    {order.shipment_status ? (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 dark:bg-gray-800 dark:border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-gray-300">
                        Shipment: {getStatusConfig(order.shipment_status).label}
                      </span>
                    ) : null}
                    {order.status === 'out_for_delivery' ? (
                      <>
                        <Link
                          href="/orders"
                          className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                        >
                          Confirm Order
                        </Link>
                        <Link
                          href="/orders"
                          className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/40"
                        >
                          Refund
                        </Link>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 px-5 py-6 md:px-7 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="space-y-6">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5">
                    <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-gray-500">Tracking Progress</p>
                    {statusConfig.step > 0 ? (
                      <div>
                        <div className="relative flex items-start justify-between gap-2">
                          {TRACK_STEPS.map((step, index) => {
                            const stepNumber = index + 1;
                            const done = stepNumber <= statusConfig.step;
                            const active = stepNumber === statusConfig.step;

                            return (
                              <div key={step} className="relative flex flex-1 flex-col items-center gap-2">
                                {index < TRACK_STEPS.length - 1 && (
                                  <div className={`absolute left-1/2 top-3 h-0.5 w-full ${done ? 'bg-orange-400' : 'bg-slate-200 dark:bg-white/20'}`} />
                                )}
                                <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                                  done ? 'border-orange-500 bg-orange-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                }`}>
                                  {done ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white">
                                      <path d="m5 12 5 5L20 7" />
                                    </svg>
                                  ) : (
                                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                                  )}
                                </div>
                                <p className={`text-center text-[11px] font-semibold leading-tight ${done ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-gray-500'}`}>
                                  {step}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 text-sm text-slate-600 dark:text-gray-300">
                        This order is currently marked as <span className="font-semibold text-slate-800 dark:text-gray-200">{statusConfig.label}</span>.
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-gray-500">Items In This Order</p>
                    <div className="space-y-3">
                      {order.items.map((item) => {
                        const isRefunded = order.status === 'refunded';
                        const isBlurred = isRefunded;

                        return (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 ${
                              isBlurred ? 'opacity-80' : ''
                            }`}
                          >
                            <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100 dark:bg-gray-700">
                              <div className={isBlurred ? 'filter blur-sm scale-105' : ''}>
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  width={64}
                                  height={64}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-2">
                                <p className="truncate text-sm font-semibold text-slate-800 dark:text-gray-200">{item.name}</p>
                                {isRefunded && (
                                  <span className="shrink-0 inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                                    Pending request
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">Quantity: {item.quantity}</p>
                            </div>

                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {canShowOrderActions ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setConfirmOpen(true)}
                            className="inline-flex items-center rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                          >
                            Confirm Order
                          </button>
                          <button
                            type="button"
                            onClick={() => setRefundOpen(true)}
                            className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/40"
                          >
                            Refund
                          </button>
                        </>
                      ) : null}
                      {order.status === 'out_for_delivery' && hasPendingRefundRequest ? (
                        <span className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                          Pending refund request
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5">
                    <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-gray-500">Order Summary</p>
                    <div className="space-y-3 text-sm text-slate-600 dark:text-gray-300">
                      <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <span>{formatPrice(order.total - order.shipping_fee)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Shipping</span>
                        <span>{order.shipping_fee === 0 ? 'Free' : formatPrice(order.shipping_fee)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-3 text-base font-black text-slate-900 dark:text-white">
                        <span>Total</span>
                        <span className="text-orange-600 dark:text-orange-400">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                    <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-gray-500">Delivery Details</p>
                    <div className="space-y-4 text-sm text-slate-600 dark:text-gray-300">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-gray-500">Payment Method</p>
                        <p className="mt-1 font-semibold text-slate-800 dark:text-gray-200">{order.payment_method}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-gray-500">Shipping Address</p>
                        <p className="mt-1 leading-6 text-slate-700 dark:text-gray-300">{order.shipping_address}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-gray-500">Courier</p>
                        <p className="mt-1 font-semibold text-slate-800 dark:text-gray-200">{formatCourierLabel(order.courier)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-gray-500">Tracking Number</p>
                        <p className="mt-1 font-mono text-sm font-semibold text-slate-800 dark:text-gray-200">{order.tracking_no || 'Not available yet'}</p>
                      </div>
                      {order.shipped_at ? (
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-gray-500">Shipped At</p>
                          <p className="mt-1 font-semibold text-slate-800 dark:text-gray-200">{formatDate(order.shipped_at)}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-900/20 p-5 text-sm leading-6 text-orange-900 dark:text-orange-200">
                    Need help with this order? Keep your order number ready and contact support so the team can help you faster.
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-50 dark:bg-orange-500/20 text-orange-500 dark:text-orange-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M10 17h4V5H2v12h3" />
                  <path d="M14 8h4l4 4v5h-4" />
                  <circle cx="7" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">No tracked order yet</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-gray-400">
                Once you enter a valid order number and matching contact detail, your order summary and delivery progress will appear here.
              </p>
            </div>
          )}
        </section>
      </main>
      {confirmOpen && order ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="absolute inset-0" onClick={() => setConfirmOpen(false)} />
          <div className="relative z-[71] w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:bg-gray-800 dark:text-slate-300 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="M6 6 18 18" />
              </svg>
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Order</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">Add rating and review before confirming delivery.</p>
            {authStatus !== 'authenticated' ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                Login is required to submit confirmation from this page.
              </div>
            ) : null}
            <div className="mt-4 flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1;
                const active = rating >= value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    aria-label={`Rate ${value} star`}
                    className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
                      active
                        ? 'bg-sky-500/15 text-sky-600'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-5 w-5 transition-colors ${active ? 'text-sky-600 dark:text-sky-400' : 'text-slate-300 group-hover:text-sky-400 dark:text-slate-500'}`}
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M12 2.6l2.7 5.47 6.03.87-4.36 4.25 1.03 6.02L12 16.94 6.6 19.21l1.03-6.02L3.27 8.94l6.03-.87L12 2.6z" />
                    </svg>
                  </button>
                );
              })}
            </div>
            <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={4} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-gray-700 dark:text-white" placeholder="Write your review..." />
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {/* images */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">
                  Images
                </label>
                <label
                  className={`mt-2 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-3 py-4 text-center text-xs transition ${
                    reviewImages.length > 0
                      ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-900/20 dark:text-sky-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dropped = Array.from(e.dataTransfer.files ?? []).filter((file) => file.type.startsWith('image/'));
                    if (dropped.length) setReviewImages((prev) => [...prev, ...dropped]);
                  }}
                >
                  <span>Drag & drop images, or click to select (multiple)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const next = Array.from(e.target.files ?? []);
                      if (next.length) setReviewImages((prev) => [...prev, ...next]);
                    }}
                    className="hidden"
                  />
                </label>
                {reviewImages.length > 0 ? (
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-gray-400">{reviewImages.length} selected</p>
                ) : null}
              </div>

              {/* videos */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">
                  Videos
                </label>
                <label
                  className={`mt-2 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-3 py-4 text-center text-xs transition ${
                    reviewVideos.length > 0
                      ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-900/20 dark:text-sky-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dropped = Array.from(e.dataTransfer.files ?? []).filter((file) => file.type.startsWith('video/'));
                    if (dropped.length) setReviewVideos((prev) => [...prev, ...dropped]);
                  }}
                >
                  <span>Drag & drop videos, or click to select (multiple)</span>
                  <input
                    type="file"
                    multiple
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={(e) => {
                      const next = Array.from(e.target.files ?? []);
                      if (next.length) setReviewVideos((prev) => [...prev, ...next]);
                    }}
                    className="hidden"
                  />
                </label>
                {reviewVideos.length > 0 ? (
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-gray-400">{reviewVideos.length} selected</p>
                ) : null}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button>
              <button
                type="button"
                disabled={authStatus !== 'authenticated' || rating < 1 || review.trim().length < 3 || isConfirming}
                onClick={async () => {
                  try {
                    await confirmOrder({ id: order.id, rating, review: review.trim(), reviewImages, reviewVideos }).unwrap();
                    setConfirmOpen(false);
                    setRating(0);
                    setReview('');
                    setReviewImages([]);
                    setReviewVideos([]);
                  } catch {
                    return;
                  }
                }}
                className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {isConfirming ? 'Submitting...' : 'Submit Confirmation'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {refundOpen && order ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="absolute inset-0" onClick={() => setRefundOpen(false)} />
            <div className="relative z-[71] w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-0 overflow-hidden dark:border-slate-700 dark:bg-gray-800">
            {/* Image header (matches refund.png) */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/25" />
            </div>

            <div className="p-6">
              <button
                type="button"
                onClick={() => setRefundOpen(false)}
                aria-label="Close"
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:bg-gray-800 dark:text-slate-300 dark:hover:bg-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6 18 18" />
                </svg>
              </button>

              <h3 className="mt-0 text-lg font-bold text-slate-900 dark:text-white">Refund Request</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">Provide a reason and optional image/video proof.</p>

              {authStatus !== 'authenticated' ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                  Login is required to submit refund from this page.
                </div>
              ) : null}

              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={4}
                className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-gray-700 dark:text-white"
                placeholder="Reason for refund..."
              />

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">Images</label>
                  <label
                    className={`mt-2 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-3 py-4 text-center text-xs transition ${
                      refundImages.length > 0
                        ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-rose-300 dark:border-slate-700 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dropped = Array.from(e.dataTransfer.files ?? []).filter((file) => file.type.startsWith('image/'));
                      if (dropped.length) setRefundImages((prev) => [...prev, ...dropped]);
                    }}
                  >
                    <span>Drag & drop images, or click to select (multiple)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const next = Array.from(e.target.files ?? []);
                        if (next.length) setRefundImages((prev) => [...prev, ...next]);
                      }}
                      className="hidden"
                    />
                  </label>
                  {refundImages.length > 0 ? (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-gray-400">{refundImages.length} selected</p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">Videos</label>
                  <label
                    className={`mt-2 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-3 py-4 text-center text-xs transition ${
                      refundVideos.length > 0
                        ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-rose-300 dark:border-slate-700 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dropped = Array.from(e.dataTransfer.files ?? []).filter((file) => file.type.startsWith('video/'));
                      if (dropped.length) setRefundVideos((prev) => [...prev, ...dropped]);
                    }}
                  >
                    <span>Drag & drop videos, or click to select (multiple)</span>
                    <input
                      type="file"
                      multiple
                      accept="video/mp4,video/quicktime,video/webm"
                      onChange={(e) => {
                        const next = Array.from(e.target.files ?? []);
                        if (next.length) setRefundVideos((prev) => [...prev, ...next]);
                      }}
                      className="hidden"
                    />
                  </label>
                  {refundVideos.length > 0 ? (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-gray-400">{refundVideos.length} selected</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRefundOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={authStatus !== 'authenticated' || refundReason.trim().length < 3 || isRefunding}
                  onClick={async () => {
                    try {
                      await refundOrder({ id: order.id, reason: refundReason.trim(), refundImages, refundVideos }).unwrap();
                      setRefundOpen(false);
                      setRefundReason('');
                      setRefundImages([]);
                      setRefundVideos([]);
                    } catch {
                      return;
                    }
                  }}
                  className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {isRefunding ? 'Submitting...' : 'Submit Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
    </>
  );

  if (isPartnerShell && partnerShell) {
    return (
      <ProductPageWrapper
        initialCategories={initialCategories}
        hideTopBar
        logoSrc={partnerLogoSrc}
        logoAlt={partnerShell.displayName}
        logoHref={`/shop/${partnerShell.partnerSlug}/product`}
        // show Sign in button on guest track order pages
        hideSignIn={false}

        hideNavLinks
        stickToTop
        showGuestCartWishlist
      >
        {content}
        <PartnerTrackOrderFooter partnerName={partnerShell.displayName} />
      </ProductPageWrapper>
    );
  }

  return (
    <>
      <TopBar />
      <Navbar initialCategories={initialCategories} />
      {content}
      <Footer />
    </>
  );
}
