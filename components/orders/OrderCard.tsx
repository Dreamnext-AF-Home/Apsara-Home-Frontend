'use client';

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "./Icons";
import Link from "next/link";
import { TRACK_STEPS } from "@/types/Data";
import formatDate from "@/helpers/FormatDate";
import formatPrice from "@/helpers/FormatPrice";
import { useConfirmOrderMutation, useRefundOrderMutation } from "@/store/api/paymentApi";

type OrderStatus = 'pending' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';

type OrderItem = {
    id: number;
    product_id?: number | null;
    name: string;
    image: string;
    quantity: number;
    price: number;
    selected_color?: string | null;
    selected_size?: string | null;
    selected_type?: string | null;
};

type Order = {
    id: number;
    order_number: string;
    status: OrderStatus;
    items: OrderItem[];
    total: number;
    shipping_fee: number;
    payment_method: string;
    shipping_address: string;
    courier?: string | null;
    tracking_no?: string | null;
    shipment_status?: string | null;
    shipped_at?: string | null;
    refund_reason?: string | null;
    refund_image_urls?: string[];
    refund_video_urls?: string[];
    refund_requested_at?: string | null;
    created_at: string;
    estimated_delivery?: string | null;
};

const copyText = async (value: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new Error('Clipboard is not available in this browser.');
    }

    await navigator.clipboard.writeText(value);
};

const formatCourierLabel = (courier?: string | null) => {
    const normalized = String(courier ?? '').trim().toLowerCase();
    if (normalized === 'afhome') return 'AF Home';
    if (normalized === 'jnt') return 'J&T';
    if (normalized === 'xde') return 'XDE';
    if (normalized === 'zq') return 'Global Supplier';
    return courier ?? '';
};

const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

const buildProductHref = (item: OrderItem) => {
    const productId = Number(item.product_id ?? 0);
    if (!productId) return null;
    const slug = slugify(item.name || 'product');
    return `/product/${slug}-i${productId}`;
};

