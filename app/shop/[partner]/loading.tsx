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

const titleCase = (value: string) =>
  value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const normalizeSlug = (value: string) => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  try {
    return decodeURIComponent(raw).trim().toLowerCase()
  } catch {
    return raw.toLowerCase()
  }
}

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
    () => normalizeSlug(pathname.replace(/^\/shop\//, '').split('/')[0] ?? ''),
    [pathname],
  )
  const displayName = useMemo(() => (slug ? titleCase(slug) : 'Shop'), [slug])
  const [logoSrc, setLogoSrc] = useState<string | null>(null)

  // Set favicon/tab icon immediately during loading (before partner page data finishes).
  useEffect(() => {
    if (!slug) return

    const setIcon = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel~="${rel}"]`) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.rel = rel
        document.head.appendChild(link)
      }
      link.href = href
    }

    const storageKey = `partner-storefront-icon:${slug}`
    const apiBase = (process.env.NEXT_PUBLIC_LARAVEL_API_URL || '').replace(/\/+$/, '')
    const cachedIcon = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null
    if (cachedIcon) {
      const normalizedCachedIcon = normalizeLogoUrl(cachedIcon)
      const isDefaultAfHome = normalizedCachedIcon.includes('/Images/af_home_logo.png')
      if (!isDefaultAfHome) {
        setLogoSrc(normalizedCachedIcon)
        setIcon('icon', normalizedCachedIcon)
        setIcon('apple-touch-icon', normalizedCachedIcon)
        setIcon('shortcut icon', normalizedCachedIcon)
      }
    }

    const resolveFromPayload = (payload: PartnerStorefrontApiResponse) => {
      const item = (payload.items ?? []).find((it) => getPartnerStorefrontConfig(it)?.slug === slug)
      const storefront = getPartnerStorefrontConfig(item)
      const resolved = storefront?.tabLogoUrl || storefront?.logoUrl
      if (!resolved) return false
      const normalizedResolved = normalizeLogoUrl(resolved)

      setLogoSrc(normalizedResolved)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, normalizedResolved)
      }

      setIcon('icon', `${normalizedResolved}${normalizedResolved.includes('?') ? '&' : '?'}v=loading`)
      setIcon('apple-touch-icon', `${normalizedResolved}${normalizedResolved.includes('?') ? '&' : '?'}v=loading`)
      setIcon('shortcut icon', `${normalizedResolved}${normalizedResolved.includes('?') ? '&' : '?'}v=loading`)
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

    async function loadAndSetLogo() {
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
