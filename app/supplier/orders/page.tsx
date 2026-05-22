import { getServerSession } from 'next-auth'
import { supplierAuthOptions } from '@/libs/supplierAuth'
import { buildPageMetadata } from '@/app/seo'
import SupplierOrdersPage from '@/components/supplier/SupplierOrdersPage'
import type { SupplierOrdersResponse } from '@/store/api/supplierOrdersApi'

export const metadata = buildPageMetadata({
  title: 'Supplier Orders',
  description: 'Manage supplier orders on AF Home.',
  path: '/supplier/orders',
  noIndex: true,
})

async function fetchInitialOrders(token: string): Promise<SupplierOrdersResponse | null> {
  try {
    const apiUrl = (process.env.LARAVEL_API_URL ?? '').replace(/\/+$/, '')
    const res = await fetch(`${apiUrl}/api/supplier/orders?filter=all&page=1&per_page=20`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json() as Promise<SupplierOrdersResponse>
  } catch {
    return null
  }
}

export default async function SupplierOrders() {
  const session = await getServerSession(supplierAuthOptions)
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken
  const initialData = token ? await fetchInitialOrders(token) : null

  return <SupplierOrdersPage initialData={initialData ?? undefined} />
}
