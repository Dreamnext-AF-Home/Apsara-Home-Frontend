'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useMemo, useEffect, useRef } from 'react';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import Navbar from '@/components/layout/Navbar';
import ProductCard from '@/components/ui/ProductCard';
import { CategoryProduct, categoryMeta, categoryProducts, CATEGORY_BRANDS } from '@/libs/CategoryData';
import type { Category } from '@/store/api/categoriesApi';

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

const GridIcon = ({ active }: { active: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill={active ? '#f97316' : '#9ca3af'}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
);

const ListIcon = ({ active }: { active: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#f97316' : '#9ca3af'} strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="4" rx="1" />
        <rect x="3" y="11" width="18" height="4" rx="1" />
        <rect x="3" y="18" width="18" height="4" rx="1" />
    </svg>
);

const ChevronDown = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
);

const PRICE_BRACKETS = [
    { id: 'under10', label: 'Under PHP 10k', min: 0, max: 9999 },
    { id: '10to25', label: 'PHP 10k - PHP 25k', min: 10000, max: 25000 },
    { id: '25to50', label: 'PHP 25k - PHP 50k', min: 25000, max: 50000 },
    { id: 'above50', label: 'PHP 50k+', min: 50000, max: Infinity },
] as const;

interface FilterSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center justify-between w-full mb-3 group"
            >
                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest group-hover:text-orange-500 transition-colors">
                    {title}
                </span>
                <span className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                    <ChevronDown />
                </span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface CategoryListProductMainProps {
    slug: string;
    initialCategoryLabel?: string;
    initialProducts?: CategoryProduct[];
    initialCategories?: Category[];
}

const titleFromSlug = (slug: string) =>
    slug
        .split('-')
        .filter(Boolean)
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(' ');

export default function CategoryListProductMain({
    slug,
    initialCategoryLabel,
    initialProducts,
    initialCategories = [],
}: CategoryListProductMainProps) {
    const meta = categoryMeta[slug];
    const staticProducts = categoryProducts[slug];
    const hasDynamicProducts = Array.isArray(initialProducts);
    const safeProducts = useMemo(
        () => (hasDynamicProducts ? (initialProducts ?? []) : (staticProducts ?? [])),
        [hasDynamicProducts, initialProducts, staticProducts],
    );

    const categoryLabel = initialCategoryLabel ?? meta?.label ?? titleFromSlug(slug);

    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedPriceBrackets, setSelectedPriceBrackets] = useState<string[]>([]);
    const [priceMinInput, setPriceMinInput] = useState('');
    const [priceMaxInput, setPriceMaxInput] = useState('');
    const [customPriceMin, setCustomPriceMin] = useState<number | null>(null);
    const [customPriceMax, setCustomPriceMax] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState('best-selling');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showCount, setShowCount] = useState(16);
    const [currentPage, setCurrentPage] = useState(1);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const listingTopRef = useRef<HTMLDivElement | null>(null);

    const toggleBrand = (brand: string) =>
        setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
    const togglePriceBracket = (id: string) =>
        setSelectedPriceBrackets((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

    const resetFilters = () => {
        setSelectedBrands([]);
        setSelectedPriceBrackets([]);
        setPriceMinInput('');
        setPriceMaxInput('');
        setCustomPriceMin(null);
        setCustomPriceMax(null);
    };
    const applyCustomPriceRange = () => {
        const parsedMin = priceMinInput.trim() === '' ? null : Number(priceMinInput);
        const parsedMax = priceMaxInput.trim() === '' ? null : Number(priceMaxInput);

        const min = parsedMin != null && Number.isFinite(parsedMin) && parsedMin >= 0 ? parsedMin : null;
        const max = parsedMax != null && Number.isFinite(parsedMax) && parsedMax >= 0 ? parsedMax : null;

        if (min != null && max != null && min > max) {
            setCustomPriceMin(max);
            setCustomPriceMax(min);
            return;
        }

        setCustomPriceMin(min);
        setCustomPriceMax(max);
    };

    const filteredProducts = useMemo(() => {
        let result = safeProducts.filter(p => {
            const passBracket =
                selectedPriceBrackets.length === 0 ||
                selectedPriceBrackets.some((id) => {
                    const bracket = PRICE_BRACKETS.find((item) => item.id === id);
                    if (!bracket) return false;
                    return p.price >= bracket.min && p.price <= bracket.max;
                });
            const passCustom =
                (customPriceMin == null || p.price >= customPriceMin) &&
                (customPriceMax == null || p.price <= customPriceMax);
            const passPrice = passBracket && passCustom;
            const passBrand = selectedBrands.length === 0 || (p.brand && selectedBrands.includes(p.brand));
            return passPrice && passBrand;
        });
        if (sortBy === 'price-asc') result = [...result].sort((a, b) => a.price - b.price);
        if (sortBy === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
        if (sortBy === 'newest') result = [...result].reverse();
        return result;
    }, [safeProducts, selectedPriceBrackets, customPriceMin, customPriceMax, selectedBrands, sortBy]);

    // Reset to page 1 when filters/sort/showCount change.
    useEffect(() => { setCurrentPage(1); }, [selectedBrands, selectedPriceBrackets, customPriceMin, customPriceMax, sortBy, showCount]);

    // Reset pagination when switching to a different category route.
    useEffect(() => {
        setCurrentPage(1);
        setShowMobileFilters(false);
    }, [slug]);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / showCount));
    const boundedCurrentPage = Math.min(currentPage, totalPages);
    const paginatedProducts = filteredProducts.slice((boundedCurrentPage - 1) * showCount, boundedCurrentPage * showCount);

    useEffect(() => {
        if (boundedCurrentPage <= 1) return;
        listingTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [boundedCurrentPage]);

    const hasActivePriceRange = selectedPriceBrackets.length > 0 || customPriceMin !== null || customPriceMax !== null;
    const hasActiveFilters = selectedBrands.length > 0 || hasActivePriceRange;
    const activeFilterCount = selectedBrands.length + selectedPriceBrackets.length + (customPriceMin !== null || customPriceMax !== null ? 1 : 0);

    const renderFilters = () => (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
                <span className="text-sm font-bold text-slate-800">Filters</span>
                {hasActiveFilters && (
                    <button
                        onClick={resetFilters}
                        className="text-xs text-orange-500 hover:text-orange-600 font-semibold transition-colors"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Product Type */}
            <FilterSection title="Product Type">
                <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded border-2 border-orange-500 bg-orange-500 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        <span className="text-sm text-slate-700 group-hover:text-orange-500 transition-colors">{categoryLabel}</span>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{safeProducts.length}</span>
                </label>
            </FilterSection>

            {/* Price Range — bracket chips */}
                        <FilterSection title="Price Range">
                <div className="space-y-2.5">
                    {PRICE_BRACKETS.map(bracket => {
                        const checked = selectedPriceBrackets.includes(bracket.id);
                        return (
                            <label
                                key={bracket.id}
                                className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-colors cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    <span className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${checked ? 'border-orange-500 bg-orange-500' : 'border-gray-300 bg-white'}`}>
                                        {checked && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        )}
                                    </span>
                                    <span className="font-medium">{bracket.label}</span>
                                </span>
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={checked}
                                    onChange={() => togglePriceBracket(bracket.id)}
                                />
                            </label>
                        );
                    })}

                    <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">Custom range</p>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                value={priceMinInput}
                                onChange={(e) => setPriceMinInput(e.target.value)}
                                placeholder="Min (PHP)"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:outline-none"
                            />
                            <input
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                value={priceMaxInput}
                                onChange={(e) => setPriceMaxInput(e.target.value)}
                                placeholder="Max (PHP)"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:outline-none"
                            />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={applyCustomPriceRange}
                                className="rounded-lg bg-orange-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-orange-600 transition-colors"
                            >
                                Apply
                            </button>
                            {(customPriceMin !== null || customPriceMax !== null) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPriceMinInput('');
                                        setPriceMaxInput('');
                                        setCustomPriceMin(null);
                                        setCustomPriceMax(null);
                                    }}
                                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </FilterSection>

            {/* Brands */}
            <FilterSection title="Brands">
                <div className="flex flex-col gap-2.5">
                    {CATEGORY_BRANDS.map(brand => {
                        const count = safeProducts.filter(p => p.brand === brand).length;
                        if (count === 0) return null;
                        const checked = selectedBrands.includes(brand);
                        return (
                            <label key={brand} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? 'border-orange-500 bg-orange-500' : 'border-gray-300 bg-white group-hover:border-orange-400'}`}>
                                        {checked && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        )}
                                    </div>
                                    <span className={`text-sm transition-colors ${checked ? 'text-orange-600 font-medium' : 'text-gray-600 group-hover:text-orange-500'}`}>
                                        {brand}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{count}</span>
                                <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleBrand(brand)} />
                            </label>
                        );
                    })}
                </div>
            </FilterSection>
        </div>
    );

    const renderAdBlock = () => (
        <div className="mt-4 rounded-2xl overflow-hidden aspect-square border border-slate-100 bg-slate-50">
            <video
                className="h-full w-full object-cover"
                src="/loginpageVideo/afhome.mp4"
                autoPlay
                muted
                loop
                playsInline
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <TopBar />
            <Navbar initialCategories={initialCategories} />

            <main className="flex-1">
                {/* Breadcrumb */}
                <div className="bg-gray-50 border-b border-gray-100">
                    <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                        <h1 className="text-base font-bold text-slate-800">{categoryLabel}</h1>
                        <nav className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Link href="/" className="hover:text-orange-500 transition-colors font-medium">Home</Link>
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                            <span className="text-slate-600 font-semibold">{categoryLabel}</span>
                        </nav>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-6 lg:py-8">
                    <div className="flex gap-6 items-start">

                        {/* ─── DESKTOP SIDEBAR ─── */}
                        <aside className="hidden lg:block w-60 shrink-0 sticky top-4">
                            {renderFilters()}
                            {renderAdBlock()}
                        </aside>

                        {/* ─── MOBILE FILTER DRAWER ─── */}
                        <AnimatePresence>
                            {showMobileFilters && (
                                <>
                                    <motion.div
                                        key="backdrop"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        onClick={() => setShowMobileFilters(false)}
                                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                                    />
                                    <motion.div
                                        key="drawer"
                                        initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                                        transition={{ type: 'tween', duration: 0.25 }}
                                        className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 lg:hidden overflow-y-auto shadow-2xl"
                                    >
                                        {/* Drawer header */}
                                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-800">Filters</span>
                                                {hasActiveFilters && (
                                                    <span className="h-5 w-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                                                        {activeFilterCount}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setShowMobileFilters(false)}
                                                className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                                </svg>
                                            </button>
                                        </div>
                                        {/* Drawer content */}
                                        <div className="p-5">
                                            {renderFilters()}
                                            {renderAdBlock()}
                                        </div>
                                        {/* Apply button */}
                                        <div className="sticky bottom-0 px-5 pb-5 pt-3 bg-white border-t border-gray-100">
                                            <button
                                                onClick={() => setShowMobileFilters(false)}
                                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors"
                                            >
                                                Show {filteredProducts.length} Products
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>

                        {/* ─── MAIN CONTENT ─── */}
                        <div className="flex-1 min-w-0">

                            {/* Toolbar */}
                            <div ref={listingTopRef} className="flex items-center justify-between mb-5 flex-wrap gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                                <div className="flex items-center gap-2 sm:gap-3">

                                    {/* Mobile filter trigger */}
                                    <button
                                        onClick={() => setShowMobileFilters(true)}
                                        className="lg:hidden flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:border-orange-300 hover:text-orange-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <line x1="4" y1="6" x2="20" y2="6"/>
                                            <line x1="8" y1="12" x2="16" y2="12"/>
                                            <line x1="11" y1="18" x2="13" y2="18"/>
                                        </svg>
                                        Filters
                                        {hasActiveFilters && (
                                            <span className="h-4 w-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                    </button>

                                    <span className="hidden sm:inline text-xs text-gray-400 font-medium">View as:</span>
                                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-orange-50' : 'hover:bg-gray-100'}`}
                                            title="Grid view"
                                        >
                                            <GridIcon active={viewMode === 'grid'} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-orange-50' : 'hover:bg-gray-100'}`}
                                            title="List view"
                                        >
                                            <ListIcon active={viewMode === 'list'} />
                                        </button>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        Showing{' '}
                                        <span className="font-semibold text-slate-700">{paginatedProducts.length}</span>
                                        <span className="hidden sm:inline">
                                            {' '}of{' '}
                                            <span className="font-semibold text-slate-700">{filteredProducts.length}</span>
                                            {' '}products
                                        </span>
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <span className="hidden sm:inline">Show:</span>
                                        <select
                                            value={showCount}
                                            onChange={e => setShowCount(Number(e.target.value))}
                                            className="border border-gray-200 bg-white rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-300 cursor-pointer"
                                        >
                                            <option value={16}>16</option>
                                            <option value={24}>24</option>
                                            <option value={32}>32</option>
                                            <option value={48}>48</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <span className="hidden sm:inline">Sort by:</span>
                                        <select
                                            value={sortBy}
                                            onChange={e => setSortBy(e.target.value)}
                                            className="border border-gray-200 bg-white rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-300 cursor-pointer"
                                        >
                                            <option value="best-selling">Best Selling</option>
                                            <option value="price-asc">Price: Low to High</option>
                                            <option value="price-desc">Price: High to Low</option>
                                            <option value="newest">Newest</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Active filter chips */}
                            {hasActiveFilters && (
                                <div className="flex items-center gap-2 flex-wrap mb-4">
                                    {selectedBrands.map(b => (
                                        <span key={b} className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-medium px-2.5 py-1 rounded-full">
                                            {b}
                                            <button onClick={() => toggleBrand(b)} className="hover:text-orange-800 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                            </button>
                                        </span>
                                    ))}
                                    {selectedPriceBrackets.map((id) => (
                                        <span key={id} className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-medium px-2.5 py-1 rounded-full">
                                            {PRICE_BRACKETS.find((b) => b.id === id)?.label}
                                            <button onClick={() => togglePriceBracket(id)} className="hover:text-orange-800 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                            </button>
                                        </span>
                                    ))}
                                    {(customPriceMin !== null || customPriceMax !== null) && (
                                        <span className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-medium px-2.5 py-1 rounded-full">
                                            {`PHP ${customPriceMin ?? 0} - PHP ${customPriceMax ?? 'Any'}`}
                                            <button
                                                onClick={() => {
                                                    setPriceMinInput('');
                                                    setPriceMaxInput('');
                                                    setCustomPriceMin(null);
                                                    setCustomPriceMax(null);
                                                }}
                                                className="hover:text-orange-800 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                            </button>
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Products */}
                            {filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round">
                                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-700 font-semibold mb-1">No products found</p>
                                    <p className="text-gray-400 text-sm mb-4">Try adjusting your filters</p>
                                    <button onClick={resetFilters} className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                                        Clear all filters
                                    </button>
                                </div>
                            ) : (
                                <motion.div
                                    key={`${viewMode}-${sortBy}-${boundedCurrentPage}`}
                                    className={
                                        viewMode === 'grid'
                                            ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                                            : 'flex flex-col gap-3'
                                    }
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, ease: 'easeOut' }}
                                >
                                    {paginatedProducts.map((product, i) => (
                                        <motion.div
                                            key={`${product.name}-${i}`}
                                            initial={{ opacity: 0, y: 14 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.22, delay: i * 0.02, ease: 'easeOut' }}
                                        >
                                            <ProductCard {...product} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            {filteredProducts.length > 0 && (
                                <div className="mt-8 flex items-center justify-center gap-1.5">
                                    {/* Prev */}
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={boundedCurrentPage === 1}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                                    </button>

                                    {/* Page numbers */}
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                        const isFirst = page === 1;
                                        const isLast = page === totalPages;
                                        const nearCurrent = Math.abs(page - boundedCurrentPage) <= 1;
                                        if (!isFirst && !isLast && !nearCurrent) {
                                            if (page === 2 || page === totalPages - 1) {
                                                return <span key={page} className="text-xs text-gray-400 px-0.5">…</span>;
                                            }
                                            return null;
                                        }
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`h-8 min-w-8 px-2 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                                                    boundedCurrentPage === page
                                                        ? 'bg-orange-500 text-white border border-orange-500'
                                                        : 'border border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-500'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}

                                    {/* Next */}
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={boundedCurrentPage === totalPages}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                                    </button>
                                </div>
                            )}
                            {filteredProducts.length > 0 && (
                                <p className="mt-3 text-center text-xs text-gray-400">
                                    Showing {(boundedCurrentPage - 1) * showCount + 1}–{Math.min(boundedCurrentPage * showCount, filteredProducts.length)} of {filteredProducts.length} products
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}






