'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useGetAdminMeQuery } from '@/store/api/authApi'
import { Product, ProductVariant, useUpdateProductMutation, CreateProductPayload } from '@/store/api/productsApi'
import { useGetCategoriesQuery } from '@/store/api/categoriesApi'
import { useGetProductBrandsQuery } from '@/store/api/productBrandsApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import RichTextEditor from '@/components/ui/RichTextEditor'
import ProductDescriptionGenerator from '@/components/superAdmin/products/ProductDescriptionGenerator'
import ImagePositionEditorModal from '@/components/superAdmin/products/ImagePositionEditorModal'
import { colorNameToHex, hexToColorName } from '@/libs/colorUtils'
import { ROOM_OPTIONS, inferRoomTypeFromCategory } from '@/libs/roomConfig'

/* ─── types ──────────────────────────────────────────────── */

interface EditProductModalProps {
  product: Product | null
  onClose: () => void
  onSaved?: (updatedProduct?: Product) => void
}

interface FormState {
  pd_name: string
  pd_catid: string
  pd_room_type: string
  pd_brand_type: string
  pd_description: string
  pd_price_srp: string
  pd_price_dp: string
  pd_price_member: string
  pd_prodpv: string
  pd_qty: string
  pd_weight: string
  pd_psweight: string
  pd_pswidth: string
  pd_pslenght: string
  pd_psheight: string
  pd_material: string
  pd_warranty: string
  pd_assembly_required: boolean
  pd_parent_sku: string
  pd_type: string
  pd_musthave: boolean
  pd_bestseller: boolean
  pd_salespromo: boolean
  pd_verified: boolean
  pd_status: string
}

interface VariantColor {
  name: string
  hex: string
}

interface VariantFormState {
  id?: number
  pv_name: string
  pv_sku: string
  pv_colors: VariantColor[]
  pv_size: string
  pv_width: string
  pv_dimension: string
  pv_height: string
  pv_price_srp: string
  pv_price_dp: string
  pv_price_member: string
  pv_prodpv: string
  pv_qty: string
  pv_status: string
  pv_images: string[]
}

interface EditProductDraft {
  version: 1
  productId: number
  form: FormState
  variants: VariantFormState[]
  imageUrls: string[]
  roomTouched: boolean
}

type Errors = Partial<Record<keyof FormState, string>>

/* ─── constants ──────────────────────────────────────────── */

const FLAG_CARDS: {
  key: 'pd_musthave' | 'pd_bestseller' | 'pd_salespromo' | 'pd_verified'
  label: string
  desc: string
  activeCard: string
  activeIcon: string
  icon: React.ReactNode
}[] = [
  {
    key: 'pd_musthave', label: 'Must Have', desc: 'Mark as an essential pick',
    activeCard: 'border-amber-300 bg-amber-50 ring-2 ring-amber-200',
    activeIcon: 'bg-amber-100 text-amber-600',
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>,
  },
  {
    key: 'pd_bestseller', label: 'Bestseller', desc: 'Mark as top-selling',
    activeCard: 'border-purple-300 bg-purple-50 ring-2 ring-purple-200',
    activeIcon: 'bg-purple-100 text-purple-600',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
  },
  {
    key: 'pd_salespromo', label: 'On Sale', desc: 'Show as a promotion',
    activeCard: 'border-rose-300 bg-rose-50 ring-2 ring-rose-200',
    activeIcon: 'bg-rose-100 text-rose-600',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>,
  },
  {
    key: 'pd_verified', label: 'Verified', desc: 'Mark as verified product',
    activeCard: 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200',
    activeIcon: 'bg-emerald-100 text-emerald-600',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  },
]

const WARRANTY_OPTIONS = [
  'No Warranty',
  '15 Days Warranty',
  '1 Month Warranty',
  '2 Months Warranty',
  '3 Months Warranty',
  '6 Months Warranty',
  '9 Months Warranty',
  '1 Year Warranty',
] as const

const getEditProductDraftKey = (productId: number) => `afhome:edit-product-draft:${productId}`

/* ─── helpers ────────────────────────────────────────────── */

const emptyVariant = (): VariantFormState => ({
  pv_name: '', pv_sku: '', pv_colors: [], pv_size: '', pv_width: '', pv_dimension: '', pv_height: '',
  pv_price_srp: '', pv_price_dp: '', pv_price_member: '', pv_prodpv: '', pv_qty: '',
  pv_status: '1', pv_images: [],
})

const toOptionalPositiveNumber = (value: string | number | null | undefined) => {
  if (value == null) return undefined
  const trimmed = String(value).trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const mapVariantToForm = (variant: ProductVariant): VariantFormState => ({
  id: variant.id,
  pv_name: variant.name ?? '',
  pv_sku: variant.sku ?? '',
  pv_colors: variant.colorHex
    ? [{ name: variant.color ?? variant.colorHex, hex: variant.colorHex }]
    : variant.color
      ? [{ name: variant.color, hex: '#94a3b8' }]
      : [],
  pv_size: variant.size ?? '',
  pv_width: toOptionalPositiveNumber(variant.width)?.toString() ?? '',
  pv_dimension: toOptionalPositiveNumber(variant.dimension)?.toString() ?? '',
  pv_height: toOptionalPositiveNumber(variant.height)?.toString() ?? '',
  pv_price_srp: toOptionalPositiveNumber(variant.priceSrp)?.toString() ?? '',
  pv_price_dp:  toOptionalPositiveNumber(variant.priceDp)?.toString() ?? '',
  pv_price_member: toOptionalPositiveNumber(variant.priceMember)?.toString() ?? '',
  pv_prodpv:   toOptionalPositiveNumber(variant.prodpv)?.toString() ?? '',
  pv_qty:       variant.qty      != null ? String(variant.qty)      : '',
  pv_status: String(variant.status ?? 1),
  pv_images: Array.isArray(variant.images) ? variant.images.filter(Boolean) : [],
})

const getNormalizedColorSignature = (color?: string, colorHex?: string) => {
  const normalizedName = normalizeVariantLabel(color ?? '').toLowerCase()
  const normalizedHex = (colorHex ?? '').trim().toLowerCase()
  return `${normalizedName}|${normalizedHex}`
}

const generateSkuFromName = (name: string, productId?: number) => {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '')
  if (!letters) return ''
  const vowels = new Set(['A', 'E', 'I', 'O', 'U'])
  const consonants = letters.split('').filter(ch => !vowels.has(ch))
  const vowelChars = letters.split('').filter(ch => vowels.has(ch))
  const prefix = [
    consonants[0] ?? letters[0] ?? 'P',
    consonants[1] ?? letters[1] ?? 'R',
    consonants[2] ?? letters[2] ?? 'D',
    vowelChars[0] ?? letters[3] ?? 'X',
  ].join('')
  const suffix = productId
    ? String(productId).padStart(5, '0').slice(-5)
    : Date.now().toString().slice(-5)
  return `${prefix}-${suffix}`
}

const buildVariantSku = (baseSku: string, index: number) => {
  const base = baseSku.trim()
  const seq  = String(index + 1).padStart(2, '0')
  return base ? `${base}-V${seq}` : `VAR-V${seq}`
}

const normalizeSkuSegment = (value: string) => {
  const cleaned = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return cleaned || 'COLOR'
}

const buildVariantColorSku = (baseSku: string, colorName: string, colorIndex: number, totalColors: number) => {
  if (totalColors <= 1) return baseSku
  return `${baseSku}-${normalizeSkuSegment(colorName || `COLOR-${colorIndex + 1}`)}`
}

const stripVariantColorSuffix = (sku: string | undefined, colorName: string | undefined) => {
  const normalizedSku = (sku ?? '').trim()
  const normalizedColorSegment = normalizeSkuSegment(colorName ?? '')

  if (!normalizedSku || !normalizedColorSegment) {
    return normalizedSku
  }

  const suffix = `-${normalizedColorSegment}`
  return normalizedSku.toUpperCase().endsWith(suffix)
    ? normalizedSku.slice(0, -suffix.length)
    : normalizedSku
}

const normalizeNumberField = (value: string) => {
  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : null
}

const normalizeTextField = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const normalizeVariantLabel = (value: string) => value.trim().replace(/\s+/g, ' ')

const getVariantFormKey = (variant: VariantFormState) => {
  const normalizedColors = variant.pv_colors
    .map((color) => `${normalizeVariantLabel(color.name).toLowerCase()}|${color.hex.trim().toLowerCase()}`)
    .sort()
    .join(',')

  return [
    variant.id ?? '',
    variant.pv_sku.trim().toLowerCase(),
    normalizeVariantLabel(variant.pv_name).toLowerCase(),
    normalizeVariantLabel(variant.pv_size).toLowerCase(),
    variant.pv_width.trim(),
    variant.pv_dimension.trim(),
    variant.pv_height.trim(),
    normalizedColors,
    variant.pv_price_srp.trim(),
    variant.pv_price_dp.trim(),
    variant.pv_price_member.trim(),
    variant.pv_prodpv.trim(),
    variant.pv_qty.trim(),
    variant.pv_status.trim(),
    variant.pv_images.filter(Boolean).join('|'),
  ].join('::')
}

