'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useGetPublicWebPageItemsQuery } from '@/store/api/webPagesApi'
import TopBar from '@/components/layout/TopBar'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/landing-page/Footer'

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
      <main className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="container mx-auto px-4 pt-8 pb-8"
      >
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-8 md:px-10 md:py-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assembly Guides
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {items.length.toLocaleString()} guide{items.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="container mx-auto px-4 pb-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
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
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 px-10 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition focus:border-sky-400 dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 transition hover:text-gray-600 dark:hover:text-gray-400"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <select
              value={sortOrder}
              onChange={(e) => handleSortChange(e.target.value as 'a-z' | 'z-a')}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white outline-none transition focus:border-sky-400 dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50"
            >
              <option value="a-z">A to Z</option>
              <option value="z-a">Z to A</option>
            </select>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-6 py-8 text-sm text-red-700 dark:text-red-400">
            Failed to load assembly guides.
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {search.trim() ? 'No matching guides found' : 'No guides available'}
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {search.trim()
                ? 'Try a different search term.'
                : 'Check back soon for assembly guides.'}
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
              {paginatedItems.map((item) => {
              const card = (
                <motion.article
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="group flex h-full flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:border-sky-500 dark:hover:border-sky-400 transition-colors"
                >
                  <div className="flex flex-col p-5">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-sky-200 dark:border-sky-900/30 dark:bg-sky-900/30 text-sky-500 dark:text-sky-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <path d="M9 15h6" />
                        <path d="M9 11h2" />
                      </svg>
                    </div>

                    <h2 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {item.title || 'Assembly Guide'}
                    </h2>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.key || 'Assembly Guide'}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-sky-600 dark:text-sky-400">
                      <span>{item.button_text || 'Open PDF'}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition group-hover:translate-x-1">
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
                className="flex flex-col items-center justify-between gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 md:flex-row"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> of{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="rounded-lg bg-sky-500 dark:bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 dark:hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
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


