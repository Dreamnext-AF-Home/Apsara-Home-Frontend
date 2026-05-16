'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Skeleton } from '@heroui/react/skeleton'
import TopBar from '@/components/layout/TopBar'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/landing-page/Footer'
import { useGetPublicWebPageItemsQuery } from '@/store/api/webPagesApi'
import type { Category } from '@/store/api/categoriesApi'

type VideoGalleryPageClientProps = {
  initialCategories?: Category[]
}

type VideoGalleryItem = {
  id: number
  title?: string | null
  subtitle?: string | null
  link_url?: string | null
  is_active?: boolean
  payload?: unknown
}



const SAMPLE_VIDEO_ITEMS: VideoGalleryItem[] = [
  {
    id: 1,
    title: 'Modern Living Room Tour',
    subtitle: 'A complete tour of contemporary furniture arrangements',
    link_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    is_active: true,
  },
  {
    id: 2,
    title: 'Bedroom Design Tips',
    subtitle: 'Creating the perfect bedroom sanctuary',
    link_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    is_active: true,
  },
  {
    id: 3,
    title: 'Kitchen Setup Guide',
    subtitle: 'Professional kitchen organization and design',
    link_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    is_active: true,
  },
  {
    id: 4,
    title: 'Furniture Assembly',
    subtitle: 'Step-by-step furniture assembly instructions',
    link_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    is_active: true,
  },
  {
    id: 5,
    title: 'Home Office Setup',
    subtitle: 'Creating an efficient home workspace',
    link_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    is_active: true,
  },
  {
    id: 6,
    title: 'Interior Design Trends',
    subtitle: 'Latest trends in home interior design',
    link_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    is_active: true,
  },
]

function getVideoId(url: string): string | null {
  if (!url) return null
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&/?\s]+)/)
  return youtubeMatch ? youtubeMatch[1] : null
}

function isYoutubeUrl(url: string) {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url || '')
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14" />
      <rect x="3" y="7" width="12" height="10" rx="2" />
    </svg>
  )
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

