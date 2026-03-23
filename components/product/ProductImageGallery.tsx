'use client';

import { CategoryProduct } from '@/libs/CategoryData';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

interface ProductImageGalleryProps {
  product: CategoryProduct;
  selectedVariantImages?: string[];
}

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill={filled ? '#f97316' : 'none'}
    stroke={filled ? '#f97316' : 'currentColor'}
    strokeWidth="2"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ProductImageGallery = ({ product, selectedVariantImages }: ProductImageGalleryProps) => {
  const baseImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const variantImages = selectedVariantImages?.filter(Boolean) ?? [];
  const galleryImages = variantImages.length > 0 ? variantImages : baseImages;
  const hasMultipleImages = galleryImages.length > 1;
  const [activeImage, setActiveImage] = useState(0);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const safeActiveImage = galleryImages.length > 0
    ? Math.min(Math.max(activeImage, 0), galleryImages.length - 1)
    : 0;
  const activeSrc = galleryImages[safeActiveImage] ?? product.image;
  const goNext = () => {
    setSlideDirection(1);
    setActiveImage((prev) => (prev + 1) % galleryImages.length);
  };
  const goPrev = () => {
    setSlideDirection(-1);
    setActiveImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };
  const goToImage = (index: number) => {
    if (index === safeActiveImage) return;
    setSlideDirection(index > safeActiveImage ? 1 : -1);
    setActiveImage(index);
  };

  return (
    <>
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-xl aspect-square"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={activeSrc} alt={product.name} fill className="object-contain" priority />
            </motion.div>
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/40 rounded-full p-2.5 transition-colors backdrop-blur-sm"
            >
              <CloseIcon />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="md:sticky md:top-4"
      >
        <div className="flex gap-4 items-start">
          {hasMultipleImages && (
            <div className="hidden md:flex w-[72px] shrink-0 flex-col gap-2 max-h-[640px] overflow-y-auto pr-1">
              {galleryImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 bg-gray-100 transition-all ${
                    safeActiveImage === index ? 'border-orange-400' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <Image src={image} alt={`View ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          <div
            className="relative flex-1 aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-[#ececec] shadow-sm cursor-zoom-in group"
            onClick={() => setIsZoomed(true)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSrc}
                initial={{ opacity: 0, x: slideDirection > 0 ? 40 : -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection > 0 ? -40 : 40 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="absolute inset-0"
              >
                <Image src={activeSrc} alt={product.name} fill className="object-contain p-2 sm:p-4" priority />
              </motion.div>
            </AnimatePresence>

            {product.badge && (
              <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-orange-500 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full z-10">
                {product.badge}
              </span>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsWishlisted((w) => !w);
              }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 backdrop-blur-sm p-2 sm:p-2.5 rounded-full shadow-md hover:scale-110 transition-all z-10"
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <HeartIcon filled={isWishlisted} />
            </button>

            {hasMultipleImages && (
              <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev();
                  }}
                  className="h-11 w-11 rounded-full bg-white/95 hover:bg-white text-slate-700 shadow-md transition-colors flex items-center justify-center"
                  aria-label="Previous image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                  className="h-11 w-11 rounded-full bg-white/95 hover:bg-white text-slate-700 shadow-md transition-colors flex items-center justify-center"
                  aria-label="Next image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {hasMultipleImages && (
          <div className="flex md:hidden gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {galleryImages.map((image, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border-2 transition-all duration-200 ${
                  activeImage === index ? 'border-orange-400' : 'border-gray-100'
                }`}
              >
                <Image src={image} alt={`View ${index + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
};

export default ProductImageGallery;
