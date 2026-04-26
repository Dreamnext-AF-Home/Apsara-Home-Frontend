'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getRoomOptionById } from '@/libs/roomConfig'
import { useGetProductsQuery } from '@/store/api/productsApi'

const quickActions = [
  {
    label: 'Add Product',
    color: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-500/10 dark:hover:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/25',
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    href: '/admin/products?modal=add-product',
  },
  {
    label: 'New Order',
    color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:hover:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25',
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
    href: '/admin/orders',
  },
  {
    label: 'Add Member',
    color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:hover:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/25',
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" /></svg>,
    href: '/admin/members?modal=add-member',
  },
  {
    label: 'View Reports',
    color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/10 dark:hover:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/25',
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" /></svg>,
    href: '/admin/reports/sales',
  },
]

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(value || 0)

const TopProducts = () => {
  const router = useRouter()
  const { data, isLoading, isFetching, isError } = useGetProductsQuery({ perPage: 100, status: '1' })

  const products = useMemo(() => {
    const rows = [...(data?.products ?? [])]
      .sort((a, b) => {
        const soldDiff = Number(b.soldCount ?? 0) - Number(a.soldCount ?? 0)
        if (soldDiff !== 0) return soldDiff
        return Number(b.priceDp ?? 0) - Number(a.priceDp ?? 0)
      })
      .slice(0, 5)

    const peakSoldCount = Math.max(...rows.map((product) => Number(product.soldCount ?? 0)), 0)

    return rows.map((product) => {
      const sold = Number(product.soldCount ?? 0)
      const pct = peakSoldCount > 0 ? Math.max(8, Math.round((sold / peakSoldCount) * 100)) : 8
      const roomLabel = getRoomOptionById(product.roomType)?.label
      const metaLabel = roomLabel || product.brand || (product.sku ? `SKU ${product.sku}` : 'Uncategorized')

      return {
        id: product.id,
        name: product.name || `Product #${product.id}`,
        metaLabel,
        sold,
        price: Number(product.priceDp ?? product.priceSrp ?? 0),
        pct,
      }
    })
  }, [data?.products])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className={`${action.color} flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors duration-200`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Top Products</h3>
            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
              {isLoading ? 'Loading live product rankings...' : 'Based on actual sold count from the database'}
            </p>
          </div>
          <Link href="/admin/products" className="text-xs font-medium text-teal-600 hover:underline dark:text-teal-300">
            See all
          </Link>
        </div>

        <div className="space-y-4">
          {isLoading && Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700" />
                  <div>
                    <div className="h-3.5 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="mt-1 h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
                <div>
                  <div className="h-3.5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="mt-1 h-3 w-14 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}

          {!isLoading && isError && (
            <div className="py-6 text-center text-sm text-red-500 dark:text-red-300">
              Unable to load top products from the database.
            </div>
          )}

          {!isLoading && !isError && products.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No products with sales data are available yet.
            </div>
          )}

          {!isLoading && !isError && products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.07 }}
            >
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-4 shrink-0 text-xs font-bold text-gray-300 dark:text-gray-500">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-gray-700 dark:text-gray-100">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.metaLabel}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-100">{formatMoney(product.price)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{product.sold} sold</p>
                </div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${product.pct}%` }}
                  transition={{ delay: index * 0.07 + 0.2, duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full bg-linear-to-r from-teal-400 to-teal-600"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {isFetching && !isLoading && (
          <div className="mt-4 border-t border-gray-200 pt-2 text-right text-[11px] text-gray-400 dark:border-gray-700 dark:text-gray-500">
            Refreshing live product data...
          </div>
        )}
      </div>
    </div>
  )
}

export default TopProducts
