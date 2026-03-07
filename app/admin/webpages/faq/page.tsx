import { buildPageMetadata } from '@/app/seo'
import WebPageItemsManager from '@/components/superAdmin/webpages/WebPageItemsManager'

export const metadata = buildPageMetadata({
  title: 'Admin Web Pages FAQ',
  description: 'Manage FAQ content.',
  path: '/admin/webpages/faq',
  noIndex: true,
})

export default function AdminWebPagesFaqPage() {
  return (
    <WebPageItemsManager
      type="home"
      title="Web Pages / F.A.Q"
      description="Manage frequently asked questions and support answers."
    />
  )
}

