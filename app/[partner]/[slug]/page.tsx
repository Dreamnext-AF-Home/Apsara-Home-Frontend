import PartnerCategoryPage, {
  generateMetadata as generatePartnerCategoryMetadata,
} from '@/app/shop/[partner]/category/[slug]/page'

type PageProps = {
  params: Promise<{
    partner: string
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps) {
  return generatePartnerCategoryMetadata({ params })
}

export default async function PartnerLegacyCategoryEntryPage({ params }: PageProps) {
  return PartnerCategoryPage({ params })
}
