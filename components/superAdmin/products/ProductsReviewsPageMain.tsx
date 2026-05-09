'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, MessageSquareText, Play, Star, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Product,
  ProductReview,
  ProductsResponse,
  useGetProductsQuery,
  useGetProductReviewsQuery,
  useLazyGetProductsQuery,
} from '@/store/api/productsApi'

const clampRating = (value: number) => Math.max(0, Math.min(5, value))
const formatRating = (value: number) => clampRating(value).toFixed(2)
const PRODUCTS_PER_PAGE = 250
const INITIAL_PRODUCTS_PER_STAR = 18
const PRODUCTS_PER_STAR_STEP = 18
const FALLBACK_IMAGE = '/af_home_logo.png'
const dedupeProducts = (items: Product[]) =>
  Array.from(
    items.reduce((map, product) => {
      map.set(product.id, product)
      return map
    }, new Map<number, Product>()).values(),
  )

const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error('Request timed out.')), ms)
    })
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
    }
  }
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Unknown date'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const normalizeReviewMediaUrl = (value: string | null | undefined) => {
  if (!value) return null
  const cleanedValue = value.trim().replace(/^"+|"+$/g, '').replace(/%22$/i, '')
  if (!cleanedValue) return null

  const fallbackBase =
    process.env.NEXT_PUBLIC_LARAVEL_API_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')

  try {
    const parsed = new URL(cleanedValue)
    const base = fallbackBase ? new URL(fallbackBase) : null

    if (base && parsed.pathname.startsWith('/storage/') && parsed.host !== base.host) {
      parsed.protocol = base.protocol
      parsed.host = base.host
      return parsed.toString()
    }

    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
    if (isLocalhost && base) {
      parsed.protocol = base.protocol
      parsed.host = base.host
      return parsed.toString()
    }

    return parsed.toString()
  } catch {
    if (fallbackBase && cleanedValue.startsWith('/')) return new URL(cleanedValue, fallbackBase).toString()
    if (fallbackBase && cleanedValue.startsWith('storage/')) return new URL(`/${cleanedValue}`, fallbackBase).toString()
    return cleanedValue
  }
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const safeRating = clampRating(rating)
  const filled = Math.floor(safeRating)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
        />
      ))}
    </div>
  )
}

function ReviewImage({
  src,
  alt,
  className,
  sizes,
}: {
  src: string
  alt: string
  className: string
  sizes: string
}) {
  const [imageSrc, setImageSrc] = useState(src)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setImageSrc(src)
    setIsLoaded(false)
  }, [src])

  return (
    <>
      {!isLoaded ? <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-700" /> : null}
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        unoptimized
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setImageSrc(FALLBACK_IMAGE)
          setIsLoaded(true)
        }}
      />
    </>
  )
}

