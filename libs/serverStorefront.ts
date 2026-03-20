import type { Category } from '@/store/api/categoriesApi'

type ApiCategoriesResponse = {
  categories?: Category[]
}

export async function getNavbarCategories(): Promise<Category[]> {
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL
  if (!apiUrl) return []

  try {
    const response = await fetch(`${apiUrl}/api/categories?page=1&per_page=100`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!response.ok) return []

    const payload = (await response.json()) as ApiCategoriesResponse
    return Array.isArray(payload.categories) ? payload.categories : []
  } catch {
    return []
  }
}
