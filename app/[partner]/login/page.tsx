import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import LoginPageClient from '@/components/auth/LoginPageClient'
import { getPartnerStorefrontBySlug } from '@/libs/partnerStorefrontServer'

type PageProps = {
  params: Promise<{ partner: string }>
}

function extractReferralCode(referralLink: string | null | undefined): string {
  const raw = String(referralLink ?? '').trim()
  if (!raw) return ''

  const normalized = raw.startsWith('http://') || raw.startsWith('https://')
    ? raw
    : `https://${raw}`

  try {
    const url = new URL(normalized)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const refIndex = pathParts.findIndex((part) => part.toLowerCase() === 'ref')
    const candidate = refIndex >= 0 ? pathParts[refIndex + 1] : pathParts[pathParts.length - 1]
    return (candidate ?? '').trim()
  } catch {
    const fallback = raw.split('/').filter(Boolean).pop() ?? ''
    return fallback.trim()
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { partner } = await params
  const normalizedPartner = partner.trim().toLowerCase()
  const storefront = await getPartnerStorefrontBySlug(normalizedPartner)
  const displayName = storefront?.displayName?.trim() || normalizedPartner
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
  const version = storefront?.logoVersion?.trim() || '1'
  const iconWithVersion = resolvedIcon
    ? `${resolvedIcon}${resolvedIcon.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`
    : undefined

  return {
    title: `Partner Login | ${displayName}`,
    description: `Login or register for ${displayName}.`,
    icons: iconWithVersion
      ? {
        icon: iconWithVersion,
        apple: iconWithVersion,
        shortcut: iconWithVersion,
      }
      : undefined,
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function PartnerCustomerLoginPage({ params }: PageProps) {
  const { partner } = await params
  const normalizedPartner = partner.trim().toLowerCase()
  const storefront = await getPartnerStorefrontBySlug(normalizedPartner)

  if (!storefront) {
    notFound()
  }

  const turnstileSiteKey = process.env.USER_LOGIN_CLOUDFLARE_SITE_KEY ?? ''
  const signupTurnstileSiteKey = process.env.USER_SIGNUP_CLOUDFLARE_SITE_KEY ?? ''
  const referralCode = extractReferralCode(storefront.referralLink)

  return (
    <LoginPageClient
      turnstileSiteKey={turnstileSiteKey}
      signupTurnstileSiteKey={signupTurnstileSiteKey}
      defaultCallbackPath={`/shop/${normalizedPartner}/product`}
      accountLabel={storefront.displayName}
      headerLogoUrl={storefront.logoUrl || '/Images/af_home_logo.png'}
      headerLogoAlt={`${storefront.displayName} logo`}
      hideHeaderNavLinks
      headerLogoHref={`/shop/${normalizedPartner}`}
      headerShopHref={`/shop/${normalizedPartner}/product`}
      usePartnerFooter
      partnerFooterName={storefront.displayName}
      partnerFooterLogoUrl={storefront.logoUrl || ''}
      partnerFooterLogoAlt={`${storefront.displayName} logo`}
      partnerFooterHomeHref={`/shop/${normalizedPartner}`}
      backgroundVideoUrl={storefront.heroVideoUrl || '/loginpageVideo/home-login.mp4'}
      signupInitialReferralCode={referralCode}
      signupPartnerSlug={normalizedPartner}
      otpSenderName={storefront.displayName}
    />
  )
}
