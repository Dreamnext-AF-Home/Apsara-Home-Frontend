import { getPartnerStorefrontBySlug } from '@/libs/partnerStorefrontServer'

type HeadProps = {
  params: Promise<{ partner: string }>
}

export default async function Head({ params }: HeadProps) {
  const { partner } = await params
  const normalizedPartner = String(partner ?? '').trim().toLowerCase()
  const storefront = await getPartnerStorefrontBySlug(normalizedPartner)
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL
  const rawIcon = storefront?.tabLogoUrl || storefront?.logoUrl
  const iconUrl = (() => {
    const value = String(rawIcon ?? '').trim()
    if (!value) return ''
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) return value
    if (!apiUrl) return value.startsWith('/') ? value : `/${value}`
    return `${apiUrl.replace(/\/$/, '')}/${value.replace(/^\/+/, '')}`
  })()

  if (!iconUrl) return null

  return (
    <>
      <link rel="icon" href={iconUrl} />
      <link rel="apple-touch-icon" href={iconUrl} />
      <link rel="shortcut icon" href={iconUrl} />
    </>
  )
}
