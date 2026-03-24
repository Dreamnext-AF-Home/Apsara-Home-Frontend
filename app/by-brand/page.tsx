import { buildPageMetadata } from '@/app/seo'
import ByBrandPageMain from '@/components/brand/ByBrandPageMain'

export const metadata = buildPageMetadata({ title: 'By Brand', description: 'Browse the By Brand page on AF Home.', path: '/by-brand' })

export default function ByBrandPage() {
  return <ByBrandPageMain />
}
