'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useGetPublicWebPageItemsQuery } from '@/store/api/webPagesApi'
import TopBar from '@/components/layout/TopBar'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/landing-page/Footer'

// NOTE: Dark mode in this app is driven by `next-themes` which sets a `.dark` class.
// This page uses many `dark:` Tailwind utilities, so ensure the `.dark` class is present
// on the root element (handled by Providers). If you ever see mismatched colors,
// this comment helps identify theme-class issues first.


type LocalAssemblyGuide = {
  id: string
  title: string
  folder: string
  href: string
}

type Props = {
  localGuides?: LocalAssemblyGuide[]
  initialCategories?: any[]
}

export default function AssemblyGuidesPageClient({ localGuides = [], initialCategories }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<'a-z' | 'z-a'>('a-z')
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useGetPublicWebPageItemsQuery('assembly-guides')
  const items = useMemo(() => {
    const adminItems = data?.items ?? []
    const localItems = localGuides.map((guide, idx) => ({
      id: `local-${guide.id}-${idx}`,
      title: guide.title,
      key: guide.folder,
      image_url: null,
      button_text: 'Open Assembly Guide',
      link_url: guide.href,
    }))

    const normalizedAdminItems = adminItems.map((item, idx) => ({
      ...item,
      id: `admin-${item.id}-${idx}`,
      button_text:
        item.button_text && item.button_text !== 'Open PDF'
          ? item.button_text
          : 'Open Assembly Guide',
    }))

    const seenLinks = new Set<string>()
    const baseItems = [...localItems, ...normalizedAdminItems].filter((item) => {
      const link = String(item.link_url ?? '').trim().toLowerCase()
      if (!link) return true
      if (seenLinks.has(link)) return false
      seenLinks.add(link)
      return true
    })

    const query = search.trim().toLowerCase()
    const filtered = !query ? baseItems : baseItems.filter((item) => {
      const title = String(item.title ?? '').toLowerCase()
      const key = String(item.key ?? '').toLowerCase()
      return title.includes(query) || key.includes(query)
    })

    return [...filtered].sort((a, b) => {
      const left = String(a.title ?? '').localeCompare(String(b.title ?? ''), undefined, { sensitivity: 'base' })
      return sortOrder === 'a-z' ? left : left * -1
    })
  }, [data?.items, localGuides, search, sortOrder])

  const ITEMS_PER_PAGE = 9
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return items.slice(start, start + ITEMS_PER_PAGE)
  }, [currentPage, items])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleSortChange = (value: 'a-z' | 'z-a') => {
    setSortOrder(value)
    setPage(1)
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }
    router.push('/')
  }

  return (
    <>
      <TopBar />
      <Navbar initialCategories={initialCategories} />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        {/* Animated background accents */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-72 -left-24 h-72 w-72 rounded-full bg-sky-200/25 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-40 -right-24 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl"
          />
        </div>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="container mx-auto px-4 pt-8 pb-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border border-blue-200/70 bg-white/80 px-6 py-8 shadow-[0_0_0_1px_rgba(37,99,235,0.08)] backdrop-blur dark:bg-gray-900/60 dark:border-gray-800"

          >
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.18),transparent_55%)]" />
            <div aria-hidden className="absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_bottom_right,rgba(56,189,248,0.14),transparent_50%)]" />

            <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                      <path d="M9 15h6" />
                      <path d="M9 11h2" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Assembly Guides</h1>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {items.length.toLocaleString()} guide{items.length !== 1 ? 's' : ''} available
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 md:mt-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12h18" />
                    <path d="M7 7h10" />
                    <path d="M7 17h10" />
                  </svg>
                  PDF Library
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20" />
                    <path d="M17 7l-5-5-5 5" />
                    <path d="M17 17l-5 5-5-5" />
                  </svg>
                  Latest Updates
                </div>
              </div>
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="container mx-auto px-4 pb-16"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
            className="mb-6 rounded-2xl border border-blue-200/70 bg-white/80 p-4 shadow-[0_0_0_1px_rgba(37,99,235,0.06)] backdrop-blur dark:bg-gray-900/60 dark:border-gray-800"
          >

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div className="relative flex-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search guides..."
                  className="w-full rounded-xl border border-blue-200 bg-white px-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200/60"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500/60 transition hover:text-blue-600"
                    aria-label="Clear search"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sortOrder}
                  onChange={(e) => handleSortChange(e.target.value as 'a-z' | 'z-a')}
                  className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200/60"
                >
                  <option value="a-z">A to Z</option>
                  <option value="z-a">Z to A</option>
                </select>
              </div>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-48 animate-pulse rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-sm text-red-700">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold">Couldn’t load guides</h2>
                  <p className="mt-1 text-sm text-red-600">Please refresh the page and try again.</p>
                </div>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-blue-200 bg-white px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9" />
                  <path d="M7 20h10" />
                  <path d="M12 20v-7" />
                  <path d="m8 13 4-4 4 4" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                {search.trim() ? 'No matching guides found' : 'No guides available'}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {search.trim() ? 'Try a different search term.' : 'Check back soon for assembly guides.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <motion.div
                key={`assembly-page-${currentPage}-${sortOrder}-${search}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              >
                {paginatedItems.map((item, idx) => {
                  const card = (
                    <motion.article
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.12) }}
                      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 dark:bg-slate-900/70 dark:border-slate-800"

                    >
                      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_55%)] opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="relative flex flex-col p-5">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                            <path d="M9 15h6" />
                            <path d="M9 11h2" />
                          </svg>
                        </div>

                        <h2 className="text-base font-semibold text-gray-900 line-clamp-2">
                          {item.title || 'Assembly Guide'}
                        </h2>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.key || 'Assembly Guide'}
                        </p>

                        <div className="mt-4 flex items-center justify-between gap-2 text-sm font-medium text-blue-700">
                          <span className="truncate">{item.button_text || 'Open PDF'}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition group-hover:translate-x-1">
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </motion.article>
                  )

                  return item.link_url ? (
                    <Link
                      key={item.id}
                      href={item.link_url}
                      target={item.link_url.startsWith('http') ? '_blank' : undefined}
                      rel={item.link_url.startsWith('http') ? 'noreferrer' : undefined}
                      className="block h-full"
                    >
                      {card}
                    </Link>
                  ) : (
                    <div key={item.id} className="h-full">
                      {card}
                    </div>
                  )
                })}
              </motion.div>

              {totalPages > 1 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28 }}
                  className="flex flex-col items-center justify-between gap-4 rounded-xl border border-blue-200 bg-white px-4 py-4 shadow-sm md:flex-row"
                >
                  <p className="text-sm text-gray-600">
                    Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage <= 1}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18 9 12l6-6" />
                      </svg>
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </div>
          )}
        </motion.section>
      </main>
      <Footer />
    </>
  )
}


