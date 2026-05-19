'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import TopBar from '@/components/layout/TopBar'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/landing-page/Footer'
import { useGetPublicWebPageItemsQuery } from '@/store/api/webPagesApi'


import type { Category } from '@/store/api/categoriesApi'

type PhotoGalleryPageClientProps = {

  initialCategories?: Category[]
}

const SAMPLE_GALLERY_ITEMS = [
  {
    id: 1,
    title: 'Modern Living Room',
    subtitle: 'Contemporary furniture arrangement with elegant decor',
    image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
    category: 'Living Room',
    is_active: true,
  },
  {
    id: 2,
    title: 'Bedroom Comfort',
    subtitle: 'Cozy bedroom design with premium bedding',
    image_url: 'https://images.unsplash.com/photo-1540932239986-310128078ceb?w=800&h=600&fit=crop',
    category: 'Bedroom',
    is_active: true,
  },
  {
    id: 3,
    title: 'Kitchen Excellence',
    subtitle: 'Modern kitchen with professional appliances',
    image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
    category: 'Kitchen',
    is_active: true,
  },
  {
    id: 4,
    title: 'Dining Experience',
    subtitle: 'Elegant dining room setup',
    image_url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop',
    category: 'Dining Room',
    is_active: true,
  },
  {
    id: 5,
    title: 'Home Office',
    subtitle: 'Productive workspace design',
    image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&h=600&fit=crop',
    category: 'Office',
    is_active: true,
  },
  {
    id: 6,
    title: 'Bathroom Spa',
    subtitle: 'Luxurious bathroom with modern fixtures',
    image_url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop',
    category: 'Bathroom',
    is_active: true,
  },
  {
    id: 7,
    title: 'Living Space',
    subtitle: 'Spacious living area with natural lighting',
    image_url: 'https://images.unsplash.com/photo-1537457905121-5650b2b1c8da?w=800&h=600&fit=crop',
    category: 'Living Room',
    is_active: true,
  },
  {
    id: 8,
    title: 'Outdoor Patio',
    subtitle: 'Beautiful outdoor entertainment space',
    image_url: 'https://images.unsplash.com/photo-1600493463592-8e36ae95ef56?w=800&h=600&fit=crop',
    category: 'Outdoor',
    is_active: true,
  },
  {
    id: 9,
    title: 'Cozy Corner',
    subtitle: 'Perfect reading nook with comfortable seating',
    image_url: 'https://images.unsplash.com/photo-1578769169216-5f1b07b6b79c?w=800&h=600&fit=crop',
    category: 'Living Room',
    is_active: true,
  },
  {
    id: 10,
    title: 'Modern Aesthetic',
    subtitle: 'Minimalist design with clean lines',
    image_url: 'https://images.unsplash.com/photo-1512519439147-ca5c5b59afaa?w=800&h=600&fit=crop',
    category: 'Bedroom',
    is_active: true,
  },
  {
    id: 11,
    title: 'Kitchen Island',
    subtitle: 'Functional and stylish cooking space',
    image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&h=600&fit=crop',
    category: 'Kitchen',
    is_active: true,
  },
  {
    id: 12,
    title: 'Garden Paradise',
    subtitle: 'Lush outdoor garden with seating area',
    image_url: 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=800&h=600&fit=crop',
    category: 'Outdoor',
    is_active: true,
  },
]

