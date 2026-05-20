import Link from 'next/link';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Footer from "@/components/landing-page/Footer";
import ScrollToTop from "@/components/landing-page/ScrollToTop";
import ProductPageClient from '@/components/product/ProductPageClient';
import ProductTabs from '@/components/product/ProductTabs';
import ProductPageWrapper from '@/components/product/ProductPageWrapper';
import { categoryMeta, type CategoryProduct } from '@/libs/CategoryData';
import RelatedProducts from '@/components/product/RelatedProduct';
import ProductQA from '@/components/product/ProductQA';
import CompleteTheLook from '@/components/product/CompleteTheLook';
import type { Category } from '@/store/api/categoriesApi';
import type { Product } from '@/store/api/productsApi';
import { buildPageMetadata } from '@/app/seo';
import { getNavbarCategories } from '@/libs/serverStorefront';
import { buildCanonicalProductSlug, getProductPageData } from '@/libs/productPageData';
export const revalidate = 60;

type LooseRecord = Record<string, unknown>;
const toLooseRecord = (value: unknown): LooseRecord => value as LooseRecord;

interface ApiCategoriesResponse {
  categories?: Category[];
  data?: Category[];
}

interface ApiProductsResponse {
  products?: Product[];
  data?: Product[];
}

const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parseSlugAndId = (raw: string) => {
  const match = raw.match(/^(.*)-i(\d+)$/i);
  if (!match) return { slugOnly: raw, id: null as number | null };
  const id = Number(match[2]);
  return {
    slugOnly: (match[1] || '').trim(),
    id: Number.isFinite(id) ? id : null,
  };
};

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductPageData(slug);
  if (!data) {
    return buildPageMetadata({
      title: 'Product Details',
      description: 'Browse product details on AF Home.',
      path: '/product',
    });
  }

  const canonicalSlug = buildCanonicalProductSlug(data.product.name, data.product.id);
  const fallbackDescription = `Buy ${data.product.name} on AF Home.`;
  const safeDescription = (data.product.description || fallbackDescription).slice(0, 160);

  return buildPageMetadata({
    title: data.product.name,
    description: safeDescription,
    path: `/product/${canonicalSlug}`,
    image: data.product.image,
  });
}

const normalizeCategorySlug = (rawUrl: string | null | undefined, fallbackName: string) => {
  const source = (rawUrl ?? '').trim();
  if (!source || source === '0') return slugify(fallbackName);
  const withoutDomain = source.replace(/^https?:\/\/[^/]+/i, '');
  const cleaned = withoutDomain.replace(/^\/+/, '').replace(/^category\//i, '').replace(/\/+$/, '');
  return cleaned || slugify(fallbackName);
};

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

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value == null) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.-]/g, '');
    if (normalized === '') return undefined;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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
  const source = json as ApiCategoriesResponse;
  return asArray<Category>(source.categories ?? source.data);
};

const extractProducts = (json: unknown): Product[] => {
  const source = json as ApiProductsResponse;
  return asArray<Product>(source.products ?? source.data);
};