const getOrderImageSrc = (src?: string | null) => {
    const value = String(src ?? '').trim();
    return value || '/Images/HeroSection/sofas.jpg';
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; badge: string; dot: string; step: number }> = {
    pending: { label: 'Pending', badge: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', dot: 'bg-amber-400 dark:bg-amber-500', step: 1 },
    processing: { label: 'Processing', badge: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', dot: 'bg-blue-500 dark:bg-blue-600', step: 2 },
    packed: { label: 'Packed', badge: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800', dot: 'bg-indigo-500 dark:bg-indigo-600', step: 3 },
    shipped: { label: 'Shipped', badge: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800', dot: 'bg-violet-500 dark:bg-violet-600', step: 3 },
    out_for_delivery: { label: 'Out for Delivery', badge: 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800', dot: 'bg-sky-500 dark:bg-sky-600', step: 4 },
    delivered: { label: 'Delivered', badge: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500 dark:bg-emerald-600', step: 5 },
    cancelled: { label: 'Cancelled', badge: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800', dot: 'bg-red-400 dark:bg-red-500', step: 0 },
    refunded: { label: 'Refunded', badge: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700', dot: 'bg-gray-400 dark:bg-gray-600', step: 0 },
}

interface OrderCardProps {
    order: Order
}

const OrderCard = ({ order }: OrderCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewVideos, setReviewVideos] = useState<File[]>([]);
  const [isImageDragActive, setIsImageDragActive] = useState(false);
  const [isVideoDragActive, setIsVideoDragActive] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundImages, setRefundImages] = useState<File[]>([]);
  const [refundVideos, setRefundVideos] = useState<File[]>([]);
  const [isRefundImageDragActive, setIsRefundImageDragActive] = useState(false);
  const [isRefundVideoDragActive, setIsRefundVideoDragActive] = useState(false);
  const [confirmOrder, { isLoading: isConfirming }] = useConfirmOrderMutation();
  const [refundOrder, { isLoading: isRefunding }] = useRefundOrderMutation();
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const previewItems = order.items.slice(0, 3);
  const extraCount = order.items.length - 3;
  const isActive = !['cancelled', 'refunded', 'delivered'].includes(order.status);
  const hasShipmentInfo = Boolean(order.courier || order.tracking_no || order.shipment_status);
  const isShipmentCancelled = order.shipment_status === 'cancelled';
  const canConfirm = order.status === 'out_for_delivery';
  const hasPendingRefundRequest = Boolean(order.refund_requested_at || order.refund_reason);
  const isRefunded = order.status === 'refunded';

  const mergeUniqueFiles = (existing: File[], incoming: File[]) => {
    const merged = [...existing];
    for (const file of incoming) {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      const exists = merged.some((item) => `${item.name}-${item.size}-${item.lastModified}` === key);
      if (!exists) merged.push(file);
    }
    return merged;
  };

  const getSelectedOptions = (item: OrderItem) => {
    return [
      item.selected_color ? `Color: ${item.selected_color}` : null,
      item.selected_size ? `Size: ${item.selected_size}` : null,
      item.selected_type ? `Type: ${item.selected_type}` : null,
    ].filter(Boolean) as string[];
  };

  return (
    <motion.div
      layout
      className={`rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-800 overflow-hidden transition-all duration-200 ${
        isRefunded
          ? 'opacity-90 saturate-75'
          : 'hover:border-sky-200 dark:hover:border-sky-700'
      }`}
    >
      {/* Card header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-500 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Icon.Package className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Order #{order.order_number}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          {isShipmentCancelled && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 dark:bg-red-500" />
              Shipment Cancelled
            </span>
          )}
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
          >
            <Icon.ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Items preview */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {previewItems.map((item) => {
              const href = buildProductHref(item);
              const imageClassName = `h-10 w-10 rounded-lg border-2 border-white dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 ${
                href ? 'transition-transform hover:scale-105' : ''
              }`;

              return href ? (
                <Link
                  key={item.id}
                  href={href}
                  className={imageClassName}
                >
                  <img src={getOrderImageSrc(item.image)} alt={item.name || 'Order item'} className="h-full w-full object-cover" loading="lazy" />
                </Link>
              ) : (
                <div
                  key={item.id}
                  className={imageClassName}
                >
                  <img src={getOrderImageSrc(item.image)} alt={item.name || 'Order item'} className="h-full w-full object-cover" loading="lazy" />
                </div>
              );
            })}
            {extraCount > 0 && (
              <div className="h-10 w-10 rounded-lg border-2 border-white dark:border-gray-700 bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">+{extraCount}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {(() => {
              const firstItem = order.items[0];
              const href = firstItem ? buildProductHref(firstItem) : null;
              return (
                <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
                  {href ? (
                    <Link
                      href={href}
                      className="font-semibold text-slate-800 dark:text-gray-100 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                    >
                      {firstItem?.name}
                    </Link>
                  ) : (
                    <span>{firstItem?.name}</span>
                  )}
                  {order.items.length > 1 && (
                    <span className="text-gray-400 dark:text-gray-500"> +{order.items.length - 1} more item{order.items.length > 2 ? 's' : ''}</span>
                  )}
                </p>
              );
            })()}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{order.items.reduce((s, i) => s + i.quantity, 0)} item(s)</p>
          </div>
          <div className="text-right shrink-0">
            {isRefunded && (
              <p className="mb-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">Pending request</p>
            )}
            <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(order.total)}</p>
            {order.shipping_fee === 0
              ? <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Free shipping</p>
              : <p className="text-[11px] text-gray-400 dark:text-gray-500">+{formatPrice(order.shipping_fee)} shipping</p>
            }
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {order.status === 'delivered' && (
            <button type="button" className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 dark:hover:bg-sky-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors">
              <Icon.RefreshCw className="h-3.5 w-3.5" /> Reorder
            </button>
          )}
          {canConfirm && !hasPendingRefundRequest && (
            <>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
              >
                <Icon.Check className="h-3.5 w-3.5" /> Confirm Order
              </button>
              <button
                type="button"
                onClick={() => setRefundOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40"
              >
                <Icon.RefreshCw className="h-3.5 w-3.5" /> Refund
              </button>
            </>
          )}
          {canConfirm && hasPendingRefundRequest && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              Refund request pending
            </span>
          )}
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-sky-200 dark:hover:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:text-sky-600 dark:hover:text-sky-400 px-3.5 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 transition-colors"
          >
            {expanded ? 'Hide Details' : 'View Details'} <Icon.ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
          </button>
          {order.status === 'pending' && (
            <button type="button" className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 px-3.5 py-2 text-xs font-semibold text-red-500 dark:text-red-400 transition-colors">
              <Icon.X className="h-3.5 w-3.5" /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 dark:border-slate-700 px-5 py-4 space-y-4 bg-gray-50/50 dark:bg-gray-700/40">

              {/* Tracking steps */}
              {isShipmentCancelled ? (
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400">Shipment Update</p>
                  <p className="mt-1 text-sm font-semibold text-red-700 dark:text-red-300">Courier booking was cancelled.</p>
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    Your order is still in the system, but the courier shipment was cancelled and may need to be rebooked by the seller.
                  </p>
                </div>
              ) : order.status !== 'cancelled' && order.status !== 'refunded' && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Order Tracking</p>
                  <div className="relative flex items-start justify-between gap-1">
                    {TRACK_STEPS.map((step, i) => {
                      const stepNum = i + 1;
                      const currentStep = cfg.step;
                      const done = stepNum <= currentStep;
                      const active = stepNum === currentStep;
                      return (
                        <div key={step} className="flex-1 flex flex-col items-center gap-1.5 relative">
                          {i < TRACK_STEPS.length - 1 && (
                            <div className={`absolute top-3 left-1/2 w-full h-0.5 ${done ? 'bg-sky-400 dark:bg-sky-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
                          )}
                          <div className={`relative z-10 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            done
                              ? 'bg-sky-500 dark:bg-sky-600 border-sky-500 dark:border-sky-600'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                          } ${active ? 'ring-2 ring-sky-200 dark:ring-sky-900/50 ring-offset-1' : ''}`}>
                            {done
                              ? <Icon.Check className="h-3 w-3 text-white" />
                              : <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                            }
                          </div>
                          <p className={`text-center text-[10px] font-medium leading-tight ${done ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400 dark:text-gray-500'}`}>
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  {order.estimated_delivery && (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Estimated delivery: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatDate(order.estimated_delivery)}</span>
                    </p>
                  )}
                  {order.status === 'out_for_delivery' && !hasPendingRefundRequest && (
                    <button
                      type="button"
                      onClick={() => setConfirmOpen(true)}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
                    >
                      Confirm Order
                    </button>
                  )}
                  {order.status === 'out_for_delivery' && hasPendingRefundRequest && (
                    <p className="mt-3 inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                      Pending refund request
                    </p>
                  )}
                </div>
              )}

              {/* All items */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Items Ordered</p>
                <div className="space-y-2">
                  {order.items.map((item) => {
                    const href = buildProductHref(item);
                    const imageClassName = `h-12 w-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 ${
                      href ? 'transition-transform hover:scale-105' : ''
                    }`;

                    return (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-gray-900/50 px-3 py-2.5">
                        {href ? (
                          <Link
                            href={href}
                            className={imageClassName}
                          >
                            <img src={getOrderImageSrc(item.image)} alt={item.name || 'Order item'} className="h-full w-full object-cover" loading="lazy" />
                          </Link>
                        ) : (
                          <div className={imageClassName}>
                            <img src={getOrderImageSrc(item.image)} alt={item.name || 'Order item'} className="h-full w-full object-cover" loading="lazy" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                            {href ? (
                              <Link
                                href={href}
                                className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                              >
                                {item.name}
                              </Link>
                            ) : (
                              <span>{item.name}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Qty: {item.quantity}</p>
                        {getSelectedOptions(item).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {getSelectedOptions(item).map((option) => (
                              <span
                                key={option}
                                className="inline-flex items-center rounded-full border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/30 px-2.5 py-1 text-[11px] font-medium text-sky-700 dark:text-sky-400"
                              >
                                {option}
                              </span>
                            ))}
                          </div>
                        )}
                        </div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 shrink-0">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-gray-900/50 px-4 py-3 space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Order Summary</p>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.total - order.shipping_fee)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Shipping</span>
                    <span className={order.shipping_fee === 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                      {order.shipping_fee === 0 ? 'Free' : formatPrice(order.shipping_fee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white pt-1 border-t border-gray-100 dark:border-slate-700">
                    <span>Total</span>
                    <span className="text-sky-600 dark:text-sky-400">{formatPrice(order.total)}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-gray-900/50 px-4 py-3 space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Delivery Info</p>
                  <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Icon.MapPin className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{order.shipping_address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Icon.CreditCard className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                    <span>{order.payment_method}</span>
                  </div>
                </div>
              </div>

              {hasShipmentInfo && (
                <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-900/20 px-4 py-3 space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">Shipment Details</p>
                  {order.courier && (
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Courier: <span className="font-semibold">{formatCourierLabel(order.courier)}</span>
                    </p>
                  )}
                  {order.shipment_status && (
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Shipment Status: <span className="font-semibold capitalize">{order.shipment_status.replace(/_/g, ' ')}</span>
                    </p>
                  )}
                  {order.tracking_no && (
                    <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-gray-900/50 px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">Tracking Number</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <p className="min-w-0 flex-1 break-all font-mono text-sm font-semibold text-gray-900 dark:text-gray-200">{order.tracking_no}</p>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await copyText(order.tracking_no as string);
                            } catch {
                              return;
                            }
                          }}
                          className="shrink-0 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 text-[11px] font-semibold text-teal-700 dark:text-teal-400 transition hover:bg-teal-100 dark:hover:bg-teal-900/50"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                  {order.shipped_at && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Shipped at: <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(order.shipped_at)}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {confirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="absolute inset-0" onClick={() => setConfirmOpen(false)} />
          <div className="relative z-[71] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-400">Confirm Delivery</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Rate your order</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">Please rate and review this product before confirming.</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-gray-400 hover:border-emerald-200 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400"
              >
                Close
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="mt-5 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-400">Rating</p>
                  <p className="text-[11px] text-slate-400 dark:text-gray-500">Tap a star to rate</p>
                </div>
                <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                  {rating > 0 ? `${rating}/5` : 'No rating'}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2.5">
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1;
                  const active = rating >= value;
                  return (
                    <motion.button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.96 }}
                      className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                        active
                          ? 'border-sky-300 dark:border-sky-700 bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-700 text-slate-300 dark:text-gray-600'
                      }`}
                      aria-label={`Rate ${value} star`}
                    >
                      <span
                        className={`absolute inset-0 rounded-2xl opacity-0 transition ${
                          active ? 'bg-sky-200/60 dark:bg-sky-500/30 blur-md opacity-70' : ''
                        }`}
                      />
                      <svg
                        viewBox="0 0 24 24"
                        className={`relative h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                          active ? 'text-sky-500 dark:text-sky-400' : 'text-slate-300 dark:text-gray-600'
                        }`}
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M12 2.6l2.7 5.47 6.03.87-4.36 4.25 1.03 6.02L12 16.94 6.6 19.21l1.03-6.02L3.27 8.94l6.03-.87L12 2.6z" />
                      </svg>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-gray-400">Review</p>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                placeholder="Share your experience..."
                className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-slate-700 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-sky-300 dark:focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-gray-400">Image (optional)</p>
                <label
                  className={`mt-2 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-3 py-4 text-center text-xs transition ${
                    isImageDragActive
                      ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-600 dark:bg-sky-900/20 dark:text-sky-300'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-sky-300 dark:border-slate-600 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsImageDragActive(true);
                  }}
                  onDragLeave={() => setIsImageDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsImageDragActive(false);
                    const dropped = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'));
                    if (dropped.length > 0) {
                      setReviewImages((current) => mergeUniqueFiles(current, dropped));
                    }
                  }}
                >
                  Drag & drop images here, or click to select
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => setReviewImages((current) => mergeUniqueFiles(current, Array.from(e.target.files ?? [])))}
                    className="hidden"
                  />
                </label>
                {reviewImages.length > 0 ? <p className="mt-1 text-[11px] text-slate-500 dark:text-gray-400">{reviewImages.length} image(s) selected</p> : null}
                {reviewImages.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {reviewImages.map((file, index) => (
                      <div key={`${file.name}-${file.size}-${file.lastModified}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] dark:border-slate-600 dark:bg-slate-800">
                        <span className="truncate pr-2 text-slate-600 dark:text-slate-300">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setReviewImages((current) => current.filter((_, i) => i !== index))}
                          className="shrink-0 rounded-md border border-slate-200 px-2 py-0.5 font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-gray-400">Video (optional)</p>
                <label
                  className={`mt-2 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-3 py-4 text-center text-xs transition ${
                    isVideoDragActive
                      ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-600 dark:bg-sky-900/20 dark:text-sky-300'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-sky-300 dark:border-slate-600 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsVideoDragActive(true);
                  }}
                  onDragLeave={() => setIsVideoDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsVideoDragActive(false);
                    const dropped = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('video/'));
                    if (dropped.length > 0) {
                      setReviewVideos((current) => mergeUniqueFiles(current, dropped));
                    }
                  }}
                >
                  Drag & drop videos here, or click to select
                  <input
                    type="file"
                    multiple
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={(e) => setReviewVideos((current) => mergeUniqueFiles(current, Array.from(e.target.files ?? [])))}
                    className="hidden"
                  />
                </label>
                {reviewVideos.length > 0 ? <p className="mt-1 text-[11px] text-slate-500 dark:text-gray-400">{reviewVideos.length} video(s) selected</p> : null}
                {reviewVideos.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {reviewVideos.map((file, index) => (
                      <div key={`${file.name}-${file.size}-${file.lastModified}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] dark:border-slate-600 dark:bg-slate-800">
                        <span className="truncate pr-2 text-slate-600 dark:text-slate-300">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setReviewVideos((current) => current.filter((_, i) => i !== index))}
                          className="shrink-0 rounded-md border border-slate-200 px-2 py-0.5 font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-gray-400 hover:border-sky-200 dark:hover:border-sky-700 hover:text-sky-700 dark:hover:text-sky-400"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rating < 1 || review.trim().length === 0 || isConfirming}
                onClick={async () => {
                  try {
                    await confirmOrder({
                      id: order.id,
                      rating,
                      review: review.trim(),
                      reviewImages,
                      reviewVideos,
                    }).unwrap();
                    setConfirmOpen(false);
                    setRating(0);
                    setReview('');
                    setReviewImages([]);
                    setReviewVideos([]);
                  } catch {
                    return;
                  }
                }}
                className="rounded-full bg-sky-500 dark:bg-sky-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 dark:hover:bg-sky-700 disabled:opacity-60"
              >
                {isConfirming ? 'Submitting...' : 'Order Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
      {refundOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="absolute inset-0" onClick={() => setRefundOpen(false)} />
          <div className="relative z-[71] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-600 dark:text-rose-400">Refund Request</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Request a refund</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">Tell us the reason and attach proof images/videos.</p>
              </div>
              <button
                type="button"
                onClick={() => setRefundOpen(false)}
                className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-gray-400"
              >
                Close
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-gray-400">Reason</p>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={4}
                placeholder="Explain why you are requesting a refund..."
                className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-slate-700 dark:text-gray-100"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-gray-400">Images (optional)</p>
                <label
                  className={`mt-2 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-3 py-4 text-center text-xs transition ${
                    isRefundImageDragActive
                      ? 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-600 dark:bg-rose-900/20 dark:text-rose-300'
                      : 'border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsRefundImageDragActive(true); }}
                  onDragLeave={() => setIsRefundImageDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsRefundImageDragActive(false);
                    const dropped = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'));
                    if (dropped.length > 0) setRefundImages((current) => mergeUniqueFiles(current, dropped));
                  }}
                >
                  Drag/drop images or click
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => setRefundImages((current) => mergeUniqueFiles(current, Array.from(e.target.files ?? [])))}
                    className="hidden"
                  />
                </label>
                {refundImages.length > 0 ? <p className="mt-1 text-[11px] text-slate-500 dark:text-gray-400">{refundImages.length} image(s) selected</p> : null}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-gray-400">Videos (optional)</p>
                <label
                  className={`mt-2 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-3 py-4 text-center text-xs transition ${
                    isRefundVideoDragActive
                      ? 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-600 dark:bg-rose-900/20 dark:text-rose-300'
                      : 'border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsRefundVideoDragActive(true); }}
                  onDragLeave={() => setIsRefundVideoDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsRefundVideoDragActive(false);
                    const dropped = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('video/'));
                    if (dropped.length > 0) setRefundVideos((current) => mergeUniqueFiles(current, dropped));
                  }}
                >
                  Drag/drop videos or click
                  <input
                    type="file"
                    multiple
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={(e) => setRefundVideos((current) => mergeUniqueFiles(current, Array.from(e.target.files ?? [])))}
                    className="hidden"
                  />
                </label>
                {refundVideos.length > 0 ? <p className="mt-1 text-[11px] text-slate-500 dark:text-gray-400">{refundVideos.length} video(s) selected</p> : null}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRefundOpen(false)}
                className="rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={refundReason.trim().length < 3 || isRefunding}
                onClick={async () => {
                  try {
                    await refundOrder({
                      id: order.id,
                      reason: refundReason.trim(),
                      refundImages,
                      refundVideos,
                    }).unwrap();
                    setRefundOpen(false);
                    setRefundReason('');
                    setRefundImages([]);
                    setRefundVideos([]);
                  } catch {
                    return;
                  }
                }}
                className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
              >
                {isRefunding ? 'Submitting...' : 'Submit Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default OrderCard
