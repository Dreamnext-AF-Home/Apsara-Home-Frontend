'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useGetWishlistQuery, useAddWishlistMutation, useRemoveWishlistMutation } from '@/store/api/wishlistApi';
import { showErrorToast, showSuccessToast } from '@/libs/toast';

interface ProductCardProps {
  id?: number;
  name: string;
  price: number;
  priceDp?: number;
  prodpv?: number;
  originalPrice?: number;
  image: string;
  badge?: string;
}

const FALLBACK_IMAGE = '/Images/HeroSection/chairs_stools.jpg';

const ProductCard = ({ id, name, price, priceDp, prodpv, originalPrice, image, badge }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [imageSrc, setImageSrc] = useState(image || FALLBACK_IMAGE);
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);

  const { data: wishlistItems = [] } = useGetWishlistQuery(undefined, { skip: !isLoggedIn });
  const [addWishlist, { isLoading: isAdding }] = useAddWishlistMutation();
  const [removeWishlist, { isLoading: isRemoving }] = useRemoveWishlistMutation();

  const safeName = (name || 'Untitled Product').trim();
  const slug = safeName.toLowerCase().replace(/\s+/g, '-');
  const productPath = typeof id === 'number' ? `/product/${slug}-i${id}` : `/product/${slug}`;
  const displayPrice = Number(priceDp ?? price ?? 0);
  const strikePrice = Number(originalPrice ?? 0);
  const displayPv = Number(prodpv ?? 0);

  const isWishlisted = typeof id === 'number' && wishlistItems.some(item => item.productId === id);
  const isWishlistPending = isAdding || isRemoving;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: typeof id === 'number' ? String(id) : slug,
      name: safeName,
      price: displayPrice,
      image: imageSrc,
    });
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      showErrorToast('Please log in to save to your wishlist.');
      return;
    }
    if (typeof id !== 'number') return;

    try {
      if (isWishlisted) {
        await removeWishlist(id).unwrap();
        showSuccessToast('Removed from wishlist.');
      } else {
        await addWishlist({ product_id: id, product_name: safeName }).unwrap();
        showSuccessToast('Added to wishlist!');
      }
    } catch {
      showErrorToast('Something went wrong. Please try again.');
    }
  };

  return (
    <Link href={productPath}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className='group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-shadow duration-500 cursor-pointer'
      >
        <div className='relative overflow-hidden aspect-square bg-gray-50'>
          <Image
            src={imageSrc}
            alt={safeName}
            fill
            className='object-cover transition-transform duration-700 group-hover:scale-110'
            onError={() => setImageSrc(FALLBACK_IMAGE)}
          />

          {badge && (
            <span className='absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10 tracking-wide'>
              {badge}
            </span>
          )}

          <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500' />

          {/* Wishlist button — slides in from right */}
          <button
            type="button"
            onClick={handleWishlist}
            disabled={isWishlistPending}
            className='absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 hover:bg-orange-50 disabled:opacity-60'
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill={isWishlisted ? '#f97316' : 'none'}
              stroke={isWishlisted ? '#f97316' : 'currentColor'}
              strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          {/* Add to Cart — slides up from bottom */}
          <div className='absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out'>
            <button
              type="button"
              onClick={handleAddToCart}
              className='w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg'
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Add to Cart
            </button>
          </div>
        </div>

        <div className='p-4'>
          <h3 className='text-sm font-medium text-gray-800 truncate group-hover:text-orange-500 transition-colors duration-200'>{safeName}</h3>
          <div className='flex items-center gap-2 mt-1'>
            <span className='text-orange-500 font-bold text-base'>₱{displayPrice.toLocaleString()}</span>
            {strikePrice > displayPrice && (
              <span className='text-gray-400 text-sm line-through'>₱{strikePrice.toLocaleString()}</span>
            )}
          </div>
          {displayPv > 0 && (
            <div className='mt-1.5 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700'>
              PV {displayPv.toLocaleString()}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
};

export default ProductCard;
