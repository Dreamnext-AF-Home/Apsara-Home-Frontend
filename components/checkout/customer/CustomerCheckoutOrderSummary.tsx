'use client';

import Image from 'next/image';
import { CustomerCheckoutData } from '@/types/CustomerCheckout/types';
import Loading from '@/components/Loading';

interface Props {
  checkoutData: CustomerCheckoutData | null;
  loading: boolean;
  onSubmit: () => void;
  isLoggedIn?: boolean;
  voucher?: { code: string; discount: number } | null;
  computedTotal?: number;
}

export default function CustomerCheckoutOrderSummary({ checkoutData, loading, onSubmit, isLoggedIn = false, voucher, computedTotal }: Props) {
  if (!checkoutData) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-sm text-slate-500">
          No checkout data yet.
        </div>
      </div>
    );
  }

  const { product, quantity, selectedColor, selectedSize, selectedType, selectedSku, items = [], subtotal, handlingFee, total } = checkoutData;
  const hasSelectedItems = items.length > 0;
  const unitPv = hasSelectedItems
    ? items.reduce((sum, item) => sum + (Number(item.prodpv ?? 0) * item.quantity), 0)
    : Number(product.prodpv ?? 0);
  const totalPv = hasSelectedItems ? unitPv : unitPv * quantity;
  const voucherDiscount = Math.max(0, Number(voucher?.discount ?? 0));
  const displayTotal = typeof computedTotal === 'number' ? computedTotal : total;
  const selectedOptions = [
    selectedColor ? { label: 'Color', value: selectedColor } : null,
    selectedSize ? { label: 'Size', value: selectedSize } : null,
    selectedType ? { label: 'Type', value: selectedType } : null,
    selectedSku ? { label: 'SKU', value: selectedSku } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <div className="space-y-4">
      {!isLoggedIn ? (
        <div className="bg-linear-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-orange-700">Sign in to your account</p>
            <p className="text-[10px] text-orange-500 mt-0.5">Track your order and earn PV points on every purchase.</p>
            <a href="/login" className="mt-2 inline-flex items-center gap-1 text-[11px] text-orange-600 font-bold hover:underline">
              Sign in to your account
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Order Summary</p>

        {/* Product */}
        <div className="flex gap-3 p-3 bg-orange-50/60 rounded-xl border border-orange-100 mb-4">
          <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-white border border-slate-100">
            <Image src={product.image} alt={product.name} fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">{product.name}</p>
            <p className="text-orange-500 font-extrabold text-sm mt-1">PHP {product.price.toLocaleString()}</p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full">Qty: {quantity}</span>
              {selectedColor && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-full">{selectedColor}</span>}
              {selectedSize && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-full">{selectedSize}</span>}
              {selectedType && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-full">{selectedType}</span>}
              {selectedSku && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-full">{selectedSku}</span>}
            </div>
            {selectedOptions.length > 0 ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Selected Options</p>
                <div className="mt-2 space-y-1.5">
                  {selectedOptions.map((option) => (
                    <div key={option.label} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-500">{option.label}</span>
                      <span className="text-right font-bold text-slate-800">{option.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {hasSelectedItems ? (
          <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Selected Items</p>
            <div className="mt-3 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 line-clamp-2">{item.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">Qty: {item.quantity}</span>
                      {item.selectedColor ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{item.selectedColor}</span> : null}
                      {item.selectedSize ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{item.selectedSize}</span> : null}
                      {item.selectedType ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{item.selectedType}</span> : null}
                      {item.selectedSku ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{item.selectedSku}</span> : null}
                    </div>
                  </div>
                  <p className="shrink-0 text-xs font-bold text-slate-800">PHP {(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Breakdown */}
        <div className="space-y-2.5 text-sm border-t border-slate-100 pt-3">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal ({quantity}x)</span>
            <span className="font-semibold text-slate-700">PHP {subtotal.toLocaleString()}</span>
          </div>
          {voucherDiscount > 0 ? (
            <div className="flex justify-between text-emerald-600">
              <span>Voucher ({voucher?.code ?? 'Applied'})</span>
              <span className="font-semibold">-PHP {voucherDiscount.toLocaleString()}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-slate-500">
            <span>PV per item</span>
            <span className="font-semibold text-blue-700">{unitPv.toLocaleString()} PV</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Total PV</span>
            <span className="font-semibold text-blue-700">{totalPv.toLocaleString()} PV</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <div className="flex items-center gap-1.5">
              <span>Shipping fee</span>
              {handlingFee === 0 && <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 font-bold rounded-full">FREE</span>}
            </div>
            <span className={handlingFee === 0 ? 'text-green-600 font-semibold' : 'font-semibold text-slate-700'}>
              {handlingFee === 0 ? 'PHP 0.00' : `PHP ${Number(handlingFee ?? 0).toLocaleString()}`}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
          <span className="font-bold text-slate-800">Total</span>
          <span className="font-extrabold text-orange-500 text-xl">PHP {displayTotal.toLocaleString()}</span>
        </div>

        {handlingFee === 0 ? (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-100">
            <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p className="text-xs text-green-700 font-medium">Free shipping on orders PHP 5,000+</p>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p className="text-xs text-slate-400">Add more to get free shipping (PHP 5,000+)</p>
          </div>
        )}
      </div>

      {/* Place Order CTA */}
      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white py-4 text-sm font-bold transition-all shadow-lg shadow-orange-200"
      >
        {loading ? (
          <><Loading size={16} /><span>Processing...</span></>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Place Order · PHP {displayTotal.toLocaleString()}
          </>
        )}
      </button>

      {/* Security note */}
      <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        Secured by <span className="font-semibold text-slate-500">PayMongo</span> · SSL Encrypted
      </p>
    </div>
  );
}

