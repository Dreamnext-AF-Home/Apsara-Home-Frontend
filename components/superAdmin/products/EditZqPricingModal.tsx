'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  type ZqCachedProduct,
  useUpdateZqProductPricingMutation,
  useFetchZqImportDetailMutation,
  useLazyGetZqVariantPricingQuery,
  useUpdateZqVariantPricingMutation,
} from '@/store/api/productsApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'

/* ─── constants ──────────────────────────────────────────────────────── */

const PERSONAL_CASHBACK_RATE      = 0.04
const UNILEVEL_POOL_RATE          = 0.06
const DIRECT_EDGE_POINTS_RATE     = 0.029
const GLOBAL_PURCHASE_BONUS_RATE  = 0.01
const PRODUCT_PURCHASE_POINTS_RATE = 1 - PERSONAL_CASHBACK_RATE - UNILEVEL_POOL_RATE - DIRECT_EDGE_POINTS_RATE - GLOBAL_PURCHASE_BONUS_RATE
const VAT_RATE = 0.12

const PRICING_TIER_OPTIONS = [
  { value: 'low_end',  label: 'Low-End'  },
  { value: 'high_end', label: 'High-End' },
] as const

/* ─── types ─────────────────────────────────────────────────────────── */

interface Props {
  product: ZqCachedProduct | null
  onClose: () => void
  onSaved?: () => void
}

interface PricingForm {
  dealer_price: string
  member_price: string
  pv: string
  pv_tier: string
  reversed_pv_multiplier: string
}

interface VariantPricingFields {
  dealer_price: string
  member_price: string
  pv: string
}

interface PricingSummary {
  pricingTier: string
  effectiveMemberPrice: number
  transferPrice: number
  formulaPv: number
  computedPv: number
  reversedMultiplier: number
  personalCashback: number
  unilevelPool: number
  directEdgePoints: number
  globalPurchaseBonus: number
  productPurchasePoints: number
  totalAllocation: number
  vatOnMemberPrice: number
}

interface ZqSpec {
  id: string | number
  skuId: string
  spec: string
  cost: number | null
  weight: number | null
  amountOnSale: number | null
  salesPrice: number | null
  image: string | null
  status: string
}

interface ZqImage {
  image: string
  isMain: boolean
}

interface ZqDetail {
  subject: string
  subjectCn: string | null
  categoryName: string | null
  sourceType: string | null
  status: string | null
  importproStatus: string | null
  shippingTo: string | null
  targetCurrency: string | null
  productUrl: string | null
  description: string | null
  createdAt: string | null
  updatedAt: string | null
  images: ZqImage[]
  specs: ZqSpec[]
}

/* ─── helpers ─────────────────────────────────────────────────────────  */

const toSafe = (v: string | number | null | undefined) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const roundTo = (v: number, d = 6) => Math.round(v * 10 ** d) / 10 ** d

const buildPricingSummary = (form: PricingForm): PricingSummary => {
  const dealer = Math.max(toSafe(form.dealer_price), 0)
  const member = Math.max(toSafe(form.member_price), 0)
  const inputPv = Math.max(toSafe(form.pv), 0)
  const mult   = Math.max(toSafe(form.reversed_pv_multiplier), 0)
  const formulaPv = roundTo(dealer * mult, 2)
  const pv = inputPv > 0 ? inputPv : formulaPv

  return {
    pricingTier: form.pv_tier === 'high_end' ? 'high_end' : 'low_end',
    effectiveMemberPrice: member,
    transferPrice: dealer,
    formulaPv,
    computedPv: pv,
    reversedMultiplier: mult,
    personalCashback:      pv * PERSONAL_CASHBACK_RATE,
    unilevelPool:          pv * UNILEVEL_POOL_RATE,
    directEdgePoints:      pv * DIRECT_EDGE_POINTS_RATE,
    globalPurchaseBonus:   pv * GLOBAL_PURCHASE_BONUS_RATE,
    productPurchasePoints: pv * PRODUCT_PURCHASE_POINTS_RATE,
    totalAllocation:       pv,
    vatOnMemberPrice:      member * VAT_RATE,
  }
}

const centsToPhp = (cents: number | null | undefined) =>
  cents != null ? (cents / 100).toFixed(2) : ''

