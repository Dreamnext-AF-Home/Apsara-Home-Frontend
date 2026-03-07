import { buildPageMetadata } from '@/app/seo'
import WebPageItemsManager from '@/components/superAdmin/webpages/WebPageItemsManager'

export const metadata = buildPageMetadata({
  title: 'Admin Web Pages Assembly Guides',
  description: 'Manage assembly guides content.',
  path: '/admin/webpages/assembly-guides',
  noIndex: true,
})

export default function AdminWebPagesAssemblyGuidesPage() {
  return (
    <WebPageItemsManager
      type="home"
      title="Web Pages / Assembly Guides"
      description="Manage assembly guide cards and links."
    />
  )
}

