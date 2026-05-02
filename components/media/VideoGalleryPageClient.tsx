'use client'

import { useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/landing-page/Footer'
import { useGetPublicWebPageItemsQuery } from '@/store/api/webPagesApi'
import type { Category } from '@/store/api/categoriesApi'
import { Skeleton } from '@heroui/react/skeleton'

type VideoGalleryPageClientProps = {
  initialCategories?: Category[]
}

const SAMPLE_VIDEO_ITEMS = [
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

export default function VideoGalleryPageClient({ initialCategories }: VideoGalleryPageClientProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const { data, isLoading } = useGetPublicWebPageItemsQuery('video-gallery')

  const galleryItems = data?.items?.filter((item) => item.is_active) ?? []

  const getVideoId = (url: string): string | null => {
    if (!url) return null
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&/?\s]+)/)
    return youtubeMatch ? youtubeMatch[1] : null
  }

  const isYoutubeUrl = (url: string) => /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url || '')

  return (
    <>
      <TopBar />
      <Navbar initialCategories={initialCategories} />
      <main className="bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-10">
          {/* Header */}
          <div className="mb-10 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-8 md:px-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Video Gallery</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Explore our collection of premium home and lifestyle videos
            </p>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-lg" />
              ))}
            </div>
          ) : galleryItems.length === 0 ? (
            /* Empty State */
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-8 py-16 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                No Videos Available
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Check back soon for our video collection!
              </p>
            </div>
          ) : (
            /* Gallery Grid */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleryItems.map((item) => {
                  const videoId = item.link_url ? getVideoId(item.link_url) : null
                  const isYoutube = item.link_url ? isYoutubeUrl(item.link_url) : false
                  const videoThumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null

                  return (
                    <div
                      key={item.id}
                      className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 transition-all hover:border-orange-400 dark:hover:border-orange-400"
                      onClick={() => item.link_url && setSelectedVideo(item.link_url)}
                    >
                      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                        {videoThumbnail ? (
                          <img
                            src={videoThumbnail}
                            alt={item.title || 'Gallery video'}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : item.link_url && !isYoutube ? (
                          <video
                            src={item.link_url}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-600">
                            <svg
                              className="h-12 w-12 text-gray-400 dark:text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                            </svg>
                          </div>
                        )}
                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white transition-transform group-hover:scale-110">
                            <svg className="h-6 w-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      {item.title && (
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Video Modal */}
          {selectedVideo && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setSelectedVideo(null)}
            >
              <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                {isYoutubeUrl(selectedVideo) ? (
                  <iframe
                    width="100%"
                    height="500"
                    src={`https://www.youtube.com/embed/${getVideoId(selectedVideo) || ''}`}
                    title="Video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg"
                  />
                ) : (
                  <video
                    src={selectedVideo}
                    controls
                    autoPlay
                    className="w-full max-h-[80vh] rounded-lg bg-black"
                  />
                )}
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="absolute -right-10 -top-10 text-white hover:text-gray-300 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
