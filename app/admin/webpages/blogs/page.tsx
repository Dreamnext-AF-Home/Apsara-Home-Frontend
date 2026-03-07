import { buildPageMetadata } from '@/app/seo'
import WebPageItemsManager from '@/components/superAdmin/webpages/WebPageItemsManager'

export const metadata = buildPageMetadata({
  title: 'Admin Web Pages Blogs',
  description: 'Manage blogs landing content.',
  path: '/admin/webpages/blogs',
  noIndex: true,
})

export default function AdminWebPagesBlogsPage() {
  return (
    <WebPageItemsManager
      type="home"
      title="Web Pages / Blogs"
      description="Manage blog highlights, links, and featured blog cards."
    />
  )
}

