import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Minus, Plus, Check, ShoppingBag } from 'lucide-react';
import { Product } from './ProductCard';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: QuickViewModalProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Mock multiple images
  const images = product
    ? [
        product.image,
        product.image.replace('w=600', 'w=601'),
        product.image.replace('w=600', 'w=602'),
      ]
    : [];

  const handleAddToCart = () => {
    if (!product) return;
    setIsAdded(true);
    onAddToCart(product, quantity);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-4xl max-h-[90vh] z-50 overflow-hidden"
          >
            <div
              className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-soft-lg overflow-hidden"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
              }}
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-soft text-af-text hover:text-af-forest transition-colors"
              >
                <X size={20} />
              </motion.button>

              <div className="grid md:grid-cols-2 gap-0">
                {/* Image Gallery */}
                <div className="relative bg-[#f5f5f3] aspect-square md:aspect-auto">
                  <motion.img
                    key={currentImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    src={images[currentImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Navigation Arrows */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-soft text-af-text hover:bg-white transition-all"
                  >
                    <ChevronLeft size={20} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-soft text-af-text hover:bg-white transition-all"
                  >
                    <ChevronRight size={20} />
                  </motion.button>

                  {/* Image Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImage(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          currentImage === index
                            ? 'bg-af-forest w-6'
                            : 'bg-white/60'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Badges */}
                  {(product.badge || product.isNew) && (
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {product.isNew && (
                        <span className="bg-af-forest text-white text-xs font-bold px-3 py-1 rounded-full">
                          NEW
                        </span>
                      )}
                      {product.badge && (
                        <span className="bg-af-brass text-white text-xs font-bold px-3 py-1 rounded-full">
                          {product.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <span className="font-mono text-xs text-af-text-secondary uppercase tracking-wider">
                    {product.category}
                  </span>
                  <h2 className="font-display text-2xl md:text-3xl font-semibold text-af-text mt-2 mb-4">
                    {product.name}
                  </h2>

                  <div className="flex items-center gap-3 mb-6">
                    <span className="font-mono text-2xl font-bold text-af-forest">
                      ${product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="font-mono text-lg text-af-text-secondary line-through">
                        ${product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <p className="text-af-text-secondary leading-relaxed mb-8">
                    Crafted with premium materials and meticulous attention to
                    detail, this piece brings both comfort and sophistication to
                    your space. Designed to complement any modern interior while
                    standing the test of time.
                  </p>

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-af-text font-medium">Quantity:</span>
                    <div className="flex items-center gap-3 bg-[#f5f5f3] rounded-full px-2 py-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Minus size={16} />
                      </motion.button>
                      <span className="font-mono text-lg w-8 text-center">
                        {quantity}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Plus size={16} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    disabled={isAdded}
                    className={`relative w-full py-4 rounded-full font-semibold text-base flex items-center justify-center gap-2 transition-all duration-500 overflow-hidden ${
                      isAdded
                        ? 'bg-green-500 text-white'
                        : 'bg-af-brass text-white hover:bg-[#c4955f]'
                    }`}
                    style={{
                      boxShadow: '0px 4px 16px rgba(212, 165, 116, 0.4)',
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {isAdded ? (
                        <motion.span
                          key="added"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.2, 1] }}
                            transition={{ duration: 0.4 }}
                          >
                            <Check size={20} />
                          </motion.span>
                          Added to Cart!
                        </motion.span>
                      ) : (
                        <motion.span
                          key="add"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <ShoppingBag size={20} />
                          Add to Cart — ${(product.price * quantity).toLocaleString()}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Trust Indicators */}
                  <div className="flex flex-wrap gap-4 mt-6 text-sm text-af-text-secondary">
                    <span className="flex items-center gap-1">
                      <Check size={14} className="text-af-forest" /> Free Shipping
                    </span>
                    <span className="flex items-center gap-1">
                      <Check size={14} className="text-af-forest" /> 30-Day Returns
                    </span>
                    <span className="flex items-center gap-1">
                      <Check size={14} className="text-af-forest" /> 2-Year Warranty
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

