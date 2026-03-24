'use client';

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "./Icons";
import Image from "next/image";
import { TRACK_STEPS } from "@/types/Data";
import formatDate from "@/helpers/FormatDate";
import formatPrice from "@/helpers/FormatPrice";

type OrderStatus = 'pending' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';

type OrderItem = {
    id: number;
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
    created_at: string;
    estimated_delivery?: string | null;
};

const copyText = async (value: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new Error('Clipboard is not available in this browser.');
    }

    await navigator.clipboard.writeText(value);
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; badge: string; dot: string; step: number }> = {
    pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400', step: 1 },
    processing: { label: 'Processing', badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', step: 2 },
    packed: { label: 'Packed', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', step: 3 },
    shipped: { label: 'Shipped', badge: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500', step: 3 },
    out_for_delivery: { label: 'Out for Delivery', badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', step: 4 },
    delivered: { label: 'Delivered', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', step: 5 },
    cancelled: { label: 'Cancelled', badge: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-400', step: 0 },
    refunded: { label: 'Refunded', badge: 'bg-gray-100 text-gray-600 border-gray-300', dot: 'bg-gray-400', step: 0 },
}

interface OrderCardProps {
    order: Order
}

const OrderCard = ({ order }: OrderCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const previewItems = order.items.slice(0, 3);
  const extraCount = order.items.length - 3;
  const isActive = !['cancelled', 'refunded', 'delivered'].includes(order.status);
  const hasShipmentInfo = Boolean(order.courier || order.tracking_no || order.shipment_status);
  const isShipmentCancelled = order.shipment_status === 'cancelled';

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
      className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-orange-200 hover:shadow-md transition-all duration-200"
    >
      {/* Card header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <Icon.Package className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Order #{order.order_number}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          {isShipmentCancelled && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-red-50 text-red-600 border-red-200">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Shipment Cancelled
            </span>
          )}
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon.ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Items preview */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {previewItems.map((item) => (
              <div key={item.id} className="h-10 w-10 rounded-lg border-2 border-white overflow-hidden bg-gray-100 shrink-0">
                <Image src={item.image} alt={item.name} width={40} height={40} className="h-full w-full object-cover" />
              </div>
            ))}
            {extraCount > 0 && (
              <div className="h-10 w-10 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-gray-500">+{extraCount}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 truncate">
              {order.items[0].name}
              {order.items.length > 1 && (
                <span className="text-gray-400"> +{order.items.length - 1} more item{order.items.length > 2 ? 's' : ''}</span>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{order.items.reduce((s, i) => s + i.quantity, 0)} item(s)</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</p>
            {order.shipping_fee === 0
              ? <p className="text-[11px] text-emerald-600 font-medium">Free shipping</p>
              : <p className="text-[11px] text-gray-400">+{formatPrice(order.shipping_fee)} shipping</p>
            }
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {order.status === 'delivered' && (
            <button type="button" className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors">
              <Icon.RefreshCw className="h-3.5 w-3.5" /> Reorder
            </button>
          )}
          {isActive && !isShipmentCancelled && (
            <button type="button" className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors">
              <Icon.Truck className="h-3.5 w-3.5" /> Track Order
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 px-3.5 py-2 text-xs font-semibold text-gray-600 transition-colors"
          >
            View Details <Icon.ChevronRight className="h-3.5 w-3.5" />
          </button>
          {order.status === 'pending' && (
            <button type="button" className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 hover:bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-500 transition-colors">
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
            <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50/50">

              {/* Tracking steps */}
              {isShipmentCancelled ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-red-600">Shipment Update</p>
                  <p className="mt-1 text-sm font-semibold text-red-700">Courier booking was cancelled.</p>
                  <p className="mt-1 text-xs text-red-600">
                    Your order is still in the system, but the courier shipment was cancelled and may need to be rebooked by the seller.
                  </p>
                </div>
              ) : order.status !== 'cancelled' && order.status !== 'refunded' && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Order Tracking</p>
                  <div className="relative flex items-start justify-between gap-1">
                    {TRACK_STEPS.map((step, i) => {
                      const stepNum = i + 1;
                      const currentStep = cfg.step;
                      const done = stepNum <= currentStep;
                      const active = stepNum === currentStep;
                      return (
                        <div key={step} className="flex-1 flex flex-col items-center gap-1.5 relative">
                          {i < TRACK_STEPS.length - 1 && (
                            <div className={`absolute top-3 left-1/2 w-full h-0.5 ${done ? 'bg-orange-400' : 'bg-gray-200'}`} />
                          )}
                          <div className={`relative z-10 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            done
                              ? 'bg-orange-500 border-orange-500'
                              : 'bg-white border-gray-200'
                          } ${active ? 'ring-2 ring-orange-200 ring-offset-1' : ''}`}>
                            {done
                              ? <Icon.Check className="h-3 w-3 text-white" />
                              : <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                            }
                          </div>
                          <p className={`text-center text-[10px] font-medium leading-tight ${done ? 'text-orange-600' : 'text-gray-400'}`}>
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  {order.estimated_delivery && (
                    <p className="mt-3 text-xs text-gray-500">
                      Estimated delivery: <span className="font-semibold text-gray-700">{formatDate(order.estimated_delivery)}</span>
                    </p>
                  )}
                </div>
              )}

              {/* All items */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Items Ordered</p>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <Image src={item.image} alt={item.name} width={48} height={48} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                        {getSelectedOptions(item).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {getSelectedOptions(item).map((option) => (
                              <span
                                key={option}
                                className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-700"
                              >
                                {option}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 shrink-0">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Order Summary</p>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.total - order.shipping_fee)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Shipping</span>
                    <span className={order.shipping_fee === 0 ? 'text-emerald-600 font-medium' : ''}>
                      {order.shipping_fee === 0 ? 'Free' : formatPrice(order.shipping_fee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-orange-600">{formatPrice(order.total)}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Delivery Info</p>
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <Icon.MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{order.shipping_address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Icon.CreditCard className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>{order.payment_method}</span>
                  </div>
                </div>
              </div>

              {hasShipmentInfo && (
                <div className="rounded-xl border border-teal-100 bg-teal-50/60 px-4 py-3 space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Shipment Details</p>
                  {order.courier && (
                    <p className="text-xs text-gray-700">
                      Courier: <span className="font-semibold uppercase">{order.courier}</span>
                    </p>
                  )}
                  {order.shipment_status && (
                    <p className="text-xs text-gray-700">
                      Shipment Status: <span className="font-semibold capitalize">{order.shipment_status.replace(/_/g, ' ')}</span>
                    </p>
                  )}
                  {order.tracking_no && (
                    <div className="rounded-xl border border-teal-200 bg-white px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700">Tracking Number</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <p className="min-w-0 flex-1 break-all font-mono text-sm font-semibold text-gray-900">{order.tracking_no}</p>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await copyText(order.tracking_no as string);
                            } catch {
                              return;
                            }
                          }}
                          className="shrink-0 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700 transition hover:bg-teal-100"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                  {order.shipped_at && (
                    <p className="text-xs text-gray-500">
                      Shipped at: <span className="font-medium text-gray-700">{formatDate(order.shipped_at)}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OrderCard
