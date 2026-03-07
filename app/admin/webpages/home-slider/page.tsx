import { buildPageMetadata } from '@/app/seo'
import WebPageItemsManager from '@/components/superAdmin/webpages/WebPageItemsManager'

export const metadata = buildPageMetadata({
  title: 'Admin Web Pages Home Slider',
  description: 'Manage homepage slider items.',
  path: '/admin/webpages/home-slider',
  noIndex: true,
})

export default function AdminWebPagesHomeSliderPage() {
  return (
    <WebPageItemsManager
      type="banners"
      title="Web Pages / Home Slider"
      description="Manage hero slider banners shown on the shop homepage."
    />
  )
}

