'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import Pusher from 'pusher-js'
import { Card } from '@heroui/react/card'
import { Label } from '@heroui/react/label'
import { SearchField } from '@heroui/react/search-field'
import { useCart } from '@/context/CartContext'
import { useSession, signOut } from 'next-auth/react'
import { useLogoutMutation } from '@/store/api/authApi'
import { baseApi, clearAccessTokenCache } from '@/store/api/baseApi'
import type { Category } from '@/store/api/categoriesApi'
import { useGetPublicProductsQuery } from '@/store/api/productsApi'
import { useSaveSearchHistoryMutation, useGetSearchHistoryQuery, useClearSearchHistoryMutation, useDeleteSearchHistoryItemMutation } from '@/store/api/searchApi'
import { useGetPublicWebPageItemsQuery } from '@/store/api/webPagesApi'
import formatPrice from '@/helpers/FormatPrice'
import { useMeQuery } from '@/store/api/userApi'
import { customerNotificationsApi, CustomerNotificationItem, useGetCustomerNotificationsQuery } from '@/store/api/customerNotificationsApi'
import { useGetWishlistQuery } from '@/store/api/wishlistApi'
import { useWishlist } from '@/context/WishlistContext'
import { useRouter, usePathname } from 'next/navigation'
import { useAppDispatch } from '@/store/hooks'
import { ROOM_OPTIONS } from '@/libs/roomConfig'
import { useGetPublicProductBrandsQuery } from '@/store/api/productBrandsApi'
import { getPartnerStorefrontConfig } from '@/libs/partnerStorefront'
import { buildStorefrontProductPath, extractPartnerSlugFromPath } from '@/libs/storefrontRouting'
import PrimaryButton from '@/components/ui/buttons/PrimaryButton'
import OutlineButton from '@/components/ui/buttons/OutlineButton'
import ThemeToggle from '@/components/ui/buttons/ThemeToggle'
import { getProfileCompletion } from '@/libs/profileCompletion'
import AppPromoBar from '@/components/layout/AppPromoBar'

type NavLink = {
  label: string;
  href: string;
  dropdown?: string[]
  mega?: Record<string, string[]>
}

type CustomerRealtimeNotificationEvent = Partial<CustomerNotificationItem> & {
  created_at?: string
  description?: string
}

const REALTIME_NOTIFICATION_DURATION_SECONDS = 10

const getCustomerNotificationReadKey = (item: { id: string; title: string; description: string; count: number }) =>
  `${item.id}:${item.title}:${item.description}:${item.count}`

const normalizeCustomerNotificationTimestamp = (raw: string) => {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed)
  if (hasTimezone) return trimmed
  const isoLike = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')
  return `${isoLike}+08:00`
}

