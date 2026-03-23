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

type VariantOption = NonNullable<CategoryProduct['variants']>[number];

const ProductPageClient = ({ product, categoryLabel }: ProductPageClientProps) => {
    const [selectedVariant, setSelectedVariant] = useState<VariantOption | undefined>(undefined);

    const handleVariantChange = useCallback((variant?: VariantOption) => {
        setSelectedVariant(variant);
    }, []);

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <ProductImageGallery product={product} selectedVariantImages={selectedVariant?.images} />
                <ProductInfo product={product} categoryLabel={categoryLabel} onVariantChange={handleVariantChange} />
            </div>
            <StickyAddToCart product={product} selectedVariant={selectedVariant} />
        </>
    );
};

export default ProductPageClient;
