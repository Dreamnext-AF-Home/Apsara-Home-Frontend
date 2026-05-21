'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useMemo, useState, useRef, useEffect, useCallback } from 'react'

interface GlobalProductImageGalleryProps {
  primaryImage: string | null | undefined
  images: string[]
  productName: string
  preferredActiveImage?: string
}

const MIN_ZOOM = 1
const MAX_ZOOM = 3
const ZOOM_STEP = 0.5

const GlobalProductImageGallery = ({
  primaryImage,
  images,
  productName,
  preferredActiveImage,
}: GlobalProductImageGalleryProps) => {
  const galleryImages = useMemo(() => {
    const all = [primaryImage, ...images].filter((img): img is string => Boolean(img))
    return Array.from(new Set(all))
  }, [primaryImage, images])

  const hasMultipleImages = galleryImages.length > 1

  const initialActiveIndex = useMemo(() => {
    if (!preferredActiveImage) return 0
    const idx = galleryImages.findIndex((img) => img === preferredActiveImage)
    return idx >= 0 ? idx : 0
  }, [galleryImages, preferredActiveImage])

  const [activeImage, setActiveImage] = useState(initialActiveIndex)
  const [isZoomed, setIsZoomed] = useState(false)

  const [zoomLevel, setZoomLevel] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const isDragging = useRef(false)
  const dragMoved = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const didSwipeRef = useRef(false)
  const galleryRef = useRef<HTMLDivElement>(null)

  const thumbContainerRef = useRef<HTMLDivElement>(null)
  const thumbButtonRefs = useRef<(HTMLButtonElement | null)[]>([])

  const safeActive = galleryImages.length > 0 ? Math.min(Math.max(activeImage, 0), galleryImages.length - 1) : 0

  const resetZoom = useCallback(() => {
    setZoomLevel(1)
    setPanX(0)
    setPanY(0)
  }, [])

  useEffect(() => { resetZoom() }, [safeActive, resetZoom])
  useEffect(() => { if (!isZoomed) resetZoom() }, [isZoomed, resetZoom])

  // Sync to preferredActiveImage when variant changes
  useEffect(() => {
    if (!preferredActiveImage) return
    const idx = galleryImages.findIndex((img) => img === preferredActiveImage)
    if (idx >= 0) setActiveImage(idx)
  }, [preferredActiveImage, galleryImages])

  useEffect(() => {
    const container = thumbContainerRef.current
    const thumb = thumbButtonRefs.current[safeActive]
    if (!container || !thumb) return
    const cLeft = container.scrollLeft
    const cWidth = container.clientWidth
    const tLeft = thumb.offsetLeft
    const tWidth = thumb.offsetWidth
    if (tLeft < cLeft + 8) {
      container.scrollTo({ left: tLeft - 8, behavior: 'smooth' })
    } else if (tLeft + tWidth > cLeft + cWidth - 8) {
      container.scrollTo({ left: tLeft + tWidth - cWidth + 8, behavior: 'smooth' })
    }
  }, [safeActive])

  const zoomIn = useCallback(() => setZoomLevel((prev) => Math.min(+(prev + ZOOM_STEP).toFixed(1), MAX_ZOOM)), [])
  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const next = Math.max(+(prev - ZOOM_STEP).toFixed(1), MIN_ZOOM)
      if (next === MIN_ZOOM) { setPanX(0); setPanY(0) }
      return next
    })
  }, [])

  const goNext = () => setActiveImage((p) => (p + 1) % galleryImages.length)
  const goPrev = () => setActiveImage((p) => (p - 1 + galleryImages.length) % galleryImages.length)
  const goTo = (i: number) => { if (i !== safeActive) setActiveImage(i) }

  useEffect(() => {
    const el = galleryRef.current
    if (!el) return
    const handleMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return
      const dx = Math.abs((e.touches[0]?.clientX ?? 0) - touchStartX.current)
      const dy = Math.abs((e.touches[0]?.clientY ?? 0) - touchStartY.current)
      if (dx > dy && dx > 8) e.preventDefault()
    }
    el.addEventListener('touchmove', handleMove, { passive: false })
    return () => el.removeEventListener('touchmove', handleMove)
  }, [])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
    touchStartY.current = e.touches[0]?.clientY ?? null
    didSwipeRef.current = false
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    if (Math.abs(diff) > 40) {
      diff < 0 ? goNext() : goPrev()
      didSwipeRef.current = true
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const onImageMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return
    e.preventDefault()
    isDragging.current = true
    dragMoved.current = false
    dragStart.current = { x: e.clientX, y: e.clientY, panX, panY }
  }
  const onImageMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved.current = true
    setPanX(dragStart.current.panX + dx / zoomLevel)
    setPanY(dragStart.current.panY + dy / zoomLevel)
  }
  const onImageMouseUp = (e: React.MouseEvent) => {
    if (dragMoved.current) e.stopPropagation()
    isDragging.current = false
  }
  const onImageMouseLeave = () => { isDragging.current = false }

  const onImageWheel = (e: React.WheelEvent) => {
    e.stopPropagation()
    if (e.deltaY < 0) zoomIn()
    else zoomOut()
  }

  const onImageDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (zoomLevel >= MAX_ZOOM) resetZoom()
    else zoomIn()
  }

  const isAtMinZoom = zoomLevel <= MIN_ZOOM
  const isAtMaxZoom = zoomLevel >= MAX_ZOOM

  if (galleryImages.length === 0) return null

  return (
    <>
      {/* Lightbox */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsZoomed(false)}
            className="fixed inset-0 z-[100] bg-black/92 flex flex-col items-center justify-center p-4"
            style={{ cursor: zoomLevel > 1 ? 'default' : 'zoom-out' }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-4xl aspect-square max-h-[68vh] overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
              onWheel={onImageWheel}
            >
              {galleryImages.map((src, index) => (
                <div
                  key={src}
                  className="absolute inset-0 transition-transform duration-[350ms] ease-out will-change-transform"
                  style={{ transform: `translateX(${(index - safeActive) * 100}%)` }}
                >
                  <div
                    className="absolute inset-0 transition-transform duration-200 ease-out select-none"
                    style={{
                      transform: index === safeActive
                        ? `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`
                        : undefined,
                      transformOrigin: 'center center',
                      cursor: index === safeActive && zoomLevel > 1
                        ? (isDragging.current ? 'grabbing' : 'grab')
                        : 'default',
                    }}
                    onMouseDown={index === safeActive ? onImageMouseDown : undefined}
                    onMouseMove={index === safeActive ? onImageMouseMove : undefined}
                    onMouseUp={index === safeActive ? onImageMouseUp : undefined}
                    onMouseLeave={index === safeActive ? onImageMouseLeave : undefined}
                    onDoubleClick={index === safeActive ? onImageDoubleClick : undefined}
                  >
                    <Image
                      src={src}
                      alt={index === 0 ? productName : `${productName} ${index + 1}`}
                      fill
                      className="object-contain pointer-events-none"
                      priority={index === 0}
                      draggable={false}
                      unoptimized
                    />
                  </div>
                </div>
              ))}

              {hasMultipleImages && zoomLevel === 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); goPrev() }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-sm border border-white/10 transition-colors flex items-center justify-center"
                    aria-label="Previous"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); goNext() }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-sm border border-white/10 transition-colors flex items-center justify-center"
                    aria-label="Next"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </>
              )}

              {/* Zoom controls */}
              <div
                className="hidden sm:flex absolute bottom-3 left-1/2 -translate-x-1/2 z-20 items-center gap-1 bg-black/40 backdrop-blur-md rounded-full px-2 py-1.5 border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={zoomOut}
                  disabled={isAtMinZoom}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Zoom out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
                <span className="text-white/70 text-xs font-semibold tabular-nums min-w-[2.75rem] text-center select-none">
                  {zoomLevel.toFixed(1)}×
                </span>
                <button
                  onClick={zoomIn}
                  disabled={isAtMaxZoom}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Zoom in"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
                {!isAtMinZoom && (
                  <>
                    <div className="w-px h-4 bg-white/20 mx-1" />
                    <button
                      onClick={resetZoom}
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                      aria-label="Reset zoom"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {zoomLevel === 1 && (
                <p className="hidden sm:block absolute top-3 left-1/2 -translate-x-1/2 z-20 text-white/30 text-[11px] font-medium select-none pointer-events-none whitespace-nowrap">
                  Scroll or double-click to zoom
                </p>
              )}
              {zoomLevel > 1 && (
                <p className="hidden sm:block absolute top-3 left-1/2 -translate-x-1/2 z-20 text-white/30 text-[11px] font-medium select-none pointer-events-none whitespace-nowrap">
                  Drag to pan
                </p>
              )}
            </motion.div>

            {hasMultipleImages && (
              <div className="flex gap-2 mt-4 overflow-x-auto justify-center" style={{ scrollbarWidth: 'none' }}>
                {galleryImages.map((src, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); goTo(index) }}
                    className={`relative shrink-0 h-14 w-14 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      safeActive === index ? 'border-sky-400 scale-110' : 'border-white/25 hover:border-white/50 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image src={src} alt={`View ${index + 1}`} fill className="object-contain" unoptimized />
                  </button>
                ))}
              </div>
            )}

            {hasMultipleImages && (
              <p className="mt-3 text-white/40 text-xs font-medium tabular-nums">{safeActive + 1} / {galleryImages.length}</p>
            )}

            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors backdrop-blur-sm"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery */}
      <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }}>
        <div className="flex flex-col gap-3">

          {/* Main image */}
          <div
            ref={galleryRef}
            className="group relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden cursor-zoom-in select-none bg-white dark:bg-gray-800"
            onClick={() => { if (!didSwipeRef.current) setIsZoomed(true) }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {galleryImages.map((src, index) => (
              <div
                key={src}
                className="absolute inset-0 transition-transform duration-[350ms] ease-out will-change-transform"
                style={{ transform: `translateX(${(index - safeActive) * 100}%)` }}
              >
                <Image
                  src={src}
                  alt={index === 0 ? productName : `${productName} ${index + 1}`}
                  fill
                  className="object-contain p-4"
                  priority={index < 3}
                  loading="eager"
                  unoptimized
                />
              </div>
            ))}

            {/* Nav arrows */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev() }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/75 dark:bg-slate-900/75 backdrop-blur-sm border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 shadow-sm opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-slate-900 hover:text-sky-500 dark:hover:text-sky-400 transition-all duration-150 flex items-center justify-center"
                  aria-label="Previous image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext() }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/75 dark:bg-slate-900/75 backdrop-blur-sm border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 shadow-sm opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-slate-900 hover:text-sky-500 dark:hover:text-sky-400 transition-all duration-150 flex items-center justify-center"
                  aria-label="Next image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </>
            )}

            {/* Dot indicators */}
            {hasMultipleImages && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
                {galleryImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); goTo(index) }}
                    aria-label={`Image ${index + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-250 ${
                      index === safeActive
                        ? 'w-5 bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]'
                        : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Zoom hint */}
            <div className="absolute top-3 right-3 z-10 bg-black/25 backdrop-blur-sm text-white/80 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>

            {/* Discount badge */}
            <div className="absolute left-3 top-3 z-10 rounded-full bg-sky-500 px-3 py-1 text-xs font-bold text-white pointer-events-none">
              Register to get 6% discount
            </div>
          </div>

          {/* Thumbnails */}
          {hasMultipleImages && (
            <div className="relative">
              <button
                onClick={() => thumbContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
                className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow text-slate-500 dark:text-slate-400 hover:border-sky-400 hover:text-sky-500 transition-all"
                aria-label="Scroll thumbnails left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              </button>

              <div
                ref={thumbContainerRef}
                className="flex gap-2 overflow-x-auto pb-0.5 sm:px-10"
                style={{ scrollbarWidth: 'none' }}
              >
                {galleryImages.map((src, index) => (
                  <button
                    key={index}
                    ref={(el) => { thumbButtonRefs.current[index] = el }}
                    onClick={() => goTo(index)}
                    aria-label={`View image ${index + 1}`}
                    className={`relative shrink-0 h-[68px] w-[68px] rounded-2xl overflow-hidden border-2 transition-all duration-200 bg-white dark:bg-gray-800 ${
                      safeActive === index
                        ? 'border-sky-400 dark:border-sky-500 shadow-[0_0_0_3px_rgba(56,189,248,0.15)]'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={src} alt={`View ${index + 1}`} fill className="object-contain p-1" unoptimized />
                  </button>
                ))}
              </div>

              <button
                onClick={() => thumbContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow text-slate-500 dark:text-slate-400 hover:border-sky-400 hover:text-sky-500 transition-all"
                aria-label="Scroll thumbnails right"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </>
  )
}

export default GlobalProductImageGallery
