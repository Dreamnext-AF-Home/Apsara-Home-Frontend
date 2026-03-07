import { buildPageMetadata } from '@/app/seo'
import WebPageItemsManager from '@/components/superAdmin/webpages/WebPageItemsManager'

export const metadata = buildPageMetadata({
  title: 'Admin Web Pages Photo Gallery',
  description: 'Manage photo gallery content.',
  path: '/admin/webpages/photo-gallery',
  noIndex: true,
})

export default function AdminWebPagesPhotoGalleryPage() {
  return (
    <WebPageItemsManager
      type="home"
      title="Web Pages / Photo Gallery"
      description="Manage photo gallery entries and media links."
    />
  )
}

