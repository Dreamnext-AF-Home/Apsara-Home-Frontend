import { buildPageMetadata } from '@/app/seo';

export const metadata = buildPageMetadata({ title: 'Shop', description: 'Browse the Shop page on AF Home.', path: '/shop' });

import ShopPageClient from "@/components/shop/ShopPageClient"
import ShopBuilderSections, { type ShopBuilderApiResponse } from "@/components/sections/ShopBuilderSections"
import { getNavbarCategories } from '@/libs/serverStorefront'
import type { TopBarConfig } from '@/components/layout/TopBar'
import type { TrustBarConfig } from '@/components/layout/TrustBar'

type ApiCategoriesResponse = {
  categories?: ShopBuilderApiResponse['categories']
}

type ApiProductsResponse = {
  products?: ShopBuilderApiResponse['products']
}

type ApiWebPagesResponse = {
  items?: ShopBuilderApiResponse['items']
}

const getItemByKey = (items: ShopBuilderApiResponse['items'], key: string) =>
  items.find((item) => String(item.key ?? '').trim() === key)

const getField = (item: ShopBuilderApiResponse['items'][number] | undefined, key: string) =>
  (((item?.payload ?? {}) as { fields?: Record<string, string> }).fields ?? {})[key] ?? ''

const parseList = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

const parseTrustItems = (item: ShopBuilderApiResponse['items'][number] | undefined) => {
  const fields = (((item?.payload ?? {}) as { fields?: Record<string, string> }).fields ?? {})
  const grouped = new Map<number, { title: string; desc: string }>()

  Object.entries(fields).forEach(([key, value]) => {
    const match = key.match(/^trust_item_(\d+)_(title|desc)$/)
    if (!match) return

    const index = Number.parseInt(match[1], 10)
    const kind = match[2]
    const current = grouped.get(index) ?? { title: '', desc: '' }

    if (kind === 'title') current.title = value
    if (kind === 'desc') current.desc = value

    grouped.set(index, current)
  })

  return Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, trustItem]) => trustItem)
    .filter((trustItem) => trustItem.title || trustItem.desc)
}

const getShopHeaderConfig = (items: ShopBuilderApiResponse['items']) => {
  const shopHeader = getItemByKey(items, 'shop-header')

  const topBar: TopBarConfig = {
    phone: getField(shopHeader, 'contact_phone') || '+63 912 345 6789',
    email: getField(shopHeader, 'contact_email') || 'hello@afhome.ph',
    messages: parseList(getField(shopHeader, 'marquee_messages')),
    facebookLabel: getField(shopHeader, 'facebook_label') || 'FB',
    facebookUrl: getField(shopHeader, 'facebook_url'),
    instagramLabel: getField(shopHeader, 'instagram_label') || 'IG',
    instagramUrl: getField(shopHeader, 'instagram_url'),
    tiktokLabel: getField(shopHeader, 'tiktok_label') || 'TikTok',
    tiktokUrl: getField(shopHeader, 'tiktok_url'),
  }

  const trustBar: TrustBarConfig = {
    items: parseTrustItems(shopHeader),
  }

  return { topBar, trustBar }
}

async function getShopBuilderData(): Promise<ShopBuilderApiResponse | null> {
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL
  if (!apiUrl) return null

  try {
    const [webPagesRes, categoriesRes, productsRes] = await Promise.all([
      fetch(`${apiUrl}/api/web-pages/shop-builder`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${apiUrl}/api/categories?page=1&per_page=100&used_only=1`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${apiUrl}/api/products?page=1&per_page=200&status=1`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
    ])

    if (!webPagesRes.ok || !categoriesRes.ok || !productsRes.ok) return null

    const webPagesJson = (await webPagesRes.json()) as ApiWebPagesResponse
    const categoriesJson = (await categoriesRes.json()) as ApiCategoriesResponse
    const productsJson = (await productsRes.json()) as ApiProductsResponse

    return {
      items: webPagesJson.items ?? [],
      categories: categoriesJson.categories ?? [],
      products: productsJson.products ?? [],
    }
  } catch {
    return null
  }
}

const ShopPage = async () => {
  const shopBuilderData = await getShopBuilderData()
  const navbarCategories = await getNavbarCategories()
  const shopHeader = getShopHeaderConfig(shopBuilderData?.items ?? [])

  return (
    <ShopPageClient
      shopData={shopBuilderData}
      navbarCategories={navbarCategories}
      topBarConfig={shopHeader.topBar}
      trustBarConfig={shopHeader.trustBar}
    />
  )
}

export default ShopPage
