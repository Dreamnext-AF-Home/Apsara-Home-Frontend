import { buildPageMetadata } from '@/app/seo'
import WebPageItemsManager from '@/components/superAdmin/webpages/WebPageItemsManager'

export const metadata = buildPageMetadata({
  title: 'Admin Web Pages Announcements',
  description: 'Manage website announcements.',
  path: '/admin/webpages/announcements',
  noIndex: true,
})

export default function AdminWebPagesAnnouncementsPage() {
  return (
    <WebPageItemsManager
      type="announcements"
      title="Web Pages / Announcements"
      description="Manage announcement bars, notices, and schedule."
    />
  )
}

