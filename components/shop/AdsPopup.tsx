'use client'

import { useEffect, useMemo, useState } from 'react'
import { useGetAddsContentPublicQuery } from '@/store/api/addsContentApi'
import { usePathname } from 'next/navigation'

const resolveAdsPageFromPathname = (pathname: string): 'shop' | 'home' | 'landing' | 'product' | 'category' | 'brand' | null => {
  if (!pathname) return null
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/partner') ||
    pathname.startsWith('/supplier') ||
    pathname.startsWith('/api')
  ) {
    return null
  }

  // Never show admin Ads Content popups on partner storefront routes (/shop/{partner}/...).
  if (pathname.startsWith('/shop/')) return null
  if (pathname === '/shop') return 'shop'
  if (pathname === '/landing-page' || pathname.startsWith('/landing-page/')) return 'landing'
  if (pathname === '/product' || pathname.startsWith('/product/')) return 'product'
  if (pathname === '/category' || pathname.startsWith('/category/')) return 'category'
  if (pathname === '/by-brand' || pathname.startsWith('/by-brand/')) return 'brand'
  if (pathname === '/' || pathname === '/home' || pathname.startsWith('/home/')) return 'home'

  return null
}

export default function AdsPopup() {
  const pathname = usePathname() ?? ''
  const adsPage = useMemo(() => resolveAdsPageFromPathname(pathname), [pathname])
  const { data, isLoading, isError } = useGetAddsContentPublicQuery(
    adsPage ? { page: adsPage } : undefined,
    { skip: !adsPage },
  )
  const activeItems = useMemo(() => {
    const normalizedAdsPage = String(adsPage ?? '').trim().toLowerCase()
    const items = (data?.items ?? []).filter((item) => {
      const itemPage = String(item.page ?? '').trim().toLowerCase()
      const isPageMatch = itemPage === normalizedAdsPage || itemPage === 'all'
      return isPageMatch && (item.status ?? 1) === 0 && (Boolean(item.image_url) || Boolean(item.video_url))
    })
    const sorted = [...items].sort((a, b) => {
      const dateA = a.date_created ? new Date(`${a.date_created}T00:00:00`).getTime() : Number.NaN
      const dateB = b.date_created ? new Date(`${b.date_created}T00:00:00`).getTime() : Number.NaN
      if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) {
        return dateB - dateA
      }
      return (b.id ?? 0) - (a.id ?? 0)
    })
    return sorted.slice(0, 1)
  }, [data, adsPage])

  const [isOpen, setIsOpen] = useState(false)
  const [pendingOpen, setPendingOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [canClose, setCanClose] = useState(false)
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (document.readyState === 'complete') {
      setIsReady(true)
      return
    }
    const handleReady = () => setIsReady(true)
    window.addEventListener('load', handleReady)
    return () => window.removeEventListener('load', handleReady)
  }, [])

  useEffect(() => {
    if (!isReady) return
    if (!adsPage) {
      setPendingOpen(false)
      setIsOpen(false)
      return
    }
    // Route changed: always reset stale popup state before scheduling next open.
    setIsOpen(false)
    setCanClose(false)
    setCountdown(10)
    setPendingOpen(true)
  }, [adsPage, pathname, isReady])

  useEffect(() => {
    if (!pendingOpen) return
    if (!adsPage) return
    if (!isReady) return
    if (isLoading || isError) return
    if (activeItems.length === 0) return
    const timer = window.setTimeout(() => {
      setActiveIndex(0)
      setIsOpen(true)
      setPendingOpen(false)
      setCanClose(false)
      setCountdown(10)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [activeItems.length, adsPage, pendingOpen, isReady, isLoading, isError])

  useEffect(() => {
    if (!isOpen) return
    const openedAt = Date.now()
    setCanClose(false)
    setCountdown(10)
    const tickTimer = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - openedAt) / 1000)
      const remaining = Math.max(0, 10 - elapsedSeconds)
      setCountdown(remaining)
      if (remaining <= 0) {
        setCanClose(true)
        window.clearInterval(tickTimer)
      }
    }, 250)

    return () => {
      window.clearInterval(tickTimer)
    }
  }, [isOpen])

  if (!adsPage || isLoading || isError || activeItems.length === 0 || !isOpen) return null

  const activeItem = activeItems[activeIndex]

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-md">
      <button
        type="button"
        onClick={() => {
          if (!canClose) return
          setIsOpen(false)
        }}
        className={`absolute inset-0 ${canClose ? 'cursor-pointer' : 'cursor-default'}`}
        aria-label="Close ads popup"
      />
      <div className="relative z-[71] flex w-full max-w-[96vw] items-center justify-center">
        <div className="relative">
          {!canClose ? (
            <div className="absolute right-2 top-2 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow">
              Close in {countdown}s
            </div>
          ) : null}
          {canClose ? (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#ECECEC] text-sm font-semibold text-slate-700 shadow-md transition hover:bg-white"
              aria-label="Close"
            >
              X
            </button>
          ) : null}
          {activeItem?.video_url ? (
            <video
              src={activeItem.video_url}
              autoPlay
              muted
              loop
              playsInline
              className="max-h-[78vh] w-auto max-w-[92vw] rounded-2xl bg-black object-contain shadow-2xl sm:max-h-[72vh] sm:max-w-[84vw] lg:max-h-[70vh] lg:max-w-[78vw]"
            />
          ) : (
            <img
              src={activeItem?.image_url ?? ''}
              alt="Sponsored content"
              className="max-h-[78vh] w-auto max-w-[92vw] rounded-2xl object-contain shadow-2xl sm:max-h-[72vh] sm:max-w-[84vw] lg:max-h-[70vh] lg:max-w-[78vw]"
            />
          )}
        </div>
      </div>
    </div>
  )
}
