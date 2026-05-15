import { buildPageMetadata } from '@/app/seo'
import { authOptions } from '@/libs/auth'
import { getNavbarCategories } from '@/libs/serverStorefront'
import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { getPartnerStorefrontBySlug } from '@/libs/partnerStorefrontServer'
import Wishlist from '@/components/Wishlist'

export const metadata = buildPageMetadata({
  title: 'Wishlist',
  description: 'Browse the Wishlist page on AF Home.',
  path: '/[partner]/wishlist',
  noIndex: true,
})
export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ partner: string }>
}

export default async function PartnerWishlistPage({ params }: PageProps) {
  const { partner } = await params
  const partnerSlug = partner.trim().toLowerCase()
  const storefront = await getPartnerStorefrontBySlug(partnerSlug)
  if (!storefront) notFound()

  const session = await getServerSession(authOptions)
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken
  const role = String((session?.user as { role?: string } | undefined)?.role ?? '').toLowerCase()
  const isCustomer = role === 'customer' || role === ''

  if (!accessToken || !isCustomer) {
    redirect(`/login?callback=${encodeURIComponent(`/${partnerSlug}/wishlist`)}`)
  }

  const initialCategories = await getNavbarCategories()
  return (
    <Wishlist
      initialCategories={initialCategories}
      partnerBranding={{
        slug: storefront.slug,
        displayName: storefront.displayName,
        logoUrl: storefront.logoUrl,
        tabLogoUrl: storefront.tabLogoUrl,
        notificationEmail: storefront.notificationEmail,
      }}
    />
  )
}
