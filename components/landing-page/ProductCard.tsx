import { motion } from 'framer-motion';
import { Heart, Eye } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  badge?: string;
  isNew?: boolean;
}

interface ProductCardProps {
  product: Product;
  index: number;
  onQuickView: (product: Product) => void;
}

export default function ProductCard({
  product,
  index,
  onQuickView,
}: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
      className="group relative"
    >
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as const }}
        className="bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-shadow duration-500"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-[#f5f5f3]">
          <motion.img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          />

          {/* Badges */}
          {(product.badge || product.isNew) && (
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isNew && (
                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
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

          {/* Hover Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-black/10 flex items-center justify-center gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-soft-lg text-af-text hover:text-af-forest transition-colors"
            >
              <Heart size={20} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onQuickView(product)}
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-soft-lg text-af-text hover:text-af-forest transition-colors"
            >
              <Eye size={20} />
            </motion.button>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-5">
          <span className="font-mono text-xs text-af-text-secondary uppercase tracking-wider">
            {product.category}
          </span>
          <h3 className="font-display text-lg font-semibold text-af-text mt-1 mb-2 line-clamp-1">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-af-forest">
              ₱{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="font-mono text-sm text-af-text-secondary line-through">
                ₱{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

