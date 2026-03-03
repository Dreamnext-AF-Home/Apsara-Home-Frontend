'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Product, ProductVariant, useUpdateProductMutation, CreateProductPayload } from '@/store/api/productsApi'
import { useGetCategoriesQuery } from '@/store/api/categoriesApi'

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
  pd_pslenght: string
  pd_psheight: string
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

const emptyVariant = (): VariantFormState => ({
  pv_sku: '',
  pv_colors: [],
  pv_size: '',
  pv_price_srp: '',
  pv_price_dp: '',
  pv_qty: '',
  pv_status: '1',
  pv_images: [],
})

const mapVariantToForm = (variant: ProductVariant): VariantFormState => ({
  id: variant.id,
  pv_sku: variant.sku ?? '',
  pv_colors: variant.colorHex
    ? [{ name: variant.colorHex, hex: variant.colorHex }]
    : variant.color
      ? [{ name: variant.color, hex: '#94a3b8' }]
      : [],
  pv_size: variant.size ?? '',
  pv_price_srp: variant.priceSrp != null ? String(variant.priceSrp) : '',
  pv_price_dp: variant.priceDp != null ? String(variant.priceDp) : '',
  pv_qty: variant.qty != null ? String(variant.qty) : '',
  pv_status: String(variant.status ?? 1),
  pv_images: Array.isArray(variant.images) ? variant.images.filter(Boolean) : [],
})

const generateSkuFromName = (name: string, productId?: number) => {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '')
  if (!letters) return ''

  const vowelsSet = new Set(['A', 'E', 'I', 'O', 'U'])
  const consonants = letters.split('').filter((ch) => !vowelsSet.has(ch))
  const vowels = letters.split('').filter((ch) => vowelsSet.has(ch))

  const prefix = [
    consonants[0] ?? letters[0] ?? 'P',
    consonants[1] ?? letters[1] ?? 'R',
    consonants[2] ?? letters[2] ?? 'D',
    vowels[0] ?? letters[3] ?? 'X',
  ].join('')

  const suffix = productId
    ? String(productId).padStart(5, '0').slice(-5)
    : Date.now().toString().slice(-5)
  return `${prefix}-${suffix}`
}

const buildVariantSku = (baseSku: string, index: number) => {
  const normalizedBase = baseSku.trim()
  const seq = String(index + 1).padStart(2, '0')
  return normalizedBase ? `${normalizedBase}-V${seq}` : `VAR-V${seq}`
}

