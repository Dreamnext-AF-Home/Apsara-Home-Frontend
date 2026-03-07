'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Product, useGetProductsQuery, useDeleteProductMutation, ProductsResponse } from '@/store/api/productsApi'
import ProductsToolbar from './ProductsToolbar'
import ProductsTable from './ProductsTable'
import AddProductModal from './AddProductModal'
import EditProductModal from './EditProductModal'
import { showErrorToast, showSuccessToast } from '@/libs/toast'

interface ProductsPageMainProps {
  initialData?: ProductsResponse | null
}

export default function ProductsPageMain({ initialData = null }: ProductsPageMainProps) {
  const { data: session, status: authStatus } = useSession()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deletingIds, setDeletingIds] = useState<number[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const perPage = 25

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const hasToken = Boolean(session?.user?.accessToken)
  const skip = authStatus !== 'authenticated' || !hasToken

  const { data, isLoading, isFetching, isError } = useGetProductsQuery(
    { page, perPage, search: debouncedSearch || undefined, status: status || undefined },
    { skip },
  )

  const [deleteProduct] = useDeleteProductMutation()

  const products = useMemo(() => data?.products ?? initialData?.products ?? [], [data?.products, initialData?.products])
  const meta = useMemo(() => data?.meta ?? initialData?.meta, [data?.meta, initialData?.meta])

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleStatus = (v: string) => { setStatus(v); setPage(1) }

  useEffect(() => {
    const rowIds = new Set(products.map((p) => p.id))
    setSelectedIds((prev) => prev.filter((id) => rowIds.has(id)))
  }, [products])

  const handleDelete = async (id: number) => {
    setDeletingIds((prev) => [...prev, id])
    try {
      await deleteProduct(id).unwrap()
      setSelectedIds((prev) => prev.filter((item) => item !== id))
      showSuccessToast('Product deleted successfully.')
    } catch {
      showErrorToast('Failed to delete product.')
    } finally {
      setDeletingIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleToggleSelectAll = () => {
    const currentPageIds = products.map((p) => p.id)
    const allInPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id))
    if (allInPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    const idsToDelete = [...selectedIds]
    setDeletingIds((prev) => Array.from(new Set([...prev, ...idsToDelete])))
    try {
      await Promise.all(idsToDelete.map((id) => deleteProduct(id).unwrap()))
      setSelectedIds([])
      showSuccessToast(`${idsToDelete.length} product(s) deleted successfully.`)
    } catch {
      showErrorToast('Failed to delete selected products.')
    } finally {
      setDeletingIds((prev) => prev.filter((id) => !idsToDelete.includes(id)))
    }
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your product catalog</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-teal-500/30 shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          <span className="hidden sm:inline">Add Product</span>
        </button>
      </motion.div>

      <ProductsToolbar
        search={search} onSearch={handleSearch}
        status={status} onStatus={handleStatus}
        resultCount={meta?.total ?? products.length}
      />

      {authStatus === 'loading' ? (
        <div className="space-y-4 animate-pulse">
          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="grid grid-cols-9 gap-3 mb-3">
              {Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-3 rounded bg-slate-200"/>)}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, ri) => (
                <div key={ri} className="grid grid-cols-9 gap-3">
                  {Array.from({ length: 9 }).map((_, ci) => <div key={ci} className="h-8 rounded bg-slate-100"/>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : authStatus === 'unauthenticated' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Please sign in first to load products.</div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Failed to load products. Please try again.</div>
      ) : isLoading && !data && !initialData ? (
        <div className="space-y-4 animate-pulse">
          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="grid grid-cols-9 gap-3 mb-3">
              {Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-3 rounded bg-slate-200"/>)}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, ri) => (
                <div key={ri} className="grid grid-cols-9 gap-3">
                  {Array.from({ length: 9 }).map((_, ci) => <div key={ci} className="h-8 rounded bg-slate-100"/>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {isFetching && (
            <div className="relative h-0.5 w-full overflow-hidden bg-teal-100/60">
              <div className="animate-loading-sweep absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-transparent via-teal-500 to-transparent" />
            </div>
          )}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
              <p className="text-sm text-red-700">
                <span className="font-semibold">{selectedIds.length}</span> selected
              </p>
              <button
                onClick={handleBulkDelete}
                disabled={deletingIds.length > 0}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletingIds.length > 0 ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          )}
          <ProductsTable
            rows={products}
            currentPage={meta?.current_page ?? 1}
            totalPages={meta?.last_page ?? 1}
            totalRecords={meta?.total ?? products.length}
            from={meta?.from ?? null}
            to={meta?.to ?? null}
            onPageChange={setPage}
            onEdit={setEditProduct}
            onDelete={handleDelete}
            isDeletingIds={deletingIds}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
          />
        </div>
      )}

      <AddProductModal isOpen={showAddModal} onClose={() => setShowAddModal(false)}/>
      <EditProductModal product={editProduct} onClose={() => setEditProduct(null)}/>
    </div>
  )
}
