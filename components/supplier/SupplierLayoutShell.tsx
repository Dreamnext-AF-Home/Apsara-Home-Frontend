'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, Menu, MoonStar, Sparkles, SunMedium } from 'lucide-react'
import { useTheme } from 'next-themes'
import SupplierSidebar from './SupplierSidebar'
import { clearAccessTokenCache } from '@/store/api/baseApi'
import { useGetSupplierOrderNotificationsQuery } from '@/store/api/supplierOrdersApi'

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
  const { data: session, status } = useSession()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()

  const supplierName = session?.user?.supplierName || session?.user?.name || 'Supplier Account'
  const isMainSupplier = Boolean(session?.user?.isMainSupplier)
  const isDark = resolvedTheme === 'dark'
  const notificationStorageKey = useMemo(
    () => `afhome:supplier-notifications:read:${session?.user?.email ?? supplierName}`,
    [session?.user?.email, supplierName],
  )
  const { data: notificationsData, isFetching: isNotificationsFetching, isError: isNotificationsError } =
    useGetSupplierOrderNotificationsQuery(undefined, {
      skip: status !== 'authenticated',
      pollingInterval: 60000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    })

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
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f6fbff_0%,#eef4fb_42%,#edf2f7_100%)] text-sm text-slate-500 dark:bg-[radial-gradient(circle_at_top,#14263a_0%,#09111d_42%,#050914_100%)] dark:text-slate-300">
        Loading supplier workspace...
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f6fbff_0%,#eef4fb_42%,#edf2f7_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,#14263a_0%,#09111d_42%,#050914_100%)] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute left-[-7rem] top-[-4rem] h-80 w-80 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/10" />
        <div className="absolute right-[-6rem] top-16 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl dark:bg-indigo-500/10" />
        <div className="absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl dark:bg-emerald-500/10" />
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
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-80 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-200/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 dark:shadow-black/30"
                    >
                      <div className="border-b border-slate-200/70 px-5 py-4 dark:border-white/8">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Notifications</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Latest brand-matched supplier orders will appear here.</p>
                      </div>
                      <div className="space-y-3 p-4">
                        {isNotificationsFetching ? (
                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-xs text-slate-500 dark:border-white/8 dark:bg-white/[0.03] dark:text-slate-400">
                            Loading supplier notifications...
                          </div>
                        ) : isNotificationsError ? (
                          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/80 p-4 text-xs text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                            We could not load supplier notifications right now.
                          </div>
                        ) : notifications.length ? (
                          notifications.map((item) => {
                            const isRead = new Set([...storedReadNotificationKeys, ...readNotificationKeys]).has(getNotificationReadKey(item))

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setNotificationsOpen(false)
                                  router.push(item.href)
                                }}
                                className={`w-full rounded-2xl border p-4 text-left transition ${
                                  isRead
                                    ? 'border-slate-200/80 bg-slate-50/80 hover:border-cyan-200 hover:bg-cyan-50/70 dark:border-white/8 dark:bg-white/[0.03] dark:hover:border-cyan-500/20 dark:hover:bg-cyan-500/10'
                                    : 'border-cyan-200/80 bg-cyan-50/80 hover:border-cyan-300 hover:bg-cyan-50 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:hover:border-cyan-400/30 dark:hover:bg-cyan-500/15'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                    <Bell className="h-4 w-4" />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                                      {!isRead ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-500" /> : null}
                                    </div>
                                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
                                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                                      <span>{formatNotificationTime(item.updated_at) || 'Recent order'}</span>
                                      {item.count > 1 ? (
                                        <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 font-semibold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                                          +{item.count}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            )
                          })
                        ) : (
                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-xs text-slate-500 dark:border-white/8 dark:bg-white/[0.03] dark:text-slate-400">
                            No brand-matched orders yet. New supplier orders will appear here once customers check out.
                          </div>
                        )}
                      </div>
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
    </div>
  )
}
