'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Heart, Share2, ShoppingCart } from 'lucide-react'
import type { ZqImportDetailData } from '@/components/superAdmin/products/ZqProductPreviewPage'
import { adaptZqDetailToDisplayProduct, formatZqMoney } from './zqProductAdapter'

export default function ZqCustomerProductPreview({
  detail,
  backHref,
}: {
  detail: ZqImportDetailData
  backHref: string
}) {
  const product = useMemo(() => adaptZqDetailToDisplayProduct(detail), [detail])
  const [selectedImage, setSelectedImage] = useState(product.image)
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? '')
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0]
  const gallery = product.images.length > 0 ? product.images : product.image ? [product.image] : []
  const activeImage = selectedVariant?.image || selectedImage || product.image

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">Supplier customer display preview</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Global Supplier product as customer page</h1>
          <p className="mt-1 text-sm text-slate-500">
            Preview only. This uses a ZQ adapter so China product data can be displayed safely before customer publishing.
          </p>
        </div>
        <Link
          href={backHref}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Back to Supplier Products
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3 text-xs text-slate-500">
          Home / {product.category} / <span className="font-semibold text-slate-800">{product.name}</span>
        </div>

        <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.92fr)]">
          <div className="space-y-5">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-slate-50">
              {activeImage ? (
                <Image src={activeImage} alt={product.name} fill className="object-contain p-8" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">No image</div>
              )}
            </div>

            {gallery.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.slice(0, 8).map((image, index) => {
                  const active = image === activeImage
                  return (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-white transition ${active ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200 hover:border-sky-300'}`}
                    >
                      <Image src={image} alt={`${product.name} ${index + 1}`} fill className="object-cover" unoptimized />
                    </button>
                  )
                })}
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-900">{product.brand}</p>
              <p className="mt-1 text-xs text-slate-500">Global Supplier display card preview</p>
              <div className="mt-4 overflow-hidden rounded-lg border border-sky-200">
                <div className="bg-sky-500 px-3 py-1 text-xs font-black text-white">Register to get 6% discount</div>
                <div className="relative aspect-[4/3] bg-white">
                  {product.image ? <Image src={product.image} alt={product.name} fill className="object-contain p-5" unoptimized /> : null}
                  <div className="absolute right-3 top-3 flex flex-col gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow"><Heart size={16} /></span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow"><Share2 size={16} /></span>
                  </div>
                  <div className="absolute bottom-4 right-3 inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
                    <ShoppingCart size={16} />
                    Add to Cart
                  </div>
                </div>
                <div className="border-t border-slate-100 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-400">{product.brand}</p>
                  <p className="mt-1 line-clamp-2 min-h-[40px] text-sm font-semibold text-slate-800">{product.name}</p>
                  <p className="mt-2 text-lg font-black text-sky-500">{formatZqMoney(product.price)}</p>
                  <p className="mt-1 text-xs text-slate-400">{product.stock} available · {product.variantCount} variant(s)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">{product.brand}</p>
                  <h2 className="mt-2 text-3xl font-black leading-tight text-slate-900">{product.name}</h2>
                  <p className="mt-2 text-sm text-slate-500">{product.category}</p>
                </div>
                <div className="flex gap-2 text-slate-500">
                  <button type="button" className="rounded-full border border-slate-200 p-2"><Heart size={17} /></button>
                  <button type="button" className="rounded-full border border-slate-200 p-2"><Share2 size={17} /></button>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-sky-50 p-5">
                <p className="text-3xl font-black text-sky-600">{formatZqMoney(selectedVariant?.price ?? product.price)}</p>
                {selectedVariant?.compareAtPrice ? (
                  <p className="mt-1 text-sm text-slate-400 line-through">{formatZqMoney(selectedVariant.compareAtPrice)}</p>
                ) : null}
                <p className="mt-2 text-xs font-semibold text-sky-700">
                  Preview price from Global Supplier data. Final customer pricing can be adjusted before publishing.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <InfoPill label="Stock" value={`${selectedVariant?.stock ?? product.stock}`} />
                <InfoPill label="Variants" value={`${product.variantCount}`} />
                <InfoPill label="Status" value={product.status || 'Preview'} />
              </div>

              {product.variants.length > 0 ? (
                <div className="mt-6">
                  <p className="text-sm font-bold text-slate-900">Variants / specs</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {product.variants.slice(0, 12).map((variant) => {
                      const active = variant.id === selectedVariant?.id
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => {
                            setSelectedVariantId(variant.id)
                            if (variant.image) setSelectedImage(variant.image)
                          }}
                          className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${active ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200'}`}
                        >
                          <span className="line-clamp-1 font-semibold">{variant.label}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">{formatZqMoney(variant.price)} · stock {variant.stock}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex gap-3">
                <button type="button" disabled className="flex-1 rounded-full border border-sky-300 px-4 py-3 text-sm font-bold text-sky-700 opacity-80">
                  Add to Cart Preview
                </button>
                <button type="button" disabled className="flex-1 rounded-full bg-sky-500 px-4 py-3 text-sm font-bold text-white opacity-80">
                  Buy Now Preview
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Description</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                {product.description || 'No customer description available yet.'}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Supplier identifiers</h3>
              <div className="mt-3 grid gap-2 text-sm">
                <DetailRow label="ZQ Product ID" value={product.id} />
                <DetailRow label="Source" value={product.sourceType || 'Global Supplier'} />
                <DetailRow label="Category" value={product.category} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="truncate text-right font-semibold text-slate-800">{value}</span>
    </div>
  )
}