const toCategoryProduct = (row: LooseRecord, apiUrl?: string): CategoryProduct => {
  const id = toNumber(row.id ?? row.pd_id ?? 0);
  const name = String(row.name ?? row.pd_name ?? 'Untitled Product');
  const srp = toNumber(row.priceSrp ?? row.pd_price_srp ?? 0);
  const member = toNumber(row.priceMember ?? row.pd_price_member ?? 0);
  const prodpv = toNumber(row.prodpv ?? row.pd_prodpv ?? 0);
  const price = srp;
  const rawImage = (row.image ?? row.pd_image) as string | null | undefined;
  const images = toStringArray(row.images ?? row.pd_images).map((item) => resolveImageUrl(item, apiUrl));

  let badge: string | undefined;
  if (Boolean(row.salespromo ?? row.pd_salespromo)) badge = 'SALE';
  else if (Boolean(row.bestseller ?? row.pd_bestseller)) badge = 'BEST SELLER';
  else if (Boolean(row.musthave ?? row.pd_musthave)) badge = 'MUST HAVE';

  const rawVariants = Array.isArray(row.variants)
    ? row.variants
    : Array.isArray(row.pd_variants)
      ? row.pd_variants
      : (row.variants && typeof row.variants === 'object')
        ? Object.values(row.variants as Record<string, unknown>)
        : [];

  const variants = rawVariants.length > 0
    ? rawVariants.map((item) => {
      const variant = toLooseRecord(item);
      const statusRaw = variant.status ?? variant.pv_status;
      return {
        id: typeof variant.id === 'number' ? variant.id : undefined,
        sku: typeof (variant.sku ?? variant.pv_sku) === 'string' ? String(variant.sku ?? variant.pv_sku) : undefined,
        name: typeof (variant.name ?? variant.pv_name) === 'string' ? String(variant.name ?? variant.pv_name) : undefined,
        color: typeof (variant.color ?? variant.pv_color) === 'string' ? String(variant.color ?? variant.pv_color) : undefined,
        colorHex: typeof (variant.colorHex ?? variant.pv_color_hex) === 'string' ? String(variant.colorHex ?? variant.pv_color_hex) : undefined,
        size: typeof (variant.size ?? variant.pv_size) === 'string' ? String(variant.size ?? variant.pv_size) : undefined,
        style: typeof (variant.style ?? variant.pv_style) === 'string' ? String(variant.style ?? variant.pv_style) : undefined,
        width: toOptionalNumber(variant.width ?? variant.pv_width),
        dimension: toOptionalNumber(variant.dimension ?? variant.pv_dimension),
        height: toOptionalNumber(variant.height ?? variant.pv_height),
        priceSrp: toOptionalNumber(variant.priceSrp ?? variant.pv_price_srp),
        priceDp: toOptionalNumber(variant.priceDp ?? variant.pv_price_dp),
        priceMember: toOptionalNumber(variant.priceMember ?? variant.pv_price_member),
        prodpv: toOptionalNumber(variant.prodpv ?? variant.pv_prodpv),
        qty: toOptionalNumber(variant.qty ?? variant.pv_qty),
        status: typeof statusRaw === 'number' ? statusRaw : Number(statusRaw),
        images: toStringArray(variant.images ?? variant.pv_images).map((img) => resolveImageUrl(img, apiUrl)),
      };
    })
    : undefined;

  const baseStock = Number(row.qty ?? row.pd_qty ?? 0);
  const stock = resolveDisplayStock(baseStock, variants);

  const resolveBrand = () => {
    if (typeof row.brand === 'string') return row.brand;
    if (typeof row.brand_name === 'string') return row.brand_name;
    if (row.brand && typeof row.brand === 'object') {
      const brandObj = row.brand as LooseRecord;
      if (typeof brandObj.pb_name === 'string') return brandObj.pb_name;
      if (typeof brandObj.name === 'string') return brandObj.name;
    }
    return undefined;
  };

  return {
    id: id > 0 ? id : undefined,
    name,
    type: toNumber(row.type ?? row.pd_type),
    price,
    priceSrp: srp > 0 ? srp : undefined,
    priceMember: member > 0 ? member : undefined,
    prodpv,
    originalPrice: undefined,
    image: resolveImageUrl(rawImage, apiUrl),
    images,
    description: (row.description ?? row.pd_description) as string | undefined,
    specifications: (row.specifications ?? row.pd_specifications) as string | undefined,
    weight: toNumber(row.weight ?? row.pd_weight),
    psweight: toNumber(row.psweight ?? row.pd_psweight),
    pswidth: toNumber(row.pswidth ?? row.pd_pswidth),
    pslenght: toNumber(row.pslenght ?? row.pd_pslenght),
    psheight: toNumber(row.psheight ?? row.pd_psheight),
    material: (row.material ?? row.pd_material) as string | undefined,
    assemblyRequired: Boolean(row.assemblyRequired ?? row.pd_assembly_required),
    warranty: (row.warranty ?? row.pd_warranty) as string | undefined,
    sku: String(row.sku ?? row.pd_parent_sku ?? '').trim() || undefined,
    stock,
    variants,
    badge,
    brand: resolveBrand(),
    verified: Boolean(row.verified ?? row.pd_verified),
    manualCheckoutEnabled: Boolean(row.manualCheckoutEnabled ?? row.pd_manual_checkout_enabled),
  };
};

const getCategorySlugFromProduct = (row: LooseRecord, categories: Category[]) => {
  const catId = Number(
    row.catid ??
    row.pd_catid ??
    row.cat_id ??
    row.category_id ??
    ((row.category as LooseRecord | undefined)?.id) ??
    -1,
  );
  const matchedById = categories.find((c) => Number(c.id) === catId);
  if (matchedById) return normalizeCategorySlug(matchedById.url, matchedById.name);

  const categoryName =
    (row.categoryName as string | undefined) ??
    (row.category_name as string | undefined) ??
    (row.cat_name as string | undefined) ??
    ((row.category as LooseRecord | undefined)?.name as string | undefined);

  if (categoryName) return slugify(categoryName);
  return '';
};

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const dynamicData = await getProductPageData(slug);
  if (!dynamicData) return notFound();
  const navbarCategories = await getNavbarCategories();

  const canonicalSlug = buildCanonicalProductSlug(dynamicData.product.name, dynamicData.product.id);
  if (slug !== canonicalSlug) {
    redirect(`/product/${canonicalSlug}`);
  }

  return (
    <ProductPageWrapper initialCategories={navbarCategories}>
      <main className="flex-1 bg-white dark:bg-gray-900">
        <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <Link href="/" className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors font-medium">Home</Link>
              <ChevronRight />
              <Link href={`/category/${dynamicData.categorySlug}`} className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
                {dynamicData.categoryLabel}
              </Link>
              <ChevronRight />
              <span className="text-slate-600 dark:text-gray-300 font-semibold truncate max-w-48">{dynamicData.product.name}</span>
            </nav>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10">
          <ProductPageClient
            product={dynamicData.product}
            categoryLabel={dynamicData.categoryLabel}
            reviewSummary={dynamicData.reviewSummary}
          />
          <div className="border-t border-gray-200 dark:border-gray-700 pt-10 mt-10">
            <ProductTabs
              product={dynamicData.product}
              reviewSummary={dynamicData.reviewSummary}
              reviews={dynamicData.reviews ?? []}
            />
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-10 mt-10">
            <RelatedProducts products={dynamicData.relatedProducts} category={dynamicData.categorySlug} />
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-10 mt-10">
            <ProductQA />
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-10 mt-10">
            <CompleteTheLook
              currentCategory={dynamicData.categorySlug}
              currentCategoryId={dynamicData.categoryId}
              currentCategoryLabel={dynamicData.categoryLabel}
              currentProductId={dynamicData.product.id}
            />
          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </ProductPageWrapper>
  );
}
