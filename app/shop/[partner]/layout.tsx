import type { Metadata } from 'next'
import { getPartnerStorefrontBySlug } from '@/libs/partnerStorefrontServer'

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ partner: string }>
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { partner } = await params
  const normalizedPartner = String(partner ?? '').trim().toLowerCase()
  const storefront = await getPartnerStorefrontBySlug(normalizedPartner)
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL

  const rawIconUrl = storefront?.tabLogoUrl || storefront?.logoUrl || ''
  const iconUrl = (() => {
    const value = String(rawIconUrl).trim()
    if (!value) return undefined
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) return value
    if (!apiUrl) return value.startsWith('/') ? value : `/${value}`
    return `${apiUrl.replace(/\/$/, '')}/${value.replace(/^\/+/, '')}`
  })()
  if (!iconUrl) return {}

  return {
    icons: {
      icon: iconUrl,
      apple: iconUrl,
      shortcut: iconUrl,
    },
  }
}

export default function PartnerShopLayout({ children }: LayoutProps) {
  return children
}
