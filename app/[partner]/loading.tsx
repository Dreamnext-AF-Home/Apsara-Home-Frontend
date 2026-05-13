'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { getPartnerStorefrontConfig } from '@/libs/partnerStorefront'
import type { WebPageItem } from '@/store/api/webPagesApi'

type PartnerStorefrontApiResponse = {
  items?: WebPageItem[]
}

const normalizeLogoUrl = (value: string) => {
  const raw = value.trim()
  if (!raw) return raw
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && raw.startsWith('http://')) {
    return `https://${raw.slice('http://'.length)}`
  }
  return raw
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
    const cachedLoadingLogo = window.localStorage.getItem(`partner-storefront-loading-logo:${partnerSlug}`)
    if (cachedLoadingLogo) return normalizeLogoUrl(cachedLoadingLogo)
    return null
  })

  useEffect(() => {
    if (!partnerSlug) return
    const iconStorageKey = `partner-storefront-icon:${partnerSlug}`
    const loadingLogoStorageKey = `partner-storefront-loading-logo:${partnerSlug}`
    const setIcon = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel~="${rel}"]`) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.rel = rel
        document.head.appendChild(link)
      }
      link.href = href
    }

    if (typeof window !== 'undefined') {
      const cachedLoadingLogo = window.localStorage.getItem(loadingLogoStorageKey)
      if (cachedLoadingLogo) {
        setLogoSrc(normalizeLogoUrl(cachedLoadingLogo))
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

        const resolvedLoadingLogo = storefront.logoUrl || storefront.tabLogoUrl
        const resolvedTabIcon = storefront.tabLogoUrl || storefront.logoUrl

        if (resolvedLoadingLogo) {
          const normalizedLoadingLogo = normalizeLogoUrl(resolvedLoadingLogo)
          setLogoSrc(normalizedLoadingLogo)
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(loadingLogoStorageKey, normalizedLoadingLogo)
          }
        }

        if (resolvedTabIcon) {
          const normalizedTabIcon = normalizeLogoUrl(resolvedTabIcon)
          setIcon('icon', normalizedTabIcon)
          setIcon('apple-touch-icon', normalizedTabIcon)
          setIcon('shortcut icon', normalizedTabIcon)
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(iconStorageKey, normalizedTabIcon)
          }
        }

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(`partner-storefront-name:${partnerSlug}`, brandText)
        }
      } catch {
        // Keep cached logo if fetch fails.
      }
    }

    loadStorefrontLogo()
  }, [brandText, partnerSlug])

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
