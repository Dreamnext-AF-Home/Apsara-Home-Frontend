'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ShopBuilderSections, { type ShopBuilderApiResponse } from '@/components/sections/ShopBuilderSections'
import type { PartnerStorefrontConfig } from '@/libs/partnerStorefront'

type Props = {
  partner: PartnerStorefrontConfig
  data: ShopBuilderApiResponse | null
}

export default function PartnerStorefrontPage({ partner, data }: Props) {
  const { status, data: session } = useSession()
  const router = useRouter()
  const titleColor = partner.themeColor
  const displayName = partner.displayName.trim()
  const pageTitle = displayName.toLowerCase().endsWith('shop') ? displayName : `${displayName} Shop`
  const allowedSet = new Set(partner.allowedCategoryIds ?? [])
  const sanitizedItems = partner.allowedCategoryIds.length === 0
    ? (data?.items ?? []).filter((item) => String(item.key ?? '').trim() !== 'category-grid')
    : (data?.items ?? [])
  const sanitizedCategories = partner.allowedCategoryIds.length === 0
    ? []
    : (data?.categories ?? []).filter((category) => allowedSet.has(category.id))
  const sanitizedProducts = partner.allowedCategoryIds.length === 0
    ? []
    : (data?.products ?? []).filter((product) => allowedSet.has(product.catid))
  const sanitizedData = data
    ? {
      items: sanitizedItems,
      categories: sanitizedCategories,
      products: sanitizedProducts,
    }
    : data

  const logoUrlWithVersion = partner.logoUrl
    ? `${partner.logoUrl}${partner.logoUrl.includes('?') ? '&' : '?'}v=${partner.logoVersion || '1'}`
    : ''
  const tabLogoUrlWithVersion = partner.tabLogoUrl
    ? `${partner.tabLogoUrl}${partner.tabLogoUrl.includes('?') ? '&' : '?'}v=${partner.logoVersion || '1'}`
    : logoUrlWithVersion
  const partnerShopPath = `/shop/${partner.slug}`
  const partnerProductPath = `/shop/${partner.slug}/product`
  const loginHref = `/${partner.slug}/login?switch=1&callback=${encodeURIComponent(partnerProductPath)}`
  const role = String(session?.user?.role ?? '').toLowerCase()
  const isCustomerSession = status === 'authenticated' && (role === 'customer' || role === '')

  useEffect(() => {
    const setIcon = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.rel = rel
        document.head.appendChild(link)
      }
      link.href = href
    }

    if (tabLogoUrlWithVersion) {
      setIcon('icon', tabLogoUrlWithVersion)
      setIcon('apple-touch-icon', tabLogoUrlWithVersion)
    }

    if (displayName) {
      document.title = pageTitle
    }
  }, [displayName, pageTitle, tabLogoUrlWithVersion])

  useEffect(() => {
    const key = 'afhome:partner-storefront-updated'
    const channelName = 'afhome:partner-storefront'

    const handlePayload = (payload: unknown) => {
      if (!payload || typeof payload !== 'object') return
      const data = payload as { slug?: string }
      if (String(data.slug ?? '').trim().toLowerCase() === partner.slug.toLowerCase()) {
        router.refresh()
      }
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== key || !event.newValue) return
      try {
        handlePayload(JSON.parse(event.newValue))
      } catch {
        // ignore malformed payload
      }
    }

    let channel: BroadcastChannel | null = null
    const onChannelMessage = (event: MessageEvent) => handlePayload(event.data)

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel(channelName)
      channel.addEventListener('message', onChannelMessage)
    }

    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      if (channel) {
        channel.removeEventListener('message', onChannelMessage)
        channel.close()
      }
    }
  }, [partner.slug, router])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section
        className="border-b border-slate-200"
        style={{
          background: `linear-gradient(135deg, ${partner.themeColor} 0%, ${partner.accentColor} 100%)`,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 rounded-[28px] bg-white/92 p-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between md:p-6">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-transparent shadow-sm sm:h-24 sm:w-28">
                {partner.logoUrl ? (
                  <img
                    src={logoUrlWithVersion}
                    alt={partner.displayName}
                    className="h-full w-full object-contain p-2.5 sm:p-3"
                  />
                ) : (
                  <span className="text-xl font-bold text-slate-700">{partner.displayName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Partner Store</p>
                <h1
                  className="text-2xl font-bold tracking-tight sm:text-3xl"
                  style={{ color: titleColor }}
                >
                  {partner.heroTitle}
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">{partner.heroSubtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isCustomerSession ? (
                <Link
                  href={loginHref}
                  className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
                  style={{ backgroundColor: partner.themeColor }}
                >
                  Login
                </Link>
              ) : null}
              <Link
                href={`${partnerShopPath}/product`}
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
              >
                {partner.displayName} Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ShopBuilderSections
        data={sanitizedData ?? data}
        partnerSlug={partner.slug}
        partnerHeroVideoUrl={partner.heroVideoUrl || undefined}
        allowedCategoryIds={partner.allowedCategoryIds}
        featuredProductIds={partner.featuredProductIds}
        enableActivateDiscount={partner.enableActivateDiscount}
      />

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>
            Orders from <span className="font-semibold text-slate-800">{partner.displayName}</span> are still processed through AF Home.
          </p>
          {partner.notificationEmail ? <p>Partner notifications: {partner.notificationEmail}</p> : null}
        </div>
      </footer>
    </div>
  )
}
