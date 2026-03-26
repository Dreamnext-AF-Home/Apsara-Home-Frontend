'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CategoryProduct } from '@/libs/CategoryData';
import ProductImageGallery from './ProductImageGallery';
import ProductInfo from './ProductInfo';
import StickyAddToCart from './StickyAddToCart';
import { useRouter, useSearchParams } from 'next/navigation';
import { setStoredReferralCode } from '@/libs/referral';
import { useSession } from 'next-auth/react';

interface ProductPageClientProps {
    product: CategoryProduct;
    categoryLabel: string;
}

type VariantOption = NonNullable<CategoryProduct['variants']>[number];

const ProductPageClient = ({ product, categoryLabel }: ProductPageClientProps) => {
    const [selectedVariant, setSelectedVariant] = useState<VariantOption | undefined>(undefined);
    const galleryKey = selectedVariant?.images?.join('|') || product.images?.join('|') || product.image;
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    const handleVariantChange = useCallback((variant?: VariantOption) => {
        setSelectedVariant(variant);
    }, []);

    useEffect(() => {
        const username = (searchParams.get('username') ?? '').trim();
        const preferredBy = (searchParams.get('preffered_by') ?? '').trim();
        if (!username || !preferredBy) return;

        const role = String(session?.user?.role ?? '').toLowerCase();
        if (status === 'authenticated' && role && role !== 'customer') return;

        try {
            setStoredReferralCode(username);
            const quantity = 1;
            const unitPrice = Number(selectedVariant?.priceSrp ?? product.price ?? 0);
            const subtotal = unitPrice * quantity;
            const handlingFee = subtotal >= 5000 ? 0 : 99;
            const total = subtotal + handlingFee;

            localStorage.setItem('guest_checkout', JSON.stringify({
                product: {
                    ...product,
                    image: selectedVariant?.images?.[0] || product.image,
                    sku: selectedVariant?.sku ?? product.sku,
                    price: selectedVariant?.priceSrp ?? product.price,
                    prodpv: selectedVariant?.prodpv ?? product.prodpv,
                },
                quantity,
                selectedColor: selectedVariant?.color ?? null,
                selectedSize: selectedVariant?.size ?? null,
                selectedType: selectedVariant?.name ?? null,
                selectedSku: selectedVariant?.sku ?? null,
                subtotal,
                handlingFee,
                total,
            }));
            router.replace('/checkout/customer');
        } catch {
            // If anything fails, keep user on product page.
        }
    }, [product, router, searchParams, selectedVariant]);

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <ProductImageGallery
                    key={galleryKey}
                    product={product}
                    selectedVariantImages={selectedVariant?.images}
                    preferredActiveImage={selectedVariant?.images?.[0]}
                />
                <ProductInfo product={product} categoryLabel={categoryLabel} onVariantChange={handleVariantChange} />
            </div>
            <StickyAddToCart product={product} selectedVariant={selectedVariant} />
        </>
    );
};

export default ProductPageClient;
