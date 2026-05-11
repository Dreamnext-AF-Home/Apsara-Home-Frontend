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

  const iconUrl = storefront?.tabLogoUrl || storefront?.logoUrl || undefined
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
