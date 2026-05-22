'use client';

/* eslint-disable react-hooks/rules-of-hooks, react-hooks/set-state-in-effect */

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useMemo, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@heroui/react/skeleton';
import Footer from '@/components/landing-page/Footer';
import TopBar from '@/components/layout/TopBar';
import Navbar from '@/components/layout/Navbar';
import ItemCard from '@/components/item/ItemCard';
import TopFilter from '@/components/item/TopFilter';
import ProductFilter, { FilterState } from '@/components/item/ProductFilter';
import ShareModal from '@/components/ui/ShareModal';
import { CategoryProduct, categoryMeta, categoryProducts, CATEGORY_BRANDS } from '@/libs/CategoryData';
import { buildStorefrontProductPath, extractPartnerSlugFromPath } from '@/libs/storefrontRouting';
import type { Category } from '@/store/api/categoriesApi';
import { useGetPublicZqProductsQuery, type ZqCachedProduct } from '@/store/api/productsApi';
import { useGetPublicProductBrandsQuery } from '@/store/api/productBrandsApi';

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

const GridIcon = ({ active }: { active: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill={active ? '#38bdf8' : '#9ca3af'}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
);

const ListIcon = ({ active }: { active: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#38bdf8' : '#9ca3af'} strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="4" rx="1" />
        <rect x="3" y="11" width="18" height="4" rx="1" />
        <rect x="3" y="18" width="18" height="4" rx="1" />
    </svg>
);

const ChevronDown = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
);

const slugifyCategory = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/&/g, ' ')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

const normalizeCategorySlug = (rawUrl: string | null | undefined, fallbackName: string) => {
    const source = (rawUrl ?? '').trim();
    if (!source || source === '0') return slugifyCategory(fallbackName);
    const withoutDomain = source.replace(/^https?:\/\/[^/]+/i, '');
    const cleaned = withoutDomain.replace(/^\/+/, '').replace(/^category\//i, '').replace(/\/+$/, '');
    return cleaned || slugifyCategory(fallbackName);
};

const zqPrice = (product: ZqCachedProduct) => Number(product.priceMinCents ?? product.priceMaxCents ?? 0) / 100;
const zqComparePrice = (product: ZqCachedProduct) => Number(product.priceMaxCents ?? product.priceMinCents ?? 0) / 100;

function ZqCategoryGridCard({ product }: { product: ZqCachedProduct }) {
    const price = zqPrice(product);
    const comparePrice = zqComparePrice(product);
    const image = product.primaryImage || product.images?.[0] || '/Images/af_home_logo.png';
    const discount = comparePrice > price ? Math.max(1, Math.round(((comparePrice - price) / comparePrice) * 100)) : 6;

    return (
        <Link href={`/global-product/${product.id}`} className="flex flex-col group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-sky-500 dark:hover:border-sky-400 transition-colors cursor-pointer">
            <div className="relative aspect-square w-full bg-gray-100 dark:bg-gray-700 overflow-hidden border-b border-gray-200 dark:border-gray-700">
                <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                    <button
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                        }}
                        className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-600 shadow-lg hover:bg-sky-500 hover:border-sky-500 dark:hover:bg-sky-500 dark:hover:border-sky-500 transition-all duration-200 cursor-pointer"
                        title="Add to Wishlist"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </button>
                    <button
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void navigator.clipboard.writeText(`${window.location.origin}/global-product/${product.id}`);
                        }}
                        className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-600 shadow-lg hover:bg-sky-500 hover:border-sky-500 dark:hover:bg-sky-500 dark:hover:border-sky-500 transition-all duration-200 cursor-pointer"
                        title="Share"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                    </button>
                </div>
                <img src={image} alt={product.subject} className="h-full w-full object-cover" />
                <div className="absolute top-0 left-0 flex flex-col">
                    <div className="bg-sky-500 text-white text-xs font-bold px-2 py-1">Register to get {discount}% discount</div>
                </div>
                <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg transition-all duration-300 hover:bg-sky-600 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2 sm:text-sm sm:font-semibold sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    <span className="hidden sm:inline">View Product</span>
                </div>
            </div>
            <div className="mt-1 flex flex-col gap-1 px-2.5 sm:px-3 py-2.5 sm:py-3">
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">AF HOME GLOBAL BRAND</p>
                <h3 className="line-clamp-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-snug min-h-[2.5rem]">{product.subject}</h3>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-2">
                    <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-bold text-sky-500 dark:text-sky-400">P{price.toLocaleString()}</span>
                        {comparePrice > price && <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 line-through">P{comparePrice.toLocaleString()}</span>}
                    </div>
                    <span className="rounded-full border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 px-1 sm:px-2 py-0.5 text-[8px] sm:text-[11px] font-semibold text-blue-700 dark:text-blue-300 shrink-0 whitespace-nowrap w-fit">PV 0</span>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1">
                    <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" className="sm:w-[10px] sm:h-[10px]">
                                <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                        ))}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">0 sold</span>
                </div>
            </div>
        </Link>
    );
}

function TopFilterSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
                <Skeleton className="h-10 w-full rounded-xl" />
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end">
                    <Skeleton className="h-8 w-16 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

function ProductGridSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                    <div className="flex gap-2">
                        <Skeleton className="h-4 w-16 rounded" />
                        <Skeleton className="h-4 w-16 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ProductFilterSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-8 w-full rounded" />
                </div>
            ))}
            <Skeleton className="aspect-square w-full rounded-2xl" />
        </div>
    );
}

const buildVisiblePages = (totalPages: number, currentPage: number): Array<number | 'ellipsis'> => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
    }

    if (currentPage >= totalPages - 3) {
        return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
};

interface CategoryListProductMainProps {
    slug: string;
    initialCategoryLabel?: string;
    initialProducts?: CategoryProduct[];
    initialCategories?: Category[];
    partnerBranding?: {
        logoSrc?: string;
        displayName?: string;
        productHref?: string;
        heroVideoUrl?: string;
        enableActivateDiscount?: boolean;
    };
    isRoomPage?: boolean;
    isLoading?: boolean;
    hasError?: boolean;
}

const titleFromSlug = (slug: string) =>
    slug
        .split('-')
        .filter(Boolean)
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(' ');

function PartnerOrderFooter({ partnerName }: { partnerName: string }) {
    return (
        <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
                Orders from <span className="font-semibold text-slate-800">{partnerName}</span> are still processed through AF Home.
            </div>
        </footer>
    );
}

