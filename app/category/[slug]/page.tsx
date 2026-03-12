import CategoryListProductMain from '@/components/category/CategoryListProductMain';
import type { Category } from '@/store/api/categoriesApi';
import type { Product, ProductsResponse } from '@/store/api/productsApi';
import { buildPageMetadata } from '@/app/seo';

export const metadata = buildPageMetadata({ title: 'Category Details', description: 'Browse the Category Details page on AF Home.', path: '/category/[slug]' });
export const dynamic = 'force-dynamic';

interface ApiCategoriesResponse {
  categories?: Category[];
}

type LooseRecord = Record<string, unknown>;
const toLooseRecord = (value: unknown): LooseRecord => value as LooseRecord;

interface DisplayProduct {
  id?: number;
  name: string;
  price: number;
  priceDp?: number;
  prodpv?: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  badge?: string;
  verified?: boolean;
}

const slugify = (value: string) => value.toLowerCase().trim().replace(/\s+/g, '-');
const normalizeCategorySlug = (rawUrl: string | null | undefined, fallbackName: string) => {
  const source = (rawUrl ?? '').trim();
  if (!source || source === '0') return slugify(fallbackName);

  const withoutDomain = source.replace(/^https?:\/\/[^/]+/i, '');
  const cleaned = withoutDomain
    .replace(/^\/+/, '')
    .replace(/^category\//i, '')
    .replace(/\/+$/, '');

  return cleaned || slugify(fallbackName);
};
const titleFromSlug = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');

const resolveImageUrl = (rawImage: string | null | undefined, apiUrl?: string) => {
  if (!rawImage) return '/Images/HeroSection/chairs_stools.jpg';
  if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) return rawImage;
  if (rawImage.startsWith('/')) return rawImage;
  if (!apiUrl) return `/${rawImage}`;
  return `${apiUrl.replace(/\/$/, '')}/${rawImage.replace(/^\/+/, '')}`;
};

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true' || normalized === 'yes') return true;
    if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === '') return false;
  }
  return false;
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      }
    } catch {
      // fallback below
    }
    return [value];
  }

  return [];
};

const extractCategories = (json: unknown): Category[] => {
  const source = json as { categories?: unknown; data?: unknown };
  const direct = asArray<Category>(source?.categories);
  if (direct.length > 0) return direct;

  const data = source?.data as { categories?: unknown } | unknown[] | undefined;
  if (Array.isArray(data)) return data as Category[];
  return asArray<Category>((data as { categories?: unknown } | undefined)?.categories);
};

const extractProducts = (json: unknown): Product[] => {
  const source = json as { products?: unknown; data?: unknown };
  const direct = asArray<Product>(source?.products);
  if (direct.length > 0) return direct;

  const data = source?.data as { products?: unknown } | unknown[] | undefined;
  if (Array.isArray(data)) return data as Product[];
  return asArray<Product>((data as { products?: unknown } | undefined)?.products);
};

const resolveProductCategorySlug = (row: LooseRecord): string | null => {
  const directName = row.categoryName ?? row.category_name ?? row.cat_name;
  if (typeof directName === 'string' && directName.trim()) return slugify(directName);

  const nestedCategory = row.category as LooseRecord | undefined;
  const nestedName = nestedCategory?.name;
  if (typeof nestedName === 'string' && nestedName.trim()) return slugify(nestedName);

  return null;
};

const mapProductToDisplay = (product: Product | LooseRecord, apiUrl?: string): DisplayProduct => {
  const row = toLooseRecord(product);
  const name = String(row.name ?? row.pd_name ?? 'Untitled Product');
  const srp = toNumber(row.priceSrp ?? row.pd_price_srp ?? 0);
  const dp = toNumber(row.priceDp ?? row.pd_price_dp ?? 0);
  const prodpv = toNumber(row.prodpv ?? row.pd_prodpv ?? 0);
  const isOnSale = toBoolean(row.salespromo ?? row.pd_salespromo);
  const price = isOnSale && dp > 0 ? dp : srp;

  let badge: string | undefined;
  if (toBoolean(row.salespromo ?? row.pd_salespromo)) badge = 'SALE';
  else if (toBoolean(row.bestseller ?? row.pd_bestseller)) badge = 'BEST SELLER';
  else if (toBoolean(row.musthave ?? row.pd_musthave)) badge = 'MUST HAVE';

  const rawImage = (row.image ?? row.pd_image) as string | null | undefined;
  const rawImages = toStringArray(row.images ?? row.pd_images);
  const verified = toBoolean(row.verified ?? row.pd_verified);

  return {
    id: toNumber(row.id ?? row.pd_id ?? 0) || undefined,
    name,
    price,
    priceDp: dp > 0 ? dp : undefined,
    prodpv,
    originalPrice: isOnSale && dp > 0 && srp > dp ? srp : undefined,
    image: resolveImageUrl(rawImage, apiUrl),
    images: rawImages.map((item) => resolveImageUrl(item, apiUrl)),
    badge,
    verified,
  };
};

async function getCategoryProducts(slug: string): Promise<{ label?: string; products?: DisplayProduct[] }> {
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL;
  if (!apiUrl) return { label: titleFromSlug(slug), products: [] };

  try {
    const categoriesRes = await fetch(`${apiUrl}/api/categories`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!categoriesRes.ok) {
      return { label: titleFromSlug(slug), products: [] };
    }

    const categoriesJson = (await categoriesRes.json()) as ApiCategoriesResponse;
    const categories = extractCategories(categoriesJson);

    const category = categories.find((item) => {
      const normalized = normalizeCategorySlug(item.url, item.name);
      const byUrl = normalized === slug.toLowerCase();
      const byName = slugify(item.name) === slug.toLowerCase();
      return byUrl || byName;
    });

    const categoryId = category ? Number(category.id) : undefined;
    const categoryLabel = category?.name ?? titleFromSlug(slug);

    const productsUrl = new URL(`${apiUrl}/api/products`);
    productsUrl.searchParams.set('page', '1');
    productsUrl.searchParams.set('per_page', '200');
    productsUrl.searchParams.set('status', '1');
    if (typeof categoryId === 'number' && Number.isFinite(categoryId)) {
      productsUrl.searchParams.set('cat_id', String(categoryId));
    }

    const productsRes = await fetch(productsUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!productsRes.ok) {
      return { label: categoryLabel, products: [] };
    }

    const productsJson = (await productsRes.json()) as ProductsResponse;
    const products = extractProducts(productsJson);

    return {
      label: categoryLabel,
      products: products
        .filter((item) => {
          const row = toLooseRecord(item);
          const productCategoryId = Number(
            row.catid ??
            row.pd_catid ??
            row.cat_id ??
            row.category_id ??
            ((row.category as LooseRecord | undefined)?.id) ??
            -1,
          );
          const productCategorySlug = resolveProductCategorySlug(row);

          const byId = typeof categoryId === 'number' && Number.isFinite(categoryId) && productCategoryId === categoryId;
          const bySlug = productCategorySlug === slug.toLowerCase();

          return byId || bySlug;
        })
        .map((item) => mapProductToDisplay(item, apiUrl)),
    };
  } catch {
    return {
      label: titleFromSlug(slug),
      products: [],
    };
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { label, products } = await getCategoryProducts(slug);

  return (
    <CategoryListProductMain
      slug={slug}
      initialCategoryLabel={label}
      initialProducts={products}
    />
  );
}
