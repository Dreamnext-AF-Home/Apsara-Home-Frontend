import CategoryListProductMain from '@/components/category/CategoryListProductMain'
import { buildPageMetadata } from '@/app/seo'
import { getNavbarCategories } from '@/libs/serverStorefront'
import { getRoomOptionBySlug } from '@/libs/roomConfig'

export const metadata = buildPageMetadata({ title: 'By Room Details', description: 'Browse the By Room Details page on AF Home.', path: '/by-room/[...slug]' })
export const dynamic = 'force-dynamic'

type ByRoomDetailsPageProps = {
  params: Promise<{ slug: string[] }>
}

type LooseRecord = Record<string, unknown>

interface DisplayProduct {
  id?: number
  name: string
  price: number
  priceMember?: number
  prodpv?: number
  originalPrice?: number
  image: string
  images?: string[]
  badge?: string
  verified?: boolean
  stock?: number
}

const titleFromSlug = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')

const resolveImageUrl = (rawImage: string | null | undefined, apiUrl?: string) => {
  if (!rawImage) return '/Images/HeroSection/chairs_stools.jpg'
  if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) return rawImage
  if (rawImage.startsWith('/')) return rawImage
  if (!apiUrl) return `/${rawImage}`
  return `${apiUrl.replace(/\/$/, '')}/${rawImage.replace(/^\/+/, '')}`
}

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.-]/g, '')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') return ['1', 'true', 'yes'].includes(value.trim().toLowerCase())
  return false
}

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      }
    } catch {
      return [value]
    }
  }

  return []
}

const resolveDisplayStock = (row: LooseRecord): number => {
  const variants = Array.isArray(row.variants) ? row.variants : []
  if (variants.length === 0) return toNumber(row.qty)

  const activeVariants = variants.filter((variant) => {
    const status = toNumber((variant as LooseRecord).status)
    return status === 0 || status === 1 ? status === 1 : true
  })

  if (activeVariants.length === 0) return 0
  return activeVariants.reduce((sum, variant) => sum + Math.max(0, toNumber((variant as LooseRecord).qty)), 0)
}

const mapProductToDisplay = (row: LooseRecord, apiUrl?: string): DisplayProduct => {
  let badge: string | undefined
  if (toBoolean(row.salespromo)) badge = 'SALE'
  else if (toBoolean(row.bestseller)) badge = 'BEST SELLER'
  else if (toBoolean(row.musthave)) badge = 'MUST HAVE'

  const rawImage = typeof row.image === 'string' ? row.image : null
  const rawImages = toStringArray(row.images)

  return {
    id: toNumber(row.id) || undefined,
    name: String(row.name ?? 'Untitled Product'),
    price: toNumber(row.priceSrp),
    priceMember: toNumber(row.priceMember) || undefined,
    prodpv: toNumber(row.prodpv) || undefined,
    image: resolveImageUrl(rawImage, apiUrl),
    images: rawImages.map((item) => resolveImageUrl(item, apiUrl)),
    badge,
    verified: toBoolean(row.verified),
    stock: resolveDisplayStock(row),
  }
}

const matchesKeyword = (row: LooseRecord, keywordSlug?: string) => {
  if (!keywordSlug) return true
  const keyword = keywordSlug.replace(/-/g, ' ').toLowerCase()
  const haystack = [row.name, row.description, row.specifications]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase()
  return haystack.includes(keyword)
}

async function getRoomProducts(roomSlug: string, keywordSlug?: string) {
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL
  const room = getRoomOptionBySlug(roomSlug)
  const fallbackLabel = titleFromSlug(roomSlug)

  if (!apiUrl || !room) {
    return { label: fallbackLabel, products: [] as DisplayProduct[] }
  }

  try {
    const productsUrl = new URL(`${apiUrl}/api/products`)
    productsUrl.searchParams.set('page', '1')
    productsUrl.searchParams.set('per_page', '200')
    productsUrl.searchParams.set('status', '1')
    productsUrl.searchParams.set('room_type', String(room.id))

    const response = await fetch(productsUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!response.ok) {
      return { label: room.label, products: [] as DisplayProduct[] }
    }

    const json = (await response.json()) as { products?: unknown[] }
    const rows = Array.isArray(json.products) ? json.products : []

    return {
      label: keywordSlug ? `${room.label} - ${titleFromSlug(keywordSlug)}` : room.label,
      products: rows
        .map((item) => item as LooseRecord)
        .filter((row) => matchesKeyword(row, keywordSlug))
        .map((row) => mapProductToDisplay(row, apiUrl)),
    }
  } catch {
    return { label: room.label, products: [] as DisplayProduct[] }
  }
}

export default async function ByRoomDetailsPage({ params }: ByRoomDetailsPageProps) {
  const { slug } = await params
  const roomSlug = slug[0] ?? ''
  const keywordSlug = slug[1]
  const { label, products } = await getRoomProducts(roomSlug, keywordSlug)
  const navbarCategories = await getNavbarCategories()

  return (
    <CategoryListProductMain
      slug={roomSlug}
      initialCategoryLabel={label}
      initialProducts={products}
      initialCategories={navbarCategories}
    />
  )
}
