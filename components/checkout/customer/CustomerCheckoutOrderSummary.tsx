'use client';

import Image from 'next/image';
import { CustomerCheckoutData } from '@/types/CustomerCheckout/types';
import { CategoryProduct } from '@/libs/CategoryData';
import Loading from '@/components/Loading';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import OutlineButton from '@/components/ui/buttons/OutlineButton';
import PrimaryButton from '@/components/ui/buttons/PrimaryButton';
import type { Product, ProductVariant } from '@/store/api/productsApi';

type CheckoutSummaryProduct = CategoryProduct | Product;

interface Props {
  checkoutData: CustomerCheckoutData | null;
  loading: boolean;
  onSubmit: () => void;
  voucher?: { code: string; discount: number } | null;
  computedTotal?: number;
  subtotalOverride?: number;
  unitPriceOverride?: number;
  shippingFee?: number | null;
  shippingRatePending?: boolean;
  shippingRateUnavailable?: boolean;
  shippingAddressLabel?: string;
  checkoutDisabledReason?: string;
  fullProduct?: CheckoutSummaryProduct | null;
}

export default function CustomerCheckoutOrderSummary({
  checkoutData,
  loading,
  onSubmit,
  voucher,
  computedTotal,
  subtotalOverride,
  unitPriceOverride,
  shippingFee,
  shippingRatePending = false,
  shippingRateUnavailable = false,
  shippingAddressLabel = '',
  checkoutDisabledReason,
  fullProduct,
}: Props) {
  const [variantPickerOpen, setVariantPickerOpen] = useState(false);
  const variantOptions = (fullProduct?.variants ?? []).filter((v) =>
    Boolean(v.color || v.style || v.size || v.name || v.sku),
  );

  if (!checkoutData) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400">
          No checkout data yet.
        </div>
      </div>
    );
  }

  const { product, quantity, selectedColor, selectedStyle, selectedSize, selectedType, selectedSku, items = [], subtotal, handlingFee, total } = checkoutData;
  const hasSelectedItems = items.length > 0;
  const effectiveQuantity = hasSelectedItems
    ? items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity ?? 1)), 0)
    : Math.max(1, Number(quantity ?? 1));
  const unitPv = hasSelectedItems
    ? items.reduce((sum, item) => sum + (Number(item.prodpv ?? 0) * item.quantity), 0)
    : Number(product.prodpv ?? 0);
  const totalPv = hasSelectedItems ? unitPv : unitPv * effectiveQuantity;
  const displayUnitPrice = typeof unitPriceOverride === 'number' ? unitPriceOverride : product.price;
  const displaySubtotal = typeof subtotalOverride === 'number' ? subtotalOverride : subtotal;
  const voucherDiscount = Math.max(0, Number(voucher?.discount ?? 0));
  const displayTotal = typeof computedTotal === 'number' ? computedTotal : total;
  const displayShippingFee = typeof shippingFee === 'number' ? shippingFee : Number(handlingFee ?? 0);
  const isCheckoutDisabled = loading || Boolean(checkoutDisabledReason);
  const selectedOptions = [
    selectedColor ? { label: 'Color', value: selectedColor } : null,
    selectedStyle ? { label: 'Style', value: selectedStyle } : null,
    selectedSize ? { label: 'Size', value: selectedSize } : null,
    selectedType ? { label: 'Type', value: selectedType } : null,
    selectedSku ? { label: 'SKU', value: selectedSku } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  const handleChangeVariant = () => {
    setVariantPickerOpen(true);
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    if (!checkoutData) return;

    const updatedCheckoutData = {
      ...checkoutData,
      variantId: variant.id ?? null,
      selectedColor: variant.color || null,
      selectedStyle: variant.style || null,
      selectedSize: variant.size || null,
      selectedType: variant.name || null,
      selectedSku: variant.sku || null,
      product: {
        ...checkoutData.product,
        price: variant.priceSrp || checkoutData.product.price,
        image: variant.images?.[0] || checkoutData.product.image,
        sku: variant.sku || checkoutData.product.sku,
      },
      subtotal: (variant.priceSrp || checkoutData.product.price) * checkoutData.quantity,
    };

    localStorage.setItem('guest_checkout', JSON.stringify(updatedCheckoutData));
    setVariantPickerOpen(false);
    // Trigger a custom event to notify parent component
    window.dispatchEvent(new CustomEvent('checkout-variant-changed'));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Order Summary</p>

        {/* Product */}
        <div className="flex gap-3 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-200 dark:border-sky-800 mb-4">
          <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-white leading-snug line-clamp-2">{product.name}</p>
            <p className="text-sky-500 font-extrabold text-sm mt-1">PHP {displayUnitPrice.toLocaleString()}</p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="px-2 py-0.5 bg-sky-100 text-sky-600 text-[10px] font-bold rounded-full">Qty: {effectiveQuantity}</span>
              {selectedColor && <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded-full">{selectedColor}</span>}
              {selectedStyle && <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded-full">{selectedStyle}</span>}
              {selectedSize && <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded-full">{selectedSize}</span>}
              {selectedType && <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded-full">{selectedType}</span>}
              {selectedSku && <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded-full">{selectedSku}</span>}
            </div>
            {selectedOptions.length > 0 ? (
              <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Selected Options</p>
                  <OutlineButton
                    type="button"
                    onClick={handleChangeVariant}
                    className="!px-2 !py-1 !text-[10px] !rounded-lg"
                  >
                    {variantPickerOpen ? 'Hide Options' : 'Change Variant'}
                  </OutlineButton>
                </div>
                <div className="mt-2 space-y-1.5">
                  {selectedOptions.map((option) => (
                    <div key={option.label} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">{option.label}</span>
                      <span className="text-right font-bold text-slate-800 dark:text-white">{option.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

          {/* Variant Picker */}
          <AnimatePresence>
            {variantPickerOpen && fullProduct && variantOptions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 overflow-hidden"
              >
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {variantOptions.map((variant, index) => {
                    const selectedVariantId = Number(checkoutData?.variantId ?? 0);
                    const variantId = Number(variant.id ?? 0);
                    const selectedSku = String(checkoutData?.selectedSku ?? '').trim();
                    const variantSku = String(variant.sku ?? '').trim();
                    const selectedTypeValue = String(checkoutData?.selectedType ?? '').trim().toLowerCase();
                    const selectedColorValue = String(checkoutData?.selectedColor ?? '').trim().toLowerCase();
                    const selectedStyleValue = String(checkoutData?.selectedStyle ?? '').trim().toLowerCase();
                    const selectedSizeValue = String(checkoutData?.selectedSize ?? '').trim().toLowerCase();
                    const variantMatchesSelectedDetails =
                      (!selectedTypeValue || String(variant.name ?? '').trim().toLowerCase() === selectedTypeValue) &&
                      (!selectedColorValue || String(variant.color ?? '').trim().toLowerCase() === selectedColorValue) &&
                      (!selectedStyleValue || String(variant.style ?? '').trim().toLowerCase() === selectedStyleValue) &&
                      (!selectedSizeValue || String(variant.size ?? '').trim().toLowerCase() === selectedSizeValue);
                    const isSelected = selectedVariantId > 0 && variantId > 0
                      ? selectedVariantId === variantId
                      : selectedSku !== '' && variantSku !== '' && selectedSku === variantSku && variantMatchesSelectedDetails;
                    const variantLabel = variant.name?.trim() || variant.size?.trim() || `Variant ${index + 1}`;
                    const variantMeta = [
                      variant.size?.trim() || '',
                      variant.color?.trim() || '',
                      variant.sku?.trim() || '',
                    ].filter(Boolean).join(' · ');

                    return (
                      <button
                        key={`${variant.sku ?? variant.id ?? index}-${index}`}
                        type="button"
                        onClick={() => handleVariantSelect(variant)}
                        className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50'
                            : 'border-slate-200 bg-white hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{variantLabel}</p>
                            {variantMeta && (
                              <p className="mt-1 text-[10px] text-slate-500">{variantMeta}</p>
                            )}
                          </div>
                          {isSelected && (
                            <svg className="w-4 h-4 text-sky-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>

        {hasSelectedItems ? (
          <div className="mb-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Selected Items</p>
            <div className="mt-3 space-y-3">
              {items.map((item) => (
                <div key={`${item.cartItemId ?? item.id}-${item.selectedSku ?? item.variantId ?? ''}`} className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white dark:bg-slate-800">
                    <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-white line-clamp-2">{item.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600">Qty: {item.quantity}</span>
                      {item.selectedColor ? <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">{item.selectedColor}</span> : null}
                      {item.selectedStyle ? <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">{item.selectedStyle}</span> : null}
                      {item.selectedSize ? <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">{item.selectedSize}</span> : null}
                      {item.selectedType ? <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">{item.selectedType}</span> : null}
                      {item.selectedSku ? <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">{item.selectedSku}</span> : null}
                    </div>
                  </div>
                  <p className="shrink-0 text-xs font-bold text-slate-800 dark:text-white">PHP {(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Breakdown */}
        <div className="space-y-2.5 text-sm border-t border-slate-200 dark:border-slate-700 pt-3">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Subtotal ({effectiveQuantity}x)</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">PHP {displaySubtotal.toLocaleString()}</span>
          </div>
          {voucherDiscount > 0 ? (
            <div className="flex justify-between text-emerald-600">
              <span>Voucher ({voucher?.code ?? 'Applied'})</span>
              <span className="font-semibold">-PHP {voucherDiscount.toLocaleString()}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>PV per item</span>
            <span className="font-semibold text-blue-700">{unitPv.toLocaleString()} PV</span>
          </div>
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Total PV</span>
            <span className="font-semibold text-blue-700">{totalPv.toLocaleString()} PV</span>
          </div>
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>Shipping fee</span>
              {!shippingRatePending && !shippingRateUnavailable && displayShippingFee === 0 && <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 font-bold rounded-full">FREE</span>}
            </div>
            <span className={
              shippingRateUnavailable
                ? 'font-semibold text-rose-500'
                : displayShippingFee === 0
                  ? 'text-green-600 font-semibold'
                  : 'font-semibold text-slate-700 dark:text-slate-300'
            }>
              {shippingRatePending
                ? 'Checking...'
                : shippingRateUnavailable
                  ? 'Not available'
                  : displayShippingFee === 0
                    ? 'PHP 0.00'
                    : `PHP ${displayShippingFee.toLocaleString()}`}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <span className="font-bold text-slate-800 dark:text-white">Total</span>
          <span className="font-extrabold text-sky-500 text-xl">PHP {displayTotal.toLocaleString()}</span>
        </div>

        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            {shippingRateUnavailable
              ? `Shipping is not available for this address${shippingAddressLabel ? ` (${shippingAddressLabel})` : ''}. Checkout will continue with PHP 0.00 shipping fee.`
              : 'Shipping fee updates automatically based on the selected delivery city and province.'}
          </p>
        </div>
      </div>

      {/* Place Order CTA */}
      <PrimaryButton
        onClick={onSubmit}
        disabled={isCheckoutDisabled}
        className="w-full !text-sm"
      >
        {loading ? (
          <><Loading size={16} /><span>Processing...</span></>
        ) : checkoutDisabledReason ? (
          <span>{checkoutDisabledReason}</span>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Place Order · PHP {displayTotal.toLocaleString()}
          </>
        )}
      </PrimaryButton>

      {/* Security note */}
      <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        Secured by <span className="font-semibold text-slate-500 dark:text-slate-400">PayMongo</span> · SSL Encrypted
      </p>
    </div>
  );
}

