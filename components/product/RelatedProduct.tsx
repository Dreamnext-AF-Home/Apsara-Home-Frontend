'use client';

import { CategoryProduct } from "@/libs/CategoryData";
import { motion } from "framer-motion";
import Link from "next/link";
import ItemCard from "../item/ItemCard";

const ChevronRight = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
);

interface RelatedProductProps {
    products: CategoryProduct[];
    category: string;
    viewAllHref?: string;
    forceRealPrice?: boolean;
}

const RelatedProducts = ({ products, category, viewAllHref, forceRealPrice = false }: RelatedProductProps) => {
    if (products.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 sm:mt-16"
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-gray-100">You Might Also Like</h2>
                <Link
                    href={viewAllHref || `/category/${category}`}
                    className="text-sm text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 font-semibold transition-colors flex items-center gap-1"
                >
                    View all <ChevronRight />
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {products.filter((product): product is CategoryProduct & { id: number } => product.id !== undefined).map((product, index) => (
                    <motion.div
                        key={product.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.08 }}
                    >
                        <ItemCard 
                            product={product} 
                            brandName={product.brand || ''} 
                            hideDiscountBadge={forceRealPrice}
                            forceRealPrice={forceRealPrice}
                        />
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default RelatedProducts;