const getVariantCoreGroupKey = (variant: ProductVariant) => {
  const images = Array.isArray(variant.images) ? variant.images.filter(Boolean).join('|') : ''

  return [
    normalizeVariantLabel(variant.name ?? '').toLowerCase(),
    normalizeVariantLabel(variant.size ?? '').toLowerCase(),
    variant.width ?? '',
    variant.dimension ?? '',
    variant.height ?? '',
    variant.priceSrp ?? '',
    variant.priceDp ?? '',
    variant.priceMember ?? '',
    variant.prodpv ?? '',
    variant.qty ?? '',
    variant.status ?? 1,
    images,
  ].join('::')
}

const mapProductVariantsToFormStates = (productVariants: ProductVariant[]) => {
  const groupedSkuCounts = productVariants.reduce((map, variant) => {
    const groupKey = `${getVariantCoreGroupKey(variant)}::${stripVariantColorSuffix(variant.sku, variant.color)}`
    map.set(groupKey, (map.get(groupKey) ?? 0) + 1)
    return map
  }, new Map<string, number>())

  const groupedVariants = productVariants.reduce((map, variant) => {
    const coreKey = getVariantCoreGroupKey(variant)
    const strippedSku = stripVariantColorSuffix(variant.sku, variant.color)
    const candidateKey = `${coreKey}::${strippedSku}`
    const resolvedSku = (groupedSkuCounts.get(candidateKey) ?? 0) > 1
      ? strippedSku
      : (variant.sku ?? '').trim()
    const groupKey = `${coreKey}::${resolvedSku}`

    const current = map.get(groupKey)
    const nextColor =
      variant.colorHex || variant.color
        ? [{
            name: variant.color ?? variant.colorHex ?? '',
            hex: variant.colorHex || colorNameToHex(variant.color ?? '') || '#94a3b8',
          }]
        : []

    if (!current) {
      map.set(groupKey, {
        ...mapVariantToForm(variant),
        pv_sku: resolvedSku,
        pv_colors: nextColor,
      })
      return map
    }

    const mergedImages = Array.from(new Set([...current.pv_images, ...(Array.isArray(variant.images) ? variant.images.filter(Boolean) : [])]))
    const mergedColors = [...current.pv_colors]

    nextColor.forEach((color) => {
      const signature = getNormalizedColorSignature(color.name, color.hex)
      const alreadyExists = mergedColors.some((existingColor) => getNormalizedColorSignature(existingColor.name, existingColor.hex) === signature)
      if (!alreadyExists) {
        mergedColors.push(color)
      }
    })

    map.set(groupKey, {
      ...current,
      pv_images: mergedImages,
      pv_colors: mergedColors,
    })
    return map
  }, new Map<string, VariantFormState>())

  return Array.from(groupedVariants.values())
}

const dedupeVariantFormStates = (variants: VariantFormState[]) =>
  Array.from(
    variants.reduce((map, variant) => {
      const key = getVariantFormKey(variant)
      if (!map.has(key)) {
        map.set(key, variant)
      }
      return map
    }, new Map<string, VariantFormState>()).values(),
  )

const moveItem = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items
  }

  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

const getRequestErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof TypeError) {
    return 'Unable to reach the admin upload/product service. Check if the frontend server, backend API, or Cloudinary upload route is available.'
  }

  const data = (err as { data?: { message?: string; errors?: Record<string, string[] | string> } })?.data
  const firstFieldErrors = data?.errors
    ? Object.values(data.errors)
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    : []

  return firstFieldErrors[0] ?? data?.message ?? fallback
}

const getUploadErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof TypeError) {
    return 'Upload service is unreachable right now. Check the frontend server and Cloudinary configuration, then try again.'
  }

  return (err as Error)?.message ?? fallback
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const hasEditDraftContent = (
  currentForm: FormState,
  initialForm: FormState | null,
  currentVariants: VariantFormState[],
  initialVariants: VariantFormState[],
  currentImageUrls: string[],
  initialImageUrls: string[],
  roomTouched: boolean,
) => {
  const formChanged =
    initialForm !== null &&
    JSON.stringify(normalizeFormForComparison(currentForm)) !== JSON.stringify(normalizeFormForComparison(initialForm))
  const variantsChanged =
    JSON.stringify(normalizeVariantsForComparison(currentVariants)) !== JSON.stringify(normalizeVariantsForComparison(initialVariants))
  const imageUrlsChanged =
    currentImageUrls.length !== initialImageUrls.length ||
    currentImageUrls.some((url, index) => url !== initialImageUrls[index])

  return formChanged || variantsChanged || imageUrlsChanged || roomTouched
}

const normalizeFormForComparison = (form: FormState) => ({
  pd_name: form.pd_name.trim(),
  pd_catid: Number(form.pd_catid),
  pd_room_type: form.pd_room_type.trim() ? Number(form.pd_room_type) : null,
  pd_brand_type: form.pd_brand_type.trim() ? Number(form.pd_brand_type) : null,
  pd_description: normalizeTextField(form.pd_description),
  pd_price_srp: Number(form.pd_price_srp),
  pd_price_dp: normalizeNumberField(form.pd_price_dp),
  pd_price_member: normalizeNumberField(form.pd_price_member),
  pd_prodpv: normalizeNumberField(form.pd_prodpv),
  pd_qty: normalizeNumberField(form.pd_qty),
  pd_weight: normalizeNumberField(form.pd_weight),
  pd_psweight: normalizeNumberField(form.pd_psweight),
  pd_pswidth: normalizeNumberField(form.pd_pswidth),
  pd_pslenght: normalizeNumberField(form.pd_pslenght),
  pd_psheight: normalizeNumberField(form.pd_psheight),
  pd_material: normalizeTextField(form.pd_material),
  pd_warranty: normalizeTextField(form.pd_warranty),
  pd_assembly_required: form.pd_assembly_required,
  pd_parent_sku: normalizeTextField(form.pd_parent_sku),
  pd_type: Number(form.pd_type),
  pd_musthave: form.pd_musthave,
  pd_bestseller: form.pd_bestseller,
  pd_salespromo: form.pd_salespromo,
  pd_verified: form.pd_verified,
  pd_status: Number(form.pd_status),
})

const normalizeVariantsForComparison = (variants: VariantFormState[]) =>
  variants.map((variant) => ({
    id: variant.id ?? null,
    pv_name: variant.pv_name.trim(),
    pv_sku: variant.pv_sku.trim(),
    pv_colors: variant.pv_colors.map((color) => ({
      name: color.name.trim(),
      hex: color.hex.trim().toLowerCase(),
    })),
    pv_size: variant.pv_size.trim(),
    pv_width: normalizeNumberField(variant.pv_width),
    pv_dimension: normalizeNumberField(variant.pv_dimension),
    pv_height: normalizeNumberField(variant.pv_height),
    pv_price_srp: normalizeNumberField(variant.pv_price_srp),
    pv_price_dp: normalizeNumberField(variant.pv_price_dp),
    pv_price_member: normalizeNumberField(variant.pv_price_member),
    pv_prodpv: normalizeNumberField(variant.pv_prodpv),
    pv_qty: normalizeNumberField(variant.pv_qty),
    pv_status: Number(variant.pv_status),
    pv_images: variant.pv_images.filter(Boolean),
  }))

const mapExpandedVariantToProductVariant = (
  variant: NonNullable<CreateProductPayload['pd_variants']>[number],
): ProductVariant => ({
  sku: variant.pv_sku,
  name: variant.pv_name,
  color: variant.pv_color,
  colorHex: variant.pv_color_hex,
  size: variant.pv_size,
  width: variant.pv_width,
  dimension: variant.pv_dimension,
  height: variant.pv_height,
  priceSrp: variant.pv_price_srp,
  priceDp: variant.pv_price_dp,
  priceMember: variant.pv_price_member,
  prodpv: variant.pv_prodpv,
  qty: variant.pv_qty,
  status: variant.pv_status,
  images: variant.pv_images,
})

/* ─── small components ───────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  )
}

function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5" data-error-field={error ? 'true' : undefined}>
      <label className="text-xs font-semibold text-slate-600 block">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

const inputCls = (hasError = false) => [
  'w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-slate-700 placeholder-slate-400',
  'focus:outline-none focus:ring-2 transition-all',
  hasError
    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
    : 'border-slate-200 focus:ring-teal-500/30 focus:border-teal-400 hover:border-slate-300',
].join(' ')

const variantInputCls = 'w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition-all hover:border-slate-300'

const scrollToFirstErrorField = (container: HTMLElement | null) => {
  if (!container) return

  requestAnimationFrame(() => {
    const firstErrorField =
      container.querySelector<HTMLElement>('[data-error-field="true"]') ??
      container.querySelector<HTMLElement>('.border-red-300') ??
      container.querySelector<HTMLElement>('.text-red-500')

    if (!firstErrorField) return

    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    const focusTarget = firstErrorField.querySelector<HTMLElement>('input, select, textarea, [contenteditable="true"], button')
    focusTarget?.focus?.({ preventScroll: true })
  })
}

/* ─── main component ─────────────────────────────────────── */

