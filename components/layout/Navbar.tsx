'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'
import { useSession, signOut } from 'next-auth/react'
import { useLogoutMutation } from '@/store/api/authApi'
import { baseApi, clearAccessTokenCache } from '@/store/api/baseApi'
import type { Category } from '@/store/api/categoriesApi'
import { useGetPublicProductsQuery } from '@/store/api/productsApi'
import { useMeQuery } from '@/store/api/userApi'
import { useGetCustomerNotificationsQuery } from '@/store/api/customerNotificationsApi'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/store/hooks'
import { ROOM_OPTIONS } from '@/libs/roomConfig'
import { useGetPublicProductBrandsQuery } from '@/store/api/productBrandsApi'

type NavLink = {
  label: string;
  href: string;
  dropdown?: string[]
  mega?: Record<string, string[]>
}

const navLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Shop Category',
    href: '/category',
    dropdown: [],
  },
  {
    label: 'Shop By Room',
    href: '/by-room',
    mega: Object.fromEntries(ROOM_OPTIONS.map((room) => [room.label.toUpperCase(), []])),
  },
  { label: 'Shop By Brand', href: '/by-brand', dropdown: [] },
  { label: 'Assembly Guides', href: '/assembly' },
  { label: 'Interior Services', href: '/interior-services' },
  {
    label: 'Media',
    href: '/media',
    dropdown: ['Photo Gallery', 'Video Gallery'],
  },
  { label: 'Blogs', href: '/blog' },
]

const toSlug = (value: string) => value.toLowerCase().trim().replace(/\s+/g, '-');

const normalizeCategorySlug = (rawUrl: string | null | undefined, fallbackName: string) => {
  const source = (rawUrl ?? '').trim();
  if (!source || source === '0') return toSlug(fallbackName);

  const withoutDomain = source.replace(/^https?:\/\/[^/]+/i, '');
  const cleaned = withoutDomain
    .replace(/^\/+/, '')
    .replace(/^category\//i, '')
    .replace(/\/+$/, '');

  return cleaned || toSlug(fallbackName);
};

const MAX_NAVBAR_BRANDS = 8;

const roomIcons: Record<string, React.ReactNode> = {
  BEDROOM: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7" /><path d="M21 10H3V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3z" /><path d="M6 19v2" /><path d="M18 19v2" /></svg>
  ),
  KITCHEN: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" /></svg>
  ),
  'LIVING ROOM': (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" /><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z" /><path d="M4 18v2" /><path d="M20 18v2" /></svg>
  ),
  OUTDOOR: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 14h.01" /><path d="M7 7h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14" /><circle cx="12" cy="12" r="3" /><path d="m16 16 2 2" /></svg>
  ),
  'STUDY & OFFICE ROOM': (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18" /><path d="M7 6v12" /><path d="M17 10v8" /><path d="M7 18h10" /><path d="M10 10h4" /></svg>
  ),
  'DINING ROOM': (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 4v7" /><path d="M17 4v7" /><path d="M5 11h14" /><path d="M12 11v9" /><path d="M8 20h8" /></svg>
  ),
  'LAUNDRY ROOM': (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="13" r="4" /><path d="M8 7h8" /></svg>
  ),
  BATHROOM: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 10V7a5 5 0 0 1 10 0" /><path d="M4 13h16" /><path d="M6 13v2a6 6 0 0 0 12 0v-2" /></svg>
  ),
}

