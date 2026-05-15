import type { Metadata } from 'next'
import Link from 'next/link'
import InteriorServicesPageMain from '@/components/interior-services/InteriorServicesPageMain'
import { getPartnerStorefrontBySlug } from '@/libs/partnerStorefrontServer'

type PageProps = {
  params: Promise<{ partner: string }>
}

const BLANK_FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"

const resolveAssetUrl = (rawValue: string | null | undefined, apiUrl?: string) => {
  const value = String(rawValue ?? '').trim()
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) return value
  if (value.startsWith('/Images/')) return value
  if (!apiUrl) return value.startsWith('/') ? value : `/${value}`
  return `${apiUrl.replace(/\/$/, '')}/${value.replace(/^\/+/, '')}`
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { partner } = await params
  const storefront = await getPartnerStorefrontBySlug(partner)
  const partnerTitle = storefront?.displayName ?? partner
  const title = `${partnerTitle} | Interior Services`
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL
  const iconUrl = resolveAssetUrl(storefront?.tabLogoUrl || storefront?.logoUrl, apiUrl)

  return {
    title,
    description: `Interior services by ${partnerTitle}.`,
    icons: iconUrl
      ? {
          icon: [{ url: iconUrl, type: 'image/png' }],
          apple: iconUrl,
        }
      : {
          icon: [{ url: BLANK_FAVICON, type: 'image/svg+xml' }],
          apple: BLANK_FAVICON,
        },
  }
}

export default async function PartnerInteriorServicesPage({ params }: PageProps) {
  const { partner } = await params

  return (
    <div>
      <div className="mx-auto w-full max-w-7xl px-6 pt-6 md:px-10">
        <Link
          href={`/shop/${partner}/product`}
          className="inline-flex items-center text-sm font-semibold text-slate-700 transition hover:text-slate-900"
        >
          ← Shop
        </Link>
      </div>
      <InteriorServicesPageMain />
    </div>
  )
}