export default function EditProductModal({ product, onClose, onSaved }: EditProductModalProps) {
  const isOpen = product !== null

  const [form, setForm] = useState<FormState>({
    pd_name: '', pd_catid: '', pd_room_type: '', pd_brand_type: '', pd_description: '', pd_price_srp: '',
    pd_price_dp: '', pd_price_member: '', pd_prodpv: '', pd_qty: '', pd_weight: '', pd_psweight: '',
    pd_pswidth: '', pd_pslenght: '', pd_psheight: '',
    pd_material: '', pd_warranty: '', pd_assembly_required: false,
    pd_parent_sku: '', pd_type: '0',
    pd_musthave: false, pd_bestseller: false, pd_salespromo: false, pd_verified: true, pd_status: '0',
  })
  const [errors,             setErrors]             = useState<Errors>({})
  const [serverError,        setServerError]        = useState('')
  const [imageFiles,         setImageFiles]         = useState<File[]>([])
  const [imagePreviews,      setImagePreviews]      = useState<string[]>([])
  const [existingImageUrls,  setExistingImageUrls]  = useState<string[]>([])
  const [initialImageUrls,   setInitialImageUrls]   = useState<string[]>([])
  const [initialForm,        setInitialForm]        = useState<FormState | null>(null)
  const [initialVariants,    setInitialVariants]    = useState<VariantFormState[]>([])
  const [isUploading,        setIsUploading]        = useState(false)
  const [uploadedUrls,       setUploadedUrls]       = useState<string[]>([])
  const [imageError,         setImageError]         = useState('')
  const [variants,           setVariants]           = useState<VariantFormState[]>([])
  const [newColorInputs,     setNewColorInputs]     = useState<Record<number, { name: string; hex: string }>>({})
  const [roomTouched,        setRoomTouched]        = useState(false)
  const [draftRestored,      setDraftRestored]      = useState(false)
  const [activeNewImageAdjustIndex, setActiveNewImageAdjustIndex] = useState<number | null>(null)
  const activeExistingImagePointerIndexRef = useRef<number | null>(null)
  const activeNewImagePointerIndexRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formContentRef = useRef<HTMLDivElement>(null)

  const { data: session } = useSession()
  const sessionAccessToken = String((session?.user as { accessToken?: string } | undefined)?.accessToken ?? '')
  const adminIdentityKey = sessionAccessToken
    ? `${String((session?.user as { id?: string } | undefined)?.id ?? 'unknown')}:${sessionAccessToken}`
    : undefined
  const { data: adminMe } = useGetAdminMeQuery(adminIdentityKey, { skip: !sessionAccessToken })
  const role = String(adminMe?.role ?? session?.user?.role ?? '').toLowerCase()
  const linkedSupplierId = Number(adminMe?.supplier_id ?? session?.user?.supplierId ?? 0)
  const isSupplierScopedActor =
    role === 'supplier' || role === 'supplier_admin' || Number(adminMe?.user_level_id ?? session?.user?.userLevelId ?? 0) === 8

  const [updateProduct, { isLoading }] = useUpdateProductMutation()
  const { data: categoriesData } = useGetCategoriesQuery(
    {
      page: 1,
      per_page: 500,
      supplier_id: isSupplierScopedActor && linkedSupplierId > 0 ? linkedSupplierId : undefined,
      used_only: isSupplierScopedActor && linkedSupplierId > 0 ? true : undefined,
    },
    undefined
  )
  const categories = useMemo(() => categoriesData?.categories ?? [], [categoriesData?.categories])
  const { data: brandsData } = useGetProductBrandsQuery()
  const brands = useMemo(
    () => (brandsData?.brands ?? []).filter((brand) => brand.status === 0 || brand.id === Number(form.pd_brand_type || 0)),
    [brandsData?.brands, form.pd_brand_type],
  )
  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === form.pd_catid),
    [categories, form.pd_catid],
  )
  const selectedBrand = useMemo(
    () => brands.find((brand) => String(brand.id) === form.pd_brand_type),
    [brands, form.pd_brand_type],
  )
  const selectedRoom = useMemo(
    () => ROOM_OPTIONS.find((room) => String(room.id) === form.pd_room_type),
    [form.pd_room_type],
  )
  const generatedParentSku = useMemo(
    () => generateSkuFromName(form.pd_name, product?.id),
    [form.pd_name, product?.id],
  )
  const openedProductRef = useRef<Product | null>(null)
  if (product && openedProductRef.current?.id !== product.id) {
    openedProductRef.current = product
  }
  const openedProduct = openedProductRef.current

  /* Populate form when product changes — only re-initialize when a different product is opened,
     not when RTK Query returns an updated reference for the same product (which would reset
     any in-progress edits like variant deletions). */
  useEffect(() => {
    if (!openedProduct) return
    const row = openedProduct as Product & Record<string, unknown>
    const nextForm = {
      pd_name:       openedProduct.name        ?? '',
      pd_catid:      String(openedProduct.catid ?? ''),
      pd_room_type:  openedProduct.roomType ? String(openedProduct.roomType) : '',
      pd_brand_type: openedProduct.brandType ? String(openedProduct.brandType) : '',
      pd_description:openedProduct.description ?? '',
      pd_price_srp:  String(openedProduct.priceSrp ?? ''),
      pd_price_dp:   String(openedProduct.priceDp  ?? ''),
      pd_price_member: String(openedProduct.priceMember ?? ''),
      pd_prodpv:     String(openedProduct.prodpv   ?? ''),
      pd_qty:        String(openedProduct.qty      ?? ''),
      pd_weight:     String(openedProduct.weight   ?? ''),
      pd_psweight:   String(row.psweight  ?? row.pd_psweight  ?? ''),
      pd_pswidth:    String(row.pswidth   ?? row.pd_pswidth   ?? ''),
      pd_pslenght:   String(row.pslenght  ?? row.pd_pslenght  ?? ''),
      pd_psheight:   String(row.psheight  ?? row.pd_psheight  ?? ''),
      pd_material:   String(row.material  ?? row.pd_material  ?? ''),
      pd_warranty:   String(row.warranty  ?? row.pd_warranty  ?? ''),
      pd_assembly_required: Boolean(row.assemblyRequired ?? row.pd_assembly_required),
      pd_parent_sku: generateSkuFromName(openedProduct.name ?? '', openedProduct.id),
      pd_type:       String(openedProduct.type   ?? 0),
      pd_musthave:   openedProduct.musthave    ?? false,
      pd_bestseller: openedProduct.bestseller  ?? false,
      pd_salespromo: openedProduct.salespromo  ?? false,
      pd_verified:   openedProduct.verified    ?? true,
      pd_status:     String(openedProduct.status ?? 0),
    }
    setForm(nextForm)
    setInitialForm(nextForm)
    const existing = Array.isArray(openedProduct.images) && openedProduct.images.length > 0
      ? openedProduct.images.filter((img): img is string => Boolean(img))
      : (openedProduct.image ? [openedProduct.image] : [])
    setInitialImageUrls(existing)
    const nextVariants = Array.isArray(openedProduct.variants)
      ? dedupeVariantFormStates(mapProductVariantsToFormStates(openedProduct.variants))
      : []
    setInitialVariants(nextVariants)
    setImageFiles([]); setImagePreviews([]); setUploadedUrls([])
    setNewColorInputs({})
    setErrors({}); setServerError(''); setImageError('')
    setDraftRestored(false)
    setActiveNewImageAdjustIndex(null)

    if (typeof window !== 'undefined') {
      try {
        const savedDraft = window.localStorage.getItem(getEditProductDraftKey(openedProduct.id))
        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft) as Partial<EditProductDraft>
          if (parsedDraft.version === 1 && parsedDraft.productId === openedProduct.id) {
            setForm({ ...nextForm, ...parsedDraft.form })
            setExistingImageUrls(Array.isArray(parsedDraft.imageUrls) ? parsedDraft.imageUrls : existing)
            setVariants(
              Array.isArray(parsedDraft.variants)
                ? dedupeVariantFormStates(parsedDraft.variants)
                : nextVariants,
            )
            setRoomTouched(Boolean(parsedDraft.roomTouched))
            setDraftRestored(true)
            return
          }
        }
      } catch {
        window.localStorage.removeItem(getEditProductDraftKey(openedProduct.id))
      }
    }

    setExistingImageUrls(existing)
    setVariants(nextVariants)
    setRoomTouched(false)
  }, [openedProduct])

  const set = (key: keyof FormState, value: string | boolean) => {
    setForm(p => ({ ...p, [key]: value }))
    setErrors(p => ({ ...p, [key]: undefined }))
  }

  useEffect(() => {
    if (!product || roomTouched || form.pd_room_type.trim() !== '') return
    const selectedCategory = categories.find((category) => String(category.id) === form.pd_catid)
    const inferredRoomType = inferRoomTypeFromCategory(selectedCategory)
    if (!inferredRoomType) return
    setForm((prev) => ({ ...prev, pd_room_type: String(inferredRoomType) }))
  }, [categories, form.pd_catid, form.pd_room_type, product, roomTouched])

  const hasVariants = form.pd_type === '1'

  /* ── image handlers ── */
  const applySelectedImages = (files: File[]) => {
    if (!files.length) return
    setImageError('')
    for (const file of files) {
      if (!IMAGE_MIME_TYPES.includes(file.type)) { setImageError('Only JPEG, PNG, WEBP, or GIF allowed.'); return }
      if (file.size > MAX_IMAGE_BYTES) { setImageError('File too large. Max 5MB.'); return }
    }
    const maxNew = 10 - existingImageUrls.length
    const next = [...imageFiles, ...files].slice(0, maxNew)
    setImageFiles(next)
    setImagePreviews(next.map(f => URL.createObjectURL(f)))
    setUploadedUrls([])
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applySelectedImages(Array.from(e.target.files ?? []))
  }

  const preventFileDropNavigation = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleMainImageDrop = (e: React.DragEvent<HTMLElement>) => {
    preventFileDropNavigation(e)
    applySelectedImages(Array.from(e.dataTransfer.files ?? []))
  }

  const handleRemoveImage         = (index: number) => {
    const next = imageFiles.filter((_, i) => i !== index)
    setImageFiles(next)
    setImagePreviews(next.map(f => URL.createObjectURL(f)))
    setUploadedUrls([])
    if (!next.length && fileInputRef.current) fileInputRef.current.value = ''
  }
  const handleRemoveExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index))
    setUploadedUrls([])
  }
  const handleClearNewImages      = () => {
    setImageFiles([]); setImagePreviews([]); setUploadedUrls([])
    setImageError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleExistingImagePointerDown = (index: number) => {
    activeExistingImagePointerIndexRef.current = index
  }

  const handleExistingImagePointerEnter = (targetIndex: number) => {
    const sourceIndex = activeExistingImagePointerIndexRef.current
    if (sourceIndex == null || sourceIndex === targetIndex) return

    setExistingImageUrls((prev) => moveItem(prev, sourceIndex, targetIndex))
    setUploadedUrls([])
    activeExistingImagePointerIndexRef.current = targetIndex
  }

  const handleNewImagePointerDown = (index: number) => {
    activeNewImagePointerIndexRef.current = index
  }

  const handleNewImagePointerEnter = (targetIndex: number) => {
    const sourceIndex = activeNewImagePointerIndexRef.current
    if (sourceIndex == null || sourceIndex === targetIndex) return

    setImageFiles((prev) => moveItem(prev, sourceIndex, targetIndex))
    setImagePreviews((prev) => moveItem(prev, sourceIndex, targetIndex))
    setUploadedUrls([])
    activeNewImagePointerIndexRef.current = targetIndex
  }

  const stopExistingImagePointerDrag = () => {
    activeExistingImagePointerIndexRef.current = null
  }

  const stopNewImagePointerDrag = () => {
    activeNewImagePointerIndexRef.current = null
  }

  const handleApplyAdjustedNewImage = async (nextFile: File) => {
    if (activeNewImageAdjustIndex == null) return

    const nextFiles = [...imageFiles]
    nextFiles[activeNewImageAdjustIndex] = nextFile
    setImageFiles(nextFiles)
    setImagePreviews(nextFiles.map((file) => URL.createObjectURL(file)))
    setUploadedUrls([])
    setActiveNewImageAdjustIndex(null)
  }

  /* ── variant handlers ── */
  const addVariant    = () => setVariants(prev => [...prev, emptyVariant()])
  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index))
    setNewColorInputs(prev => {
      const next: Record<number, { name: string; hex: string }> = {}
      Object.entries(prev).forEach(([k, v]) => {
        const key = Number(k)
        if (key < index) next[key] = v
        if (key > index) next[key - 1] = v
      })
      return next
    })
  }

  const setVariant = (index: number, key: keyof VariantFormState, value: string | string[]) =>
    setVariants(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item))

  const addVariantColor = (index: number) => {
    const hex  = newColorInputs[index]?.hex ?? '#94a3b8'
    const typedName = normalizeVariantLabel(newColorInputs[index]?.name ?? '')
    const name = typedName || hexToColorName(hex)
    if (!name) return
    setVariants(prev =>
      prev.map((item, i) => (
        i === index
          ? (
            item.pv_colors.some((color) => normalizeVariantLabel(color.name).toLowerCase() === name.toLowerCase())
              ? item
              : { ...item, pv_colors: [...item.pv_colors, { name, hex }] }
          )
          : item
      )),
    )
    setNewColorInputs(prev => ({ ...prev, [index]: { name: '', hex: '#94a3b8' } }))  // reset after add
  }

  const removeVariantColor = (variantIndex: number, colorIndex: number) =>
    setVariants(prev =>
      prev.map((item, i) =>
        i === variantIndex ? { ...item, pv_colors: item.pv_colors.filter((_, ci) => ci !== colorIndex) } : item,
      ),
    )

  const uploadVariantImages = async (index: number, files: FileList | File[] | null) => {
    const picked = Array.from(files ?? [])
    if (!picked.length) return
    for (const file of picked) {
      if (!IMAGE_MIME_TYPES.includes(file.type)) { setImageError('Only JPEG, PNG, WEBP, or GIF files are allowed.'); return }
      if (file.size > MAX_IMAGE_BYTES) { setImageError('File too large. Maximum size is 5MB.'); return }
    }
    setIsUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of picked) {
        const fd = new FormData()
        fd.append('file', file)
        const res  = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Upload failed')
        uploaded.push(json.url)
      }
      setVariants(prev =>
        prev.map((item, i) => i === index ? { ...item, pv_images: [...item.pv_images, ...uploaded] } : item),
      )
      setImageError('')
    } catch (err: unknown) {
      setImageError(getUploadErrorMessage(err, 'Variant image upload failed.'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleVariantImageDrop = (index: number) => (e: React.DragEvent<HTMLElement>) => {
    preventFileDropNavigation(e)
    void uploadVariantImages(index, Array.from(e.dataTransfer.files ?? []))
  }

  /* ── validation ── */
  const validate = (): Errors => {
    const e: Errors = {}
    if (!form.pd_name.trim())                                           e.pd_name      = 'Product name is required'
    if (!form.pd_catid.trim())                                          e.pd_catid     = 'Category is required'
    if (!form.pd_price_srp.trim() || isNaN(Number(form.pd_price_srp))) e.pd_price_srp = 'Valid SRP price is required'
    if (form.pd_price_dp && isNaN(Number(form.pd_price_dp)))           e.pd_price_dp  = 'Must be a valid number'
    if (form.pd_price_member && isNaN(Number(form.pd_price_member)))   e.pd_price_member = 'Must be a valid number'
    if (form.pd_prodpv   && isNaN(Number(form.pd_prodpv)))             e.pd_prodpv    = 'Must be a valid number'
    if (form.pd_qty      && isNaN(Number(form.pd_qty)))                e.pd_qty       = 'Must be a valid number'
    if (form.pd_weight   && isNaN(Number(form.pd_weight)))             e.pd_weight    = 'Must be a valid number'
    if (form.pd_psweight && isNaN(Number(form.pd_psweight)))           e.pd_psweight  = 'Must be a valid number'
    if (form.pd_pswidth  && isNaN(Number(form.pd_pswidth)))            e.pd_pswidth   = 'Must be a valid number'
    if (form.pd_pslenght && isNaN(Number(form.pd_pslenght)))           e.pd_pslenght  = 'Must be a valid number'
    if (form.pd_psheight && isNaN(Number(form.pd_psheight)))           e.pd_psheight  = 'Must be a valid number'
    return e
  }

  const expandedVariants = variants
    .filter(v => v.pv_name || v.pv_colors.length > 0 || v.pv_size || v.pv_width || v.pv_dimension || v.pv_height || v.pv_sku || v.pv_images.length > 0)
    .flatMap((v, index) => {
      const autoSku    = buildVariantSku(form.pd_parent_sku || generateSkuFromName(form.pd_name, product?.id), index)
      const variantSku = v.pv_sku.trim() || autoSku
      const baseSrp = toOptionalPositiveNumber(form.pd_price_srp)
      const baseDp = toOptionalPositiveNumber(form.pd_price_dp)
      const baseMember = toOptionalPositiveNumber(form.pd_price_member)
      const base = {
        pv_name:      v.pv_name.trim() || undefined,
        pv_size:      v.pv_size || undefined,
        pv_width:     toOptionalPositiveNumber(v.pv_width),
        pv_dimension: toOptionalPositiveNumber(v.pv_dimension),
        pv_height:    toOptionalPositiveNumber(v.pv_height),
        pv_price_srp: toOptionalPositiveNumber(v.pv_price_srp) ?? baseSrp,
        pv_price_dp:  toOptionalPositiveNumber(v.pv_price_dp)  ?? baseDp,
        pv_price_member: toOptionalPositiveNumber(v.pv_price_member) ?? baseMember,
        pv_prodpv:    toOptionalPositiveNumber(v.pv_prodpv) ?? toOptionalPositiveNumber(form.pd_prodpv),
        pv_qty:       v.pv_qty       ? Number(v.pv_qty)       : undefined,
        pv_status:    Number(v.pv_status),
        pv_images:    v.pv_images.length > 0 ? v.pv_images : undefined,
      }
      if (!v.pv_colors.length) {
        return [{ ...base, pv_sku: variantSku }]
      }

      return v.pv_colors.map((color, colorIndex) => ({
        ...base,
        pv_sku: buildVariantColorSku(variantSku, color.name, colorIndex, v.pv_colors.length),
        pv_color: color.name,
        pv_color_hex: color.hex,
      }))
    })

  /* ── submit ── */
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!product) return
    setServerError('')
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      scrollToFirstErrorField(formContentRef.current)
      return
    }
    const baseChanged =
      JSON.stringify(normalizeFormForComparison(form)) !== JSON.stringify(normalizeFormForComparison(initialForm ?? form))
    const variantsChanged =
      JSON.stringify(normalizeVariantsForComparison(variants)) !== JSON.stringify(normalizeVariantsForComparison(initialVariants))
    const existingImagesChanged =
      existingImageUrls.length !== initialImageUrls.length ||
      existingImageUrls.some((url, index) => url !== initialImageUrls[index])

    if (!baseChanged && !variantsChanged && !existingImagesChanged && imageFiles.length === 0) {
      showSuccessToast('No changes detected.')
      onClose()
      return
    }

    let finalImageUrls = [...existingImageUrls]
    if (imageFiles.length > 0 && uploadedUrls.length === 0) {
      setIsUploading(true)
      try {
        const uploaded: string[] = []
        for (const file of imageFiles) {
          const fd = new FormData()
          fd.append('file', file)
          const res  = await fetch('/api/admin/upload', { method: 'POST', body: fd })
          const json = await res.json()
          if (!res.ok) throw new Error(json.error ?? 'Upload failed')
          uploaded.push(json.url)
        }
        finalImageUrls = [...existingImageUrls, ...uploaded]
        setUploadedUrls(finalImageUrls)
      } catch (err: unknown) {
        setImageError(getUploadErrorMessage(err, 'Image upload failed.'))
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }
    if (imageFiles.length > 0 && uploadedUrls.length > 0) {
      finalImageUrls = uploadedUrls
    }

    const imagesChanged =
      finalImageUrls.length !== initialImageUrls.length ||
      finalImageUrls.some((url, index) => url !== initialImageUrls[index])

    const payload: Partial<CreateProductPayload> = {
      pd_name:        form.pd_name.trim(),
      pd_catid:       Number(form.pd_catid),
      pd_room_type:   form.pd_room_type.trim() ? Number(form.pd_room_type) : undefined,
      pd_brand_type:  form.pd_brand_type.trim() ? Number(form.pd_brand_type) : undefined,
      pd_price_srp:   Number(form.pd_price_srp),
      pd_description: form.pd_description.trim() || undefined,
      pd_price_dp:    form.pd_price_dp  ? Number(form.pd_price_dp)  : undefined,
      pd_price_member: form.pd_price_member ? Number(form.pd_price_member) : undefined,
      pd_prodpv:      form.pd_prodpv    ? Number(form.pd_prodpv)    : undefined,
      pd_qty:         form.pd_qty       ? Number(form.pd_qty)       : undefined,
      pd_weight:      form.pd_weight    ? Number(form.pd_weight)    : undefined,
      pd_psweight:    form.pd_psweight  ? Number(form.pd_psweight)  : undefined,
      pd_pswidth:     form.pd_pswidth   ? Number(form.pd_pswidth)   : undefined,
      pd_pslenght:    form.pd_pslenght  ? Number(form.pd_pslenght)  : undefined,
      pd_psheight:    form.pd_psheight  ? Number(form.pd_psheight)  : undefined,
      pd_material:    form.pd_material.trim()  || undefined,
      pd_warranty:    form.pd_warranty.trim()  || undefined,
      pd_assembly_required: form.pd_assembly_required,
      pd_parent_sku:  form.pd_parent_sku.trim() || generatedParentSku || undefined,
      pd_type:        Number(form.pd_type),
      pd_musthave:    form.pd_musthave,
      pd_bestseller:  form.pd_bestseller,
      pd_salespromo:  form.pd_salespromo,
      pd_verified:    form.pd_verified,
      pd_status:      Number(form.pd_status),
      pd_variants:        hasVariants ? expandedVariants : [],
    }

    if (imagesChanged) {
      payload.pd_image = finalImageUrls[0] ?? null
      payload.pd_images = finalImageUrls
    }

    try {
      await updateProduct({ id: product.id, data: payload }).unwrap()
      const updatedProduct: Product = {
        ...product,
        name: form.pd_name.trim(),
        catid: Number(form.pd_catid),
        roomType: form.pd_room_type ? Number(form.pd_room_type) : undefined,
        brandType: form.pd_brand_type ? Number(form.pd_brand_type) : undefined,
        brand: brands.find((brand) => brand.id === Number(form.pd_brand_type))?.name ?? product.brand ?? null,
        description: form.pd_description.trim() || null,
        priceSrp: Number(form.pd_price_srp),
        priceDp: form.pd_price_dp ? Number(form.pd_price_dp) : 0,
        priceMember: form.pd_price_member ? Number(form.pd_price_member) : undefined,
        prodpv: form.pd_prodpv ? Number(form.pd_prodpv) : undefined,
        qty: form.pd_qty ? Number(form.pd_qty) : 0,
        weight: form.pd_weight ? Number(form.pd_weight) : 0,
        psweight: form.pd_psweight ? Number(form.pd_psweight) : undefined,
        pswidth: form.pd_pswidth ? Number(form.pd_pswidth) : undefined,
        pslenght: form.pd_pslenght ? Number(form.pd_pslenght) : undefined,
        psheight: form.pd_psheight ? Number(form.pd_psheight) : undefined,
        material: form.pd_material.trim() || null,
        warranty: form.pd_warranty.trim() || null,
        assemblyRequired: form.pd_assembly_required,
        type: Number(form.pd_type),
        musthave: form.pd_musthave,
        bestseller: form.pd_bestseller,
        salespromo: form.pd_salespromo,
        verified: form.pd_verified,
        status: Number(form.pd_status),
        image: finalImageUrls[0] ?? null,
        images: finalImageUrls,
        variants: hasVariants ? expandedVariants.map(mapExpandedVariantToProductVariant) : [],
      }
      showSuccessToast('Product updated successfully.')
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(getEditProductDraftKey(product.id))
      }
      onSaved?.(updatedProduct)
      onClose()
    } catch (err: unknown) {
      const message = getRequestErrorMessage(err, 'Failed to update product.')
      setServerError(message)
      showErrorToast(message)
    }
  }

  const handleClose = () => { if (isLoading || isUploading) return; onClose() }
  const isBusy      = isLoading || isUploading
  const hasAnyImages = existingImageUrls.length > 0 || imagePreviews.length > 0

  /* ── change detection (for button disable + grid visibility) ── */
  const baseChanged =
    initialForm !== null &&
    JSON.stringify(normalizeFormForComparison(form)) !== JSON.stringify(normalizeFormForComparison(initialForm))
  const variantsChangedNow =
    JSON.stringify(normalizeVariantsForComparison(variants)) !== JSON.stringify(normalizeVariantsForComparison(initialVariants))
  const existingImagesChangedNow =
    existingImageUrls.length !== initialImageUrls.length ||
    existingImageUrls.some((url, i) => url !== initialImageUrls[i])
  const hasChanged = baseChanged || variantsChangedNow || existingImagesChangedNow || imageFiles.length > 0
  /* Keep grid visible even after all existing images are removed so user can still add new ones */
  const showImageGrid = hasAnyImages || initialImageUrls.length > 0
  const draftImageUrls = uploadedUrls.length > 0 ? uploadedUrls : existingImageUrls

  useEffect(() => {
    if (!isOpen || !openedProduct || typeof window === 'undefined') return

    const draftKey = getEditProductDraftKey(openedProduct.id)
    const shouldPersistDraft = hasEditDraftContent(
      form,
      initialForm,
      variants,
      initialVariants,
      draftImageUrls,
      initialImageUrls,
      roomTouched,
    )

    if (!shouldPersistDraft) {
      window.localStorage.removeItem(draftKey)
      return
    }

    const draft: EditProductDraft = {
      version: 1,
      productId: openedProduct.id,
      form,
      variants,
      imageUrls: draftImageUrls,
      roomTouched,
    }

    window.localStorage.setItem(draftKey, JSON.stringify(draft))
  }, [draftImageUrls, form, initialForm, initialImageUrls, initialVariants, isOpen, openedProduct, roomTouched, variants])

  /* ─── render ─────────────────────────────────────────────── */
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
            >
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm shadow-blue-500/40">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-slate-800 font-bold text-base leading-none">Edit Product</h2>
                    <p className="text-slate-400 text-xs mt-0.5 truncate max-w-xs">
                      ID #{product?.id} · {product?.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isBusy}
                  className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* ── Scrollable form body ── */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div ref={formContentRef} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                  {/* Server error */}
                  {serverError && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-red-50 rounded-xl border border-red-100">
                      <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <p className="text-xs text-red-600">{serverError}</p>
                    </div>
                  )}

                  {/* ── Section: Product Images ── */}
                  {draftRestored && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                      <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <p className="text-xs text-amber-700">Local draft restored. Unsaved edits and uploaded image links are back in this product form.</p>
                    </div>
                  )}

                  <SectionLabel>Product Images</SectionLabel>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    className="hidden"
                    id="edit-product-image-input"
                  />

                  {showImageGrid ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-2">
                        {/* Existing images */}
                        {existingImageUrls.map((url, index) => (
                          <motion.div
                            key={`existing-${index}`}
                            onPointerDown={() => handleExistingImagePointerDown(index)}
                            onPointerEnter={() => handleExistingImagePointerEnter(index)}
                            onPointerUp={stopExistingImagePointerDrag}
                            onPointerCancel={stopExistingImagePointerDrag}
                            className="relative h-24 cursor-grab rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group active:cursor-grabbing"
                            layout
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                          >
                            <Image
                              src={url}
                              alt={`Image ${index + 1}`}
                              fill
                              className="object-cover pointer-events-none"
                              unoptimized
                            />
                            {index === 0 && (
                              <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-md">Main</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingImage(index)}
                              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          </motion.div>
                        ))}
                        {/* New (pending upload) images */}
                        {imagePreviews.map((preview, index) => (
                          <motion.div
                            key={`new-${index}`}
                            onPointerDown={() => handleNewImagePointerDown(index)}
                            onPointerEnter={() => handleNewImagePointerEnter(index)}
                            onPointerUp={stopNewImagePointerDrag}
                            onPointerCancel={stopNewImagePointerDrag}
                            className="relative h-24 cursor-grab rounded-xl overflow-hidden bg-slate-100 border-2 border-emerald-400 group active:cursor-grabbing"
                            layout
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                          >
                            <Image
                              src={preview}
                              alt={`New ${index + 1}`}
                              fill
                              className="object-cover pointer-events-none"
                              unoptimized
                            />
                            <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-md">New</span>
                            <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => setActiveNewImageAdjustIndex(index)}
                                className="h-6 rounded-full bg-white/90 px-2 text-[10px] font-bold text-slate-700 shadow-sm"
                              >
                                Adjust
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                              </button>
                            </div>
                          </motion.div>
                        ))}
                        {/* Add more slot */}
                        {existingImageUrls.length + imagePreviews.length < 10 && (
                          <label htmlFor="edit-product-image-input" onDragOver={preventFileDropNavigation} onDrop={handleMainImageDrop} className="flex flex-col items-center justify-center gap-1 h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                            </svg>
                            <span className="text-[10px] text-slate-400 font-medium">Add More</span>
                          </label>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-slate-400 flex-1">
                          {!hasAnyImages
                            ? 'All images removed — click + to add new images'
                            : `${existingImageUrls.length} saved · ${imagePreviews.length} pending upload · drag to reorder within each group`}
                        </p>
                        {imagePreviews.length > 0 && (
                          <button type="button" onClick={handleClearNewImages} className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors">
                            Clear new
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="edit-product-image-input"
                      onDragOver={preventFileDropNavigation}
                      onDrop={handleMainImageDrop}
                      className="flex flex-col items-center justify-center gap-2 w-full h-36 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all group"
                    >
                      <div className="h-10 w-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors">Click or drag to upload images</p>
                        <p className="text-xs text-slate-400 mt-0.5">JPEG, PNG, WEBP, GIF · max 5MB each</p>
                      </div>
                    </label>
                  )}
                  {imageError && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      {imageError}
                    </p>
                  )}

                  {/* ── Section: Product Information ── */}
                  <SectionLabel>Product Information</SectionLabel>

                  <Field label="Product Name" required error={errors.pd_name}>
                    <input
                      type="text"
                      value={form.pd_name}
                      onChange={e => {
                        const value = e.target.value
                        setForm(prev => ({
                          ...prev,
                          pd_name: value,
                          pd_parent_sku: prev.pd_parent_sku.trim() ? prev.pd_parent_sku : '',
                        }))
                        setErrors(prev => ({ ...prev, pd_name: undefined }))
                      }}
                      placeholder="Product name"
                      className={inputCls(!!errors.pd_name)}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Category" required error={errors.pd_catid}>
                      <select
                        value={form.pd_catid}
                        onChange={e => {
                          set('pd_catid', e.target.value)
                          if (!roomTouched) {
                            const selectedCategory = categories.find((category) => String(category.id) === e.target.value)
                            const inferredRoomType = inferRoomTypeFromCategory(selectedCategory)
                            set('pd_room_type', inferredRoomType ? String(inferredRoomType) : '')
                          }
                        }}
                        className={inputCls(!!errors.pd_catid)}
                      >
                        <option value="">Select category…</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Shop By Room">
                      <div className="space-y-1">
                        <select
                          value={form.pd_room_type}
                          onChange={e => {
                            setRoomTouched(true)
                            set('pd_room_type', e.target.value)
                          }}
                          className={inputCls()}
                        >
                          <option value="">Auto / Not assigned</option>
                          {ROOM_OPTIONS.map((room) => (
                            <option key={room.id} value={String(room.id)}>{room.label}</option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-500">Auto-filled from category when possible, but still editable here.</p>
                      </div>
                    </Field>

                    <Field label="Brand">
                      <select
                        value={form.pd_brand_type}
                        onChange={e => set('pd_brand_type', e.target.value)}
                        className={inputCls()}
                      >
                        <option value="">Not assigned</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={String(brand.id)}>{brand.name}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="SKU">
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={form.pd_parent_sku}
                          onChange={e => set('pd_parent_sku', e.target.value.toUpperCase())}
                          placeholder={generatedParentSku || 'Auto-generated from product name'}
                          className={inputCls()}
                        />
                        <p className="text-[11px] text-slate-500">
                          Leave this blank to auto-generate: <span className="font-mono">{generatedParentSku || 'Waiting for product name'}</span>
                        </p>
                      </div>
                    </Field>
                  </div>

                  <Field label="Description">
                    <div className="space-y-3">
                      <ProductDescriptionGenerator
                        input={{
                          productName: form.pd_name,
                          categoryName: selectedCategory?.name,
                          roomLabel: selectedRoom?.label,
                          brandName: selectedBrand?.name,
                          material: form.pd_material,
                          warranty: form.pd_warranty,
                          assemblyRequired: form.pd_assembly_required,
                          width: form.pd_pswidth,
                          depth: form.pd_pslenght,
                          height: form.pd_psheight,
                        }}
                        disabled={isLoading}
                        onGenerate={(html) => set('pd_description', html)}
                      />
                      <RichTextEditor
                        value={form.pd_description}
                        onChange={html => set('pd_description', html)}
                      />
                    </div>
                  </Field>

                  {/* ── Section: Product Details ── */}
                  <SectionLabel>Product Details</SectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Material">
                      <input type="text" value={form.pd_material} onChange={e => set('pd_material', e.target.value)} placeholder="e.g. Solid Wood & Fabric" className={inputCls()}/>
                    </Field>
                    <Field label="Warranty">
                      <select value={form.pd_warranty} onChange={e => set('pd_warranty', e.target.value)} className={inputCls()}>
                        <option value="">Select warranty…</option>
                        {WARRANTY_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Field label="Assembly Required">
                    <button
                      type="button"
                      onClick={() => set('pd_assembly_required', !form.pd_assembly_required)}
                      className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl border-2 transition-all ${
                        form.pd_assembly_required
                          ? 'border-teal-300 bg-teal-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className={`text-sm font-semibold ${form.pd_assembly_required ? 'text-teal-700' : 'text-slate-500'}`}>
                        {form.pd_assembly_required ? 'Yes — Assembly Required' : 'No Assembly Required'}
                      </span>
                      <div className={`relative h-5 w-9 rounded-full transition-colors ${form.pd_assembly_required ? 'bg-teal-500' : 'bg-slate-200'}`}>
                        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${form.pd_assembly_required ? 'left-4' : 'left-0.5'}`}/>
                      </div>
                    </button>
                  </Field>

                  {/* ── Section: Pricing ── */}
                  <SectionLabel>Pricing</SectionLabel>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Field label="SRP Price (₱)" required error={errors.pd_price_srp}>
                      <input type="number" value={form.pd_price_srp} onChange={e => set('pd_price_srp', e.target.value)} placeholder="0.00" className={inputCls(!!errors.pd_price_srp)}/>
                    </Field>
                    <Field label="Dealer Price (₱)" error={errors.pd_price_dp}>
                      <div className="space-y-1">
                        <input type="number" value={form.pd_price_dp} onChange={e => set('pd_price_dp', e.target.value)} placeholder="0.00" className={inputCls(!!errors.pd_price_dp)}/>
                        <p className="text-[11px] text-slate-500">Separate dealer pricing. Optional.</p>
                      </div>
                    </Field>
                    <Field label="Member Price (₱)" error={errors.pd_price_member}>
                      <div className="space-y-1">
                        <input type="number" value={form.pd_price_member} onChange={e => set('pd_price_member', e.target.value)} placeholder="0.00" className={inputCls(!!errors.pd_price_member)}/>
                        <p className="text-[11px] text-slate-500">Shown to member accounts. If blank, SRP will be used.</p>
                      </div>
                    </Field>
                    <Field label="PV Value" error={errors.pd_prodpv}>
                      <input type="number" value={form.pd_prodpv} onChange={e => set('pd_prodpv', e.target.value)} placeholder="0" className={inputCls(!!errors.pd_prodpv)}/>
                    </Field>
                  </div>

                  {/* ── Section: Stock & Shipping ── */}
                  <SectionLabel>Stock & Shipping</SectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Quantity" error={errors.pd_qty}>
                      <input type="number" value={form.pd_qty} onChange={e => set('pd_qty', e.target.value)} placeholder="0" className={inputCls(!!errors.pd_qty)}/>
                    </Field>
                    <Field label="Net Weight (kg)" error={errors.pd_weight}>
                      <input type="number" value={form.pd_weight} onChange={e => set('pd_weight', e.target.value)} placeholder="0.00" className={inputCls(!!errors.pd_weight)}/>
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Width / W (cm)" error={errors.pd_pswidth}>
                      <input type="number" value={form.pd_pswidth} onChange={e => set('pd_pswidth', e.target.value)} placeholder="0" className={inputCls(!!errors.pd_pswidth)}/>
                    </Field>
                    <Field label="Length / L (cm)" error={errors.pd_pslenght}>
                      <input type="number" value={form.pd_pslenght} onChange={e => set('pd_pslenght', e.target.value)} placeholder="0" className={inputCls(!!errors.pd_pslenght)}/>
                    </Field>
                    <Field label="Height / H (cm)" error={errors.pd_psheight}>
                      <input type="number" value={form.pd_psheight} onChange={e => set('pd_psheight', e.target.value)} placeholder="0" className={inputCls(!!errors.pd_psheight)}/>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Package Weight (kg)" error={errors.pd_psweight}>
                      <input type="number" value={form.pd_psweight} onChange={e => set('pd_psweight', e.target.value)} placeholder="0.00" className={inputCls(!!errors.pd_psweight)}/>
                    </Field>
                  </div>

                  {/* ── Section: Settings ── */}
                  <SectionLabel>Settings</SectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Status */}
                    <Field label="Status">
                      <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-0.5">
                        {[{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive (Draft)' }].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => set('pd_status', opt.value)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              form.pd_status === opt.value
                                ? 'bg-white text-slate-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </Field>

                    {/* Has Variants */}
                    <Field label="Product Type">
                      <button
                        type="button"
                        onClick={() => {
                          const next = !hasVariants
                          set('pd_type', next ? '1' : '0')
                          if (!next) { setVariants([]); setNewColorInputs({}) }
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 transition-all ${
                          hasVariants
                            ? 'border-teal-300 bg-teal-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <svg className={`w-4 h-4 ${hasVariants ? 'text-teal-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                          </svg>
                          <span className={`text-sm font-semibold ${hasVariants ? 'text-teal-700' : 'text-slate-600'}`}>
                            {hasVariants ? 'Has Variants' : 'Simple Product'}
                          </span>
                        </div>
                        <div className={`relative h-5 w-9 rounded-full transition-colors ${hasVariants ? 'bg-teal-500' : 'bg-slate-200'}`}>
                          <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${hasVariants ? 'left-4' : 'left-0.5'}`}/>
                        </div>
                      </button>
                    </Field>
                  </div>

                  {/* ── Section: Product Badges ── */}
                  <SectionLabel>Product Badges</SectionLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FLAG_CARDS.map(flag => {
                      const isActive = form[flag.key] as boolean
                      return (
                        <button
                          key={flag.key}
                          type="button"
                          onClick={() => set(flag.key, !isActive)}
                          className={[
                            'relative flex flex-col gap-2 p-3 rounded-xl border-2 text-left transition-all',
                            isActive ? flag.activeCard : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                          ].join(' ')}
                        >
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${isActive ? flag.activeIcon : 'bg-slate-100 text-slate-400'}`}>
                            {flag.icon}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${isActive ? '' : 'text-slate-600'}`}>{flag.label}</p>
                            <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{flag.desc}</p>
                          </div>
                          {isActive && (
                            <div className={`absolute top-2 right-2 h-3.5 w-3.5 rounded-full flex items-center justify-center ${flag.activeIcon}`}>
                              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                              </svg>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* ── Section: Variants ── */}
                  {hasVariants && (
                    <>
                      <SectionLabel>Variants</SectionLabel>
                      <div className="space-y-3">
                        {variants.length === 0 ? (
                          <div className="flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-center">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                              </svg>
                            </div>
                            <p className="text-xs font-semibold text-slate-500">No variants yet</p>
                            <p className="text-[11px] text-slate-400">Add color / size options with their own stock and pricing</p>
                          </div>
                        ) : (
                          variants.map((variant, index) => {
                            const autoSku = buildVariantSku(form.pd_parent_sku || generateSkuFromName(form.pd_name, product?.id), index)
                            return (
                              <div key={`variant-${variant.id ?? index}`} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                                {/* Variant header */}
                                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-lg bg-blue-100 flex items-center justify-center">
                                      <span className="text-[10px] font-bold text-blue-700">{index + 1}</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-700">
                                      {variant.pv_name.trim() || `Variant #${index + 1}`}
                                      {variant.pv_size && <span className="text-slate-400 font-normal ml-1">· {variant.pv_size}</span>}
                                      {(variant.pv_width || variant.pv_dimension || variant.pv_height) && (
                                        <span className="text-slate-400 font-normal ml-1">
                                          · {variant.pv_width || '-'}W x {variant.pv_dimension || '-'}D x {variant.pv_height || '-'}H
                                        </span>
                                      )}
                                      {variant.pv_colors.length > 0 && (
                                        <span className="inline-flex items-center gap-1 ml-2">
                                          {variant.pv_colors.map((c, ci) => (
                                            <span key={ci} className="h-3 w-3 rounded-full border border-slate-200 shrink-0" style={{ backgroundColor: c.hex }} title={c.name}/>
                                          ))}
                                          <span className="text-[10px] font-medium text-slate-400 ml-1">{variant.pv_colors.length}</span>
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-slate-400">{variant.pv_sku || autoSku}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeVariant(index)}
                                      className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                      </svg>
                                    </button>
                                  </div>
                                </div>

                                <div className="divide-y divide-slate-100">

                                  {/* ── Identity ── */}
                                  <div className="px-4 py-3.5 space-y-2.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity</p>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500 block">Name <span className="font-normal text-slate-400">(recommended)</span></label>
                                        <input value={variant.pv_name} onChange={e => setVariant(index, 'pv_name', e.target.value)} placeholder="e.g. Black Large" className={variantInputCls}/>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500 block">Size</label>
                                        <input value={variant.pv_size} onChange={e => setVariant(index, 'pv_size', e.target.value)} placeholder="e.g. Medium, XL" className={variantInputCls}/>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500 block">SKU <span className="font-normal text-slate-400">(optional)</span></label>
                                        <input value={variant.pv_sku} onChange={e => setVariant(index, 'pv_sku', e.target.value)} placeholder={autoSku} className={variantInputCls}/>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500 block">Width / W (cm)</label>
                                        <input type="number" value={variant.pv_width} onChange={e => setVariant(index, 'pv_width', e.target.value)} onBlur={e => setVariant(index, 'pv_width', toOptionalPositiveNumber(e.target.value)?.toString() ?? '')} placeholder="e.g. 120" className={variantInputCls}/>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500 block">Length / L (cm)</label>
                                        <input type="number" value={variant.pv_dimension} onChange={e => setVariant(index, 'pv_dimension', e.target.value)} onBlur={e => setVariant(index, 'pv_dimension', toOptionalPositiveNumber(e.target.value)?.toString() ?? '')} placeholder="e.g. 200" className={variantInputCls}/>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500 block">Height / H (cm)</label>
                                        <input type="number" value={variant.pv_height} onChange={e => setVariant(index, 'pv_height', e.target.value)} onBlur={e => setVariant(index, 'pv_height', toOptionalPositiveNumber(e.target.value)?.toString() ?? '')} placeholder="e.g. 35" className={variantInputCls}/>
                                      </div>
                                    </div>
                                  </div>

                                  {/* ── Colors ── */}
                                  <div className="px-4 py-3.5 space-y-2.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Colors</p>
                                    {variant.pv_colors.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5">
                                        {variant.pv_colors.map((color, ci) => (
                                          <span key={ci} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white pl-1 pr-2 py-0.5 shadow-sm">
                                            <span className="h-4 w-4 rounded-full shrink-0 border border-slate-200" style={{ backgroundColor: color.hex }}/>
                                            <span className="text-slate-600 font-medium text-[11px]">{color.name !== color.hex ? color.name : color.hex}</span>
                                            <button type="button" onClick={() => removeVariantColor(index, ci)} className="text-slate-300 hover:text-red-500 transition-colors leading-none ml-0.5">
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                                              </svg>
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <div className="flex gap-2 items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                                      <label className="shrink-0 cursor-pointer relative group">
                                        <div
                                          className="h-9 w-9 rounded-lg border-2 border-white ring-1 ring-slate-200 group-hover:ring-teal-400 transition-all shadow-sm"
                                          style={{ backgroundColor: newColorInputs[index]?.hex ?? '#94a3b8' }}
                                        />
                                        <input
                                          type="color"
                                          value={newColorInputs[index]?.hex ?? '#94a3b8'}
                                          onChange={e => {
                                            const hex = e.target.value
                                            const currentName = newColorInputs[index]?.name ?? ''
                                            setNewColorInputs(prev => ({
                                              ...prev,
                                              [index]: { hex, name: normalizeVariantLabel(currentName) || hexToColorName(hex) },
                                            }))
                                          }}
                                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                      </label>
                                      <div className="flex-1 space-y-1">
                                        <input
                                          type="text"
                                          value={newColorInputs[index]?.name ?? ''}
                                          onChange={e => {
                                            const name = e.target.value
                                            const matchedHex = colorNameToHex(name)
                                            setNewColorInputs(prev => ({
                                              ...prev,
                                              [index]: {
                                                ...(prev[index] ?? { hex: '#94a3b8' }),
                                                name,
                                                hex: matchedHex ?? prev[index]?.hex ?? '#94a3b8',
                                              },
                                            }))
                                          }}
                                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVariantColor(index))}
                                          placeholder="Color / finish (e.g. Matte Black, Walnut Oak)"
                                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
                                        />
                                        <p className="text-[10px] text-slate-400 px-0.5">Use simple or complex labels like Black, Rose Gold, Walnut Oak, or Ash Gray.</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => addVariantColor(index)}
                                        className="shrink-0 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold transition-colors border border-teal-200"
                                      >
                                        + Add
                                      </button>
                                    </div>
                                  </div>

                                  {/* ── Pricing ── */}
                                  <div className="px-4 py-3.5 space-y-2.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pricing</p>
                                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500 block">SRP (₱)</label>
                                        <input type="number" value={variant.pv_price_srp} onChange={e => setVariant(index, 'pv_price_srp', e.target.value)} onBlur={e => setVariant(index, 'pv_price_srp', toOptionalPositiveNumber(e.target.value)?.toString() ?? '')} placeholder="0.00" className={variantInputCls}/>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500 block">Dealer (₱)</label>
                                        <input type="number" value={variant.pv_price_dp} onChange={e => setVariant(index, 'pv_price_dp', e.target.value)} onBlur={e => setVariant(index, 'pv_price_dp', toOptionalPositiveNumber(e.target.value)?.toString() ?? '')} placeholder="Inherit" className={variantInputCls}/>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500 block">Member (₱)</label>
                                        <input type="number" value={variant.pv_price_member} onChange={e => setVariant(index, 'pv_price_member', e.target.value)} onBlur={e => setVariant(index, 'pv_price_member', toOptionalPositiveNumber(e.target.value)?.toString() ?? '')} placeholder="Inherit" className={variantInputCls}/>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500 block">PV</label>
                                        <input type="number" value={variant.pv_prodpv} onChange={e => setVariant(index, 'pv_prodpv', e.target.value)} onBlur={e => setVariant(index, 'pv_prodpv', toOptionalPositiveNumber(e.target.value)?.toString() ?? '')} placeholder="Inherit" className={variantInputCls}/>
                                      </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400">Leave Dealer, Member, and PV blank to inherit from the main product values.</p>
                                  </div>

                                  {/* ── Inventory & Status ── */}
                                  <div className="px-4 py-3.5 space-y-2.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inventory & Status</p>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500 block">Stock Quantity</label>
                                        <input type="number" value={variant.pv_qty} onChange={e => setVariant(index, 'pv_qty', e.target.value)} placeholder="0" className={variantInputCls}/>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500 block">Status</label>
                                        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg gap-0.5">
                                          {[{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }].map(opt => (
                                            <button
                                              key={opt.value}
                                              type="button"
                                              onClick={() => setVariant(index, 'pv_status', opt.value)}
                                              className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                                                variant.pv_status === opt.value
                                                  ? opt.value === '1'
                                                    ? 'bg-teal-500 text-white shadow-sm'
                                                    : 'bg-white text-slate-600 shadow-sm'
                                                  : 'text-slate-400 hover:text-slate-600'
                                              }`}
                                            >
                                              {opt.label}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* ── Images ── */}
                                  <div className="px-4 py-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Images</p>
                                      <label onDragOver={preventFileDropNavigation} onDrop={handleVariantImageDrop(index)} className="inline-flex cursor-pointer items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg text-[11px] font-semibold transition-colors">
                                        <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={e => uploadVariantImages(index, e.target.files)}/>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                                        </svg>
                                        Upload Images
                                      </label>
                                    </div>
                                    {variant.pv_images.length > 0 ? (
                                      <div className="grid grid-cols-5 gap-1.5">
                                        {variant.pv_images.map((url, imageIndex) => (
                                          <div key={`${url}-${imageIndex}`} className="relative h-14 overflow-hidden rounded-lg border border-slate-200 group">
                                            <Image src={url} alt={`Variant image ${imageIndex + 1}`} fill className="object-cover" unoptimized/>
                                            <button
                                              type="button"
                                              onClick={() => setVariant(index, 'pv_images', variant.pv_images.filter((_, i) => i !== imageIndex))}
                                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                                              </svg>
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <label onDragOver={preventFileDropNavigation} onDrop={handleVariantImageDrop(index)} className="flex flex-col items-center justify-center gap-1.5 h-16 rounded-lg border-2 border-dashed border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 transition-colors cursor-pointer">
                                        <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={e => uploadVariantImages(index, e.target.files)}/>
                                        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                                        </svg>
                                        <p className="text-[11px] text-slate-400">Click or drag to upload variant images</p>
                                      </label>
                                    )}
                                  </div>

                                </div>
                              </div>
                            )
                          })
                        )}

                        <button
                          type="button"
                          onClick={addVariant}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/30 text-xs font-semibold transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                          </svg>
                          Add Variant
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* ── Sticky footer ── */}
                <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex items-center gap-3 bg-slate-50/60">
                  <p className="text-xs text-slate-400 flex-1">
                    Fields marked <span className="text-red-400 font-semibold">*</span> are required
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isBusy}
                    className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBusy || !hasChanged}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBusy ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        {isUploading ? 'Uploading…' : 'Saving…'}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
      <ImagePositionEditorModal
        isOpen={activeNewImageAdjustIndex != null}
        imageSrc={activeNewImageAdjustIndex != null ? imagePreviews[activeNewImageAdjustIndex] ?? null : null}
        fileName={activeNewImageAdjustIndex != null ? imageFiles[activeNewImageAdjustIndex]?.name : undefined}
        onClose={() => setActiveNewImageAdjustIndex(null)}
        onSave={handleApplyAdjustedNewImage}
      />
    </AnimatePresence>
  )
}
