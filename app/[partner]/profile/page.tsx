import { buildPageMetadata } from '@/app/seo'
import ProfilePage from '@/components/profile/ProfilePage'
import { authOptions } from '@/libs/auth'
import type { MeResponse } from '@/store/api/userApi'
import { getServerSession } from 'next-auth'
import { getNavbarCategories } from '@/libs/serverStorefront'
import { notFound, redirect } from 'next/navigation'
import { getPartnerStorefrontBySlug } from '@/libs/partnerStorefrontServer'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ partner: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { partner } = await params
  const normalizedPartner = partner.trim().toLowerCase()
  const storefront = await getPartnerStorefrontBySlug(normalizedPartner)
  const displayName = storefront?.displayName?.trim() || normalizedPartner

  const metadata = buildPageMetadata({
    title: 'Profile',
    description: `Browse the Profile page for ${displayName}.`,
    path: `/${normalizedPartner}/profile`,
    noIndex: true,
    siteName: displayName,
  })

  const iconUrl = storefront?.tabLogoUrl || storefront?.logoUrl
  if (iconUrl) {
    metadata.icons = {
      icon: iconUrl,
      apple: iconUrl,
      shortcut: iconUrl,
    }
  }

  return metadata
}

function buildProfileCallback(
  partnerSlug: string,
  queryParams: Record<string, string | string[] | undefined>,
) {
  const search = new URLSearchParams()
  Object.entries(queryParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => search.append(key, entry))
    } else if (value) {
      search.set(key, value)
    }
  })

  const query = search.toString()
  return `/${partnerSlug}/profile${query ? `?${query}` : ''}`
}

async function getInitialProfile(): Promise<MeResponse | null> {
  const session = await getServerSession(authOptions)
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken

  if (!accessToken) return null

  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL
  if (!apiUrl) return null

  try {
    const res = await fetch(`${apiUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) return null

    return (await res.json()) as MeResponse
  } catch {
    return null
  }
}

export default async function PartnerProfilePage({ params, searchParams }: PageProps) {
  const { partner } = await params
  const partnerSlug = partner.trim().toLowerCase()
  const storefront = await getPartnerStorefrontBySlug(partnerSlug)
  if (!storefront) notFound()

  const session = await getServerSession(authOptions)
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken
  const role = String((session?.user as { role?: string } | undefined)?.role ?? '').toLowerCase()
  const isCustomer = role === 'customer' || role === ''
  const query = (await searchParams) ?? {}

  if (!accessToken || !isCustomer) {
    redirect(`/login?callback=${encodeURIComponent(buildProfileCallback(partnerSlug, query))}`)
  }

  const [initialProfile, initialCategories] = await Promise.all([
    getInitialProfile(),
    getNavbarCategories(),
  ])
  const allowedCategoryIds = new Set((storefront.allowedCategoryIds ?? []).map((id) => Number(id)))
  const filteredCategories = allowedCategoryIds.size > 0
    ? initialCategories.filter((category) => allowedCategoryIds.has(Number(category.id)))
    : initialCategories

  return <ProfilePage initialProfile={initialProfile} initialCategories={filteredCategories} />
}
