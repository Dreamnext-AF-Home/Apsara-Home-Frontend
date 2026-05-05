import { notFound, redirect } from 'next/navigation'
import { getPartnerStorefrontBySlug } from '@/libs/partnerStorefrontServer'

type PageProps = {
  params: Promise<{ partner: string }>
}

export default async function PartnerLegacyEntryPage({ params }: PageProps) {
  const { partner } = await params
  const normalizedPartner = partner.trim().toLowerCase()
  const storefront = await getPartnerStorefrontBySlug(normalizedPartner)

  if (!storefront) {
    notFound()
  }

  redirect(`/shop/${normalizedPartner}`)
}
