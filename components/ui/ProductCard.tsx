'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import type { CategoryProduct } from '@/libs/CategoryData';
import { displayColorName } from '@/libs/colorUtils';
import { useLazyGetPublicProductQuery } from '@/store/api/productsApi';
import { useAddWishlistMutation, useGetWishlistQuery, useRemoveWishlistMutation } from '@/store/api/wishlistApi';
import { showErrorToast, showSuccessToast } from '@/libs/toast';

interface ProductCardProps {
  id?: number;
  name: string;
  brand?: string | null;
  manualCheckoutEnabled?: boolean;
  createdAt?: string | null;
  price: number;
  priceMember?: number;
  prodpv?: number;
  originalPrice?: number;
  image: string;
  sku?: string;
  badge?: string;
  stock?: number;
  variants?: CategoryProduct['variants'];
  viewMode?: 'grid' | 'list';
  rating?: number;
  reviewCount?: number;
}

type VariantOption = NonNullable<CategoryProduct['variants']>[number];
type VariantChoice = {
  key: string;
  label: string;
  meta: string;
  variants: VariantOption[];
};

const FALLBACK_IMAGE = '/Images/HeroSection/chairs_stools.jpg';
const NEW_BADGE_DAYS = 3;

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(value || 0);

const isNewProduct = (createdAt?: string | null) => {
  if (!createdAt) return false;

  const createdAtTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdAtTime)) return false;

  return Date.now() - createdAtTime <= NEW_BADGE_DAYS * 24 * 60 * 60 * 1000;
};

const getEffectiveStock = (stock?: number, variants?: CategoryProduct['variants']) => {
  const activeVariants = (variants ?? []).filter((variant) => (variant?.status ?? 1) === 1);

  if (activeVariants.length > 0) {
    return activeVariants.reduce((total, variant) => total + Number(variant?.qty ?? 0), 0);
  }

  return Number(stock ?? 0);
};

