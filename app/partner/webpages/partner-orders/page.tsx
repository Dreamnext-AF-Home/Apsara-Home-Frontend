import { buildPageMetadata } from '@/app/seo'
import PartnerOrdersPage from '@/components/partner/PartnerOrdersPage'

export const metadata = buildPageMetadata({
  title: 'Partner Orders',
  description: 'View orders placed from your assigned partner storefront.',
  path: '/partner/webpages/partner-orders',
  noIndex: true,
})

export default function PartnerOrdersPortalPage() {
  return <PartnerOrdersPage />
}
