'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import LoadingScreen from '@/components/ui/LoadingScreen'

export default function PartnerLoading() {
  const pathname = usePathname()
  const brandText = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    const partnerSlug = segments[0] ?? ''
    if (!partnerSlug) return 'PARTNER STOREFRONT'
    return partnerSlug
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }, [pathname])
  const logoSrc = null

  return (
    <LoadingScreen
      logoSrc={logoSrc}
      logoAlt={`${brandText} Logo`}
      brandText={brandText}
      tagline="Partner Storefront"
    />
  )
}