export default function Navbar({ initialCategories = [] }: { initialCategories?: Category[] }) {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notifMenuOpen, setNotifMenuOpen] = useState(false)
  const [desktopSearchQuery, setDesktopSearchQuery] = useState('')
  const [mobileTopSearchQuery, setMobileTopSearchQuery] = useState('')
  const [activeSearchField, setActiveSearchField] = useState<'desktop' | 'mobile' | null>(null)
  const [megaSearch, setMegaSearch] = useState('')
  const [mobileSearch, setMobileSearch] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  const [mobileBrandSearch, setMobileBrandSearch] = useState('')
  const { cartCount, setIsOpen } = useCart()
  const dispatch = useAppDispatch()
  const { data: session, status } = useSession();
  const user = session?.user
  const role = String(user?.role ?? '').toLowerCase()
  const isCustomerSession = status === 'authenticated' && (role === 'customer' || role === '')
  const { data: meData } = useMeQuery(undefined, { skip: !isCustomerSession })
  const [logoutApi] = useLogoutMutation();
  const isLoggedIn = isCustomerSession
  const avatarUrl = isCustomerSession ? (meData?.avatar_url || user?.image || null) : null
  const customerNotificationCacheKey = meData?.id ?? user?.id ?? 'guest'
  const {
    data: notificationsData,
    isLoading: isNotificationsLoading,
    isError: isNotificationsError,
    refetch: refetchNotifications,
  } = useGetCustomerNotificationsQuery(customerNotificationCacheKey, {
    skip: !isCustomerSession,
    pollingInterval: 30000,
    refetchOnFocus: true,
  })
  const customerNotificationStorageKey = `afhome-customer-notif-read:${customerNotificationCacheKey}`
  const [readCustomerNotificationKeys, setReadCustomerNotificationKeys] = useState<string[]>([])

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const notifMenuRef = useRef<HTMLDivElement | null>(null)
  const desktopSearchRef = useRef<HTMLFormElement | null>(null)
  const mobileTopSearchRef = useRef<HTMLFormElement | null>(null)

  const activeSearchQuery = (activeSearchField === 'mobile' ? mobileTopSearchQuery : desktopSearchQuery).trim()
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(activeSearchQuery)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(activeSearchQuery)
    }, 180)
    return () => clearTimeout(timeoutId)
  }, [activeSearchQuery])

  const { data: searchedProductsData, isFetching: isSearchingProducts } = useGetPublicProductsQuery(
    {
      page: 1,
      perPage: 8,
      search: debouncedSearchQuery,
      status: '1',
    },
    {
      skip: debouncedSearchQuery.length < 2,
    },
  )

  const searchedProducts = useMemo(() => {
    const rows = searchedProductsData?.products ?? []
    return rows
      .map((product) => {
        const name = String(product.name ?? '').trim()
        if (!name) return null
        const imageFromArray = Array.isArray(product.images)
          ? product.images.find((item) => typeof item === 'string' && item.trim().length > 0)
          : null
        const image = product.image || imageFromArray || null
        const slug = toSlug(name)
        const id = typeof product.id === 'number' ? product.id : null
        return {
          id: id ?? slug,
          name,
          image,
          path: id ? `/product/${slug}-i${id}` : `/product/${slug}`,
        }
      })
      .filter((product): product is { id: number | string; name: string; image: string | null; path: string } => Boolean(product))
  }, [searchedProductsData?.products])

  const desktopSuggestions = useMemo(() => {
    if (activeSearchField !== 'desktop') return []
    return searchedProducts
  }, [activeSearchField, searchedProducts])

  const mobileSuggestions = useMemo(() => {
    if (activeSearchField !== 'mobile') return []
    return searchedProducts
  }, [activeSearchField, searchedProducts])

  const desktopSearchTerm = desktopSearchQuery.trim()
  const mobileSearchTerm = mobileTopSearchQuery.trim()
  const showDesktopNotFound =
    activeSearchField === 'desktop' &&
    desktopSearchTerm.length >= 2 &&
    !isSearchingProducts &&
    desktopSuggestions.length === 0
  const showDesktopSearching =
    activeSearchField === 'desktop' &&
    desktopSearchTerm.length >= 2 &&
    isSearchingProducts
  const showMobileNotFound =
    activeSearchField === 'mobile' &&
    mobileSearchTerm.length >= 2 &&
    !isSearchingProducts &&
    mobileSuggestions.length === 0
  const showMobileSearching =
    activeSearchField === 'mobile' &&
    mobileSearchTerm.length >= 2 &&
    isSearchingProducts

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = window.localStorage.getItem(customerNotificationStorageKey)
      if (!stored) {
        setReadCustomerNotificationKeys([])
        return
      }

      const parsed = JSON.parse(stored)
      setReadCustomerNotificationKeys(Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [])
    } catch {
      setReadCustomerNotificationKeys([])
    }
  }, [customerNotificationStorageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(customerNotificationStorageKey, JSON.stringify(readCustomerNotificationKeys))
    } catch {
      // Ignore localStorage write failures.
    }
  }, [customerNotificationStorageKey, readCustomerNotificationKeys])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedOutsideProfile = !profileMenuRef.current || !profileMenuRef.current.contains(target)
      const clickedOutsideNotifications = !notifMenuRef.current || !notifMenuRef.current.contains(target)
      const clickedOutsideDesktopSearch = !desktopSearchRef.current || !desktopSearchRef.current.contains(target)
      const clickedOutsideMobileSearch = !mobileTopSearchRef.current || !mobileTopSearchRef.current.contains(target)

      if (clickedOutsideProfile) {
        setProfileMenuOpen(false)
      }
      if (clickedOutsideNotifications) {
        setNotifMenuOpen(false)
      }
      if (clickedOutsideDesktopSearch && clickedOutsideMobileSearch) setActiveSearchField(null)
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileMenuOpen(false)
      if (event.key === 'Escape') setNotifMenuOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [])

  const getCustomerNotificationReadKey = (item: { id: string; title: string; description: string; count: number }) =>
    `${item.id}:${item.title}:${item.description}:${item.count}`

  const getCustomerNotificationTimestamp = (value: string | null | undefined) => {
    if (!value) return 0
    const timestamp = new Date(value).getTime()
    return Number.isNaN(timestamp) ? 0 : timestamp
  }

  const formatCustomerNotificationTime = (value: string | null | undefined) => {
    if (!value) return null

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null

    return new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  }

  const visibleCustomerNotifications = useMemo(() => {
    const items = (notificationsData?.items ?? []).filter((item) => item.count > 0)

    return [...items].sort((a, b) => {
      const aUnread = readCustomerNotificationKeys.includes(getCustomerNotificationReadKey(a)) ? 1 : 0
      const bUnread = readCustomerNotificationKeys.includes(getCustomerNotificationReadKey(b)) ? 1 : 0

      if (aUnread !== bUnread) return aUnread - bUnread
      const timeDiff = getCustomerNotificationTimestamp(b.latest_at) - getCustomerNotificationTimestamp(a.latest_at)
      if (timeDiff !== 0) return timeDiff
      return b.count - a.count
    })
  }, [notificationsData?.items, readCustomerNotificationKeys])

  const unreadNotificationCount = useMemo(() => {
    return visibleCustomerNotifications.reduce((total, item) => {
      const isRead = readCustomerNotificationKeys.includes(getCustomerNotificationReadKey(item))
      return isRead ? total : total + item.count
    }, 0)
  }, [readCustomerNotificationKeys, visibleCustomerNotifications])

  useEffect(() => {
    if (!notifMenuOpen) return
    if (!visibleCustomerNotifications.length) return
    markAllCustomerNotificationsAsRead()
  }, [notifMenuOpen, visibleCustomerNotifications])

  const markCustomerNotificationAsRead = (item: { id: string; title: string; description: string; count: number }) => {
    const readKey = getCustomerNotificationReadKey(item)

    setReadCustomerNotificationKeys((current) => (
      current.includes(readKey) ? current : [...current, readKey]
    ))
  }

  const markAllCustomerNotificationsAsRead = () => {
    setReadCustomerNotificationKeys((current) => {
      const next = new Set(current)
      visibleCustomerNotifications.forEach((item) => next.add(getCustomerNotificationReadKey(item)))
      return Array.from(next)
    })
  }

  const open = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setActiveDropdown(label)
  }

  const close = () => {
    closeTimer.current = setTimeout(() => {
      setActiveDropdown(null)
      setMegaSearch('')
      setBrandSearch('')
    }, 150)
  }

  const activeLink = navLinks.find((l) => l.label === activeDropdown)
  const shopCategoryItems = useMemo(() => {
    return initialCategories.map((category) => {
      const urlPart = normalizeCategorySlug(category.url, category.name)
      return { label: category.name, href: `/category/${urlPart}` }
    })
  }, [initialCategories])
  const { data: publicBrandsData } = useGetPublicProductBrandsQuery()
  const shopBrandItems = useMemo(() => {
    return (publicBrandsData?.brands ?? [])
      .filter((brand) => brand.status === 0 && brand.name.trim().length > 0)
      .map((brand) => ({
        id: brand.id,
        label: brand.name.trim(),
        image: brand.image ?? null,
        href: `/by-brand?brand=${encodeURIComponent(toSlug(brand.name))}`,
      }))
  }, [publicBrandsData?.brands])
  const navbarBrandItems = useMemo(
    () => shopBrandItems.slice(0, MAX_NAVBAR_BRANDS),
    [shopBrandItems],
  )

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // const handleLogout = async () => {
  //   setIsLoggingOut(true)
  //   try {
  //     await logoutApi().unwrap()
  //   } catch (error) {
  //     console.log(error)
  //   }
  //   if (typeof window !== 'undefined') {
  //     window.localStorage.removeItem('accessToken')
  //   }
  //   setProfileMenuOpen(false)
  //   await signOut({ callbackUrl: '/' })
  // }

  const handleProductSearchSubmit = (query: string, field: 'desktop' | 'mobile') => {
    const q = query.trim().toLowerCase()
    if (!q) return

    const exactMatch = searchedProducts.find((p) => p.name.toLowerCase() === q)
    const firstMatch = exactMatch ?? searchedProducts.find((p) => p.name.toLowerCase().includes(q))
    if (!firstMatch) {
      setActiveSearchField(field)
      return
    }

    router.push(firstMatch.path)
    setDesktopSearchQuery('')
    setMobileTopSearchQuery('')
    setActiveSearchField(null)
  }

  const handleCustomerLogout = async (callbackUrl: string) => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    setProfileMenuOpen(false)
    setNotifMenuOpen(false)

    try {
      try {
        await logoutApi().unwrap()
      } catch {
        // Best-effort backend logout only.
      }

      clearAccessTokenCache()
      dispatch(baseApi.util.resetApiState())

      const result = await signOut({
        redirect: false,
        callbackUrl,
      })

      router.replace(result?.url || callbackUrl)
      router.refresh()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`sticky top-0 z-50 bg-white transition-all duration-300 ${scrolled ? 'shadow-lg shadow-black/5' : 'shadow-sm'}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/shop" className="flex items-center shrink-0">
            <Image
              src="/Images/af_home_logo.png"
              alt="AF Home"
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xl hidden md:block">
            <form
              className="relative"
              ref={desktopSearchRef}
              onSubmit={(e) => {
                e.preventDefault()
                handleProductSearchSubmit(desktopSearchQuery, 'desktop')
              }}
            >
              <input
                type="text"
                value={desktopSearchQuery}
                onChange={(e) => setDesktopSearchQuery(e.target.value)}
                onFocus={() => setActiveSearchField('desktop')}
                placeholder="Search products..."
                className="w-full pl-4 pr-11 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
                {showDesktopSearching ? (
                  <div className="h-[18px] w-[18px] rounded-full border-2 border-orange-300 border-t-orange-500 animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                )}
              </button>

              <AnimatePresence>
                {activeSearchField === 'desktop' && (desktopSuggestions.length > 0 || showDesktopNotFound || showDesktopSearching) && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg shadow-black/10 overflow-hidden z-50"
                  >
                    {showDesktopSearching ? (
                      <div className="flex items-center gap-2.5 px-4 py-3.5">
                        <div className="h-4 w-4 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin shrink-0" />
                        <p className="text-sm text-gray-500">Searching products...</p>
                      </div>
                    ) : desktopSuggestions.length > 0 ? (
                      desktopSuggestions.map((product) => (
                        <Link
                          key={product.id}
                          href={product.path}
                          onClick={() => {
                            setDesktopSearchQuery('')
                            setActiveSearchField(null)
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-orange-50 transition-colors"
                        >
                          <span className="relative h-10 w-10 rounded-md overflow-hidden bg-gray-100 shrink-0">
                            {product.image ? (
                              <Image src={product.image} alt={product.name} fill className="object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-gray-400">
                                AF
                              </span>
                            )}
                          </span>
                          <span className="text-sm text-gray-700 truncate">{product.name}</span>
                        </Link>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-sm text-gray-500">Product not found</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-1">
            {/* Auth actions */}
            {isLoggedIn ? (
              <>
                <Link
                  href="/wishlist"
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  title="Wishlist"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m12 21-1.45-1.32C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4 5 5 0 0 1 12 6.09 5 5 0 0 1 17.5 4 4.5 4.5 0 0 1 22 8.5c0 3.78-3.4 6.86-8.55 11.18z" />
                  </svg>
                </Link>
                <div className="relative" ref={notifMenuRef}>
                  <button
                    onClick={() => {
                      setNotifMenuOpen((prev) => !prev)
                      setProfileMenuOpen(false)
                      if (!notifMenuOpen) {
                        refetchNotifications()
                      }
                    }}
                    className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
                    title="Notifications"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                      <path d="M9 17a3 3 0 0 0 6 0" />
                    </svg>
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                        {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notifMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="fixed left-2 right-2 top-16 mt-0 w-auto rounded-2xl border border-gray-100 bg-white shadow-xl shadow-black/10 overflow-hidden z-50 sm:absolute sm:right-0 sm:left-auto sm:top-auto sm:mt-2 sm:w-[360px] sm:max-w-[calc(100vw-1rem)]"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100/80">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900">Notifications</p>
                            {unreadNotificationCount > 0 && (
                              <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center leading-none">
                                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={markAllCustomerNotificationsAsRead}
                            className="shrink-0 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                          >
                            Mark all read
                          </button>
                        </div>

                        {/* List */}
                        <div className="max-h-[60vh] overflow-y-auto sm:max-h-[52vh] divide-y divide-gray-50">
                          {isNotificationsLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                              <div className="h-7 w-7 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin" />
                              <p className="text-xs text-gray-400">Loading...</p>
                            </div>
                          ) : isNotificationsError ? (
                            <div className="px-4 py-8 text-center">
                              <p className="text-sm text-red-500 font-medium">Failed to load notifications</p>
                              <p className="text-xs text-gray-400 mt-1">Please try again later.</p>
                            </div>
                          ) : visibleCustomerNotifications.length ? (
                            visibleCustomerNotifications.map((item) => {
                              const isRead = readCustomerNotificationKeys.includes(getCustomerNotificationReadKey(item))
                              return (
                                <Link
                                  key={item.id}
                                  href={item.href}
                                  onClick={() => {
                                    markCustomerNotificationAsRead(item)
                                    setNotifMenuOpen(false)
                                  }}
                                  className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-orange-50/60 ${!isRead ? 'bg-orange-50/30' : ''}`}
                                >
                                  <div className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold ${
                                    !isRead ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
                                  }`}>
                                    {item.title.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-1.5">
                                      <p className={`text-sm leading-snug ${!isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>{item.title}</p>
                                      {!isRead && <span className="shrink-0 mt-1 h-2 w-2 bg-orange-500 rounded-full" />}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{item.description}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      {formatCustomerNotificationTime(item.latest_at) && (
                                        <span className="text-[11px] text-gray-400">{formatCustomerNotificationTime(item.latest_at)} PHT</span>
                                      )}
                                      {item.count > 1 && (
                                        <span className="text-[11px] bg-orange-100 text-orange-600 font-semibold rounded-full px-1.5 py-0.5 leading-none">×{item.count}</span>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              )
                            })
                          ) : (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                                  <path d="M9 17a3 3 0 0 0 6 0" />
                                </svg>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-500">You&apos;re all caught up!</p>
                                <p className="text-xs text-gray-400 mt-0.5">No new notifications</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                          <p className="text-[11px] text-gray-400">Auto-refresh every 30 seconds</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  onClick={() => setIsOpen(true)}
                  className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  title="Cart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>

                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>

                <Link
                  href="/track-order"
                  className="hidden lg:flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 transition-colors hover:border-orange-300 hover:bg-orange-100"
                  title="Track Order"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 17h4V5H2v12h3" />
                    <path d="M14 8h4l4 4v5h-4" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                  <span>Track Order</span>
                </Link>

                <div className="relative hidden md:block" ref={profileMenuRef}>
                  <button
                    onClick={() => {
                      setProfileMenuOpen((prev) => !prev)
                      setNotifMenuOpen(false)
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                    title="Profile menu"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={user?.name || 'Profile'}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold uppercase">
                        {user?.name?.charAt(0) ?? 'U'}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-100 bg-white shadow-xl shadow-black/10 overflow-hidden z-50"
                      >
                        {/* User info header */}
                        <div className="px-4 py-4 bg-linear-to-br from-orange-50 to-amber-50 border-b border-orange-100">
                          <div className="flex items-center gap-3">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={user?.name || 'Profile'}
                                className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow"
                              />
                            ) : (
                              <span className="flex items-center justify-center h-11 w-11 rounded-full bg-orange-500 text-white text-sm font-bold uppercase ring-2 ring-white shadow">
                                {user?.name?.charAt(0) ?? 'U'}
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {user?.name ?? 'User'}
                              </p>
                              {user?.email && (
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {user.email}
                                </p>
                              )}
                              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-semibold">
                                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                                Active
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="py-1.5">
                          <Link
                            href="/profile"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                          >
                            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-gray-100 group-hover:bg-orange-100 transition-colors shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 group-hover:text-orange-600 transition-colors">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            </span>
                            <div>
                              <p className="font-medium">My Profile</p>
                              <p className="text-xs text-gray-400">View & edit your info</p>
                            </div>
                          </Link>

                          <Link
                            href="/orders"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                          >
                            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-gray-100 group-hover:bg-orange-100 transition-colors shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 group-hover:text-orange-600 transition-colors">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                              </svg>
                            </span>
                            <div>
                              <p className="font-medium">My Orders</p>
                              <p className="text-xs text-gray-400">Track your purchases</p>
                            </div>
                          </Link>

                          <Link
                            href="/wishlist"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                          >
                            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-gray-100 group-hover:bg-orange-100 transition-colors shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 group-hover:text-orange-600 transition-colors">
                                <path d="m12 21-1.45-1.32C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4 5 5 0 0 1 12 6.09 5 5 0 0 1 17.5 4 4.5 4.5 0 0 1 22 8.5c0 3.78-3.4 6.86-8.55 11.18z" />
                              </svg>
                            </span>
                            <div>
                              <p className="font-medium">Wishlist</p>
                              <p className="text-xs text-gray-400">Your saved items</p>
                            </div>
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100 py-1.5">
                          <button
                            onClick={() => handleCustomerLogout('/shop')}
                            disabled={isLoggingOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 group"
                          >
                            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors shrink-0">
                              {isLoggingOut ? (
                                <svg className="animate-spin h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                  <polyline points="16 17 21 12 16 7" />
                                  <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                              )}
                            </span>
                            <p className="font-medium">{isLoggingOut ? 'Logging out...' : 'Logout'}</p>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/track-order"
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
                  title="Track Order"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 17h4V5H2v12h3" />
                    <path d="M14 8h4l4 4v5h-4" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                  <span className="text-sm font-medium">Track Order</span>
                </Link>

                <Link
                  href="/login"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-700"
                  title="Sign in"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="text-sm font-medium">Sign in</span>
                </Link>
              </>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors ml-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen
                  ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                  : <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <form
            className="relative"
            ref={mobileTopSearchRef}
            onSubmit={(e) => {
              e.preventDefault()
              handleProductSearchSubmit(mobileTopSearchQuery, 'mobile')
            }}
          >
            <input
              type="text"
              value={mobileTopSearchQuery}
              onChange={(e) => setMobileTopSearchQuery(e.target.value)}
              onFocus={() => setActiveSearchField('mobile')}
              placeholder="Search products..."
              className="w-full pl-4 pr-11 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
              {showMobileSearching ? (
                <div className="h-4.25 w-4.25 rounded-full border-2 border-orange-300 border-t-orange-500 animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              )}
            </button>

            <AnimatePresence>
              {activeSearchField === 'mobile' && (mobileSuggestions.length > 0 || showMobileNotFound || showMobileSearching) && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg shadow-black/10 overflow-hidden z-50"
                >
                  {showMobileSearching ? (
                    <div className="flex items-center gap-2.5 px-4 py-3.5">
                      <div className="h-4 w-4 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin shrink-0" />
                      <p className="text-sm text-gray-500">Searching products...</p>
                    </div>
                  ) : mobileSuggestions.length > 0 ? (
                    mobileSuggestions.map((product) => (
                      <Link
                        key={product.id}
                        href={product.path}
                        onClick={() => {
                          setMobileTopSearchQuery('')
                          setActiveSearchField(null)
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-orange-50 transition-colors"
                      >
                        <span className="relative h-10 w-10 rounded-md overflow-hidden bg-gray-100 shrink-0">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-gray-400">
                              AF
                            </span>
                          )}
                        </span>
                        <span className="text-sm text-gray-700 truncate">{product.name}</span>
                      </Link>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-sm text-gray-500">Product not found</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>

      {/* Desktop nav links */}
      <div className="hidden md:block border-t border-gray-100">
        <div className="container mx-auto px-4">
          <nav className="flex items-center h-11">
            {navLinks.map((link) => {
              const hasDropdown = link.dropdown || link.mega
              return (
                <div
                  key={link.label}
                  className="relative h-full"
                  onMouseEnter={() => hasDropdown && open(link.label)}
                  onMouseLeave={close}
                >
                  {hasDropdown ? (
                    <button
                      type="button"
                      onClick={() => open(link.label)}
                      className={`relative px-4 h-full flex items-center text-sm font-medium transition-colors duration-200 group ${activeDropdown === link.label
                        ? 'text-orange-500'
                        : 'text-gray-600 hover:text-orange-500'
                        }`}
                    >
                      {link.label}
                      <motion.svg
                        animate={{ rotate: activeDropdown === link.label ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        xmlns="http://www.w3.org/2000/svg"
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="ml-1"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </motion.svg>
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className={`relative px-4 h-full flex items-center text-sm font-medium transition-colors duration-200 group ${activeDropdown === link.label
                        ? 'text-orange-500'
                        : 'text-gray-600 hover:text-orange-500'
                        }`}
                    >
                      {link.label}
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                    </Link>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop dropdown panels */}
      <AnimatePresence>
        {activeLink?.dropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-0 right-0 bg-white border-t border-gray-100 shadow-xl shadow-black/5 hidden md:block"
            onMouseEnter={() => open(activeLink.label)}
            onMouseLeave={close}
          >
            <div className="container mx-auto px-4 py-4">
              {activeLink.label === 'Shop By Brand' ? (
                <div className="flex flex-col gap-3">
                  {/* Brand search */}
                  <div className="relative max-w-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      placeholder="Search brands..."
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:bg-white transition-all"
                    />
                    {brandSearch && (
                      <button onClick={() => setBrandSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </div>
                  {/* Brand grid with logos */}
                  <div className="grid grid-cols-4 gap-2">
                    {(brandSearch
                      ? shopBrandItems.filter((b) => b.label.toLowerCase().includes(brandSearch.toLowerCase()))
                      : navbarBrandItems
                    ).map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="flex items-center gap-2.5 rounded-xl border border-gray-100 px-3 py-2.5 text-sm text-gray-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 group"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                          {item.image ? (
                            <Image src={item.image} alt={item.label} width={32} height={32} className="h-full w-full object-cover" unoptimized />
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400">
                              {item.label.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')}
                            </span>
                          )}
                        </div>
                        <span className="truncate text-xs font-medium">{item.label}</span>
                      </Link>
                    ))}
                    {(brandSearch
                      ? shopBrandItems.filter((b) => b.label.toLowerCase().includes(brandSearch.toLowerCase()))
                      : navbarBrandItems
                    ).length === 0 && (
                      <p className="col-span-full py-4 text-center text-sm text-gray-400">No brands found</p>
                    )}
                  </div>
                  <Link
                    href="/by-brand"
                    className="inline-flex items-center justify-center rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-100"
                  >
                    View All Brands
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {(() => {
                    const items = activeLink.label === 'Shop Category'
                      ? (shopCategoryItems.length > 0 ? shopCategoryItems : [{ label: 'No categories found', href: '#' }])
                      : activeLink.dropdown.map((item) => ({
                          label: item,
                          href: `${activeLink.href}/${item.toLowerCase().replace(/\s+/g, '-')}`,
                        }))
                    return items.map((item) => (
                      <Link
                        key={`${activeLink.label}-${item.label}`}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-orange-400 transition-colors" />
                        {item.label}
                      </Link>
                    ))
                  })()}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeLink?.mega && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-0 right-0 bg-white border-t border-gray-100 shadow-xl shadow-black/5 hidden md:block"
            onMouseEnter={() => open(activeLink.label)}
            onMouseLeave={close}
          >
            <div className="container mx-auto px-4 pt-4 pb-5">
              {/* Search bar */}
              <div className="relative mb-4 max-w-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={megaSearch}
                  onChange={(e) => setMegaSearch(e.target.value)}
                  placeholder="Search rooms..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:bg-white transition-all"
                />
                {megaSearch && (
                  <button
                    onClick={() => setMegaSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                )}
              </div>

              {/* Columns */}
              {(() => {
                const q = megaSearch.trim().toLowerCase();
                const filtered = Object.keys(activeLink.mega!).filter((room) => room.toLowerCase().includes(q));

                if (filtered.length === 0) return (
                  <div className="py-6 text-center text-sm text-gray-400">
                    No rooms found for &quot;<span className="text-orange-500">{megaSearch}</span>&quot;
                  </div>
                );

                return (
                  <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
                    {filtered.map((room) => {
                      const roomSlug = room.toLowerCase().replace(/\s+/g, '-');
                      return (
                        <Link
                          key={room}
                          href={`/by-room/${roomSlug}`}
                          className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-150 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                            {roomIcons[room] ?? roomIcons.BEDROOM}
                          </span>
                          <span className="tracking-wide">{room}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="md:hidden border-t border-gray-100 bg-white max-h-[70vh] overflow-y-auto"
          >
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-0.5">
              {isLoggedIn ? (
                <div className="mb-3 rounded-2xl border border-orange-100 overflow-hidden shadow-sm">
                  {/* Profile header */}
                  {(() => {
                    const rank = meData?.rank ?? 0;
                    const tier = rank >= 5 ? 'Lifestyle Elite' : rank === 4 ? 'Lifestyle Consultant' : rank === 3 ? 'Home Stylist' : rank === 2 ? 'Home Builder' : 'Home Starter';
                    const badgeImg = tier === 'Lifestyle Elite' ? '/Badge/lifestyleElite.png' : tier === 'Lifestyle Consultant' ? '/Badge/lifestyleConsultant.png' : tier === 'Home Stylist' ? '/Badge/homeStylist.png' : tier === 'Home Builder' ? '/Badge/homeBuilder.png' : '/Badge/homeStarter.png';
                    const gradient = tier === 'Lifestyle Elite' ? 'from-amber-400 via-orange-400 to-rose-400' : tier === 'Lifestyle Consultant' ? 'from-violet-500 to-purple-600' : tier === 'Home Stylist' ? 'from-sky-400 to-blue-500' : tier === 'Home Builder' ? 'from-emerald-400 to-teal-500' : 'from-orange-400 to-amber-500';
                    return (
                      <div className={`bg-gradient-to-br ${gradient} px-4 pt-4 pb-10 relative overflow-hidden`}>
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 15% 60%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 85% 15%, rgba(255,255,255,0.12) 0%, transparent 45%)' }} />
                        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                        <div className="relative flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-semibold text-white/70 uppercase tracking-widest mb-0.5">Member Tier</p>
                            <p className="text-base font-bold text-white leading-tight">{tier}</p>
                          </div>
                          <div className="rounded-2xl bg-white/25 backdrop-blur-md p-2 border border-white/40 shadow-xl shrink-0">
                            <img src={badgeImg} alt={tier} className="h-14 w-14 object-contain drop-shadow-lg" />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Avatar + info */}
                  <div className="px-4 -mt-8 pb-4 bg-white">
                    {/* Avatar row — overlapping the banner */}
                    <div className="flex items-end justify-between mb-2">
                      <div className="relative shrink-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={user?.name || 'Profile'}
                            className="h-16 w-16 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                          />
                        ) : (
                          <span className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white text-xl font-bold ring-4 ring-white shadow-lg">
                            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                          </span>
                        )}
                        <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-white" />
                      </div>
                    </div>
                    {/* Name / email / username — clearly in white area */}
                    <div className="mb-3">
                      <p className="text-base font-bold text-gray-900 leading-tight">{user?.name ?? 'User'}</p>
                      {user?.email && (
                        <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                      )}
                      {meData?.username && (
                        <p className="text-xs text-orange-500 font-medium mt-0.5">@{meData.username}</p>
                      )}
                    </div>

                    {/* Quick action links */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        { href: '/profile', label: 'My Profile', sub: 'View & edit info', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></> },
                        { href: '/orders', label: 'My Orders', sub: 'Track purchases', icon: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></> },
                        { href: '/wishlist', label: 'Wishlist', sub: 'Saved items', icon: <path d="m12 21-1.45-1.32C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4 5 5 0 0 1 12 6.09 5 5 0 0 1 17.5 4 4.5 4.5 0 0 1 22 8.5c0 3.78-3.4 6.86-8.55 11.18z"/> },
                        { href: '/track-order', label: 'Track Order', sub: 'Order status', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="group flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 hover:border-orange-200 hover:bg-orange-50 px-3 py-2.5 transition-colors"
                        >
                          <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-white shadow-sm group-hover:bg-orange-100 transition-colors shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 group-hover:text-orange-600 transition-colors">
                              {item.icon}
                            </svg>
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 leading-tight">{item.label}</p>
                            <p className="text-[10px] text-gray-400 leading-tight">{item.sub}</p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Logout */}
                    <button
                      onClick={() => { handleCustomerLogout('/'); setMobileOpen(false); }}
                      disabled={isLoggingOut}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors disabled:opacity-60"
                    >
                      {isLoggingOut ? (
                        <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                      )}
                      {isLoggingOut ? 'Logging out...' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-3 rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-br from-slate-700 to-slate-900 px-4 py-5 flex items-center gap-3">
                    <span className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/10 border border-white/20 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/70">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">Welcome to AF Home</p>
                      <p className="text-xs text-white/60 mt-0.5">Sign in to access your account</p>
                    </div>
                  </div>
                  <div className="bg-white px-4 py-3 flex gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/track-order"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors"
                    >
                      Track Order
                    </Link>
                  </div>
                </div>
              )}
              {navLinks.map((link) => {
                const hasChildren = link.dropdown || link.mega
                const isExpanded = mobileExpanded === link.label

                const subItems = link.dropdown
                  ? (
                    link.label === 'Shop Category'
                      ? (
                          shopCategoryItems.length > 0
                            ? shopCategoryItems
                            : [{ label: 'No categories found', href: '#' }]
                        )
                      : link.label === 'Shop By Brand'
                        ? (
                            navbarBrandItems.length > 0
                              ? navbarBrandItems
                              : [{ label: 'No brands found', href: '/by-brand' }]
                        )
                      : link.dropdown.map((item) => ({
                          label: item,
                          href: `${link.href}/${item.toLowerCase().replace(/\s+/g, '-')}`,
                        }))
                  )
                  : []

                return (
                  <div key={link.label}>
                    {hasChildren ? (
                      <button
                        onClick={() => {
                          setMobileExpanded(isExpanded ? null : link.label)
                          setMobileSearch('')
                          setMobileBrandSearch('')
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
                      >
                        {link.label}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {link.label}
                      </Link>
                    )}

                    {/* Mobile sub-items with grid animation */}
                    <div
                      className="grid transition-[grid-template-rows] duration-300 ease-out"
                      style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                    >
                      <div className="overflow-hidden">
                        {link.mega ? (
                          /* Mega menu — search + grouped rooms */
                          <div className="ml-4 pl-4 border-l-2 border-orange-200 py-2 space-y-1">
                            {/* Search */}
                            <div className="relative mb-3">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                              </svg>
                              <input
                                type="text"
                                value={mobileSearch}
                                onChange={(e) => setMobileSearch(e.target.value)}
                                placeholder="Search items..."
                                className="w-full pl-8 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:bg-white transition-all"
                              />
                              {mobileSearch && (
                                <button onClick={() => setMobileSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                              )}
                            </div>

                            {/* Rooms */}
                            {(() => {
                              const q = mobileSearch.trim().toLowerCase();
                              const rooms = Object.keys(link.mega!).filter((room) => room.toLowerCase().includes(q));

                              if (rooms.length === 0) return (
                                <p className="px-3 py-3 text-xs text-gray-400 text-center">
                                  No rooms found for &quot;<span className="text-orange-500">{mobileSearch}</span>&quot;
                                </p>
                              );

                              return rooms.map((room) => {
                                const roomSlug = room.toLowerCase().replace(/\s+/g, '-');
                                return (
                                  <div key={room} className="mb-2">
                                    <Link
                                      href={`/by-room/${roomSlug}`}
                                      className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                                      onClick={() => setMobileOpen(false)}
                                    >
                                      <span className="text-orange-500">{roomIcons[room] ?? roomIcons.BEDROOM}</span>
                                      <span className="text-xs font-bold tracking-wider text-orange-600">{room}</span>
                                    </Link>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        ) : link.label === 'Shop By Brand' ? (
                          /* Brand dropdown — search + logos */
                          <div className="ml-4 pl-4 border-l-2 border-orange-200 py-2 space-y-2">
                            {/* Search */}
                            <div className="relative">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                              </svg>
                              <input
                                type="text"
                                value={mobileBrandSearch}
                                onChange={(e) => setMobileBrandSearch(e.target.value)}
                                placeholder="Search brands..."
                                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                              />
                            </div>
                            {/* Brand list with logos */}
                            {(mobileBrandSearch
                              ? shopBrandItems.filter((b) => b.label.toLowerCase().includes(mobileBrandSearch.toLowerCase()))
                              : navbarBrandItems
                            ).map((item) => (
                              <Link
                                key={item.id}
                                href={item.href}
                                className="flex items-center gap-2.5 rounded-xl border border-gray-100 px-3 py-2 text-sm text-gray-500 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                                onClick={() => setMobileOpen(false)}
                              >
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                                  {item.image ? (
                                    <Image src={item.image} alt={item.label} width={28} height={28} className="h-full w-full object-cover" unoptimized />
                                  ) : (
                                    <span className="text-[9px] font-bold text-gray-400">
                                      {item.label.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')}
                                    </span>
                                  )}
                                </div>
                                <span className="truncate text-xs">{item.label}</span>
                              </Link>
                            ))}
                            <Link
                              href="/by-brand"
                              className="mt-1 inline-flex items-center rounded-lg bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-100"
                              onClick={() => setMobileOpen(false)}
                            >
                              View All Brands
                            </Link>
                          </div>
                        ) : (
                          /* Regular dropdown */
                          <div className="ml-4 pl-4 border-l-2 border-orange-200 py-1">
                            {subItems.map((item) => (
                              <Link
                                key={item.label}
                                href={item.href}
                                className="block px-3 py-1.5 text-sm text-gray-500 hover:text-orange-500 rounded-lg transition-colors"
                                onClick={() => setMobileOpen(false)}
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

