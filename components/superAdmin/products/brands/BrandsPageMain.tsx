'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ProductBrand,
  useCreateProductBrandMutation,
  useDeleteProductBrandMutation,
  useGetProductBrandsQuery,
  useUpdateProductBrandMutation,
} from '@/store/api/productBrandsApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'

const getRequestErrorMessage = (err: unknown, fallback: string) => {
  const data = (err as { data?: { message?: string; errors?: Record<string, string[] | string> } })?.data
  const firstFieldErrors = data?.errors
    ? Object.values(data.errors)
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    : []

  return firstFieldErrors[0] ?? data?.message ?? fallback
}

// ─── Brand Add/Edit Modal ────────────────────────────────────────────────────

interface BrandModalProps {
  title: string
  initialBrand?: ProductBrand | null
  onClose: () => void
  onSubmit: (payload: { pb_name: string; pb_image?: string | null; pb_status: number }) => Promise<void>
}

function BrandModal({ title, initialBrand = null, onClose, onSubmit }: BrandModalProps) {
  const [name, setName] = useState(initialBrand?.name ?? '')
  const [image, setImage] = useState(initialBrand?.image ?? '')
  const [status, setStatus] = useState(String(initialBrand?.status ?? 0))
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Only JPEG, PNG, WEBP, or GIF files are allowed.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Brand image must be 5MB or smaller.')
      return
    }

    setIsUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Image upload failed.')
      setImage(json.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Brand name is required.')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      await onSubmit({ pb_name: trimmedName, pb_image: image || null, pb_status: Number(status) })
    } catch (err) {
      setError(getRequestErrorMessage(err, 'Failed to save brand.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50">
                <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                <p className="text-xs text-slate-500">Manage product brand details.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Brand Name <span className="text-red-500">*</span></label>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); setError('') }}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                placeholder="e.g. AF Appliance"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Brand Image <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {image ? (
                    <Image src={image} alt={name || 'Brand image'} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-400">No Img</div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                    {image && (
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">JPEG, PNG, WEBP or GIF · Max 5MB</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ value: '0', label: 'Active', color: 'teal' }, { value: '1', label: 'Disabled', color: 'slate' }].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                      status === opt.value
                        ? opt.value === '0'
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-slate-400 bg-slate-100 text-slate-700'
                        : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : initialBrand ? 'Update Brand' : 'Add Brand'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Delete Confirmation Modal ───────────────────────────────────────────────

interface DeleteModalProps {
  brand: ProductBrand
  isDeleting: boolean
  onConfirm: () => void
  onClose: () => void
}

function DeleteConfirmModal({ brand, isDeleting, onConfirm, onClose }: DeleteModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-80 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl"
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Delete Brand</h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-800">&quot;{brand.name}&quot;</span>?
              This action cannot be undone.
            </p>
            <div className="mt-2 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left">
              <p className="text-xs text-slate-500">Brand ID: <span className="font-semibold text-slate-700">#{brand.id}</span></p>
              <p className="mt-0.5 text-xs text-slate-500">Status: <span className={`font-semibold ${brand.status === 0 ? 'text-emerald-600' : 'text-slate-500'}`}>{brand.status === 0 ? 'Active' : 'Disabled'}</span></p>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${color === 'text-slate-900' ? 'bg-slate-100' : color === 'text-emerald-600' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

type SortOption = 'name_asc' | 'name_desc' | 'id_asc' | 'id_desc'
type StatusFilter = 'all' | 'active' | 'disabled'

export default function BrandsPageMain() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name_asc')
  const [currentPage, setCurrentPage] = useState(1)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<ProductBrand | null>(null)
  const [deletingBrand, setDeletingBrand] = useState<ProductBrand | null>(null)
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null)

  const { data, isLoading, isFetching } = useGetProductBrandsQuery({ search: search.trim() || undefined })
  const [createBrand] = useCreateProductBrandMutation()
  const [updateBrand] = useUpdateProductBrandMutation()
  const [deleteBrand] = useDeleteProductBrandMutation()

  const brands = useMemo(() => data?.brands ?? [], [data?.brands])
  const totalCount = data?.total ?? 0
  const activeCount = useMemo(() => brands.filter((b) => b.status === 0).length, [brands])
  const disabledCount = useMemo(() => brands.filter((b) => b.status === 1).length, [brands])

  // Client-side filtering + sorting
  const filteredBrands = useMemo(() => {
    let result = [...brands]

    if (statusFilter === 'active') result = result.filter((b) => b.status === 0)
    else if (statusFilter === 'disabled') result = result.filter((b) => b.status === 1)

    result.sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
      if (sortBy === 'id_asc') return a.id - b.id
      if (sortBy === 'id_desc') return b.id - a.id
      return 0
    })

    return result
  }, [brands, statusFilter, sortBy])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredBrands.length / PAGE_SIZE))
  const paginatedBrands = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredBrands.slice(start, start + PAGE_SIZE)
  }, [filteredBrands, currentPage])

  // Reset page when filters change
  const handleSearch = (val: string) => { setSearch(val); setCurrentPage(1) }
  const handleStatusFilter = (val: StatusFilter) => { setStatusFilter(val); setCurrentPage(1) }
  const handleSort = (val: SortOption) => { setSortBy(val); setCurrentPage(1) }

  const handleCreateBrand = async (payload: { pb_name: string; pb_image?: string | null; pb_status: number }) => {
    await createBrand(payload).unwrap()
    showSuccessToast('Brand added successfully.')
    setShowAddModal(false)
  }

  const handleUpdateBrand = async (payload: { pb_name: string; pb_image?: string | null; pb_status: number }) => {
    if (!editingBrand) return
    await updateBrand({ id: editingBrand.id, data: payload }).unwrap()
    showSuccessToast('Brand updated successfully.')
    setEditingBrand(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingBrand) return
    setIsDeletingId(deletingBrand.id)
    try {
      await deleteBrand(deletingBrand.id).unwrap()
      showSuccessToast('Brand deleted successfully.')
      setDeletingBrand(null)
      // adjust page if last item on page was deleted
      const newTotal = filteredBrands.length - 1
      const newTotalPages = Math.max(1, Math.ceil(newTotal / PAGE_SIZE))
      if (currentPage > newTotalPages) setCurrentPage(newTotalPages)
    } catch (err) {
      showErrorToast(getRequestErrorMessage(err, 'Failed to delete brand.'))
    } finally {
      setIsDeletingId(null)
    }
  }

  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }, [totalPages, currentPage])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link href="/admin/products" className="transition hover:text-slate-600">Products</Link>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium text-slate-600">Brands</span>
          </div>
          <h1 className="mt-2 text-xl font-bold text-slate-800">Product Brands</h1>
          <p className="mt-1 text-sm text-slate-500">Manage product brands used in product dropdown selections.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
          </svg>
          Add Brand
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Brands"
          value={totalCount}
          color="text-slate-900"
          icon={
            <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
        />
        <StatCard
          label="Active Brands"
          value={activeCount}
          color="text-emerald-600"
          icon={
            <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Disabled Brands"
          value={disabledCount}
          color="text-amber-600"
          icon={
            <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
        />
      </div>

      {/* Table Card */}
      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-5">
          {/* Search */}
          <div className="relative flex-1 min-w-50 max-w-xs">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search brands..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3.5 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
            />
            {search && (
              <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 p-1">
            {(['all', 'active', 'disabled'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => handleStatusFilter(opt)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  statusFilter === opt
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value as SortOption)}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-8 text-xs font-semibold text-slate-600 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="name_asc">Name A → Z</option>
              <option value="name_desc">Name Z → A</option>
              <option value="id_asc">ID Ascending</option>
              <option value="id_desc">ID Descending</option>
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <p className="ml-auto text-xs text-slate-400">
            {isFetching ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-teal-500" />
                Refreshing...
              </span>
            ) : (
              `${filteredBrands.length} of ${totalCount} brand(s)`
            )}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Brand</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Image</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="h-4 w-32 rounded bg-slate-100" />
                      <div className="mt-1.5 h-3 w-12 rounded bg-slate-100" />
                    </td>
                    <td className="px-5 py-4"><div className="h-12 w-12 rounded-xl bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="h-6 w-16 rounded-full bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="ml-auto h-7 w-24 rounded-lg bg-slate-100" /></td>
                  </tr>
                ))
              ) : paginatedBrands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="h-10 w-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <p className="text-sm font-medium text-slate-400">No brands found</p>
                      <p className="text-xs text-slate-300">Try adjusting your search or filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBrands.map((brand, index) => (
                  <motion.tr
                    key={brand.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group transition hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{brand.name}</div>
                      <div className="mt-0.5 text-xs text-slate-400">ID #{brand.id}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/60">
                        {brand.image ? (
                          <Image src={brand.image} alt={brand.name} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-400">No Img</div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        brand.status === 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${brand.status === 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {brand.status === 0 ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingBrand(brand)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingBrand(brand)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filteredBrands.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-600">{(currentPage - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-slate-600">{Math.min(currentPage * PAGE_SIZE, filteredBrands.length)}</span> of <span className="font-semibold text-slate-600">{filteredBrands.length}</span> brands
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {pageNumbers.map((page, i) =>
                page === '...' ? (
                  <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-xs text-slate-400">…</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                      currentPage === page
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <BrandModal
          title="Add Brand"
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateBrand}
        />
      )}

      {editingBrand && (
        <BrandModal
          title="Edit Brand"
          initialBrand={editingBrand}
          onClose={() => setEditingBrand(null)}
          onSubmit={handleUpdateBrand}
        />
      )}

      {deletingBrand && (
        <DeleteConfirmModal
          brand={deletingBrand}
          isDeleting={isDeletingId === deletingBrand.id}
          onConfirm={() => void handleDeleteConfirm()}
          onClose={() => { if (isDeletingId === null) setDeletingBrand(null) }}
        />
      )}
    </div>
  )
}
