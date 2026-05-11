'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { getPartnerStorefrontConfig } from '@/libs/partnerStorefront'
import type { WebPageItem } from '@/store/api/webPagesApi'

type PartnerStorefrontApiResponse = {
  items?: WebPageItem[]
}

export default function PartnerLoading() {
  const pathname = usePathname()
  const partnerSlug = useMemo(() => pathname.split('/').filter(Boolean)[0] ?? '', [pathname])
  const brandText = useMemo(() => {
    if (!partnerSlug) return 'PARTNER STOREFRONT'
    return partnerSlug
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }, [partnerSlug])
  const [logoSrc, setLogoSrc] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const iconHref = document.querySelector('link[rel="icon"]')?.getAttribute('href')?.trim() || ''
    return iconHref || null
  })

  useEffect(() => {
    if (!partnerSlug) return
    const storageKey = `partner-storefront-icon:${partnerSlug}`

    if (typeof window !== 'undefined') {
      const cachedIcon = window.localStorage.getItem(storageKey)
      if (cachedIcon) {
        setLogoSrc(cachedIcon)
      } else {
        const iconHref = document.querySelector('link[rel="icon"]')?.getAttribute('href')?.trim() || ''
        if (iconHref) setLogoSrc(iconHref)
      }
    }

    async function loadStorefrontLogo() {
      try {
        const response = await fetch('/api/web-pages/partner-storefronts', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        })
        if (!response.ok) return

        const payload = (await response.json()) as PartnerStorefrontApiResponse
        const item = (payload.items ?? []).find((item) => getPartnerStorefrontConfig(item)?.slug === partnerSlug)
        const storefront = getPartnerStorefrontConfig(item)
        if (!storefront) return

        const resolvedLogo = storefront.tabLogoUrl || storefront.logoUrl
        if (!resolvedLogo) return

        setLogoSrc(resolvedLogo)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(storageKey, resolvedLogo)
        }
      } catch {
        // Keep cached logo if fetch fails.
      }
    }

    loadStorefrontLogo()
  }, [partnerSlug])

  return (
    <LoadingScreen
      logoSrc={logoSrc}
      logoAlt={`${brandText} Logo`}
      brandText={brandText}
      tagline="Partner Storefront"
      useDefaultLogoFallback={false}
    />
  )
}
