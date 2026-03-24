'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useGetPublicProductBrandsQuery } from '@/store/api/productBrandsApi'
import { useGetPublicProductsQuery } from '@/store/api/productsApi'

const toSlug = (value: string) => value.toLowerCase().trim().replace(/\s+/g, '-')
const formatPeso = (value: number) => `P${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

export default function ByBrandPageMain() {
  const searchParams = useSearchParams()
  const selectedBrand = searchParams.get('brand')?.trim().toLowerCase() ?? ''
  const { data, isFetching } = useGetPublicProductBrandsQuery()

  const brands = useMemo(() => {
    const rows = (data?.brands ?? []).filter((brand) => brand.status === 0 && brand.name.trim().length > 0)
    if (!selectedBrand) return rows
    return rows.filter((brand) => toSlug(brand.name) === selectedBrand)
  }, [data?.brands, selectedBrand])
  const selectedBrandItem = useMemo(
    () => (data?.brands ?? []).find((brand) => toSlug(brand.name) === selectedBrand) ?? null,
    [data?.brands, selectedBrand],
  )
  const { data: brandProductsData, isFetching: isFetchingProducts } = useGetPublicProductsQuery(
    selectedBrandItem
      ? {
          page: 1,
          perPage: 24,
          status: '1',
          brandType: selectedBrandItem.id,
        }
      : undefined,
    {
      skip: !selectedBrandItem,
    },
  )
  const brandProducts = brandProductsData?.products ?? []

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-500">Shop By Brand</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">
            {selectedBrand ? 'Selected Brand' : 'All Brands'}
          </h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            Browse featured product brands from the catalog. Pick a brand below to continue exploring.
          </p>
        </div>
        {selectedBrand && (
          <Link
            href="/by-brand"
            className="inline-flex items-center justify-center rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-100"
          >
            View All Brands
          </Link>
        )}
      </div>

      <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        {isFetching ? (
          <p className="text-sm text-gray-500">Loading brands...</p>
        ) : brands.length === 0 ? (
          <p className="text-sm text-gray-500">No brands found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {brands.map((brand) => {
              const brandSlug = toSlug(brand.name)
              const isActive = brandSlug === selectedBrand

              return (
                <Link
                  key={brand.id}
                  href={`/by-brand?brand=${encodeURIComponent(brandSlug)}`}
                  className={`group rounded-2xl border px-5 py-4 transition-all duration-200 ${
                    isActive
                      ? 'border-orange-300 bg-orange-50 text-orange-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <p className="text-base font-semibold">{brand.name}</p>
                  <p className="mt-1 text-sm text-gray-400 group-hover:text-orange-500">
                    View this brand
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {selectedBrandItem && (
        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-500">Brand Products</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">{selectedBrandItem.name}</h2>
            </div>
            <p className="text-sm text-gray-500">
              {isFetchingProducts ? 'Loading products...' : `${brandProducts.length} product(s)`}
            </p>
          </div>

          <div className="mt-6">
            {isFetchingProducts ? (
              <p className="text-sm text-gray-500">Loading products for this brand...</p>
            ) : brandProducts.length === 0 ? (
              <p className="text-sm text-gray-500">No products assigned to this brand yet.</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {brandProducts.map((product) => {
                  const slug = toSlug(product.name)
                  const href = `/product/${slug}-i${product.id}`

                  return (
                    <Link
                      key={product.id}
                      href={href}
                      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg"
                    >
                      <div className="relative aspect-[4/3] bg-gray-50">
                        {product.image ? (
                          <Image src={product.image} alt={product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" unoptimized />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm font-semibold text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">{selectedBrandItem.name}</p>
                        <h3 className="line-clamp-2 min-h-[3.5rem] text-base font-semibold text-gray-900">
                          {product.name}
                        </h3>
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xs text-gray-400">Member Price</p>
                            <p className="text-lg font-bold text-orange-600">
                              {formatPeso(product.priceMember ?? product.priceDp ?? product.priceSrp)}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-gray-400">SKU {product.sku || '-'}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
