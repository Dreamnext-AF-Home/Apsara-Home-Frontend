import { getPartnerStorefrontConfig, type PartnerStorefrontConfig } from '@/libs/partnerStorefront'
import type { WebPageItem } from '@/store/api/webPagesApi'

type PublicWebPageItemsResponse = {
  items?: WebPageItem[]
}

export type PartnerStorefrontRecord = {
  id: number
  config: PartnerStorefrontConfig
}

type StorefrontFetchOptions = {
  fresh?: boolean
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
  options: StorefrontFetchOptions = {},
): Promise<PartnerStorefrontConfig | null> {
  const record = await getPartnerStorefrontRecordBySlug(partnerSlug, {
    fresh: options.fresh ?? true,
  })

  return record?.config ?? null
}

export async function getPartnerStorefrontRecordBySlug(
  partnerSlug: string,
  options: StorefrontFetchOptions = { fresh: true },
): Promise<PartnerStorefrontRecord | null> {
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
      const config = getPartnerStorefrontConfig(storefrontItem)
      if (!config || !storefrontItem) return null

      return {
        id: storefrontItem.id,
        config,
      }
    } catch {
      // Retry transient network/timeout failures before treating as unavailable.
    }
  }

  return null
}
