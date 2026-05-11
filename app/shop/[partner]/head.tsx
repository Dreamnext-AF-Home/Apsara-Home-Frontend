import { getPartnerStorefrontBySlug } from '@/libs/partnerStorefrontServer'

type HeadProps = {
  params: Promise<{ partner: string }>
}

export default async function Head({ params }: HeadProps) {
  const { partner } = await params
  const normalizedPartner = String(partner ?? '').trim().toLowerCase()
  const storefront = await getPartnerStorefrontBySlug(normalizedPartner)
  const iconUrl = storefront?.tabLogoUrl || storefront?.logoUrl

  if (!iconUrl) return null

  return (
    <>
      <link rel="icon" href={iconUrl} />
      <link rel="apple-touch-icon" href={iconUrl} />
      <link rel="shortcut icon" href={iconUrl} />
    </>
  )
}
