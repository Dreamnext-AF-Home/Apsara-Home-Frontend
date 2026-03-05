import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  count?: number;
}

export default function SkeletonLoader({ count = 8 }: SkeletonLoaderProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-2xl overflow-hidden shadow-soft"
        >
          {/* Image Skeleton */}
          <div className="aspect-[4/5] bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer bg-[length:200%_100%]" />
          
          {/* Content Skeleton */}
          <div className="p-5 space-y-3">
            {/* Category */}
            <div className="h-3 w-20 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded animate-shimmer bg-[length:200%_100%]" />
            
            {/* Title */}
            <div className="h-5 w-3/4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded animate-shimmer bg-[length:200%_100%]" />
            
            {/* Price */}
            <div className="h-5 w-24 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded animate-shimmer bg-[length:200%_100%]" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

