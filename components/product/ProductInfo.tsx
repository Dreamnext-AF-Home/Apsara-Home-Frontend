'use client'

import Image from 'next/image';
import { useCart } from "@/context/CartContext";
import { CategoryProduct } from "@/libs/CategoryData";
import { displayColorName } from "@/libs/colorUtils";
import { extractVariantOptionLabels } from "@/libs/productVariantOptions";
import { motion } from "framer-motion"
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link2, X as XIcon } from "lucide-react";
import StarRating from "../ui/StarRating";
import BuyNowOptionsModal from "./BuyNowOptionsModal";
import ShareModal from "@/components/ui/ShareModal";
import { useSession } from "next-auth/react";
import { useMeQuery } from "@/store/api/userApi";
import { useGetPublicGeneralSettingsQuery } from "@/store/api/adminSettingsApi";
import type { ProductReviewSummary } from "@/store/api/productsApi";
import { useGetProductBrandQuery } from "@/store/api/productsApi";
import { useHeartbeatProductViewerMutation } from "@/store/api/productsApi";
import { useGetWishlistQuery, useAddWishlistMutation, useRemoveWishlistMutation, type WishlistItem } from "@/store/api/wishlistApi";
import OutlineButton from "@/components/ui/buttons/OutlineButton";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import { Package, Truck, CheckCircle, Eye } from "lucide-react";
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { resolveCheckoutSource } from '@/libs/checkoutSource';
import { extractPartnerSlugFromPath } from '@/libs/storefrontRouting';


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
        fill={filled ? '#38bdf8' : 'none'}
        stroke={filled ? '#38bdf8' : 'currentColor'}
        strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const PRODUCT_TYPE_LABELS: Record<number, string> = {
    0: 'Regular',
    1: 'Variant',
    2: 'Bundle',
}
const NEW_BADGE_DAYS = 3;

const isNewProduct = (createdAt?: string | null) => {
    if (!createdAt) return false;

    const createdAtTime = new Date(createdAt).getTime();
    if (Number.isNaN(createdAtTime)) return false;

    return Date.now() - createdAtTime <= NEW_BADGE_DAYS * 24 * 60 * 60 * 1000;
}

interface ProductInfoProps {
    product: CategoryProduct
    categoryLabel?: string
    onReviewsClick?: () => void;
    onVariantChange?: (variant?: VariantOption) => void;
    reviewSummary?: ProductReviewSummary;
    forceRealPrice?: boolean;
    allowGuestWishlist?: boolean;
}

type VariantOption = NonNullable<CategoryProduct['variants']>[number];
type SizeChoice = {
    key: string;
    label: string;
    meta: string;
    variant?: VariantOption;
    groupVariants?: VariantOption[];
};

const GUEST_WISHLIST_STORAGE_KEY = 'synergy_guest_wishlist_product_ids';
const GUEST_WISHLIST_ITEMS_STORAGE_KEY = 'synergy_guest_wishlist_items';

type GuestWishlistItem = {
    productId: number;
    name: string;
    price: number;
    priceMember?: number;
    priceDp?: number;
    priceSrp?: number;
    originalPrice?: number;
    sku?: string;
    prodpv?: number;
    image: string;
    slug: string;
    brand?: string | null;
};

