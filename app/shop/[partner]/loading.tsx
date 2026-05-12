'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { getPartnerStorefrontConfig } from '@/libs/partnerStorefront'
import type { WebPageItem } from '@/store/api/webPagesApi'

type PartnerStorefrontApiResponse = {
  items?: WebPageItem[]
}

const titleCase = (value: string) =>
  value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const normalizeLogoUrl = (value: string) => {
  const raw = value.trim()
  if (!raw) return raw
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && raw.startsWith('http://')) {
    return `https://${raw.slice('http://'.length)}`
  }
  return raw
}

export default function PartnerShopLoading() {
  const pathname = usePathname()
  const slug = useMemo(
    () => pathname.replace(/^\/shop\//, '').split('/')[0]?.toLowerCase() || '',
    [pathname],
  )
  const displayName = useMemo(() => (slug ? titleCase(slug) : 'Shop'), [slug])
  const [logoSrc, setLogoSrc] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const cachedLogo = window.localStorage.getItem(`partner-storefront-icon:${slug}`)
    return cachedLogo ? normalizeLogoUrl(cachedLogo) : null
  })

  // Set favicon/tab icon immediately during loading (before partner page data finishes).
  useEffect(() => {
    if (!slug) return

    const setIcon = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.rel = rel
        document.head.appendChild(link)
      }
      link.href = href
    }

    const storageKey = `partner-storefront-icon:${slug}`
    const cachedIcon = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null
    if (cachedIcon) {
      const normalizedCachedIcon = normalizeLogoUrl(cachedIcon)
      setLogoSrc(normalizedCachedIcon)
      setIcon('icon', normalizedCachedIcon)
      setIcon('apple-touch-icon', normalizedCachedIcon)
    }

    async function loadAndSetLogo() {
      try {
        const response = await fetch('/api/web-pages/partner-storefronts', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        })

        if (!response.ok) return

        const payload = (await response.json()) as PartnerStorefrontApiResponse
        const item = (payload.items ?? []).find((it) => getPartnerStorefrontConfig(it)?.slug === slug)
        const storefront = getPartnerStorefrontConfig(item)
        const resolved = storefront?.tabLogoUrl || storefront?.logoUrl
        if (!resolved) return
        const normalizedResolved = normalizeLogoUrl(resolved)

        setLogoSrc(normalizedResolved)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(storageKey, normalizedResolved)
        }

        // Update the tab icon ASAP.
        setIcon('icon', `${normalizedResolved}${normalizedResolved.includes('?') ? '&' : '?'}v=loading`)
        setIcon('apple-touch-icon', `${normalizedResolved}${normalizedResolved.includes('?') ? '&' : '?'}v=loading`)
      } catch {
        // ignore
      }
    }

    loadAndSetLogo()
  }, [slug])

  return (
    <LoadingScreen
      logoSrc={logoSrc}
      logoAlt={`${displayName} Logo`}
      brandText={displayName}
      tagline="Partner Storefront"
      useDefaultLogoFallback={false}
    />
  )
}
