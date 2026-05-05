import { useGetPublicWebPageItemsQuery } from '@/store/api/webPagesApi'

export type BlogPost = {
  id: number
  title: string
  subtitle?: string | null
  body?: string | null
  image_url?: string | null
  link_url?: string | null
  category?: string
  date?: string
  readTime?: string
  slug?: string
  sort_order: number
  is_active: boolean
}

const defaultBlogPosts: BlogPost[] = [
  {
    id: 1,
    title: '7 Living Room Layouts That Make Small Spaces Look Bigger',
    subtitle: 'Simple furniture placement rules to open up your floor plan and keep movement effortless.',
    category: 'Small Space',
    readTime: '6 min read',
    date: 'March 2026',
    image_url: null,
    link_url: null,
    body: null,
    sort_order: 0,
    is_active: true,
  },
  {
    id: 2,
    title: 'How To Match Wood Tones Without Making Your Room Look Busy',
    subtitle: 'A practical color-matching approach for cabinets, tables, and accent pieces.',
    category: 'Style Guide',
    readTime: '5 min read',
    date: 'February 2026',
    image_url: null,
    link_url: null,
    body: null,
    sort_order: 1,
    is_active: true,
  },
  {
    id: 3,
    title: 'Sofa Buying Checklist: Comfort, Fabric, and Long-Term Durability',
    subtitle: 'What to check before you buy so your sofa still feels right after years of use.',
    category: 'Buying Guide',
    readTime: '8 min read',
    date: 'February 2026',
    image_url: null,
    link_url: null,
    body: null,
    sort_order: 2,
    is_active: true,
  },
  {
    id: 4,
    title: 'Bedroom Refresh In One Weekend: Lighting, Textiles, and Storage',
    subtitle: 'Quick upgrades that make your bedroom feel calmer and more functional.',
    category: 'Design Tips',
    readTime: '7 min read',
    date: 'January 2026',
    image_url: null,
    link_url: null,
    body: null,
    sort_order: 3,
    is_active: true,
  },
  {
    id: 5,
    title: 'Kitchen Counter Styling That Stays Minimal and Useful',
    subtitle: 'Keep your counters clean while still making the space warm and inviting.',
    category: 'Home Care',
    readTime: '4 min read',
    date: 'January 2026',
    image_url: null,
    link_url: null,
    body: null,
    sort_order: 4,
    is_active: true,
  },
  {
    id: 6,
    title: 'Entryway Essentials: What Actually Helps Daily Flow',
    subtitle: 'A smarter setup for shoes, bags, and keys so your home feels organized at the door.',
    category: 'Design Tips',
    readTime: '5 min read',
    date: 'December 2025',
    image_url: null,
    link_url: null,
    body: null,
    sort_order: 5,
    is_active: true,
  },
]

const getApiBase = () => {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_LARAVEL_API_URL ||
    process.env.LARAVEL_API_URL ||
    'http://localhost:8000'
  return raw.replace(/\/+$/, '')
}

async function fetchBlogItems(): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${getApiBase()}/api/web-pages/home-blogs`, {
      cache: 'no-store',
    })

    if (!response.ok) return []
    const data = (await response.json()) as { items?: any[] }
    if (!Array.isArray(data.items)) return []

    return data.items
      .filter((item: any) => item.is_active)
      .map((item: any) => ({
        id: item.id,
        title: item.title || '',
        subtitle: item.subtitle || null,
        body: item.body || null,
        image_url: item.image_url || null,
        link_url: item.link_url || null,
        category: item.payload?.category || null,
        date: item.payload?.date || null,
        readTime: item.payload?.read_time || null,
        slug: item.payload?.slug || null,
        sort_order: item.sort_order || 0,
        is_active: item.is_active,
      }))
      .sort((a, b) => a.sort_order - b.sort_order)
  } catch {
    return []
  }
}

export async function getBlogsContent(): Promise<BlogPost[]> {
  const cmsItems = await fetchBlogItems()
  
  // If no CMS items, return defaults
  if (cmsItems.length === 0) {
    return defaultBlogPosts
  }

  return cmsItems
}

// Hook for client-side usage
export function useBlogsContent() {
  const { data, isLoading, error } = useGetPublicWebPageItemsQuery('home-blogs')

  const blogPosts = data?.items
    ?.filter((item: any) => item.is_active)
    .map((item: any) => ({
      id: item.id,
      title: item.title || '',
      subtitle: item.subtitle || null,
      body: item.body || null,
      image_url: item.image_url || null,
      link_url: item.link_url || null,
      category: item.payload?.category || null,
      date: item.payload?.date || null,
      readTime: item.payload?.read_time || null,
      slug: item.payload?.slug || null,
      sort_order: item.sort_order || 0,
      is_active: item.is_active,
    }))
    .sort((a: BlogPost, b: BlogPost) => a.sort_order - b.sort_order) || defaultBlogPosts

  return { blogPosts, isLoading, error }
}
