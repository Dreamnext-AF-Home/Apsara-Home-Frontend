import { buildPageMetadata } from '@/app/seo'
import WebPageItemsManager from '@/components/superAdmin/webpages/WebPageItemsManager'

export const metadata = buildPageMetadata({
  title: 'Admin Web Pages Home',
  description: 'Manage dynamic home page sections.',
  path: '/admin/webpages/home',
  noIndex: true,
})

export default function AdminWebPagesHomePage() {
  return (
    <WebPageItemsManager
      type="home"
      title="Web Pages / Home Page"
      description="Manage homepage dynamic sections, featured blocks, and content cards."
    />
  )
}