export default function PhotoGalleryPageClient({ initialCategories }: PhotoGalleryPageClientProps) {
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const { data, isLoading } = useGetPublicWebPageItemsQuery('photo-gallery')

  // Fallback demo items so the UI always shows like a real gallery even if API returns empty.
  const fallbackGalleryItems = SAMPLE_GALLERY_ITEMS.map((it) => ({
    id: it.id,
    title: it.title,
    subtitle: it.subtitle,
    image_url: it.image_url,
    payload: { category: it.category },
    is_active: true,
  }))

  const galleryItems = (data?.items?.filter((item) => item.is_active) ?? [])
  const effectiveGalleryItems = galleryItems.length > 0 ? galleryItems : fallbackGalleryItems


  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(
      effectiveGalleryItems.map((item) => {
        const payloadCategory = typeof item.payload?.category === 'string' ? item.payload.category.trim() : ''
        return payloadCategory !== '' ? payloadCategory : 'Other'
      }),
    )
    return ['All', ...Array.from(cats)].sort()
  }, [effectiveGalleryItems])

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return effectiveGalleryItems
    return effectiveGalleryItems.filter((item) => {
      const payloadCategory = typeof item.payload?.category === 'string' ? item.payload.category.trim() : ''
      const category = payloadCategory !== '' ? payloadCategory : 'Other'
      return category === selectedCategory
    })
  }, [effectiveGalleryItems, selectedCategory])


  const selectedImage = galleryItems.find(item => item.id === selectedImageId)
  const selectedIndex = filteredItems.findIndex(item => item.id === selectedImageId)

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      setSelectedImageId(filteredItems[selectedIndex - 1].id)
    }
  }

  const handleNext = () => {
    if (selectedIndex < filteredItems.length - 1) {
      setSelectedImageId(filteredItems[selectedIndex + 1].id)
    }
  }

  return (
    <>
      <TopBar />
      <Navbar initialCategories={initialCategories} />
      <main className="bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative mb-10">
            {/* Colored background for the title container */}
            <div aria-hidden className="absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-br from-blue-100 via-sky-50 to-white blur-2xl" />
            <div aria-hidden className="absolute -inset-3 -z-10 rounded-3xl bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.22),transparent_55%)]" />
            <div aria-hidden className="absolute -left-24 top-6 h-24 w-24 -z-10 rounded-full bg-blue-200/25 blur-3xl" />
            <div aria-hidden className="absolute -right-24 bottom-6 h-24 w-24 -z-10 rounded-full bg-sky-200/25 blur-3xl" />

            <div className="rounded-3xl border border-blue-200/70 bg-white/80 p-6 shadow-[0_0_0_1px_rgba(37,99,235,0.06)] backdrop-blur dark:bg-gray-900/60 dark:border-gray-800">

              <div className="flex items-center justify-between gap-6 flex-wrap">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-700">
                    {/* camera / photo icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h6l2 3h3a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>

                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
                      Photo Gallery
                    </h1>
                    <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
                      Explore premium home and lifestyle inspirations—beautifully curated in blue.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9" />
                          <path d="M7 20h10" />
                          <path d="M12 20v-7" />
                          <path d="m8 13 4-4 4 4" />
                        </svg>
                        Curated
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/60 px-3 py-1 text-xs font-semibold text-blue-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 9l8-7 8 7" />
                          <path d="M6 10v10h12V10" />
                        </svg>
                        Tap a photo to view
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2" />
              </div>
            </div>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 flex flex-wrap gap-2"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category)
                  setSelectedImageId(null)
                }}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent hover:border-blue-100'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white animate-pulse" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-blue-200/70 bg-white/70 px-8 py-16 text-center shadow-sm"
            >
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 7a2 2 0 0 1 2-2h3" />
                    <path d="M14 5h4a2 2 0 0 1 2 2v3" />
                    <path d="M4 17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7z" />
                    <path d="M8 12h4" />
                    <path d="M10 10v4" />
                  </svg>
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No Photos Available</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Check back soon for our collection!</p>
            </motion.div>
          ) : (
            /* Gallery Grid - Responsive Layout */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl"
                    onClick={() => setSelectedImageId(item.id)}
                  >
                    <div className="relative aspect-square bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                      {item.image_url ? (
                        <>
                          <Image
                            src={item.image_url}
                            alt={item.title || 'Gallery image'}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            quality={80}
                            loading="lazy"
                          />
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/90">
                                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <svg className="h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {item.title && (
                      <div className="p-4">
                        <div className="mb-2">
                          <span className="text-xs font-semibold text-blue-700 dark:text-sky-300 uppercase tracking-wide">
                            {typeof item.payload?.category === 'string' && item.payload.category.trim() !== ''
                              ? item.payload.category
                              : 'Gallery'}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-700 dark:group-hover:text-sky-300 transition-colors">
                          {item.title}
                        </h3>
                        {item.subtitle && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedImageId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Container */}
              <div className="relative rounded-xl overflow-hidden bg-black">
                <Image
                  src={selectedImage.image_url || '/placeholder-image.jpg'}
                  alt={selectedImage.title || 'Gallery image'}
                  width={1200}
                  height={800}
                  className="h-auto w-auto max-h-[90vh] max-w-full object-contain"
                  sizes="(max-width: 1024px) 100vw, 80vw"
                  quality={95}
                  priority
                />
              </div>

              {/* Image Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-white"
              >
                <h2 className="text-2xl font-bold">{selectedImage.title}</h2>
                {selectedImage.subtitle && (
                  <p className="mt-2 text-gray-300 text-lg">{selectedImage.subtitle}</p>
                )}
                {typeof selectedImage.payload?.category === 'string' && selectedImage.payload.category.trim() !== '' ? (
                  <div className="mt-3">
                    <span className="inline-block px-3 py-1 rounded-lg bg-sky-600 text-sm font-medium">
                      {selectedImage.payload.category}
                    </span>
                  </div>
                ) : null}
                <p className="mt-3 text-gray-400 text-sm">
                  Image {selectedIndex + 1} of {filteredItems.length}
                </p>
              </motion.div>

              {/* Controls */}
              <div className="mt-6 flex items-center justify-between gap-4">
                <button
                  onClick={handlePrevious}
                  disabled={selectedIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <button
                  onClick={() => setSelectedImageId(null)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </button>

                <button
                  onClick={handleNext}
                  disabled={selectedIndex === filteredItems.length - 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all"
                >
                  Next
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  )
}
