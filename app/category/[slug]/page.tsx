import { Suspense } from 'react';
import CategoryListProductMain from '@/components/category/CategoryListProductMain';
import type { Category } from '@/store/api/categoriesApi';
import type { Product, ProductsResponse } from '@/store/api/productsApi';
import { buildPageMetadata } from '@/app/seo';
import { getNavbarCategories } from '@/libs/serverStorefront';

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
  createdAt?: string | null;
  price: number;
  priceSrp?: number;
  priceMember?: number;
  priceDp?: number;
  prodpv?: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  badge?: string;
  verified?: boolean;
  stock?: number;
  brand?: string;
  soldCount?: number;
  avgRating?: number;
  rating?: number;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
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

const resolveDisplayStock = (
  baseStock: number,
  variants?: Array<{ qty?: number; status?: number }>,
): number => {
  if (!variants || variants.length === 0) return baseStock;

  const activeVariants = variants.filter((variant) => {
    if (variant.status == null) return true;
    return Number(variant.status) === 1;
  });

  if (activeVariants.length === 0) return 0;

  const hasVariantQty = activeVariants.some((variant) => typeof variant.qty === 'number');
  if (!hasVariantQty) return baseStock;

  return activeVariants.reduce((sum, variant) => sum + Math.max(0, Number(variant.qty ?? 0)), 0);
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
  const member = toNumber(row.priceMember ?? row.pd_price_member ?? 0);
  const dp = toNumber(row.priceDp ?? row.pd_price_dp ?? 0);
  const prodpv = toNumber(row.prodpv ?? row.pd_prodpv ?? 0);
  const price = srp;
  const rawVariants = Array.isArray(row.variants)
    ? row.variants
    : Array.isArray(row.pd_variants)
      ? row.pd_variants
      : [];
  const variants = rawVariants.map((item) => {
    const variant = toLooseRecord(item);
    return {
      qty: toNumber(variant.qty ?? variant.pv_qty ?? 0),
      status: toNumber(variant.status ?? variant.pv_status ?? 1),
    };
  });
  const stock = resolveDisplayStock(toNumber(row.qty ?? row.pd_qty ?? 0), variants);

  let badge: string | undefined;
  if (toBoolean(row.salespromo ?? row.pd_salespromo)) badge = 'SALE';
  else if (toBoolean(row.bestseller ?? row.pd_bestseller)) badge = 'BEST SELLER';
  else if (toBoolean(row.musthave ?? row.pd_musthave)) badge = 'MUST HAVE';

  const rawImage = (row.image ?? row.pd_image) as string | null | undefined;
  const rawImages = toStringArray(row.images ?? row.pd_images);
  const verified = toBoolean(row.verified ?? row.pd_verified);
  const brand = typeof row.brand === 'string' ? row.brand : undefined;
  const soldCount = toNumber(row.soldCount ?? row.sold_count ?? 0);
  const avgRating = toNumber(row.avgRating ?? row.avg_rating ?? row.rating ?? 0);

  return {
    id: toNumber(row.id ?? row.pd_id ?? 0) || undefined,
    name,
    createdAt: typeof row.createdAt === 'string'
      ? row.createdAt
      : (typeof row.pd_date === 'string' ? row.pd_date : null),
    price,
    priceSrp: srp > 0 ? srp : undefined,
    priceMember: member > 0 ? member : undefined,
    priceDp: dp > 0 ? dp : undefined,
    prodpv,
    originalPrice: undefined,
    image: resolveImageUrl(rawImage, apiUrl),
    images: rawImages.map((item) => resolveImageUrl(item, apiUrl)),
    badge,
    verified,
    stock,
    brand,
    soldCount,
    avgRating,
    rating: avgRating,
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

    const slugKey = slug.toLowerCase();
    const matchingCategories = categories.filter((item) => {
      const normalized = normalizeCategorySlug(item.url, item.name);
      const byUrl = normalized === slugKey;
      const byName = slugify(item.name) === slugKey;
      return byUrl || byName;
    });

    // If there are duplicate categories sharing the same slug, prefer the one
    // with the largest active catalog, then newest id as a tiebreaker.
    const category = matchingCategories
      .slice()
      .sort((a, b) => {
        const countDiff = Number(b.product_count ?? 0) - Number(a.product_count ?? 0);
        if (countDiff !== 0) return countDiff;
        return Number(b.id ?? 0) - Number(a.id ?? 0);
      })[0];

    const categoryId = category ? Number(category.id) : undefined;
    const categoryIds = Array.from(
      new Set(
        matchingCategories
          .map((item) => Number(item.id))
          .filter((id) => Number.isFinite(id)),
      ),
    );
    const categoryLabel = category?.name ?? titleFromSlug(slug);

    const fetchProductsByCategory = async (id?: number) => {
      const fetchPage = async (page: number) => {
        const productsUrl = new URL(`${apiUrl}/api/products`);
        productsUrl.searchParams.set('page', String(page));
        productsUrl.searchParams.set('per_page', '100');
        productsUrl.searchParams.set('status', '1');
        if (typeof id === 'number' && Number.isFinite(id)) {
          productsUrl.searchParams.set('cat_id', String(id));
        }

        const productsRes = await fetch(productsUrl.toString(), {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });

        if (!productsRes.ok) {
          return { products: [] as Product[], lastPage: 1 };
        }

        const productsJson = (await productsRes.json()) as ProductsResponse & {
          meta?: { last_page?: number } | null;
        };

        return {
          products: extractProducts(productsJson),
          lastPage: Number(productsJson?.meta?.last_page ?? 1) || 1,
        };
      };

      const firstPage = await fetchPage(1);
      if (firstPage.lastPage <= 1) {
        return firstPage.products;
      }

      const remainingPages = await Promise.all(
        Array.from({ length: firstPage.lastPage - 1 }, (_, index) => fetchPage(index + 2)),
      );

      return [firstPage, ...remainingPages].flatMap((batch) => batch.products);
    };

    const productBatches = categoryIds.length > 0
      ? await Promise.all(categoryIds.map((id) => fetchProductsByCategory(id)))
      : [await fetchProductsByCategory(categoryId)];
    const products = productBatches.flat();
    const matchingCategoryIdSet = new Set(categoryIds);

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

          const byId = matchingCategoryIdSet.size > 0
            ? matchingCategoryIdSet.has(productCategoryId)
            : (typeof categoryId === 'number' && Number.isFinite(categoryId) && productCategoryId === categoryId);
          const bySlug = productCategorySlug === slug.toLowerCase();

          return byId || bySlug;
        })
        .filter((item, index, list) => {
          const row = toLooseRecord(item);
          const currentId = Number(row.id ?? row.pd_id ?? 0);
          if (currentId > 0) {
            return list.findIndex((candidate) => {
              const candidateRow = toLooseRecord(candidate);
              return Number(candidateRow.id ?? candidateRow.pd_id ?? 0) === currentId;
            }) === index;
          }

          const currentName = String(row.name ?? row.pd_name ?? '').trim().toLowerCase();
          if (!currentName) return true;
          return list.findIndex((candidate) => {
            const candidateRow = toLooseRecord(candidate);
            return String(candidateRow.name ?? candidateRow.pd_name ?? '').trim().toLowerCase() === currentName;
          }) === index;
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

async function CategoryContent({ slug, navbarCategories }: { slug: string; navbarCategories: Category[] }) {
  const { label, products } = await getCategoryProducts(slug);

  return (
    <CategoryListProductMain
      slug={slug}
      initialCategoryLabel={label}
      initialProducts={products}
      initialCategories={navbarCategories}
    />
  );
}

function CategoryLoadingFallback({ slug, navbarCategories }: { slug: string; navbarCategories: Category[] }) {
  return (
    <CategoryListProductMain
      slug={slug}
      isLoading={true}
      initialCategories={navbarCategories}
      initialProducts={[]}
    />
  );
}

function CategoryErrorFallback({ slug }: { slug: string }) {
  return (
    <CategoryListProductMain
      slug={slug}
      hasError={true}
      initialCategories={[]}
      initialProducts={[]}
    />
  );
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const navbarCategories = await getNavbarCategories();

  return (
    <Suspense fallback={<CategoryLoadingFallback slug={slug} navbarCategories={navbarCategories} />}>
      <CategoryContent slug={slug} navbarCategories={navbarCategories} />
    </Suspense>
  );
}