const getCustomerNotificationTimestamp = (value: string | null | undefined) => {
  if (!value) return 0
  const timestamp = new Date(normalizeCustomerNotificationTimestamp(value)).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

const formatCustomerNotificationTime = (value: string | null | undefined) => {
  if (!value) return null
  const normalized = normalizeCustomerNotificationTimestamp(value)
  let date = new Date(normalized)
  if (Number.isNaN(date.getTime())) {
    date = new Date(value)
  }
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

const navLinks: NavLink[] = [
  { label: 'Home', href: '/shop' },
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
  { label: 'Community', href: '/community' },
]

const toSlug = (value: string) => value.toLowerCase().trim().replace(/\s+/g, '-');

const normalizeCategorySlug = (rawUrl: string | null | undefined, fallbackName: string) => {
  const source = decodeURIComponent(String(rawUrl ?? '').trim());
  if (!source || source === '0') return toSlug(fallbackName);

  const withoutDomain = source.replace(/^https?:\/\/[^/]+/i, '');
  const withoutQuery = withoutDomain.split(/[?#]/)[0] ?? withoutDomain;
  const cleaned = withoutQuery
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^shop\/category\//i, '')
    .replace(/^shop\//i, '')
    .replace(/^category\//i, '')
    .replace(/\/+$/, '');

  const segment = cleaned.split('/').filter(Boolean).pop() ?? cleaned;
  return toSlug(segment || fallbackName);
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

// Helper function to highlight search term in text
const highlightText = (text: string, searchTerm: string): Array<{ type: 'highlight' | 'normal'; text: string }> => {
  if (!searchTerm.trim()) return [{ type: 'normal', text }]

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, i) =>
    regex.test(part) ? { type: 'highlight', text: part } : { type: 'normal', text: part }
  )
}

type NavbarProps = {
  initialCategories?: Category[]
  logoSrc?: string
  logoAlt?: string
  logoHref?: string
  hideSignIn?: boolean
  hideNavLinks?: boolean
  categoryOnlyNav?: boolean
  stickToTop?: boolean
  showGuestCartWishlist?: boolean
  noBorder?: boolean
}

function NavbarInner({
  initialCategories = [],
  logoSrc = '/Images/af_home_logo.png',
  logoAlt = 'AF Home',
  logoHref = '/shop',
  hideSignIn = false,
  hideNavLinks = false,
  categoryOnlyNav = false,
  stickToTop = false,
  showGuestCartWishlist = false,
  noBorder = false,
}: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notifMenuOpen, setNotifMenuOpen] = useState(false)
  const [searchModalQuery, setSearchModalQuery] = useState('')
  const [megaSearch, setMegaSearch] = useState('')
  const [mobileSearch, setMobileSearch] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  const [mobileBrandSearch, setMobileBrandSearch] = useState('')
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false)
  const [registrationEmail, setRegistrationEmail] = useState('')
  const { cartCount, setIsOpen } = useCart()
  const { isOpen: isWishlistOpen, setIsOpen: setWishlistOpen } = useWishlist()
  const dispatch = useAppDispatch()
  const { data: session, status } = useSession();
  const user = session?.user
  const role = String(user?.role ?? '').toLowerCase()
  const isCustomerSession = status === 'authenticated' && (role === 'customer' || role === '')
  const { data: meData } = useMeQuery(undefined, { skip: !isCustomerSession })
  const [logoutApi] = useLogoutMutation();
  const isLoggedIn = isCustomerSession
  const avatarUrl = isCustomerSession ? (meData?.avatar_url || user?.image || null) : null
  const customerNotificationCacheKey = String(meData?.id ?? user?.id ?? 'guest')
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
  const customerNotificationSurfacedStorageKey = `afhome-customer-notif-surfaced:${customerNotificationCacheKey}`
  const {
    data: wishlist = [],
  } = useGetWishlistQuery(undefined, {
    skip: !isLoggedIn || hideSignIn,
  })
  const [readCustomerNotificationKeys, setReadCustomerNotificationKeys] = useState<string[]>([])
  const [surfacedCustomerNotificationKeys, setSurfacedCustomerNotificationKeys] = useState<string[]>([])
  const [realtimeNotification, setRealtimeNotification] = useState<CustomerNotificationItem | null>(null)
  const [freshRealtimeNotificationIds, setFreshRealtimeNotificationIds] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [diPhase, setDiPhase] = useState<'pill' | 'expanded'>('pill')

  useEffect(() => {
    if (!realtimeNotification) return

    const timeoutId = window.setTimeout(() => setRealtimeNotification(null), REALTIME_NOTIFICATION_DURATION_SECONDS * 1000)
    return () => window.clearTimeout(timeoutId)
  }, [realtimeNotification])

  useEffect(() => {
    if (!freshRealtimeNotificationIds.length) return

    const timeoutId = window.setTimeout(() => setFreshRealtimeNotificationIds([]), 120000)
    return () => window.clearTimeout(timeoutId)
  }, [freshRealtimeNotificationIds])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!realtimeNotification) {
      setDiPhase('pill')
      return
    }
    setDiPhase('pill')
    const t = window.setTimeout(() => setDiPhase('expanded'), 380)
    return () => window.clearTimeout(t)
  }, [realtimeNotification])

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    const apiBaseUrl = (process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').replace(/\/+$/, '')
    const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken
    const customerId = meData?.id

    if (!isCustomerSession || !customerId || !accessToken || !pusherKey || !pusherCluster || !apiBaseUrl) {
      return
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      channelAuthorization: {
        endpoint: `${apiBaseUrl}/api/realtime/pusher/auth`,
        transport: 'ajax',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      },
    })

    const channelName = `private-customer-${customerId}`
    const channel = pusher.subscribe(channelName)
    const onNotificationCreated = (event: CustomerRealtimeNotificationEvent) => {
      const item: CustomerNotificationItem = {
        id: String(event.id ?? `realtime:${Date.now()}`),
        title: event.title ?? 'New notification',
        description: event.description ?? '',
        count: Number(event.count ?? 1),
        severity: event.severity ?? 'success',
        href: event.href ?? '/profile?tab=encashment',
        latest_at: event.latest_at ?? event.created_at ?? new Date().toISOString(),
      }

      dispatch(
        customerNotificationsApi.util.updateQueryData('getCustomerNotifications', customerNotificationCacheKey, (draft) => {
          const existingIndex = draft.items.findIndex((existing) => existing.id === item.id)
          if (existingIndex >= 0) {
            draft.items.splice(existingIndex, 1)
          }
          draft.items.unshift(item)
          draft.unread_count = Number(draft.unread_count ?? 0) + item.count
          draft.generated_at = new Date().toISOString()
        }),
      )
      dispatch(baseApi.util.invalidateTags(['Encashment', 'CustomerNotifications']))
      const readKey = getCustomerNotificationReadKey(item)
      setSurfacedCustomerNotificationKeys((current) => (
        current.includes(readKey) ? current : [...current, readKey]
      ))
      setFreshRealtimeNotificationIds((current) => [item.id, ...current.filter((id) => id !== item.id)].slice(0, 5))
      setRealtimeNotification(item)
      refetchNotifications()
    }

    channel.bind('notification.created', onNotificationCreated)

    return () => {
      channel.unbind('notification.created', onNotificationCreated)
      pusher.unsubscribe(channelName)
      pusher.disconnect()
    }
  }, [customerNotificationCacheKey, dispatch, isCustomerSession, meData?.id, refetchNotifications, session?.user])

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const notifMenuRef = useRef<HTMLDivElement | null>(null)
  const readNotificationsHydratedRef = useRef(false)
  const surfacedNotificationsHydratedRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const isProfileComplete = useMemo(() => {
    if (!meData) return false
    return getProfileCompletion(meData).complete
  }, [meData])

  useEffect(() => {
    if (!isLoggedIn || pathname !== '/shop' || isProfileComplete) {
      setShowRegistrationPrompt(false)
      setRegistrationEmail('')
      return
    }

    if (typeof window === 'undefined') return

    const storedEmail = window.localStorage.getItem('afhome_new_registration_email')?.trim() ?? ''
    setRegistrationEmail(storedEmail)
    setShowRegistrationPrompt(true)
  }, [isLoggedIn, pathname, isProfileComplete])

  const activeSearchQuery = searchModalQuery.trim()
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(activeSearchQuery)
  const [isSubmittingSearch, setIsSubmittingSearch] = useState(false)
  const partnerSlug = useMemo(() => extractPartnerSlugFromPath(pathname), [pathname])
  const signInHref = partnerSlug
    ? `/${partnerSlug}/login?switch=1`
    : '/login'
  const logoutRedirectHref = partnerSlug
    ? `/${partnerSlug}/login?switch=1&logged_out=1`
    : '/login?logged_out=1'
  const trackOrderHref = partnerSlug ? `/${partnerSlug}/track-order` : '/track-order'
  const profileHref = partnerSlug ? `/${partnerSlug}/profile` : '/profile'
  const ordersHref = partnerSlug ? `/${partnerSlug}/orders` : '/orders'
  const wishlistHref = partnerSlug ? `/${partnerSlug}/wishlist` : '/wishlist'
  const isPartnerSearchScoped = showGuestCartWishlist && Boolean(partnerSlug)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(activeSearchQuery)
    }, 180)
    return () => clearTimeout(timeoutId)
  }, [activeSearchQuery])

  const { data: searchedProductsData, isFetching: isSearchingProducts } = useGetPublicProductsQuery(
    {
      page: 1,
      perPage: 50,
      search: debouncedSearchQuery,
    },
    {
      skip: debouncedSearchQuery.length < 2,
    },
  )
  const { data: partnerStorefrontData } = useGetPublicWebPageItemsQuery('partner-storefront', {
    skip: !isPartnerSearchScoped,
  })
  const partnerSelectedProductIdSet = useMemo(() => {
    if (!isPartnerSearchScoped) return null
    const storefrontItems = partnerStorefrontData?.items ?? []
    const matched = storefrontItems.find((item) => getPartnerStorefrontConfig(item)?.slug === partnerSlug)
    const config = getPartnerStorefrontConfig(matched)
    if (!config) return new Set<number>()
    return new Set(config.featuredProductIds)
  }, [isPartnerSearchScoped, partnerStorefrontData?.items, partnerSlug])

  // Search history hooks - only fetch if user is authenticated
  const [saveSearchHistory] = useSaveSearchHistoryMutation()
  const [clearSearchHistory] = useClearSearchHistoryMutation()
  const [deleteSearchHistoryItem] = useDeleteSearchHistoryItemMutation()
  const { data: searchHistoryData, isLoading: isLoadingSearchHistory, refetch: refetchSearchHistory } = useGetSearchHistoryQuery(undefined, {
    skip: !searchModalOpen || status !== 'authenticated',
  })

  const searchedProducts = useMemo(() => {
    const rows = searchedProductsData?.products ?? []
    const normalizedQuery = debouncedSearchQuery.trim().toLowerCase()
    return rows
      .map((product) => {
        const name = String(product.name ?? '').trim()
        if (!name) return null
        const nameLower = name.toLowerCase()
        if (normalizedQuery) {
          if (!nameLower.includes(normalizedQuery)) return null
        }
        const imageFromArray = Array.isArray(product.images)
          ? product.images.find((item) => typeof item === 'string' && item.trim().length > 0)
          : null
        const image = product.image || imageFromArray || null
        const slug = toSlug(name)
        const id = typeof product.id === 'number' ? product.id : null
        if (isPartnerSearchScoped) {
          if (!partnerSelectedProductIdSet || partnerSelectedProductIdSet.size === 0) return null
          if (!id || !partnerSelectedProductIdSet.has(id)) return null
        }
        const priceMember = typeof product.priceMember === 'number' ? product.priceMember : null
        const priceDp = typeof product.priceDp === 'number' ? product.priceDp : null
        const priceSrp = typeof product.priceSrp === 'number' ? product.priceSrp : null
        const prodpv = typeof product.prodpv === 'number' ? product.prodpv : null
        return {
          id: id ?? slug,
          name,
          image,
          path: buildStorefrontProductPath(name, id ?? undefined, pathname),
          priceMember,
          priceDp,
          priceSrp,
          prodpv,
        }
      })
      .filter(
        (
          product,
        ): product is {
          id: number | string
          name: string
          image: string | null
          path: string
          priceMember: number | null
          priceDp: number | null
          priceSrp: number | null
          prodpv: number | null
        } => Boolean(product),
      )
  }, [searchedProductsData?.products, debouncedSearchQuery, isPartnerSearchScoped, partnerSelectedProductIdSet, pathname])

  const showSearchNotFound =
    searchModalOpen &&
    activeSearchQuery.length >= 2 &&
    !isSearchingProducts &&
    searchedProducts.length === 0
  const showSearchSearching =
    searchModalOpen &&
    activeSearchQuery.length >= 2 &&
    isSearchingProducts

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    if (!searchModalOpen) return

    const timeoutId = window.setTimeout(() => {
      searchInputRef.current?.focus()
    }, 80)

    // Refetch search history when modal opens (if authenticated)
    if (status === 'authenticated') {
      refetchSearchHistory()
    }

    return () => window.clearTimeout(timeoutId)
  }, [searchModalOpen, status, refetchSearchHistory])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const originalOverflow = document.body.style.overflow

    if (searchModalOpen) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [searchModalOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+K (or Cmd+K on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        setSearchModalOpen(true)
      }
      // Check for Escape to close
      if (event.key === 'Escape' && searchModalOpen) {
        setSearchModalOpen(false)
        setSearchModalQuery('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchModalOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return

    readNotificationsHydratedRef.current = false
    let nextReadKeys: string[] = []

    try {
      const stored = window.localStorage.getItem(customerNotificationStorageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        nextReadKeys = Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : []
      }
    } catch {
      nextReadKeys = []
    }

    const timeoutId = window.setTimeout(() => {
      readNotificationsHydratedRef.current = true
      setReadCustomerNotificationKeys(nextReadKeys)
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [customerNotificationStorageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!readNotificationsHydratedRef.current) return

    try {
      window.localStorage.setItem(customerNotificationStorageKey, JSON.stringify(readCustomerNotificationKeys))
    } catch {
      // Ignore localStorage write failures.
    }
  }, [customerNotificationStorageKey, readCustomerNotificationKeys])

  useEffect(() => {
    if (typeof window === 'undefined') return

    surfacedNotificationsHydratedRef.current = false
    let nextSurfacedKeys: string[] = []

    try {
      const stored = window.localStorage.getItem(customerNotificationSurfacedStorageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        nextSurfacedKeys = Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : []
      }
    } catch {
      nextSurfacedKeys = []
    }

    const timeoutId = window.setTimeout(() => {
      surfacedNotificationsHydratedRef.current = true
      setSurfacedCustomerNotificationKeys(nextSurfacedKeys)
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [customerNotificationSurfacedStorageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!surfacedNotificationsHydratedRef.current) return

    try {
      window.localStorage.setItem(customerNotificationSurfacedStorageKey, JSON.stringify(surfacedCustomerNotificationKeys))
    } catch {
      // Ignore localStorage write failures.
    }
  }, [customerNotificationSurfacedStorageKey, surfacedCustomerNotificationKeys])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedOutsideProfile = !profileMenuRef.current || !profileMenuRef.current.contains(target)
      const clickedOutsideNotifications = !notifMenuRef.current || !notifMenuRef.current.contains(target)

      if (clickedOutsideProfile) {
        setProfileMenuOpen(false)
      }
      if (clickedOutsideNotifications) {
        setNotifMenuOpen(false)
      }
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileMenuOpen(false)
      if (event.key === 'Escape') setNotifMenuOpen(false)
      if (event.key === 'Escape') {
        setSearchModalOpen(false)
        setSearchModalQuery('')
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        setSearchModalOpen(true)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [])

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

  useEffect(() => {
    if (!isCustomerSession || isNotificationsLoading) return
    if (!visibleCustomerNotifications.length || realtimeNotification) return

    const nextUnreadNotification = visibleCustomerNotifications.find((item) => {
      const readKey = getCustomerNotificationReadKey(item)
      return !readCustomerNotificationKeys.includes(readKey) && !surfacedCustomerNotificationKeys.includes(readKey)
    })

    if (!nextUnreadNotification) return

    const timeoutId = window.setTimeout(() => {
      const readKey = getCustomerNotificationReadKey(nextUnreadNotification)
      setSurfacedCustomerNotificationKeys((current) => (
        current.includes(readKey) ? current : [...current, readKey]
      ))
      setFreshRealtimeNotificationIds((current) => [
        nextUnreadNotification.id,
        ...current.filter((id) => id !== nextUnreadNotification.id),
      ].slice(0, 5))
      setRealtimeNotification(nextUnreadNotification)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [
    isCustomerSession,
    isNotificationsLoading,
    readCustomerNotificationKeys,
    realtimeNotification,
    surfacedCustomerNotificationKeys,
    visibleCustomerNotifications,
  ])

  useEffect(() => {
    if (!notifMenuOpen) return
    if (!visibleCustomerNotifications.length) return
    const timeoutId = window.setTimeout(markAllCustomerNotificationsAsRead, 0)
    return () => window.clearTimeout(timeoutId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifMenuOpen])

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

  const activeLink = useMemo(() => {
    const links = categoryOnlyNav
      ? [{ label: 'Shop Category', href: '/category', dropdown: [] as string[] }]
      : navLinks
    return links.find((l) => l.label === activeDropdown)
  }, [activeDropdown, categoryOnlyNav])
  const shopCategoryItems = useMemo(() => {
    const scopedItems = initialCategories.map((category) => {
      const urlPart = normalizeCategorySlug(category.url, category.name)
      const href = partnerSlug ? `/${partnerSlug}/${urlPart}` : `/category/${urlPart}`
      return { label: category.name, href }
    })
    if (partnerSlug) {
      const interiorLabel = 'Interior Services'
      const interiorSlug = normalizeCategorySlug(undefined, interiorLabel)
      const interiorHref = `/${partnerSlug}/${interiorSlug}`
      const nonInteriorItems = scopedItems.filter((item) => item.label.trim().toLowerCase() !== interiorLabel.toLowerCase())
      const orderedScopedItems = [...nonInteriorItems, { label: interiorLabel, href: interiorHref }]
      return [
        { label: 'Home', href: `/${partnerSlug}` },
        { label: 'All Category', href: `/${partnerSlug}/product` },
        ...orderedScopedItems,
      ]
    }
    return scopedItems
  }, [initialCategories, partnerSlug])
  const displayNavLinks = useMemo<NavLink[]>(() => {
    if (categoryOnlyNav) {
      return shopCategoryItems.map((item) => ({ label: item.label, href: item.href }))
    }
    return navLinks
  }, [categoryOnlyNav, shopCategoryItems])
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

  const saveSearchToHistory = async (query: string) => {
    const q = query.trim()
    if (!q) return

    try {
      await saveSearchHistory({ query: q }).unwrap()
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }

  const handleProductSearchSubmit = async (query: string) => {
    const q = query.trim()
    if (!q || isSubmittingSearch) return

    // Prevent multiple submissions
    setIsSubmittingSearch(true)

    try {
      // Save search to history
      await saveSearchToHistory(q)

      // Navigate to search results page with the query
      router.push(`/search?q=${encodeURIComponent(q)}`)
      setSearchModalQuery('')
      setSearchModalOpen(false)
      setMobileOpen(false)
    } finally {
      setIsSubmittingSearch(false)
    }
  }

  const getNotificationIcon = (title: string) => {
    const t = title.toLowerCase()
    const iconClass = 'h-4 w-4'
    if (t.includes('encashment') || t.includes('wallet') || t.includes('payment') || t.includes('earning')) {
      return {
        bg: 'bg-amber-100 dark:bg-amber-500/15',
        icon: <svg className={`${iconClass} text-amber-600 dark:text-amber-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      }
    }
    if (t.includes('verification') || t.includes('kyc') || t.includes('verified') || t.includes('approved')) {
      return {
        bg: 'bg-emerald-100 dark:bg-emerald-500/15',
        icon: <svg className={`${iconClass} text-emerald-600 dark:text-emerald-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      }
    }
    if (t.includes('order') || t.includes('purchase') || t.includes('progress')) {
      return {
        bg: 'bg-blue-100 dark:bg-blue-500/15',
        icon: <svg className={`${iconClass} text-blue-600 dark:text-blue-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
      }
    }
    if (t.includes('shipping') || t.includes('delivery') || t.includes('dispatch') || t.includes('track')) {
      return {
        bg: 'bg-violet-100 dark:bg-violet-500/15',
        icon: <svg className={`${iconClass} text-violet-600 dark:text-violet-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>,
      }
    }
    if (t.includes('promo') || t.includes('sale') || t.includes('discount') || t.includes('offer')) {
      return {
        bg: 'bg-pink-100 dark:bg-pink-500/15',
        icon: <svg className={`${iconClass} text-pink-600 dark:text-pink-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
      }
    }
    return {
      bg: 'bg-slate-100 dark:bg-slate-800',
      icon: <svg className={`${iconClass} text-slate-500 dark:text-slate-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    }
  }

  const handleCustomerLogout = async () => {
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
        callbackUrl: logoutRedirectHref,
      })
      let safeRedirect = logoutRedirectHref
      const returnedUrl = result?.url
      if (returnedUrl && typeof window !== 'undefined') {
        try {
          const parsed = new URL(returnedUrl, window.location.origin)
          safeRedirect = parsed.origin === window.location.origin
            ? `${parsed.pathname}${parsed.search}${parsed.hash}`
            : logoutRedirectHref
        } catch {
          safeRedirect = logoutRedirectHref
        }
      }

      router.replace(safeRedirect)
      router.refresh()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
    <AppPromoBar />
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`sticky ${stickToTop ? 'top-0' : 'top-8'} z-50 !bg-white dark:!bg-gray-900 ${noBorder ? 'border-0 dark:border-0' : 'dark:border-b dark:border-gray-800'} transition-all duration-300 ${scrolled ? 'shadow-lg shadow-black/5 dark:shadow-black/20' : 'shadow-sm'}`}
    >
      <AnimatePresence>
        {isLoggedIn && !isProfileComplete && meData && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-b border-sky-100 bg-sky-50/95 text-sm text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200"
          >
            <div className="container mx-auto flex min-h-11 items-center justify-between gap-4 px-4 py-2">
              <p className="flex-1 font-medium leading-snug">
                Your profile is incomplete.{' '}
                <Link href={profileHref} className="font-semibold text-sky-600 underline underline-offset-4 transition hover:text-sky-700 dark:text-sky-300 dark:hover:text-sky-200">
                  Complete your profile
                </Link>
                {' '}to unlock all features and get the best shopping experience.
              </p>
              <Link
                href={profileHref}
                className="shrink-0 rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-600 dark:hover:bg-sky-700"
              >
                Update Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left Section - Logo */}
          <Link href={logoHref} className="flex items-center shrink-0">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Search - Centered */}
          <div className="flex-1 max-w-lg hidden md:flex md:justify-center">
            <SearchField aria-label="Open product search" className="w-full">
              <Label className="sr-only">Search</Label>
              <SearchField.Group
                className="flex h-10 cursor-pointer items-center gap-2.5 rounded-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm transition-all duration-200 hover:border-slate-300 dark:hover:border-gray-600 hover:shadow-md"
                onClick={() => setSearchModalOpen(true)}
              >
                <SearchField.SearchIcon className="h-4 w-4 text-slate-400 shrink-0" />
                <SearchField.Input
                  readOnly
                  placeholder="Search products..."
                  onFocus={() => setSearchModalOpen(true)}
                  className="flex-1 cursor-pointer border-none bg-transparent p-0 text-sm text-slate-500 dark:text-gray-300 outline-none placeholder:text-slate-400 dark:placeholder:text-gray-500"
                />
                <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:text-gray-400 shadow-sm">
                  Ctrl K
                </kbd>
              </SearchField.Group>
            </SearchField>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-1">
            {/* Auth actions */}
            {isLoggedIn && !hideSignIn ? (
              <>
                <button
                    onClick={() => setWishlistOpen(true)}
                    className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer text-slate-600 dark:text-gray-300"
                    title="Wishlist"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {wishlist.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-sky-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                        {wishlist.length > 99 ? '99+' : wishlist.length}
                      </span>
                    )}
                  </button>
                <div className="relative" ref={notifMenuRef}>
                  {/* Bell button */}
                  <button
                    onClick={() => {
                      setNotifMenuOpen((prev) => !prev)
                      setProfileMenuOpen(false)
                      if (!notifMenuOpen) refetchNotifications()
                    }}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-all hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Notifications"
                  >
                    <motion.div
                      key={unreadNotificationCount}
                      animate={unreadNotificationCount > 0 ? { rotate: [0, -18, 18, -12, 12, -6, 6, 0] } : {}}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </motion.div>
                    {unreadNotificationCount > 0 && (
                      <>
                        <span className="absolute -top-0.5 -right-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                          {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                        </span>
                        <span className="absolute -top-0.5 -right-0.5 h-5 w-5 animate-ping rounded-full bg-red-400 opacity-60" />
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {notifMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed left-2 right-2 top-16 z-50 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-700/60 dark:bg-slate-900 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96"
                      >
                        {/* Header */}
                        <div className="relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent dark:from-violet-500/20 dark:via-purple-500/10" />
                          <div className="relative flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-purple-500/25">
                                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                                {unreadNotificationCount > 0 ? (
                                  <p className="text-xs font-medium text-violet-600 dark:text-violet-400">{unreadNotificationCount} unread</p>
                                ) : (
                                  <p className="text-xs text-slate-400 dark:text-slate-500">All caught up</p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={markAllCustomerNotificationsAsRead}
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-50 active:bg-violet-100 dark:text-violet-400 dark:hover:bg-violet-500/10"
                            >
                              Mark all read
                            </button>
                          </div>
                          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
                        </div>

                        {/* List */}
                        <div className="max-h-[60vh] overflow-y-auto overscroll-contain sm:max-h-[420px]">
                          {isNotificationsLoading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-12">
                              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500 dark:border-slate-700 dark:border-t-violet-400" />
                              <p className="text-xs text-slate-500 dark:text-slate-400">Loading notifications...</p>
                            </div>
                          ) : isNotificationsError ? (
                            <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
                                <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-red-500 dark:text-red-400">Failed to load</p>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Please try again later</p>
                              </div>
                            </div>
                          ) : visibleCustomerNotifications.length ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                              {visibleCustomerNotifications.map((item, idx) => {
                                const isRead = readCustomerNotificationKeys.includes(getCustomerNotificationReadKey(item))
                                const isFreshRealtime = freshRealtimeNotificationIds.includes(item.id)
                                const notifIcon = getNotificationIcon(item.title)
                                return (
                                  <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.035, duration: 0.2 }}
                                  >
                                    <Link
                                      href={item.href}
                                      onClick={() => {
                                        markCustomerNotificationAsRead(item)
                                        setFreshRealtimeNotificationIds((current) => current.filter((id) => id !== item.id))
                                        setNotifMenuOpen(false)
                                      }}
                                      className={`group relative flex w-full items-start gap-3.5 py-3.5 text-left transition-all duration-150 ${
                                        isFreshRealtime
                                          ? 'border-l-[3px] border-l-emerald-500 bg-emerald-50 pl-[17px] pr-5 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)] hover:bg-emerald-100/70 dark:border-l-emerald-400 dark:bg-emerald-500/10 dark:shadow-[inset_0_0_0_1px_rgba(52,211,153,0.18)] dark:hover:bg-emerald-500/[0.16]'
                                          : !isRead
                                          ? 'border-l-[3px] border-l-violet-500 bg-violet-50 pl-[17px] pr-5 hover:bg-violet-100/60 dark:border-l-violet-400 dark:bg-violet-500/10 dark:hover:bg-violet-500/[0.16]'
                                          : 'border-l-[3px] border-l-transparent pl-[17px] pr-5 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                      }`}
                                    >
                                      {/* Type icon */}
                                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${notifIcon.bg}`}>
                                        {notifIcon.icon}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                          <p className={`text-sm leading-snug ${
                                            isFreshRealtime || !isRead
                                              ? 'font-semibold text-slate-900 dark:text-white'
                                              : 'font-medium text-slate-500 dark:text-slate-400'
                                          }`}>
                                            {item.title}
                                          </p>
                                          <div className="flex shrink-0 items-center gap-1.5">
                                            {item.count > 1 && (
                                              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                                                !isRead
                                                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
                                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                                              }`}>
                                                ×{item.count}
                                              </span>
                                            )}
                                            {!isRead && (
                                              <span className="rounded-full bg-gradient-to-r from-violet-500 to-purple-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white leading-none shadow-sm shadow-violet-500/30">
                                                NEW
                                              </span>
                                            )}
                                            {isFreshRealtime && (
                                              <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white leading-none shadow-sm shadow-emerald-500/30">
                                                Just now
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.description}</p>
                                        {formatCustomerNotificationTime(item.latest_at) && (
                                          <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                            {formatCustomerNotificationTime(item.latest_at)}
                                          </p>
                                        )}
                                      </div>
                                    </Link>
                                  </motion.div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-4 py-12">
                              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/60 shadow-inner">
                                <svg className="h-7 w-7 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 shadow-sm">
                                  <svg className="h-3 w-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">You&apos;re all caught up!</p>
                                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">No new notifications right now</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  onClick={() => setIsOpen(true)}
                  className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors cursor-pointer text-slate-600 dark:text-gray-300"
                  title="Cart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>

                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-sky-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>

                <div className="hidden lg:flex">
                  <OutlineButton href={trackOrderHref} className="!px-4 !py-2 !text-sm h-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 17h4V5H2v12h3" />
                      <path d="M14 8h4l4 4v5h-4" />
                      <circle cx="7" cy="17" r="2" />
                      <circle cx="17" cy="17" r="2" />
                    </svg>
                    Track Order
                  </OutlineButton>
                </div>

                <div className="relative hidden md:block" ref={profileMenuRef}>
                  <button
                    onClick={() => {
                      setProfileMenuOpen((prev) => !prev)
                      setNotifMenuOpen(false)
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    title="Profile menu"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={user?.name || 'Profile'}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex items-center justify-center h-8 w-8 rounded-full bg-sky-100 text-sky-600 text-xs font-semibold uppercase">
                        {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
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
                        className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-200 dark:border-gray-800 !bg-white dark:!bg-gray-900 shadow-xl shadow-black/10 overflow-hidden z-50"
                      >
                        {/* User info header */}
                        <div className="px-4 py-4 bg-gradient-to-br from-sky-50 to-sky-50 dark:from-sky-950/20 dark:to-gray-900 border-b border-sky-100 dark:border-sky-800/50">
                          <div className="flex items-center gap-3">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={user?.name || 'Profile'}
                                className="h-11 w-11 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow"
                              />
                            ) : (
                              <span className="flex items-center justify-center h-11 w-11 rounded-full bg-sky-500 text-white text-sm font-bold uppercase ring-2 ring-white dark:ring-gray-700 shadow">
                                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {user?.name ?? 'User'}
                              </p>
                              {user?.email && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                  {user.email}
                                </p>
                              )}
                              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 text-[10px] font-semibold">
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                                Active
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="py-1.5">
                          <Link
                            href={profileHref}
                            onClick={() => setProfileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors group ${
                              pathname.endsWith('/profile')
                                ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            <span className={`flex items-center justify-center h-7 w-7 rounded-lg transition-colors shrink-0 ${
                              pathname.endsWith('/profile')
                                ? 'bg-sky-100 dark:bg-sky-900/40'
                                : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-sky-100 dark:group-hover:bg-sky-900/30'
                            }`}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-colors ${
                                pathname.endsWith('/profile')
                                  ? 'text-sky-600 dark:text-sky-400'
                                  : 'text-gray-500 dark:text-gray-400 group-hover:text-sky-600'
                              }`}>
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            </span>
                            <div>
                              <p className="font-medium">My Profile</p>
                              <p className={`text-xs ${
                                pathname.endsWith('/profile')
                                  ? 'text-sky-600 dark:text-sky-500'
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}>View & edit your info</p>
                            </div>
                          </Link>

                          <Link
                            href={ordersHref}
                            onClick={() => setProfileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors group ${
                              pathname.endsWith('/orders')
                                ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            <span className={`flex items-center justify-center h-7 w-7 rounded-lg transition-colors shrink-0 ${
                              pathname.endsWith('/orders')
                                ? 'bg-sky-100 dark:bg-sky-900/40'
                                : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-sky-100 dark:group-hover:bg-sky-900/30'
                            }`}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-colors ${
                                pathname.endsWith('/orders')
                                  ? 'text-sky-600 dark:text-sky-400'
                                  : 'text-gray-500 dark:text-gray-400 group-hover:text-sky-600'
                              }`}>
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                              </svg>
                            </span>
                            <div>
                              <p className="font-medium">My Orders</p>
                              <p className={`text-xs ${
                                pathname.endsWith('/orders')
                                  ? 'text-sky-600 dark:text-sky-500'
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}>Track your purchases</p>
                            </div>
                          </Link>

                          <Link
                            href={wishlistHref}
                            onClick={() => setProfileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors group ${
                              pathname.endsWith('/wishlist')
                                ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            <span className={`flex items-center justify-center h-7 w-7 rounded-lg transition-colors shrink-0 ${
                              pathname.endsWith('/wishlist')
                                ? 'bg-sky-100 dark:bg-sky-900/40'
                                : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-sky-100 dark:group-hover:bg-sky-900/30'
                            }`}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-colors ${
                                pathname.endsWith('/wishlist')
                                  ? 'text-sky-600 dark:text-sky-400'
                                  : 'text-gray-500 dark:text-gray-400 group-hover:text-sky-600'
                              }`}>
                                <path d="m12 21-1.45-1.32C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4 5 5 0 0 1 12 6.09 5 5 0 0 1 17.5 4 4.5 4.5 0 0 1 22 8.5c0 3.78-3.4 6.86-8.55 11.18z" />
                              </svg>
                            </span>
                            <div>
                              <p className="font-medium">Wishlist</p>
                              <p className={`text-xs ${
                                pathname.endsWith('/wishlist')
                                  ? 'text-sky-600 dark:text-sky-500'
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}>Your saved items</p>
                            </div>
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100 dark:border-gray-800 py-1.5">
                        <button
                            onClick={() => handleCustomerLogout()}
                            disabled={isLoggingOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60 group"
                          >
                            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-red-50 dark:bg-red-900/20 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors shrink-0">
                              {isLoggingOut ? (
                                <svg className="animate-spin h-3.5 w-3.5 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 dark:text-red-400">
                                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                  <polyline points="16 17 21 12 16 7" />
                                  <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                              )}
                            </span>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{isLoggingOut ? 'Logging out...' : 'Logout'}</p>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                {showGuestCartWishlist && (
                  <>
                    <button
                      onClick={() => setWishlistOpen(true)}
                      className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer text-slate-600 dark:text-gray-300"
                      title="Wishlist"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setIsOpen(true)}
                      className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors cursor-pointer text-slate-600 dark:text-gray-300"
                      title="Cart"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-sky-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </button>
                  </>
                )}
                <div className="hidden md:flex">
                  <OutlineButton href={trackOrderHref} className="!px-4 !py-2 !text-sm h-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 17h4V5H2v12h3" />
                      <path d="M14 8h4l4 4v5h-4" />
                      <circle cx="7" cy="17" r="2" />
                      <circle cx="17" cy="17" r="2" />
                    </svg>
                    Track Order
                  </OutlineButton>
                </div>

                {!hideSignIn && (
                  <motion.div whileTap={{ scale: 0.96 }} transition={{ duration: 0.12 }}>
                    <PrimaryButton href={signInHref} className="!px-5 !py-2 !text-sm !rounded-full h-10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Sign in
                    </PrimaryButton>
                  </motion.div>
                )}
              </>
            )}

            <div className="hidden md:block w-px h-5 bg-gray-200 mx-1" />
            <ThemeToggle isScrolled={true} />

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
          <SearchField aria-label="Open product search" className="w-full">
            <Label className="sr-only">Search</Label>
            <SearchField.Group
              className="flex h-10 cursor-pointer items-center gap-2.5 rounded-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm transition-all duration-200 hover:border-slate-300 dark:hover:border-gray-600"
              onClick={() => setSearchModalOpen(true)}
            >
              <SearchField.SearchIcon className="h-4 w-4 text-slate-400 shrink-0" />
              <SearchField.Input
                readOnly
                placeholder="Search products..."
                onFocus={() => setSearchModalOpen(true)}
                className="flex-1 cursor-pointer border-none bg-transparent p-0 text-sm text-slate-500 outline-none placeholder:text-slate-400"
              />
            </SearchField.Group>
          </SearchField>
        </div>
      </div>

      {!hideNavLinks && (
        <>
          {/* Desktop nav links */}
          <div className="hidden md:block border-t border-gray-100 dark:border-gray-800">
            <div className="container mx-auto px-4">
              <nav className="flex items-center h-11">
                {displayNavLinks.map((link, index) => {
                  const hasDropdown = link.dropdown || link.mega
                  return (
                    <div
                      key={link.label}
                      className={`relative h-full ${index === 0 ? '-ml-4' : ''}`}
                      onMouseEnter={() => hasDropdown && open(link.label)}
                      onMouseLeave={close}
                    >
                      {hasDropdown ? (
                        <button
                          type="button"
                          onClick={() => open(link.label)}
                          className={`relative px-4 h-full flex items-center text-sm font-medium transition-colors duration-200 group ${
                            pathname.startsWith(link.href) || activeDropdown === link.label
                              ? 'text-sky-500'
                              : 'text-gray-600 dark:text-gray-300 hover:text-sky-500'
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
                          <span className={`absolute bottom-0 left-4 right-4 h-0.5 bg-sky-500 transition-transform duration-300 origin-left ${
                            pathname.startsWith(link.href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                          }`} />
                        </button>
                      ) : (
                        <Link
                          href={link.href}
                          className={`relative px-4 h-full flex items-center text-sm font-medium transition-colors duration-200 group ${
                            pathname === link.href
                              ? 'text-sky-500'
                              : 'text-gray-600 dark:text-gray-300 hover:text-sky-500'
                          }`}
                        >
                          {link.label}
                          <span className={`absolute bottom-0 left-4 right-4 h-0.5 bg-sky-500 transition-transform duration-300 origin-left ${
                            pathname === link.href ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                          }`} />
                        </Link>
                      )}
                    </div>
                  )
                })}
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Desktop dropdown panels */}
      <AnimatePresence>
        {!hideNavLinks && activeLink?.dropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-0 right-0 !bg-white dark:!bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-xl shadow-black/5 dark:shadow-black/30 hidden md:block"
            onMouseEnter={() => open(activeLink.label)}
            onMouseLeave={close}
          >
            <div className="!bg-white dark:!bg-gray-900 container mx-auto px-4 py-4">
              {activeLink.label === 'Shop By Brand' ? (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-4 lg:grid-cols-8 gap-1">
                    {navbarBrandItems.length > 0 ? navbarBrandItems.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="group flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center text-gray-600 dark:text-gray-400 transition-all duration-200 hover:bg-sky-50 dark:hover:bg-sky-950/20 hover:text-sky-500"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 transition-colors group-hover:bg-sky-100 dark:group-hover:bg-sky-950/30">
                          {item.image ? (
                            <Image src={item.image} alt={item.label} width={44} height={44} className="h-full w-full object-contain p-1" unoptimized />
                          ) : (
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 group-hover:text-sky-500 transition-colors">
                              {item.label.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium leading-tight truncate w-full text-gray-700 dark:text-gray-300">{item.label}</span>
                      </Link>
                    )) : (
                      <p className="col-span-full py-4 text-center text-sm text-gray-400 dark:text-gray-500">No brands available</p>
                    )}
                  </div>
                  <Link
                    href="/by-brand"
                    className="self-start inline-flex items-center gap-1.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20 px-4 py-2 text-sm font-semibold text-sky-600 dark:text-sky-400 transition-colors hover:bg-sky-100 dark:hover:bg-sky-950/30"
                  >
                    View All Brands
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
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
                    return items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                      return (
                        <Link
                          key={`${activeLink.label}-${item.label}`}
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group ${
                            isActive
                              ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-sky-50 dark:hover:bg-sky-950/20 hover:text-sky-600'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            isActive ? 'bg-sky-400' : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-sky-400'
                          }`} />
                          {item.label}
                        </Link>
                      )
                    })
                  })()}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!hideNavLinks && activeLink?.mega && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-0 right-0 !bg-white dark:!bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-xl shadow-black/5 dark:shadow-black/30 hidden md:block"
            onMouseEnter={() => open(activeLink.label)}
            onMouseLeave={close}
          >
            <div className="!bg-white dark:!bg-gray-900 container mx-auto px-4 py-5">
              <div className="grid grid-cols-4 lg:grid-cols-8 gap-1">
                {Object.keys(activeLink.mega!).map((room) => {
                  const roomSlug = room.toLowerCase().replace(/\s+/g, '-');
                  const isActive = pathname.startsWith(`/by-room/${roomSlug}`);
                  return (
                    <Link
                      key={room}
                      href={`/by-room/${roomSlug}`}
                      className={`group flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center transition-all duration-200 ${
                        isActive
                          ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-600'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-sky-50 dark:hover:bg-sky-950/20 hover:text-sky-500'
                      }`}
                    >
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-200 ${
                        isActive
                          ? 'bg-sky-100 dark:bg-sky-950/40 text-sky-500'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 group-hover:bg-sky-100 dark:group-hover:bg-sky-950/30 group-hover:text-sky-500'
                      }`}>
                        {roomIcons[room] ?? roomIcons.BEDROOM}
                      </div>
                      <span className="text-xs font-medium leading-tight text-gray-700 dark:text-gray-300">{room.charAt(0) + room.slice(1).toLowerCase()}</span>
                    </Link>
                  );
                })}
              </div>
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
            className="md:hidden border-t border-gray-100 dark:border-gray-800 !bg-white dark:!bg-gray-900 max-h-[70vh] overflow-y-auto"
          >
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-0.5">
              {isLoggedIn && !hideSignIn ? (
                <div className="mb-3 rounded-2xl border border-sky-100 dark:border-sky-900/50 overflow-hidden shadow-sm dark:shadow-none">
                  {/* Profile header */}
                  {(() => {
                    const rank = meData?.rank ?? 0;
                    const tier = rank >= 5 ? 'Lifestyle Elite' : rank === 4 ? 'Lifestyle Consultant' : rank === 3 ? 'Home Stylist' : rank === 2 ? 'Home Builder' : 'Home Starter';
                    const badgeImg = tier === 'Lifestyle Elite' ? '/Badge/lifestyleElite.png' : tier === 'Lifestyle Consultant' ? '/Badge/lifestyleConsultant.png' : tier === 'Home Stylist' ? '/Badge/homeStylist.png' : tier === 'Home Builder' ? '/Badge/homeBuilder.png' : '/Badge/homeStarter.png';
                    const gradient = tier === 'Lifestyle Elite' ? 'from-sky-400 via-sky-400 to-rose-400' : tier === 'Lifestyle Consultant' ? 'from-violet-500 to-purple-600' : tier === 'Home Stylist' ? 'from-sky-400 to-blue-500' : tier === 'Home Builder' ? 'from-emerald-400 to-teal-500' : 'from-sky-400 to-sky-500';
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
                  <div className="px-4 -mt-8 pb-4 bg-white dark:bg-gray-800">
                    {/* Avatar row - overlapping the banner */}
                    <div className="flex items-end justify-between mb-2">
                      <div className="relative shrink-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={user?.name || 'Profile'}
                            className="h-16 w-16 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-700 shadow-lg"
                          />
                        ) : (
                          <span className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-500 text-white text-xl font-bold ring-4 ring-white dark:ring-gray-700 shadow-lg">
                            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                          </span>
                        )}
                        <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-700" />
                      </div>
                    </div>
                    {/* Name / email / username - clearly in white area */}
                    <div className="mb-3">
                      <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">{user?.name ?? 'User'}</p>
                      {user?.email && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{user.email}</p>
                      )}
                      {meData?.username && (
                        <p className="text-xs text-sky-500 dark:text-sky-400 font-medium mt-0.5">@{meData.username}</p>
                      )}
                    </div>

                    {/* Quick action links */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        { href: profileHref, label: 'My Profile', sub: 'View & edit info', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></> },
                        { href: ordersHref, label: 'My Orders', sub: 'Track purchases', icon: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></> },
                        { href: wishlistHref, label: 'Wishlist', sub: 'Saved items', icon: <path d="m12 21-1.45-1.32C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4 5 5 0 0 1 12 6.09 5 5 0 0 1 17.5 4 4.5 4.5 0 0 1 22 8.5c0 3.78-3.4 6.86-8.55 11.18z"/> },
                        { href: trackOrderHref, label: 'Track Order', sub: 'Order status', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="group flex items-center gap-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:border-sky-200 dark:hover:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-900/20 px-3 py-2.5 transition-colors"
                        >
                          <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-white dark:bg-gray-600 shadow-sm group-hover:bg-sky-100 dark:group-hover:bg-sky-900/30 transition-colors shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 dark:text-gray-300 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                              {item.icon}
                            </svg>
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">{item.label}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{item.sub}</p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Logout */}
                    <button
                      onClick={() => { handleCustomerLogout(); setMobileOpen(false); }}
                      disabled={isLoggingOut}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 transition-colors disabled:opacity-60"
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
                <div className="mb-3 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <div className="bg-gradient-to-br from-slate-700 to-slate-900 px-4 py-5 flex items-center gap-3">
                    <span className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/10 border border-white/20 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/70">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">Welcome to {logoAlt}</p>
                      <p className="text-xs text-white/60 mt-0.5">{hideSignIn ? 'Browse and track your orders.' : 'Sign in to access your account'}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 px-4 py-3 flex gap-2">
                    {!hideSignIn && (
                      <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.12 }} className="flex-1">
                        <PrimaryButton
                        href={signInHref}
                          onClick={() => setMobileOpen(false)}
                          className="!w-full !px-4 !py-2.5 !text-sm !rounded-[18px]"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          Sign In
                        </PrimaryButton>
                      </motion.div>
                    )}
                    <Link
                      href={trackOrderHref}
                      onClick={() => setMobileOpen(false)}
                      className={`${hideSignIn ? 'w-full' : 'flex-1'} flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors`}
                    >
                      Track Order
                    </Link>
                  </div>
                </div>
              )}
              {!hideNavLinks && displayNavLinks.map((link) => {
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
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-xl transition-colors"
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
                        className="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-xl transition-colors"
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
                          /* Mega menu - search + grouped rooms */
                          <div className="ml-4 pl-4 border-l-2 border-sky-200 dark:border-sky-800 py-2 space-y-1">
                            {/* Search */}
                            <div className="relative mb-3">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                              </svg>
                              <input
                                type="text"
                                value={mobileSearch}
                                onChange={(e) => setMobileSearch(e.target.value)}
                                placeholder="Search items..."
                                className="w-full pl-8 pr-8 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400/50 dark:focus:ring-sky-500/30 focus:bg-white dark:focus:bg-gray-600 transition-all"
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
                                <p className="px-3 py-3 text-xs text-gray-400 dark:text-gray-500 text-center">
                                  No rooms found for &quot;<span className="text-sky-500 dark:text-sky-400">{mobileSearch}</span>&quot;
                                </p>
                              );

                              return rooms.map((room) => {
                                const roomSlug = room.toLowerCase().replace(/\s+/g, '-');
                                return (
                                  <div key={room} className="mb-2">
                                    <Link
                                      href={`/by-room/${roomSlug}`}
                                      className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-sky-300 dark:hover:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                                      onClick={() => setMobileOpen(false)}
                                    >
                                      <span className="text-sky-500">{roomIcons[room] ?? roomIcons.BEDROOM}</span>
                                      <span className="text-xs font-bold tracking-wider text-sky-600">{room}</span>
                                    </Link>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        ) : link.label === 'Shop By Brand' ? (
                          /* Brand dropdown - search + logos */
                          <div className="ml-4 pl-4 border-l-2 border-sky-200 dark:border-sky-800 py-2 space-y-2">
                            {/* Search */}
                            <div className="relative">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                              </svg>
                              <input
                                type="text"
                                value={mobileBrandSearch}
                                onChange={(e) => setMobileBrandSearch(e.target.value)}
                                placeholder="Search brands..."
                                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 dark:focus:ring-sky-500/30"
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
                                className="flex items-center gap-2.5 rounded-xl border border-gray-100 dark:border-gray-700 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:border-sky-200 dark:hover:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                                onClick={() => setMobileOpen(false)}
                              >
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                                  {item.image ? (
                                    <Image src={item.image} alt={item.label} width={28} height={28} className="h-full w-full object-cover" unoptimized />
                                  ) : (
                                    <span className="text-[9px] font-bold text-gray-500">
                                      {item.label.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')}
                                    </span>
                                  )}
                                </div>
                                <span className="truncate text-xs">{item.label}</span>
                              </Link>
                            ))}
                            <Link
                              href="/by-brand"
                              className="mt-1 inline-flex items-center rounded-lg bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-600 transition-colors hover:bg-sky-100"
                              onClick={() => setMobileOpen(false)}
                            >
                              View All Brands
                            </Link>
                          </div>
                        ) : (
                          /* Regular dropdown */
                          <div className="ml-4 pl-4 border-l-2 border-sky-200 py-1">
                            {subItems.map((item) => (
                              <Link
                                key={item.label}
                                href={item.href}
                                className="block px-3 py-1.5 text-sm text-gray-600 hover:text-sky-500 rounded-lg transition-colors"
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
    {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {realtimeNotification && (
          isMobile ? (
            // ─── Mobile: Dynamic Island style ───────────────────────────────────
            <motion.div
              key={realtimeNotification.id + '_di'}
              className="fixed top-3 left-1/2 z-[130]"
              style={{ translateX: '-50%' }}
              initial={{ y: -80, opacity: 0, scale: 0.6 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -80, opacity: 0, scale: 0.6, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
              transition={{ type: 'spring', bounce: 0.42, duration: 0.58 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 8 }}
              dragElastic={{ top: 0.45, bottom: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.y < -48 || info.velocity.y < -420) {
                  setRealtimeNotification(null)
                }
              }}
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="overflow-hidden bg-[#1c1c1e] shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                style={{
                  borderRadius: diPhase === 'pill' ? 999 : 22,
                  width: diPhase === 'pill' ? '158px' : 'min(90vw, 340px)',
                }}
              >
                <AnimatePresence mode="wait">
                  {diPhase === 'pill' ? (
                    <motion.div
                      key="di-pill"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      transition={{ duration: 0.16 }}
                      className="flex items-center gap-2 px-3.5"
                      style={{ height: 40 }}
                    >
                      <div className={`h-5 w-5 shrink-0 flex items-center justify-center rounded-full ${getNotificationIcon(realtimeNotification.title).bg}`}>
                        {getNotificationIcon(realtimeNotification.title).icon}
                      </div>
                      <p className="text-[11px] font-semibold text-white truncate leading-none">
                        {realtimeNotification.title}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="di-expanded"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      transition={{ duration: 0.22, delay: 0.06 }}
                    >
                      <Link
                        href={realtimeNotification.href}
                        onClick={() => setRealtimeNotification(null)}
                        className="block"
                      >
                        <div className="flex items-start gap-3 px-4 pt-3.5 pb-2.5">
                          <div className={`mt-0.5 h-9 w-9 shrink-0 flex items-center justify-center rounded-xl ${getNotificationIcon(realtimeNotification.title).bg}`}>
                            {getNotificationIcon(realtimeNotification.title).icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-[13px] font-bold text-white leading-tight">
                                {realtimeNotification.title}
                              </p>
                              <span className="shrink-0 rounded-full bg-emerald-500/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-400">
                                New
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
                              {realtimeNotification.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRealtimeNotification(null) }}
                            className="mt-0.5 rounded-lg p-1 text-slate-600 hover:text-slate-400 transition-colors"
                            aria-label="Dismiss"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="mx-4 mb-3.5 h-[3px] rounded-full bg-[#2c2c2e] overflow-hidden">
                          <motion.div
                            className="h-full origin-left rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400"
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: REALTIME_NOTIFICATION_DURATION_SECONDS - 0.45, ease: 'linear' }}
                          />
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ) : (
            // ─── Desktop: existing bottom-right popup ───────────────────────────
            <motion.div
              key={realtimeNotification.id}
              initial={{ opacity: 0, x: 36, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 36, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.35}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 550) {
                  setRealtimeNotification(null)
                }
              }}
              className="fixed bottom-4 right-3 z-[130] w-[calc(100vw-1.5rem)] max-w-sm sm:bottom-5 sm:right-5"
            >
              <Link
                href={realtimeNotification.href}
                onClick={() => setRealtimeNotification(null)}
                className="block overflow-hidden rounded-2xl border border-emerald-200/80 bg-white shadow-2xl shadow-slate-900/15 ring-1 ring-emerald-100/70 transition hover:-translate-y-0.5 hover:shadow-emerald-900/15 dark:border-emerald-800/60 dark:bg-slate-900 dark:ring-emerald-900/30"
              >
                <div className="flex items-start gap-3 p-4">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${getNotificationIcon(realtimeNotification.title).bg}`}>
                    {getNotificationIcon(realtimeNotification.title).icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{realtimeNotification.title}</p>
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        New
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {realtimeNotification.description}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      View in notifications
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setRealtimeNotification(null)
                    }}
                    className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    aria-label="Dismiss notification"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="h-1 bg-slate-100 dark:bg-slate-800">
                  <motion.div
                    className="h-full origin-left bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400"
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: REALTIME_NOTIFICATION_DURATION_SECONDS, ease: 'linear' }}
                  />
                </div>
              </Link>
            </motion.div>
          )
        )}
      </AnimatePresence>,
      document.body,
    )}
    {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {searchModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm dark:bg-slate-950/60"
            onClick={() => {
              setSearchModalOpen(false)
              setSearchModalQuery('')
            }}
          >
            <div className="flex min-h-screen items-start justify-center px-3 pt-12 sm:px-6 sm:pt-20 md:pt-24">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full max-w-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <Card variant="default" className="overflow-hidden rounded-2xl border border-slate-200 dark:border-gray-700 bg-white shadow-xl shadow-black/15 dark:bg-gray-800">
                  <Card.Content className="space-y-0 px-0 py-0">
                    <form
                      className="border-b border-slate-200 px-6 py-5 dark:border-gray-700"
                      onSubmit={(event) => {
                        event.preventDefault()
                        handleProductSearchSubmit(searchModalQuery)
                      }}
                    >
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <SearchField
                          aria-label="Search products"
                          value={searchModalQuery}
                          onChange={setSearchModalQuery}
                          className="flex-1 min-w-0"
                        >
                          <Label className="sr-only">Search products</Label>
                          <SearchField.Group className="flex items-center gap-2 sm:gap-3 rounded-xl border border-slate-200 bg-white px-3 sm:px-5 py-2.5 sm:py-3.5 transition-all duration-200 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100 dark:border-gray-700 dark:bg-gray-800 dark:focus-within:border-sky-500 dark:focus-within:ring-sky-900/50">
                            <SearchField.SearchIcon className="h-4 sm:h-5 w-4 sm:w-5 shrink-0 text-slate-400 dark:text-gray-400" />
                            <SearchField.Input
                              ref={searchInputRef}
                              autoFocus
                              placeholder="Search..."
                              className="flex-1 border-none bg-transparent p-0 text-sm sm:text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-gray-100 dark:placeholder:text-gray-500"
                            />
                            {searchModalQuery && (
                              <motion.button
                                type="button"
                                onClick={() => setSearchModalQuery('')}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.1 }}
                                className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                title="Clear search"
                              >
                                <svg className="h-3.5 sm:h-4 w-3.5 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </motion.button>
                            )}
                          </SearchField.Group>
                        </SearchField>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <AnimatePresence>
                            {searchModalQuery && (
                              <motion.button
                                type="submit"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="shrink-0 inline-flex cursor-pointer items-center gap-1 sm:gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-sky-600 transition hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50"
                                title="Press Enter to search"
                              >
                                <span>ENTER</span>
                              </motion.button>
                            )}
                          </AnimatePresence>
                          <motion.button
                            type="button"
                            onClick={() => {
                              setSearchModalQuery('')
                              setSearchModalOpen(false)
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="shrink-0 inline-flex cursor-pointer items-center gap-1 sm:gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 sm:px-2.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-slate-500 transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                            title="Close search (Esc)"
                          >
                            <span>ESC</span>
                          </motion.button>
                        </div>
                      </div>
                    </form>
                    <div className="max-h-[calc(100vh-180px)] overflow-y-auto px-3 py-4 sm:px-4 sm:py-5">
                      {/* Show recent searches when query is empty OR still loading search results */}
                      {debouncedSearchQuery.length < 2 ? (
                        <>
                          {!isLoggedIn ? (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-lg border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/50 px-4 py-6 text-center dark:border-gray-700 dark:from-gray-700/50 dark:to-gray-800/30"
                            >
                              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200 dark:bg-gray-700">
                                <svg className="h-6 w-6 text-slate-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </div>
                              <p className="mt-3 text-sm font-medium text-slate-900 dark:text-gray-200">Sign in to save searches</p>
                              <p className="mt-1 text-xs text-slate-600 dark:text-gray-400">Your search history will appear here once you sign in</p>
                            </motion.div>
                          ) : isLoadingSearchHistory ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="space-y-3"
                            >
                              <div className="flex items-center justify-between px-2 mb-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-400">Recent Searches</p>
                              </div>
                              {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-700/50 animate-pulse">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 dark:bg-gray-600" />
                                  <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-32 dark:bg-gray-600" />
                                    <div className="h-3 bg-slate-200 rounded w-24 dark:bg-gray-600" />
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          ) : !searchHistoryData?.data || searchHistoryData.data.length === 0 ? (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-lg border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/50 px-4 py-8 text-center dark:border-gray-700 dark:from-gray-700/50 dark:to-gray-800/30"
                            >
                              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200 dark:bg-gray-700">
                                <svg className="h-6 w-6 text-slate-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </div>
                              <p className="mt-3 text-sm font-medium text-slate-900 dark:text-gray-200">No search history yet</p>
                              <p className="mt-1 text-xs text-slate-600 dark:text-gray-400">Your searches will appear here</p>
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-4"
                            >
                              <div className="flex items-center justify-between px-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300">Recent Searches</p>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await clearSearchHistory().unwrap()
                                      refetchSearchHistory()
                                    } catch (error) {
                                      console.error('Failed to clear search history:', error)
                                    }
                                  }}
                                  className="text-xs font-medium text-slate-500 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                                  title="Clear all search history"
                                >
                                  Clear all
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {searchHistoryData?.data?.map((item, index) => (
                                  <motion.button
                                    key={item.id}
                                    onClick={() => {
                                      setSearchModalQuery(item.query)
                                    }}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="group relative inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition-all hover:border-sky-400 hover:bg-sky-50 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-200 dark:hover:border-sky-500/50 dark:hover:bg-gray-700"
                                  >
                                    <svg className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="truncate font-medium">{item.query}</span>
                                    <div
                                      onClick={async (e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        try {
                                          await deleteSearchHistoryItem({ id: item.id }).unwrap()
                                        } catch (error) {
                                          console.error('Failed to delete search history item:', error)
                                        }
                                      }}
                                      className="ml-1 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
                                      title="Remove this search"
                                      role="button"
                                      tabIndex={0}
                                    >
                                      <svg className="h-3.5 w-3.5 text-slate-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </div>
                                  </motion.button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </>
                      ) : showSearchSearching ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center gap-3 py-8"
                        >
                          <div className="relative h-8 w-8">
                            <div className="absolute inset-0 rounded-full border-2 border-sky-200 dark:border-sky-900" />
                            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-500 dark:border-t-sky-400 animate-spin" />
                          </div>
                          <p className="text-sm text-slate-600 dark:text-gray-400">Searching products...</p>
                        </motion.div>
                      ) : showSearchNotFound ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-6 text-center dark:border-gray-700 dark:bg-gray-700/50"
                        >
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200 dark:bg-gray-700">
                            <svg className="h-6 w-6 text-slate-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="mt-2 text-sm font-medium text-slate-900 dark:text-gray-200">No products found</p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-gray-400">No matches for &quot;<span className="font-semibold">{searchModalQuery.trim()}</span>&quot;</p>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ staggerChildren: 0.05 }}
                          className="space-y-3"
                        >
                          {searchedProducts.map((product, index) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                            >
                              <Link
                                href={product.path}
                                onClick={() => {
                                  saveSearchToHistory(searchModalQuery)
                                  setSearchModalQuery('')
                                  setSearchModalOpen(false)
                                  setMobileOpen(false)
                                }}
                                className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 rounded-xl border border-slate-200 bg-white p-2 sm:p-3 transition-all hover:border-sky-300 hover:bg-sky-50 dark:border-gray-700 dark:bg-gray-700/50 dark:hover:border-sky-500/50 dark:hover:bg-gray-700"
                              >
                                <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-gray-700">
                                  {product.image ? (
                                    <Image src={product.image} alt={product.name} fill className="object-cover transition group-hover:scale-110" />
                                  ) : (
                                    <span className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400 dark:text-gray-600">
                                      AF
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-2 sm:truncate text-xs sm:text-sm font-semibold text-slate-900 dark:text-gray-100">
                                    {highlightText(product.name, searchModalQuery).map((part, i) =>
                                      part.type === 'highlight' ? (
                                        <span key={i} className="bg-yellow-200 dark:bg-yellow-700 rounded px-0.5">{part.text}</span>
                                      ) : (
                                        <span key={i}>{part.text}</span>
                                      )
                                    )}
                                  </p>
                                  <p className="mt-0.5 text-[10px] sm:text-xs text-slate-500 dark:text-gray-400">Match for &quot;{searchModalQuery.trim()}&quot;</p>
                                  {(product.priceMember !== null || product.priceSrp !== null || product.prodpv !== null) && (
                                    <div className="mt-1 sm:mt-2 space-y-1 sm:space-y-1.5">
                                      {(() => {
                                        const srpPrice = product.priceSrp ?? 0
                                        const memberPrice = product.priceMember ?? product.priceDp ?? 0
                                        const hasDiscountPrice = memberPrice > 0 && srpPrice > 0 && memberPrice < srpPrice
                                        const displayPrice = isPartnerSearchScoped
                                          ? (srpPrice > 0 ? srpPrice : memberPrice)
                                          : (hasDiscountPrice ? memberPrice : (memberPrice > 0 ? memberPrice : srpPrice))

                                        if (hasDiscountPrice && !isPartnerSearchScoped) {
                                          return (
                                            <>
                                              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                                <span className="text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400">
                                                  {formatPrice(displayPrice)}
                                                </span>
                                                <span className="text-[10px] sm:text-xs text-slate-400 line-through dark:text-gray-500">
                                                  {formatPrice(srpPrice)}
                                                </span>
                                                <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-semibold text-green-700 dark:border-green-900/50 dark:bg-green-900/30 dark:text-green-300">
                                                  Save {formatPrice(srpPrice - memberPrice)}
                                                </span>
                                              </div>
                                              {!isLoggedIn && (
                                                <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-900/50 dark:bg-sky-900/30 dark:text-sky-300">
                                                  Sign in or Register to claim {Math.round(((srpPrice - memberPrice) / srpPrice) * 100)}% savings!
                                                </span>
                                              )}
                                            </>
                                          )
                                        }

                                        return (
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                                              {formatPrice(displayPrice)}
                                            </span>
                                          </div>
                                        )
                                      })()}
                                      {product.prodpv !== null && product.prodpv > 0 && (
                                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-300">
                                          PV {product.prodpv.toLocaleString('en-PH', { maximumFractionDigits: 2 })}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <svg className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </Card.Content>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
    )}
  </>
  )
}

export default function Navbar({
  initialCategories = [],
  logoSrc = '/Images/af_home_logo.png',
  logoAlt = 'AF Home',
  logoHref = '/shop',
  hideSignIn = false,
  hideNavLinks = false,
  categoryOnlyNav = false,
  stickToTop = false,
  showGuestCartWishlist = false,
}: NavbarProps) {
  return (
    <NavbarInner
      initialCategories={initialCategories}
      logoSrc={logoSrc}
      logoAlt={logoAlt}
      logoHref={logoHref}
      hideSignIn={hideSignIn}
      hideNavLinks={hideNavLinks}
      categoryOnlyNav={categoryOnlyNav}
      stickToTop={stickToTop}
      showGuestCartWishlist={showGuestCartWishlist}
    />
  )
}

