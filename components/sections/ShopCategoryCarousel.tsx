'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type CategoryCardItem = {
  id: number
  name: string
  url: string
  count: number
  image: string
}

export default function ShopCategoryCarousel({
  cards,
}: {
  cards: CategoryCardItem[]
}) {
  const carouselRef = useRef<HTMLDivElement | null>(null)

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return
    const amount = Math.min(carouselRef.current.clientWidth * 0.85, 960)
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollCarousel('left')}
        className="absolute left-0 top-1/2 z-10 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-lg backdrop-blur md:inline-flex"
        aria-label="Scroll categories left"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div
        ref={carouselRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <AnimatePresence initial={false}>
          {cards.map((card, index) => (
            <motion.div
              key={`${card.id}-${card.url}-${card.name}`}
              initial={{ opacity: 0, y: 22, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ duration: 0.34, delay: index * 0.05 }}
              className="flex-none"
            >
              <Link
                href={`/category/${card.url}`}
                className="group relative block h-64 min-w-[280px] snap-start overflow-hidden rounded-2xl shadow-sm transition-shadow duration-500 hover:shadow-xl md:h-80 md:min-w-[320px]"
              >
                <Image src={card.image} alt={card.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-lg font-bold leading-tight text-white transition-colors duration-300 group-hover:text-orange-300">{card.name}</h3>
                  <p className="mt-0.5 text-xs text-white/60">{card.count} Products</p>
                  <div className="mt-1 h-0 overflow-hidden transition-all duration-300 group-hover:h-7">
                    <span className="flex items-center gap-1 text-sm font-semibold text-orange-400">
                      Shop Now
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={() => scrollCarousel('right')}
        className="absolute right-0 top-1/2 z-10 hidden h-12 w-12 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-lg backdrop-blur md:inline-flex"
        aria-label="Scroll categories right"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}
