'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { getPartnerStorefrontConfig } from '@/libs/partnerStorefront'
import type { WebPageItem } from '@/store/api/webPagesApi'

const titleCase = (value: string) =>
  value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export default function PartnerShopLoading() {
  const pathname = usePathname()
  const slug = pathname.replace(/^\/shop\//, '').split('/')[0]?.toLowerCase() || ''
  const [displayName, setDisplayName] = useState(slug ? titleCase(slug) : 'Shop')
  const [logoSrc, setLogoSrc] = useState('/Images/af_home_logo.png')

  const apiUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').replace(/\/+$/, ''),
    [],
  )

  useEffect(() => {
    let isCancelled = false
    if (!slug || !apiUrl) return

    const loadBranding = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/web-pages/partner-storefronts`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        })
        if (!response.ok) return
        const json = (await response.json()) as { items?: WebPageItem[] }
        const match = (json.items ?? []).find((item) => getPartnerStorefrontConfig(item)?.slug === slug)
        const config = getPartnerStorefrontConfig(match)
        if (!config || isCancelled) return

        setDisplayName(config.displayName || titleCase(slug))
        setLogoSrc(config.tabLogoUrl || config.logoUrl || '/Images/af_home_logo.png')
      } catch {
        // Keep fallback branding.
      }
    }

    void loadBranding()
    return () => {
      isCancelled = true
    }
  }, [apiUrl, slug])

  return (
    <div id="af-loading-screen" className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#faf8f5] overflow-hidden">
      {/* Background decorative blobs */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#2c5f4f]/10 animate-blob blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#d4a574]/15 animate-blob animation-delay-2000 blur-3xl" />
      <div className="absolute top-1/3 -left-16 w-48 h-48 rounded-full bg-[#2c5f4f]/8 animate-blob animation-delay-4000 blur-2xl" />

      {/* Logo with pulse rings */}
      <div className="relative flex items-center justify-center mb-8">
        <span
          className="absolute inline-flex rounded-full bg-[#d4a574]/20 animate-ping"
          style={{ width: 180, height: 180, animationDuration: '2.4s', animationDelay: '0.3s' }}
        />
        <span
          className="absolute inline-flex rounded-full bg-[#2c5f4f]/25 animate-ping"
          style={{ width: 148, height: 148, animationDuration: '2s' }}
        />

        <span className="absolute w-32 h-32 rounded-full bg-[#2c5f4f]/10 blur-md" />

        <div className="relative z-10 animate-logo-enter">
          <Image
            src={logoSrc}
            alt={`${displayName} Logo`}
            width={110}
            height={110}
            priority
            className="object-contain drop-shadow-xl mix-blend-multiply"
          />
        </div>
      </div>

      {/* Brand text */}
      <div
        className="flex flex-col items-center gap-1.5 mb-10 animate-fade-up-in"
        style={{ animationDelay: '0.4s', opacity: 0 }}
      >
        <p className="font-display text-2xl font-semibold tracking-[0.18em] text-[#1a1a1a]">
          {displayName}
        </p>
        <p className="text-[10px] font-medium text-[#6b6b6b] tracking-[0.4em] uppercase">
          Your Trusted Home Partner
        </p>
      </div>

      {/* Animated loading dots */}
      <div
        className="flex items-center gap-2 animate-fade-up-in"
        style={{ animationDelay: '0.65s', opacity: 0 }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-[#2c5f4f] loading-dot"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>

      {/* Thin progress sweep bar at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#2c5f4f]/10 overflow-hidden">
        <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#2c5f4f] to-transparent animate-loading-sweep" />
      </div>
    </div>
  )
}
