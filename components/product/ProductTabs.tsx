'use client';

import { CategoryProduct } from "@/libs/CategoryData";
import { mockReviews } from "@/libs/MockProductData";
import { displayColorName } from "@/libs/colorUtils";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import StarRating from "../ui/StarRating";

interface ProductTabsProps {
    product: CategoryProduct;
    defaultTab?: 'description' | 'specs' | 'reviews';
    onTabChange?: (tab: string) => void;
}

const tabs: { id: 'description' | 'specs' | 'reviews'; label: string }[] = [
    { id: 'description', label: 'Description' },
    { id: 'specs', label: 'Specifications' },
    { id: 'reviews', label: 'Reviews' },
];

const ProductTabs = ({ product, defaultTab = 'description', onTabChange }: ProductTabsProps) => {
    const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>(defaultTab);

    const handleTabChange = (tab: 'description' | 'specs' | 'reviews') => {
        setActiveTab(tab);
        onTabChange?.(tab);
    };

    const avgRating = (mockReviews.reduce((s, r) => s + r.rating, 0) / mockReviews.length).toFixed(1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 sm:mt-16"
        >
            <div className="flex border-b border-gray-200 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`relative px-4 sm:px-6 py-3 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                            activeTab === tab.id ? 'text-orange-500' : 'text-gray-400 hover:text-slate-600'
                        }`}
                    >
                        {tab.label}
                        {tab.id === 'reviews' && (
                            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                                activeTab === 'reviews' ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-400'
                            }`}>
                                {mockReviews.length}
                            </span>
                        )}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"
                            />
                        )}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="py-6 sm:py-8"
                >
                    {activeTab === 'description' && (
                        <div className="max-w-2xl text-gray-600 text-sm leading-relaxed">
                            {product.description ? (
                                <div
                                    className="text-sm text-gray-600 rich-content"
                                    dangerouslySetInnerHTML={{ __html: product.description }}
                                />
                            ) : (
                                <p className="text-gray-400 italic">No description available.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'specs' && (
                        <div className="max-w-lg">
                            {(() => {
                                const dimParts: string[] = []
                                if (product.pswidth  && product.pswidth  > 0) dimParts.push(`W: ${product.pswidth} cm`)
                                if (product.pslenght && product.pslenght > 0) dimParts.push(`D: ${product.pslenght} cm`)
                                if (product.psheight && product.psheight > 0) dimParts.push(`H: ${product.psheight} cm`)
                                const dimensions = dimParts.length > 0 ? dimParts.join(' × ') : null

                                const colorSet = new Set<string>()
                                product.variants?.forEach(v => { if (v.color) colorSet.add(displayColorName(v.color, v.colorHex)) })
                                const colorOptions = colorSet.size > 0 ? [...colorSet].join(', ') : null

                                const rows = [
                                    product.material                          ? { label: 'Material',          value: product.material }         : null,
                                    dimensions                                ? { label: 'Dimensions',         value: dimensions }                : null,
                                    product.weight && product.weight > 0      ? { label: 'Weight Capacity',   value: `${product.weight} kg` }   : null,
                                    product.assemblyRequired                  ? { label: 'Assembly Required',  value: 'Yes' }                    : null,
                                    product.warranty                          ? { label: 'Warranty',           value: product.warranty }          : null,
                                    colorOptions                              ? { label: 'Color Options',       value: colorOptions }              : null,
                                ].filter(Boolean) as { label: string; value: string }[]

                                return rows.length > 0 ? (
                                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                                        {rows.map((spec, index) => (
                                            <div
                                                key={spec.label}
                                                className={`flex items-center justify-between px-4 sm:px-5 py-3.5 text-sm gap-4 ${
                                                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                                }`}
                                            >
                                                <span className="font-semibold text-slate-700 w-36 sm:w-44 shrink-0">{spec.label}</span>
                                                <span className="text-gray-500 text-right">{spec.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 italic text-sm">No specifications available.</p>
                                )
                            })()}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="space-y-4 max-w-2xl">
                            <div className="flex items-center gap-4 sm:gap-6 bg-orange-50 rounded-2xl p-4 sm:p-5 mb-6">
                                <div className="text-center shrink-0">
                                    <div className="text-4xl sm:text-5xl font-bold text-orange-500">{avgRating}</div>
                                    <StarRating rating={Math.round(Number(avgRating))} size={14} />
                                    <div className="text-xs text-gray-400 mt-1">{mockReviews.length} reviews</div>
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    {[5, 4, 3, 2, 1].map(star => {
                                        const count = mockReviews.filter(r => r.rating === star).length;
                                        const pct = (count / mockReviews.length) * 100;
                                        return (
                                            <div key={star} className="flex items-center gap-2 text-xs">
                                                <span className="w-3 text-gray-500">{star}</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="#f97316" className="shrink-0">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                </svg>
                                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 0.6, delay: star * 0.05 }}
                                                        className="bg-orange-400 h-full rounded-full"
                                                    />
                                                </div>
                                                <span className="w-4 text-gray-400 text-right">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {mockReviews.map((review, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.08 }}
                                    className="border border-gray-100 rounded-2xl p-4 sm:p-5 hover:border-orange-100 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold shrink-0">
                                            {review.avatar}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-slate-800">{review.name}</span>
                                                <span className="text-xs text-gray-400 shrink-0">{review.date}</span>
                                            </div>
                                            <StarRating rating={review.rating} size={12} />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
};

export default ProductTabs;
