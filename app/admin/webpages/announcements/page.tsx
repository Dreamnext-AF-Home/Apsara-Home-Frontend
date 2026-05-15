import { buildPageMetadata } from '@/app/seo'

import AnnouncementsClient from './AnnouncementsClient'

export const metadata = buildPageMetadata({
  title: 'Admin Web Pages Announcements',
  description: 'Manage website announcements.',
  path: '/admin/webpages/announcements',
  noIndex: true,
})

export default function AdminWebPagesAnnouncementsPage() {
  return <AnnouncementsClient />
}

