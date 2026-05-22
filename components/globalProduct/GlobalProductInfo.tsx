'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'
import { Package, Truck, CheckCircle, Eye } from 'lucide-react'
import StarRating from '@/components/ui/StarRating'
import OutlineButton from '@/components/ui/buttons/OutlineButton'
import PrimaryButton from '@/components/ui/buttons/PrimaryButton'
import ShareModal from '@/components/ui/ShareModal'
import BuyNowOptionsModal from '@/components/product/BuyNowOptionsModal'
import toast from 'react-hot-toast'
import type { CategoryProduct } from '@/libs/CategoryData'
import type { ZqPublicProductResponse } from '@/store/api/productsApi'

type Product = ZqPublicProductResponse['product']
type Spec = NonNullable<Product['specs']>[number]

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
)

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill={filled ? '#38bdf8' : 'none'}
    stroke={filled ? '#38bdf8' : 'currentColor'}
    strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

interface GlobalProductInfoProps {
  product: Product
  onVariantChange?: (spec: Spec | null) => void
}

export default function GlobalProductInfo({ product, onVariantChange }: GlobalProductInfoProps) {
  const specs: Spec[] = useMemo(() => product.specs ?? [], [product.specs])
  const [selectedSpec, setSelectedSpec] = useState<Spec | null>(specs[0] ?? null)
  const [quantity, setQuantity] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [buyOptionsOpen, setBuyOptionsOpen] = useState(false)

  const handleSelectSpec = (spec: Spec) => {
    setSelectedSpec(spec)
    onVariantChange?.(spec)
  }

  // Price logic
  const priceMinCents = Number(product.priceMinCents ?? 0)
  const priceMaxCents = Number(product.priceMaxCents ?? 0)
  const displayPriceCents = selectedSpec?.priceCents != null ? Number(selectedSpec.priceCents) : (priceMinCents || priceMaxCents)
  const displayPrice = displayPriceCents / 100

  const comparePriceCents = selectedSpec?.priceCents != null && priceMaxCents > Number(selectedSpec.priceCents)
    ? priceMaxCents
    : priceMaxCents > priceMinCents ? priceMaxCents : null
  const comparePrice = comparePriceCents ? comparePriceCents / 100 : null
  const savings = comparePrice && comparePrice > displayPrice ? comparePrice - displayPrice : null

  // Stock — cached spec-level stock is often 0/unreliable; fall back to product.totalStock
  const specStockSum = specs.reduce((sum, s) => sum + Number(s.stock ?? 0), 0)
  const specStockReliable = specStockSum > 0
  const getSpecStock = useCallback(
    (spec: Spec) => (specStockReliable ? Number(spec.stock ?? 0) : product.totalStock),
    [product.totalStock, specStockReliable],
  )
  const currentStock = selectedSpec != null ? getSpecStock(selectedSpec) : product.totalStock
  const isInStock = currentStock > 0

  // SKU
  const displaySku = selectedSpec?.sku || product.externalId || ''

  const checkoutProduct = useMemo<CategoryProduct>(() => ({
    id: product.id,
    name: product.subject,
    image: selectedSpec?.image || product.primaryImage || product.images?.[0] || '',
    images: product.images ?? [],
    price: displayPrice,
    priceSrp: displayPrice,
    priceMember: displayPrice,
    priceDp: displayPrice,
    originalPrice: comparePrice ?? undefined,
    prodpv: 0,
    sku: displaySku,
    stock: currentStock,
    brand: 'AF HOME GLOBAL BRAND',
    type: 1,
    manualCheckoutEnabled: true,
    sourceType: 'zq',
    zqProductId: product.id,
    zqExternalId: product.externalId,
    zqOfferId: product.offerId ?? null,
    description: product.description ?? undefined,
    specifications: product.categoryName ?? undefined,
    variants: specs.map((spec, index) => {
      const variantPrice = Number(spec.priceCents ?? displayPriceCents) / 100
      return {
        id: index + 1,
        sku: spec.sku,
        name: spec.name,
        priceSrp: variantPrice,
        priceMember: variantPrice,
        priceDp: variantPrice,
        prodpv: 0,
        qty: getSpecStock(spec),
        status: getSpecStock(spec) > 0 ? 1 : 0,
        images: spec.image ? [spec.image] : undefined,
      }
    }),
  }), [comparePrice, currentStock, displayPrice, displayPriceCents, displaySku, getSpecStock, product, selectedSpec?.image, specs])

  const checkoutSelectedVariant = useMemo(
    () => checkoutProduct.variants?.find((variant) => variant.sku === selectedSpec?.sku),
    [checkoutProduct.variants, selectedSpec?.sku],
  )

  // Share URL
  const shareUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://www.afhome.ph/global-product/${product.id}`

  const handleWishlist = () => {
    setWishlisted((prev) => !prev)
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  const handleAddToCart = () => {
    toast('Sign in to add this Global Supplier product to your cart.')
  }

  const handleBuyNow = () => {
    setBuyOptionsOpen(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      {/* Header: title + wishlist/share */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <span className="text-xs font-bold text-sky-500 uppercase tracking-wider">AF HOME GLOBAL BRAND</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight mt-1">
            {product.subject}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            onClick={handleWishlist}
            whileTap={{ scale: 0.8 }}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              wishlisted
                ? 'border-sky-200 text-sky-500 dark:border-sky-900/50 dark:text-sky-400'
                : 'border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-500 hover:border-sky-200 hover:text-sky-500'
            }`}
            title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <HeartIcon filled={wishlisted} />
          </motion.button>
          <button
            className="p-2 rounded-xl border border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-500 hover:border-sky-200 hover:text-sky-500 transition-all cursor-pointer"
            onClick={() => setIsShareOpen(true)}
            type="button"
          >
            <ShareIcon />
          </button>
        </div>
      </div>

      {/* Rating & Badges */}
      <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <StarRating rating={0} size={16} />
          <span className="text-sm font-bold text-slate-700 dark:text-gray-300">0.0</span>
          <span className="text-sm text-gray-400 dark:text-gray-500">(0 reviews)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 px-2.5 py-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
            Global Supplier
          </span>
          {product.categoryName && (
            <span className="rounded-full border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:text-gray-400">
              {product.categoryName}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            <Eye size={12} />
            -- viewing now
          </span>
        </div>
      </div>

      {/* Price Section */}
      <div className="bg-gradient-to-r from-sky-50 to-sky-50 dark:from-sky-900/20 dark:to-sky-900/20 rounded-2xl p-6 border border-sky-100 dark:border-sky-900/30">
        <div className="flex items-baseline gap-3 flex-wrap mb-3">
          {displayPriceCents > 0 ? (
            <>
              <span className="text-3xl sm:text-4xl font-bold text-sky-600 dark:text-sky-400">
                &#8369;{displayPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {comparePrice && comparePrice > displayPrice && (
                <>
                  <span className="text-lg text-gray-400 dark:text-gray-500 line-through">
                    &#8369;{comparePrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {savings && (
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50 px-3 py-1 rounded-full">
                      Save &#8369;{savings.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </>
              )}
            </>
          ) : (
            <span className="text-xl text-gray-400 dark:text-gray-500">Price available upon registration</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-full border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-900/20 px-3 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400">
            Register to get 6% discount!
          </span>
        </div>
        <div className="mt-2 p-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-900/50 rounded-lg">
          <p className="text-xs text-sky-800 dark:text-sky-700">
            <span className="font-semibold">Note:</span> Sign in or create an account to enjoy exclusive member pricing at checkout.
          </p>
        </div>
      </div>

      {/* Product Details */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {displaySku && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500 dark:text-gray-400">SKU:</span>
              <span className="font-semibold text-slate-800 dark:text-gray-200">{displaySku}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="text-gray-500 dark:text-gray-400">Stock:</span>
            <span className="font-semibold text-slate-800 dark:text-gray-200">{currentStock}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-500 dark:text-gray-400">Type:</span>
            <span className="font-semibold text-sky-500 dark:text-sky-400">
              {specs.length > 0 ? 'Variant' : 'Global Supplier'}
            </span>
          </div>
          {specs.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500 dark:text-gray-400">Variant:</span>
              <span className="font-semibold text-slate-800 dark:text-gray-200">{specs.length}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full border ${isInStock ? 'border-green-500 bg-green-500 animate-pulse' : 'border-red-400 bg-red-400'}`} />
          <span className={`text-sm font-semibold ${isInStock ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {isInStock ? 'In Stock' : 'Out of Stock'}
          </span>
          {isInStock && currentStock <= 10 && (
            <span className="text-sm text-sky-600 dark:text-sky-400 font-medium">Only {currentStock} left</span>
          )}
        </div>
      </div>

      {/* Variant / Spec Selection */}
      {specs.length > 0 && (
        <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          {/* Selected indicator */}
          {selectedSpec && (
            <div className="flex items-center gap-3 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-900/20 p-3">
              {selectedSpec.image && (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-sky-200 dark:border-sky-900/50">
                  <Image src={selectedSpec.image} alt={selectedSpec.name} fill className="object-cover" sizes="48px" unoptimized />
                </div>
              )}
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                  Selected: <span className="text-sky-600 dark:text-sky-400">{selectedSpec.name}</span>
                </span>
                {selectedSpec.priceCents != null && (
                  <span className="text-xs text-slate-500 dark:text-gray-400">
                    &#8369;{(Number(selectedSpec.priceCents) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })} · {getSpecStock(selectedSpec).toLocaleString()} available
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Size buttons */}
          <div>
            <span className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2 block">Size</span>
            <div className="grid grid-cols-2 gap-2">
              {specs.map((spec) => {
                const active = selectedSpec?.id === spec.id
                const stock = getSpecStock(spec)
                const oos = stock === 0
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => !oos && handleSelectSpec(spec)}
                    disabled={oos}
                    className={`relative rounded-lg border-2 px-3 py-2 text-left transition-all ${
                      active
                        ? 'border-sky-400 text-sky-600 dark:border-sky-500 dark:text-sky-400'
                        : oos
                          ? 'cursor-not-allowed border-dashed border-gray-200 bg-gray-50 text-gray-400 opacity-75 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-500'
                          : 'border-gray-200 text-slate-600 dark:border-gray-700 dark:text-gray-300 hover:border-sky-200 dark:hover:border-sky-900/50'
                    }`}
                  >
                    <span className="block text-sm font-medium">{spec.name}</span>
                    {spec.priceCents != null && (
                      <span className={`mt-0.5 block text-[11px] ${oos ? 'text-gray-400 dark:text-gray-500' : 'text-slate-400 dark:text-gray-500'}`}>
                        &#8369;{(Number(spec.priceCents) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        {oos ? ' · Out of stock' : ` · ${stock.toLocaleString()} left`}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Shipping & Payment Info */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-5 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-200 mb-3">Shipping &amp; Delivery</h4>
          <div className="space-y-2">
            {[
              { icon: <Package size={16} className="text-sky-500" />, text: 'Ships within 1-3 business days' },
              { icon: <Truck size={16} className="text-sky-500" />, text: 'Nationwide delivery via LBC / J&T' },
              { icon: <CheckCircle size={16} className="text-green-500" />, text: 'Free assembly for Metro Manila orders' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">We accept:</p>
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { src: 'https://1000logos.net/wp-content/uploads/2023/05/GCash-Logo.png', alt: 'GCash' },
              { src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBLMVQZTu66K6hYmx4Ea-VbLaevkjWEHAzWw&s', alt: 'Maya' },
              { src: 'https://cdn.simpleicons.org/visa', alt: 'Visa' },
              { src: 'https://download.logo.wine/logo/Mastercard/Mastercard-Logo.wine.png', alt: 'Mastercard' },
              { src: 'https://vectorseek.com/wp-content/uploads/2023/09/Bpi-Bank-Of-The-Philippine-Islands-Logo-Vector.svg-.png', alt: 'BPI' },
              { src: 'https://logodix.com/logo/925694.png', alt: 'BDO' },
              { src: 'https://play-lh.googleusercontent.com/0EFKMDMvv8IhSBH5OEvsrYW8SnYK56e6aHbTvriJoaQWxUgfAbi3wE8yhy5NYb_RVw', alt: 'LandBank' },
              { src: 'https://play-lh.googleusercontent.com/xeCakfcf3dDyUovyFd7CiAL_5LoS6W7n83f7jo4GqwFZBjhPR9MO9HuUgttmYPnOe7A', alt: 'UnionBank' },
              { src: 'https://png.pngtree.com/png-clipart/20250602/original/pngtree-cod-icon-vector-png-image_21114742.png', alt: 'Cash on Delivery' },
            ].map((payment) => (
              <div key={payment.alt} className="h-10">
                <img src={payment.src} alt={payment.alt} className="h-10 w-auto" loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quantity & Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">Quantity:</span>
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:text-sky-500 transition-colors text-lg font-medium"
            >
              -
            </button>
            <span className="px-5 py-2.5 text-sm font-bold text-slate-800 dark:text-gray-200 min-w-12 text-center border-x border-gray-200 dark:border-gray-700">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => (isInStock ? Math.min(q + 1, currentStock) : q))}
              className="px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:text-sky-500 transition-colors text-lg font-medium"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <OutlineButton onClick={handleAddToCart} disabled={!isInStock} className="flex-1">
            <CartIcon /> Add to Cart
          </OutlineButton>
          <PrimaryButton onClick={handleBuyNow} disabled={!isInStock} className="flex-1">
            Buy Now
          </PrimaryButton>
        </div>
      </div>

      {/* Share Modal */}
      <BuyNowOptionsModal
        isOpen={buyOptionsOpen}
        onClose={() => setBuyOptionsOpen(false)}
        product={checkoutProduct}
        quantity={quantity}
        selectedVariant={checkoutSelectedVariant}
        selectedType={selectedSpec?.name}
        forceRealPrice
        onVariantSelect={(variant) => {
          const spec = specs.find((item) => item.sku === variant.sku)
          if (spec) handleSelectSpec(spec)
        }}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        product={{
          id: product.id ?? 0,
          name: product.subject,
          image: product.primaryImage || '',
          price: displayPrice,
          priceMember: displayPrice,
          priceSrp: comparePrice ?? displayPrice,
          priceDp: displayPrice,
          originalPrice: comparePrice ?? undefined,
          sku: displaySku,
          prodpv: 0,
        }}
        brandName="AF HOME GLOBAL BRAND"
        shareUrl={shareUrl}
        forceRealPrice={true}
      />
    </motion.div>
  )
}
