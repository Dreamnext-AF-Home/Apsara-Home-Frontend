import { buildPageMetadata } from '@/app/seo'
import BlogsContentManager from '@/components/superAdmin/webpages/BlogsContentManager'

export const metadata = buildPageMetadata({
  title: 'Admin Blogs Content',
  description: 'Manage dynamic blog content.',
  path: '/admin/webpages/blogs',
  noIndex: true,
})

export default function AdminBlogsContentPage() {
  return <BlogsContentManager />
}