export default function VideoGalleryPageClient({ initialCategories }: VideoGalleryPageClientProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const { data, isLoading } = useGetPublicWebPageItemsQuery('video-gallery')

  const galleryItems: VideoGalleryItem[] = data?.items?.filter((item: VideoGalleryItem) => item.is_active) ?? []
  const effectiveGalleryItems = galleryItems.length > 0 ? galleryItems : SAMPLE_VIDEO_ITEMS

  const selectedItem = useMemo(() => {
    if (!selectedVideo) return null
    return effectiveGalleryItems.find((it) => it.link_url === selectedVideo) ?? null
  }, [effectiveGalleryItems, selectedVideo])

  return (
    <>
      <TopBar />
      <Navbar initialCategories={initialCategories} />

      <main className="bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-10"
          >
            <div
              aria-hidden
              className="absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-br from-blue-100 via-sky-50 to-white blur-2xl dark:from-gray-800 dark:via-gray-900 dark:to-gray-900"
            />
            <div
              aria-hidden
              className="absolute -inset-3 -z-10 rounded-3xl bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.22),transparent_55%)]"
            />
            <div aria-hidden className="absolute -left-24 top-6 h-24 w-24 -z-10 rounded-full bg-blue-200/25 blur-3xl" />
            <div aria-hidden className="absolute -right-24 bottom-6 h-24 w-24 -z-10 rounded-full bg-amber-200/25 blur-3xl" />

            <div className="rounded-3xl border border-blue-200/70 bg-white/80 p-6 shadow-[0_0_0_1px_rgba(59,130,246,0.06)] backdrop-blur md:p-8 dark:border-white/10 dark:bg-gray-900/60">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-700">
                    <VideoIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
                      Video Gallery
                    </h1>
                    <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
                      Premium design walkthroughs—tips, inspiration, and assembly guides in one place.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z" />
                        </svg>
                        Curated Picks
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/60 px-3 py-1 text-xs font-semibold text-orange-700">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z" />
                          <path d="M10 9l6 3-6 3V9z" />
                        </svg>
                        Tap to Play
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Loading */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
            className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/60 to-white p-2 overflow-hidden dark:border-orange-900/40 dark:from-orange-900/20 dark:to-gray-900 dark:text-white"
                >
                  <Skeleton className="aspect-video rounded-xl" />
                  <div className="px-3 py-3 space-y-2">
                    <Skeleton className="h-4 w-4/5 rounded-lg" />
                    <Skeleton className="h-3 w-2/3 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : effectiveGalleryItems.length === 0 ? (
            /* Empty */
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-orange-200/70 bg-white/70 px-8 py-16 text-center shadow-sm dark:border-orange-900/40 dark:bg-gray-900/60"
            >
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-700">
                  <VideoIcon className="h-7 w-7" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No Videos Available</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Check back soon for our latest collection!</p>
            </motion.div>
          ) : (
            /* Grid */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {effectiveGalleryItems.map((item, index) => {
                const linkUrl = item.link_url || ''
                const videoId = linkUrl ? getVideoId(linkUrl) : null
                const isYoutube = linkUrl ? isYoutubeUrl(linkUrl) : false
                const videoThumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-orange-100 bg-white dark:bg-gray-800 transition-all"
                    onClick={() => linkUrl && setSelectedVideo(linkUrl)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        linkUrl && setSelectedVideo(linkUrl)
                      }
                    }}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.18),transparent_45%)] opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative aspect-video bg-gradient-to-br from-orange-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                      {videoThumbnail ? (
                        <img
                          src={videoThumbnail}
                          alt={item.title || 'Video thumbnail'}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : linkUrl && !isYoutube ? (
                        <video
                          src={linkUrl}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200/60 dark:bg-gray-600">
                          <VideoIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}

                      {/* overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg shadow-orange-200/40 transform transition-transform duration-300 group-hover:scale-110 dark:bg-white/10 dark:shadow-none">
                          <PlayIcon className="h-7 w-7 text-orange-600" />
                        </div>
                      </div>

                      <div className="absolute left-3 top-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-orange-700 border border-orange-200 dark:bg-white/10 dark:text-orange-200 dark:border-orange-900/40">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 20l9-5-9-5-9 5 9 5z" />
                            <path d="M12 12l9-5-9-5-9 5 9 5z" />
                          </svg>
                          Video
                        </span>
                      </div>

                      {linkUrl && isYoutube ? (
                        <div className="absolute right-3 top-3">
                          <span className="inline-flex items-center justify-center rounded-full bg-black/40 text-white/90 border border-white/20 h-9 w-9">
                            <ExternalIcon className="h-4 w-4" />
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {item.title ? (
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">
                          {item.title}
                        </h3>
                        {item.subtitle ? (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{item.subtitle}</p>
                        ) : null}
                      </div>
                    ) : null}

                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-orange-300/60"
                      initial={false}
                      animate={{ opacity: 1 }}
                    />
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* Modal */}
          <AnimatePresence>
            {selectedVideo ? (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedVideo(null)}
              >
                <motion.div
                  className="relative w-full max-w-4xl"
                  initial={{ scale: 0.97, y: 10, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.98, y: 10, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="absolute -right-3 -top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    aria-label="Close video"
                  >
                    <CloseIcon className="h-5 w-5" />
                  </button>

                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-white dark:bg-gray-900/90 dark:border-white/10">
                    {isYoutubeUrl(selectedVideo) ? (
                      <iframe
                        width="100%"
                        height="520"
                        src={`https://www.youtube.com/embed/${getVideoId(selectedVideo) || ''}`}
                        title="Video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full aspect-video"
                      />
                    ) : (
                      <video src={selectedVideo} controls autoPlay className="w-full max-h-[75vh]" />
                    )}
                  </div>

                  {selectedItem && selectedItem.title ? (
                    <div className="mt-4 px-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
<h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedItem.title}</h2>
                          {selectedItem.subtitle ? (
                            <p className="mt-1 text-sm text-white/70">{selectedItem.subtitle}</p>
                          ) : null}
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-white/60 text-xs font-semibold border border-white/15 rounded-full px-3 py-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 8v4l2 2" />
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                          LIVE PREVIEW
                        </div>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </>
  )
}

