import { buildPageMetadata } from '@/app/seo'
import OrdersPageMain from '@/components/orders/OrdersPageMain'
import { authOptions } from '@/libs/auth'
import { getNavbarCategories } from '@/libs/serverStorefront'
import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { getPartnerStorefrontBySlug } from '@/libs/partnerStorefrontServer'

export const metadata = buildPageMetadata({
  title: 'Orders',
  description: 'Browse the Orders page on AF Home.',
  path: '/[partner]/orders',
  noIndex: true,
})
export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ partner: string }>
}

export default async function PartnerOrdersPage({ params }: PageProps) {
  const { partner } = await params
  const partnerSlug = partner.trim().toLowerCase()
  const storefront = await getPartnerStorefrontBySlug(partnerSlug)
  if (!storefront) notFound()

  const session = await getServerSession(authOptions)
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken
  const role = String((session?.user as { role?: string } | undefined)?.role ?? '').toLowerCase()
  const isCustomer = role === 'customer' || role === ''

  if (!accessToken || !isCustomer) {
    redirect(`/login?callback=${encodeURIComponent(`/${partnerSlug}/orders`)}`)
  }

  const initialCategories = await getNavbarCategories()
  return (
    <OrdersPageMain
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
