import { buildPageMetadata } from '@/app/seo'
import WebPageItemsManager from '@/components/superAdmin/webpages/WebPageItemsManager'

export const metadata = buildPageMetadata({
  title: 'Admin Web Pages Video Gallery',
  description: 'Manage video gallery content.',
  path: '/admin/webpages/video-gallery',
  noIndex: true,
})

export default function AdminWebPagesVideoGalleryPage() {
  return (
    <WebPageItemsManager
      type="home"
      title="Web Pages / Video Gallery"
      description="Manage video gallery cards and destination links."
    />
  )
}

