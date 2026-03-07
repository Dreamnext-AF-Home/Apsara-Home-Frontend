'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useGetPublicHomeContentQuery } from '@/store/api/webPagesApi'

export default function DynamicWebContent() {
  const { data, isLoading, isError } = useGetPublicHomeContentQuery()

  if (isLoading || isError || !data) return null

  const announcements = data.announcements ?? []
  const banners = data.banners ?? []
  const homeBlocks = data.home ?? []

  if (announcements.length === 0 && banners.length === 0 && homeBlocks.length === 0) return null

  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 py-4 space-y-4">
        {announcements.length > 0 ? (
          <div className="rounded-2xl border border-orange-100 bg-orange-50 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              {announcements.map((item) => (
                <span key={item.id} className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-700 border border-orange-100">
                  {item.title || item.body || 'Announcement'}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {banners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {banners.map((item) => {
              const content = (
                <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 h-40 md:h-48">
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.title || 'Banner'} fill className="object-cover" unoptimized />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/10" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                    <p className="text-sm font-bold">{item.title || 'Banner'}</p>
                    {item.subtitle ? <p className="text-xs text-white/85 mt-1">{item.subtitle}</p> : null}
                  </div>
                </div>
              )
              return item.link_url ? (
                <Link key={item.id} href={item.link_url}>
                  {content}
                </Link>
              ) : (
                <div key={item.id}>{content}</div>
              )
            })}
          </div>
        ) : null}

        {homeBlocks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {homeBlocks.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="text-sm font-bold text-slate-800">{item.title || 'Home Block'}</p>
                {item.subtitle ? <p className="text-xs text-slate-500 mt-1">{item.subtitle}</p> : null}
                {item.body ? <p className="text-xs text-slate-600 mt-2 line-clamp-3">{item.body}</p> : null}
                {item.link_url ? (
                  <Link href={item.link_url} className="inline-flex mt-3 text-xs font-semibold text-orange-600 hover:text-orange-700">
                    {item.button_text || 'Explore'}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

