'use client'

import type { MouseEvent } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useGetAdminMeQuery } from '@/store/api/authApi'
import { canAccessWebContentSection } from '@/libs/adminPermissions'

type ContentCard = {
  title: string
  description: string
  href: string
  badge: string
  wcKey?: string  // wc: permission key; undefined = always visible
}

const builderCards: ContentCard[] = [
  {
    title: 'Home Builder',
    description: 'Manage homepage sections, featured blocks, banners, and dynamic cards from one place.',
    href: '/admin/webpages/home',
    badge: 'Core Page',
  },
  {
    title: 'Shop Builder',
    description: 'Set up the future section-based shop experience with cleaner merch blocks and promo placements.',
    href: '/admin/webpages/shop-builder',
    badge: 'CMS Direction',
    wcKey: 'wc:shop-builder',
  },
  {
    title: 'DreamBuild',
    description: 'Manage DreamBuild hero, services, projects, blogs, testimonials, gallery, process, and contact content.',
    href: '/admin/webpages/dreambuild',
    badge: 'Landing Page',
    wcKey: 'wc:dreambuild',
  },
  {
    title: 'Partner Storefronts',
    description: 'Create client-specific shop pages with custom logo, branding, and category filtering.',
    href: '/admin/webpages/partner-storefronts',
    badge: 'B2B',
    wcKey: 'wc:partner-storefronts',
  },

  {
    title: 'Adds Content',
    description: 'Manage advertising placements, promos, and sponsored content blocks.',
    href: '/admin/webpages/adds-content',
    badge: 'Ads',
  },
  {
    title: 'Database',
    description: 'Generate database export snapshots and review the latest export output.',
    href: '/admin/webpages/database',
    badge: 'Backup',
  },
  {
    title: 'Banners & Promos',
    description: 'Control promo strips, hero banners, campaign links, and schedule windows for active creatives.',
    href: '/admin/webpages/banners',
    badge: 'Marketing',
  },
]

const libraryCards: ContentCard[] = [
  {
    title: 'Announcements',
    description: 'Post time-sensitive alerts, shopping advisories, and service notices.',
    href: '/admin/webpages/announcements',
    badge: 'Utility',
  },
  {
    title: 'Media & Stories',
    description: 'Manage blog-style content, visual storytelling, and related editorial materials.',
    href: '/admin/webpages/blogs',
    badge: 'Content',
  },
  {
    title: 'Help & Guides',
    description: 'Keep self-service resources updated, including assembly guides and support-oriented content.',
    href: '/admin/webpages/assembly-guides',
    badge: 'Support',
  },
]

export default function WebContentDashboard() {
  const [openingHref, setOpeningHref] = useState<string | null>(null)
  const { data: session } = useSession()
  const accessToken = String((session?.user as { accessToken?: string } | undefined)?.accessToken ?? '')
  const userLevelId = Number((session?.user as { userLevelId?: number } | undefined)?.userLevelId ?? 0)
  const role = String(session?.user?.role ?? '').toLowerCase()

  const { data: adminMe } = useGetAdminMeQuery(accessToken || undefined, { skip: !accessToken })

  // Level 4 / web_content users may have section restrictions
  const isWebContentUser = userLevelId === 4 || role === 'web_content'
  const wcPermissions: string[] = isWebContentUser
    ? (adminMe?.admin_permissions ?? []).filter(p => p.startsWith('wc:'))
    : []

  const canSee = (card: ContentCard) => {
    if (!isWebContentUser || wcPermissions.length === 0) return true
    return card.wcKey ? canAccessWebContentSection(wcPermissions, card.wcKey) : false
  }

  const visibleBuilderCards = builderCards.filter(canSee)
  const visibleLibraryCards = libraryCards.filter(canSee)
  const handleCardClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    setOpeningHref(href)
  }
  const renderArrow = (isOpening: boolean) => (
    isOpening ? (
      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ) : (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
      </svg>
    )
  )

  return (
    <div className="space-y-6 dark:bg-slate-950 dark:text-slate-100">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-400">CMS Workspace</p>
            <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100 md:text-2xl">Web Content</h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              A cleaner content hub for page builders, promos, announcements, and editorial assets. This trims down the old dropdown-heavy workflow and makes future builder pages easier to manage.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 dark:border-cyan-900/40 dark:bg-cyan-950/30">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Less Hassle</p>
            <p className="mt-1 text-sm font-medium text-cyan-900 dark:text-cyan-100">Use this as the main jump-off point instead of hunting through long side-menu lists.</p>
          </div>
        </div>
      </div>

      {visibleBuilderCards.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Builder Pages</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Primary editing flows for visual sections and campaign-ready layouts.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {visibleBuilderCards.map((card) => {
              const isOpening = openingHref === card.href
              return (
              <Link
                key={card.href}
                href={card.href}
                onClick={(event) => handleCardClick(event, card.href)}
                aria-busy={isOpening}
                className={`group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-800 ${
                  isOpening ? 'border-cyan-300 bg-cyan-50/60 ring-2 ring-cyan-100 dark:border-cyan-700 dark:bg-cyan-950/20 dark:ring-cyan-900/40' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-300">
                      {card.badge}
                    </span>
                    <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">{card.title}</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors group-hover:bg-cyan-50 group-hover:text-cyan-700 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-cyan-950/40 dark:group-hover:text-cyan-300">
                    {renderArrow(isOpening)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{card.description}</p>
                {isOpening && (
                  <p className="mt-3 text-xs font-semibold text-cyan-700 dark:text-cyan-300">Opening...</p>
                )}
              </Link>
              )
            })}
          </div>
        </section>
      )}

      {visibleLibraryCards.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Content Library</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Secondary content areas that support customer comms and discoverability.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {visibleLibraryCards.map((card) => {
              const isOpening = openingHref === card.href
              return (
              <Link
                key={card.href}
                href={card.href}
                onClick={(event) => handleCardClick(event, card.href)}
                aria-busy={isOpening}
                className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 ${
                  isOpening ? 'border-cyan-300 bg-cyan-50/60 ring-2 ring-cyan-100 dark:border-cyan-700 dark:bg-cyan-950/20 dark:ring-cyan-900/40' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {card.badge}
                  </span>
                  <span className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors dark:bg-slate-800 dark:text-slate-300">
                    {renderArrow(isOpening)}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{card.description}</p>
                {isOpening && (
                  <p className="mt-3 text-xs font-semibold text-cyan-700 dark:text-cyan-300">Opening...</p>
                )}
              </Link>
              )
            })}
          </div>
        </section>
      )}

      {visibleBuilderCards.length === 0 && visibleLibraryCards.length === 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-sm font-semibold text-amber-800">No sections assigned</p>
          <p className="mt-1 text-xs text-amber-600">Your account has no web content sections enabled. Contact your admin.</p>
        </div>
      )}

      <section className="rounded-3xl border border-dashed border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50 p-5 dark:border-cyan-900/40 dark:from-cyan-950/20 dark:to-sky-950/20 md:p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Suggested Next Upgrade</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Turn `Shop Builder` into a real section-based CMS page where admins can reorder shop blocks, toggle visibility, edit copy, swap images, and choose featured products without touching frontend code.
        </p>
      </section>
    </div>
  )
}
