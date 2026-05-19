'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { getPartnerStorefrontConfig } from '@/libs/partnerStorefront'
import type { WebPageItem } from '@/store/api/webPagesApi'

type PartnerStorefrontApiResponse = {
  items?: WebPageItem[]
}
const STOREFRONT_CACHE_KEY = 'partner-storefronts:payload:v1'
const STOREFRONT_CACHE_TTL_MS = 5 * 60 * 1000
const STOREFRONT_FETCH_COOLDOWN_MS = 45 * 1000

const normalizeLogoUrl = (value: string) => {
  const raw = value.trim()
  if (!raw) return raw
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && raw.startsWith('http://')) {
    return `https://${raw.slice('http://'.length)}`
  }
  return raw
}

const normalizeSlug = (value: string) => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  try {
    return decodeURIComponent(raw).trim().toLowerCase()
  } catch {
    return raw.toLowerCase()
  }
}

export default function PartnerLoading() {
  const pathname = usePathname()
  const partnerSlug = useMemo(() => normalizeSlug(pathname.split('/').filter(Boolean)[0] ?? ''), [pathname])
  const brandText = useMemo(() => {
    if (!partnerSlug) return 'PARTNER STOREFRONT'
    return partnerSlug
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }, [partnerSlug])
  const [logoSrc, setLogoSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!partnerSlug) return
    const apiBase = (process.env.NEXT_PUBLIC_LARAVEL_API_URL || '').replace(/\/+$/, '')
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
        const normalizedCachedLoadingLogo = normalizeLogoUrl(cachedLoadingLogo)
        const isDefaultAfHome = normalizedCachedLoadingLogo.includes('/Images/af_home_logo.png')
        if (!isDefaultAfHome) {
          setLogoSrc(normalizedCachedLoadingLogo)
        }
      }
    }

    const resolveFromPayload = (payload: PartnerStorefrontApiResponse) => {
      const item = (payload.items ?? []).find((entry) => getPartnerStorefrontConfig(entry)?.slug === partnerSlug)
      const storefront = getPartnerStorefrontConfig(item)
      if (!storefront) return false

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
      return true
    }

    const tryReadCachedPayload = () => {
      if (typeof window === 'undefined') return false
      const raw = window.localStorage.getItem(STOREFRONT_CACHE_KEY)
      if (!raw) return false
      try {
        const cached = JSON.parse(raw) as { ts?: number; cooldownUntil?: number; payload?: PartnerStorefrontApiResponse }
        if (typeof cached.cooldownUntil === 'number' && Date.now() < cached.cooldownUntil) {
          return Boolean(cached.payload && resolveFromPayload(cached.payload))
        }
        if (typeof cached.ts === 'number' && Date.now() - cached.ts <= STOREFRONT_CACHE_TTL_MS && cached.payload) {
          return resolveFromPayload(cached.payload)
        }
      } catch {
        // ignore cache parse issues
      }
      return false
    }

    async function loadStorefrontLogo() {
      if (tryReadCachedPayload()) return

      try {
        const endpoint = apiBase ? `${apiBase}/api/web-pages/partner-storefronts` : '/api/web-pages/partner-storefronts'
        const response = await fetch(endpoint, {
          headers: { Accept: 'application/json' },
          cache: 'force-cache',
        })
        if (!response.ok) {
          if (typeof window !== 'undefined') {
            const existing = window.localStorage.getItem(STOREFRONT_CACHE_KEY)
            let parsed: { payload?: PartnerStorefrontApiResponse } = {}
            if (existing) {
              try {
                parsed = JSON.parse(existing) as { payload?: PartnerStorefrontApiResponse }
              } catch {
                parsed = {}
              }
            }
            window.localStorage.setItem(
              STOREFRONT_CACHE_KEY,
              JSON.stringify({
                ts: Date.now(),
                cooldownUntil: Date.now() + STOREFRONT_FETCH_COOLDOWN_MS,
                payload: parsed.payload,
              }),
            )
          }
          return
        }

        const payload = (await response.json()) as PartnerStorefrontApiResponse
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            STOREFRONT_CACHE_KEY,
            JSON.stringify({
              ts: Date.now(),
              cooldownUntil: 0,
              payload,
            }),
          )
        }
        resolveFromPayload(payload)
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