const buildVariantGroupKey = (variant: VariantOption, index: number) => {
    const sku = (variant.sku ?? '').trim();
    if (sku) return `sku:${sku}`;
    if (typeof variant.id === 'number') return `id:${variant.id}`;
    return `row:${index}`;
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

const getVariantCoreGroupKey = (variant: VariantOption) => [
    normalizeVariantLabel(variant.name),
    normalizeVariantLabel(variant.style),
    normalizeVariantLabel(variant.size),
    String(variant.width ?? ''),
    String(variant.dimension ?? ''),
    String(variant.height ?? ''),
    String(variant.priceSrp ?? ''),
    String(variant.priceDp ?? ''),
    String(variant.priceMember ?? ''),
    String(variant.prodpv ?? ''),
    String(variant.qty ?? ''),
    String(variant.status ?? ''),
    variant.images?.filter(Boolean).join('|') ?? '',
].join('|');

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

const toSlug = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const readGuestWishlistItems = (): GuestWishlistItem[] => {
    if (typeof window === 'undefined') return [];

    try {
        const raw = window.localStorage.getItem(GUEST_WISHLIST_ITEMS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return [];

        return parsed
            .map((entry): GuestWishlistItem | null => {
                if (!entry || typeof entry !== 'object') return null;
                const row = entry as Record<string, unknown>;
                const productId = Number(row.productId ?? 0);
                if (!Number.isInteger(productId) || productId <= 0) return null;
                return {
                    productId,
                    name: typeof row.name === 'string' ? row.name : `Product ${productId}`,
                    price: Number(row.price ?? 0),
                    priceMember: Number(row.priceMember ?? 0) || undefined,
                    priceDp: Number(row.priceDp ?? 0) || undefined,
                    priceSrp: Number(row.priceSrp ?? 0) || undefined,
                    originalPrice: Number(row.originalPrice ?? 0) || undefined,
                    sku: typeof row.sku === 'string' ? row.sku : undefined,
                    prodpv: Number(row.prodpv ?? 0) || undefined,
                    image: typeof row.image === 'string' && row.image.trim().length > 0 ? row.image : '/Images/af_home_logo.png',
                    slug: typeof row.slug === 'string' && row.slug.trim().length > 0 ? row.slug : toSlug(typeof row.name === 'string' ? row.name : `product-${productId}`),
                    brand: typeof row.brand === 'string' ? row.brand : null,
                } satisfies GuestWishlistItem;
            })
            .filter((item): item is GuestWishlistItem => Boolean(item));
    } catch {
        return [];
    }
};

const getEffectiveVariantStock = (variants?: CategoryProduct['variants']) => {
    const activeVariants = (variants ?? []).filter((variant) => (variant?.status ?? 1) === 1);

    if (activeVariants.length === 0) {
        return undefined;
    }

    return activeVariants.reduce((total, variant) => total + Number(variant?.qty ?? 0), 0);
};

const buildVariantTitleParts = (variant?: NonNullable<CategoryProduct['variants']>[number]) => {
    const seen = new Set<string>();

    return [
        variant?.name?.trim(),
        variant?.style?.trim(),
        variant?.size?.trim(),
    ].filter((part): part is string => {
        if (!part) return false;
        const normalized = part.toLowerCase();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
    });
};

const ProductInfo = ({
    product,
    categoryLabel,
    onReviewsClick,
    onVariantChange,
    reviewSummary,
    forceRealPrice = false,
    allowGuestWishlist = false,
}: ProductInfoProps) => {
    const { addToCart } = useCart();
    const router = useRouter();
    const pathname = usePathname();
    const partnerSlug = extractPartnerSlugFromPath(pathname);
    const checkoutTarget = partnerSlug ? `/${partnerSlug}/checkout/customer` : '/checkout/customer';
    const { data: session, status, update: updateSession } = useSession();
    const role = String(session?.user?.role ?? '').toLowerCase();
    const isLoggedIn = status === 'authenticated' && (role === 'customer' || role === '');
    const useAccountWishlist = isLoggedIn && !allowGuestWishlist;
    const { data: me } = useMeQuery(undefined, { skip: !isLoggedIn });
    const { data: wishlist = [] } = useGetWishlistQuery(undefined, { skip: !useAccountWishlist });
    const [addWishlist] = useAddWishlistMutation();
    const [removeWishlist] = useRemoveWishlistMutation();
    const { data: publicSettingsData } = useGetPublicGeneralSettingsQuery();
    const canUseMemberPrice = isLoggedIn && status === 'authenticated';
    const [hasRefreshedSession, setHasRefreshedSession] = useState(false);

    // Refresh session once on component mount to handle login redirects
    useEffect(() => {
        if (!hasRefreshedSession && updateSession && !isLoggedIn) {
            updateSession();
            setHasRefreshedSession(true);
        }
    }, []);
    const basePv = toPositiveNumber(product.prodpv) ?? 0;
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState('');
    const [added, setAdded] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [wishlisted, setWishlisted] = useState(false);
    const [isWishlistLoading, setIsWishlistLoading] = useState(false);
    const [buyOptionsOpen, setBuyOptionsOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [guestWishlistItems, setGuestWishlistItems] = useState<GuestWishlistItem[]>(() => readGuestWishlistItems());
    const [liveViewers, setLiveViewers] = useState(0);
    const [heartbeatProductViewer] = useHeartbeatProductViewerMutation();
    const optionLabels = useMemo(() => extractVariantOptionLabels(product.specifications), [product.specifications]);

    // Check if product is in wishlist and update wishlisted state
    useEffect(() => {
        const isInWishlist = useAccountWishlist
            ? wishlist.some((item: WishlistItem) => item.productId === product.id)
            : guestWishlistItems.some((item) => item.productId === product.id);
        setWishlisted(isInWishlist);
    }, [guestWishlistItems, useAccountWishlist, wishlist, product.id]);

    useEffect(() => {
        if (useAccountWishlist || !allowGuestWishlist || typeof window === 'undefined') return;

        const syncGuestWishlist = () => setGuestWishlistItems(readGuestWishlistItems());
        syncGuestWishlist();

        window.addEventListener('synergy:guest-wishlist-updated', syncGuestWishlist);
        window.addEventListener('storage', syncGuestWishlist);
        return () => {
            window.removeEventListener('synergy:guest-wishlist-updated', syncGuestWishlist);
            window.removeEventListener('storage', syncGuestWishlist);
        };
    }, [allowGuestWishlist, useAccountWishlist]);

    useEffect(() => {
        if (typeof window === 'undefined' || !product.id) return;
        const productId = product.id;

        const storageKey = `afhome_product_viewer_id:${productId}`;
        const existingViewerId = window.sessionStorage.getItem(storageKey) || '';
        const localViewerId = existingViewerId || (window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
        if (!existingViewerId) {
            window.sessionStorage.setItem(storageKey, localViewerId);
        }
        let cancelled = false;
        const sendHeartbeat = async () => {
            try {
                const response = await heartbeatProductViewer({ productId, viewerId: localViewerId }).unwrap();
                if (!cancelled) {
                    setLiveViewers(response.active_viewers);
                }
            } catch {
                // Keep last known value if heartbeat fails.
            }
        };

        void sendHeartbeat();
        const intervalId = window.setInterval(() => {
            void sendHeartbeat();
        }, 15000);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [heartbeatProductViewer, product.id]);

    // Handle wishlist add/remove
    const handleWishlistToggle = async () => {
        if (!useAccountWishlist) {
            if (allowGuestWishlist && typeof window !== 'undefined' && product.id) {
                const currentItems = readGuestWishlistItems();
                const currentlyInWishlist = currentItems.some((item) => item.productId === product.id);
                const nextItems = currentlyInWishlist
                    ? currentItems.filter((item) => item.productId !== product.id)
                    : [
                        ...currentItems,
                        {
                            productId: product.id,
                            name: product.name,
                            price: Number(product.price ?? 0),
                            priceMember: product.priceMember ? Number(product.priceMember) : undefined,
                            priceDp: product.priceDp ? Number(product.priceDp) : undefined,
                            priceSrp: product.priceSrp ? Number(product.priceSrp) : undefined,
                            originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
                            sku: product.sku ?? undefined,
                            prodpv: product.prodpv ? Number(product.prodpv) : undefined,
                            image: product.image ?? '/Images/af_home_logo.png',
                            slug: toSlug(product.name),
                            brand: product.brand ?? null,
                        },
                    ];
                const deduped = Array.from(
                    nextItems.reduce((map, item) => {
                        map.set(item.productId, item);
                        return map;
                    }, new Map<number, GuestWishlistItem>()).values(),
                );
                setGuestWishlistItems(deduped);
                window.localStorage.setItem(GUEST_WISHLIST_ITEMS_STORAGE_KEY, JSON.stringify(deduped));
                window.localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(deduped.map((item) => item.productId)));
                window.dispatchEvent(new CustomEvent('synergy:guest-wishlist-updated'));
                toast.success(currentlyInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
                return;
            }

            // Redirect to login if not logged in
            const callbackPath = pathname || '/shop';
            window.location.href = `/login?callback=${encodeURIComponent(callbackPath)}`;
            return;
        }

        if (!product.id) {
            console.error('Product ID is missing');
            return;
        }

        setIsWishlistLoading(true);
        try {
            if (wishlisted) {
                // Remove from wishlist
                await removeWishlist(product.id).unwrap();
                setWishlisted(false);
            } else {
                // Add to wishlist
                await addWishlist({ product_id: product.id, product_name: product.name }).unwrap();
                setWishlisted(true);
            }
        } catch (error) {
            console.error('Wishlist error:', error);
        } finally {
            setIsWishlistLoading(false);
        }
    };

    const variantOptions = useMemo(
        () =>
            (product.variants ?? []).filter((variant) =>
                Boolean(
                    variant.color ||
                    variant.style ||
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

    const variantNameOptions = useMemo(() => {
        const map = new Map<string, string | undefined>();
        variantOptions.forEach((variant) => {
            const variantName = variant.name?.trim();
            if (!variantName) return;
            map.set(variantName, variant.images?.[0]);
        });
        return Array.from(map.entries()).map(([name, image]) => ({ name, image }));
    }, [variantOptions]);

    const groupedVariantChoices = useMemo(() => {
        const groupedSkuCounts = variantOptions.reduce((map, variant) => {
            const groupKey = `${getVariantCoreGroupKey(variant)}|${stripVariantColorSuffix(variant.sku, variant.color)}`;
            map.set(groupKey, (map.get(groupKey) ?? 0) + 1);
            return map;
        }, new Map<string, number>());

        const grouped = variantOptions.reduce((map, variant, index) => {
            const coreKey = getVariantCoreGroupKey(variant);
            const strippedSku = stripVariantColorSuffix(variant.sku, variant.color);
            const candidateKey = `${coreKey}|${strippedSku}`;
            const resolvedSku = (groupedSkuCounts.get(candidateKey) ?? 0) > 1
                ? strippedSku
                : (variant.sku ?? '').trim();
            const groupKey = `${coreKey}|${resolvedSku || buildVariantGroupKey(variant, index)}`;
            const existing = map.get(groupKey);

            if (existing) {
                existing.groupVariants = [...(existing.groupVariants ?? []), variant];
                return map;
            }

            const sizeLabel = (variant.size ?? '').trim();
            const dimensionParts = [
                variant.width ? `W ${variant.width}` : '',
                variant.dimension ? `D ${variant.dimension}` : '',
                variant.height ? `H ${variant.height}` : '',
            ].filter(Boolean);

            const metaParts = [
                (variant.name ?? '').trim(),
                (variant.style ?? '').trim(),
                dimensionParts.length > 0 ? `${dimensionParts.join(' x ')} cm` : '',
            ].filter((part) => part && part !== sizeLabel);

            map.set(groupKey, {
                key: groupKey,
                label: sizeLabel || (variant.name ?? '').trim() || `Variant ${index + 1}`,
                meta: metaParts.join(' ? '),
                groupVariants: [variant],
            });

            return map;
        }, new Map<string, SizeChoice>());

        return Array.from(grouped.values());
    }, [variantOptions]);

    const sizeChoices = useMemo(() => {
        return variantOptions.flatMap((variant, index) => {
            const sizeLabel = (variant.size ?? '').trim();
            if (!sizeLabel) return [];

            const dimensionParts = [
                variant.width ? `W ${variant.width}` : '',
                variant.dimension ? `D ${variant.dimension}` : '',
                variant.height ? `H ${variant.height}` : '',
            ].filter(Boolean);

            const metaParts = [
                (variant.name ?? '').trim(),
                (variant.style ?? '').trim(),
                variant.color ? displayColorName(variant.color) : '',
                dimensionParts.length > 0 ? `${dimensionParts.join(' x ')} cm` : '',
            ].filter((part) => part && part !== sizeLabel);

            return [{
                key: buildVariantGroupKey(variant, index),
                label: sizeLabel,
                meta: metaParts.join(' ? '),
                variant,
            } satisfies SizeChoice];
        });
    }, [variantOptions]);

    const logicalSizeChoices = useMemo(() => {
        return groupedVariantChoices.filter((choice) =>
            Boolean(choice.groupVariants?.some((variant) => (variant.size ?? '').trim())),
        );
    }, [groupedVariantChoices]);

    const [selectedVariantName, setSelectedVariantName] = useState('');
    const [selectedSizeKey, setSelectedSizeKey] = useState('');
    const effectiveSelectedColor = selectedColor || colorOptions[0]?.name || '';
    const hasColorSelector = colorOptions.length > 0;
    const hasPrimaryOptionSelector = variantNameOptions.length > 1;
    const showNewBadge = isNewProduct(product.createdAt);
    const effectiveSelectedPrimaryName = selectedVariantName || (hasPrimaryOptionSelector ? variantNameOptions[0]?.name || '' : '');
    const displayedStyleOptions = useMemo(() => {
        let filteredVariants = variantOptions;

        if (hasColorSelector && effectiveSelectedColor) {
            filteredVariants = filteredVariants.filter((variant) => !variant.color || variant.color === effectiveSelectedColor);
        }

        if (hasPrimaryOptionSelector && effectiveSelectedPrimaryName) {
            filteredVariants = filteredVariants.filter((variant) => (variant.name ?? '').trim() === effectiveSelectedPrimaryName);
        }

        const map = new Map<string, string | undefined>();
        filteredVariants.forEach((variant) => {
            const styleName = variant.style?.trim();
            if (!styleName) return;
            map.set(styleName, variant.images?.[0]);
        });

        return Array.from(map.entries()).map(([name, image]) => ({ name, image }));
    }, [effectiveSelectedColor, effectiveSelectedPrimaryName, hasColorSelector, hasPrimaryOptionSelector, variantOptions]);
    const hasStyleSelector = displayedStyleOptions.length > 0;
    const effectiveSelectedStyle = displayedStyleOptions.some((option) => option.name === selectedStyle)
        ? selectedStyle
        : (displayedStyleOptions[0]?.name || '');
    const primaryOptionLabel = optionLabels.primaryLabel?.trim() || 'Options';
    const hasSecondarySizeValues = logicalSizeChoices.length > 0;
    const secondaryOptionLabel = optionLabels.secondaryLabel?.trim() || (hasSecondarySizeValues ? 'Size' : '');
    const displayedSizeChoices = useMemo(() => {
        let filteredChoices = logicalSizeChoices;
        if (hasColorSelector && effectiveSelectedColor) {
            filteredChoices = logicalSizeChoices.filter((choice) =>
                (choice.groupVariants ?? []).some((variant) => !variant.color || variant.color === effectiveSelectedColor),
            );
        }
        if (hasPrimaryOptionSelector && effectiveSelectedPrimaryName) {
            filteredChoices = filteredChoices.filter((choice) =>
                (choice.groupVariants ?? []).some((variant) => (variant.name ?? '').trim() === effectiveSelectedPrimaryName),
            );
        }
        if (hasStyleSelector && effectiveSelectedStyle) {
            filteredChoices = filteredChoices.filter((choice) =>
                (choice.groupVariants ?? []).some((variant) => (variant.style ?? '').trim() === effectiveSelectedStyle),
            );
        }
        return filteredChoices;
    }, [effectiveSelectedColor, effectiveSelectedPrimaryName, effectiveSelectedStyle, hasColorSelector, hasPrimaryOptionSelector, hasStyleSelector, logicalSizeChoices]);
    const shouldShowSecondaryOption = secondaryOptionLabel.length > 0 && displayedSizeChoices.length > 0;
    const effectiveSelectedSizeKey = selectedSizeKey || displayedSizeChoices[0]?.key || '';
    const effectiveSelectedSize = selectedSize || displayedSizeChoices[0]?.label || '';

    const selectedVariant = useMemo(() => {
        if (variantOptions.length === 0) return undefined;
        const selectedSizeChoice = displayedSizeChoices.find((choice) => choice.key === effectiveSelectedSizeKey);
        if (selectedSizeChoice) {
            const groupedVariants = selectedSizeChoice.groupVariants ?? (selectedSizeChoice.variant ? [selectedSizeChoice.variant] : []);
            return (
                groupedVariants.find((variant) =>
                    (!hasColorSelector || !effectiveSelectedColor || variant.color === effectiveSelectedColor) &&
                    (!hasPrimaryOptionSelector || !effectiveSelectedPrimaryName || (variant.name ?? '').trim() === effectiveSelectedPrimaryName) &&
                    (!hasStyleSelector || !effectiveSelectedStyle || (variant.style ?? '').trim() === effectiveSelectedStyle),
                )
                ?? groupedVariants.find((variant) =>
                    (!hasColorSelector || !effectiveSelectedColor || variant.color === effectiveSelectedColor) &&
                    (!hasStyleSelector || !effectiveSelectedStyle || (variant.style ?? '').trim() === effectiveSelectedStyle),
                )
                ?? groupedVariants.find((variant) =>
                    (!hasPrimaryOptionSelector || !effectiveSelectedPrimaryName || (variant.name ?? '').trim() === effectiveSelectedPrimaryName) &&
                    (!hasStyleSelector || !effectiveSelectedStyle || (variant.style ?? '').trim() === effectiveSelectedStyle),
                )
                ?? groupedVariants[0]
            );
        }
        if (hasColorSelector && effectiveSelectedColor && hasPrimaryOptionSelector && effectiveSelectedPrimaryName && hasStyleSelector && effectiveSelectedStyle) {
            return (
                variantOptions.find((variant) =>
                    variant.color === effectiveSelectedColor &&
                    (variant.name ?? '').trim() === effectiveSelectedPrimaryName &&
                    (variant.style ?? '').trim() === effectiveSelectedStyle,
                )
                ?? variantOptions.find((variant) =>
                    variant.color === effectiveSelectedColor && (variant.style ?? '').trim() === effectiveSelectedStyle,
                )
                ?? variantOptions.find((variant) => variant.color === effectiveSelectedColor)
                ?? variantOptions.find((variant) => (variant.style ?? '').trim() === effectiveSelectedStyle)
                ?? variantOptions.find((variant) => (variant.name ?? '').trim() === effectiveSelectedPrimaryName)
                ?? variantOptions[0]
            );
        }
        if (hasStyleSelector && effectiveSelectedStyle && hasPrimaryOptionSelector && effectiveSelectedPrimaryName) {
            return (
                variantOptions.find((variant) =>
                    (variant.style ?? '').trim() === effectiveSelectedStyle &&
                    (variant.name ?? '').trim() === effectiveSelectedPrimaryName,
                )
                ?? variantOptions.find((variant) => (variant.style ?? '').trim() === effectiveSelectedStyle)
                ?? variantOptions.find((variant) => (variant.name ?? '').trim() === effectiveSelectedPrimaryName)
                ?? variantOptions[0]
            );
        }
        if (hasPrimaryOptionSelector && effectiveSelectedPrimaryName) {
            return (
                variantOptions.find((variant) =>
                    (variant.name ?? '').trim() === effectiveSelectedPrimaryName &&
                    (!hasStyleSelector || !effectiveSelectedStyle || (variant.style ?? '').trim() === effectiveSelectedStyle),
                )
                ?? (hasStyleSelector && effectiveSelectedStyle
                    ? variantOptions.find((variant) => (variant.style ?? '').trim() === effectiveSelectedStyle)
                    : undefined)
                ?? variantOptions[0]
            );
        }
        if (hasStyleSelector && effectiveSelectedStyle) {
            return variantOptions.find((variant) => (variant.style ?? '').trim() === effectiveSelectedStyle) ?? variantOptions[0];
        }
        if (hasColorSelector && effectiveSelectedColor) {
            return variantOptions.find((variant) => variant.color === effectiveSelectedColor) ?? variantOptions[0];
        }
        return (
            variantOptions.find((variant) =>
                variant.color === effectiveSelectedColor &&
                (((variant.size ?? '').trim() === effectiveSelectedSize) || ((variant.name ?? '').trim() === effectiveSelectedSize))
            )
            ?? variantOptions.find((variant) => variant.color === effectiveSelectedColor)
            ?? variantOptions.find((variant) =>
                ((variant.size ?? '').trim() === selectedSize) || ((variant.name ?? '').trim() === selectedSize)
            )
            ?? variantOptions[0]
        );
    }, [displayedSizeChoices, variantOptions, effectiveSelectedColor, effectiveSelectedPrimaryName, effectiveSelectedSize, effectiveSelectedSizeKey, effectiveSelectedStyle, hasColorSelector, hasPrimaryOptionSelector, hasStyleSelector, selectedSize]);

    useEffect(() => {
        onVariantChange?.(selectedVariant);
    }, [selectedVariant, onVariantChange]);

    const handleModalVariantSelect = useCallback((variant: VariantOption) => {
        if (variant.color) setSelectedColor(variant.color);
        if (variant.name?.trim()) setSelectedVariantName(variant.name.trim());
        if (variant.style?.trim()) setSelectedStyle(variant.style.trim());
        if (variant.size?.trim()) setSelectedSize(variant.size.trim());

        const matchingChoice = groupedVariantChoices.find((choice) =>
            (choice.groupVariants ?? (choice.variant ? [choice.variant] : [])).some((choiceVariant) => {
                if (variant.sku && choiceVariant.sku) return choiceVariant.sku === variant.sku;
                if (typeof variant.id === 'number' && typeof choiceVariant.id === 'number') return choiceVariant.id === variant.id;
                return choiceVariant === variant;
            }),
        );

        if (matchingChoice) {
            setSelectedSizeKey(matchingChoice.key);
        }
    }, [groupedVariantChoices]);

    const baseSrp = toPositiveNumber(product.originalPrice) ?? toPositiveNumber(product.price) ?? 0;
    const variantSrp = toPositiveNumber(selectedVariant?.priceSrp) ?? baseSrp;
    const variantMember = toPositiveNumber(selectedVariant?.priceMember) ?? toPositiveNumber(product.priceMember) ?? 0;
    const hasMemberPrice = variantMember > 0 && variantMember < variantSrp;
    const shouldDisplayMemberPrice = hasMemberPrice && !forceRealPrice;
    const displayPrice = shouldDisplayMemberPrice ? variantMember : variantSrp;
    const displayOriginalPrice = shouldDisplayMemberPrice
        ? variantSrp
        : (!forceRealPrice && product.originalPrice && product.originalPrice > variantSrp ? product.originalPrice : undefined);
    const totalVariantStock = getEffectiveVariantStock(variantOptions);
    const displayStock = typeof selectedVariant?.qty === 'number'
        ? selectedVariant.qty
        : (typeof totalVariantStock === 'number' ? totalVariantStock : product.stock);
    const productType = Number(product.type ?? 0);
    const hasRealVariants = variantOptions.length > 0;
    const variantPv = hasRealVariants
        ? (toPositiveNumber(selectedVariant?.prodpv) ?? 0)
        : basePv;
    const productTypeLabel = hasRealVariants
        ? 'Variant'
        : (PRODUCT_TYPE_LABELS[productType] ?? 'Regular');
    const displaySku = (selectedVariant?.sku && selectedVariant.sku.trim().length > 0)
        ? selectedVariant.sku
        : (product.sku && product.sku.trim().length > 0 ? product.sku : '');
    const displayWidth = toPositiveNumber(selectedVariant?.width) ?? toPositiveNumber(product.pswidth);
    const displayDimension = toPositiveNumber(selectedVariant?.dimension) ?? toPositiveNumber(product.pslenght);
    const displayHeight = toPositiveNumber(selectedVariant?.height) ?? toPositiveNumber(product.psheight);
    const hasDisplayDimensions = Boolean(displayWidth || displayDimension || displayHeight);
    const selectedVariantImage = selectedVariant?.images?.find((image) => typeof image === 'string' && image.trim().length > 0);
    const selectedVariantLabel = selectedVariant?.name?.trim() || selectedVariant?.style?.trim() || selectedVariant?.size?.trim() || '';
    const selectedVariantTitleParts = buildVariantTitleParts(selectedVariant);
    const displayTitle = selectedVariantTitleParts.length > 0
        ? `${product.name} - ${selectedVariantTitleParts.join(' - ')}`
        : product.name;
    const isInStock = typeof displayStock !== 'number' || displayStock > 0;
    const isManualCheckoutOnly = Boolean(publicSettingsData?.settings?.enable_manual_checkout_mode) && !Boolean(product.manualCheckoutEnabled);
    const isCheckoutAvailable = !isManualCheckoutOnly;
    const productDescription = (product.description ?? '').trim();
    const plainDescription = productDescription ? stripHtml(productDescription) : '';


    const reviewCount = reviewSummary?.count ?? 0;
    const avgRatingValue = typeof reviewSummary?.average === 'number' ? reviewSummary.average : 0;
    const avgRating = avgRatingValue.toFixed(1);

    const handleAddToCart = () => {
        if (!isInStock || !isCheckoutAvailable) return;

        if (!isLoggedIn) {
            router.push(`/login?callback=${encodeURIComponent(pathname || '/shop')}`);
            return;
        }

        const variantLabel = [
            selectedVariant?.name?.trim(),
            selectedVariant?.style?.trim(),
            selectedVariant?.size?.trim(),
            selectedVariant?.color ? displayColorName(selectedVariant.color) : '',
        ].filter(Boolean).join(' ? ');
        const cartItemIdBase = product.id ? String(product.id) : product.name.toLocaleLowerCase().replace(/\s+/g, '-');
        const cartItemId = selectedVariant?.sku ? `${cartItemIdBase}::${selectedVariant.sku}` : cartItemIdBase;

        for (let i = 0; i < quantity; i++) {
            addToCart({
                id: cartItemId,
                productId: product.id,
                variantId: selectedVariant?.id,
                name: variantLabel ? `${product.name} (${variantLabel})` : product.name,
                price: displayPrice,
                originalPrice: displayOriginalPrice ?? null,
                image: selectedVariantImage || product.image,
                prodpv: variantPv,
                brand: product.brand ?? null,
                manualCheckoutEnabled: product.manualCheckoutEnabled,
                selectedColor: selectedVariant?.color ?? null,
                selectedStyle: selectedVariant?.style ?? null,
                selectedSize: selectedVariant?.size ?? null,
                selectedType: selectedVariant?.name ?? null,
                selectedSku: selectedVariant?.sku ?? product.sku ?? null,
            });
        }
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);

    };

    const handleDirectBuyNow = () => {
        if (!isInStock || !isCheckoutAvailable) return;

        const checkoutSource = resolveCheckoutSource(pathname);
        const subtotal = variantSrp * quantity;
        const handlingFee = 0;

        localStorage.setItem('guest_checkout', JSON.stringify({
            product: {
                ...product,
                image: selectedVariantImage || product.image,
                sku: selectedVariant?.sku ?? product.sku,
                price: variantSrp,
                prodpv: variantPv,
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
            total: subtotal + handlingFee,
            sourceLabel: checkoutSource.sourceLabel ?? null,
            sourceSlug: checkoutSource.sourceSlug ?? null,
            sourceHost: checkoutSource.sourceHost ?? null,
            sourceUrl: checkoutSource.sourceUrl ?? null,
        }));

        router.push(checkoutTarget);
    };

    const referralCode = (me?.username ?? '').trim();
    const shareUrl = useMemo(() => {
        const productSlug = product.id ? `${toSlug(product.name)}-i${product.id}` : toSlug(product.name);
        const baseUrl = `https://www.afhome.ph/product/${productSlug}`;
        if (!referralCode) return baseUrl;
        return `${baseUrl}?ref=${encodeURIComponent(referralCode)}`;
    }, [referralCode, product.name, product.id]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
        >
            {/* Header Section */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                    {product.brand && (
                        <span className="text-xs font-bold text-sky-500 uppercase tracking-wider">{product.brand}</span>
                    )}
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight mt-1">{displayTitle}</h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <motion.button
                        onClick={handleWishlistToggle}
                        disabled={isWishlistLoading}
                        whileTap={{ scale: 0.8 }}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            wishlisted
                                ? 'border-sky-200 text-sky-500 dark:border-sky-900/50 dark:text-sky-400'
                                : 'border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-500 hover:border-sky-200 hover:text-sky-500 dark:hover:border-sky-900/50 dark:hover:text-sky-400'
                        } ${isWishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        {isWishlistLoading ? (
                            <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                        ) : <HeartIcon filled={wishlisted} />}
                    </motion.button>
                    <button
                        className="p-2 rounded-xl border border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-500 hover:border-sky-200 hover:text-sky-500 dark:hover:border-sky-900/50 dark:hover:text-sky-400 transition-all cursor-pointer"
                        onClick={() => setIsShareOpen(true)}
                        type="button"
                    >
                        <ShareIcon />
                    </button>
                </div>
            </div>
            {/* Rating & Badges */}
            <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(avgRatingValue)} size={16} />
                    <span className="text-sm font-bold text-slate-700 dark:text-gray-300">{avgRating}</span>
                    <button
                        onClick={() => onReviewsClick?.()}
                        className="text-sm text-gray-400 dark:text-gray-500 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                    >
                        ({reviewCount} review{reviewCount === 1 ? '' : 's'})
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {product.verified !== false && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-200 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                            Verified
                        </span>
                    )}
                    {showNewBadge && (
                        <span className="rounded-full border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            New
                        </span>
                    )}
                    {categoryLabel && (
                        <span className="rounded-full border border-sky-200 dark:border-sky-900/50 px-2.5 py-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                            {categoryLabel}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                        <Eye size={12} />
                        {liveViewers > 0 ? liveViewers : '--'} viewing now
                    </span>
                </div>
            </div>
            {/* Product Badges */}
            {(product.musthave || product.bestseller || product.salespromo) && (
                <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
                    {product.musthave && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700">
                            Must Have
                        </span>
                    )}
                    {product.bestseller && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-700">
                            Best Seller
                        </span>
                    )}
                    {product.salespromo && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700">
                            On Sale
                        </span>
                    )}
                </div>
            )}

            {/* Price Section */}
            <div className="bg-gradient-to-r from-sky-50 to-sky-50 dark:from-sky-900/20 dark:to-sky-900/20 rounded-2xl p-6 border border-sky-100 dark:border-sky-900/30 mb-6">
                <div className="flex items-baseline gap-3 flex-wrap mb-3">
                    <span className="text-3xl sm:text-4xl font-bold text-sky-600 dark:text-sky-400">{'\u20b1'}{displayPrice.toLocaleString()}</span>
                    {displayOriginalPrice && (
                        <>
                            <span className="text-lg text-gray-400 dark:text-gray-500 line-through">{'\u20b1'}{displayOriginalPrice.toLocaleString()}</span>
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50 px-3 py-1 rounded-full">
                                Save {'\u20b1'}{(displayOriginalPrice - displayPrice).toLocaleString()}
                            </span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {!forceRealPrice && canUseMemberPrice && hasMemberPrice && (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                            Member Price Applied
                        </span>
                    )}
                    {!forceRealPrice && !canUseMemberPrice && hasMemberPrice && (
                        <span className="inline-flex items-center rounded-full border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-900/20 px-3 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400">
                            Sign in or Register to claim {Math.round(((variantSrp - variantMember) / variantSrp) * 100)}% savings!
                        </span>
                    )}
                    {variantPv > 0 && (
                        <span className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                            PV {variantPv.toLocaleString()}
                        </span>
                    )}
                </div>
                {!forceRealPrice && hasMemberPrice && (
                    <div className="mt-2 p-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-900/50 rounded-lg">
                        <p className="text-xs text-sky-800 dark:text-sky-700">
                            <span className="font-semibold">Note:</span> The price shown above is our member discount price. {!canUseMemberPrice ? 'Sign in or create an account to enjoy this price at checkout.' : 'You\'re enjoying this exclusive member price!'}
                        </p>
                    </div>
                )}
            </div>

            {/* Product Details */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 p-4 space-y-3 mb-6">
                {(displaySku || typeof displayStock === 'number') && (
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        {displaySku && (
                            <div className="flex items-center gap-1">
                                <span className="text-gray-500 dark:text-gray-400">SKU:</span>
                                <span className="font-semibold text-slate-800 dark:text-gray-200">{displaySku}</span>
                            </div>
                        )}
                        {typeof displayStock === 'number' && (
                            <div className="flex items-center gap-1">
                                <span className="text-gray-500 dark:text-gray-400">Stock:</span>
                                <span className="font-semibold text-slate-800 dark:text-gray-200">{displayStock}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <span className="text-gray-500 dark:text-gray-400">Type:</span>
                            <span className="font-semibold text-sky-500 dark:text-sky-400">{productTypeLabel}</span>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full border ${isInStock ? 'border-green-500 bg-green-500 animate-pulse' : 'border-red-400 bg-red-400'}`} />
                    <span className={`text-sm font-semibold ${isInStock ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {isInStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                    {isInStock && typeof displayStock === 'number' && displayStock <= 10 && (
                        <span className="text-sm text-sky-600 dark:text-sky-400 font-medium">Only {displayStock} left</span>
                    )}
                </div>
            </div>

            {/* Variant Selection */}
            {hasRealVariants && (
                <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    {selectedVariantLabel || hasDisplayDimensions || selectedVariantImage ? (
                        <div className="flex items-center gap-3 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-900/20 p-3">
                            {selectedVariantImage ? (
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-sky-200 dark:border-sky-900/50">
                                    <Image
                                        src={selectedVariantImage}
                                        alt={selectedVariantLabel || product.name}
                                        fill
                                        className="object-cover"
                                        sizes="48px"
                                    />
                                </div>
                            ) : null}
                            <div className="flex min-w-0 flex-col gap-1">
                                {selectedVariantLabel && (
                                    <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                                        Selected: <span className="text-sky-600 dark:text-sky-400">{selectedVariantLabel}</span>
                                    </span>
                                )}
                                {hasDisplayDimensions && (
                                    <span className="text-xs text-slate-600 dark:text-gray-400">
                                        {displayWidth ? `W ${displayWidth} cm` : 'W -'} ?? {displayDimension ? `D ${displayDimension} cm` : 'D -'} ?? {displayHeight ? `H ${displayHeight} cm` : 'H -'}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {hasColorSelector && colorOptions.length > 0 && (
                        <div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-gray-300 block mb-2">
                                Color{effectiveSelectedColor && ': '}
                                {effectiveSelectedColor && (
                                    <span className="text-slate-600 dark:text-gray-400 capitalize">{effectiveSelectedColor}</span>
                                )}
                            </span>
                            <div className="flex gap-2">
                                {colorOptions.map(c => (
                                    <button
                                        key={c.name}
                                        title={c.name}
                                        onClick={() => setSelectedColor(c.name)}
                                        className={`w-10 h-10 rounded-full transition-all duration-200 hover:scale-110 ${
                                            effectiveSelectedColor === c.name ? 'ring-4 ring-sky-400 dark:ring-sky-500' : 'ring-2 ring-transparent'
                                        }`}
                                        style={{
                                            backgroundColor: c.hex ?? '#E5E7EB',
                                            borderWidth: '2px',
                                            borderColor: '#D1D5DB'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {hasPrimaryOptionSelector && variantNameOptions.length > 0 && (
                        <div>
                            <span className="text-sm font-semibold text-slate-700 mb-2 block">{primaryOptionLabel}</span>
                            <div className="grid grid-cols-2 gap-2">
                                {variantNameOptions.map((variantOption) => (
                                    <button
                                        key={variantOption.name}
                                        onClick={() => setSelectedVariantName(variantOption.name)}
                                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border-2 font-medium transition-all ${
                                            effectiveSelectedPrimaryName === variantOption.name
                                                ? 'border-sky-400 text-sky-600 dark:border-sky-500 dark:text-sky-400'
                                                : 'border-gray-200 text-slate-600 dark:border-gray-700 dark:text-gray-300 hover:border-sky-200 dark:hover:border-sky-900/50'
                                        }`}
                                    >
                                        {variantOption.image && (
                                            <span className="relative h-8 w-8 overflow-hidden rounded border border-gray-200 shrink-0">
                                                <Image
                                                    src={variantOption.image}
                                                    alt={variantOption.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="32px"
                                                />
                                            </span>
                                        )}
                                        <span className="truncate">{variantOption.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {shouldShowSecondaryOption && (
                        <div>
                            <span className="text-sm font-semibold text-slate-700 mb-2 block">{secondaryOptionLabel}</span>
                            <div className="grid grid-cols-2 gap-2">
                                {displayedSizeChoices.map((sizeChoice) => (
                                    <button
                                        key={sizeChoice.key}
                                        onClick={() => {
                                            setSelectedSize(sizeChoice.label);
                                            setSelectedSizeKey(sizeChoice.key);
                                        }}
                                        className={`rounded-lg border-2 px-3 py-2 text-left transition-all ${
                                            effectiveSelectedSizeKey === sizeChoice.key
                                                ? 'border-sky-400 text-sky-600 dark:border-sky-500 dark:text-sky-400'
                                                : 'border-gray-200 text-slate-600 dark:border-gray-700 dark:text-gray-300 hover:border-sky-200 dark:hover:border-sky-900/50'
                                        }`}
                                    >
                                        <span className="block text-sm font-medium">{sizeChoice.label}</span>
                                        {sizeChoice.meta && (
                                            <span className="mt-1 block text-[11px] text-slate-400">
                                                {sizeChoice.meta}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Shipping & Payment Info */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-5 space-y-4 mb-6">
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-200 mb-3">Shipping & Delivery</h4>
                    <div className="space-y-2">
                        {[
                            { icon: <Package size={16} className="text-sky-500" />, text: 'Ships within 1-3 business days' },
                            { icon: <Truck size={16} className="text-sky-500" />, text: 'Nationwide delivery via LBC / J&T' },
                            { icon: <CheckCircle size={16} className="text-green-500" />, text: 'Free assembly for Metro Manila orders' },
                        ].map(item => (
                            <div key={item.text} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                {item.icon}
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">We accept:</p>
                    <div className="flex items-center gap-3 flex-wrap">
                        {[
                            { src: 'https://1000logos.net/wp-content/uploads/2023/05/GCash-Logo.png', alt: 'GCash' },
                            { src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBLMVQZTu66K6hYmx4Ea-VbLaevkjWEHAzWw&s', alt: 'Maya' },
                            { src: 'https://cdn.simpleicons.org/visa', alt: 'Visa' },
                            { src: 'https://download.logo.wine/logo/Mastercard/Mastercard-Logo.wine.png', alt: 'Mastercard' },
                            { src: 'https://vectorseek.com/wp-content/uploads/2023/09/Bpi-Bank-Of-The-Philippine-Islands-Logo-Vector.svg-.png', alt: 'BPI' },
                            { src: 'https://logodix.com/logo/925694.png', alt: 'BDO' },
                            { src: 'https://play-lh.googleusercontent.com/0EFKMDMvv8IhSBH5OEvsrYW8SnYK56e6aHbTvriJoaQWxUgfAbi3wE8yhy5NYb_RVw', alt: 'LandBank' },
                            { src: 'https://play-lh.googleusercontent.com/xeCakfcf3dDyUovyFd7CiAL_5LoS6W7n83f7jo4GqwFZBjhPR9MO9HuUgttmYPnOe7A', alt: 'UnionBank' },
                            { src: 'https://png.pngtree.com/png-clipart/20250602/original/pngtree-cod-icon-vector-png-image_21114742.png', alt: 'Cash on Delivery' },
                        ].map((payment) => (
                            <div key={payment.alt} className="h-10">
                                <img
                                    src={payment.src}
                                    alt={payment.alt}
                                    className="h-10 w-auto"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quantity & Actions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">Quantity:</span>
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setQuantity(qty => Math.max(1, qty - 1))}
                            className="px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors text-lg font-medium"
                        >
                            -
                        </button>
                        <span className="px-5 py-2.5 text-sm font-bold text-slate-800 dark:text-gray-200 min-w-12 text-center border-x border-gray-200 dark:border-gray-700">
                            {quantity}
                        </span>
                        <button
                            onClick={() => setQuantity(qty => qty + 1)}
                            className="px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors text-lg font-medium"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <OutlineButton
                        onClick={handleAddToCart}
                        disabled={!isInStock || !isCheckoutAvailable}
                        className="flex-1"
                    >
                        {added ? 'Added!' : <><CartIcon /> Add to Cart</>}
                    </OutlineButton>
                    <PrimaryButton
                        onClick={() => {
                            if (!isInStock || !isCheckoutAvailable) return;
                            if (partnerSlug) {
                                handleDirectBuyNow();
                                return;
                            }
                            setBuyOptionsOpen(true);
                        }}
                        disabled={!isInStock || !isCheckoutAvailable}
                        className="flex-1"
                    >
                        Buy Now
                    </PrimaryButton>
                </div>
                {isManualCheckoutOnly ? (
                    <p className="text-sm font-medium text-sky-700">
                        This product is not available for checkout at the moment
                    </p>
                ) : null}
            </div>

            <BuyNowOptionsModal
                isOpen={buyOptionsOpen}
                onClose={() => setBuyOptionsOpen(false)}
                product={product}
                quantity={quantity}
                selectedVariant={selectedVariant}
                selectedColor={effectiveSelectedColor}
                selectedStyle={selectedVariant?.style?.trim() || selectedStyle}
                selectedSize={selectedVariant?.size?.trim() || selectedSize}
                selectedType={selectedVariant?.name?.trim() || undefined}
                forceRealPrice={forceRealPrice}
                onVariantSelect={handleModalVariantSelect}

            />

            {/* Share Modal */}
            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                product={{
                    id: product.id || 0,
                    name: displayTitle,
                    image: selectedVariantImage || product.image || '',
                    price: variantSrp,
                    priceMember: variantMember,
                    priceSrp: variantSrp,
                    priceDp: toPositiveNumber(selectedVariant?.priceDp) || toPositiveNumber(product.priceDp),
                    originalPrice: displayOriginalPrice,
                    sku: displaySku,
                    prodpv: variantPv,
                }}
                brandName={product.brand}
                shareUrl={shareUrl}
                forceRealPrice={forceRealPrice}
            />

        </motion.div>
    );
};

export default ProductInfo;