export default function CategoryListProductMain({
    slug,
    initialCategoryLabel,
    initialProducts,
    initialCategories = [],
    partnerBranding,
    isRoomPage = false,
    isLoading = false,
    hasError = false,
}: CategoryListProductMainProps) {
    const pathname = usePathname();
    const partnerSlug = extractPartnerSlugFromPath(pathname);
    const isPartnerStorefrontRoute = Boolean(partnerSlug);
    const partnerName = partnerBranding?.displayName || (partnerSlug ? titleFromSlug(partnerSlug) : 'Partner Store');
    const partnerProductHref = partnerBranding?.productHref || (partnerSlug ? `/shop/${partnerSlug}/product` : '/shop');
    const partnerLogoSrc = partnerBranding?.logoSrc || '/Images/af_home_logo.png';
    const heroVideoSrc = partnerBranding?.heroVideoUrl || '/loginpageVideo/afhome.mp4';
    const partnerDiscountEnabled = Boolean(partnerBranding?.enableActivateDiscount);
    const forceRealPriceForPartner = isPartnerStorefrontRoute && !partnerDiscountEnabled;
    const hideDiscountBadgeForPartner = isPartnerStorefrontRoute && !partnerDiscountEnabled;
    const meta = categoryMeta[slug];
    const staticProducts = categoryProducts[slug];
    const hasDynamicProducts = Array.isArray(initialProducts) && initialProducts.length > 0;
    const safeProducts = useMemo(
        () => (hasDynamicProducts ? (initialProducts ?? []) : (staticProducts ?? [])),
        [hasDynamicProducts, initialProducts, staticProducts],
    );
    const defaultPriceMax = useMemo(() => {
        const maxPrice = safeProducts.reduce((highest, product) => Math.max(highest, Number(product.price ?? 0)), 0);
        if (maxPrice <= 0) return 10000;
        return Math.max(10000, Math.ceil(maxPrice / 1000) * 1000);
    }, [safeProducts]);
    const defaultPvMax = useMemo(() => {
        const maxPv = safeProducts.reduce((highest, product) => Math.max(highest, Number(product.prodpv ?? 0)), 0);
        if (maxPv <= 0) return 5000;
        return Math.max(5000, Math.ceil(maxPv / 100) * 100);
    }, [safeProducts]);
    const currentCategoryId = useMemo(() => {
        const normalizedSlug = slug.toLowerCase();
        const matchedCategory = initialCategories.find((category) => {
            const byUrl = normalizeCategorySlug(category.url, category.name) === normalizedSlug;
            const byName = slugifyCategory(category.name) === normalizedSlug;
            return byUrl || byName;
        });

        return matchedCategory?.id;
    }, [initialCategories, slug]);
    const shouldLoadMappedZqProducts = Boolean(currentCategoryId && !isRoomPage && !isPartnerStorefrontRoute);
    const { data: zqCategoryProductsData, isFetching: isFetchingZqCategoryProducts } = useGetPublicZqProductsQuery(
        shouldLoadMappedZqProducts
            ? { page: 1, perPage: 100, localCategoryId: currentCategoryId }
            : undefined,
        { skip: !shouldLoadMappedZqProducts },
    );
    const { data: publicBrandsData } = useGetPublicProductBrandsQuery(undefined, {
        skip: isPartnerStorefrontRoute,
    });
    const zqCategoryProducts = useMemo(
        () => zqCategoryProductsData?.products ?? [],
        [zqCategoryProductsData?.products],
    );
    const effectiveDefaultPriceMax = useMemo(() => {
        const maxZqPrice = zqCategoryProducts.reduce((highest, product) => Math.max(highest, zqComparePrice(product), zqPrice(product)), 0);
        return Math.max(defaultPriceMax, maxZqPrice > 0 ? Math.ceil(maxZqPrice / 1000) * 1000 : 0);
    }, [defaultPriceMax, zqCategoryProducts]);
    const publicBrandOptions = useMemo(() => {
        const map = new Map<string, { id: number; name: string }>();
        (publicBrandsData?.brands ?? []).forEach((brand) => {
            const brandName = brand.name?.trim();
            if (!brandName) return;
            const key = brandName.toLowerCase();
            if (!map.has(key)) {
                map.set(key, { id: brand.id, name: brandName });
            }
        });

        if (!map.has('af home global brand')) {
            map.set('af home global brand', { id: 1000000, name: 'AF HOME GLOBAL BRAND' });
        }

        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [publicBrandsData?.brands]);

    const categoryLabel = initialCategoryLabel ?? meta?.label ?? titleFromSlug(slug);

    if (isLoading) {
        return (
            <>
                <div
                    className="fixed inset-0 -z-50 category-background"
                    style={{
                        backgroundColor: '#faf8f5',
                        background: '#faf8f5'
                    } as React.CSSProperties}
                />
                <style dangerouslySetInnerHTML={{
                    __html: `
                        html.dark .category-background {
                            background-color: #030712 !important;
                            background: #030712 !important;
                        }
                    `
                }} />
                <div className="relative min-h-screen text-slate-900 dark:text-white flex flex-col">
                    {!isPartnerStorefrontRoute && <TopBar />}
                    <Navbar
                        initialCategories={initialCategories}
                        logoSrc={partnerLogoSrc}
                        logoAlt={isPartnerStorefrontRoute ? partnerName : 'AF Home'}
                        logoHref={isPartnerStorefrontRoute ? partnerProductHref : '/shop'}
                        hideSignIn={false}
                        hideNavLinks={false}
                        categoryOnlyNav={isPartnerStorefrontRoute}
                        stickToTop={isPartnerStorefrontRoute}
                        showGuestCartWishlist={isPartnerStorefrontRoute}
                    />

                    <main className="flex-1">
                        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                                <h1 className="text-base font-bold text-slate-800 dark:text-white">{categoryLabel}</h1>
                                <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                                    <span className="font-medium">Home</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                                    <span className="text-slate-600 dark:text-gray-300 font-semibold">{categoryLabel}</span>
                                </nav>
                            </div>
                        </div>

                        <div className="container mx-auto px-4 py-6 lg:py-8">
                            <div className="flex gap-6 items-start">
                                <aside className="hidden lg:block w-80 shrink-0 sticky top-4 z-10">
                                    <ProductFilter
                                        onFilterChange={() => undefined}
                                        search=""
                                        categories={initialCategories}
                                        currentCategory={categoryLabel}
                                        maxPrice={effectiveDefaultPriceMax}
                                        pvRange={[0, defaultPvMax]}
                                        brands={publicBrandOptions}
                                    />
                                    <div className="mt-4 rounded-2xl overflow-hidden aspect-square border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                        <video
                                            className="h-full w-full object-cover"
                                            src={heroVideoSrc}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                        />
                                    </div>
                                </aside>

                                <div className="flex-1 min-w-0">
                                    <ProductGridSkeleton />
                                </div>
                            </div>
                        </div>
                    </main>
                    {isPartnerStorefrontRoute ? <PartnerOrderFooter partnerName={partnerName} /> : <Footer />}
                </div>
            </>
        );
    }

    if (hasError) {
        return (
            <>
                <div
                    className="fixed inset-0 -z-50 category-background"
                    style={{
                        backgroundColor: '#faf8f5',
                        background: '#faf8f5'
                    } as React.CSSProperties}
                />
                <style dangerouslySetInnerHTML={{
                    __html: `
                        html.dark .category-background {
                            background-color: #030712 !important;
                            background: #030712 !important;
                        }
                    `
                }} />
                <div className="relative min-h-screen text-slate-900 dark:text-white flex flex-col">
                    {!isPartnerStorefrontRoute && <TopBar />}
                    <Navbar
                        initialCategories={initialCategories}
                        logoSrc={partnerLogoSrc}
                        logoAlt={isPartnerStorefrontRoute ? partnerName : 'AF Home'}
                        logoHref={isPartnerStorefrontRoute ? partnerProductHref : '/shop'}
                        hideSignIn={false}
                        hideNavLinks={false}
                        categoryOnlyNav={isPartnerStorefrontRoute}
                        stickToTop={isPartnerStorefrontRoute}
                        showGuestCartWishlist={isPartnerStorefrontRoute}
                    />

                    <main className="flex-1">
                        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                            <div className="container mx-auto px-4 py-3">
                                <h1 className="text-base font-bold text-slate-800 dark:text-white">{categoryLabel}</h1>
                            </div>
                        </div>

                        <div className="container mx-auto px-4 py-24">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                </div>
                                <p className="text-slate-700 dark:text-gray-200 font-semibold mb-1">Failed to load products</p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">Something went wrong. Please try refreshing the page.</p>
                                <button onClick={() => window.location.reload()} className="text-sm font-semibold text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors">
                                    Refresh page
                                </button>
                            </div>
                        </div>
                    </main>
                    {isPartnerStorefrontRoute ? <PartnerOrderFooter partnerName={partnerName} /> : <Footer />}
                </div>
            </>
        );
    }

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showCount, setShowCount] = useState(16);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const listingTopRef = useRef<HTMLDivElement | null>(null);
    
    // Share modal state
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareProduct, setShareProduct] = useState<CategoryProduct | null>(null);
    
    // Filter state for ProductFilter component
    const [filterState, setFilterState] = useState<FilterState>({
        priceRange: [0, effectiveDefaultPriceMax],
        sortBy: 'default',
        inStock: false,
        discountOnly: false,
        minDiscount: 0,
        pvRange: [0, defaultPvMax],
        search: '',
        hasPvOnly: false,
        brand: ''
    });
    const [topSortBy, setTopSortBy] = useState('default');

    // Filter change handler for ProductFilter component
    const handleFilterChange = (filters: FilterState) => {
        setFilterState(filters);
        setSearchQuery(filters.search);
    };

    // Reset filters function
    const resetFilters = () => {
        setFilterState({
            priceRange: [0, effectiveDefaultPriceMax],
            sortBy: 'default',
            inStock: false,
            discountOnly: false,
            minDiscount: 0,
            pvRange: [0, defaultPvMax],
            search: '',
            hasPvOnly: false,
            brand: ''
        });
        setSearchQuery('');
        setTopSortBy('default');
        setViewMode('grid');
        setShowCount(16);
    };

    // Search change handler for TopFilter component
    const handleSearchChange = (search: string) => {
        setSearchQuery(search);
    };

    // View type change handler for TopFilter component
    const handleViewTypeChange = (viewType: 'grid' | 'list') => {
        setViewMode(viewType);
    };

    // Show number change handler for TopFilter component
    const handleShowNumberChange = (showNumber: number | 'all') => {
        setShowCount(showNumber === 'all' ? Math.max(1, safeProducts.length + zqCategoryProducts.length) : showNumber);
    };

    // Sort change handler for TopFilter component
    const handleSortChange = (sort: string) => {
        setTopSortBy(sort);
    };

    const filteredProducts = useMemo(() => {
        let result = safeProducts.filter(p => {
            // Filter by price range
            const passPrice = p.price >= filterState.priceRange[0] && p.price <= filterState.priceRange[1];

            // Filter by search query
            const passSearch = searchQuery === '' ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));

            // Filter by stock
            const srpPrice = (p.priceSrp ? Number(p.priceSrp) : undefined) ?? (p.price ? Number(p.price) : undefined) ?? 0
            const memberPrice = (p.priceMember ? Number(p.priceMember) : undefined) ?? (p.priceDp ? Number(p.priceDp) : undefined) ?? 0
            const hasMemberPrice = memberPrice > 0 && memberPrice < srpPrice
            const passStock = !filterState.inStock || (p.stock !== undefined && p.stock > 0);

            // Filter by discount
            let passDiscount = true;
            if (filterState.discountOnly) {
                if (filterState.minDiscount > 0) {
                    // Calculate discount percentage
                    const discountPercent = srpPrice > 0 && memberPrice > 0 
                        ? ((srpPrice - memberPrice) / srpPrice) * 100 
                        : 0;
                    passDiscount = hasMemberPrice && discountPercent >= filterState.minDiscount;
                } else {
                    passDiscount = hasMemberPrice;
                }
            }

            // Filter by PV range
            const pv = p.prodpv ? Number(p.prodpv) : 0;
            const passPvRange = !filterState.hasPvOnly || (pv >= filterState.pvRange[0] && pv <= filterState.pvRange[1]);

            // Filter by hasPvOnly
            const passHasPv = !filterState.hasPvOnly || pv > 0;
            const selectedBrand = (filterState.brand ?? '').trim().toLowerCase();
            const passBrand = !selectedBrand || (p.brand ?? '').trim().toLowerCase() === selectedBrand;

            return passPrice && passSearch && passStock && passDiscount && passPvRange && passHasPv && passBrand;
        });

        // Apply sorting - prioritize topSortBy, fall back to filterState.sortBy
        const sortBy = topSortBy !== 'default' ? topSortBy : filterState.sortBy;

        // Map ProductFilter 'asc'/'desc' to 'name-asc'/'name-desc'
        const effectiveSortBy = sortBy === 'asc' ? 'name-asc' : sortBy === 'desc' ? 'name-desc' : sortBy;

        if (effectiveSortBy === 'name-asc') {
            result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        } else if (effectiveSortBy === 'name-desc') {
            result = [...result].sort((a, b) => b.name.localeCompare(a.name));
        } else if (effectiveSortBy === 'price-asc') {
            result = [...result].sort((a, b) => a.price - b.price);
        } else if (effectiveSortBy === 'price-desc') {
            result = [...result].sort((a, b) => b.price - a.price);
        }
        // 'default' keeps original order

        return result;
    }, [safeProducts, filterState, searchQuery, topSortBy]);

    const filteredZqProducts = useMemo(() => {
        let result = zqCategoryProducts.filter((product) => {
            const price = zqPrice(product);
            const comparePrice = zqComparePrice(product);
            const passPrice = price >= filterState.priceRange[0] && price <= filterState.priceRange[1];
            const searchValue = searchQuery.trim().toLowerCase();
            const passSearch = searchValue === '' ||
                product.subject.toLowerCase().includes(searchValue) ||
                (product.categoryName ?? '').toLowerCase().includes(searchValue) ||
                'af home global brand'.includes(searchValue);
            const passStock = !filterState.inStock || product.totalStock > 0;
            const hasDiscount = comparePrice > price;
            const discountPercent = comparePrice > 0 ? ((comparePrice - price) / comparePrice) * 100 : 0;
            const passDiscount = !filterState.discountOnly ||
                (hasDiscount && (filterState.minDiscount <= 0 || discountPercent >= filterState.minDiscount));
            const passPv = !filterState.hasPvOnly;
            const selectedBrand = (filterState.brand ?? '').trim().toLowerCase();
            const passBrand = !selectedBrand || selectedBrand === 'af home global brand';

            return passPrice && passSearch && passStock && passDiscount && passPv && passBrand;
        });

        const sortBy = topSortBy !== 'default' ? topSortBy : filterState.sortBy;
        const effectiveSortBy = sortBy === 'asc' ? 'name-asc' : sortBy === 'desc' ? 'name-desc' : sortBy;

        if (effectiveSortBy === 'name-asc') {
            result = [...result].sort((a, b) => a.subject.localeCompare(b.subject));
        } else if (effectiveSortBy === 'name-desc') {
            result = [...result].sort((a, b) => b.subject.localeCompare(a.subject));
        } else if (effectiveSortBy === 'price-asc') {
            result = [...result].sort((a, b) => zqPrice(a) - zqPrice(b));
        } else if (effectiveSortBy === 'price-desc') {
            result = [...result].sort((a, b) => zqPrice(b) - zqPrice(a));
        }

        return result;
    }, [zqCategoryProducts, filterState, searchQuery, topSortBy]);

    const categoryBrandOptions = publicBrandOptions;

    const catalogRows = useMemo(
        () => [
            ...filteredProducts
                .filter((product): product is CategoryProduct & { id: number } => product.id !== undefined)
                .map((product) => ({ type: 'local' as const, product, key: `local-${product.id}` })),
            ...filteredZqProducts.map((product) => ({ type: 'zq' as const, product, key: `zq-${product.id}` })),
        ],
        [filteredProducts, filteredZqProducts],
    );

    // Reset to page 1 when filters/sort/showCount change.
    useEffect(() => { setCurrentPage(1); }, [filterState, searchQuery, showCount, topSortBy, zqCategoryProducts.length]);

    // Reset pagination when switching to a different category route.
    useEffect(() => {
        setCurrentPage(1);
    }, [slug]);

    const totalPages = Math.max(1, Math.ceil(catalogRows.length / showCount));
    const boundedCurrentPage = Math.min(currentPage, totalPages);
    const visiblePages = buildVisiblePages(totalPages, boundedCurrentPage);
    const paginatedRows = catalogRows.slice((boundedCurrentPage - 1) * showCount, boundedCurrentPage * showCount);

    useEffect(() => {
        if (boundedCurrentPage <= 1) return;
        listingTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [boundedCurrentPage]);

    const hasActiveFilters = filterState.priceRange[0] > 0 ||
        filterState.priceRange[1] < effectiveDefaultPriceMax ||
        filterState.inStock ||
        filterState.discountOnly ||
        filterState.minDiscount > 0 ||
        filterState.hasPvOnly ||
        Boolean(filterState.brand) ||
        searchQuery !== '' ||
        topSortBy !== 'default' ||
        viewMode !== 'grid' ||
        showCount !== 16;
    
    const activeFilterCount = [
        filterState.priceRange[0] > 0,
        filterState.priceRange[1] < effectiveDefaultPriceMax,
        filterState.inStock,
        filterState.discountOnly,
        filterState.minDiscount > 0,
        filterState.hasPvOnly,
        Boolean(filterState.brand),
        searchQuery !== ''
    ].filter(Boolean).length;

    return (
        <>
            <div 
                className="fixed inset-0 -z-50 category-background"
                style={{ 
                    backgroundColor: '#faf8f5',
                    background: '#faf8f5'
                } as React.CSSProperties}
            />
            <style dangerouslySetInnerHTML={{
                __html: `
                    html.dark .category-background {
                        background-color: #030712 !important;
                        background: #030712 !important;
                    }
                `
            }} />
            <div className="relative min-h-screen text-slate-900 dark:text-white flex flex-col">
            {!isPartnerStorefrontRoute && <TopBar />}
            <Navbar
                initialCategories={initialCategories}
                logoSrc={partnerLogoSrc}
                logoAlt={isPartnerStorefrontRoute ? partnerName : 'AF Home'}
                logoHref={isPartnerStorefrontRoute ? partnerProductHref : '/shop'}
                hideSignIn={false}
                hideNavLinks={false}
                categoryOnlyNav={isPartnerStorefrontRoute}
                stickToTop={isPartnerStorefrontRoute}
                showGuestCartWishlist={isPartnerStorefrontRoute}
            />

            <main className="flex-1">
                {/* Breadcrumb */}
                <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                    <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                        <h1 className="text-base font-bold text-slate-800 dark:text-white">{categoryLabel}</h1>
                        <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                            <Link href={isPartnerStorefrontRoute ? partnerProductHref : '/'} className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors font-medium">Home</Link>
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                            <span className="text-slate-600 dark:text-gray-300 font-semibold">{categoryLabel}</span>
                        </nav>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-6 lg:py-8">
                    <div className="flex gap-6 items-start">

                        {/* --- PRODUCT FILTER SIDEBAR --- */}
                        <aside className="hidden lg:block w-80 shrink-0 sticky top-4 z-10">
                            <ProductFilter
                                onFilterChange={handleFilterChange}
                                search={searchQuery}
                                categories={initialCategories}
                                currentCategory={categoryLabel}
                                maxPrice={effectiveDefaultPriceMax}
                                pvRange={[0, defaultPvMax]}
                                brands={categoryBrandOptions}
                            />
                            {/* Video Section */}
                            <div className="mt-4 rounded-2xl overflow-hidden aspect-square border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <video
                                    className="h-full w-full object-cover"
                                    src={heroVideoSrc}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            </div>
                        </aside>

                        {/* --- MAIN CONTENT --- */}
                        <div className="flex-1 min-w-0">

                            {/* Top Filter */}
                            <div ref={listingTopRef} className="mb-5">
                                <TopFilter
                                    onSearchChange={handleSearchChange}
                                    onViewTypeChange={handleViewTypeChange}
                                    onShowNumberChange={handleShowNumberChange}
                                    onSortChange={handleSortChange}
                                    onClearFilters={resetFilters}
                                    searchValue={searchQuery}
                                    viewType={viewMode}
                                    showNumber={showCount}
                                    sortValue={topSortBy}
                                    className="mb-4"
                                    hasActiveFilters={hasActiveFilters}
                                    showPageSizeControl={false}
                                />
                                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>
                                        Showing <span className="font-semibold text-slate-700 dark:text-gray-200">{paginatedRows.length}</span> of{' '}
                                        <span className="font-semibold text-slate-700 dark:text-gray-200">{catalogRows.length}</span> products
                                        {isFetchingZqCategoryProducts && (
                                            <span className="ml-2 text-xs font-medium text-sky-500">Loading global products...</span>
                                        )}
                                    </span>
                                    {hasActiveFilters && (
                                        <span className="text-xs text-sky-500 dark:text-sky-400 font-medium">
                                            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Products */}
                            {catalogRows.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round">
                                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-700 dark:text-gray-200 font-semibold mb-1">No products found</p>
                                    <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">Try adjusting your filters</p>
                                    <button onClick={resetFilters} className="text-sm font-semibold text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors">
                                        Clear all filters
                                    </button>
                                </div>
                            ) : (
                                <div className={
                                    viewMode === 'grid'
                                        ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                                        : 'flex flex-col gap-3'
                                }>
                                    {paginatedRows.map((row) => (
                                        <motion.div
                                            key={row.key}
                                            initial={false}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.16, ease: 'easeOut' }}
                                        >
                                            {row.type === 'zq' ? (
                                                <ZqCategoryGridCard product={row.product} />
                                            ) : viewMode === 'grid' ? (
                                                <ItemCard
                                                    key={row.product.id}
                                                    product={row.product}
                                                    brandName={row.product.brand || ''}
                                                    hideDiscountBadge={hideDiscountBadgeForPartner}
                                                    forceRealPrice={forceRealPriceForPartner}
                                                    allowGuestAddToCart={isPartnerStorefrontRoute}
                                                    allowGuestWishlist={isPartnerStorefrontRoute}
                                                />
                                            ) : (
                                                <ListViewProduct
                                                    key={row.product.id}
                                                    product={row.product}
                                                    onShareClick={(p) => { setShareProduct(p); setShareModalOpen(true); }}
                                                    hideDiscountBadge={hideDiscountBadgeForPartner}
                                                    forceRealPrice={forceRealPriceForPartner}
                                                />
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
{/* Pagination */}
                            {catalogRows.length > 0 && (
                                <div className="mt-8 border-t border-gray-100 pt-5 dark:border-gray-800">
                                    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                                        <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <span>Show</span>
                                            <select
                                                value={showCount >= catalogRows.length ? catalogRows.length : showCount}
                                                onChange={(event) => handleShowNumberChange(Number(event.target.value))}
                                                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-all hover:border-sky-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                            >
                                                {[12, 16, 24, 48, 96].map((option) => (
                                                    <option key={option} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-1 overflow-x-auto pb-1">
                                            {totalPages > 1 && (
                                                <>
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                        disabled={boundedCurrentPage === 1}
                                                        className="h-9 shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:border-sky-400 hover:text-sky-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-sky-400"
                                                    >
                                                        Prev
                                                    </button>

                                                    {visiblePages.map((page, index) => {
                                                        if (page === 'ellipsis') {
                                                            return (
                                                                <span
                                                                    key={`ellipsis-${index}`}
                                                                    className="inline-flex h-9 w-8 shrink-0 items-center justify-center text-sm text-gray-400 dark:text-gray-500"
                                                                >
                                                                    ...
                                                                </span>
                                                            );
                                                        }

                                                        return (
                                                            <button
                                                                key={page}
                                                                onClick={() => setCurrentPage(page)}
                                                                className={`h-9 w-9 shrink-0 rounded-lg border text-sm font-medium transition-colors ${
                                                                    page === boundedCurrentPage
                                                                        ? 'border-sky-500 bg-sky-500 text-white shadow-sm'
                                                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 hover:border-sky-400 hover:text-sky-500 dark:hover:border-sky-400'
                                                                }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        );
                                                    })}

                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                        disabled={boundedCurrentPage === totalPages}
                                                        className="h-9 shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:border-sky-400 hover:text-sky-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-sky-400"
                                                    >
                                                        Next
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            {isPartnerStorefrontRoute ? <PartnerOrderFooter partnerName={partnerName} /> : <Footer />}
        </div>
        {/* Share Modal */}
        {shareProduct && shareProduct.id && (
            <ShareModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                product={{
                    id: shareProduct.id,
                    name: shareProduct.name,
                    image: shareProduct.image,
                    price: shareProduct.price,
                    priceMember: shareProduct.priceMember,
                    priceDp: shareProduct.priceDp,
                    priceSrp: shareProduct.priceSrp,
                    originalPrice: shareProduct.originalPrice,
                    sku: shareProduct.sku,
                    prodpv: shareProduct.prodpv,
                    brand: shareProduct.brand,
                }}
                brandName={shareProduct.brand || ''}
                shareUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}${buildStorefrontProductPath(shareProduct.name, shareProduct.id, pathname)}`}
                forceRealPrice={forceRealPriceForPartner}
            />
        )}
        </>
    );
}

interface ListViewProductProps {
    product: CategoryProduct;
    onShareClick: (product: CategoryProduct) => void;
    hideDiscountBadge?: boolean;
    forceRealPrice?: boolean;
}

function ListViewProduct({ product, onShareClick, hideDiscountBadge = false, forceRealPrice = false }: ListViewProductProps) {
    const pathname = usePathname()
    const srpPrice = (product.priceSrp ? Number(product.priceSrp) : undefined) ?? (product.price ? Number(product.price) : undefined) ?? 0
    const memberPrice = (product.priceMember ? Number(product.priceMember) : undefined) ?? (product.priceDp ? Number(product.priceDp) : undefined) ?? 0
    const hasMemberPrice = memberPrice > 0 && memberPrice < srpPrice
    const showMemberPrice = hasMemberPrice && !forceRealPrice
    const displayPrice = showMemberPrice ? memberPrice : srpPrice
    const strikePrice = showMemberPrice ? srpPrice : Number(product.originalPrice ?? 0)
    const displayPv = Number(product.prodpv ?? 0)
    const productWithStats = product as CategoryProduct & { soldCount?: number; avgRating?: number }
    const averageRating = Math.max(0, Math.min(5, Number(productWithStats.avgRating ?? product.rating ?? 0)))
    const hasRating = averageRating > 0
    const filledStars = Math.floor(averageRating)
    const soldCount = Number(productWithStats.soldCount ?? 0)
    const { data: session } = useSession()
    const isLoggedIn = Boolean(session?.user)

    return (
        <Link
            href={buildStorefrontProductPath(product.name, product.id, pathname)}
            className="flex gap-2 sm:gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-sky-500 dark:hover:border-sky-400 transition-colors group relative"
        >
            <div className="relative aspect-square w-20 sm:w-32 bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0 flex-shrink-0">
                {/* Discount Badge */}
                {showMemberPrice && !hideDiscountBadge && (
                    <div className="absolute top-2 left-2 bg-sky-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 z-10 max-w-[calc(100%-16px)]">
                        {isLoggedIn ? `Enjoy ${Math.round(((srpPrice - memberPrice) / srpPrice) * 100)}% off` : `Register to get ${Math.round(((srpPrice - memberPrice) / srpPrice) * 100)}% discount`}
                    </div>
                )}
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="sm:w-12 sm:h-12">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </div>
                )}
            </div>
            <div className="flex flex-col justify-center flex-1 p-2 sm:p-4 relative min-w-0">
                <h3 className="text-xs sm:text-base font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 line-clamp-2 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">{product.name}</h3>
                <div className="flex items-baseline gap-1 sm:gap-2 mb-1 sm:mb-2 flex-wrap">
                    <span className="text-sm sm:text-lg font-bold text-sky-500 dark:text-sky-400">
                        {'\u20b1'}{displayPrice.toLocaleString()}
                    </span>
                    {strikePrice > displayPrice && (
                        <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 line-through">
                            {'\u20b1'}{strikePrice.toLocaleString()}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {displayPv > 0 && (
                        <span className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[11px] font-semibold text-blue-700 dark:text-blue-300 whitespace-nowrap">
                            PV {displayPv.toLocaleString()}
                        </span>
                    )}
                </div>
                {/* Sales/Ratings */}
                <div className="flex items-center gap-1 mt-1">
                    <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                                key={star}
                                xmlns="http://www.w3.org/2000/svg"
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill={hasRating && star <= filledStars ? '#38bdf8' : 'none'}
                                stroke={hasRating && star <= filledStars ? '#38bdf8' : '#d1d5db'}
                                strokeWidth="2"
                            >
                                <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                        ))}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        {hasRating ? `${averageRating.toFixed(1)} · ` : ''}{soldCount} sold
                    </span>
                </div>

                {/* Action Icons - Bottom */}
                <div className="flex gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            // Add to wishlist functionality here
                        }}
                        className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-sky-100 dark:hover:bg-sky-900/20 hover:border-sky-300 dark:hover:border-sky-600 transition-all duration-200 cursor-pointer"
                        title="Add to Wishlist"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onShareClick(product)
                        }}
                        className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-sky-100 dark:hover:bg-sky-900/20 hover:border-sky-300 dark:hover:border-sky-600 transition-all duration-200 cursor-pointer"
                        title="Share"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                    </button>
                </div>

                {/* Add to Cart Button */}
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        // Add to cart functionality here
                    }}
                    className="mt-1 sm:absolute sm:bottom-4 sm:right-4 flex items-center justify-center gap-1 sm:gap-2 rounded-full bg-sky-500 hover:bg-sky-600 px-2.5 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold text-white sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-300 cursor-pointer w-full sm:w-auto"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    Add to Cart
                </button>
            </div>
        </Link>
    )
}


