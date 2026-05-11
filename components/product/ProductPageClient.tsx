'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CategoryProduct } from '@/libs/CategoryData';
import ProductImageGallery from './ProductImageGallery';
import ProductInfo from './ProductInfo';
import StickyAddToCart from './StickyAddToCart';
import { useGetProductBrandQuery } from '@/store/api/productsApi';
import { useRouter, useSearchParams } from 'next/navigation';
import { setStoredReferralCode } from '@/libs/referral';
import { resolveCheckoutSource } from '@/libs/checkoutSource';
import { useSession } from 'next-auth/react';
import type { ProductReviewSummary } from '@/store/api/productsApi';
import { useGetPublicGeneralSettingsQuery } from '@/store/api/adminSettingsApi';
import ShareModal from '@/components/ui/ShareModal';

interface ProductPageClientProps {
    product: CategoryProduct;
    categoryLabel: string;
    reviewSummary?: ProductReviewSummary | null;
    forceRealPrice?: boolean;
    allowGuestWishlist?: boolean;
}

type VariantOption = NonNullable<CategoryProduct['variants']>[number];

// Simple Brand Card Component
const BrandCardComponent = ({ productId, toSlugBrand }: { productId?: number; toSlugBrand: (s: string) => string }) => {
    const queryResult = useGetProductBrandQuery(productId ?? 0, { skip: !productId });
    const { data: brandInfo, isLoading, error, status, currentData, originalArgs } = queryResult;
    const [shareModalOpen, setShareModalOpen] = useState(false);

    // Log for debugging
    useEffect(() => {
        if (productId) {
            console.log('=== BrandCardComponent Debug ===');
            console.log('productId:', productId);
            console.log('skip:', !productId);
            console.log('query status:', status);
            console.log('isLoading:', isLoading);
            console.log('data:', brandInfo);
            console.log('currentData:', currentData);
            console.log('originalArgs:', originalArgs);
            console.log('error:', error);
            console.log('full queryResult:', queryResult);
        }
    }, [productId, isLoading, brandInfo, error, status, currentData, originalArgs, queryResult]);

    if (!productId) return null;

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 animate-pulse">
                <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                </div>
            </div>
        );
    }

    // Fallback if no data or error
    if (error || !brandInfo || !brandInfo.name) {
        console.error('Failed to load brand info for product', productId, error);
        // Show fallback brand card with placeholder
        return (
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 bg-gradient-to-br from-gray-100 to-gray-100 dark:from-gray-700 dark:to-gray-700">
                    <span className="text-lg font-bold text-gray-400 dark:text-gray-500">?</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Brand Information</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Unable to load brand details</p>
                </div>
            </div>
        );
    }

    const brandSlug = toSlugBrand(brandInfo.name);
    // Use API data - no hardcoded defaults
    const rating = brandInfo.overallRating;
    const chatPerformance = brandInfo.chatPerformance ?? 95;
    const totalProducts = brandInfo.totalProducts ?? 0;
    const isOnline = brandInfo.status === 0; // status 0 = online, other = offline

    // Format joined date
    const formatJoinedDate = (dateString?: string) => {
        if (!dateString) return 'Jan 2024';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateString;
        }
    };
    const joinedDate = formatJoinedDate(brandInfo.joinedDate);

    return (
        <div className="relative z-20 rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            {/* Content */}
            <div className="flex items-start gap-4 sm:items-center sm:gap-6">
                {/* Brand Image */}
                <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 sm:h-32 sm:w-32">
                    {brandInfo.image ? (
                        <img src={brandInfo.image} alt={brandInfo.name} className="object-contain p-2 w-full h-full" />
                    ) : (
                        <span className="text-3xl font-extrabold tracking-wider text-gray-400 dark:text-gray-500">
                            {brandInfo.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'BR'}
                        </span>
                    )}
                </div>

                {/* Brand Info */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold leading-tight text-gray-900 dark:text-white sm:text-2xl">{brandInfo.name}</h2>
                            <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                isOnline
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                                <span className={`inline-block h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                        <button
                            onClick={() => setShareModalOpen(true)}
                            className="shrink-0 rounded-full border border-gray-200 bg-white p-2 text-gray-700 transition-all duration-200 hover:border-sky-500 hover:bg-sky-500 hover:text-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-sky-500 dark:hover:bg-sky-500"
                            title="Share Brand"
                            aria-label="Share Brand"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="18" cy="5" r="3" />
                                <circle cx="6" cy="12" r="3" />
                                <circle cx="18" cy="19" r="3" />
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                        </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Browse all products from this brand
                    </p>

                    {/* Metrics */}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            <span>Chat Performance: {chatPerformance}%</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                            <span>Overall Rating: {rating ? rating.toFixed(1) : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                            <span>Total Products: {totalProducts.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>Joined: {joinedDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Brand Button */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <a
                    href={`/by-brand?brand=${encodeURIComponent(brandSlug)}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold border border-sky-400 dark:border-sky-500 bg-transparent hover:bg-sky-50 dark:hover:bg-sky-900 text-sky-500 dark:text-sky-400 rounded-lg cursor-pointer transition-colors"
                >
                    View Brand
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 5l7 7-7 7" />
                    </svg>
                </a>
            </div>
            {/* Share Modal */}
            <ShareModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                product={{
                    id: brandInfo.id,
                    name: brandInfo.name,
                    image: brandInfo.image || '',
                    price: 0,
                }}
                brandName={brandInfo.name}
                shareUrl={`https://afhome.ph/by-brand?brand=${encodeURIComponent(brandSlug)}`}
            />
        </div>
    );
};

const ProductPageClient = ({
    product,
    categoryLabel,
    reviewSummary,
    forceRealPrice = false,
    allowGuestWishlist = false,
}: ProductPageClientProps) => {
    const [selectedVariant, setSelectedVariant] = useState<VariantOption | undefined>(undefined);
    const galleryKey = selectedVariant?.images?.join('|') || product.images?.join('|') || product.image;
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const { data: publicSettingsData } = useGetPublicGeneralSettingsQuery();
    const role = String(session?.user?.role ?? '').toLowerCase();
    const isManualCheckoutOnly = Boolean(publicSettingsData?.settings?.enable_manual_checkout_mode) && !Boolean(product.manualCheckoutEnabled);

    const handleVariantChange = useCallback((variant?: VariantOption) => {
        setSelectedVariant(variant);
    }, []);

    useEffect(() => {
        const username = (searchParams.get('username') ?? '').trim();
        const preferredBy = (searchParams.get('preffered_by') ?? '').trim();
        if (!username || !preferredBy) return;

        if (status === 'authenticated' && role && role !== 'customer') return;

        try {
            if (isManualCheckoutOnly) {
                return;
            }
            setStoredReferralCode(username);
            const quantity = 1;
            const unitPrice = Number(selectedVariant?.priceSrp ?? product.price ?? 0);
            const subtotal = unitPrice * quantity;
            const handlingFee = 0;
            const total = subtotal + handlingFee;
            const checkoutSource = resolveCheckoutSource();

            localStorage.setItem('guest_checkout', JSON.stringify({
                product: {
                    ...product,
                    image: selectedVariant?.images?.[0] || product.image,
                    sku: selectedVariant?.sku ?? product.sku,
                    price: selectedVariant?.priceSrp ?? product.price,
                    prodpv: selectedVariant?.prodpv ?? product.prodpv,
                },
                quantity,
                variantId: selectedVariant?.id ?? null,
                selectedColor: selectedVariant?.color ?? null,
                selectedStyle: selectedVariant?.style ?? null,
                selectedSize: selectedVariant?.size ?? null,
                selectedType: selectedVariant?.name ?? null,
                selectedSku: selectedVariant?.sku ?? null,
                subtotal,
                handlingFee,
                total,
                sourceLabel: checkoutSource.sourceLabel ?? null,
                sourceSlug: checkoutSource.sourceSlug ?? null,
                sourceHost: checkoutSource.sourceHost ?? null,
                sourceUrl: checkoutSource.sourceUrl ?? null,
            }));
            router.replace('/checkout/customer');
        } catch {
            // If anything fails, keep user on product page.
        }
    }, [isManualCheckoutOnly, product, role, router, searchParams, selectedVariant, status]);

    const toSlugBrand = (value: string) =>
        value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start pb-20">
                <div className="space-y-4">
                    <div className="relative">
                        <ProductImageGallery
                            key={galleryKey}
                            product={product}
                            selectedVariantImages={selectedVariant?.images}
                            preferredActiveImage={selectedVariant?.images?.[0]}
                        />
                    </div>
                    <div className="relative z-20">
                        <BrandCardComponent productId={product.id} toSlugBrand={toSlugBrand} />
                    </div>
                </div>
                <ProductInfo
                    product={product}
                    categoryLabel={categoryLabel}
                    onVariantChange={handleVariantChange}
                    reviewSummary={reviewSummary ?? undefined}
                    forceRealPrice={forceRealPrice}
                    allowGuestWishlist={allowGuestWishlist}
                />
            </div>
            <StickyAddToCart product={product} selectedVariant={selectedVariant} forceRealPrice={forceRealPrice} />
        </>
    );
};

export default ProductPageClient;
