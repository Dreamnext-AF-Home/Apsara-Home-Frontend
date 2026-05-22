'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, Menu, MoonStar, Sparkles, SunMedium } from 'lucide-react'
import { useTheme } from 'next-themes'
import SupplierSidebar from './SupplierSidebar'
import { clearAccessTokenCache } from '@/store/api/baseApi'
import { useGetSupplierOrderNotificationsQuery, type SupplierNotificationItem } from '@/store/api/supplierOrdersApi'
import { useSupplierRealtimeOrders } from '@/hooks/useSupplierRealtimeOrders'

const SUPPLIER_NOTIFICATION_DURATION = 10

function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'SP'
  )
}

export default function SupplierLayoutShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [readNotificationKeys, setReadNotificationKeys] = useState<string[]>([])
  const [realtimeNotification, setRealtimeNotification] = useState<SupplierNotificationItem | null>(null)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()

  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken
  const supplierId = (session?.user as { supplierId?: number | null } | undefined)?.supplierId

  const supplierName = session?.user?.supplierName || session?.user?.name || 'Supplier Account'
  const isMainSupplier = Boolean(session?.user?.isMainSupplier)
  const isDark = resolvedTheme === 'dark'
  const notificationStorageKey = useMemo(
    () => `afhome:supplier-notifications:read:${session?.user?.email ?? supplierName}`,
    [session?.user?.email, supplierName],
  )
  const { data: notificationsData, isFetching: isNotificationsFetching, isError: isNotificationsError, refetch: refetchNotifications } =
    useGetSupplierOrderNotificationsQuery(undefined, {
      skip: status !== 'authenticated',
      pollingInterval: 60000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    })

  const handleRealtimeNotification = useCallback((item: SupplierNotificationItem) => {
    setRealtimeNotification(item)
  }, [])

  useSupplierRealtimeOrders({
    accessToken,
    supplierId,
    onNotification: refetchNotifications,
    onRealtimeNotification: handleRealtimeNotification,
  })

  useEffect(() => {
    if (!realtimeNotification) return
    const id = window.setTimeout(() => setRealtimeNotification(null), SUPPLIER_NOTIFICATION_DURATION * 1000)
    return () => window.clearTimeout(id)
  }, [realtimeNotification])

  const storedReadNotificationKeys = useMemo(() => {
    if (typeof window === 'undefined') return []

    try {
      const stored = window.localStorage.getItem(notificationStorageKey)
      if (!stored) return []

      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : []
    } catch {
      return []
    }
  }, [notificationStorageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const merged = Array.from(new Set([...storedReadNotificationKeys, ...readNotificationKeys]))
      window.localStorage.setItem(notificationStorageKey, JSON.stringify(merged))
    } catch {
      // Ignore localStorage write failures.
    }
  }, [notificationStorageKey, readNotificationKeys, storedReadNotificationKeys])

  const getNotificationReadKey = (item: { id: string; updated_at?: string | null }) => `${item.id}:${item.updated_at ?? ''}`
  const getNotificationTimestamp = (value?: string | null) => {
    if (!value) return 0
    const timestamp = new Date(value).getTime()
    return Number.isNaN(timestamp) ? 0 : timestamp
  }

  const notifications = useMemo(() => {
    const items = notificationsData?.items ?? []
    const mergedReadKeys = new Set([...storedReadNotificationKeys, ...readNotificationKeys])
    return [...items].sort((a, b) => {
      const aRead = mergedReadKeys.has(getNotificationReadKey(a)) ? 1 : 0
      const bRead = mergedReadKeys.has(getNotificationReadKey(b)) ? 1 : 0
      if (aRead !== bRead) return aRead - bRead
      return getNotificationTimestamp(b.updated_at) - getNotificationTimestamp(a.updated_at)
    })
  }, [notificationsData?.items, readNotificationKeys, storedReadNotificationKeys])

  const unreadNotificationCount = useMemo(
    () => {
      const mergedReadKeys = new Set([...storedReadNotificationKeys, ...readNotificationKeys])
      return notifications.reduce((total, item) => {
        const isRead = mergedReadKeys.has(getNotificationReadKey(item))
        return isRead ? total : total + Math.max(1, item.count ?? 0)
      }, 0)
    },
    [notifications, readNotificationKeys, storedReadNotificationKeys],
  )

  const formatNotificationTime = (value?: string | null) => {
    if (!value) return ''
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ''
    return parsed.toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  useEffect(() => {
    if (status !== 'unauthenticated') return

    clearAccessTokenCache()
    router.replace('/supplier/login?session=expired')
  }, [router, status])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen bg-[linear-gradient(180deg,#f6fbff_0%,#eef4fb_42%,#edf2f7_100%)] dark:bg-[radial-gradient(circle_at_top,#14263a_0%,#09111d_42%,#050914_100%)]">
        <div className="hidden w-64 shrink-0 lg:block" />
        <div className="flex flex-1 flex-col">
          <div className="h-18.25 border-b border-white/55 bg-white/70 backdrop-blur-2xl dark:border-white/8 dark:bg-slate-950/45" />
          <div className="flex-1 px-4 py-5 lg:px-8 lg:py-7" />
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f6fbff_0%,#eef4fb_42%,#edf2f7_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,#14263a_0%,#09111d_42%,#050914_100%)] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute -left-28 -top-16 h-80 w-80 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/10" />
        <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl dark:bg-indigo-500/10" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl dark:bg-emerald-500/10" />
      </div>

      <SupplierSidebar className="hidden lg:flex" />

      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="fixed inset-y-0 left-0 z-40 w-80 lg:hidden"
            >
              <SupplierSidebar className="h-full w-full" onClose={() => setMenuOpen(false)} />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="relative z-10 min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-white/55 bg-white/70 backdrop-blur-2xl dark:border-white/8 dark:bg-slate-950/45">
          <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-8">
            <div className="flex min-w-0 items-center gap-3 lg:gap-4">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-cyan-500/30 dark:hover:text-cyan-300 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Supplier Workspace
                </div>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                  <h1 className="truncate text-base font-bold text-slate-900 dark:text-white lg:text-lg">{supplierName}</h1>
                  <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    {isMainSupplier ? 'Main Supplier' : 'Sub Supplier'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                aria-label="Toggle theme"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm transition hover:border-amber-200 hover:text-amber-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-amber-500/30 dark:hover:text-amber-300"
              >
                {isDark ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const nextOpen = !notificationsOpen
                    setNotificationsOpen(nextOpen)

                    if (!nextOpen || !notifications.length) return

                    setReadNotificationKeys((current) => {
                      const next = new Set(current)
                      notifications.forEach((item) => next.add(getNotificationReadKey(item)))
                      return Array.from(next)
                    })
                  }}
                  aria-label="Notifications"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-cyan-500/30 dark:hover:text-cyan-300"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotificationCount > 0 ? (
                    <span className="absolute right-2.5 top-2.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-950">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  ) : null}
                </button>

                <AnimatePresence>
                  {notificationsOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 top-[calc(100%+0.6rem)] z-30 w-[340px] overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-xl shadow-slate-200/60 dark:border-white/8 dark:bg-slate-900 dark:shadow-black/40"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">Notifications</span>
                          {unreadNotificationCount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-cyan-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotificationsOpen(false)}
                          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/8 dark:hover:text-slate-200"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 dark:border-white/6" />

                      {/* Body */}
                      <div className="max-h-[360px] overflow-y-auto">
                        {isNotificationsFetching ? (
                          <div className="flex items-center gap-2.5 px-4 py-5 text-xs text-slate-400 dark:text-slate-500">
                            <svg className="h-3.5 w-3.5 animate-spin text-cyan-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                            Loading notifications…
                          </div>
                        ) : isNotificationsError ? (
                          <div className="flex items-center gap-2 px-4 py-5 text-xs text-rose-500 dark:text-rose-400">
                            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeLinecap="round" strokeWidth="2" d="M12 8v4m0 4h.01"/></svg>
                            Could not load notifications right now.
                          </div>
                        ) : notifications.length ? (
                          <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {notifications.map((item) => {
                              const isRead = new Set([...storedReadNotificationKeys, ...readNotificationKeys]).has(getNotificationReadKey(item))

                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setNotificationsOpen(false)
                                    router.push(item.href)
                                  }}
                                  className={`group w-full px-4 py-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-white/4 ${
                                    !isRead ? 'bg-cyan-50/60 dark:bg-cyan-500/5' : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    {/* Icon dot */}
                                    <div className="relative mt-1 shrink-0">
                                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-500/15">
                                        <Bell className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                                      </div>
                                      {!isRead && (
                                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cyan-500 ring-2 ring-white dark:ring-slate-900" />
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="line-clamp-1 text-[12.5px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
                                        {item.title}
                                      </p>
                                      <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                                        {item.description}
                                      </p>
                                      <div className="mt-1.5 flex items-center gap-2">
                                        <span className="text-[10.5px] text-slate-400 dark:text-slate-500">
                                          {formatNotificationTime(item.updated_at) || 'Recent'}
                                        </span>
                                        {item.count > 1 && (
                                          <span className="rounded-full bg-cyan-100 px-1.5 py-px text-[10px] font-semibold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400">
                                            +{item.count}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="px-4 py-8 text-center">
                            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
                              <Bell className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400">No notifications yet</p>
                            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">New orders will appear here.</p>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <>
                          <div className="border-t border-slate-100 dark:border-white/6" />
                          <div className="px-4 py-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setNotificationsOpen(false)
                                router.push('/supplier/orders')
                              }}
                              className="w-full rounded-xl py-2 text-center text-[12px] font-medium text-cyan-600 transition hover:bg-cyan-50 hover:text-cyan-700 dark:text-cyan-400 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-300"
                            >
                              View all orders →
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={async () => {
                  clearAccessTokenCache()
                  await signOut({ callbackUrl: '/supplier/login' })
                }}
                className="inline-flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-300"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#06b6d4,#2563eb)] text-[11px] font-bold text-white shadow-lg shadow-cyan-500/20">
                  {getInitials(supplierName)}
                </span>
                <span className="hidden max-w-28 truncate sm:block">{supplierName}</span>
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-5 lg:px-8 lg:py-7">{children}</main>
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {realtimeNotification && (
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
              className="fixed bottom-4 right-3 z-130 w-[calc(100vw-1.5rem)] max-w-sm sm:bottom-5 sm:right-5"
            >
              <button
                type="button"
                onClick={() => {
                  setRealtimeNotification(null)
                  router.push(realtimeNotification.href)
                }}
                className="block w-full overflow-hidden rounded-2xl border border-cyan-200/80 bg-white text-left shadow-2xl shadow-slate-900/15 ring-1 ring-cyan-100/70 transition hover:-translate-y-0.5 hover:shadow-cyan-900/15 dark:border-cyan-800/60 dark:bg-slate-900 dark:ring-cyan-900/30"
              >
                <div className="flex items-start gap-3 p-4">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 dark:bg-cyan-500/10">
                    <Bell className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{realtimeNotification.title}</p>
                      <span className="shrink-0 rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                        New
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {realtimeNotification.description}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">View order</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setRealtimeNotification(null) }}
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
                    className="h-full origin-left bg-linear-to-r from-cyan-400 via-teal-400 to-sky-400"
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: SUPPLIER_NOTIFICATION_DURATION, ease: 'linear' }}
                  />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
