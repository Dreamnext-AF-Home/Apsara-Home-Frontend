import { getPartnerStorefrontConfig, type PartnerStorefrontConfig } from '@/libs/partnerStorefront'
import type { WebPageItem } from '@/store/api/webPagesApi'

type PublicWebPageItemsResponse = {
  items?: WebPageItem[]
}

export async function getPartnerStorefrontBySlug(partnerSlug: string): Promise<PartnerStorefrontConfig | null> {
  const normalized = String(partnerSlug ?? '').trim().toLowerCase()
  if (!normalized) return null

  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL
  if (!apiUrl) return null

  try {
    const response = await fetch(`${apiUrl}/api/web-pages/partner-storefronts`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) return null

    const json = (await response.json()) as PublicWebPageItemsResponse
    const storefrontItem = (json.items ?? []).find((item) => {
      const config = getPartnerStorefrontConfig(item)
      return config?.slug === normalized
    })
    return getPartnerStorefrontConfig(storefrontItem)
  } catch {
    return null
  }
}
