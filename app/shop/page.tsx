import { buildPageMetadata } from '@/app/seo';

export const metadata = buildPageMetadata({ title: 'Shop', description: 'Browse the Shop page on AF Home.', path: '/shop' });

import Footer from "@/components/layout/Footer"
import Navbar from "@/components/layout/Navbar"
import TopBar from "@/components/layout/TopBar"
import TrustBar from "@/components/layout/TrustBar"
import ShopBuilderSections, { type ShopBuilderApiResponse } from "@/components/sections/ShopBuilderSections"
import { getNavbarCategories } from '@/libs/serverStorefront'

type ApiCategoriesResponse = {
  categories?: ShopBuilderApiResponse['categories']
}

type ApiProductsResponse = {
  products?: ShopBuilderApiResponse['products']
}

type ApiWebPagesResponse = {
  items?: ShopBuilderApiResponse['items']
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
      fetch(`${apiUrl}/api/products?page=1&per_page=100&status=1`, {
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

  return (
    <div>
      <TopBar />
      <Navbar initialCategories={navbarCategories} />
      <TrustBar />
      <ShopBuilderSections data={shopBuilderData} />
      <Footer />
    </div>
  )
}

export default ShopPage
