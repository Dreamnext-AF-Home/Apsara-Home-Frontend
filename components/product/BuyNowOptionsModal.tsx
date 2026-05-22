'use client';

import { CategoryProduct } from '@/libs/CategoryData';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import Loading from '../Loading';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useGetPublicGeneralSettingsQuery } from '@/store/api/adminSettingsApi';
import { resolveCheckoutSource } from '@/libs/checkoutSource';
import { extractPartnerSlugFromPath } from '@/libs/storefrontRouting';
import PrimaryButton from '@/components/ui/buttons/PrimaryButton';
import SecondaryButton from '@/components/ui/buttons/SecondaryButton';
import OutlineButton from '@/components/ui/buttons/OutlineButton';

type VariantOption = NonNullable<CategoryProduct['variants']>[number];

const getVariantSignature = (variant: VariantOption) => [
  variant.sku?.trim() ?? '',
  variant.name?.trim() ?? '',
  variant.style?.trim() ?? '',
  variant.size?.trim() ?? '',
  variant.color?.trim() ?? '',
  String(variant.priceSrp ?? ''),
].join('|');

const getVariantIdentity = (variant: VariantOption, index: number) => {
  if (typeof variant.id === 'number') return `id:${variant.id}`;
  return `variant:${getVariantSignature(variant) || index}`;
};

const isSameVariant = (left?: VariantOption, right?: VariantOption) => {
  if (!left || !right) return false;

  if (typeof left.id === 'number' && typeof right.id === 'number') {
    return left.id === right.id;
  }

  const leftSignature = getVariantSignature(left);
  const rightSignature = getVariantSignature(right);
  if (leftSignature && rightSignature) return leftSignature === rightSignature;

  const leftSku = left.sku?.trim();
  const rightSku = right.sku?.trim();
  if (leftSku && rightSku) return leftSku === rightSku;

  return left === right;
};

const getStableVariantKey = (variant?: VariantOption) => {
  if (!variant) return '';
  if (typeof variant.id === 'number') return `id:${variant.id}`;
  const signature = getVariantSignature(variant);
  return signature ? `variant:${signature}` : '';
};

interface BuyNowOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CategoryProduct;
  quantity?: number;
  selectedVariant?: VariantOption;
  selectedColor?: string;
  selectedStyle?: string;
  selectedSize?: string;
  selectedType?: string;
  forceRealPrice?: boolean;
  onVariantSelect?: (variant: VariantOption) => void;
}

const toPositiveNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const BuyNowOptionsModal = ({
  isOpen,
  onClose,
  product,
  quantity = 1,
  selectedVariant,
  selectedColor,
  selectedStyle,
  selectedSize,
  selectedType,
  forceRealPrice = false,
  onVariantSelect,
}: BuyNowOptionsModalProps) => {
  const { data: session, status } = useSession();
  const { data: publicSettingsData } = useGetPublicGeneralSettingsQuery();
  const [notice, setNotice] = useState('');
  const [variantPickerOpen, setVariantPickerOpen] = useState(false);
  const [modalSelectedVariantKey, setModalSelectedVariantKey] = useState(getStableVariantKey(selectedVariant));
  const loading = false;
  const router = useRouter();
  const pathname = usePathname();
  const partnerSlug = extractPartnerSlugFromPath(pathname);
  const checkoutTarget = partnerSlug ? `/${partnerSlug}/checkout/customer` : '/checkout/customer';

  const variantOptions = useMemo(
    () =>
      (product.variants ?? []).filter((variant) =>
        Boolean(
          variant.color ||
          variant.style ||
          variant.size ||
          variant.name ||
          variant.sku ||
          (variant.images && variant.images.length > 0) ||
          typeof variant.priceSrp === 'number',
        ),
      ),
    [product.variants],
  );

  const hasVariantOptions = variantOptions.length > 0;
  const selectedVariantKey = getStableVariantKey(selectedVariant);
  const effectiveVariantKey = variantPickerOpen
    ? (modalSelectedVariantKey || selectedVariantKey)
    : (selectedVariantKey || modalSelectedVariantKey);

  const activeVariant = useMemo(() => {
    if (!hasVariantOptions) return undefined;
    if (effectiveVariantKey) {
      return variantOptions.find((variant) => getStableVariantKey(variant) === effectiveVariantKey)
        ?? selectedVariant
        ?? variantOptions[0];
    }
    return selectedVariant ?? variantOptions[0];
  }, [effectiveVariantKey, hasVariantOptions, selectedVariant, variantOptions]);

  const activeSelectedColor = activeVariant?.color ?? selectedColor ?? null;
  const activeSelectedStyle = activeVariant?.style ?? selectedStyle ?? null;
  const activeSelectedSize = activeVariant?.size ?? selectedSize ?? null;
  const activeSelectedType = activeVariant?.name ?? selectedType ?? null;
  const role = String(session?.user?.role ?? '').toLowerCase();
  const canUseMemberPrice = status === 'authenticated' && (role === 'customer' || role === '');
  const baseSrp = toPositiveNumber(product.originalPrice) ?? toPositiveNumber(product.price) ?? 0;
  const srpPrice = toPositiveNumber(activeVariant?.priceSrp) ?? baseSrp;
  const memberPrice = toPositiveNumber(activeVariant?.priceMember) ?? toPositiveNumber(product.priceMember) ?? 0;
  const hasMemberPrice = memberPrice > 0 && memberPrice < srpPrice;
  // Guest checkout must always use SRP. Member price applies only for authenticated customer accounts.
  const unitPrice = !forceRealPrice && canUseMemberPrice && hasMemberPrice ? memberPrice : srpPrice;
  const unitPv = toPositiveNumber(activeVariant?.prodpv) ?? Number(product.prodpv ?? 0);
  const selectedVariantImage = activeVariant?.images?.[0] || product.image;
  const colorOptions = useMemo(() => {
    const map = new Map<string, string | undefined>();
    variantOptions.forEach((variant) => {
      const color = variant.color?.trim();
      if (!color) return;
      map.set(color, variant.colorHex);
    });
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [variantOptions]);
  const visibleVariantChoices = useMemo(() => {
    if (!activeSelectedColor) return variantOptions;
    return variantOptions.filter((variant) => !variant.color || variant.color === activeSelectedColor);
  }, [activeSelectedColor, variantOptions]);
  const variantChoiceLabel = visibleVariantChoices.some((variant) => variant.size?.trim()) ? 'Size' : 'Variant';

  const subtotal = useMemo(() => unitPrice * quantity, [quantity, unitPrice]);
  const totalPv = useMemo(() => unitPv * quantity, [unitPv, quantity]);
  const handlingFee = 0;
  const total = subtotal + handlingFee;

  const isManualCheckoutOnly = Boolean(publicSettingsData?.settings?.enable_manual_checkout_mode) && !Boolean(product.manualCheckoutEnabled);

  const handleClose = () => {
    setNotice('');
    setVariantPickerOpen(false);
    setModalSelectedVariantKey('');
    onClose();
  };

  const persistCheckoutDraft = () => {
    const checkoutSource = resolveCheckoutSource(pathname);

    localStorage.setItem('guest_checkout', JSON.stringify({
      product: {
        ...product,
        image: selectedVariantImage,
        sku: activeVariant?.sku ?? product.sku,
        price: unitPrice,
        prodpv: activeVariant?.prodpv ?? product.prodpv,
      },
      sourceType: product.sourceType ?? 'local',
      zqProductId: product.zqProductId ?? null,
      zqExternalId: product.zqExternalId ?? null,
      zqOfferId: product.zqOfferId ?? null,
      quantity,
      variantId: activeVariant?.id ?? null,
      selectedColor: activeSelectedColor,
      selectedStyle: activeSelectedStyle,
      selectedSize: activeSelectedSize,
      selectedType: activeSelectedType,
      selectedSku: activeVariant?.sku ?? null,
      subtotal,
      handlingFee,
      total,
      sourceLabel: checkoutSource.sourceLabel ?? null,
      sourceSlug: checkoutSource.sourceSlug ?? null,
      sourceHost: checkoutSource.sourceHost ?? null,
      sourceUrl: checkoutSource.sourceUrl ?? null,
    }));
  };

  const ensureVariantReady = () => {
    if (hasVariantOptions && !activeVariant) {
      setNotice('Please select a variant before continuing to checkout.');
      setVariantPickerOpen(true);
      return false;
    }

    return true;
  };

  const handleProceed = async () => {
    if (!ensureVariantReady()) return;
    if (isManualCheckoutOnly) {
      setNotice('This product is not available for checkout at the moment');
      return;
    }

    if (status !== 'authenticated') {
      handleClose();
      const callbackPath = pathname || '/shop';
      router.push(`/login?callback=${encodeURIComponent(callbackPath)}`);
      return;
    }

    persistCheckoutDraft();
    handleClose();
    router.push(checkoutTarget);
  };

  const handleCustomerCheckout = () => {
    if (!ensureVariantReady()) return;
    if (isManualCheckoutOnly) {
      setNotice('This product is not available for checkout at the moment');
      return;
    }

    persistCheckoutDraft();
    handleClose();
    router.push(checkoutTarget);
  };

  const handleVariantSelect = (variant: VariantOption) => {
    setModalSelectedVariantKey(getStableVariantKey(variant));
    setNotice('');
    onVariantSelect?.(variant);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 backdrop-blur-sm"
        >
          <div className="flex min-h-full items-start justify-center p-3 sm:items-center sm:p-6">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="mx-auto w-full max-w-5xl rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between bg-sky-500 dark:bg-sky-600 px-5 py-4 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shrink-0">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-sky-100">AF Home | Secure Checkout</p>
                    <h2 className="text-lg font-bold leading-tight text-white">Review Before Checkout</h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/25"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5">
                <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 lg:col-span-2 lg:border-b-0 lg:border-r">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Order Summary</p>

                  <div className="flex gap-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5">
                    <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                      <Image src={selectedVariantImage} alt={product.name} fill className="object-cover" unoptimized />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 dark:text-white">{product.name}</p>
                      <p className="mt-1.5 text-[15px] font-extrabold text-sky-500">P{unitPrice.toLocaleString()}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <span className="rounded-full border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400">
                          Qty: {quantity}
                        </span>
                        {activeSelectedColor ? <span className="rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:text-gray-300">{activeSelectedColor}</span> : null}
                        {activeSelectedStyle ? <span className="rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:text-gray-300">{activeSelectedStyle}</span> : null}
                        {activeSelectedSize ? <span className="rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:text-gray-300">{activeSelectedSize}</span> : null}
                      </div>
                    </div>
                  </div>

                  {activeSelectedType ? (
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-xs">
                      <svg className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="text-gray-500 dark:text-gray-400">Type:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{activeSelectedType}</span>
                    </div>
                  ) : null}

                  <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="space-y-3 px-4 py-4">
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Subtotal ({quantity} item{quantity > 1 ? 's' : ''})</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">P{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>PV per item</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{unitPv.toLocaleString()} PV</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Total PV</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{totalPv.toLocaleString()} PV</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Shipping fee</span>
                        <span className={handlingFee === 0 ? 'font-semibold text-green-600 dark:text-green-400' : 'font-semibold text-gray-700 dark:text-gray-300'}>
                          {handlingFee === 0 ? 'P0.00' : `P${handlingFee}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-sky-50 dark:bg-sky-900/20 px-4 py-3">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">Total Amount</span>
                      <span className="text-xl font-extrabold text-sky-500 dark:text-sky-400">P{total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2">
                    <svg className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-medium text-green-700 dark:text-green-400">Shipping fee is temporarily set to P0.00 for checkout testing.</p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                    {[
                      { label: 'SSL Encrypted', icon: <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
                      { label: 'PayMongo', icon: <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
                      { label: '3DS Secure', icon: <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
                    ].map((badge) => (
                      <div key={badge.label} className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2">
                        <span className="text-gray-400 dark:text-gray-500">{badge.icon}</span>
                        <span className="text-center text-[9px] font-semibold leading-tight text-gray-400 dark:text-gray-500">{badge.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 sm:p-6 lg:col-span-3">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Checkout Preview</p>

                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Payment options will be selected on the checkout page.</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                      We removed payment selection from this modal so the final checkout page can handle address, vouchers, and payment method in one place.
                    </p>
                  </div>

                  <AnimatePresence>
                    {hasVariantOptions && (
                      <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 rounded-2xl border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-900/20 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-400">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                Variant Selection
                              </p>
                              <p className="mt-1 text-[11px] text-sky-600 dark:text-sky-400">
                                Checkout will use the exact variant you select here.
                              </p>
                            </div>
                            <OutlineButton
                              type="button"
                              onClick={() => {
                                setModalSelectedVariantKey(getStableVariantKey(activeVariant ?? selectedVariant));
                                setVariantPickerOpen((current) => !current);
                              }}
                              className="!px-3 !py-2 !text-[11px] !rounded-xl"
                            >
                              {variantPickerOpen ? 'Hide Options' : (activeVariant ? 'Change Variant' : 'Select Variant')}
                            </OutlineButton>
                          </div>

                          {(activeSelectedType || activeSelectedSize || activeSelectedColor || activeVariant?.sku) ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {activeSelectedType ? <span className="rounded-full border border-sky-200 dark:border-sky-800 bg-white dark:bg-gray-800 px-2.5 py-1 text-[10px] font-bold text-gray-700 dark:text-gray-300">{activeSelectedType}</span> : null}
                              {activeSelectedSize ? <span className="rounded-full border border-sky-200 dark:border-sky-800 bg-white dark:bg-gray-800 px-2.5 py-1 text-[10px] font-bold text-gray-700 dark:text-gray-300">{activeSelectedSize}</span> : null}
                              {activeSelectedColor ? <span className="rounded-full border border-sky-200 dark:border-sky-800 bg-white dark:bg-gray-800 px-2.5 py-1 text-[10px] font-bold text-gray-700 dark:text-gray-300">{activeSelectedColor}</span> : null}
                              {activeVariant?.sku ? <span className="rounded-full border border-sky-200 dark:border-sky-800 bg-white dark:bg-gray-800 px-2.5 py-1 text-[10px] font-bold text-gray-700 dark:text-gray-300">{activeVariant.sku}</span> : null}
                            </div>
                          ) : null}

                          <AnimatePresence>
                            {(variantPickerOpen || !activeVariant) && (
                              <motion.div
                                initial={{ opacity: 0, y: 20, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: 12, height: 0 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                className="mt-3 overflow-hidden"
                              >
                                <div className="space-y-4 rounded-2xl border border-sky-100 bg-white p-3 dark:border-sky-900/50 dark:bg-gray-800">
                                  {colorOptions.length > 0 ? (
                                    <div>
                                      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-gray-300">
                                        Color{activeSelectedColor ? ': ' : ''}
                                        {activeSelectedColor ? <span className="capitalize text-slate-600 dark:text-gray-400">{activeSelectedColor}</span> : null}
                                      </span>
                                      <div className="flex flex-wrap gap-2">
                                        {colorOptions.map((color) => {
                                          const colorVariant =
                                            variantOptions.find((variant) =>
                                              variant.color === color.name &&
                                              (!activeSelectedType || (variant.name ?? '').trim() === activeSelectedType) &&
                                              (!activeSelectedStyle || (variant.style ?? '').trim() === activeSelectedStyle) &&
                                              (!activeSelectedSize || (variant.size ?? '').trim() === activeSelectedSize),
                                            )
                                            ?? variantOptions.find((variant) =>
                                              variant.color === color.name &&
                                              (!activeSelectedType || (variant.name ?? '').trim() === activeSelectedType),
                                            )
                                            ?? variantOptions.find((variant) => variant.color === color.name);
                                          const isActive = activeSelectedColor === color.name;

                                          return (
                                            <button
                                              key={color.name}
                                              type="button"
                                              title={color.name}
                                              onClick={() => {
                                                if (colorVariant) handleVariantSelect(colorVariant);
                                              }}
                                              className={`h-10 w-10 rounded-full border-2 transition-all hover:scale-105 ${
                                                isActive ? 'ring-4 ring-sky-400 dark:ring-sky-500' : 'ring-2 ring-transparent'
                                              }`}
                                              style={{
                                                backgroundColor: color.hex ?? '#E5E7EB',
                                                borderColor: '#D1D5DB',
                                              }}
                                            />
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : null}

                                  <div>
                                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-gray-300">
                                      {variantChoiceLabel}
                                    </span>
                                    <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                                      {visibleVariantChoices.map((variant, index) => {
                                        const isActive = isSameVariant(activeVariant, variant);
                                        const variantLabel = variant.size?.trim() || variant.name?.trim() || `Variant ${index + 1}`;
                                        const variantMeta = [
                                          variant.name?.trim() || '',
                                          variant.style?.trim() || '',
                                          variant.color?.trim() || '',
                                          variant.sku?.trim() || '',
                                        ].filter(Boolean).join(' ? ');

                                        return (
                                          <button
                                            key={getVariantIdentity(variant, index)}
                                            type="button"
                                            onClick={() => handleVariantSelect(variant)}
                                            className={`w-full rounded-lg border-2 px-3 py-2 text-left transition-all ${
                                              isActive
                                                ? 'border-sky-400 text-sky-600 dark:border-sky-500 dark:text-sky-400'
                                                : 'border-gray-200 text-slate-600 dark:border-gray-700 dark:text-gray-300 hover:border-sky-200 dark:hover:border-sky-900/50'
                                            }`}
                                          >
                                            <div className="flex items-start gap-2">
                                              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700">
                                                <Image
                                                  src={variant.images?.[0] || selectedVariantImage}
                                                  alt={variantLabel}
                                                  fill
                                                  className="object-cover"
                                                  unoptimized
                                                />
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                  <p className="truncate text-sm font-medium">{variantLabel}</p>
                                                  {isActive ? <span className="rounded-full bg-sky-100 dark:bg-sky-900/40 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400">Selected</span> : null}
                                                </div>
                                                {variantMeta ? <p className="mt-1 truncate text-[11px] text-slate-400">{variantMeta}</p> : null}
                                              </div>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                    <p className="mb-3 text-xs font-bold text-gray-700 dark:text-gray-300">What happens next?</p>
                    <div className="space-y-2.5">
                      {[
                        { n: '1', text: 'Continue to the checkout page', active: true },
                        { n: '2', text: 'Review address, voucher, and final payment option', active: false },
                        { n: '3', text: 'PayMongo processes your payment securely after checkout', active: false },
                      ].map((step) => (
                        <div key={step.n} className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            step.active ? 'bg-sky-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                          }`}>
                            {step.n}
                          </div>
                          <p className={`text-xs leading-relaxed ${step.active ? 'font-semibold text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                            {step.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence>
                    {notice ? (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mt-3 flex items-start gap-2.5 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-900/20 px-4 py-3"
                      >
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-xs font-medium text-sky-800 dark:text-sky-300">{notice}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <div className="mt-4 flex flex-col gap-2.5">
                    {status !== 'authenticated' ? (
                      <>
                        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
                            <p className="text-center text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">How would you like to checkout?</p>
                          </div>
                          <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                            <button
                              type="button"
                              onClick={handleProceed}
                              disabled={loading}
                              className="group flex flex-col items-center gap-2 p-4 transition-all duration-200 hover:bg-sky-50 dark:hover:bg-sky-900/10 disabled:opacity-60"
                            >
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 dark:bg-sky-600 transition-all hover:bg-sky-600 dark:hover:bg-sky-700">
                                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                              {loading ? (
                                <div className="flex items-center gap-1.5">
                                  <Loading size={12} />
                                  <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">Processing...</span>
                                </div>
                              ) : (
                                <>
                                  <span className="text-xs font-bold text-gray-800 dark:text-white transition-colors group-hover:text-sky-600 dark:group-hover:text-sky-400">Sign In & Checkout</span>
                                  <span className="text-center text-[10px] leading-tight text-gray-400 dark:text-gray-500">Earn PV and track orders</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={handleCustomerCheckout}
                              className="group flex flex-col items-center gap-2 p-4 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                            >
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-500 dark:bg-gray-600 transition-all group-hover:bg-blue-500 dark:group-hover:bg-blue-600">
                                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <span className="text-xs font-bold text-gray-800 dark:text-white transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">Guest Checkout</span>
                              <span className="text-center text-[10px] leading-tight text-gray-400 dark:text-gray-500">No account needed</span>
                            </button>
                          </div>
                          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-sky-50 dark:bg-sky-900/20 px-4 py-2">
                            <span className="text-[11px] font-medium text-sky-700 dark:text-sky-400">Order Total</span>
                            <span className="text-sm font-extrabold text-sky-600 dark:text-sky-400">P{total.toLocaleString()}</span>
                          </div>
                        </div>

                        <SecondaryButton
                          type="button"
                          onClick={handleClose}
                          className="!px-8 !py-2.5 !text-xs"
                        >
                          Cancel
                        </SecondaryButton>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2.5 sm:flex-row">
                        <SecondaryButton
                          type="button"
                          onClick={handleClose}
                          className="!px-8 !py-3 !text-sm sm:flex-1"
                        >
                          Cancel
                        </SecondaryButton>
                        <PrimaryButton
                          type="button"
                          onClick={handleProceed}
                          disabled={loading}
                          className="!px-8 !py-3 !text-sm sm:flex-[2]"
                        >
                          {loading ? (
                            <>
                              <Loading size={16} />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 00-2-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span>Continue to Checkout P{total.toLocaleString()}</span>
                            </>
                          )}
                        </PrimaryButton>
                      </div>
                    )}
                  </div>

                  <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-gray-400 dark:text-gray-500">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secured by <span className="font-semibold text-gray-500 dark:text-gray-400">PayMongo</span> SSL Encrypted PCI DSS Compliant
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BuyNowOptionsModal;
