import { getPartnerStorefrontBySlug } from '@/libs/partnerStorefrontServer'

type HeadProps = {
  params: Promise<{ partner: string }>
}

export default async function Head({ params }: HeadProps) {
  const { partner } = await params
  const normalizedPartner = String(partner ?? '').trim().toLowerCase()
  const storefront = await getPartnerStorefrontBySlug(normalizedPartner)
  const apiBase = (process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').replace(/\/+$/, '')
  const rawIcon = storefront?.tabLogoUrl || storefront?.logoUrl

  const resolvedIcon = (() => {
    if (!rawIcon) return null
    const trimmed = rawIcon.trim()
    if (!trimmed) return null
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed
    if (trimmed.startsWith('/Images/')) return trimmed
    if (apiBase) return `${apiBase}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`
    return trimmed
  })()

  if (!resolvedIcon) return null

  const version = storefront?.logoVersion?.trim() || '1'
  const iconUrlWithVersion = `${resolvedIcon}${resolvedIcon.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`

  return (
    <>
      <link rel="icon" href={iconUrlWithVersion} />
      <link rel="apple-touch-icon" href={iconUrlWithVersion} />
      <link rel="shortcut icon" href={iconUrlWithVersion} />
    </>
  )
}
