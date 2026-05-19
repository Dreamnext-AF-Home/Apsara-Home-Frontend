import { getPartnerStorefrontConfig, type PartnerStorefrontConfig } from '@/libs/partnerStorefront'
import type { WebPageItem } from '@/store/api/webPagesApi'

type PublicWebPageItemsResponse = {
  items?: WebPageItem[]
}

const REQUEST_TIMEOUT_MS = 10000
const MAX_RETRIES = 2
const STOREFRONT_REVALIDATE_SECONDS = 120

async function fetchWithTimeout(input: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

export async function getPartnerStorefrontBySlug(
  partnerSlug: string,
  options: { fresh?: boolean } = {},
): Promise<PartnerStorefrontConfig | null> {
  const normalized = String(partnerSlug ?? '').trim().toLowerCase()
  if (!normalized) return null

  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL
  if (!apiUrl) return null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(`${apiUrl}/api/web-pages/partner-storefronts`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        ...(options.fresh
          ? { cache: 'no-store' as const }
          : {
              next: {
                revalidate: STOREFRONT_REVALIDATE_SECONDS,
                tags: ['storefront:partner-storefronts'],
              },
            }),
      })
      if (!response.ok) continue

      const json = (await response.json()) as PublicWebPageItemsResponse
      const storefrontItem = (json.items ?? []).find((item) => {
        const config = getPartnerStorefrontConfig(item)
        return config?.slug === normalized
      })
      return getPartnerStorefrontConfig(storefrontItem)
    } catch {
      // Retry transient network/timeout failures before treating as unavailable.
    }
  }

  return null
}