function ReviewVideo({
  src,
  className,
  controls = false,
  autoPlay = false,
  muted = true,
  previewOnly = false,
}: {
  src: string
  className: string
  controls?: boolean
  autoPlay?: boolean
  muted?: boolean
  previewOnly?: boolean
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsLoaded(false)
    setHasError(false)
  }, [src])

  if (previewOnly) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-900 text-white`}>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <Play size={17} className="ml-0.5 fill-white" />
        </span>
      </div>
    )
  }

  return (
    <>
      {!isLoaded && !hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <p className="mt-3 text-xs font-semibold text-white/80">Loading video...</p>
          </div>
        </div>
      ) : null}
      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 px-4 text-center text-white">
          <div>
            <p className="text-sm font-semibold">Video cannot be played here</p>
            <p className="mt-1 text-xs text-white/70">The file may be missing or not browser-compatible.</p>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900"
            >
              Open video
            </a>
          </div>
        </div>
      ) : (
        <video
          key={src}
          src={src}
          preload={controls ? 'auto' : 'metadata'}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
          playsInline
          className={className}
          onLoadedMetadata={() => setIsLoaded(true)}
          onCanPlay={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true)
            setIsLoaded(true)
          }}
        />
      )}
    </>
  )
}

type ProductsReviewsPageMainProps = {
  initialData?: ProductsResponse | null
}

function ProductReviewCard({
  product,
  onSelect,
}: {
  product: Product
  onSelect: (product: Product) => void
}) {
  const [imageSrc, setImageSrc] = useState(product.image || FALLBACK_IMAGE)
  const avgRating = clampRating(Number(product.avgRating ?? 0))

  useEffect(() => {
    setImageSrc(product.image || FALLBACK_IMAGE)
  }, [product.image])

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="w-44 shrink-0 snap-start rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-orange-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-orange-500"
    >
      <div className="relative mb-3 h-24 w-full overflow-hidden rounded-lg bg-white dark:bg-slate-900">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="176px"
          loading="lazy"
          className="object-cover"
          unoptimized
          onError={() => setImageSrc(FALLBACK_IMAGE)}
        />
      </div>
      <p className="line-clamp-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{product.name}</p>
      <div className="mt-2 flex items-center justify-between">
        <Stars rating={avgRating} size={12} />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatRating(avgRating)}</span>
      </div>
    </button>
  )
}

export default function ProductsReviewsPageMain({ initialData = null }: ProductsReviewsPageMainProps) {
  const [triggerGetProducts] = useLazyGetProductsQuery()
  const hasInitialData = Boolean(initialData)
  const {
    data: firstPageData,
    isLoading: isFirstPageLoading,
    isFetching: isFirstPageFetching,
    error: firstPageError,
  } = useGetProductsQuery(
    { page: 1, perPage: PRODUCTS_PER_PAGE, status: '1' },
    { refetchOnMountOrArgChange: true, skip: hasInitialData },
  )
  const [products, setProducts] = useState<Product[]>([])
  const [isHydratingPages, setIsHydratingPages] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [visibleCounts, setVisibleCounts] = useState<Record<number, number>>({})
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [activeMediaReviewId, setActiveMediaReviewId] = useState<number | null>(null)
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const triggerGetProductsRef = useRef(triggerGetProducts)
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({ 5: null, 4: null, 3: null, 2: null, 1: null })

  useEffect(() => {
    triggerGetProductsRef.current = triggerGetProducts
  }, [triggerGetProducts])

  useEffect(() => {
    if (firstPageError) {
      setLoadError('Failed to load products with ratings. Please refresh and try again.')
      return
    }

    setLoadError(null)
  }, [firstPageError])

  useEffect(() => {
    let isActive = true

    const hydrateRemainingPages = async () => {
      const sourceData = initialData ?? firstPageData
      if (!sourceData) return

      const firstProducts = sourceData.products ?? []
      if (isActive) {
        setProducts(dedupeProducts(firstProducts))
      }

      const lastPage = Math.max(1, Number(sourceData.meta?.last_page ?? 1))
      if (lastPage <= 1) return

      setIsHydratingPages(true)
      try {
        const perPage = PRODUCTS_PER_PAGE
        const pages: number[] = []
        for (let page = 2; page <= lastPage; page += 1) pages.push(page)

        const chunkSize = 4
        let aggregated = [...firstProducts]
        for (let index = 0; index < pages.length; index += chunkSize) {
          const chunk = pages.slice(index, index + chunkSize)
          const settled = await Promise.allSettled(
            chunk.map((page) =>
              withTimeout(
                triggerGetProductsRef.current({ page, perPage, status: '1' }, false).unwrap(),
                30000,
              ),
            ),
          )

          for (const result of settled) {
            if (result.status === 'fulfilled') {
              aggregated.push(...(result.value.products ?? []))
            } else {
              console.error(result.reason)
            }
          }

          if (isActive) {
            setProducts(dedupeProducts(aggregated))
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (isActive) {
          setIsHydratingPages(false)
        }
      }
    }

    void hydrateRemainingPages()

    return () => {
      isActive = false
    }
  }, [firstPageData, initialData])

  const groupedByStars = useMemo(() => {
    const groups: Record<number, Product[]> = { 5: [], 4: [], 3: [], 2: [], 1: [] }

    for (const product of products) {
      const rating = clampRating(Number(product.avgRating ?? 0))
      if (rating <= 0) continue
      const bucket = Math.max(1, Math.min(5, Math.round(rating)))
      groups[bucket].push(product)
    }

    for (const bucket of [5, 4, 3, 2, 1]) {
      groups[bucket].sort((a, b) => Number(b.avgRating ?? 0) - Number(a.avgRating ?? 0))
    }

    return groups
  }, [products])

  const ratingsOrder = [5, 4, 3, 2, 1] as const
  const hasRatedProducts = ratingsOrder.some((stars) => groupedByStars[stars].length > 0)
  const isLoadingProducts = (isFirstPageLoading || isFirstPageFetching) && products.length === 0

  const {
    data: selectedReviewsData,
    isFetching: isFetchingReviews,
  } = useGetProductReviewsQuery(selectedProduct?.id ?? 0, { skip: !selectedProduct })

  const selectedReviews = selectedReviewsData?.reviews ?? []
  const selectedSummary = selectedReviewsData?.summary
  const selectedReviewCount = selectedSummary?.count ?? selectedReviews.length
  const isInitialReviewsLoading = isFetchingReviews && !selectedReviewsData
  const selectedBreakdown = useMemo(() => {
    const base: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

    if (selectedSummary?.breakdown) {
      for (const star of [5, 4, 3, 2, 1]) {
        const direct = Number(selectedSummary.breakdown[star] ?? 0)
        const asString = Number((selectedSummary.breakdown as Record<string, number>)[String(star)] ?? 0)
        base[star] = Math.max(0, Number.isFinite(direct) ? direct : asString)
      }
      return base
    }

    for (const review of selectedReviews) {
      const rating = Math.max(1, Math.min(5, Math.round(Number(review.rating ?? 0))))
      base[rating] += 1
    }

    return base
  }, [selectedSummary, selectedReviews])

  const scrollRow = (stars: number, direction: 'left' | 'right') => {
    const row = rowRefs.current[stars]
    if (!row) return
    row.scrollBy({ left: direction === 'left' ? -420 : 420, behavior: 'smooth' })
  }

  const buildReviewMedia = (review: ProductReview): Array<{ type: 'image' | 'video'; url: string }> => {
    const imageLinks = (review.review_images && review.review_images.length > 0)
      ? review.review_images
      : (review.review_image ? [review.review_image] : [])
    const videoLinks = (review.review_videos && review.review_videos.length > 0)
      ? review.review_videos
      : (review.review_video ? [review.review_video] : [])

    return [
      ...imageLinks.map((url) => ({ type: 'image' as const, url: normalizeReviewMediaUrl(url) })),
      ...videoLinks.map((url) => ({ type: 'video' as const, url: normalizeReviewMediaUrl(url) })),
    ].filter((item): item is { type: 'image' | 'video'; url: string } => Boolean(item.url))
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Product Reviews</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Browse products grouped by star ratings. Click a product card to view all submitted reviews.
        </p>
        {isHydratingPages && products.length > 0 ? (
          <p className="mt-3 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-200">
            Still checking remaining product pages in the background...
          </p>
        ) : null}
      </div>

      {isLoadingProducts ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Loading product ratings...
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {loadError}
        </div>
      ) : !hasRatedProducts ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {isHydratingPages ? 'Finding rated products...' : 'No products have ratings yet.'}
        </div>
      ) : (
        <div className="space-y-4">
          {ratingsOrder.map((stars) => {
            const items = groupedByStars[stars]
            if (items.length === 0) return null
            const visibleCount = visibleCounts[stars] ?? INITIAL_PRODUCTS_PER_STAR
            const visibleItems = items.slice(0, visibleCount)
            const remainingCount = Math.max(0, items.length - visibleItems.length)

            return (
              <section
                key={stars}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Stars rating={stars} />
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{stars} stars</p>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {items.length} products
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollRow(stars, 'left')}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      aria-label={`Scroll ${stars}-star row left`}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollRow(stars, 'right')}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      aria-label={`Scroll ${stars}-star row right`}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div
                  ref={(node) => {
                    rowRefs.current[stars] = node
                  }}
                  className="flex snap-x gap-3 overflow-x-auto pb-2"
                >
                  {visibleItems.map((product) => (
                    <ProductReviewCard
                      key={product.id}
                      product={product}
                      onSelect={setSelectedProduct}
                    />
                  ))}
                </div>
                {remainingCount > 0 ? (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCounts((current) => ({
                          ...current,
                          [stars]: (current[stars] ?? INITIAL_PRODUCTS_PER_STAR) + PRODUCTS_PER_STAR_STEP,
                        }))
                      }
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      Load {Math.min(PRODUCTS_PER_STAR_STEP, remainingCount)} more
                    </button>
                  </div>
                ) : null}
              </section>
            )
          })}
        </div>
      )}

      {selectedProduct ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Product Reviews</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{selectedProduct.name}</h2>
                <div className="mt-2 flex items-center gap-2">
                  <Stars rating={Number(selectedProduct.avgRating ?? 0)} />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {formatRating(Number(selectedProduct.avgRating ?? 0))}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Close reviews modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[68vh] overflow-y-auto p-5">
              {isInitialReviewsLoading ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">Loading reviews...</p>
              ) : selectedSummary ? (
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Average rating</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedSummary.average.toFixed(2)}</p>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{selectedReviewCount} review(s)</p>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = selectedBreakdown[star] ?? 0
                      const pct = selectedReviewCount > 0 ? (count / selectedReviewCount) * 100 : 0
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="w-10 text-xs font-medium text-slate-600 dark:text-slate-300">{star}★</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className="h-full rounded-full bg-amber-400"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-12 text-right text-xs text-slate-600 dark:text-slate-300">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {selectedReviews.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/60">
                  <MessageSquareText className="mx-auto mb-2 text-slate-400 dark:text-slate-500" size={22} />
                  <p className="text-sm text-slate-600 dark:text-slate-300">No written reviews yet for this product.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedReviews.map((review: ProductReview) => (
                    <article
                      key={review.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                            {review.customer_avatar ? (
                              <Image
                                src={review.customer_avatar}
                                alt={review.customer_name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                                {(review.customer_name || 'Customer').trim().charAt(0)}
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{review.customer_name}</p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(review.created_at)}</p>
                      </div>
                      <div className="mt-1">
                        <Stars rating={review.rating} size={13} />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {review.review?.trim() ? review.review : 'No comment provided.'}
                      </p>
                      {((review.review_images?.length ?? 0) > 0 || (review.review_videos?.length ?? 0) > 0 || review.review_image || review.review_video) && (
                        <div className="mt-3">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Customer Media</p>
                          <div className="flex gap-2">
                            {(() => {
                              const imageLinks = (review.review_images && review.review_images.length > 0)
                                ? review.review_images
                                : (review.review_image ? [review.review_image] : [])
                              const videoLinks = (review.review_videos && review.review_videos.length > 0)
                                ? review.review_videos
                                : (review.review_video ? [review.review_video] : [])
                              const media = [
                                ...imageLinks.map((url) => ({ type: 'image' as const, url: normalizeReviewMediaUrl(url) })),
                                ...videoLinks.map((url) => ({ type: 'video' as const, url: normalizeReviewMediaUrl(url) })),
                              ].filter((item): item is { type: 'image' | 'video'; url: string } => Boolean(item.url))
                              const previewMedia = media.slice(0, 3)
                              const remaining = Math.max(0, media.length - previewMedia.length)

                              return previewMedia.map((item, idx) => (
                                <button
                                  key={`media-${review.id}-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    setActiveMediaReviewId(review.id)
                                    setActiveMediaIndex(idx)
                                  }}
                                  className="group relative block h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-700"
                                >
                                  {item.type === 'image' ? (
                                    <ReviewImage
                                      src={item.url}
                                      alt={`Review media ${idx + 1}`}
                                      sizes="96px"
                                      className="object-cover transition group-hover:scale-105"
                                    />
                                  ) : (
                                    <ReviewVideo
                                      src={item.url}
                                      className="h-full w-full object-cover"
                                      previewOnly
                                    />
                                  )}
                                  {item.type === 'video' && (
                                    <span className="pointer-events-none absolute left-1 top-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                      Video
                                    </span>
                                  )}
                                  {remaining > 0 && idx === previewMedia.length - 1 && (
                                    <span className="pointer-events-none absolute bottom-1 right-1 rounded-full bg-black/70 px-2 py-0.5 text-xs font-bold text-white">
                                      +{remaining}
                                    </span>
                                  )}
                                </button>
                              ))
                            })()}
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {selectedProduct && activeMediaReviewId !== null ? (() => {
        const review = selectedReviews.find((item: ProductReview) => item.id === activeMediaReviewId)
        if (!review) return null
        const media = buildReviewMedia(review)
        if (media.length === 0) return null
        const safeIndex = Math.max(0, Math.min(activeMediaIndex, media.length - 1))
        const active = media[safeIndex]

        return (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setActiveMediaReviewId(null)} />
            <div className="relative z-[91] w-full max-w-5xl">
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveMediaReviewId(null)}
                  className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30"
                >
                  Close
                </button>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/20 bg-black shadow-2xl">
                <div className="relative flex h-[70vh] items-center justify-center bg-black">
                  <AnimatePresence mode="wait">
                    {active.type === 'image' ? (
                      <motion.div
                        key={`active-image-${safeIndex}-${active.url}`}
                        initial={{ opacity: 0, x: 24, scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -24, scale: 0.98 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                        className="absolute inset-0"
                      >
                        <ReviewImage
                          src={active.url}
                          alt={`Review media ${safeIndex + 1}`}
                          sizes="90vw"
                          className="object-contain"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`active-video-${safeIndex}-${active.url}`}
                        initial={{ opacity: 0, x: 24, scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -24, scale: 0.98 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <ReviewVideo
                          src={active.url}
                          controls
                          autoPlay
                          muted={false}
                          className="max-h-full max-w-full"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {media.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-black/80 p-3">
                    {media.map((item, idx) => (
                      <button
                        key={`media-thumb-${review.id}-${idx}`}
                        type="button"
                        onClick={() => setActiveMediaIndex(idx)}
                        className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border ${
                          idx === safeIndex ? 'border-orange-400' : 'border-white/20'
                        }`}
                      >
                        {item.type === 'image' ? (
                          <ReviewImage src={item.url} alt={`Media thumb ${idx + 1}`} sizes="56px" className="object-cover" />
                        ) : (
                          <ReviewVideo src={item.url} className="h-full w-full object-cover" previewOnly />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })() : null}
    </div>
  )
}
