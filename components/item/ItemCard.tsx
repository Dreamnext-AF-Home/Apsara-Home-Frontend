'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAddToCartMutation, useGetCartQuery } from '@/store/api/cartApi'
import { useGetWishlistQuery, useAddWishlistMutation, useRemoveWishlistMutation } from '@/store/api/wishlistApi'
import { useLazyGetPublicProductQuery } from '@/store/api/productsApi'
import { useCart } from '@/context/CartContext'
import toast from 'react-hot-toast'
import ShareModal from '@/components/ui/ShareModal'
import { buildStorefrontProductPath } from '@/libs/storefrontRouting'

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const formatPeso = (value: number) => `\u20b1${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
const GUEST_WISHLIST_STORAGE_KEY = 'synergy_guest_wishlist_product_ids'
const GUEST_WISHLIST_ITEMS_STORAGE_KEY = 'synergy_guest_wishlist_items'

type GuestWishlistItem = {
  productId: number
  name: string
  price: number
  priceMember?: number
  priceDp?: number
  priceSrp?: number
  originalPrice?: number
  sku?: string
  prodpv?: number
  image: string
  slug: string
  brand?: string | null
}

const readGuestWishlistItems = (): GuestWishlistItem[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(GUEST_WISHLIST_ITEMS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []

    const normalized = parsed
      .map((entry): GuestWishlistItem | null => {
        if (!entry || typeof entry !== 'object') return null
        const row = entry as Record<string, unknown>
        const productId = Number(row.productId ?? 0)
        if (!Number.isInteger(productId) || productId <= 0) return null
        return {
          productId,
          name: typeof row.name === 'string' ? row.name : `Product ${productId}`,
          price: Number(row.price ?? 0),
          priceMember: Number(row.priceMember ?? 0) || undefined,
          priceDp: Number(row.priceDp ?? 0) || undefined,
          priceSrp: Number(row.priceSrp ?? 0) || undefined,
          originalPrice: Number(row.originalPrice ?? 0) || undefined,
          sku: typeof row.sku === 'string' ? row.sku : undefined,
          prodpv: Number(row.prodpv ?? 0) || undefined,
          image: typeof row.image === 'string' && row.image.trim().length > 0 ? row.image : '/Images/af_home_logo.png',
          slug: typeof row.slug === 'string' && row.slug.trim().length > 0 ? row.slug : toSlug(typeof row.name === 'string' ? row.name : `product-${productId}`),
          brand: typeof row.brand === 'string' ? row.brand : null,
        } satisfies GuestWishlistItem
      })
      .filter((item): item is GuestWishlistItem => Boolean(item))

    // Backward compatibility: if old ID-only storage exists, keep heart state.
    if (normalized.length > 0) return normalized
    const oldRaw = window.localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY)
    const oldParsed = oldRaw ? JSON.parse(oldRaw) : []
    if (!Array.isArray(oldParsed)) return []
    return oldParsed
      .map((entry) => Number(entry))
      .filter((entry) => Number.isInteger(entry) && entry > 0)
      .map((productId) => ({
        productId,
        name: `Product ${productId}`,
        price: 0,
        image: '/Images/af_home_logo.png',
        slug: `product-${productId}`,
        brand: null,
      }))
  } catch {
    return []
  }
}

interface Product {
  id: number
  name: string
  type?: number
  manualCheckoutEnabled?: boolean
  image?: string | null
  price?: number | null
  priceMember?: number | null
  priceDp?: number | null
  priceSrp?: number | null
  originalPrice?: number | null
  sku?: string | null
  prodpv?: number | null
  bestseller?: boolean
  soldCount?: number
  avgRating?: number
  variants?: ProductVariant[] | null
}

interface ProductVariant {
  id?: number
  sku?: string
  name?: string
  color?: string
  colorHex?: string
  size?: string
  style?: string
  priceSrp?: number
  priceDp?: number
  priceMember?: number
  prodpv?: number
  qty?: number
  status?: number
  images?: string[]
}

interface ItemCardProps {
  product: Product
  brandName: string
  hideDiscountBadge?: boolean
  forceRealPrice?: boolean
  allowGuestAddToCart?: boolean
  allowGuestWishlist?: boolean
}

export default function ItemCard({
  product,
  brandName,
  hideDiscountBadge = false,
  forceRealPrice = false,
  allowGuestAddToCart = false,
  allowGuestWishlist = false,
}: ItemCardProps) {
  const slug = toSlug(product.name)
  const pathname = usePathname()
  const router = useRouter()
  const href = buildStorefrontProductPath(product.name, product.id, pathname)
  const [imageError, setImageError] = useState(false)
  const { data: session, status } = useSession()
  const role = String(session?.user?.role ?? '').toLowerCase()
  const isLoggedIn = status === 'authenticated' && role === 'customer'
  // Logged-in customers should always use account-backed cart/wishlist so data survives refresh/navigation.
  const useAccountCart = isLoggedIn
  const useAccountWishlist = isLoggedIn
  const [addToCartApi, { isLoading: isAddingToCart }] = useAddToCartMutation()
  const [loadProductDetails, { isFetching: isFetchingProductDetails }] = useLazyGetPublicProductQuery()
  const { setIsOpen, addToCart: addToLocalCart } = useCart()
  const { refetch: refetchCart } = useGetCartQuery(undefined, { skip: !useAccountCart })
  const [shareModalOpen, setShareModalOpen] = useState(false)
  
  // Wishlist functionality
  const { data: wishlist = [] } = useGetWishlistQuery(undefined, { skip: !useAccountWishlist })
  const [addWishlist, { isLoading: isAddingToWishlist }] = useAddWishlistMutation()
  const [removeWishlist, { isLoading: isRemovingFromWishlist }] = useRemoveWishlistMutation()
  const [guestWishlistItems, setGuestWishlistItems] = useState<GuestWishlistItem[]>(() => readGuestWishlistItems())
  const [variantPickerOpen, setVariantPickerOpen] = useState(false)
  const [openCartAfterVariantPicker, setOpenCartAfterVariantPicker] = useState(false)
  const [loadedVariants, setLoadedVariants] = useState<ProductVariant[] | null>(null)
  const activeVariants = useMemo(
    () => (loadedVariants ?? product.variants ?? []).filter((variant) => (variant.status ?? 1) === 1),
    [loadedVariants, product.variants],
  )
  const hasVariants = activeVariants.length > 0
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const selectedVariant = activeVariants[selectedVariantIndex] ?? activeVariants[0]
  const selectedColor = selectedVariant?.color ?? ''
  const colorOptions = useMemo(() => {
    const map = new Map<string, string | undefined>()
    activeVariants.forEach((variant) => {
      const color = variant.color?.trim()
      if (!color) return
      map.set(color, variant.colorHex)
    })
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }))
  }, [activeVariants])
  const visibleVariants = useMemo(
    () => selectedColor ? activeVariants.filter((variant) => !variant.color || variant.color === selectedColor) : activeVariants,
    [activeVariants, selectedColor],
  )

  useEffect(() => {
    setSelectedVariantIndex(0)
    setLoadedVariants(null)
  }, [product.id])

  useEffect(() => {
    if (useAccountWishlist || !allowGuestWishlist || typeof window === 'undefined') return

    const syncGuestWishlist = () => {
      setGuestWishlistItems(readGuestWishlistItems())
    }

    window.addEventListener('synergy:guest-wishlist-updated', syncGuestWishlist)
    window.addEventListener('storage', syncGuestWishlist)
    return () => {
      window.removeEventListener('synergy:guest-wishlist-updated', syncGuestWishlist)
      window.removeEventListener('storage', syncGuestWishlist)
    }
  }, [allowGuestWishlist, useAccountWishlist])

  const isInWishlist = useAccountWishlist
    ? wishlist.some(item => item.productId === product.id)
    : guestWishlistItems.some((item) => item.productId === product.id)

  const addSelectedItemToCart = async (variant?: ProductVariant) => {
    const shouldWaitForPickerExit = variantPickerOpen

    if (!useAccountCart) {
      if (allowGuestAddToCart) {
        const variantLabel = [variant?.name, variant?.style, variant?.size, variant?.color].filter(Boolean).join(' - ')
        const variantPrice = getVariantDisplayPrice(variant)
        addToLocalCart({
          id: variant?.sku ? `${product.id}::${variant.sku}` : String(product.id),
          productId: product.id,
          variantId: variant?.id,
          name: variantLabel ? `${product.name} (${variantLabel})` : product.name,
          price: variantPrice.display,
          originalPrice: variantPrice.strike > variantPrice.display ? variantPrice.strike : null,
          image: variant?.images?.[0] ?? product.image ?? '',
          prodpv: variantPrice.pv > 0 ? variantPrice.pv : null,
          brand: brandName || null,
          manualCheckoutEnabled: Boolean(product.manualCheckoutEnabled),
          selectedColor: variant?.color ?? null,
          selectedStyle: variant?.style ?? null,
          selectedSize: variant?.size ?? null,
          selectedType: variant?.name ?? null,
          selectedSku: variant?.sku ?? null,
        })
        toast.success('Item added to cart successfully')
        if (shouldWaitForPickerExit) {
          setOpenCartAfterVariantPicker(true)
          setVariantPickerOpen(false)
        } else {
          setIsOpen(true)
        }
        return
      }
      router.push(`/login?callback=${encodeURIComponent(pathname || href)}`)
      return
    }

    try {
      await addToCartApi({
        product_id: product.id,
        variant_id: variant?.id,
        quantity: 1,
        selected_color: variant?.color,
        selected_size: variant?.size,
        selected_type: variant?.name || variant?.style,
      }).unwrap()
      toast.success('Item added to cart successfully')
      if (shouldWaitForPickerExit) {
        setOpenCartAfterVariantPicker(true)
        setVariantPickerOpen(false)
      } else {
        setIsOpen(true)
      }
      // Refetch cart to sync with backend
      refetchCart()
    } catch (error: any) {
      if (allowGuestAddToCart) {
        const variantLabel = [variant?.name, variant?.style, variant?.size, variant?.color].filter(Boolean).join(' - ')
        const variantPrice = getVariantDisplayPrice(variant)
        addToLocalCart({
          id: variant?.sku ? `${product.id}::${variant.sku}` : String(product.id),
          productId: product.id,
          variantId: variant?.id,
          name: variantLabel ? `${product.name} (${variantLabel})` : product.name,
          price: variantPrice.display,
          originalPrice: variantPrice.strike > variantPrice.display ? variantPrice.strike : null,
          image: variant?.images?.[0] ?? product.image ?? '',
          prodpv: variantPrice.pv > 0 ? variantPrice.pv : null,
          brand: brandName || null,
          manualCheckoutEnabled: Boolean(product.manualCheckoutEnabled),
          selectedColor: variant?.color ?? null,
          selectedStyle: variant?.style ?? null,
          selectedSize: variant?.size ?? null,
          selectedType: variant?.name ?? null,
          selectedSku: variant?.sku ?? null,
        })
        toast.success('Item added to cart successfully')
        if (shouldWaitForPickerExit) {
          setOpenCartAfterVariantPicker(true)
          setVariantPickerOpen(false)
        } else {
          setIsOpen(true)
        }
        return
      }

      const errorMessage = error?.data?.message || error?.message || 'Failed to add item to cart'
      toast.error(errorMessage)
    }
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (hasVariants) {
      setVariantPickerOpen(true)
      return
    }

    if (loadedVariants === null) {
      try {
        const productDetails = await loadProductDetails(product.id).unwrap()
        const fetchedVariants = (productDetails.variants ?? []).filter((variant) => (variant.status ?? 1) === 1)
        setLoadedVariants(fetchedVariants)

        if (fetchedVariants.length > 0) {
          setSelectedVariantIndex(0)
          setVariantPickerOpen(true)
          return
        }
      } catch {
        toast.error('Unable to load product options. Please open the product page to choose a variant.')
        return
      }
    }

    await addSelectedItemToCart()
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShareModalOpen(true)
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!useAccountWishlist) {
      if (allowGuestWishlist && typeof window !== 'undefined') {
        const currentItems = readGuestWishlistItems()
        const currentlyInWishlist = currentItems.some((item) => item.productId === product.id)
        const nextItems = currentlyInWishlist
          ? currentItems.filter((item) => item.productId !== product.id)
          : [
              ...currentItems,
              {
                productId: product.id,
                name: product.name,
                price: Number(product.price ?? 0),
                priceMember: product.priceMember ? Number(product.priceMember) : undefined,
                priceDp: product.priceDp ? Number(product.priceDp) : undefined,
                priceSrp: product.priceSrp ? Number(product.priceSrp) : undefined,
                originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
                sku: product.sku ?? undefined,
                prodpv: product.prodpv ? Number(product.prodpv) : undefined,
                image: product.image ?? '/Images/af_home_logo.png',
                slug,
                brand: brandName || null,
              },
            ]
        const deduped = Array.from(
          nextItems.reduce((map, item) => {
            map.set(item.productId, item)
            return map
          }, new Map<number, GuestWishlistItem>()).values(),
        )
        setGuestWishlistItems(deduped)
        window.localStorage.setItem(GUEST_WISHLIST_ITEMS_STORAGE_KEY, JSON.stringify(deduped))
        window.localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(deduped.map((item) => item.productId)))
        window.dispatchEvent(new CustomEvent('synergy:guest-wishlist-updated'))
        toast.success(currentlyInWishlist ? 'Removed from wishlist' : 'Added to wishlist')
        return
      }
      toast.error('Please sign in to add items to wishlist')
      return
    }

    try {
      if (isInWishlist) {
        await removeWishlist(product.id).unwrap()
        toast.success('Removed from wishlist')
      } else {
        await addWishlist({ 
          product_id: product.id,
          product_name: product.name 
        }).unwrap()
        toast.success('Added to wishlist')
      }
    } catch (error: any) {
      console.error('Wishlist error:', error)
      const errorMessage = error?.data?.message || error?.message || 'Failed to update wishlist'
      toast.error(errorMessage)
    }
  }

  const baseSrp = (product.originalPrice ? Number(product.originalPrice) : undefined) ?? (product.price ? Number(product.price) : undefined) ?? 0
  const srpPrice = (product.priceSrp ? Number(product.priceSrp) : undefined) ?? baseSrp
  const memberPrice = (product.priceMember ? Number(product.priceMember) : undefined) ?? (product.priceDp ? Number(product.priceDp) : undefined) ?? 0
  const hasMemberPrice = memberPrice > 0 && memberPrice < srpPrice
  const showMemberPrice = hasMemberPrice && !forceRealPrice
  const displayPrice = showMemberPrice ? memberPrice : srpPrice
  const strikePrice = showMemberPrice ? srpPrice : (product.originalPrice && product.originalPrice > srpPrice ? product.originalPrice : 0)
  const displayPv = Number(product.prodpv ?? 0)
  const getVariantDisplayPrice = (variant?: ProductVariant) => {
    const variantSrp = (variant?.priceSrp ? Number(variant.priceSrp) : undefined) ?? srpPrice
    const variantMember = (variant?.priceMember ? Number(variant.priceMember) : undefined) ?? memberPrice
    const variantHasMemberPrice = variantMember > 0 && variantMember < variantSrp
    const variantDisplay = variantHasMemberPrice && !forceRealPrice ? variantMember : variantSrp
    const variantStrike = variantHasMemberPrice && !forceRealPrice ? variantSrp : 0
    const variantPv = Number(variant?.prodpv ?? displayPv)
    return { display: variantDisplay, strike: variantStrike, pv: variantPv }
  }
  const averageRating = Math.max(0, Math.min(5, Number(product.avgRating ?? 0)))
  const hasRating = averageRating > 0
  const filledStars = Math.floor(averageRating)
  const soldCount = Number(product.soldCount ?? 0)

  return (
    <>
    <Link href={href} className="flex flex-col group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-sky-500 dark:hover:border-sky-400 transition-colors cursor-pointer">
      {/* Product Image */}
      <div className="relative aspect-square w-full bg-gray-100 dark:bg-gray-700 overflow-hidden border-b border-gray-200 dark:border-gray-700">
        {/* Action Icons */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
          <div className="relative">
            <button
            onClick={handleWishlist}
            disabled={isAddingToWishlist || isRemovingFromWishlist}
            className={`p-2 rounded-full backdrop-blur-md border shadow-lg transition-all duration-200 cursor-pointer hover:cursor-hand ${
              isInWishlist 
                ? 'bg-sky-500 border-sky-500 hover:bg-sky-600 hover:border-sky-600' 
                : 'bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-600 hover:bg-sky-500 hover:border-sky-500 dark:hover:bg-sky-500 dark:hover:border-sky-500'
            } ${isAddingToWishlist || isRemovingFromWishlist ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            {(isAddingToWishlist || isRemovingFromWishlist) ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill={isInWishlist ? "white" : "none"} 
                stroke={isInWishlist ? "white" : "currentColor"} 
                strokeWidth="2" 
                className={`transition-colors ${isInWishlist ? 'text-white' : 'text-gray-700 dark:text-gray-300 hover:text-white'}`}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            )}
          </button>
          </div>
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-600 shadow-lg hover:bg-sky-500 hover:border-sky-500 dark:hover:bg-sky-500 dark:hover:border-sky-500 transition-all duration-200 cursor-pointer hover:cursor-hand"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        </div>
        {product.image && !imageError ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-0 left-0 flex flex-col">
          {showMemberPrice && !hideDiscountBadge && (
            <div className="bg-sky-500 text-white text-xs font-bold px-2 py-1">
              {isLoggedIn ? `Enjoy ${Math.round(((srpPrice - memberPrice) / srpPrice) * 100)}% off` : `Register to get ${Math.round(((srpPrice - memberPrice) / srpPrice) * 100)}% discount`}
            </div>
          )}
          {product.bestseller && (
            <div className="bg-purple-500 text-white text-xs font-bold px-2 py-1">
              Bestseller
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart || isFetchingProductDetails}
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg transition-all duration-300 hover:bg-sky-600 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2 sm:text-sm sm:font-semibold sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 cursor-pointer hover:cursor-hand disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add to Cart"
          aria-label="Add to Cart"
        >
          {isAddingToCart || isFetchingProductDetails ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span className="hidden sm:inline">{isFetchingProductDetails ? 'Loading...' : 'Adding...'}</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="hidden sm:inline">Add to Cart</span>
            </>
          )}
        </button>
      </div>

      {/* Product Info */}
      <div className="mt-1 flex flex-col gap-1 px-2.5 sm:px-3 py-2.5 sm:py-3">
        {/* Brand Name */}
        {brandName && (
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
            {brandName}
          </p>
        )}
        {/* Product Name */}
        <h3 className="line-clamp-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-snug min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-2">
          <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-sky-500 dark:text-sky-400">
              {'\u20b1'}{displayPrice.toLocaleString()}
            </span>
            {strikePrice > displayPrice && (
              <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 line-through">
                {'\u20b1'}{strikePrice.toLocaleString()}
              </span>
            )}
          </div>
          {displayPv > 0 && (
            <span className="rounded-full border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 px-1 sm:px-2 py-0.5 text-[8px] sm:text-[11px] font-semibold text-blue-700 dark:text-blue-300 shrink-0 whitespace-nowrap w-fit">
              PV {displayPv.toLocaleString()}
            </span>
          )}
        </div>

        {/* Sales/Ratings */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                xmlns="http://www.w3.org/2000/svg"
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill={hasRating && star <= filledStars ? '#38bdf8' : 'none'}
                stroke={hasRating && star <= filledStars ? '#38bdf8' : '#d1d5db'}
                strokeWidth="2"
                className="sm:w-[10px] sm:h-[10px]"
              >
                <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {hasRating ? `${averageRating.toFixed(1)} · ` : ''}{(soldCount ?? 0)} sold
          </span>
        </div>
      </div>
    </Link>

    {/* Share Modal */}
    <ShareModal
      isOpen={shareModalOpen}
      onClose={() => setShareModalOpen(false)}
      product={product}
      brandName={brandName}
      shareUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}${href}`}
      forceRealPrice={forceRealPrice}
    />

    <AnimatePresence
      onExitComplete={() => {
        if (openCartAfterVariantPicker) {
          setOpenCartAfterVariantPicker(false)
          setIsOpen(true)
        }
      }}
    >
      {variantPickerOpen && (
      <motion.div
        key="variant-picker-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
        onClick={() => setVariantPickerOpen(false)}
      >
        <motion.div
          key="variant-picker-panel"
          initial={{ y: 36, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 52, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-sky-500">Select Variant</p>
              <h3 className="line-clamp-1 text-base font-bold text-gray-900 dark:text-white">{product.name}</h3>
            </div>
            <button
              type="button"
              onClick={() => setVariantPickerOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Close variant picker"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-4">
            {colorOptions.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Color{selectedColor ? `: ${selectedColor}` : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => {
                    const firstIndex = activeVariants.findIndex((variant) => variant.color === color.name)
                    const isActive = selectedColor === color.name
                    return (
                      <button
                        key={color.name}
                        type="button"
                        title={color.name}
                        onClick={() => setSelectedVariantIndex(Math.max(0, firstIndex))}
                        className={`h-10 w-10 rounded-full border-2 transition hover:scale-105 ${
                          isActive ? 'ring-4 ring-sky-400' : 'ring-2 ring-transparent'
                        }`}
                        style={{ backgroundColor: color.hex ?? '#E5E7EB', borderColor: '#D1D5DB' }}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                {visibleVariants.some((variant) => variant.size?.trim()) ? 'Size' : 'Variant'}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {visibleVariants.map((variant) => {
                  const realIndex = activeVariants.findIndex((entry) => entry === variant)
                  const isActive = activeVariants[selectedVariantIndex] === variant
                  const variantPrice = getVariantDisplayPrice(variant)
                  const label = variant.size?.trim() || variant.name?.trim() || variant.style?.trim() || variant.sku?.trim() || 'Option'
                  const meta = [variant.name, variant.style, variant.color, variant.sku].filter(Boolean).join(' - ')
                  return (
                    <button
                      key={`${variant.id ?? variant.sku ?? realIndex}-${realIndex}`}
                      type="button"
                      onClick={() => setSelectedVariantIndex(Math.max(0, realIndex))}
                      className={`rounded-lg border-2 p-2 text-left transition ${
                        isActive
                          ? 'border-sky-400 text-sky-600'
                          : 'border-gray-200 text-gray-700 hover:border-sky-200 dark:border-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex gap-2">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50 dark:border-gray-700">
                          <Image
                            src={variant.images?.[0] || product.image || '/Images/af_home_logo.png'}
                            alt={label}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold">{label}</p>
                            {isActive && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600">Selected</span>}
                          </div>
                          {meta && <p className="mt-0.5 truncate text-[11px] text-gray-400">{meta}</p>}
                          <p className="mt-1 text-xs font-bold text-sky-500">{'\u20b1'}{variantPrice.display.toLocaleString()}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setVariantPickerOpen(false)}
              className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => addSelectedItemToCart(selectedVariant)}
              disabled={isAddingToCart || !selectedVariant}
              className="flex-[1.5] rounded-full bg-sky-500 px-4 py-2 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-50"
            >
              {isAddingToCart ? 'Adding...' : 'Add Selected to Cart'}
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  </>
  )
}
