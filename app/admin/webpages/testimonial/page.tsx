import { buildPageMetadata } from '@/app/seo'
import WebPageItemsManager from '@/components/superAdmin/webpages/WebPageItemsManager'

export const metadata = buildPageMetadata({
  title: 'Admin Web Pages Testimonial',
  description: 'Manage testimonial content.',
  path: '/admin/webpages/testimonial',
  noIndex: true,
})

export default function AdminWebPagesTestimonialPage() {
  return (
    <WebPageItemsManager
      type="home"
      title="Web Pages / Testimonial"
      description="Manage testimonial blocks and featured quotes."
    />
  )
}

