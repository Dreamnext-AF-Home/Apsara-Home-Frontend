import { buildPageMetadata } from '@/app/seo'
import WebPageItemsManager from '@/components/superAdmin/webpages/WebPageItemsManager'

export const metadata = buildPageMetadata({
  title: 'Admin Web Pages Announcement',
  description: 'Manage website announcements.',
  path: '/admin/webpages/announcement',
  noIndex: true,
})

export default function AdminWebPagesAnnouncementPage() {
  return (
    <WebPageItemsManager
      type="announcements"
      title="Web Pages / Announcement"
      description="Manage top notices and public announcements."
    />
  )
}

