import { motion } from 'framer-motion';
import Link from 'next/link';
import ProductCard, { Product } from './ProductCard';

const products: Product[] = [
  {
    id: '1',
    name: 'Aurora Velvet Sofa',
    price: 2499,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
    category: 'Living Room',
    isNew: true,
  },
  {
    id: '2',
    name: 'Scandinavian Dining Table',
    price: 1299,
    originalPrice: 1599,
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80',
    category: 'Dining',
    badge: '-20%',
  },
  {
    id: '3',
    name: 'Minimalist Bed Frame',
    price: 1899,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80',
    category: 'Bedroom',
  },
  {
    id: '4',
    name: 'Executive Office Chair',
    price: 749,
    image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&q=80',
    category: 'Office',
    isNew: true,
  },
  {
    id: '5',
    name: 'Rattan Accent Chair',
    price: 599,
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80',
    category: 'Living Room',
  },
  {
    id: '6',
    name: 'Marble Coffee Table',
    price: 899,
    originalPrice: 1099,
    image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&q=80',
    category: 'Living Room',
    badge: '-18%',
  },
  {
    id: '7',
    name: 'Teak Garden Lounger',
    price: 1199,
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80',
    category: 'Outdoor',
  },
  {
    id: '8',
    name: 'Oak Bookshelf',
    price: 649,
    image: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&q=80',
    category: 'Office',
  },
  {
    id: '9',
    name: 'Linen Sectional Sofa',
    price: 3299,
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80',
    category: 'Living Room',
    isNew: true,
  },
  {
    id: '10',
    name: 'Modern Nightstand',
    price: 349,
    image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&q=80',
    category: 'Bedroom',
  },
  {
    id: '11',
    name: 'Leather Dining Chairs Set',
    price: 899,
    originalPrice: 1199,
    image: 'https://images.unsplash.com/photo-1551298370-9d3d53f3a47f?w=600&q=80',
    category: 'Dining',
    badge: '-25%',
  },
  {
    id: '12',
    name: 'Walnut Dresser',
    price: 1499,
    image: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=600&q=80',
    category: 'Bedroom',
  },
];

interface ProductGridProps {
  selectedCategory: string | null;
  onQuickView: (product: Product) => void;
}

export default function ProductGrid({
  selectedCategory,
  onQuickView,
}: ProductGridProps) {
  const filteredProducts = selectedCategory
    ? products.filter(
      (p) => p.category.toLowerCase().replace(' ', '-').includes(selectedCategory)
    )
    : products;

  return (
    <section id="shop" className="py-16 md:py-24 bg-af-cream">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-af-text font-semibold mb-4">
            Featured Collection
          </h2>
          <p className="text-af-text-secondary text-lg max-w-xl mx-auto">
            Handpicked pieces that define modern elegance
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onQuickView={onQuickView}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-af-text-secondary text-lg">
              No products found in this category.
            </p>
          </motion.div>
        )}

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link href="/category" className="inline-block">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 border-2 border-orange-500 text-orange-500 px-8 py-4 rounded-full font-semibold text-base hover:bg-orange-500 hover:text-white transition-all duration-300"
            >
              View All Products
            </motion.button>
          </Link>
        </motion.div>

      </div>
    </section>
  );
}

