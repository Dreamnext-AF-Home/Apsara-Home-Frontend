'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { getPartnerStorefrontConfig } from '@/libs/partnerStorefront'
import type { WebPageItem } from '@/store/api/webPagesApi'
import LoadingScreen from '@/components/ui/LoadingScreen'

export default function PartnerLoading() {
  const params = useParams<{ partner?: string }>()
  const partner = String(params?.partner ?? '').trim().toLowerCase()
  const [brandText, setBrandText] = useState('AF HOME')
  const [logoSrc, setLogoSrc] = useState('/Images/af_home_logo.png')

  const apiUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').replace(/\/+$/, ''),
    [],
  )

  useEffect(() => {
    let isCancelled = false
    if (!partner || !apiUrl) return

    const loadBranding = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/web-pages/partner-storefronts`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        })
        if (!response.ok) return
        const json = (await response.json()) as { items?: WebPageItem[] }
        const match = (json.items ?? []).find((item) => getPartnerStorefrontConfig(item)?.slug === partner)
        const config = getPartnerStorefrontConfig(match)
        if (!config || isCancelled) return
        setBrandText(config.displayName || 'AF HOME')
        setLogoSrc(config.tabLogoUrl || config.logoUrl || '/Images/af_home_logo.png')
      } catch {
        // Keep fallback branding.
      }
    }

    void loadBranding()
    return () => {
      isCancelled = true
    }
  }, [apiUrl, partner])

  return (
    <LoadingScreen
      logoSrc={logoSrc}
      logoAlt={`${brandText} Logo`}
      brandText={brandText}
      tagline="Partner Storefront"
    />
  )
}
