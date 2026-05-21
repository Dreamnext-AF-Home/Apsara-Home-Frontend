'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useGetPublicProductBrandsQuery } from '@/store/api/productBrandsApi'
import { useGetPublicProductsQuery, useGetProductBrandQuery, useGetPublicZqProductsQuery, type ZqCachedProduct } from '@/store/api/productsApi'
import { useAddToCartMutation } from '@/store/api/cartApi'
import { useGetCategoriesQuery } from '@/store/api/categoriesApi'
import { Skeleton } from '@heroui/react/skeleton'
import OutlineButton from '@/components/ui/buttons/OutlineButton'
import PrimaryButton from '@/components/ui/buttons/PrimaryButton'
import Footer from '@/components/landing-page/Footer'
import ScrollToTop from '@/components/landing-page/ScrollToTop'
import ItemCard from '@/components/item/ItemCard'
import ProductFilter, { FilterState } from '@/components/item/ProductFilter'
import TopFilter from '@/components/item/TopFilter'
import ShareModal from '@/components/ui/ShareModal'
import toast from 'react-hot-toast'

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
const formatPeso = (value: number) => `P${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
const getBrandInitials = (value: string) => value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'BR'
const isGlobalSupplierBrandName = (value: string) => {
  const normalized = toSlug(value)
  return normalized === 'af-home-global-brand' || normalized === 'af-home-global-supplier' || normalized.includes('global')
}

const zqPrice = (product: ZqCachedProduct) => Number(product.priceMinCents ?? product.priceMaxCents ?? 0) / 100
const zqComparePrice = (product: ZqCachedProduct) => Number(product.priceMaxCents ?? product.priceMinCents ?? 0) / 100

const renderAdBlock = () => (
  <div className="mt-4 rounded-2xl overflow-hidden aspect-square border border-slate-100 bg-slate-50">
    <video
      className="h-full w-full object-cover"
      src="/loginpageVideo/afhome.mp4"
      autoPlay
      muted
      loop
      playsInline
    />
  </div>
)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ZqBrandProductCard({ product, brandName }: { product: ZqCachedProduct; brandName: string }) {
  const price = zqPrice(product)
  const comparePrice = zqComparePrice(product)
  const image = product.primaryImage || product.images?.[0] || '/Images/af_home_logo.png'

  return (
    <Link
      href={`/global-product/${product.id}`}
      className="group relative flex min-h-[360px] flex-col overflow-hidden rounded-lg border border-sky-100 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="absolute left-0 top-0 z-10 rounded-br-sm bg-sky-500 px-2 py-1 text-[10px] font-bold text-white">
        Register to get 6% discount
      </div>
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 shadow-md ring-1 ring-gray-100 transition group-hover:text-sky-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 shadow-md ring-1 ring-gray-100 transition group-hover:text-sky-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </span>
      </div>
      <div className="relative flex aspect-square items-center justify-center bg-white p-5">
        <Image src={image} alt={product.subject} fill className="object-contain p-5 transition duration-300 group-hover:scale-105" unoptimized />
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 translate-y-4 items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-sm font-bold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          View Product
        </div>
      </div>
      <div className="flex flex-1 flex-col border-t border-gray-100 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{brandName}</p>
        <h3 className="mt-1 line-clamp-2 min-h-[40px] text-sm font-semibold uppercase leading-snug text-slate-800 dark:text-gray-100">
          {product.subject}
        </h3>
        <div className="mt-auto flex flex-wrap items-end gap-2 pt-3">
          <span className="text-lg font-black text-sky-500">{formatPeso(price)}</span>
          {comparePrice > price ? <span className="text-sm text-gray-400 line-through">{formatPeso(comparePrice)}</span> : null}
          <span className="ml-auto rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-600">PV 0</span>
        </div>
        <p className="mt-1 text-xs text-gray-400">Stock {product.totalStock.toLocaleString()} · Global Supplier</p>
      </div>
    </Link>
  )
}

function ZqBrandItemCard({ product, brandName }: { product: ZqCachedProduct; brandName: string }) {
  const price = zqPrice(product)
  const comparePrice = zqComparePrice(product)
  const image = product.primaryImage || product.images?.[0] || '/Images/af_home_logo.png'
  const discount = comparePrice > price ? Math.max(1, Math.round(((comparePrice - price) / comparePrice) * 100)) : 6

  return (
    <Link href={`/global-product/${product.id}`} className="flex flex-col group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-sky-500 dark:hover:border-sky-400 transition-colors cursor-pointer">
      <div className="relative aspect-square w-full bg-gray-100 dark:bg-gray-700 overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
          <button
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              toast.success('Added to wishlist')
            }}
            className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-600 shadow-lg hover:bg-sky-500 hover:border-sky-500 dark:hover:bg-sky-500 dark:hover:border-sky-500 transition-all duration-200 cursor-pointer hover:cursor-hand"
            title="Add to Wishlist"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              const productUrl = `${window.location.origin}/global-product/${product.id}`
              navigator.clipboard.writeText(productUrl).then(() => {
                toast.success('Link copied to clipboard')
              }).catch(() => {
                toast.error('Failed to copy link')
              })
            }}
            className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-600 shadow-lg hover:bg-sky-500 hover:border-sky-500 dark:hover:bg-sky-500 dark:hover:border-sky-500 transition-all duration-200 cursor-pointer hover:cursor-hand"
            title="Share"
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

        <Image src={image} alt={product.subject} fill className="object-cover" unoptimized />

        <div className="absolute top-0 left-0 flex flex-col">
          <div className="bg-sky-500 text-white text-xs font-bold px-2 py-1">
            Register to get {discount}% discount
          </div>
        </div>

        <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg transition-all duration-300 hover:bg-sky-600 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2 sm:text-sm sm:font-semibold sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span className="hidden sm:inline">View Product</span>
        </div>
      </div>

      <div className="mt-1 flex flex-col gap-1 px-2.5 sm:px-3 py-2.5 sm:py-3">
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
          {brandName}
        </p>
        <h3 className="line-clamp-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-snug min-h-[2.5rem]">
          {product.subject}
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-2">
          <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-sky-500 dark:text-sky-400">
              {formatPeso(price)}
            </span>
            {comparePrice > price && (
              <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 line-through">
                {formatPeso(comparePrice)}
              </span>
            )}
          </div>
          <span className="rounded-full border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 px-1 sm:px-2 py-0.5 text-[8px] sm:text-[11px] font-semibold text-blue-700 dark:text-blue-300 shrink-0 whitespace-nowrap w-fit">
            PV 0
          </span>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                xmlns="http://www.w3.org/2000/svg"
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="2"
                className="sm:w-[10px] sm:h-[10px]"
              >
                <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">0 sold</span>
        </div>
      </div>
    </Link>
  )
}

const GRADIENT_PALETTES = [
  'from-sky-400 to-rose-400',
  'from-violet-400 to-purple-500',
  'from-sky-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-sky-500',
  'from-pink-400 to-rose-500',
  'from-indigo-400 to-violet-500',
  'from-cyan-400 to-sky-500',
]

const getBrandGradient = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return GRADIENT_PALETTES[Math.abs(hash) % GRADIENT_PALETTES.length]
}

const highlightText = (text: string, query: string) => {
  if (!query.trim()) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) => 
    regex.test(part) ? (
      <span key={i} className="bg-yellow-200">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

function BrandCardSkeleton() {
  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
      <Skeleton className="mt-3 h-4 w-3/4 rounded" />
    </div>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Image skeleton */}
      <Skeleton className="aspect-square w-full" />

      {/* Content skeleton */}
      <div className="space-y-3 p-4">
        {/* Product name */}
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />

        {/* Price */}
        <div className="flex gap-2 items-center">
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>

        {/* PV and Rating */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
      </div>
    </div>
  )
}

function ProductListSkeleton() {
  return (
    <div className="flex gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden p-4">
      {/* Image skeleton */}
      <Skeleton className="aspect-square w-32 rounded-lg shrink-0" />

      {/* Content skeleton */}
      <div className="flex-1 space-y-3 py-2">
        {/* Product name */}
        <Skeleton className="h-5 w-3/4 rounded" />

        {/* Price */}
        <div className="flex gap-3 items-center">
          <Skeleton className="h-6 w-28 rounded" />
          <Skeleton className="h-5 w-24 rounded" />
        </div>

        {/* PV and Rating */}
        <div className="flex gap-3">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
      </div>
    </div>
  )
}

function TopFilterSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      {/* Search bar skeleton */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Controls row skeleton */}
      <div className="flex flex-wrap gap-3 justify-end">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
    </div>
  )
}

function ProductFilterSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter section 1 */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32 rounded" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full rounded" />
          ))}
        </div>
      </div>

      {/* Filter section 2 */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32 rounded" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full rounded" />
          ))}
        </div>
      </div>

      {/* Filter section 3 */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32 rounded" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}

function BrandProfileSkeleton() {
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Image skeleton */}
        <Skeleton className="h-28 w-28 sm:h-32 sm:w-32 rounded-lg shrink-0 self-center sm:self-auto" />

        {/* Content skeleton */}
        <div className="flex-1 space-y-4">
          {/* Title */}
          <Skeleton className="h-8 w-48 rounded" />

          {/* Description */}
          <Skeleton className="h-4 w-full rounded" />

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Back button skeleton */}
        <Skeleton className="h-10 w-20 rounded-lg shrink-0 self-center sm:self-auto" />
      </div>
    </div>
  )
}

function FeaturedProductsSkeleton() {
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <Skeleton className="h-4 w-24 rounded mb-2" />
        <Skeleton className="h-6 w-40 rounded" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

function PageHeaderSkeleton() {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="mt-4">
          <Skeleton className="h-4 w-32 rounded mb-3" />
          <Skeleton className="h-10 w-64 rounded mb-4" />
          <Skeleton className="h-5 w-full max-w-2xl rounded" />
        </div>
      </div>
    </div>
  )
}

export default function ByBrandPageMain() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const brandParam = searchParams.get('brand')
  const letterFilterParam = searchParams.get('letter')
  const sortByParam = searchParams.get('sort')
  const [currentSlide, setCurrentSlide] = useState(0)
  const selectedBrand = decodeURIComponent(searchParams.get('brand') || '').trim().toLowerCase()
  const [letterFilter, setLetterFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'default'>('default')
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 10000],
    sortBy: 'default',
    inStock: false,
    discountOnly: false,
    minDiscount: 0,
    pvRange: [0, 5000],
    search: '',
    hasPvOnly: false
  })
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid')
  const [showNumber, setShowNumber] = useState<number | 'all'>(12)
  const { data: session } = useSession()
  const isLoggedIn = Boolean(session?.user)
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation()
  const [hoveringShareProductId, setHoveringShareProductId] = useState<number | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const productsRef = useRef<HTMLDivElement>(null)

  // Handlers for TopFilters
  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort as 'name-asc' | 'name-desc' | 'default')
  }

  const handlePvRangeChange = (pvRange: [number, number]) => {
    setFilters(prev => ({ ...prev, pvRange }))
  }

  // Show number change handler for TopFilter component
  const handleShowNumberChange = (showNumber: number | 'all') => {
    setShowNumber(showNumber)
    setProductPage(1)
  }

  const handleAddToCart = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isLoggedIn) {
      const callbackPath = typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : pathname || '/by-brand'
      router.push(`/login?callback=${encodeURIComponent(callbackPath)}`)
      return
    }

    try {
      await addToCart({
        product_id: productId,
        quantity: 1,
      }).unwrap()
      toast.success('Item added to cart successfully')
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add item to cart')
    }
  }

  const { data, isFetching } = useGetPublicProductBrandsQuery()
  const { data: categoriesData } = useGetCategoriesQuery({ page: 1, per_page: 100, used_only: true })

  const allBrands = useMemo(
    () => (data?.brands ?? []).filter((brand) => brand.name && brand.name.trim().length > 0),
    [data?.brands],
  )

  const availableLetters = useMemo(() => {
    const letters = new Set(allBrands.map((b) => b.name.charAt(0).toUpperCase()))
    return ['ALL', ...Array.from(letters).sort()]
  }, [allBrands])

  const brands = useMemo(() => {
    let rows = allBrands
    if (selectedBrand) rows = rows.filter((brand) => toSlug(brand.name) === selectedBrand)
    else {
      if (searchQuery.trim()) rows = rows.filter((b) => b.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
      else if (letterFilter !== 'ALL') rows = rows.filter((b) => b.name.charAt(0).toUpperCase() === letterFilter)

      // Apply sorting
      if (sortBy === 'name-asc') {
        rows = [...rows].sort((a, b) => a.name.localeCompare(b.name))
      } else if (sortBy === 'name-desc') {
        rows = [...rows].sort((a, b) => b.name.localeCompare(a.name))
      }
    }
    return rows
  }, [allBrands, selectedBrand, letterFilter, searchQuery, sortBy])

  const [productPage, setProductPage] = useState(1)
  const perPage = showNumber === 'all' ? 500 : (typeof showNumber === 'number' ? showNumber : 12)

  const selectedBrandItem = useMemo(() => {
    if (!selectedBrand) return null
    const found = allBrands.find((brand) => {
      const slugged = toSlug(brand.name)
      return slugged === selectedBrand
    })
    return found ?? null
  }, [allBrands, selectedBrand])
  const isGlobalSupplierBrand = selectedBrandItem ? isGlobalSupplierBrandName(selectedBrandItem.name) : false

  // Reset to page 1 when brand changes or filters change
  const prevBrand = useRef(selectedBrand)
  const prevFilters = useRef(filters)

  useEffect(() => {
    if (prevBrand.current !== selectedBrand) {
      prevBrand.current = selectedBrand
      setProductPage(1)
    }
    if (JSON.stringify(prevFilters.current) !== JSON.stringify(filters)) {
      prevFilters.current = filters
      setProductPage(1)
    }
  }, [selectedBrand, filters])

  // Auto-scroll to products section when brand changes
  useEffect(() => {
    if (selectedBrand && productsRef.current) {
      setTimeout(() => {
        productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [selectedBrand])

  // Fetch detailed brand info including rating
  const { data: brandInfo } = useGetProductBrandQuery(selectedBrandItem?.id ?? 0, {
    skip: !selectedBrandItem,
  })

  const { data: brandProductsData, isFetching: isFetchingProducts } = useGetPublicProductsQuery(
    selectedBrandItem
      ? { page: productPage, perPage: perPage, status: '1', brandType: selectedBrandItem.id }
      : undefined,
    { skip: !selectedBrandItem },
  )
  const { data: zqProductsData, isFetching: isFetchingZqProducts } = useGetPublicZqProductsQuery(
    selectedBrandItem && isGlobalSupplierBrand
      ? { page: productPage, perPage: perPage, search: filters.search || undefined }
      : undefined,
    { skip: !selectedBrandItem || !isGlobalSupplierBrand },
  )
  const rawBrandProducts = useMemo(() => brandProductsData?.products ?? [], [brandProductsData?.products])
  const productsMeta = brandProductsData?.meta
  const zqRawBrandProducts = useMemo(() => zqProductsData?.products ?? [], [zqProductsData?.products])
  const zqProductsMeta = zqProductsData?.meta
  const totalPages = Math.max(productsMeta?.last_page ?? 1, zqProductsMeta?.last_page ?? 1)

  // Filter products based on selected filters
  const brandProducts = useMemo(() => {
    let filtered = rawBrandProducts

    // Filter by price range
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) {
      filtered = filtered.filter(product => {
        const price = product.priceSrp ?? product.priceDp ?? 0
        return price >= filters.priceRange[0] && price <= filters.priceRange[1]
      })
    }

    // Filter by PV range
    if (filters.pvRange[0] > 0 || filters.pvRange[1] < 5000) {
      filtered = filtered.filter(product => {
        const pv = Number(product.prodpv ?? 0)
        return pv >= filters.pvRange[0] && pv <= filters.pvRange[1]
      })
    }

    // Filter by has PV only
    if (filters.hasPvOnly) {
      filtered = filtered.filter(product => {
        const pv = Number(product.prodpv ?? 0)
        return pv > 0
      })
    }

    // Filter by stock
    if (filters.inStock) {
      filtered = filtered.filter(product => (product.qty ?? 0) > 0)
    }

    // Filter by discount
    if (filters.discountOnly) {
      filtered = filtered.filter(product => {
        const srpPrice = Number(product.priceSrp ?? product.priceDp ?? 0)
        const memberPrice = Number(product.priceMember ?? product.priceDp ?? 0)
        const hasDiscount = memberPrice > 0 && memberPrice < srpPrice

        // If minDiscount is set, check if discount percentage meets minimum
        if (filters.minDiscount > 0 && hasDiscount) {
          const discountPercentage = Math.round(((srpPrice - memberPrice) / srpPrice) * 100)
          return discountPercentage >= filters.minDiscount
        }

        return hasDiscount
      })
    }

    // Filter by search term
    if (filters.search.trim().length > 0) {
      const searchTerm = filters.search.toLowerCase().trim()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm)
      )
    }

    // Sort by name and price - prioritize filters.sortBy from ProductFilter, fall back to top-level sortBy
    // Map ProductFilter 'asc'/'desc' to 'name-asc'/'name-desc'
    const sortBySource = filters.sortBy !== 'default' ? filters.sortBy : sortBy;
    const effectiveSortBy = sortBySource === 'asc' ? 'name-asc' : sortBySource === 'desc' ? 'name-desc' : sortBySource;

    if (effectiveSortBy === 'name-asc') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    } else if (effectiveSortBy === 'name-desc') {
      filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name))
    } else if (effectiveSortBy === 'price-asc') {
      filtered = [...filtered].sort((a, b) => {
        const priceA = Number(a.priceSrp ?? a.priceDp ?? 0)
        const priceB = Number(b.priceSrp ?? b.priceDp ?? 0)
        return priceA - priceB
      })
    } else if (effectiveSortBy === 'price-desc') {
      filtered = [...filtered].sort((a, b) => {
        const priceA = Number(a.priceSrp ?? a.priceDp ?? 0)
        const priceB = Number(b.priceSrp ?? b.priceDp ?? 0)
        return priceB - priceA
      })
    }

    return filtered
  }, [rawBrandProducts, filters, sortBy])

  const zqBrandProducts = useMemo(() => {
    let filtered = zqRawBrandProducts

    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) {
      filtered = filtered.filter(product => {
        const price = zqPrice(product)
        return price >= filters.priceRange[0] && price <= filters.priceRange[1]
      })
    }

    if (filters.inStock) {
      filtered = filtered.filter(product => product.totalStock > 0)
    }

    if (filters.search.trim().length > 0) {
      const searchTerm = filters.search.toLowerCase().trim()
      filtered = filtered.filter(product =>
        product.subject.toLowerCase().includes(searchTerm)
        || (product.categoryName ?? '').toLowerCase().includes(searchTerm)
      )
    }

    const sortBySource = filters.sortBy !== 'default' ? filters.sortBy : sortBy
    const effectiveSortBy = sortBySource === 'asc' ? 'name-asc' : sortBySource === 'desc' ? 'name-desc' : sortBySource

    if (effectiveSortBy === 'name-asc') {
      filtered = [...filtered].sort((a, b) => a.subject.localeCompare(b.subject))
    } else if (effectiveSortBy === 'name-desc') {
      filtered = [...filtered].sort((a, b) => b.subject.localeCompare(a.subject))
    } else if (effectiveSortBy === 'price-asc') {
      filtered = [...filtered].sort((a, b) => zqPrice(a) - zqPrice(b))
    } else if (effectiveSortBy === 'price-desc') {
      filtered = [...filtered].sort((a, b) => zqPrice(b) - zqPrice(a))
    }

    return filtered
  }, [zqRawBrandProducts, filters, sortBy])

  const productDisplayCount = brandProducts.length + zqBrandProducts.length
  const productTotalCount = (productsMeta?.total ?? brandProducts.length) + (zqProductsMeta?.total ?? 0)
  const isFetchingBrandProducts = isFetchingProducts || (isGlobalSupplierBrand && isFetchingZqProducts)

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) count++
    if (filters.pvRange[0] > 0 || filters.pvRange[1] < 5000) count++
    if (filters.inStock) count++
    if (filters.discountOnly) count++
    if (filters.hasPvOnly) count++
    return count
  }, [filters])

  return (
    <>
      <div
        className="fixed inset-0 -z-50 by-brand-background"
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          .by-brand-background {
            background: #ffffff;
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100vh;
            z-index: -50;
          }

          html.dark .by-brand-background {
            background: #030712 !important;
          }
        `
      }} />
      <main className="relative min-h-screen text-slate-900 dark:text-white">
      {/* Page Header */}
      {isFetching ? (
        <PageHeaderSkeleton />
      ) : (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4 py-6">
            <div className="mt-4">
              {selectedBrandItem && (
                <button
                  onClick={() => router.back()}
                  className="sm:hidden mb-3 flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back
                </button>
              )}
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-sky-500 dark:text-sky-400">Shop by Brand</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                {selectedBrand && selectedBrandItem ? selectedBrandItem.name : 'All Brands'}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Browse featured product brands from the catalog. Pick a brand below to continue exploring.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Brand Profile Card - only when brand selected */}
        {selectedBrandItem && isFetchingBrandProducts && (
          <BrandProfileSkeleton />
        )}

        {selectedBrandItem && !isFetchingBrandProducts && (
          <>
            <div className="rounded-lg bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700 relative">
              {/* Share button - mobile only (absolute), desktop version is beside Back button */}
              <button
                onClick={() => setShareModalOpen(true)}
                className="sm:hidden absolute top-4 right-4 p-2 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-sky-500 hover:border-sky-500 dark:hover:bg-sky-500 dark:hover:border-sky-500 hover:text-white transition-all duration-200 cursor-pointer"
                title="Share Brand"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                <div className={`relative flex h-28 w-28 sm:h-32 sm:w-32 shrink-0 self-center sm:self-auto items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600`}>
                  {selectedBrandItem.image ? (
                    <Image src={selectedBrandItem.image} alt={selectedBrandItem.name} fill className="object-contain p-2" unoptimized />
                  ) : (
                    <span className="text-3xl font-extrabold tracking-wider text-gray-400 dark:text-gray-500">
                      {getBrandInitials(selectedBrandItem.name)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedBrandItem.name}</h1>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        (selectedBrandItem.status ?? 0) === 0
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                        <span className={`inline-block w-2 h-2 rounded-full ${(selectedBrandItem.status ?? 0) === 0 ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {(selectedBrandItem.status ?? 0) === 0 ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                    Browse all products from this brand
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>Chat Performance: {brandInfo?.chatPerformance ?? 95}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                      <span>Overall Rating: {brandInfo?.overallRating ? brandInfo.overallRating.toFixed(1) : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      <span>Total Products: {productTotalCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>Joined: {brandInfo?.joinedDate ? new Date(brandInfo.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Jan 2024'}</span>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShareModalOpen(true)}
                    className="p-2 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-sky-500 hover:border-sky-500 dark:hover:bg-sky-500 dark:hover:border-sky-500 hover:text-white transition-all duration-200 cursor-pointer"
                    title="Share Brand"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                  <OutlineButton onClick={() => router.back()} className="shrink-0 !px-4 !py-2.5 !text-sm flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back
                  </OutlineButton>
                </div>
              </div>
            </div>

            {/* Promotional Banner */}
            {/* <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-sky-600 dark:to-sky-700">
              <div className="px-6 py-8">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-100">Special Offer</p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Get {selectedBrandItem.name} products at exclusive prices!
                </h2>
                <p className="mt-2 text-sm text-sky-100">
                  Limited time offer - Shop now and save up to 30%
                </p>
              </div>
            </div> */}
          </>
        )}

        {/* Search + Filters - only when no brand selected */}
        {!selectedBrand && (
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-6">
              {/* Search bar */}
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setLetterFilter('ALL') }}
                  placeholder="Search brands..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 py-3 pl-12 pr-12 text-base text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-sky-400 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-400/30 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                )}
              </div>

              {/* Filters row */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Letter filter - hidden when searching */}
                {!searchQuery && (
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400">Filter:</span>
                    {availableLetters.map((letter) => (
                      <button
                        key={letter}
                        onClick={() => setLetterFilter(letter)}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer transition-all ${
                          letterFilter === letter
                            ? 'bg-sky-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-sky-100 dark:hover:bg-sky-500/20 hover:text-sky-600 dark:hover:text-sky-400'
                        }`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                )}

                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name-asc' | 'name-desc' | 'default')}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 transition-all"
                  >
                    <option value="default">Default</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Brand Grid - only when no brand selected */}
        {!selectedBrand && (
          <>
            {isFetching ? (
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {Array.from({ length: 12 }).map((_, i) => <BrandCardSkeleton key={i} />)}
              </div>
            ) : brands.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg py-16 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">No brands found</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{brands.length}</span> brand{brands.length !== 1 ? 's' : ''}
                  {letterFilter !== 'ALL' && ` starting with "${letterFilter}"`}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {brands.map((brand) => {
                    const brandSlug = toSlug(brand.name)

                    return (
                      <Link
                        key={brand.id}
                        href={`/by-brand?brand=${encodeURIComponent(brandSlug)}`}
                        className="group flex flex-col items-center rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center hover:border-sky-500 dark:hover:border-sky-400 transition-colors"
                      >
                        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded">
                          {brand.image ? (
                            <Image src={brand.image} alt={brand.name} fill className="object-contain p-1" unoptimized />
                          ) : (
                            <span className="text-lg font-semibold text-gray-400 dark:text-gray-600">
                              {getBrandInitials(brand.name)}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                          {highlightText(brand.name, searchQuery)}
                        </h3>
                      </Link>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* Featured Products Section */}
        {selectedBrandItem && (
          <>
            {isFetchingProducts ? (
              <FeaturedProductsSkeleton />
            ) : (
              brandProducts.length > 0 && (
                <div className="rounded-lg bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700">
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-500 dark:text-sky-400">Featured</p>
                    <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Featured Products</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {brandProducts.slice(0, 4).map((product) => (
                      <ItemCard key={product.id} product={product} brandName={selectedBrandItem.name} />
                    ))}
                  </div>
                </div>
              )
            )}
          </>
        )}

        {/* Hero Banner */}
        {selectedBrandItem && !isFetchingProducts && brandProducts.length > 0 && (
          <div
            className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-64 md:h-80 bg-white dark:bg-gray-800"
            onTouchStart={(e) => { (e.currentTarget as HTMLDivElement).dataset.touchX = String(e.touches[0].clientX) }}
            onTouchEnd={(e) => {
              const startX = Number((e.currentTarget as HTMLDivElement).dataset.touchX ?? 0)
              const diff = startX - e.changedTouches[0].clientX
              if (Math.abs(diff) > 40) {
                const max = Math.min(4, brandProducts.length - 1)
                setCurrentSlide(prev => diff > 0 ? (prev === max ? 0 : prev + 1) : (prev === 0 ? max : prev - 1))
              }
            }}
          >
            {/* Subtle Pattern Background */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }} />

            {brandProducts.slice(0, 5).map((product, index) => (
              <div
                key={product.id}
                className="absolute inset-0"
                style={{
                  transform: `translateX(${(index - currentSlide) * 100}%)`,
                  transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gray-50 text-gray-400">
                    No Image
                  </div>
                )}
              </div>
            ))}

            {/* Left Content Overlay */}
            <div className="absolute left-0 top-0 bottom-0 w-28 sm:w-48 md:w-64 bg-gradient-to-r from-sky-500 to-sky-500/10 flex flex-col justify-center px-3 sm:px-6 z-10">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/90 hidden sm:block">Featured</p>
              <h2 className="mt-0 sm:mt-2 text-sm sm:text-xl font-bold text-white line-clamp-2">
                {selectedBrandItem.name}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-white/80 hidden sm:block">
                Premium quality products
              </p>
            </div>

            {/* Right Content Overlay */}
            <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-48 md:w-64 bg-gradient-to-l from-sky-400 to-sky-400/10 flex flex-col justify-center items-end px-3 sm:px-6 text-right z-10">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/90 hidden sm:block">Exclusive</p>
              <p className="mt-2 text-sm text-white/80 hidden sm:block">
                Limited Edition
              </p>
            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {brandProducts.slice(0, 5).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors border-2 cursor-pointer ${
                    currentSlide === index ? 'bg-sky-500 border-sky-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Arrows - desktop only, mobile uses dots */}
            <button
              onClick={() => setCurrentSlide((prev: number) => (prev === 0 ? Math.min(4, brandProducts.length - 1) : prev - 1))}
              className="hidden sm:flex absolute sm:left-48 md:left-64 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-full shadow-md transition-colors cursor-pointer z-20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentSlide((prev: number) => (prev === Math.min(4, brandProducts.length - 1) ? 0 : prev + 1))}
              className="hidden sm:flex absolute sm:right-48 md:right-64 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-full shadow-md transition-colors cursor-pointer z-20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

        {/* Brand Products Section */}
        {selectedBrandItem && (
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Left Sidebar - Filter (desktop only, mobile uses bottom drawer) */}
            <div className="hidden lg:block lg:w-72 shrink-0">
              {isFetchingBrandProducts ? (
                <ProductFilterSkeleton />
              ) : (
                <ProductFilter
                  onFilterChange={setFilters}
                  pvRange={filters.pvRange}
                  search={filters.search}
                  isBrandPage={true}
                  brands={allBrands}
                  currentBrand={selectedBrandItem?.name}
                />
              )}
              {renderAdBlock()}
            </div>

            {/* Right Side - Products */}
            <div ref={productsRef} className="flex-1 rounded-lg bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-gray-700 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-500 dark:text-sky-400">Brand Products</p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{selectedBrandItem.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-sky-50 dark:bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400 ring-1 ring-sky-200 dark:ring-sky-500/30">
                    {isFetchingBrandProducts ? 'Loading...' : `${productTotalCount} product${productTotalCount !== 1 ? 's' : ''}`}
                  </span>
                  {/* Mobile filter button */}
                  <button
                    onClick={() => setIsFilterDrawerOpen(true)}
                    className="lg:hidden relative inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-sky-400 hover:text-sky-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="4" y1="6" x2="20" y2="6" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                      <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" />
                    </svg>
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Top Filters */}
              <div className="mt-6">
                {isFetchingBrandProducts ? (
                  <TopFilterSkeleton />
                ) : (
                  <TopFilter
                    onSearchChange={handleSearchChange}
                    onViewTypeChange={setViewType}
                    onShowNumberChange={handleShowNumberChange}
                    onSortChange={handleSortChange}
                    searchValue={filters.search}
                    viewType={viewType}
                    showNumber={showNumber}
                    sortValue={sortBy}
                  />
                )}
                {!isFetchingBrandProducts && (
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mt-4">
                    <span>
                      Showing <span className="font-semibold text-slate-700 dark:text-gray-200">{productDisplayCount}</span> of{' '}
                      <span className="font-semibold text-slate-700 dark:text-gray-200">{productTotalCount}</span> products
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6">
                {isFetchingBrandProducts ? (
                  <div className={viewType === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6' : 'flex flex-col gap-4 pb-6'}>
                    {Array.from({ length: viewType === 'grid' ? 12 : 8 }).map((_, i) =>
                      viewType === 'grid' ? <ProductCardSkeleton key={i} /> : <ProductListSkeleton key={i} />
                    )}
                  </div>
                ) : (
                  <>
                    {productDisplayCount === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-2xl">ðŸ“¦</div>
                        <p className="mt-4 font-semibold text-gray-700 dark:text-gray-300">No products yet</p>
                        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">No products assigned to this brand yet.</p>
                      </div>
                    ) : (
                      <div className={viewType === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6' : 'flex flex-col gap-4 pb-6'}>
                        {brandProducts.map((product) => (
                          viewType === 'grid' ? (
                            <ItemCard key={product.id} product={product} brandName={selectedBrandItem.name} />
                          ) : (
                        <Link
                          key={product.id}
                          href={`/product/${toSlug(product.name)}-i${product.id}`}
                          className="flex gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-sky-500 dark:hover:border-sky-400 transition-colors group relative"
                        >
                          {/* Action Icons */}
                          <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                toast.success('Added to wishlist')
                              }}
                              className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-600 shadow-lg hover:bg-sky-500 hover:border-sky-500 dark:hover:bg-sky-500 dark:hover:border-sky-500 transition-all duration-200 cursor-pointer"
                              title="Add to Wishlist"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const productUrl = `${window.location.origin}/product/${toSlug(product.name)}-i${product.id}`
                                navigator.clipboard.writeText(productUrl).then(() => {
                                  toast.success('Link copied to clipboard')
                                }).catch(() => {
                                  toast.error('Failed to copy link')
                                })
                              }}
                              onMouseEnter={() => setHoveringShareProductId(product.id)}
                              onMouseLeave={() => setHoveringShareProductId(null)}
                              className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-600 shadow-lg hover:bg-sky-500 hover:border-sky-500 dark:hover:bg-sky-500 dark:hover:border-sky-500 transition-all duration-200 cursor-pointer"
                              title="Share"
                            >
                              {hoveringShareProductId === product.id ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300 hover:text-white transition-colors">
                                  <circle cx="18" cy="5" r="3" />
                                  <circle cx="6" cy="12" r="3" />
                                  <circle cx="18" cy="19" r="3" />
                                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                </svg>
                              )}
                            </button>
                          </div>
                          <div className="relative aspect-square w-32 bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0">
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                unoptimized
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
                          </div>
                          <div className="flex flex-col justify-center flex-1 p-4 relative">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">{product.name}</h3>
                            <div className="flex items-baseline gap-2 mb-2">
                              <span className="text-lg font-bold text-sky-500 dark:text-sky-400">
                                {'\u20b1'}{Number(product.priceSrp ?? product.priceDp ?? 0).toLocaleString()}
                              </span>
                              {product.priceMember && Number(product.priceMember) > 0 && Number(product.priceMember) < Number(product.priceSrp ?? product.priceDp ?? 0) && (
                                <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                                  {'\u20b1'}{Number(product.priceSrp ?? product.priceDp ?? 0).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {product.prodpv && Number(product.prodpv) > 0 && (
                                <span className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                                  PV {Number(product.prodpv).toLocaleString()}
                                </span>
                              )}
                            </div>
                            {/* Sales/Ratings */}
                            <div className="flex items-center gap-1 mt-1">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill={star <= 4 ? '#38bdf8' : 'none'}
                                    stroke={star <= 4 ? '#38bdf8' : '#d1d5db'}
                                    strokeWidth="2"
                                  >
                                    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-xs text-gray-400 dark:text-gray-500">{product.soldCount ?? 0} sold</span>
                            </div>
                            {/* Add to Cart Button */}
                            <button
                              onClick={(e) => handleAddToCart(product.id, e)}
                              disabled={isAddingToCart}
                              className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm transition-all duration-300 hover:bg-sky-600 sm:absolute sm:bottom-4 sm:right-4 sm:mt-0 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2 sm:text-sm sm:font-semibold sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Add to Cart"
                              aria-label="Add to Cart"
                            >
                              {isAddingToCart ? (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                  </svg>
                                  <span className="hidden sm:inline">Adding...</span>
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
                        </Link>
                      )
                    ))}
                    {zqBrandProducts.map((product) => (
                      viewType === 'grid' ? (
                        <ZqBrandItemCard key={`zq-${product.id}`} product={product} brandName={selectedBrandItem.name} />
                      ) : (
                        <Link
                          key={`zq-${product.id}`}
                          href={`/global-product/${product.id}`}
                          className="flex gap-4 overflow-hidden rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-sky-500 dark:border-gray-700 dark:bg-gray-800"
                        >
                          <div className="relative h-24 w-24 shrink-0 rounded-lg bg-white">
                            <Image src={product.primaryImage || product.images?.[0] || '/Images/af_home_logo.png'} alt={product.subject} fill className="object-contain p-2" unoptimized />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase text-gray-500">{selectedBrandItem.name}</p>
                            <h3 className="mt-1 line-clamp-2 font-semibold text-gray-900 dark:text-white">{product.subject}</h3>
                            <p className="mt-2 text-lg font-black text-sky-500">{formatPeso(zqPrice(product))}</p>
                            <p className="text-xs text-gray-400">Stock {product.totalStock.toLocaleString()} · Global Supplier</p>
                          </div>
                        </Link>
                      )
                    ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Pagination */}
              {!isFetchingBrandProducts && totalPages > 1 && (
                <div className="-mx-6 -mb-6 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-6 bg-white dark:bg-gray-800 px-6 pb-6">
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Page <span className="font-semibold text-gray-700 dark:text-gray-300">{productPage}</span> of <span className="font-semibold text-gray-700 dark:text-gray-300">{totalPages}</span>
                  </p>
                  <div className="flex items-center gap-1.5">
                    {/* Prev */}
                    <button
                      onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                      disabled={productPage === 1}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 transition hover:border-sky-300 dark:hover:border-sky-500 hover:text-sky-500 dark:hover:text-sky-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - productPage) <= 1)
                      .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis')
                        acc.push(p)
                        return acc
                      }, [])
                      .map((item, idx) =>
                        item === 'ellipsis' ? (
                          <span key={`e-${idx}`} className="flex h-9 w-9 items-center justify-center text-sm text-gray-400 dark:text-gray-500">...</span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setProductPage(item as number)}
                            className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                              productPage === item
                                ? 'bg-sky-500 text-white shadow-sm shadow-sky-200 dark:shadow-sky-900'
                                : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-sky-300 dark:hover:border-sky-500 hover:text-sky-500 dark:hover:text-sky-400'
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}

                    {/* Next */}
                    <button
                      onClick={() => setProductPage((p) => Math.min(totalPages, p + 1))}
                      disabled={productPage === totalPages}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 transition hover:border-sky-300 dark:hover:border-sky-500 hover:text-sky-500 dark:hover:text-sky-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* You May Also Like - only when brand selected */}
        {selectedBrandItem && (
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-500 dark:text-sky-400">You May Also Like</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Other Brands</h2>
            </div>
            {isFetching ? (
              <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 sm:overflow-x-visible sm:pb-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-36 shrink-0 sm:w-auto">
                    <BrandCardSkeleton />
                  </div>
                ))}
              </div>
            ) : allBrands.filter(b => b.id !== selectedBrandItem.id).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No other brands available</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 sm:overflow-x-visible sm:pb-0 -mx-6 px-6 sm:mx-0 sm:px-0">
                {allBrands
                  .filter(b => b.id !== selectedBrandItem.id)
                  .slice(0, 12)
                  .map((brand) => {
                    const brandSlug = toSlug(brand.name)

                    return (
                      <Link
                        key={brand.id}
                        href={`/by-brand?brand=${encodeURIComponent(brandSlug)}`}
                        className="group flex w-36 shrink-0 sm:w-auto flex-col items-center rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center hover:border-sky-500 dark:hover:border-sky-400 transition-colors"
                      >
                        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded">
                          {brand.image ? (
                            <Image src={brand.image} alt={brand.name} fill className="object-contain p-1" unoptimized />
                          ) : (
                            <span className="text-lg font-semibold text-gray-400 dark:text-gray-600">
                              {getBrandInitials(brand.name)}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 w-full truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                          {highlightText(brand.name, searchQuery)}
                        </h3>
                      </Link>
                    )
                  })}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Mobile Filter Bottom Drawer */}
      {selectedBrandItem && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${isFilterDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsFilterDrawerOpen(false)}
          />
          {/* Drawer */}
          <div
            className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden flex flex-col bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out max-h-[85vh] ${isFilterDrawerOpen ? 'translate-y-0' : 'translate-y-full'}`}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Filters</h3>
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {/* Scrollable filter content */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <ProductFilter
                onFilterChange={setFilters}
                pvRange={filters.pvRange}
                search={filters.search}
                isBrandPage={true}
                brands={allBrands}
                currentBrand={selectedBrandItem?.name}
              />
            </div>
            {/* Footer */}
            <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition-colors"
              >
                Show Results ({productDisplayCount})
              </button>
            </div>
          </div>
        </>
      )}
      <Footer />
      <ScrollToTop />
      {/* Share Modal */}
      {selectedBrandItem && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          product={{
            id: selectedBrandItem.id,
            name: selectedBrandItem.name,
            image: selectedBrandItem.image || '',
            price: 0,
          }}
          brandName={selectedBrandItem.name}
          shareUrl={`https://afhome.ph/by-brand?brand=${encodeURIComponent(toSlug(selectedBrandItem.name))}`}
        />
      )}
    </main>
    </>
  )
}
