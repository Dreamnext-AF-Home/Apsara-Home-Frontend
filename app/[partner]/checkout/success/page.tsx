import { buildPageMetadata } from '@/app/seo'
import { getPartnerStorefrontBySlug } from '@/libs/partnerStorefrontServer'

type PageProps = {
  params: Promise<{ partner: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { partner } = await params
  const normalizedPartner = partner.trim().toLowerCase()
  const storefront = await getPartnerStorefrontBySlug(normalizedPartner)
  const siteName = storefront?.displayName || normalizedPartner || 'Partner Storefront'
  const iconUrl = storefront?.tabLogoUrl || storefront?.logoUrl || ''

  const metadata = buildPageMetadata({
    title: 'Checkout Success',
    description: `Checkout success page for ${siteName}.`,
    path: `/${normalizedPartner}/checkout/success`,
    noIndex: true,
    siteName,
  })

  if (iconUrl) {
    return {
      ...metadata,
      icons: {
        icon: [{ url: iconUrl, type: 'image/png' }],
        apple: iconUrl,
      },
    }
  }

  return metadata
}

export { default } from '@/app/checkout/success/page'
