'use client'

import { useState } from 'react'
import LoadingScreen from '@/components/ui/LoadingScreen'

const titleCase = (value: string) =>
  value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export default function PartnerShopLoading() {
  const [displayName] = useState(() => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
    const slug = pathname.replace(/^\/shop\//, '').split('/')[0]?.toLowerCase() || ''
    return slug ? titleCase(slug) : 'Shop'
  })
  const logoSrc = null

  return (
    <LoadingScreen
      logoSrc={logoSrc}
      logoAlt={`${displayName} Logo`}
      brandText={displayName}
      tagline="Partner Storefront"
    />
  )
}