const normalizeVariantLabel = (value?: string | null) => (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

const normalizeSkuSegment = (value?: string | null) =>
  (value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'COLOR';

const stripVariantColorSuffix = (sku?: string | null, colorName?: string | null) => {
  const normalizedSku = (sku ?? '').trim();
  const normalizedColorSegment = normalizeSkuSegment(colorName);

  if (!normalizedSku || !normalizedColorSegment) return normalizedSku;

  const suffix = `-${normalizedColorSegment}`;
  return normalizedSku.toUpperCase().endsWith(suffix)
    ? normalizedSku.slice(0, -suffix.length)
    : normalizedSku;
};

const getVariantChoiceKey = (variant: VariantOption) => [
  normalizeVariantLabel(variant.name),
  normalizeVariantLabel(variant.size),
  String(variant.width ?? ''),
  String(variant.dimension ?? ''),
  String(variant.height ?? ''),
  String(variant.priceSrp ?? ''),
  String(variant.priceMember ?? ''),
  String(variant.qty ?? ''),
].join('|');

export default function ProductCard({
  id,
  name,
  brand,
  manualCheckoutEnabled,
  createdAt,
  price,
  priceMember,
  prodpv,
  originalPrice,
  image,
  sku,
  badge,
  stock,
  variants,
  viewMode = 'grid',
  rating,
  reviewCount,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const [imageSrc, setImageSrc] = useState(image || FALLBACK_IMAGE);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedVariantSku, setSelectedVariantSku] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [resolvedVariants, setResolvedVariants] = useState<CategoryProduct['variants']>(variants ?? []);
  const [fetchPublicProduct, { isFetching: isFetchingProductDetails }] = useLazyGetPublicProductQuery();

  const { data: wishlistItems = [] } = useGetWishlistQuery(undefined, { skip: !isLoggedIn });
  const [addWishlist, { isLoading: isAdding }] = useAddWishlistMutation();
  const [removeWishlist, { isLoading: isRemoving }] = useRemoveWishlistMutation();

  const safeName = (name || 'Untitled Product').trim();
  const slug = safeName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const productPath = typeof id === 'number' ? `/product/${slug}-i${id}` : `/product/${slug}`;
  const srpPrice = Number(price ?? 0);
  const memberPrice = Number(priceMember ?? 0);
  const hasMemberPrice = isLoggedIn && memberPrice > 0 && memberPrice < srpPrice;
  const displayPrice = hasMemberPrice ? memberPrice : srpPrice;
  const strikePrice = hasMemberPrice ? srpPrice : Number(originalPrice ?? 0);
  const displayPv = Number(prodpv ?? 0);
  const normalizedStock = getEffectiveStock(stock, resolvedVariants);
  const isInStock = normalizedStock > 0;
  const showNewBadge = isNewProduct(createdAt);
  const isList = viewMode === 'list';
  const ratingValue =
    typeof rating === 'number' && Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : null;
  const normalizedReviewCount =
    typeof reviewCount === 'number' && Number.isFinite(reviewCount) ? Math.max(0, Math.floor(reviewCount)) : null;

  useEffect(() => {
    const nextVariants = variants ?? [];
    setResolvedVariants(nextVariants);
    setSelectedVariantSku(nextVariants[0]?.sku ?? '');
    setSelectedColor(nextVariants[0]?.color ?? '');
  }, [variants]);

  const variantOptions = useMemo(
    () =>
      (resolvedVariants ?? []).filter((variant): variant is VariantOption =>
        Boolean(
          variant &&
          (variant.sku || variant.name || variant.size || variant.color || (variant.images && variant.images.length > 0)),
        ),
      ),
    [resolvedVariants],
  );

  const hasVariants = variantOptions.length > 0;
  const colorOptions = Array.from(
    variantOptions.reduce((map, variant) => {
      if (!variant.color) return map;
      map.set(variant.color, variant.colorHex ?? '#E5E7EB');
      return map;
    }, new Map<string, string>()),
  ).map(([name, hex]) => ({ name, hex }));
  const effectiveSelectedColor = selectedColor || colorOptions[0]?.name || '';

  const variantChoices = useMemo(
    () =>
      Array.from(
        variantOptions.reduce((map, variant, index) => {
          const baseSku = stripVariantColorSuffix(variant.sku, variant.color);
          const key = `${getVariantChoiceKey(variant)}|${baseSku || index}`;
          const existing = map.get(key);

          if (existing) {
            existing.variants.push(variant);
            return map;
          }

          const label = variant.size?.trim() || variant.name?.trim() || `Variant ${index + 1}`;
          const dimensions = [
            variant.width ? `W ${variant.width}` : '',
            variant.dimension ? `D ${variant.dimension}` : '',
            variant.height ? `H ${variant.height}` : '',
          ].filter(Boolean);

          map.set(key, {
            key,
            label,
            meta: [
              variant.name?.trim() || '',
              dimensions.length > 0 ? `${dimensions.join(' x ')} cm` : '',
            ].filter((part) => part && part !== label).join(' ? '),
            variants: [variant],
          });

          return map;
        }, new Map<string, VariantChoice>()).values(),
      ),
    [variantOptions],
  );

  const visibleVariantChoices = effectiveSelectedColor
    ? variantChoices.filter((choice) => choice.variants.some((variant) => !variant.color || variant.color === effectiveSelectedColor))
    : variantChoices;

  const activeChoice = visibleVariantChoices.find((choice) =>
    choice.variants.some((variant) => (variant.sku ?? '') === selectedVariantSku),
  ) ?? visibleVariantChoices[0];

  const activeVariant = activeChoice
    ? activeChoice.variants.find((variant) => variant.color === effectiveSelectedColor) ?? activeChoice.variants[0]
    : undefined;

  const activeLabel = [
    activeVariant?.name?.trim(),
    activeVariant?.size?.trim(),
    activeVariant?.color ? displayColorName(activeVariant.color) : '',
  ].filter(Boolean).join(' ? ');

  const isWishlisted = typeof id === 'number' && wishlistItems.some((item) => item.productId === id);
  const isWishlistPending = isAdding || isRemoving;

  const addResolvedVariantToCart = (variant?: VariantOption) => {
    const variantSrp = Number(variant?.priceSrp ?? displayPrice ?? 0) || displayPrice;
    const variantMember = Number(variant?.priceMember ?? 0);
    const hasVariantMember = isLoggedIn && variantMember > 0 && variantMember < variantSrp;
    const variantPrice = hasVariantMember ? variantMember : variantSrp;
    const variantOriginal = hasVariantMember
      ? variantSrp
      : (strikePrice > variantPrice ? strikePrice : undefined);
    const variantLabel = [
      variant?.name?.trim(),
      variant?.style?.trim(),
      variant?.size?.trim(),
      variant?.color ? displayColorName(variant.color) : '',
    ].filter(Boolean).join(' ? ');
    const itemIdBase = typeof id === 'number' ? String(id) : slug;
    const itemId = variant?.sku ? `${itemIdBase}::${variant.sku}` : itemIdBase;

    addToCart({
      id: itemId,
      productId: typeof id === 'number' ? id : undefined,
      variantId: variant?.id,
      name: variantLabel ? `${safeName} (${variantLabel})` : safeName,
      price: variantPrice,
      originalPrice: typeof variantOriginal === 'number' ? variantOriginal : null,
      image: variant?.images?.[0] || imageSrc,
      prodpv: Number(variant?.prodpv ?? prodpv ?? 0) || 0,
      brand: brand ?? null,
      manualCheckoutEnabled: Boolean(manualCheckoutEnabled),
      selectedColor: variant?.color ?? null,
      selectedStyle: variant?.style ?? null,
      selectedSize: variant?.size ?? null,
      selectedType: variant?.name ?? null,
      selectedSku: variant?.sku ?? sku ?? null,
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    const run = async () => {
      if (!isInStock) return;

      if (!hasVariants && typeof id === 'number') {
        try {
          const productDetails = await fetchPublicProduct(id).unwrap();
          const nextVariants = productDetails.variants ?? [];
          setResolvedVariants(nextVariants);

          if (nextVariants.length > 0) {
            setSelectedVariantSku(nextVariants[0]?.sku ?? '');
            setSelectedColor(nextVariants[0]?.color ?? '');
            setVariantModalOpen(true);
            return;
          }
        } catch {
          // Keep default add-to-cart fallback.
        }
      }

      if (hasVariants) {
        setVariantModalOpen(true);
        return;
      }

      addResolvedVariantToCart();
    };

    e.preventDefault();
    e.stopPropagation();
    void run();
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      showErrorToast('Please log in to save to your wishlist.');
      return;
    }
    if (typeof id !== 'number') return;

    try {
      if (isWishlisted) {
        await removeWishlist(id).unwrap();
        showSuccessToast('Removed from wishlist.');
      } else {
        await addWishlist({ product_id: id, product_name: safeName }).unwrap();
        showSuccessToast('Added to wishlist!');
      }
    } catch {
      showErrorToast('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <Link href={productPath}>
        {isList ? (
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md sm:flex sm:items-stretch"
          >
            <div className="relative flex aspect-[4/3] items-center justify-center bg-slate-50 sm:aspect-auto sm:h-40 sm:w-56 sm:min-w-[14rem]">
              <Image
                src={imageSrc}
                alt={safeName}
                fill
                className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
                onError={() => setImageSrc(FALLBACK_IMAGE)}
              />

              <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
                {showNewBadge ? (
                  <span className="rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-bold tracking-wide text-white">
                    NEW
                  </span>
                ) : null}
                {badge ? (
                  <span className="rounded-full bg-sky-500 px-2 py-1 text-[10px] font-bold tracking-wide text-white">
                    {badge}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-stretch sm:justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 transition-colors group-hover:text-sky-600 sm:text-[15px]">
                  {safeName}
                </h3>

                {(ratingValue !== null || normalizedReviewCount !== null) ? (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const filled = ratingValue !== null && ratingValue >= index + 1
                        return (
                          <svg
                            key={index}
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill={filled ? '#f59e0b' : 'none'}
                            stroke={filled ? '#f59e0b' : '#cbd5f5'}
                            strokeWidth="2"
                          >
                            <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        )
                      })}
                    </div>
                    {ratingValue !== null ? <span className="font-semibold text-slate-600">{ratingValue.toFixed(1)}</span> : null}
                    {normalizedReviewCount !== null ? <span>{`(${normalizedReviewCount})`}</span> : null}
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-slate-400">No reviews yet</div>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-base font-extrabold text-sky-600">{formatMoney(displayPrice)}</span>
                  {strikePrice > displayPrice ? (
                    <span className="text-sm text-slate-400 line-through">{formatMoney(strikePrice)}</span>
                  ) : null}
                  {strikePrice > displayPrice ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      {`${Math.max(1, Math.round((1 - displayPrice / strikePrice) * 100))}% off`}
                    </span>
                  ) : null}
                </div>

                {displayPv > 0 ? (
                  <div className="mt-2 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                    {`PV ${displayPv.toLocaleString()}`}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-row items-center justify-between gap-3 sm:w-44 sm:flex-col sm:items-end sm:justify-between">
                <button
                  type="button"
                  onClick={handleWishlist}
                  disabled={isWishlistPending}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 shadow-sm transition hover:border-sky-200 dark:hover:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-900/30 disabled:opacity-60"
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted ? '#38bdf8' : 'none'} stroke={isWishlisted ? '#38bdf8' : 'currentColor'} strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!isInStock || isFetchingProductDetails}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    isInStock
                      ? 'bg-sky-500 text-white shadow-sm hover:bg-sky-600'
                      : 'cursor-not-allowed bg-slate-200 dark:bg-gray-700 text-slate-500 dark:text-gray-400'
                  } ${isFetchingProductDetails ? 'opacity-80' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  {isFetchingProductDetails ? 'Loading...' : isInStock ? 'Add to cart' : 'Out of stock'}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
        <motion.div
          whileHover={{ y: -6 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow duration-500 hover:shadow-2xl ${
            isList ? 'sm:flex sm:items-stretch' : ''
          }`}
        >
          <div
            className={`relative overflow-hidden bg-gray-50 ${
              isList ? 'aspect-[4/3] sm:aspect-auto sm:h-40 sm:w-56 sm:min-w-[14rem]' : 'aspect-square'
            }`}
          >
            <Image
              src={imageSrc}
              alt={safeName}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              onError={() => setImageSrc(FALLBACK_IMAGE)}
            />

            <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
              {showNewBadge ? (
                <span className="rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-bold tracking-wide text-white">
                  NEW
                </span>
              ) : null}
              {badge ? (
                <span className="rounded-full bg-sky-500 px-2 py-1 text-[10px] font-bold tracking-wide text-white">
                  {badge}
                </span>
              ) : null}
            </div>

            <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />

            <button
              type="button"
              onClick={handleWishlist}
              disabled={isWishlistPending}
              className="absolute right-3 top-3 rounded-full bg-white/90 dark:bg-gray-800/90 p-2 shadow-md backdrop-blur-sm transition-all duration-300 hover:bg-sky-50 dark:hover:bg-sky-900/30 group-hover:translate-x-0 group-hover:opacity-100 disabled:opacity-60 opacity-0 translate-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={isWishlisted ? '#38bdf8' : 'none'} stroke={isWishlisted ? '#38bdf8' : 'currentColor'} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            <div className="absolute bottom-0 left-0 right-0 translate-y-full p-3 transition-transform duration-300 ease-out group-hover:translate-y-0">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isInStock || isFetchingProductDetails}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isInStock
                    ? 'bg-sky-500 text-white shadow-lg hover:bg-sky-600 active:scale-95'
                    : 'cursor-not-allowed bg-slate-200 dark:bg-gray-700 text-slate-500 dark:text-gray-400'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {isFetchingProductDetails ? 'Loading...' : isInStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>

          <div className={`p-4 ${isList ? 'sm:flex-1' : ''}`}>
            <h3 className="truncate text-sm font-medium text-gray-800 transition-colors duration-200 group-hover:text-sky-500">{safeName}</h3>
            {(ratingValue !== null || normalizedReviewCount !== null) && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const filled = ratingValue !== null && ratingValue >= index + 1;
                    return (
                      <svg
                        key={index}
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill={filled ? '#f59e0b' : 'none'}
                        stroke={filled ? '#f59e0b' : '#cbd5f5'}
                        strokeWidth="2"
                      >
                        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    );
                  })}
                </div>
                {ratingValue !== null && <span className="font-semibold text-slate-600">{ratingValue.toFixed(1)}</span>}
                {normalizedReviewCount !== null && <span>{`(${normalizedReviewCount})`}</span>}
              </div>
            )}
            {ratingValue === null && normalizedReviewCount === null && isList && (
              <div className="mt-1 text-xs text-slate-400">No reviews yet</div>
            )}
            <div className="mt-1 flex items-center gap-2">
              <span className="text-base font-bold text-sky-500">{`\u20b1${displayPrice.toLocaleString()}`}</span>
              {strikePrice > displayPrice ? (
                <span className="text-sm text-gray-400 line-through">{`\u20b1${strikePrice.toLocaleString()}`}</span>
              ) : null}
            </div>
            {displayPv > 0 ? (
              <div className="mt-1.5 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                {`PV ${displayPv.toLocaleString()}`}
              </div>
            ) : null}
          </div>
        </motion.div>
        )}
      </Link>

      <AnimatePresence>
        {variantModalOpen && hasVariants ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVariantModalOpen(false)}
              className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4"
            >
              <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-sky-500">Select Variant</p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">{safeName}</h3>
                    <p className="mt-1 text-xs text-slate-500">Choose a variant before adding this product to cart.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVariantModalOpen(false)}
                    className="h-9 w-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                  >
                    ??
                  </button>
                </div>
              </div>

              <div className="max-h-[60vh] space-y-5 overflow-y-auto px-5 py-4">
                {colorOptions.length > 0 ? (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-700">Color</p>
                    <div className="flex flex-wrap gap-2.5">
                      {colorOptions.map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          title={displayColorName(color.name)}
                          onClick={() => {
                            setSelectedColor(color.name);
                            const nextChoice = variantChoices.find((choice) =>
                              choice.variants.some((variant) => variant.color === color.name),
                            );
                            const nextVariant = nextChoice?.variants.find((variant) => variant.color === color.name) ?? nextChoice?.variants[0];
                            if (nextVariant?.sku) {
                              setSelectedVariantSku(nextVariant.sku);
                            }
                          }}
                          className={`h-9 w-9 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(15,23,42,0.14)] transition-all ${
                            effectiveSelectedColor === color.name ? 'ring-2 ring-sky-400 ring-offset-2' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.hex || '#E5E7EB' }}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">Size</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {visibleVariantChoices.map((choice) => {
                      const choiceVariant = choice.variants.find((variant) => variant.color === effectiveSelectedColor) ?? choice.variants[0];
                      const isActive = choice.variants.some((variant) => (variant.sku ?? '') === (activeVariant?.sku ?? ''));
                      const choicePrice = Number(choiceVariant?.priceMember ?? choiceVariant?.priceSrp ?? displayPrice ?? 0) || displayPrice;

                      return (
                        <button
                          key={choice.key}
                          type="button"
                          onClick={() => {
                            setSelectedVariantSku(choiceVariant?.sku ?? '');
                            if (choiceVariant?.color) {
                              setSelectedColor(choiceVariant.color);
                            }
                          }}
                          className={`rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                            isActive
                              ? 'border-sky-400 bg-sky-50 text-sky-600'
                              : 'border-gray-200 text-slate-600 hover:border-sky-200'
                          }`}
                        >
                          <span className="block text-sm font-semibold">{choice.label}</span>
                          {choice.meta ? (
                            <span className="mt-1 block text-[11px] font-medium text-slate-400">{choice.meta}</span>
                          ) : null}
                          <span className="mt-2 block text-sm font-extrabold text-sky-500">{`\u20b1${choicePrice.toLocaleString()}`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 px-5 py-4">
                {activeLabel ? (
                  <p className="mb-3 text-xs font-medium text-slate-500">
                    Selected: <span className="font-bold text-slate-800">{activeLabel}</span>
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    addResolvedVariantToCart(activeVariant);
                    setVariantModalOpen(false);
                  }}
                  className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-sky-200 transition-colors hover:bg-sky-600"
                >
                  Add Selected Variant to Cart
                </button>
              </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
