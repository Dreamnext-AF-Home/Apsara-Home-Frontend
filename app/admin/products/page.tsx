import { buildPageMetadata } from '@/app/seo';

export const metadata = buildPageMetadata({ title: 'Admin Products', description: 'Browse the Admin Products page on AF Home.', path: '/admin/products', noIndex: true });

import ProductsPageMain from '@/components/superAdmin/products/ProductsPageMain'
import { adminAuthOptions } from '@/libs/adminAuth'
import { normalizeProductsResponse, ProductsResponse } from '@/store/api/productsApi'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

async function getInitialProducts(): Promise<ProductsResponse | null> {
  const session = await getServerSession(adminAuthOptions)
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken

  if (!accessToken) return null

  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL
  if (!apiUrl) return null

  const res = await fetch(`${apiUrl}/api/admin/products?page=1&per_page=25`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  })

  if (!res.ok) return null
  return normalizeProductsResponse((await res.json()) as ProductsResponse)
}

export default async function AdminProductsPage() {
  const initialData = await getInitialProducts()

  return <ProductsPageMain initialData={initialData} />
}
