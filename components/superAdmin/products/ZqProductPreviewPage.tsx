import Image from 'next/image'
import Link from 'next/link'

type ZqImportDetailSpec = {
  id: string
  skuId: string | null
  spec: string | null
  cost: number | null
  salesPrice: number | null
  amountOnSale: number | null
  weight: number | null
  image: string | null
  status: string | null
  attributes: Array<{
    attributeId: string | null
    value: string | null
    skuImageUrl: string | null
  }>
}

export type ZqImportDetailData = {
  id: string
  offerId: string | null
  categoryId: string | null
  categoryName: string | null
  subject: string
  subjectCn: string | null
  description: string | null
  images: string[]
  published: string | null
  shippingTo: string | null
  status: string | null
  importProductStatus: string | null
  sourceType: string | null
  productUrl: string | null
  targetCurrency: string | null
  createdAt: string | null
  updatedAt: string | null
  specs: ZqImportDetailSpec[]
}

export const centsToDisplay = (value: number | null | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `₱${(value / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const stripHtml = (value: string | null | undefined) => {
  if (!value) return ''

  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

export const extractZqImportDetail = (payload: Record<string, unknown> | undefined): ZqImportDetailData => {
  const data = (payload?.data ?? {}) as Record<string, unknown>
  const images = Array.isArray(data.images)
    ? (data.images as Array<Record<string, unknown>>)
      .map((item) => typeof item.image === 'string' ? item.image : null)
      .filter((item): item is string => Boolean(item))
    : []
  const specsRaw = Array.isArray(data.specs) ? data.specs : []

  return {
    id: String(data.id ?? ''),
    offerId: data.offerId == null ? null : String(data.offerId),
    categoryId: data.categoryId == null ? null : String(data.categoryId),
    categoryName: typeof data.categoryName === 'string' ? data.categoryName : null,
    subject: typeof data.subject === 'string' ? data.subject : '',
    subjectCn: typeof data.subjectCn === 'string' ? data.subjectCn : null,
    description: typeof data.description === 'string' ? data.description : null,
    images,
    published: typeof data.published === 'string' ? data.published : null,
    shippingTo: typeof data.shippingTo === 'string' ? data.shippingTo : null,
    status: typeof data.status === 'string' ? data.status : null,
    importProductStatus: typeof data.importProductStatus === 'string' ? data.importProductStatus : null,
    sourceType: typeof data.sourceType === 'string' ? data.sourceType : null,
    productUrl: typeof data.productUrl === 'string' ? data.productUrl : null,
    targetCurrency: typeof data.targetCurrency === 'string' ? data.targetCurrency : null,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : null,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : null,
    specs: specsRaw.map((spec, index) => {
      const row = (spec ?? {}) as Record<string, unknown>
      const attributesRaw = Array.isArray(row.attributes) ? row.attributes : []

      return {
        id: String(row.id ?? index),
        skuId: row.skuId == null ? null : String(row.skuId),
        spec: typeof row.spec === 'string' ? row.spec : null,
        cost: typeof row.cost === 'number' ? row.cost : (typeof row.cost === 'string' ? Number(row.cost) : null),
        salesPrice: typeof row.salesPrice === 'number' ? row.salesPrice : (typeof row.salesPrice === 'string' ? Number(row.salesPrice) : null),
        amountOnSale: typeof row.amountOnSale === 'number' ? row.amountOnSale : (typeof row.amountOnSale === 'string' ? Number(row.amountOnSale) : null),
        weight: typeof row.weight === 'number' ? row.weight : (typeof row.weight === 'string' ? Number(row.weight) : null),
        image: typeof row.image === 'string' ? row.image : null,
        status: typeof row.status === 'string' ? row.status : null,
        attributes: attributesRaw.map((attribute) => {
          const attr = (attribute ?? {}) as Record<string, unknown>

          return {
            attributeId: attr.attributeId == null ? null : String(attr.attributeId),
            value: typeof attr.value === 'string' ? attr.value : null,
            skuImageUrl: typeof attr.skuImageUrl === 'string' ? attr.skuImageUrl : null,
          }
        }),
      }
    }),
  }
}

export default function ZqProductPreviewPage({
  detail,
  backHref,
  scopeLabel,
}: {
  detail: ZqImportDetailData
  backHref: string
  scopeLabel: string
}) {
  const heroImage = detail.images[0] ?? detail.specs.find((item) => item.image)?.image ?? null
  const primarySpec = detail.specs[0] ?? null
  const totalStock = detail.specs.reduce((sum, spec) => sum + Number(spec.amountOnSale ?? 0), 0)
  const cleanedDescription = stripHtml(detail.description)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">{scopeLabel}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Global Supplier Product Preview</h1>
          <p className="mt-1 text-sm text-slate-500">Viewing only ito. Hindi pa ito kasama sa local catalog o sa public All Products.</p>
        </div>
        <Link
          href={backHref}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Back to Product List
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
            <div className="relative aspect-square w-full">
              {heroImage ? (
                <Image src={heroImage} alt={detail.subject} fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">No image</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {detail.images.slice(0, 8).map((image, index) => (
              <div key={`${image}-${index}`} className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <Image src={image} alt={`${detail.subject} ${index + 1}`} fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-sky-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
              Storefront-style Preview
            </div>
            <div className="space-y-4 p-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {heroImage ? (
                  <Image src={heroImage} alt={detail.subject} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">No image</div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{detail.sourceType ?? 'AF HOME GLOBAL SUPPLIER'}</p>
                <h2 className="line-clamp-3 text-xl font-bold leading-snug text-slate-900">{detail.subject || 'Untitled product'}</h2>
                <div className="flex flex-wrap items-end gap-2">
                  <span className="text-3xl font-extrabold text-sky-700">{centsToDisplay(primarySpec?.salesPrice ?? null)}</span>
                  {primarySpec?.cost != null ? (
                    <span className="text-base text-slate-400 line-through">{centsToDisplay(primarySpec.cost)}</span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {totalStock} total stock
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {detail.specs.length} variant{detail.specs.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white opacity-80"
              >
                Preview Only
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">#{detail.id}</span>
              {detail.sourceType ? <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{detail.sourceType}</span> : null}
              {detail.status ? <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">{detail.status}</span> : null}
              {detail.importProductStatus ? <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{detail.importProductStatus}</span> : null}
            </div>
            <h3 className="text-3xl font-bold leading-tight text-slate-900">{detail.subject || 'Untitled product'}</h3>
            {detail.subjectCn ? <p className="text-sm text-slate-500">{detail.subjectCn}</p> : null}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Category</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{detail.categoryName ?? '—'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Currency</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{detail.targetCurrency ?? '—'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Shipping To</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{detail.shippingTo ?? '—'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Updated</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{detail.updatedAt ?? detail.published ?? '—'}</p>
              </div>
            </div>
            {detail.productUrl ? (
              <a
                href={detail.productUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
              >
                Open original supplier source
              </a>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-base font-bold text-slate-900">Product description</h4>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-7 text-slate-600">
                {cleanedDescription || 'No description available.'}
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Source HTML is hidden here para sariling preview lang ang makita natin.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-slate-900">Specs and pricing</h4>
                <p className="text-sm text-slate-500">Ito yung pwede nating i-map later sa variants, prices, at stock.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {detail.specs.length} spec{detail.specs.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="overflow-auto rounded-2xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Spec</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Cost</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Sale Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {detail.specs.map((spec) => (
                    <tr key={spec.id}>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800">{spec.spec ?? '—'}</p>
                          {spec.attributes.length > 0 ? (
                            <p className="text-xs text-slate-500">
                              {spec.attributes.map((attribute) => attribute.value).filter(Boolean).join(' / ') || '—'}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{spec.skuId ?? '—'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{centsToDisplay(spec.cost)}</td>
                      <td className="px-4 py-3 font-semibold text-sky-700">{centsToDisplay(spec.salesPrice)}</td>
                      <td className="px-4 py-3 text-slate-700">{spec.amountOnSale ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{spec.weight ?? '—'}</td>
                    </tr>
                  ))}
                  {detail.specs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                        No specs available for this product.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
