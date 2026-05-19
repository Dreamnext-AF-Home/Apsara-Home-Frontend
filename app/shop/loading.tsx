'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import LoadingScreen from '@/components/ui/LoadingScreen'

const normalizeSlug = (value: string) => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  try {
    return decodeURIComponent(raw).trim().toLowerCase()
  } catch {
    return raw.toLowerCase()
  }
}

const titleCase = (value: string) =>
  value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export default function ShopLoading() {
  const pathname = usePathname()
  const partnerSlug = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    return normalizeSlug(segments[1] ?? '')
  }, [pathname])

  if (!partnerSlug) {
    return <LoadingScreen />
  }

  return (
    <LoadingScreen
      logoSrc={null}
      logoAlt={`${titleCase(partnerSlug)} Logo`}
      brandText={titleCase(partnerSlug)}
      tagline="Partner Storefront"
      useDefaultLogoFallback={false}
    />
  )
}

