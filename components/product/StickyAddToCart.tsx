'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { CategoryProduct } from '@/libs/CategoryData';

interface StickyAddToCartProps {
  product: CategoryProduct;
}

const StickyAddToCart = ({ product }: StickyAddToCartProps) => {
  const [visible, setVisible] = useState(false);
  const { addToCart } = useCart();
  const { data: session } = useSession();
  const role = String((session?.user as { role?: string } | undefined)?.role ?? '').toLowerCase();
  const canSeePv = role === '' || role === 'customer' || role === 'member' || role === 'affiliate';
  const displayPv = Number(product.prodpv ?? 0);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleAddToCart = () => {
    addToCart({
      id: product.name.toLowerCase().replace(/\s+/g, '-'),
      name: product.name,
      price: product.price,
      image: product.image,
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
          className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200 bg-white shadow-md"
        >
          <div className="container mx-auto flex items-center gap-3 px-4 py-2.5">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50">
              <Image src={product.image} alt={product.name} fill className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">{product.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-orange-500">PHP {product.price.toLocaleString()}</p>
                {canSeePv && (
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    PV {displayPv.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={handleAddToCart}
                className="rounded-xl bg-orange-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-600 active:bg-orange-700 sm:px-5 sm:text-sm"
              >
                <span className="hidden sm:inline">Add to Cart</span>
                <span className="sm:hidden">Cart</span>
              </button>
              <button className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 sm:px-5 sm:text-sm">
                Buy Now
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyAddToCart;
