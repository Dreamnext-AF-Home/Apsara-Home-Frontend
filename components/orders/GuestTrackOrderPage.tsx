'use client';

import type { FormEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/landing-page/Footer';
import ProductPageWrapper from '@/components/product/ProductPageWrapper';
import PrimaryButton from '@/components/ui/buttons/PrimaryButton';
import { TRACK_STEPS } from '@/types/Data';
import formatDate from '@/helpers/FormatDate';
import formatPrice from '@/helpers/FormatPrice';
import { useLazyTrackGuestOrderQuery } from '@/store/api/paymentApi';
import type { Category } from '@/store/api/categoriesApi';

const formatCourierLabel = (courier?: string | null) => {
  const normalized = String(courier ?? '').trim().toLowerCase();
  if (normalized === 'afhome') return 'AF Home';
  if (normalized === 'jnt') return 'J&T';
  if (normalized === 'xde') return 'XDE';
  if (normalized === 'zq') return 'ZQ';
  return courier ?? 'To be assigned';
};

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string; step: number }> = {
  pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400', step: 1 },
  processing: { label: 'Processing', badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', step: 2 },
  packed: { label: 'Packed', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', step: 2 },
  for_pickup: { label: 'For Pickup', badge: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500', step: 3 },
  picked_up: { label: 'Picked Up', badge: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500', step: 3 },
  shipped: { label: 'Shipped', badge: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500', step: 3 },
  in_transit: { label: 'In Transit', badge: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500', step: 3 },
  out_for_delivery: { label: 'Out for Delivery', badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', step: 4 },
  delivered: { label: 'Delivered', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', step: 5 },
  cancelled: { label: 'Cancelled', badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', step: 0 },
  failed_delivery: { label: 'Failed Delivery', badge: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', step: 0 },
  returned_to_sender: { label: 'Returned to Sender', badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-500', step: 0 },
  refunded: { label: 'Refunded', badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-500', step: 0 },
};

const getStatusConfig = (status: string) => {
  const normalized = status.toLowerCase();
  return STATUS_CONFIG[normalized] ?? {
    label: normalized.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
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
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
        Orders from <span className="font-semibold text-slate-800">{partnerName}</span> are still processed through AF Home.
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
  const [lookupOrder, { data, isFetching }] = useLazyTrackGuestOrderQuery();
  const initialOrderNumber = searchParams.get('order') || (typeof window !== 'undefined' ? window.localStorage.getItem('last_checkout_id') || '' : '');
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const resultSectionRef = useRef<HTMLElement | null>(null);

  const order = data?.order;
  const statusConfig = useMemo(() => getStatusConfig(order?.status ?? 'pending'), [order?.status]);
  const isPartnerShell = Boolean(partnerShell);
  const partnerLogoSrc = partnerShell?.logoUrl
    ? `${partnerShell.logoUrl}${partnerShell.logoUrl.includes('?') ? '&' : '?'}v=${partnerShell.logoVersion || '1'}`
    : '/Images/af_home_logo.png';
  const heroBadgeLabel = isPartnerShell ? 'Partner Storefront Order Tracking' : 'Guest Order Tracking';
  const heroTitle = isPartnerShell
    ? `Track your ${partnerShell?.displayName || 'partner storefront'} order without logging in.`
    : 'Track your AF Home order even without logging in.';
  const heroDescription = isPartnerShell
    ? 'Enter your order number plus the email address or mobile number used during checkout. This partner storefront tracking page still uses AF Home order processing in the background.'
    : 'Enter your order number plus the email address or mobile number you used during checkout. This page is for guest customers and non-member buyers who still want real-time order visibility.';

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
      <div 
        className="fixed inset-0 -z-50 track-order-background"
        style={{ 
          backgroundColor: '#faf8f5',
          background: '#faf8f5'
        } as React.CSSProperties}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          html.dark .track-order-background {
            background-color: #030712 !important;
            background: #030712 !important;
          }
        `
      }} />
      <div className="relative min-h-screen text-slate-900 dark:text-white">
      <main>
        <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-700">
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
                  Signed-in members can still use their regular <Link href="/orders" className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300">My Orders</Link> page. This screen is mainly for guest and non-member purchases.
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
                  </div>
                </div>
              </div>

              <div className="grid gap-6 px-5 py-6 md:px-7 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="space-y-6">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5">
                    <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-gray-500">Tracking Progress</p>
                    {statusConfig.step > 0 ? (
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
                    ) : (
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 text-sm text-slate-600 dark:text-gray-300">
                        This order is currently marked as <span className="font-semibold text-slate-800 dark:text-gray-200">{statusConfig.label}</span>.
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-gray-500">Items In This Order</p>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
                          <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100 dark:bg-gray-700">
                            <Image src={item.image} alt={item.name} width={64} height={64} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-gray-200">{item.name}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">Quantity: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      ))}
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
        hideSignIn
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