export default function EditProductModal({ product, onClose }: EditProductModalProps) {
  const isOpen = product !== null

  const [form, setForm] = useState<FormState>({
    pd_name: '', pd_catid: '', pd_description: '', pd_price_srp: '',
    pd_price_dp: '', pd_prodpv: '', pd_qty: '', pd_weight: '', pd_psweight: '',
    pd_pslenght: '', pd_psheight: '', pd_parent_sku: '', pd_type: '0',
    pd_musthave: false, pd_bestseller: false, pd_salespromo: false, pd_verified: true, pd_status: '0',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState('')

  // Image state
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [variants, setVariants] = useState<VariantFormState[]>([])
  const [newColorInputs, setNewColorInputs] = useState<Record<number, { name: string; hex: string }>>({})

  const { data: session, status: authStatus } = useSession()
  const hasToken = Boolean(session?.user?.accessToken)
  const skipCategories = authStatus !== 'authenticated' || !hasToken

  const [updateProduct, { isLoading }] = useUpdateProductMutation()
  const { data: categoriesData } = useGetCategoriesQuery({ page: 1, per_page: 500 }, { skip: skipCategories })
  const categories = categoriesData?.categories ?? []

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      pd_parent_sku: prev.pd_name.trim() ? generateSkuFromName(prev.pd_name, product?.id) : '',
    }))
  }, [form.pd_name, product?.id])

  // Populate form when product changes
  useEffect(() => {
    if (!product) return
    setForm({
      pd_name: product.name ?? '',
      pd_catid: String(product.catid ?? ''),
      pd_description: product.description ?? '',
      pd_price_srp: String(product.priceSrp ?? ''),
      pd_price_dp: String(product.priceDp ?? ''),
      pd_prodpv: String(product.prodpv ?? ''),
      pd_qty: String(product.qty ?? ''),
      pd_weight: String(product.weight ?? ''),
      pd_psweight: '',
      pd_pslenght: '',
      pd_psheight: '',
      pd_parent_sku: generateSkuFromName(product.name ?? '', product.id),
      pd_type: String(product.type ?? 0),
      pd_musthave: product.musthave ?? false,
      pd_bestseller: product.bestseller ?? false,
      pd_salespromo: product.salespromo ?? false,
      pd_verified: product.verified ?? true,
      pd_status: String(product.status ?? 0),
    })
    const existing = Array.isArray(product.images) && product.images.length > 0
      ? product.images.filter((img): img is string => Boolean(img))
      : (product.image ? [product.image] : [])
    setExistingImageUrls(existing)
    setImageFiles([])
    setImagePreviews([])
    setUploadedUrls([])
    setVariants(Array.isArray(product.variants) ? product.variants.map(mapVariantToForm) : [])
    setNewColorInputs({})
    setErrors({})
    setServerError('')
    setImageError('')
  }, [product])

  const set = (key: keyof FormState, value: string | boolean) => {
    setForm((p) => ({ ...p, [key]: value }))
    setErrors((p) => ({ ...p, [key]: undefined }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setImageError('')
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    for (const file of files) {
      if (!allowed.includes(file.type)) { setImageError('Only JPEG, PNG, WEBP, or GIF allowed.'); return }
      if (file.size > 5 * 1024 * 1024) { setImageError('File too large. Max 5MB.'); return }
    }
    const nextFiles = [...imageFiles, ...files].slice(0, 10)
    const nextPreviews = nextFiles.map((file) => URL.createObjectURL(file))
    setImageFiles(nextFiles)
    setImagePreviews(nextPreviews)
    setUploadedUrls([])
  }

  const handleRemoveImage = (index: number) => {
    const nextFiles = imageFiles.filter((_, i) => i !== index)
    const nextPreviews = nextFiles.map((file) => URL.createObjectURL(file))
    setImageFiles(nextFiles)
    setImagePreviews(nextPreviews)
    setUploadedUrls([])
    if (nextFiles.length === 0 && fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClearAllImages = () => {
    setImageFiles([])
    setImagePreviews([])
    setUploadedUrls([])
    setImageError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveExistingImage = (index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const addVariant = () => setVariants((prev) => [...prev, emptyVariant()])
  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index))
    setNewColorInputs((prev) => {
      const next: Record<number, { name: string; hex: string }> = {}
      Object.entries(prev).forEach(([k, v]) => {
        const key = Number(k)
        if (key < index) next[key] = v
        if (key > index) next[key - 1] = v
      })
      return next
    })
  }
  const setVariant = (index: number, key: keyof VariantFormState, value: string | string[]) => {
    setVariants((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
  }
  const addVariantColor = (index: number) => {
    const hex = newColorInputs[index]?.hex ?? '#94a3b8'
    const existing = variants[index]?.pv_colors ?? []
    if (existing.some((c) => c.hex.toLowerCase() === hex.toLowerCase())) return
    setVariants((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, pv_colors: [...item.pv_colors, { name: hex, hex }] } : item,
      ),
    )
  }
  const removeVariantColor = (variantIndex: number, colorIndex: number) => {
    setVariants((prev) =>
      prev.map((item, i) =>
        i === variantIndex
          ? { ...item, pv_colors: item.pv_colors.filter((_, ci) => ci !== colorIndex) }
          : item,
      ),
    )
  }

  const uploadVariantImages = async (index: number, files: FileList | null) => {
    const picked = Array.from(files ?? [])
    if (picked.length === 0) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    for (const file of picked) {
      if (!allowed.includes(file.type)) {
        setImageError('Only JPEG, PNG, WEBP, or GIF files are allowed.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageError('File too large. Maximum size is 5MB.')
        return
      }
    }

    setIsUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of picked) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Upload failed')
        uploaded.push(json.url)
      }
      setVariants((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, pv_images: [...item.pv_images, ...uploaded] } : item,
        ),
      )
      setImageError('')
    } catch (err: unknown) {
      const ex = err as Error
      setImageError(ex.message ?? 'Variant image upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const validate = (): Errors => {
    const e: Errors = {}
    if (!form.pd_name.trim()) e.pd_name = 'Product name is required'
    if (!form.pd_catid.trim()) e.pd_catid = 'Category is required'
    if (!form.pd_price_srp.trim() || isNaN(Number(form.pd_price_srp))) e.pd_price_srp = 'Valid SRP price is required'
    if (form.pd_prodpv && isNaN(Number(form.pd_prodpv))) e.pd_prodpv = 'Must be a valid number'
    return e
  }

  const isVariantType = form.pd_type === '1'
  const expandedVariants = variants
    .filter((v) => v.pv_colors.length > 0 || v.pv_size || v.pv_sku || v.pv_images.length > 0)
    .flatMap((v, index) => {
      const autoVariantSku = buildVariantSku(form.pd_parent_sku || generateSkuFromName(form.pd_name, product?.id), index)
      const variantSku = v.pv_sku.trim() || autoVariantSku
      const base = {
        pv_sku: variantSku,
        pv_size: v.pv_size || undefined,
        pv_price_srp: v.pv_price_srp ? Number(v.pv_price_srp) : undefined,
        pv_price_dp: v.pv_price_dp ? Number(v.pv_price_dp) : undefined,
        pv_qty: v.pv_qty ? Number(v.pv_qty) : undefined,
        pv_status: Number(v.pv_status),
        pv_images: v.pv_images.length > 0 ? v.pv_images : undefined,
      }
      if (v.pv_colors.length === 0) return [base]
      return v.pv_colors.map((c) => ({ ...base, pv_color: c.name, pv_color_hex: c.hex }))
    })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!product) return
    setServerError('')
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    if (isVariantType && expandedVariants.length === 0) {
      setServerError('At least one variant is required when Product Type is Variant.')
      return
    }

    let finalImageUrls = [...existingImageUrls]

    // Upload selected images and append to existing gallery
    if (imageFiles.length > 0 && uploadedUrls.length === 0) {
      setIsUploading(true)
      try {
        const uploaded: string[] = []
        for (const file of imageFiles) {
          const fd = new FormData()
          fd.append('file', file)
          const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
          const json = await res.json()
          if (!res.ok) throw new Error(json.error ?? 'Upload failed')
          uploaded.push(json.url)
        }
        finalImageUrls = [...existingImageUrls, ...uploaded]
        setUploadedUrls(uploaded)
      } catch (err: unknown) {
        const ex = err as Error
        setImageError(ex.message ?? 'Image upload failed.')
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }

    if (imageFiles.length > 0 && uploadedUrls.length > 0) {
      finalImageUrls = [...existingImageUrls, ...uploadedUrls]
    }

    const payload: Partial<CreateProductPayload> = {
      pd_name: form.pd_name.trim(),
      pd_catid: Number(form.pd_catid),
      pd_price_srp: Number(form.pd_price_srp),
      pd_price_dp: form.pd_price_dp ? Number(form.pd_price_dp) : undefined,
      pd_prodpv: form.pd_prodpv ? Number(form.pd_prodpv) : undefined,
      pd_qty: form.pd_qty ? Number(form.pd_qty) : undefined,
      pd_weight: form.pd_weight ? Number(form.pd_weight) : undefined,
      pd_parent_sku: form.pd_parent_sku.trim() || undefined,
      pd_type: Number(form.pd_type),
      pd_musthave: form.pd_musthave,
      pd_bestseller: form.pd_bestseller,
      pd_salespromo: form.pd_salespromo,
      pd_verified: form.pd_verified,
      pd_status: Number(form.pd_status),
      pd_image: finalImageUrls[0] ?? undefined,
      pd_images: finalImageUrls.length > 0 ? finalImageUrls : undefined,
      pd_variants: isVariantType ? expandedVariants : [],
    }

    try {
      await updateProduct({ id: product.id, data: payload }).unwrap()
      onClose()
    } catch (err: unknown) {
      const ex = err as { data?: { message?: string } }
      setServerError(ex?.data?.message ?? 'Failed to update product.')
    }
  }

  const handleClose = () => {
    if (isLoading || isUploading) return
    onClose()
  }

  const textField = (label: string, key: keyof FormState, type = 'text', placeholder = '', required = false) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => {
          const value = e.target.value
          if (key === 'pd_name') {
            setForm((prev) => ({
              ...prev,
              pd_name: value,
              pd_parent_sku: value.trim() ? generateSkuFromName(value, product?.id) : '',
            }))
            setErrors((prev) => ({ ...prev, pd_name: undefined }))
            return
          }
          set(key, value)
        }}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all
          ${errors[key] ? 'border-red-300 focus:ring-red-300/30 focus:border-red-400' : 'border-slate-200 focus:ring-teal-500/30 focus:border-teal-400'}`}
      />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
    </div>
  )

  const isBusy = isLoading || isUploading
  const hasAnyImages = existingImageUrls.length > 0 || imagePreviews.length > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"/>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/30">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-slate-800 font-bold text-base leading-none">Edit Product</h2>
                      <p className="text-slate-400 text-xs mt-1">ID #{product?.id} · {product?.name}</p>
                    </div>
                  </div>
                  <button onClick={handleClose} disabled={isBusy}
                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center disabled:opacity-40">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                  {serverError && (
                    <div className="flex items-start gap-2.5 p-3 bg-red-50 rounded-xl border border-red-100">
                      <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <p className="text-xs text-red-600">{serverError}</p>
                    </div>
                  )}

                  {/* Image */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Product Image</p>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      onChange={handleImageChange} className="hidden" id="edit-product-image-input"/>

                    <div className="space-y-2">
                      <p className="text-xs text-slate-500">
                        {imagePreviews.length > 0
                          ? 'New images selected - these will be added to current gallery on save.'
                          : 'You can add multiple new images. Existing images stay unless removed below.'}
                      </p>

                      {hasAnyImages ? (
                        <div className="grid grid-cols-4 gap-2">
                          {existingImageUrls.map((url, index) => (
                            <div key={`existing-${url}-${index}`} className="relative h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                              <Image src={url} alt={`Current image ${index + 1}`} fill className="object-cover" unoptimized />
                              <button
                                type="button"
                                onClick={() => handleRemoveExistingImage(index)}
                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                                title="Remove existing image"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                              </button>
                            </div>
                          ))}
                          {imagePreviews.map((preview, index) => (
                            <div key={`new-${preview}`} className="relative h-20 rounded-lg overflow-hidden bg-slate-100 border border-emerald-300">
                              <Image src={preview} alt={`New image ${index + 1}`} fill className="object-cover" unoptimized/>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                                title="Remove new image"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-20 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                          No images yet
                        </div>
                      )}

                      <div className="flex gap-2">
                        <label htmlFor="edit-product-image-input"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          Add Images
                        </label>
                        {imagePreviews.length > 0 && (
                          <button type="button" onClick={handleClearAllImages}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-lg text-xs font-semibold transition-colors">
                            Clear New
                          </button>
                        )}
                      </div>
                      {imageError && <p className="text-red-500 text-xs">{imageError}</p>}
                    </div>
                  </div>

                  {textField('Product Name', 'pd_name', 'text', '', true)}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.pd_catid}
                        onChange={(e) => {
                          const value = e.target.value
                          setForm((prev) => ({
                            ...prev,
                            pd_catid: value,
                          }))
                          setErrors((prev) => ({ ...prev, pd_catid: undefined }))
                        }}
                        className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all cursor-pointer
                          ${errors.pd_catid ? 'border-red-300 focus:ring-red-300/30 focus:border-red-400' : 'border-slate-200 focus:ring-teal-500/30 focus:border-teal-400'}`}
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={String(category.id)}>
                            {category.name} (#{category.id})
                          </option>
                        ))}
                      </select>
                      {errors.pd_catid && <p className="text-red-500 text-xs mt-1">{errors.pd_catid}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">SKU (Auto)</label>
                      {form.pd_name.trim() ? (
                        <input
                          type="text"
                          value={form.pd_parent_sku}
                          disabled
                          className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                        />
                      ) : (
                        <div className="w-full px-3 py-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-sm text-slate-400">
                          Enter product name to generate SKU
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                    <textarea
                      value={form.pd_description}
                      onChange={(e) => set('pd_description', e.target.value)}
                      placeholder="Product description..."
                      rows={3}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {textField('SRP Price (₱)', 'pd_price_srp', 'number', '0.00', true)}
                    {textField('DP Price (₱)', 'pd_price_dp', 'number', '0.00')}
                    {textField('PV Value', 'pd_prodpv', 'number', '0')}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {textField('Quantity', 'pd_qty', 'number', '0')}
                    {textField('Weight (g)', 'pd_weight', 'number', '0')}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Product Type</label>
                      <select
                        value={form.pd_type}
                        onChange={(e) => {
                          const value = e.target.value
                          set('pd_type', value)
                          if (value !== '1') {
                            setVariants([])
                            setNewColorInputs({})
                          }
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all cursor-pointer">
                        <option value="0">Regular</option>
                        <option value="1">Variant</option>
                        <option value="2">Bundle</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                      <select value={form.pd_status} onChange={(e) => set('pd_status', e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all cursor-pointer">
                        <option value="0">Inactive (Draft)</option>
                        <option value="1">Active</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 px-3 py-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input type="checkbox" checked={form.pd_musthave} onChange={(e) => set('pd_musthave', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"/>
                      <span className="text-sm text-slate-700 font-medium">Must Have</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input type="checkbox" checked={form.pd_bestseller} onChange={(e) => set('pd_bestseller', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"/>
                      <span className="text-sm text-slate-700 font-medium">Best Seller</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input type="checkbox" checked={form.pd_salespromo} onChange={(e) => set('pd_salespromo', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-400"/>
                      <span className="text-sm text-slate-700 font-medium">On Sale</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input type="checkbox" checked={form.pd_verified} onChange={(e) => set('pd_verified', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"/>
                      <span className="text-sm text-slate-700 font-medium">Verified Product</span>
                    </label>
                  </div>

                  {isVariantType && (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Variants</p>
                      <button
                        type="button"
                        onClick={addVariant}
                        className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"
                      >
                        + Add Variant
                      </button>
                    </div>

                    {variants.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-500">
                        No variants yet. Add color/size options with their own stock, price, and photos.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {variants.map((variant, index) => (
                          <div key={`variant-${variant.id ?? index}`} className="rounded-lg border border-slate-200 bg-white p-3">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-xs font-semibold text-slate-700">Variant #{index + 1}</p>
                              <button
                                type="button"
                                onClick={() => removeVariant(index)}
                                className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="space-y-2">
                              {/* Colors */}
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Color(s)</label>
                                {variant.pv_colors.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                    {variant.pv_colors.map((color, colorIndex) => (
                                      <span
                                        key={colorIndex}
                                        title={color.hex}
                                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 pr-1.5 shadow-sm"
                                      >
                                        <span
                                          className="h-5 w-5 rounded-full shrink-0 border border-slate-200"
                                          style={{ backgroundColor: color.hex }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeVariantColor(index, colorIndex)}
                                          className="text-slate-300 hover:text-rose-500 transition-colors leading-none text-sm"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="flex gap-1.5 items-center">
                                  <input
                                    type="color"
                                    value={newColorInputs[index]?.hex ?? '#94a3b8'}
                                    onChange={(e) =>
                                      setNewColorInputs((prev) => ({
                                        ...prev,
                                        [index]: { name: '', hex: e.target.value },
                                      }))
                                    }
                                    className="h-8 w-8 shrink-0 rounded-md border border-slate-200 bg-slate-50 p-0.5 cursor-pointer"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => addVariantColor(index)}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    + Add Color
                                  </button>
                                </div>
                              </div>

                              {/* Size + SKU */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Size</label>
                                  <input
                                    value={variant.pv_size}
                                    onChange={(e) => setVariant(index, 'pv_size', e.target.value)}
                                    placeholder="e.g. Medium"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">SKU <span className="font-normal text-slate-400">(optional)</span></label>
                                  <input
                                    value={variant.pv_sku}
                                    onChange={(e) => setVariant(index, 'pv_sku', e.target.value)}
                                    placeholder="Auto-generated if empty"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
                                  />
                                </div>
                              </div>

                              {/* SRP + DP */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">SRP Price (₱)</label>
                                  <input
                                    type="number"
                                    value={variant.pv_price_srp}
                                    onChange={(e) => setVariant(index, 'pv_price_srp', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">DP Price (₱)</label>
                                  <input
                                    type="number"
                                    value={variant.pv_price_dp}
                                    onChange={(e) => setVariant(index, 'pv_price_dp', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
                                  />
                                </div>
                              </div>

                              {/* Stock + Status */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Stock</label>
                                  <input
                                    type="number"
                                    value={variant.pv_qty}
                                    onChange={(e) => setVariant(index, 'pv_qty', e.target.value)}
                                    placeholder="0"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
                                  <select
                                    value={variant.pv_status}
                                    onChange={(e) => setVariant(index, 'pv_status', e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
                                  >
                                    <option value="1">Active</option>
                                    <option value="0">Inactive</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Variant Images */}
                            <div className="mt-3 border-t border-slate-100 pt-3">
                              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors">
                                <input
                                  type="file"
                                  multiple
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  className="hidden"
                                  onChange={(e) => uploadVariantImages(index, e.target.files)}
                                />
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                Add Images
                              </label>
                              {variant.pv_images.length > 0 && (
                                <div className="mt-2 grid grid-cols-5 gap-2">
                                  {variant.pv_images.map((url, imageIndex) => (
                                    <div key={`${url}-${imageIndex}`} className="relative h-16 overflow-hidden rounded-md border border-slate-200">
                                      <Image src={url} alt={`Variant ${index + 1} image ${imageIndex + 1}`} fill className="object-cover" unoptimized />
                                      <button
                                        type="button"
                                        onClick={() => setVariant(index, 'pv_images', variant.pv_images.filter((_, i) => i !== imageIndex))}
                                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60"
                                      >
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={handleClose} disabled={isBusy}
                      className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
                      Cancel
                    </button>
                    <button type="submit" disabled={isBusy}
                      className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-60">
                      {isBusy ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          {isUploading ? 'Uploading...' : 'Saving...'}
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
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
