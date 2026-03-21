'use client'

import { useCart } from "@/context/CartContext";
import { CategoryProduct } from "@/libs/CategoryData";
import { mockReviews } from "@/libs/MockProductData";
import { displayColorName } from "@/libs/colorUtils";
import { motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react";
import StarRating from "../ui/StarRating";
import BuyNowOptionsModal from "./BuyNowOptionsModal";
import { useSession } from "next-auth/react";

const CartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
);
const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
);
const HeartIcon = ({ filled }: { filled: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
        fill={filled ? '#f97316' : 'none'}
        stroke={filled ? '#f97316' : 'currentColor'}
        strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const PRODUCT_TYPE_LABELS: Record<number, string> = {
    0: 'Regular',
    1: 'Variant',
    2: 'Bundle',
}

interface ProductInfoProps {
    product: CategoryProduct
    categoryLabel?: string
    onReviewsClick?: () => void;
    onVariantChange?: (variant?: VariantOption) => void;
}

type VariantOption = NonNullable<CategoryProduct['variants']>[number];
type VariantGroup = {
    key: string;
    variants: VariantOption[];
};

const buildVariantGroupKey = (variant: VariantOption, index: number) => {
    const sku = (variant.sku ?? '').trim();
    if (sku) return `sku:${sku}`;
    if (typeof variant.id === 'number') return `id:${variant.id}`;
    return `row:${index}`;
};

const looksLikeHtml = (value: string) => /<[^>]+>/.test(value);

const stripHtml = (value: string) =>
    value
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();

const toPositiveNumber = (value: unknown): number | undefined => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const ProductInfo = ({ product, categoryLabel, onReviewsClick, onVariantChange }: ProductInfoProps) => {
    const { addToCart } = useCart();
    const { data: session } = useSession();
    const isLoggedIn = Boolean(session?.user);
    const canUseMemberPrice = isLoggedIn;
    const basePv = toPositiveNumber(product.prodpv) ?? 0;
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState('');
    const [added, setAdded] = useState(false);
    const [selectedSize, setSelectedSize] = useState('');
    const [wishlisted, setWishlisted] = useState(false);
    const [buyOptionsOpen, setBuyOptionsOpen] = useState(false);
    const [paymentLogoMissing, setPaymentLogoMissing] = useState(false);

    const variantOptions = useMemo(
        () =>
            (product.variants ?? []).filter((variant) =>
                Boolean(
                    variant.color ||
                    variant.size ||
                    variant.sku ||
                    (variant.images && variant.images.length > 0) ||
                    typeof variant.priceMember === 'number' ||
                    typeof variant.priceDp === 'number' ||
                    typeof variant.priceSrp === 'number',
                ),
            ),
        [product.variants],
    );

    const colorOptions = useMemo(() => {
        const map = new Map<string, string | undefined>();
        variantOptions.forEach((variant) => {
            if (!variant.color) return;
            map.set(variant.color, variant.colorHex);
        });
        return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
    }, [variantOptions]);

    const sizeOptions = useMemo(() => {
        return Array.from(
            new Set(variantOptions.map((variant) => variant.size).filter((size): size is string => Boolean(size)))
        );
    }, [variantOptions]);

    const effectiveSelectedColor = selectedColor || colorOptions[0]?.name || '';
    const effectiveSelectedSize = selectedSize || sizeOptions[0] || '';

    const selectedVariant = useMemo(() => {
        if (variantOptions.length === 0) return undefined;
        return (
            variantOptions.find((variant) => variant.color === effectiveSelectedColor && variant.size === effectiveSelectedSize)
            ?? variantOptions.find((variant) => variant.color === effectiveSelectedColor)
            ?? variantOptions.find((variant) => variant.size === effectiveSelectedSize)
            ?? variantOptions[0]
        );
    }, [variantOptions, effectiveSelectedColor, effectiveSelectedSize]);

    useEffect(() => {
        onVariantChange?.(selectedVariant);
    }, [selectedVariant, onVariantChange]);

    const baseSrp = toPositiveNumber(product.originalPrice) ?? toPositiveNumber(product.price) ?? 0;
    const variantSrp = toPositiveNumber(selectedVariant?.priceSrp) ?? baseSrp;
    const variantMember = toPositiveNumber(selectedVariant?.priceMember) ?? toPositiveNumber(product.priceMember) ?? 0;
    const hasMemberPrice = variantMember > 0 && variantMember < variantSrp;

    const displayPrice = canUseMemberPrice && hasMemberPrice ? variantMember : variantSrp;
    const displayOriginalPrice = canUseMemberPrice
        ? (hasMemberPrice ? variantSrp : undefined)
        : (product.originalPrice && product.originalPrice > variantSrp ? product.originalPrice : undefined);
    const displayStock = typeof selectedVariant?.qty === 'number'
        ? selectedVariant.qty
        : product.stock;
    const productType = Number(product.type ?? 0);
    const isVariantProduct = productType === 1;
    const hasRealVariants = isVariantProduct && variantOptions.length > 0;
    const variantPv = hasRealVariants
        ? (toPositiveNumber(selectedVariant?.prodpv) ?? 0)
        : basePv;
    const productTypeLabel = PRODUCT_TYPE_LABELS[productType] ?? 'Regular';
    const displaySku = (selectedVariant?.sku && selectedVariant.sku.trim().length > 0)
        ? selectedVariant.sku
        : (product.sku && product.sku.trim().length > 0 ? product.sku : '');
    const isInStock = typeof displayStock !== 'number' || displayStock > 0;
    const productDescription = (product.description ?? '').trim();
    const plainDescription = productDescription ? stripHtml(productDescription) : '';


    const avgRating = (mockReviews.reduce((s, r) => s + r.rating, 0) / mockReviews.length).toFixed(1);

    const handleAddToCart = () => {
        if (!isInStock) return;

        for (let i = 0; i < quantity; i++) {
            addToCart({
                id: product.name.toLocaleLowerCase().replace(/\s+/g, '-'),
                name: product.name,
                price: displayPrice,
                image: product.image,
            });
        }
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);

    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-5"
        >
            {/* BRAND & SHARE */}
            <div className="flex items-center justify-between">
                {product.brand && (
                    <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">{product.brand}</span>
                )}
                <div className="flex items-center gap-3 ml-auto">
                    <motion.button
                        onClick={() => setWishlisted(w => !w)}
                        whileTap={{ scale: 0.8 }}
                        className={`flex items-center gap-1 text-xs transition-colors ${wishlisted ? 'text-orange-500' : 'text-gray-400 hover:text-orange-400'}`}
                        title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        <HeartIcon filled={wishlisted} />
                        <span>{wishlisted ? 'Saved' : 'Save'}</span>
                    </motion.button>
                    <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition-colors">
                        <ShareIcon /> Share
                    </button>
                </div>
            </div>

            {/* TITLE */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{product.name}</h1>
            {categoryLabel && (
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-orange-200 bg-orange-50 px-3 py-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-600">Category</span>
                    <span className="text-sm font-semibold text-orange-700">{categoryLabel}</span>
                </div>
            )}

            {/* RATING ROW */}
            <div className="flex items-center gap-3 flex-wrap">
                <StarRating rating={Math.round(Number(avgRating))} size={16} />
                <span className="text-sm font-bold text-slate-700">{avgRating}</span>
                <button
                    onClick={() => onReviewsClick?.()}
                    className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
                >
                    ({mockReviews.length} reviews)
                </button>
                {product.verified !== false && (
                    <>
                        <span className="text-xs text-gray-300">|</span>
                        <span className="text-xs text-green-600 font-semibold">✓ Verified Product</span>
                    </>
                )}
            </div>

            {/* PRODUCT BADGES */}
            {(product.musthave || product.bestseller || product.salespromo) && (
                <div className="flex flex-wrap gap-2">
                    {product.musthave && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-xs font-semibold text-orange-600">
                            ★ Must Have
                        </span>
                    )}
                    {product.bestseller && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                            🔥 Best Seller
                        </span>
                    )}
                    {product.salespromo && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-semibold text-rose-600">
                            🏷 On Sale
                        </span>
                    )}
                </div>
            )}

            {/* PRICE */}
            <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-bold text-orange-500">₱{displayPrice.toLocaleString()}</span>
                {displayOriginalPrice && (
                    <>
                        <span className="text-base sm:text-lg text-gray-400 line-through">₱{displayOriginalPrice.toLocaleString()}</span>
                        <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            Save ₱{(displayOriginalPrice - displayPrice).toLocaleString()}
                        </span>
                    </>
                )}
            </div>

            {canUseMemberPrice && hasMemberPrice && (
                <div className="inline-flex items-center self-start rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    Member Price Applied
                </div>
            )}

            {variantPv > 0 && (
                <div className="inline-flex items-center self-start rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    PV {variantPv.toLocaleString()}
                </div>
            )}

            <div className="h-px bg-gray-100" />

            {/* {productDescription && (
                looksLikeHtml(productDescription) ? (
                    <div
                        className="text-sm text-slate-600 rich-content"
                        dangerouslySetInnerHTML={{ __html: productDescription }}
                    />
                ) : (
                    <div className="text-sm leading-6 text-slate-600 whitespace-pre-line">
                        {plainDescription || productDescription}
                    </div>
                )
            )} */}

            {(displaySku || typeof displayStock === 'number') && (
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    {displaySku && (
                        <span>
                            SKU: <span className="font-semibold text-slate-800">{displaySku}</span>
                        </span>
                    )}
                    {typeof displayStock === 'number' && (
                        <span>
                            Stock: <span className="font-semibold text-slate-800">{displayStock}</span>
                        </span>
                    )}
                </div>
            )}

            <div className="flex flex-col gap-2.5">
                <span className="text-sm font-semibold text-slate-700">
                    Type: <span className="text-orange-500">{productTypeLabel}</span>
                </span>
            </div>

            {hasRealVariants && colorOptions.length > 0 && (
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                        Color: <span className="text-orange-500">{displayColorName(effectiveSelectedColor)}</span>
                    </span>
                    <div className="flex gap-2.5">
                        {colorOptions.map(c => (
                            <button
                                key={c.name}
                                title={c.name}
                                onClick={() => setSelectedColor(c.name)}
                                className={`w-8 h-8 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(15,23,42,0.14)] hover:scale-110 transition-all duration-200 ${effectiveSelectedColor === c.name ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}
                                style={{ backgroundColor: c.hex ?? '#E5E7EB' }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {hasRealVariants && sizeOptions.length > 0 && (
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                        Size: <span className="text-orange-500">{effectiveSelectedSize}</span>
                    </span>
                    <div className="flex gap-2 flex-wrap">
                        {sizeOptions.map(size => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`px-4 py-1.5 text-sm rounded-xl border-2 font-medium transition-all duration-200 ${effectiveSelectedSize === size
                                    ? 'border-orange-400 bg-orange-50 text-orange-600'
                                    : 'border-gray-200 text-slate-600 hover:border-orange-200'
                                    }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${isInStock ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                <span className={`text-sm font-semibold ${isInStock ? 'text-green-600' : 'text-red-500'}`}>
                    {isInStock ? 'In Stock' : 'Out of Stock'}
                </span>
                {isInStock && typeof displayStock === 'number' && (
                    <span className="text-sm text-gray-400">— Only {displayStock} left</span>
                )}
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
                {[
                    { icon: '📦', text: 'Ships within 1–3 business days' },
                    { icon: '🏙️', text: 'Nationwide delivery via LBC / J&T' },
                    { icon: '✅', text: 'Free assembly for Metro Manila orders' },
                ].map(item => (
                    <div key={item.text} className="flex items-center gap-2.5 text-sm text-gray-600">
                        <span>{item.icon}</span>
                        <span>{item.text}</span>
                    </div>
                ))}
            </div>

            <div>
                <p className="text-xs text-gray-400 mb-2 font-medium">We accept:</p>
                <div className="flex items-center">
                    {!paymentLogoMissing ? (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/Images/paymentsLogo/paymentsLogo.png"
                                alt="Supported payment methods"
                                className="h-8 md:h-10 w-auto"
                                loading="lazy"
                                decoding="async"
                                onError={() => setPaymentLogoMissing(true)}
                            />
                        </>
                    ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                            {[
                                { src: '/payment-logos/gcash.svg', alt: 'GCash' },
                                { src: '/payment-logos/maya.svg', alt: 'Maya' },
                                { src: '/payment-logos/visa.svg', alt: 'Visa' },
                                { src: '/payment-logos/mastercard.svg', alt: 'Mastercard' },
                                // { src: '/payment-logos/cod.svg', alt: 'Cash on Delivery' },
                                { src: '/payment-logos/bpi.svg', alt: 'BPI' },
                                { src: '/payment-logos/bdo.svg', alt: 'BDO' },
                                { src: '/payment-logos/landbank.svg', alt: 'LandBank' },
                                { src: '/payment-logos/unionbank.svg', alt: 'UnionBank' },
                            ].map((payment) => (
                                <div key={payment.alt} className="h-8">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={payment.src}
                                        alt={payment.alt}
                                        className="h-8 w-auto"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-slate-700">Quantity:</span>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setQuantity(qty => Math.max(1, qty - 1))} className="px-4 py-2.5 text-gray-500 hover:bg-gray-50 hover:text-orange-500 transition-colors text-lg font-medium">−</button>
                    <span className="px-5 py-2.5 text-sm font-bold text-slate-800 min-w-12 text-center border-x border-gray-200">{quantity}</span>
                    <button onClick={() => setQuantity(qty => qty + 1)} className="px-4 py-2.5 text-gray-500 hover:bg-gray-50 hover:text-orange-500 transition-colors text-lg font-medium">+</button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                    whileTap={{ scale: isInStock ? 0.97 : 1 }}
                    onClick={handleAddToCart}
                    disabled={!isInStock}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all ${added
                            ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200 text-white'
                            : isInStock
                                ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 shadow-lg shadow-orange-200 text-white cursor-pointer'
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    {added ? '✓ Added!' : <><CartIcon /> Add to Cart</>}
                </motion.button>
                <motion.button
                    whileTap={{ scale: isInStock ? 0.97 : 1 }}
                    disabled={!isInStock}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-colors ${isInStock
                        ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200 cursor-pointer'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                    onClick={() => {
                        if (!isInStock) return;
                        setBuyOptionsOpen(true);
                    }}
                >
                    Buy Now
                </motion.button>
            </div>

            <BuyNowOptionsModal
                isOpen={buyOptionsOpen}
                onClose={() => setBuyOptionsOpen(false)}
                product={product}
                quantity={quantity}
                selectedColor={effectiveSelectedColor}
                selectedSize={effectiveSelectedSize}
                selectedType={productTypeLabel}

            />
        </motion.div>
    );
};

export default ProductInfo;

