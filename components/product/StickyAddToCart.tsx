'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { CategoryProduct } from '@/libs/CategoryData';
import { displayColorName } from '@/libs/colorUtils';
import PrimaryButton from '@/components/ui/buttons/PrimaryButton';
import OutlineButton from '@/components/ui/buttons/OutlineButton';
import { useGetPublicGeneralSettingsQuery } from '@/store/api/adminSettingsApi';
import { usePathname, useRouter } from 'next/navigation';

interface StickyAddToCartProps {
  product: CategoryProduct;
  selectedVariant?: NonNullable<CategoryProduct['variants']>[number];
  forceRealPrice?: boolean;
}

const toPositiveNumber = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const getEffectiveVariantStock = (variants?: CategoryProduct['variants']) => {
  const activeVariants = (variants ?? []).filter((variant) => (variant?.status ?? 1) === 1);

  if (activeVariants.length === 0) {
    return undefined;
  }

  return activeVariants.reduce((total, variant) => total + Number(variant?.qty ?? 0), 0);
};

const StickyAddToCart = ({ product, selectedVariant, forceRealPrice = false }: StickyAddToCartProps) => {
  const [visible, setVisible] = useState(false);
  const { addToCart } = useCart();
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { data: publicSettingsData } = useGetPublicGeneralSettingsQuery();
  const isLoggedIn = Boolean(session?.user);
  const role = String((session?.user as { role?: string } | undefined)?.role ?? '').toLowerCase();
  const canUseMemberPrice = isLoggedIn;
  const canSeePv = role === '' || role === 'customer' || role === 'member' || role === 'affiliate';
  const hasSelectedVariant = Boolean(selectedVariant);
  const displayPv = hasSelectedVariant
    ? (toPositiveNumber(selectedVariant?.prodpv) ?? 0)
    : Number(product.prodpv ?? 0);
  const srp = toPositiveNumber(selectedVariant?.priceSrp) ?? toPositiveNumber(product.originalPrice) ?? Number(product.price ?? 0);
  const member = toPositiveNumber(selectedVariant?.priceMember) ?? toPositiveNumber(product.priceMember) ?? 0;
  const seenTitleParts = new Set<string>();
  const selectedVariantTitleParts = [
    selectedVariant?.name?.trim(),
    selectedVariant?.style?.trim(),
    selectedVariant?.size?.trim(),
  ].filter((part): part is string => {
    if (!part) return false;
    const normalized = part.toLowerCase();
    if (seenTitleParts.has(normalized)) return false;
    seenTitleParts.add(normalized);
    return true;
  });
  const displayName = selectedVariantTitleParts.length > 0
    ? `${product.name} - ${selectedVariantTitleParts.join(' - ')}`
    : product.name;
  const displayImage = selectedVariant?.images?.find((image) => typeof image === 'string' && image.trim().length > 0) || product.image;
  const hasMemberPrice = member > 0 && member < srp;
  const displayPrice = !forceRealPrice && canUseMemberPrice && hasMemberPrice ? member : srp;
  const totalVariantStock = getEffectiveVariantStock(product.variants);
  const stock = typeof selectedVariant?.qty === 'number'
    ? selectedVariant.qty
    : (typeof totalVariantStock === 'number' ? totalVariantStock : Number(product.stock ?? 0));
  const isInStock = stock > 0;
  const isCheckoutAvailable = !(Boolean(publicSettingsData?.settings?.enable_manual_checkout_mode) && !Boolean(product.manualCheckoutEnabled));

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let scrollTimeout: NodeJS.Timeout;
    const handler = () => {
      const currentScrollY = window.scrollY;
      // Add hysteresis to prevent rapid toggling
      if (visible && currentScrollY < 400) {
        setVisible(false);
      } else if (!visible && currentScrollY > 500) {
        setVisible(true);
      }
      lastScrollY = currentScrollY;
    };
    // Throttle scroll events to prevent rapid toggling
    const throttledHandler = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handler, 50);
    };
    window.addEventListener('scroll', throttledHandler);
    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', throttledHandler);
    };
  }, [visible]);

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
    ].filter(Boolean).join(' ?? ');
    const cartItemIdBase = product.id ? String(product.id) : product.name.toLowerCase().replace(/\s+/g, '-');
    const cartItemId = selectedVariant?.sku ? `${cartItemIdBase}::${selectedVariant.sku}` : cartItemIdBase;

    addToCart({
      id: cartItemId,
      productId: product.id,
      variantId: selectedVariant?.id,
      name: variantLabel ? `${product.name} (${variantLabel})` : product.name,
      price: displayPrice,
      originalPrice: !forceRealPrice && hasMemberPrice ? srp : null,
      image: displayImage,
      prodpv: displayPv,
      brand: product.brand ?? null,
      manualCheckoutEnabled: product.manualCheckoutEnabled,
      selectedColor: selectedVariant?.color ?? null,
      selectedStyle: selectedVariant?.style ?? null,
      selectedSize: selectedVariant?.size ?? null,
      selectedType: selectedVariant?.name ?? null,
      selectedSku: selectedVariant?.sku ?? product.sku ?? null,
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed left-0 right-0 top-0 z-[60] border-b border-gray-200 bg-white shadow-md dark:bg-gray-900 dark:border-gray-700"
        >
          <div className="container mx-auto flex items-center gap-3 px-4 py-2.5">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800">
              <Image src={displayImage} alt={displayName} fill className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800 dark:text-gray-200">{displayName}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-sky-500">{'\u20b1'}{displayPrice.toLocaleString()}</p>
                {canSeePv && !selectedVariant && (
                  <span className="rounded-full border border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                    PV {displayPv.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <OutlineButton
                onClick={handleAddToCart}
                disabled={!isInStock || !isCheckoutAvailable}
                className="!px-4 !py-2 !text-sm !rounded-lg"
              >
                <span className="hidden sm:inline">Add to Cart</span>
                <span className="sm:hidden">Cart</span>
              </OutlineButton>
              <PrimaryButton
                disabled={!isInStock || !isCheckoutAvailable}
                className="!px-4 !py-2 !text-sm !rounded-lg"
              >
                Buy Now
              </PrimaryButton>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyAddToCart;
