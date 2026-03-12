import { redirect } from 'next/navigation';
import type { Category } from '@/store/api/categoriesApi';
import { buildPageMetadata } from '@/app/seo';

export const metadata = buildPageMetadata({ title: 'Category', description: 'Browse the Category page on AF Home.', path: '/category' });
export const dynamic = 'force-dynamic';

interface ApiCategoriesResponse {
  categories?: Category[];
}

const toSlug = (value: string) => value.toLowerCase().trim().replace(/\s+/g, '-');

const normalizeCategorySlug = (rawUrl: string | null | undefined, fallbackName: string) => {
  const source = (rawUrl ?? '').trim();
  if (!source || source === '0') return toSlug(fallbackName);

  const withoutDomain = source.replace(/^https?:\/\/[^/]+/i, '');
  const cleaned = withoutDomain
    .replace(/^\/+/, '')
    .replace(/^category\//i, '')
    .replace(/\/+$/, '');

  return cleaned || toSlug(fallbackName);
};

async function getFirstCategorySlug(): Promise<string> {
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL;
  if (!apiUrl) return 'chairs-stools';

  try {
    const res = await fetch(`${apiUrl}/api/categories`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) return 'chairs-stools';

    const json = (await res.json()) as ApiCategoriesResponse;
    const firstCategory = json.categories?.[0];
    if (!firstCategory) return 'chairs-stools';

    return normalizeCategorySlug(firstCategory.url, firstCategory.name);
  } catch {
    return 'chairs-stools';
  }
}

export default async function CategoryIndexPage() {
  const firstSlug = await getFirstCategorySlug();
  redirect(`/category/${firstSlug}`);
}
