'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Product, ProductVariant, useUpdateProductMutation, CreateProductPayload } from '@/store/api/productsApi'
import { useGetCategoriesQuery } from '@/store/api/categoriesApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import RichTextEditor from '@/components/ui/RichTextEditor'
import { hexToColorName } from '@/libs/colorUtils'

/* ─── types ──────────────────────────────────────────────── */

interface EditProductModalProps {
  product: Product | null
  onClose: () => void
}

interface FormState {
  pd_name: string
  pd_catid: string
  pd_description: string
  pd_price_srp: string
  pd_price_dp: string
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
  pv_sku: string
  pv_colors: VariantColor[]
  pv_size: string
  pv_price_srp: string
  pv_price_dp: string
  pv_qty: string
  pv_status: string
  pv_images: string[]
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

/* ─── helpers ────────────────────────────────────────────── */

const emptyVariant = (): VariantFormState => ({
  pv_sku: '', pv_colors: [], pv_size: '',
  pv_price_srp: '', pv_price_dp: '', pv_qty: '',
  pv_status: '1', pv_images: [],
})

const mapVariantToForm = (variant: ProductVariant): VariantFormState => ({
  id: variant.id,
  pv_sku: variant.sku ?? '',
  pv_colors: variant.colorHex
    ? [{ name: variant.color ?? variant.colorHex, hex: variant.colorHex }]
    : variant.color
      ? [{ name: variant.color, hex: '#94a3b8' }]
      : [],
  pv_size: variant.size ?? '',
  pv_price_srp: variant.priceSrp != null ? String(variant.priceSrp) : '',
  pv_price_dp:  variant.priceDp  != null ? String(variant.priceDp)  : '',
  pv_qty:       variant.qty      != null ? String(variant.qty)      : '',
  pv_status: String(variant.status ?? 1),
  pv_images: Array.isArray(variant.images) ? variant.images.filter(Boolean) : [],
})

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
    <div className="space-y-1.5">
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

/* ─── main component ─────────────────────────────────────── */

export default function EditProductModal({ product, onClose }: EditProductModalProps) {
  const isOpen = product !== null

  const [form, setForm] = useState<FormState>({
    pd_name: '', pd_catid: '', pd_description: '', pd_price_srp: '',
    pd_price_dp: '', pd_prodpv: '', pd_qty: '', pd_weight: '', pd_psweight: '',
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
  const [isUploading,        setIsUploading]        = useState(false)
  const [uploadedUrls,       setUploadedUrls]       = useState<string[]>([])
  const [imageError,         setImageError]         = useState('')
  const [variants,           setVariants]           = useState<VariantFormState[]>([])
  const [newColorInputs,     setNewColorInputs]     = useState<Record<number, { name: string; hex: string }>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: session, status: authStatus } = useSession()
  const hasToken       = Boolean(session?.user?.accessToken)
  const skipCategories = authStatus !== 'authenticated' || !hasToken

  const [updateProduct, { isLoading }] = useUpdateProductMutation()
  const { data: categoriesData } = useGetCategoriesQuery({ page: 1, per_page: 500 }, { skip: skipCategories })
  const categories = categoriesData?.categories ?? []

  /* Populate form when product changes */
  useEffect(() => {
    if (!product) return
    const row = product as Product & Record<string, unknown>
    setForm({
      pd_name:       product.name        ?? '',
      pd_catid:      String(product.catid ?? ''),
      pd_description:product.description ?? '',
      pd_price_srp:  String(product.priceSrp ?? ''),
      pd_price_dp:   String(product.priceDp  ?? ''),
      pd_prodpv:     String(product.prodpv   ?? ''),
      pd_qty:        String(product.qty      ?? ''),
      pd_weight:     String(product.weight   ?? ''),
      pd_psweight:   String(row.psweight  ?? row.pd_psweight  ?? ''),
      pd_pswidth:    String(row.pswidth   ?? row.pd_pswidth   ?? ''),
      pd_pslenght:   String(row.pslenght  ?? row.pd_pslenght  ?? ''),
      pd_psheight:   String(row.psheight  ?? row.pd_psheight  ?? ''),
      pd_material:   String(row.material  ?? row.pd_material  ?? ''),
      pd_warranty:   String(row.warranty  ?? row.pd_warranty  ?? ''),
      pd_assembly_required: Boolean(row.assemblyRequired ?? row.pd_assembly_required),
      pd_parent_sku: generateSkuFromName(product.name ?? '', product.id),
      pd_type:       String(product.type   ?? 0),
      pd_musthave:   product.musthave    ?? false,
      pd_bestseller: product.bestseller  ?? false,
      pd_salespromo: product.salespromo  ?? false,
      pd_verified:   product.verified    ?? true,
      pd_status:     String(product.status ?? 0),
    })
    const existing = Array.isArray(product.images) && product.images.length > 0
      ? product.images.filter((img): img is string => Boolean(img))
      : (product.image ? [product.image] : [])
    setExistingImageUrls(existing)
    setImageFiles([]); setImagePreviews([]); setUploadedUrls([])
    setVariants(Array.isArray(product.variants) ? product.variants.map(mapVariantToForm) : [])
    setNewColorInputs({})
    setErrors({}); setServerError(''); setImageError('')
  }, [product])

  const set = (key: keyof FormState, value: string | boolean) => {
    setForm(p => ({ ...p, [key]: value }))
    setErrors(p => ({ ...p, [key]: undefined }))
  }

  const hasVariants = form.pd_type === '1'

  /* ── image handlers ── */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setImageError('')
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    for (const file of files) {
      if (!allowed.includes(file.type)) { setImageError('Only JPEG, PNG, WEBP, or GIF allowed.'); return }
      if (file.size > 5 * 1024 * 1024) { setImageError('File too large. Max 5MB.'); return }
    }
    const next = [...imageFiles, ...files].slice(0, 10)
    setImageFiles(next)
    setImagePreviews(next.map(f => URL.createObjectURL(f)))
    setUploadedUrls([])
  }

  const handleRemoveImage         = (index: number) => {
    const next = imageFiles.filter((_, i) => i !== index)
    setImageFiles(next)
    setImagePreviews(next.map(f => URL.createObjectURL(f)))
    setUploadedUrls([])
    if (!next.length && fileInputRef.current) fileInputRef.current.value = ''
  }
  const handleRemoveExistingImage = (index: number) =>
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index))
  const handleClearNewImages      = () => {
    setImageFiles([]); setImagePreviews([]); setUploadedUrls([])
    setImageError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
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
    const name = newColorInputs[index]?.name?.trim() || hex  // fix: use typed name, fallback to hex
    const existing = variants[index]?.pv_colors ?? []
    if (existing.some(c => c.hex.toLowerCase() === hex.toLowerCase())) return
    setVariants(prev =>
      prev.map((item, i) => i === index ? { ...item, pv_colors: [...item.pv_colors, { name, hex }] } : item),
    )
    setNewColorInputs(prev => ({ ...prev, [index]: { name: '', hex: '#94a3b8' } }))  // reset after add
  }

  const removeVariantColor = (variantIndex: number, colorIndex: number) =>
    setVariants(prev =>
      prev.map((item, i) =>
        i === variantIndex ? { ...item, pv_colors: item.pv_colors.filter((_, ci) => ci !== colorIndex) } : item,
      ),
    )

  const uploadVariantImages = async (index: number, files: FileList | null) => {
    const picked = Array.from(files ?? [])
    if (!picked.length) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    for (const file of picked) {
      if (!allowed.includes(file.type)) { setImageError('Only JPEG, PNG, WEBP, or GIF files are allowed.'); return }
      if (file.size > 5 * 1024 * 1024) { setImageError('File too large. Maximum size is 5MB.'); return }
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
      setImageError((err as Error).message ?? 'Variant image upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  /* ── validation ── */
  const validate = (): Errors => {
    const e: Errors = {}
    if (!form.pd_name.trim())                                           e.pd_name      = 'Product name is required'
    if (!form.pd_catid.trim())                                          e.pd_catid     = 'Category is required'
    if (!form.pd_price_srp.trim() || isNaN(Number(form.pd_price_srp))) e.pd_price_srp = 'Valid SRP price is required'
    if (form.pd_price_dp && isNaN(Number(form.pd_price_dp)))           e.pd_price_dp  = 'Must be a valid number'
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
    .filter(v => v.pv_colors.length > 0 || v.pv_size || v.pv_sku || v.pv_images.length > 0)
    .flatMap((v, index) => {
      const autoSku    = buildVariantSku(form.pd_parent_sku || generateSkuFromName(form.pd_name, product?.id), index)
      const variantSku = v.pv_sku.trim() || autoSku
      const base = {
        pv_sku:       variantSku,
        pv_size:      v.pv_size || undefined,
        pv_price_srp: v.pv_price_srp ? Number(v.pv_price_srp) : undefined,
        pv_price_dp:  v.pv_price_dp  ? Number(v.pv_price_dp)  : undefined,
        pv_qty:       v.pv_qty       ? Number(v.pv_qty)       : undefined,
        pv_status:    Number(v.pv_status),
        pv_images:    v.pv_images.length > 0 ? v.pv_images : undefined,
      }
      if (!v.pv_colors.length) return [base]
      return v.pv_colors.map(c => ({ ...base, pv_color: c.name, pv_color_hex: c.hex }))
    })

  /* ── submit ── */
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!product) return
    setServerError('')
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    if (hasVariants && expandedVariants.length === 0) {
      setServerError('At least one variant is required when Has Variants is enabled.')
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
        setUploadedUrls(uploaded)
      } catch (err: unknown) {
        setImageError((err as Error).message ?? 'Image upload failed.')
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }
    if (imageFiles.length > 0 && uploadedUrls.length > 0) {
      finalImageUrls = [...existingImageUrls, ...uploadedUrls]
    }

    const payload: Partial<CreateProductPayload> = {
      pd_name:        form.pd_name.trim(),
      pd_catid:       Number(form.pd_catid),
      pd_price_srp:   Number(form.pd_price_srp),
      pd_description: form.pd_description.trim() || undefined,
      pd_price_dp:    form.pd_price_dp  ? Number(form.pd_price_dp)  : undefined,
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
      pd_parent_sku:  form.pd_parent_sku.trim() || undefined,
      pd_type:        Number(form.pd_type),
      pd_musthave:    form.pd_musthave,
      pd_bestseller:  form.pd_bestseller,
      pd_salespromo:  form.pd_salespromo,
      pd_verified:    form.pd_verified,
      pd_status:      Number(form.pd_status),
      pd_image:           finalImageUrls[0] ?? undefined,
      pd_images:          finalImageUrls.length > 0 ? finalImageUrls : undefined,
      pd_variants:        hasVariants ? expandedVariants : [],
    }

    try {
      await updateProduct({ id: product.id, data: payload }).unwrap()
      showSuccessToast('Product updated successfully.')
      onClose()
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to update product.'
      setServerError(message)
      showErrorToast(message)
    }
  }

  const handleClose = () => { if (isLoading || isUploading) return; onClose() }
  const isBusy      = isLoading || isUploading
  const hasAnyImages = existingImageUrls.length > 0 || imagePreviews.length > 0

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
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

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

                  {hasAnyImages ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-2">
                        {/* Existing images */}
                        {existingImageUrls.map((url, index) => (
                          <div key={`existing-${index}`} className="relative h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                            <Image src={url} alt={`Image ${index + 1}`} fill className="object-cover" unoptimized/>
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
                          </div>
                        ))}
                        {/* New (pending upload) images */}
                        {imagePreviews.map((preview, index) => (
                          <div key={`new-${index}`} className="relative h-24 rounded-xl overflow-hidden bg-slate-100 border-2 border-emerald-400 group">
                            <Image src={preview} alt={`New ${index + 1}`} fill className="object-cover" unoptimized/>
                            <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-md">New</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                        ))}
                        {/* Add more slot */}
                        {existingImageUrls.length + imagePreviews.length < 10 && (
                          <label htmlFor="edit-product-image-input" className="flex flex-col items-center justify-center gap-1 h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                            </svg>
                            <span className="text-[10px] text-slate-400 font-medium">Add More</span>
                          </label>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-slate-400 flex-1">
                          {existingImageUrls.length} saved · {imagePreviews.length} pending upload
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
                      className="flex flex-col items-center justify-center gap-2 w-full h-36 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all group"
                    >
                      <div className="h-10 w-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors">Click to upload images</p>
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
                          pd_parent_sku: value.trim() ? generateSkuFromName(value, product?.id) : '',
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
                        onChange={e => { set('pd_catid', e.target.value) }}
                        className={inputCls(!!errors.pd_catid)}
                      >
                        <option value="">Select category…</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="SKU (auto-generated)">
                      {form.pd_name.trim() ? (
                        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
                          </svg>
                          <span className="text-sm font-mono text-slate-600 truncate">{form.pd_parent_sku}</span>
                        </div>
                      ) : (
                        <div className="px-3.5 py-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-sm text-slate-400 italic">
                          Auto-generated from name
                        </div>
                      )}
                    </Field>
                  </div>

                  <Field label="Description">
                    <RichTextEditor
                      value={form.pd_description}
                      onChange={html => set('pd_description', html)}
                    />
                  </Field>

                  {/* ── Section: Product Details ── */}
                  <SectionLabel>Product Details</SectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Material">
                      <input type="text" value={form.pd_material} onChange={e => set('pd_material', e.target.value)} placeholder="e.g. Solid Wood & Fabric" className={inputCls()}/>
                    </Field>
                    <Field label="Warranty">
                      <input type="text" value={form.pd_warranty} onChange={e => set('pd_warranty', e.target.value)} placeholder="e.g. 1 Year Limited Warranty" className={inputCls()}/>
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
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="SRP Price (₱)" required error={errors.pd_price_srp}>
                      <input type="number" value={form.pd_price_srp} onChange={e => set('pd_price_srp', e.target.value)} placeholder="0.00" className={inputCls(!!errors.pd_price_srp)}/>
                    </Field>
                    <Field label="Dealer Price (₱)" error={errors.pd_price_dp}>
                      <input type="number" value={form.pd_price_dp} onChange={e => set('pd_price_dp', e.target.value)} placeholder="0.00" className={inputCls(!!errors.pd_price_dp)}/>
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
                    <Field label="Depth / D (cm)" error={errors.pd_pslenght}>
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
                                      Variant #{index + 1}
                                      {variant.pv_size && <span className="text-slate-400 font-normal ml-1">· {variant.pv_size}</span>}
                                      {variant.pv_colors.length > 0 && (
                                        <span className="inline-flex items-center gap-1 ml-2">
                                          {variant.pv_colors.slice(0, 3).map((c, ci) => (
                                            <span key={ci} className="h-3 w-3 rounded-full border border-slate-200 shrink-0" style={{ backgroundColor: c.hex }} title={c.name}/>
                                          ))}
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

                                <div className="p-4 space-y-4">
                                  {/* Colors */}
                                  <div className="space-y-2">
                                    <label className="text-[11px] font-semibold text-slate-500 block">Colors</label>
                                    {variant.pv_colors.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5">
                                        {variant.pv_colors.map((color, ci) => (
                                          <span key={ci} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white pl-1 pr-2 py-0.5 shadow-sm text-xs">
                                            <span className="h-4 w-4 rounded-full shrink-0 border border-slate-200" style={{ backgroundColor: color.hex }}/>
                                            <span className="text-slate-600 font-medium text-[11px]">
                                              {color.name !== color.hex ? color.name : color.hex}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => removeVariantColor(index, ci)}
                                              className="text-slate-300 hover:text-red-500 transition-colors leading-none ml-0.5"
                                            >
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                                              </svg>
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <div className="flex gap-1.5 items-center">
                                      <input
                                        type="color"
                                        value={newColorInputs[index]?.hex ?? '#94a3b8'}
                                        onChange={e => {
                                          const hex = e.target.value
                                          const currentName = newColorInputs[index]?.name ?? ''
                                          setNewColorInputs(prev => ({
                                            ...prev,
                                            [index]: {
                                              hex,
                                              name: currentName.trim() ? currentName : hexToColorName(hex),
                                            },
                                          }))
                                        }}
                                        className="h-8 w-8 shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5 cursor-pointer"
                                      />
                                      <input
                                        type="text"
                                        value={newColorInputs[index]?.name ?? ''}
                                        onChange={e => setNewColorInputs(prev => ({
                                          ...prev, [index]: { ...(prev[index] ?? { hex: '#94a3b8' }), name: e.target.value },
                                        }))}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVariantColor(index))}
                                        placeholder="Color name (e.g. Midnight Blue)"
                                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => addVariantColor(index)}
                                        className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
                                      >
                                        + Add
                                      </button>
                                    </div>
                                  </div>

                                  {/* Size + SKU */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-semibold text-slate-500 block">Size</label>
                                      <input value={variant.pv_size} onChange={e => setVariant(index, 'pv_size', e.target.value)} placeholder="e.g. Medium, XL" className={variantInputCls}/>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-semibold text-slate-500 block">SKU <span className="font-normal text-slate-400">(optional)</span></label>
                                      <input value={variant.pv_sku} onChange={e => setVariant(index, 'pv_sku', e.target.value)} placeholder={autoSku} className={variantInputCls}/>
                                    </div>
                                  </div>

                                  {/* SRP + DP */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-semibold text-slate-500 block">SRP Price (₱)</label>
                                      <input type="number" value={variant.pv_price_srp} onChange={e => setVariant(index, 'pv_price_srp', e.target.value)} placeholder="0.00" className={variantInputCls}/>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-semibold text-slate-500 block">Dealer Price (₱)</label>
                                      <input type="number" value={variant.pv_price_dp} onChange={e => setVariant(index, 'pv_price_dp', e.target.value)} placeholder="0.00" className={variantInputCls}/>
                                    </div>
                                  </div>

                                  {/* Stock + Status */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-semibold text-slate-500 block">Stock</label>
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
                                                ? 'bg-white text-slate-700 shadow-sm'
                                                : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                          >
                                            {opt.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Variant Images */}
                                  <div className="border-t border-slate-100 pt-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[11px] font-semibold text-slate-500">Variant Images</label>
                                      <label className="inline-flex cursor-pointer items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg text-[11px] font-semibold transition-colors">
                                        <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={e => uploadVariantImages(index, e.target.files)}/>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                                        </svg>
                                        Upload
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
                                      <p className="text-[11px] text-slate-400 italic">No images uploaded yet</p>
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
                    disabled={isBusy}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm shadow-blue-500/30 disabled:opacity-60"
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
    </AnimatePresence>
  )
}
