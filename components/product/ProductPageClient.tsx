'use client';

import { useCallback, useState } from 'react';
import type { CategoryProduct } from '@/libs/CategoryData';
import ProductImageGallery from './ProductImageGallery';
import ProductInfo from './ProductInfo';
import StickyAddToCart from './StickyAddToCart';

interface ProductPageClientProps {
    product: CategoryProduct;
    categoryLabel: string;
}

const ProductPageClient = ({ product, categoryLabel }: ProductPageClientProps) => {
    const [activeVariantImage, setActiveVariantImage] = useState<string | undefined>(undefined);
    const [selectedVariant, setSelectedVariant] = useState<CategoryProduct['variants'] extends Array<infer T> ? T | undefined : undefined>(undefined);

    const handleVariantChange = useCallback((variant?: CategoryProduct['variants'] extends Array<infer T> ? T : never) => {
        setSelectedVariant(variant);
        setActiveVariantImage(variant?.images?.[0]);
    }, []);

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <ProductImageGallery product={product} activeVariantImage={activeVariantImage} />
                <ProductInfo product={product} categoryLabel={categoryLabel} onVariantChange={handleVariantChange} />
            </div>
            <StickyAddToCart product={product} selectedVariant={selectedVariant} />
        </>
    );
};

export default ProductPageClient;