const phpToCents = (value: string): number | null => {
  const parsed = parseFloat(value)
  if (Number.isNaN(parsed) || parsed < 0) return null
  return Math.round(parsed * 100)
}

const formatCents = (cents: number | null | undefined) => {
  if (cents == null) return '—'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(cents / 100)
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const num = (v: unknown): number | null => (typeof v === 'number' ? v : null)

function parseDetail(raw: Record<string, unknown>): ZqDetail {
  const rawImages = Array.isArray(raw.images) ? raw.images : []
  const images: ZqImage[] = rawImages
    .filter((img): img is Record<string, unknown> => !!img && typeof img === 'object')
    .map((img) => ({ image: str(img.image), isMain: img.isMain === true }))

  const rawSpecs = Array.isArray(raw.specs) ? raw.specs : []
  const specs: ZqSpec[] = rawSpecs
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
    .map((s) => ({
      id:          str(s.id) || str(s.specId),
      skuId:       str(s.skuId),
      spec:        str(s.spec),
      cost:        num(s.cost),
      weight:      num(s.weight),
      amountOnSale: num(s.amountOnSale),
      salesPrice:  num(s.salesPrice),
      image:       str(s.image) || null,
      status:      str(s.status),
    }))

  return {
    subject:        str(raw.subject),
    subjectCn:      str(raw.subjectCn) || null,
    categoryName:   str(raw.categoryName) || null,
    sourceType:     str(raw.sourceType) || null,
    status:         str(raw.status) || null,
    importproStatus: str(raw.importproStatus) || null,
    shippingTo:     str(raw.shippingTo) || null,
    targetCurrency: str(raw.targetCurrency) || null,
    productUrl:     str(raw.productUrl) || null,
    description:    str(raw.description) || null,
    createdAt:      str(raw.createdAt) || null,
    updatedAt:      str(raw.updatedAt) || null,
    images,
    specs,
  }
}

const inputCls = (disabled = false) => [
  'w-full rounded-2xl border px-4 py-3 text-sm shadow-sm transition-all duration-200',
  'focus:outline-none focus:ring-2',
  disabled
    ? 'border-slate-200 bg-slate-100/70 text-slate-500 cursor-not-allowed select-none'
    : 'bg-slate-50/85 border-slate-200 text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:bg-white focus:ring-blue-500/20 hover:border-slate-300',
].join(' ')

const variantInputCls = (disabled = false) => [
  'w-full rounded-xl border px-2 py-1.5 text-xs shadow-sm transition-all',
  'focus:outline-none focus:ring-1',
  disabled
    ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
    : 'bg-white border-slate-200 text-slate-700 placeholder-slate-300 focus:border-sky-400 focus:ring-sky-500/20 hover:border-slate-300',
].join(' ')

/* ─── component ───────────────────────────────────────────────────────  */

export default function EditZqPricingModal({ product, onClose, onSaved }: Props) {
  const [form, setForm] = useState<PricingForm>({
    dealer_price: '', member_price: '', pv: '', pv_tier: 'low_end', reversed_pv_multiplier: '',
  })
  const [variantPricing, setVariantPricing] = useState<Record<string, VariantPricingFields>>({})
  const [detail,         setDetail]         = useState<ZqDetail | null>(null)
  const [selectedImage,  setSelectedImage]  = useState<string | null>(null)

  const [updatePricing,       { isLoading: isSavingProduct }]  = useUpdateZqProductPricingMutation()
  const [updateVariantPricing, { isLoading: isSavingVariants }] = useUpdateZqVariantPricingMutation()
  const [fetchDetail,         { isLoading: isFetchingDetail }] = useFetchZqImportDetailMutation()
  const [fetchVariantPricing]                                  = useLazyGetZqVariantPricingQuery()

  const isSaving = isSavingProduct || isSavingVariants

  useEffect(() => {
    if (product) {
      setForm({
        dealer_price:           centsToPhp(product.dealerPrice),
        member_price:           centsToPhp(product.memberPrice),
        pv:                     product.pv                   != null ? String(product.pv)                   : '',
        pv_tier:                product.pvTier               ?? 'low_end',
        reversed_pv_multiplier: product.reversedPvMultiplier != null ? String(product.reversedPvMultiplier) : '',
      })
      setDetail(null)
      setSelectedImage(null)
      setVariantPricing({})

      /* fetch ZQ API detail */
      fetchDetail(product.externalId)
        .unwrap()
        .then((res) => {
          const zqRoot = (res.zq ?? {}) as Record<string, unknown>
          const raw    = (zqRoot.data ?? zqRoot) as Record<string, unknown>
          const parsed = parseDetail(raw)
          setDetail(parsed)
          const main = parsed.images.find((img) => img.isMain) ?? parsed.images[0]
          setSelectedImage(main?.image ?? null)
        })
        .catch(() => {})

      /* fetch saved variant pricing */
      fetchVariantPricing(product.externalId)
        .unwrap()
        .then((res) => {
          const map: Record<string, VariantPricingFields> = {}
          for (const row of res.variants) {
            map[row.skuId] = {
              dealer_price: row.dealerPrice != null ? String(row.dealerPrice / 100) : '',
              member_price: row.memberPrice != null ? String(row.memberPrice / 100) : '',
              pv:           row.pv          != null ? String(row.pv)                : '',
            }
          }
          setVariantPricing(map)
        })
        .catch(() => {})
    } else {
      setForm({ dealer_price: '', member_price: '', pv: '', pv_tier: 'low_end', reversed_pv_multiplier: '' })
      setVariantPricing({})
      setDetail(null)
      setSelectedImage(null)
    }
  }, [product?.externalId])

  const set = (field: keyof PricingForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const setVariantField = (skuId: string, field: keyof VariantPricingFields, value: string) =>
    setVariantPricing((prev) => ({
      ...prev,
      [skuId]: { ...{ dealer_price: '', member_price: '', pv: '' }, ...prev[skuId], [field]: value },
    }))

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (!product) return
    try {
      await updatePricing({
        externalId:             product.externalId,
        dealer_price:           phpToCents(form.dealer_price),
        member_price:           phpToCents(form.member_price),
        pv:                     form.pv !== '' ? parseFloat(form.pv) : null,
        pv_tier:                form.pv_tier,
        reversed_pv_multiplier: form.reversed_pv_multiplier !== '' ? parseFloat(form.reversed_pv_multiplier) : null,
      }).unwrap()

      /* save variant pricing — only rows with at least one value */
      const variantRows = Object.entries(variantPricing)
        .filter(([, v]) => v.dealer_price !== '' || v.member_price !== '' || v.pv !== '')
        .map(([skuId, v]) => ({
          skuId,
          dealer_price: phpToCents(v.dealer_price),
          member_price: phpToCents(v.member_price),
          pv:           v.pv !== '' ? parseFloat(v.pv) : null,
        }))

      if (variantRows.length > 0) {
        await updateVariantPricing({ externalId: product.externalId, variants: variantRows }).unwrap()
      }

      showSuccessToast('Pricing updated successfully.')
      onSaved?.()
      onClose()
    } catch (err) {
      const error = err as { data?: { message?: string } }
      showErrorToast(error?.data?.message ?? 'Failed to update pricing.')
    }
  }

  const summary      = buildPricingSummary(form)
  const showSummary  = summary.computedPv > 0 || summary.effectiveMemberPrice > 0 || summary.transferPrice > 0
  const displayImages = detail?.images ?? (product?.primaryImage ? [{ image: product.primaryImage, isMain: true }] : [])
  const displaySubject = detail?.subject || product?.subject || ''
  const mult = Math.max(toSafe(form.reversed_pv_multiplier), 0)

  return (
    <AnimatePresence>
      {product ? (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-md"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_32px_100px_-36px_rgba(15,23,42,0.55)] dark:border-slate-800 dark:bg-slate-950"
            >
              {/* ── Header ── */}
              <div className="shrink-0 border-b border-slate-200/80 bg-gradient-to-r from-sky-50 via-white to-cyan-50 px-4 py-4 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-sky-950/30 sm:px-6 sm:py-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-lg shadow-sky-500/30">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-300">Global Supplier Workspace</p>
                      <h2 className="mt-1 text-lg font-bold leading-none text-slate-900 dark:text-slate-100">Edit Product Pricing</h2>
                      <p className="mt-1 max-w-xl truncate text-xs text-slate-500 dark:text-slate-400">
                        ID {product.externalId} · {displaySubject}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={onClose} disabled={isSaving}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* ── Scrollable body ── */}
              <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">

                  {isFetchingDetail && (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                      ))}
                    </div>
                  )}

                  {!isFetchingDetail && (
                    <>
                      {/* ── Images ── */}
                      {displayImages.length > 0 && (
                        <>
                          <SectionLabel>Product Images</SectionLabel>
                          <div className="flex gap-3">
                            <div className="h-52 w-52 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                              {selectedImage
                                ? <img src={selectedImage} alt={displaySubject} className="h-full w-full object-cover" />
                                : <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No image</div>}
                            </div>
                            <div className="flex flex-wrap gap-2 content-start">
                              {displayImages.map((img, idx) => (
                                <button key={idx} type="button" onClick={() => setSelectedImage(img.image)}
                                  className={['relative h-16 w-16 overflow-hidden rounded-xl border-2 transition', selectedImage === img.image ? 'border-sky-400 ring-2 ring-sky-200' : 'border-slate-200 hover:border-slate-300'].join(' ')}>
                                  <img src={img.image} alt="" className="h-full w-full object-cover" />
                                  {img.isMain && (
                                    <span className="absolute bottom-0 left-0 right-0 bg-sky-500/80 py-0.5 text-center text-[9px] font-bold uppercase text-white">Main</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* ── Product Info ── */}
                      <SectionLabel>Product Information</SectionLabel>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <Field label="Product Name" span="col-span-2 sm:col-span-3">
                          <input disabled readOnly value={detail?.subject || product.subject} className={inputCls(true)} />
                        </Field>
                        {detail?.subjectCn ? (
                          <Field label="Chinese Name" span="col-span-2 sm:col-span-3">
                            <input disabled readOnly value={detail.subjectCn} className={inputCls(true)} />
                          </Field>
                        ) : null}
                        <Field label="External ID">
                          <input disabled readOnly value={product.externalId} className={`${inputCls(true)} font-mono text-xs`} />
                        </Field>
                        <Field label="Source">
                          <input disabled readOnly value={detail?.sourceType ?? product.sourceType ?? '—'} className={inputCls(true)} />
                        </Field>
                        <Field label="Category">
                          <input disabled readOnly value={detail?.categoryName ?? product.categoryName ?? '—'} className={inputCls(true)} />
                        </Field>
                        <Field label="Status">
                          <input disabled readOnly value={detail?.status ?? product.status ?? '—'} className={inputCls(true)} />
                        </Field>
                        <Field label="Import Status">
                          <input disabled readOnly value={detail?.importproStatus ?? product.importStatus ?? '—'} className={inputCls(true)} />
                        </Field>
                        <Field label="Shipping To">
                          <input disabled readOnly value={detail?.shippingTo ?? product.shippingTo ?? '—'} className={inputCls(true)} />
                        </Field>
                        <Field label="Target Currency">
                          <input disabled readOnly value={detail?.targetCurrency ?? product.targetCurrency ?? '—'} className={inputCls(true)} />
                        </Field>
                        <Field label="Total Stock">
                          <input disabled readOnly value={String(product.totalStock ?? 0)} className={inputCls(true)} />
                        </Field>
                        <Field label="Variants">
                          <input disabled readOnly value={String(product.variantCount ?? 0)} className={inputCls(true)} />
                        </Field>
                        <Field label="Created">
                          <input disabled readOnly value={formatDate(detail?.createdAt ?? product.sourceCreatedAt)} className={inputCls(true)} />
                        </Field>
                        <Field label="Last Synced">
                          <input disabled readOnly value={formatDate(product.syncedAt)} className={inputCls(true)} />
                        </Field>
                        {detail?.productUrl ? (
                          <Field label="Product URL" span="col-span-2 sm:col-span-3">
                            <input disabled readOnly value={detail.productUrl} className={`${inputCls(true)} text-xs`} />
                          </Field>
                        ) : null}
                      </div>

                      {/* ── Product-level Pricing ── */}
                      <SectionLabel>Product Pricing (Default)</SectionLabel>
                      <p className="text-[11px] text-slate-400">Applied to the product as a whole. Variant-specific overrides can be set below.</p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <Field label="PV Pricing Tier">
                          <div className="space-y-1">
                            <select value={form.pv_tier} onChange={(e) => set('pv_tier', e.target.value)} className={inputCls()}>
                              {PRICING_TIER_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <p className="text-[11px] text-slate-500">Low-End is active for the current formula.</p>
                          </div>
                        </Field>
                        <Field label="Member Price (₱)">
                          <div className="space-y-1">
                            <input type="number" min="0" step="0.01" value={form.member_price} onChange={(e) => set('member_price', e.target.value)} placeholder="0.00" className={inputCls()} />
                            <p className="text-[11px] text-slate-500">Shown to member accounts.</p>
                          </div>
                        </Field>
                        <Field label="Dealer Price (₱)">
                          <div className="space-y-1">
                            <input type="number" min="0" step="0.01" value={form.dealer_price} onChange={(e) => set('dealer_price', e.target.value)} placeholder="0.00" className={inputCls()} />
                            <p className="text-[11px] text-slate-500">Also used as Transfer Price for PV formula.</p>
                          </div>
                        </Field>
                        <Field label="PV Product">
                          <div className="space-y-1">
                            <input type="number" min="0" step="0.01" value={form.pv} onChange={(e) => set('pv', e.target.value)} placeholder="0.00" className={inputCls()} />
                            <p className="text-[11px] text-slate-500">Leave blank to use auto-computed PV.</p>
                          </div>
                        </Field>
                        <Field label="Reversed PV Multiplier">
                          <div className="space-y-1">
                            <input type="number" min="0" step="0.0001" value={form.reversed_pv_multiplier} onChange={(e) => set('reversed_pv_multiplier', e.target.value)} placeholder="e.g. 0.3" className={inputCls()} />
                            <p className="text-[11px] text-slate-500">Formula: PV = Dealer Price × Multiplier.</p>
                          </div>
                        </Field>
                      </div>

                      {/* ── Variant Pricing ── */}
                      {detail && detail.specs.length > 0 && (
                        <>
                          <SectionLabel>Variant Pricing</SectionLabel>
                          <p className="text-[11px] text-slate-400">Set individual pricing per variant. Leave blank to inherit the product-level pricing above. Auto PV = Dealer Price × Multiplier ({mult > 0 ? mult.toFixed(4) : '—'}).</p>
                          <div className="overflow-hidden rounded-2xl border border-slate-200">
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-xs">
                                <thead className="bg-slate-50">
                                  <tr className="border-b border-slate-200">
                                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Image</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Spec</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">SKU ID</th>
                                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">ZQ Cost</th>
                                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">ZQ Price</th>
                                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">Stock</th>
                                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 bg-emerald-50/60">Member (₱)</th>
                                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 bg-emerald-50/60">Dealer (₱)</th>
                                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 bg-emerald-50/60">PV</th>
                                    <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-teal-600 bg-teal-50/60">Auto PV</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                  {detail.specs.map((spec) => {
                                    const vp = variantPricing[spec.skuId]
                                    const variantDealer = parseFloat(vp?.dealer_price || '')
                                    const effectiveDealer = Number.isFinite(variantDealer) && variantDealer > 0
                                      ? variantDealer
                                      : toSafe(form.dealer_price)
                                    const autoPv = mult > 0 ? roundTo(effectiveDealer * mult, 2) : 0
                                    const hasVariantPricing = vp && (vp.dealer_price !== '' || vp.member_price !== '' || vp.pv !== '')

                                    return (
                                      <tr key={spec.skuId || String(spec.id)} className={hasVariantPricing ? 'bg-emerald-50/30' : 'hover:bg-slate-50/60'}>
                                        <td className="px-3 py-2.5">
                                          {spec.image
                                            ? <img src={spec.image} alt={spec.spec} className="h-9 w-9 rounded-xl border border-slate-200 object-cover" />
                                            : <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-[10px] text-slate-400">—</div>}
                                        </td>
                                        <td className="px-3 py-2.5 font-medium text-slate-800 max-w-[120px]">
                                          <span className="line-clamp-2">{spec.spec || '—'}</span>
                                        </td>
                                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">{spec.skuId || '—'}</td>
                                        <td className="px-3 py-2.5 text-right text-slate-600 whitespace-nowrap">{formatCents(spec.cost)}</td>
                                        <td className="px-3 py-2.5 text-right font-semibold text-slate-800 whitespace-nowrap">{formatCents(spec.salesPrice)}</td>
                                        <td className="px-3 py-2.5 text-right text-slate-600">{spec.amountOnSale ?? '—'}</td>
                                        {/* editable pricing */}
                                        <td className="px-2 py-2 bg-emerald-50/40 min-w-[90px]">
                                          <input type="number" min="0" step="0.01" placeholder="inherit"
                                            value={vp?.member_price ?? ''}
                                            onChange={(e) => setVariantField(spec.skuId, 'member_price', e.target.value)}
                                            className={variantInputCls()} />
                                        </td>
                                        <td className="px-2 py-2 bg-emerald-50/40 min-w-[90px]">
                                          <input type="number" min="0" step="0.01" placeholder="inherit"
                                            value={vp?.dealer_price ?? ''}
                                            onChange={(e) => setVariantField(spec.skuId, 'dealer_price', e.target.value)}
                                            className={variantInputCls()} />
                                        </td>
                                        <td className="px-2 py-2 bg-emerald-50/40 min-w-[80px]">
                                          <input type="number" min="0" step="0.01" placeholder="auto"
                                            value={vp?.pv ?? ''}
                                            onChange={(e) => setVariantField(spec.skuId, 'pv', e.target.value)}
                                            className={variantInputCls()} />
                                        </td>
                                        <td className="px-3 py-2.5 text-center bg-teal-50/40">
                                          {mult > 0 ? (
                                            <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700">
                                              {autoPv.toFixed(2)}
                                            </span>
                                          ) : (
                                            <span className="text-slate-300">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
                              <p className="text-[11px] text-slate-400">
                                <span className="font-semibold text-emerald-600">Green columns</span> are editable. Leave blank to inherit product-level pricing.
                              </p>
                            </div>
                          </div>
                        </>
                      )}

                      {/* ── PV Summary ── */}
                      {showSummary && <PricingSummaryPanel summary={summary} />}
                    </>
                  )}

                </div>

                {/* ── Footer ── */}
                <div className="shrink-0 flex items-center justify-end border-t border-slate-200/80 bg-slate-50/60 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50 sm:px-6">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={onClose} disabled={isSaving}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSaving || isFetchingDetail}
                      className="flex items-center gap-2 rounded-2xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-500/30 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300">
                      {isSaving ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Saving…
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

/* ─── sub-components ─────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 pt-2">
      <div className="h-4 w-0.5 shrink-0 rounded-full bg-sky-400" />
      <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{children}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-100 to-transparent" />
    </div>
  )
}

function Field({ label, required, children, span }: { label: string; required?: boolean; children: React.ReactNode; span?: string }) {
  return (
    <div className={`space-y-2 ${span ?? ''}`}>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

function CalcRow({ label, a, op, b, result, resultAccent }: {
  label: string; a: string; op: '×' | '−'; b: string; result: string; resultAccent?: 'teal' | 'emerald' | 'rose'
}) {
  const rc = resultAccent === 'teal' ? 'text-teal-600' : resultAccent === 'emerald' ? 'text-emerald-600' : resultAccent === 'rose' ? 'text-rose-500' : 'text-slate-800'
  return (
    <div className="flex items-center justify-between px-3 py-2.5 gap-2">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-500">{label}</p>
        <div className="flex items-center gap-1 mt-0.5 font-mono text-[11px] text-slate-400 flex-wrap">
          <span>{a}</span><span className="text-slate-300">{op}</span>
          <span>{b}</span><span className="text-slate-300">=</span>
          <span className={`font-bold ${rc}`}>{result}</span>
        </div>
      </div>
      <span className={`shrink-0 text-sm font-bold tabular-nums ${rc}`}>{result}</span>
    </div>
  )
}

function PricingSummaryPanel({ summary }: { summary: PricingSummary }) {
  const fmt    = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtPv  = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 4 })
  const pvStr  = fmtPv(summary.computedPv)
  const mp     = fmt(summary.effectiveMemberPrice)
  const transfer = fmt(summary.transferPrice)
  const mult   = summary.reversedMultiplier.toFixed(4)
  const pricingTierLabel = summary.pricingTier === 'high_end' ? 'High-End' : 'Low-End'

  const allocationRows: { label: string; rate: string; value: number; unit: 'currency' | 'points'; note: string }[] = [
    { label: 'Cashback / e-GC',        rate: '4%',    value: summary.personalCashback,      unit: 'currency', note: 'Credited from delivered personal purchase PV.' },
    { label: 'Unilevel Pool',           rate: '6%',    value: summary.unilevelPool,          unit: 'currency', note: 'Total pool split across 10 levels at 0.6% per level.' },
    { label: '50K Points Reward',       rate: '2.9%',  value: summary.directEdgePoints,      unit: 'points',   note: 'Direct-edge progress allocation toward the 50,000 points reward.' },
    { label: 'Global Purchase Bonus',   rate: '1%',    value: summary.globalPurchaseBonus,   unit: 'points',   note: 'Year-end global pool allocation.' },
    { label: 'Product Purchase Points', rate: '86.1%', value: summary.productPurchasePoints, unit: 'points',   note: 'Remaining product points after bonus allocations.' },
  ]
  const fmtAlloc = (v: number, unit: 'currency' | 'points') =>
    unit === 'currency' ? `₱ ${fmt(v)}` : `${fmt(v)} pts`

  return (
    <div className="rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-white/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-white">PV Summary</span>
          <span className="text-xs text-blue-200">— live computation (product level)</span>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-200">Member Price</p>
          <p className="text-base font-bold text-white leading-none mt-0.5">
            {summary.effectiveMemberPrice > 0 ? `₱ ${mp}` : <span className="text-blue-300 text-xs italic">—</span>}
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-50 to-blue-50/60 divide-y divide-slate-100">
        <div className="px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">PV Computation</p>
          <div className="rounded-xl bg-white border border-teal-100 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Transfer Price × Reversed PV Multiplier = PV Product</p>
                <div className="flex items-center gap-2 font-mono text-base flex-wrap">
                  <span className="font-semibold text-slate-700">{transfer}</span>
                  <span className="text-slate-300 text-lg">×</span>
                  <span className="font-semibold text-slate-700">{mult}</span>
                  <span className="text-slate-300 text-lg">=</span>
                  <span className="font-bold text-teal-600 text-lg">{fmtPv(summary.formulaPv)} PV</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Encoded PV used in summary: <span className="font-semibold text-slate-600">{pvStr} PV</span></p>
              </div>
              <div className="shrink-0 text-right bg-teal-50 rounded-lg px-3 py-2 border border-teal-100">
                <p className="text-[11px] font-semibold text-teal-500 uppercase tracking-wide">Auto PV</p>
                <p className="text-2xl font-bold text-teal-700 leading-none mt-0.5">{pvStr}</p>
                <p className="text-[11px] text-teal-400">PV units</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Price Breakdown</p>
          <div className="rounded-xl bg-white border border-slate-100 overflow-hidden divide-y divide-slate-100">
            <CalcRow label="VAT (12% of Member Price)"
              a={`₱${mp}`} op="×" b="12%" result={`₱ ${fmt(summary.vatOnMemberPrice)}`} />
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">PV Allocation Preview</p>
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">100% of PV</span>
          </div>
          <div className="rounded-xl bg-white border border-slate-100 overflow-hidden divide-y divide-slate-100">
            {allocationRows.map(({ label, rate, value, unit, note }) => (
              <div key={label} className="flex items-center justify-between px-3 py-2 gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-blue-500">{rate}</span>
                    <span className="text-sm font-semibold text-slate-600 truncate">{label}</span>
                  </div>
                  <p className="font-mono text-xs text-slate-400 mt-0.5">
                    {pvStr} PV <span className="text-slate-300">×</span> {rate} <span className="text-slate-300">=</span> <span className="font-semibold text-slate-600">{fmtAlloc(value, unit)}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">{note}</p>
                </div>
                <span className="shrink-0 text-base font-bold text-slate-800 tabular-nums">{fmtAlloc(value, unit)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2.5 bg-blue-600">
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded-full bg-white/20 px-1.5 py-0.5 text-[11px] font-bold text-white">100%</span>
                <div>
                  <p className="text-sm font-semibold text-white">Total PV Allocation</p>
                  <p className="font-mono text-xs text-blue-200">All rows derived from {pvStr} PV</p>
                </div>
              </div>
              <span className="text-lg font-bold text-white tabular-nums">{fmtPv(summary.totalAllocation)} PV</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-3">
          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            {pricingTierLabel} pricing shown for costing reference only. Actual bonus payout depends on qualification rules.
          </p>
        </div>
      </div>
    </div>
  )
}
