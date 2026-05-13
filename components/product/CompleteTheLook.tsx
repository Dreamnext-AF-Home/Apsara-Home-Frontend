'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useGetPublicProductsQuery } from '@/store/api/productsApi';
import { usePathname } from 'next/navigation';
import PrimaryButton from '@/components/ui/buttons/PrimaryButton';
import { buildStorefrontProductPath, extractPartnerSlugFromPath } from '@/libs/storefrontRouting';

interface CompleteTheLookProps {
  currentCategory: string;
  currentCategoryLabel?: string;
  currentCategoryId?: number;
  currentProductId?: number;
  presetItems?: Array<{
    id?: number;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    brand?: string;
    manualCheckoutEnabled?: boolean;
  }>;
  enableActivateDiscount?: boolean;
}

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const FALLBACK_IMAGE = '/Images/HeroSection/chairs_stools.jpg';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value || 0);

const resolveBundleCopy = (categoryLabel?: string, categorySlug?: string) => {
  const label = (categoryLabel || categorySlug || '').toLowerCase();

  const isAccessory = /(accessor|mobile|gadget|wearable|smart|tech|electronics|device|band|strap|watch)/.test(label);
  const isRoom = /(sofa|chair|table|rack|cabinet|bed|dining|living|room|home|furniture)/.test(label);

  if (isAccessory) {
    return {
      title: 'Complete the Setup',
      subtitle: 'Pair this with compatible add-ons and essentials for daily use.',
    };
  }

  if (isRoom) {
    return {
      title: 'Complete the Look',
      subtitle: 'Pair this with other pieces for a complete room.',
    };
  }

  return {
    title: 'You May Also Like',
    subtitle: 'More items that go well with your current pick.',
  };
};

type BundleItem = {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  brand?: string | null;
  manualCheckoutEnabled?: boolean;
};

const CompleteTheLook = ({ currentCategory, currentCategoryId, currentCategoryLabel, currentProductId, presetItems, enableActivateDiscount = false }: CompleteTheLookProps) => {
  const { addToCart } = useCart();
  const pathname = usePathname();
  const partnerSlug = extractPartnerSlugFromPath(pathname);
  const forceRealPrice = Boolean(partnerSlug) && !enableActivateDiscount;
  const { title, subtitle } = useMemo(
    () => resolveBundleCopy(currentCategoryLabel, currentCategory),
    [currentCategoryLabel, currentCategory],
  );

  const canQuery = !presetItems && typeof currentCategoryId === 'number' && currentCategoryId > 0;
  const { data, isFetching, isError } = useGetPublicProductsQuery(
    canQuery
      ? {
          page: 1,
          perPage: 18,
          status: '1',
          catId: currentCategoryId,
        }
      : undefined,
    { skip: !canQuery },
  );

  const bundleItems: BundleItem[] = useMemo(() => {
    if (Array.isArray(presetItems) && presetItems.length > 0) {
      return presetItems
        .filter((item) => (currentProductId ? item.id !== currentProductId : true))
        .slice(0, 6)
        .map((item) => ({
          id: Number(item.id ?? 0),
          name: item.name,
          price: Number(item.price ?? 0),
          originalPrice: item.originalPrice,
          image: item.image || FALLBACK_IMAGE,
          brand: item.brand ?? null,
          manualCheckoutEnabled: Boolean(item.manualCheckoutEnabled),
        }))
        .filter((item) => item.id > 0)
    }

    const products = data?.products ?? [];

    return products
      .filter((product) => (currentProductId ? product.id !== currentProductId : true))
      .slice(0, 6)
      .map((product) => {
        const srpPrice = Number(product.priceSrp ?? 0) || 0;
        const memberPrice = Number(product.priceMember ?? 0) || 0;
        const effectivePrice = !forceRealPrice && memberPrice > 0 && memberPrice < srpPrice ? memberPrice : srpPrice;

        return {
          id: product.id,
          name: product.name,
          price: effectivePrice,
          originalPrice: effectivePrice < srpPrice ? srpPrice : undefined,
          image: product.image || FALLBACK_IMAGE,
          brand: product.brand ?? null,
          manualCheckoutEnabled: Boolean(product.manualCheckoutEnabled),
        };
      });
  }, [data, currentProductId, forceRealPrice, presetItems]);

  const [selected, setSelected] = useState<Set<number> | null>(null);
  const selectedSet = useMemo(() => {
    const defaultSelection = new Set(bundleItems.map((item) => item.id));
    if (selected === null) return defaultSelection;
    const next = new Set(Array.from(selected).filter((id) => defaultSelection.has(id)));
    return next.size > 0 ? next : defaultSelection;
  }, [bundleItems, selected]);

  const toggleItem = (id: number) => {
    setSelected((prev) => {
      const base = prev ?? selectedSet;
      const next = new Set(base);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedItems = useMemo(() => bundleItems.filter((item) => selectedSet.has(item.id)), [bundleItems, selectedSet]);
  const total = useMemo(() => selectedItems.reduce((sum, item) => sum + item.price, 0), [selectedItems]);

  const handleAddAll = () => {
    selectedItems.forEach((item) => {
      addToCart({
        id: String(item.id),
        productId: item.id,
        name: item.name,
        price: item.price,
        originalPrice: typeof item.originalPrice === 'number' ? item.originalPrice : null,
        image: item.image,
        brand: item.brand ?? null,
        manualCheckoutEnabled: Boolean(item.manualCheckoutEnabled),
      });
    });
  };

  if (!canQuery || bundleItems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-12 sm:mt-16"
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-gray-100">{title}</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        {isFetching ? <p className="text-xs text-slate-400 dark:text-gray-500">Loading...</p> : null}
        {isError ? <p className="text-xs text-red-500 dark:text-red-400">Failed to load.</p> : null}
      </div>

      <div className="border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {bundleItems.map((item, index) => {
            const isSelected = selectedSet.has(item.id);
            const productPath = buildStorefrontProductPath(item.name, item.id, pathname);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.07 }}
                className={`flex items-center gap-4 p-4 transition-colors ${isSelected ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    isSelected ? 'bg-sky-500 border-sky-500' : 'border-gray-300 dark:border-gray-600 hover:border-sky-300 dark:hover:border-sky-400'
                  }`}
                >
                  {isSelected ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : null}
                </button>

                <Link href={productPath} className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                  <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                </Link>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-sky-500 dark:text-sky-400 font-semibold uppercase tracking-wide mb-0.5">
                    {currentCategoryLabel || 'Recommended'}
                  </p>
                  <Link href={productPath} className="text-sm font-semibold text-slate-800 dark:text-gray-200 hover:text-sky-500 dark:hover:text-sky-400 transition-colors line-clamp-1">
                    {item.name}
                  </Link>
                  {item.brand ? <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.brand}</p> : null}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{formatMoney(item.price)}</p>
                  {typeof item.originalPrice === 'number' && item.originalPrice > item.price ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 line-through">{formatMoney(item.originalPrice)}</p>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {selectedSet.size} item{selectedSet.size !== 1 ? 's' : ''} selected
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-gray-100">
              Total: <span className="text-sky-500 dark:text-sky-400">{formatMoney(total)}</span>
            </p>
          </div>
            <PrimaryButton
            onClick={handleAddAll}
            disabled={selectedSet.size === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm"
          >
            <CartIcon />
            Add {selectedSet.size > 0 ? `${selectedSet.size} Items` : 'Items'} to Cart
          </PrimaryButton>
        </div>
      </div>
    </motion.div>
  );
};

export default CompleteTheLook;
