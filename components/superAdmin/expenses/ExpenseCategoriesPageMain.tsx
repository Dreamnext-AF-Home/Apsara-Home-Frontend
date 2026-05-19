'use client'

import { FormEvent, useMemo, useState } from 'react'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import {
  ExpenseCategory,
  useCreateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
  useGetExpenseCategoriesQuery,
  useUpdateExpenseCategoryMutation,
} from '@/store/api/expenseCategoriesApi'

type CategoryFormState = {
  name: string
  description: string
  status: number
}

const emptyForm: CategoryFormState = {
  name: '',
  description: '',
  status: 1,
}

const getApiMessage = (error: unknown, fallback: string) => {
  const apiError = error as {
    data?: {
      message?: string
      errors?: Record<string, string[]>
    }
  }

  const firstValidation = apiError?.data?.errors
    ? Object.values(apiError.data.errors).flat()[0]
    : undefined

  return firstValidation || apiError?.data?.message || fallback
}

export default function ExpenseCategoriesPageMain() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [form, setForm] = useState<CategoryFormState>(emptyForm)

  const { data, isLoading, isFetching, isError } = useGetExpenseCategoriesQuery({
    search: search.trim() || undefined,
  })

  const [createCategory, { isLoading: isCreating }] = useCreateExpenseCategoryMutation()
  const [updateCategory, { isLoading: isUpdating }] = useUpdateExpenseCategoryMutation()
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteExpenseCategoryMutation()

  const categories = data?.categories ?? []
  const activeCount = useMemo(() => categories.filter((category) => category.status === 1).length, [categories])

  const openAddModal = () => {
    setEditingCategory(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEditModal = (category: ExpenseCategory) => {
    setEditingCategory(category)
    setForm({
      name: category.name || '',
      description: category.description || '',
      status: category.status ?? 1,
    })
    setFormOpen(true)
  }

  const closeModal = () => {
    if (isCreating || isUpdating) return
    setFormOpen(false)
    setEditingCategory(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
    }

    if (!payload.name) {
      showErrorToast('Expense category name is required.')
      return
    }

    try {
      if (editingCategory) {
        const response = await updateCategory({
          id: editingCategory.id,
          data: payload,
        }).unwrap()
        showSuccessToast(response.message || 'Expense category updated.')
      } else {
        const response = await createCategory(payload).unwrap()
        showSuccessToast(response.message || 'Expense category created.')
      }

      closeModal()
    } catch (error) {
      showErrorToast(getApiMessage(error, 'Failed to save expense category.'))
    }
  }

  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategory | null>(null)

  const closeDeleteModal = () => setDeleteTarget(null)

  const handleDelete = async (category: ExpenseCategory) => {
    setDeleteTarget(category)
  }

  const confirmDeleteNow = async () => {
    if (!deleteTarget) return

    try {
      const response = await deleteCategory(deleteTarget.id).unwrap()
      showSuccessToast(response.message || 'Expense category deleted.')
      closeDeleteModal()
    } catch (error) {
      showErrorToast(getApiMessage(error, 'Failed to delete expense category.'))
    }
  }


  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-24 -top-20 h-52 w-52 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amber-200/35 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">Expenses</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Expense Categories</h1>
              <p className="mt-2 text-sm text-slate-600">
                Add and manage expense types used by accounting entries.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
            >
              + Add Category
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{categories.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Active</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Inactive</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{Math.max(0, categories.length - activeCount)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search expense category..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800"
            />
          </div>
          <p className="text-xs text-slate-500">{isFetching ? 'Refreshing...' : `${categories.length} categories`}</p>
        </div>

        {isError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Failed to load expense categories.
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-base font-semibold text-slate-700">No expense categories yet</p>
            <p className="mt-1 text-sm text-slate-500">Create one to start organizing expense entries.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <article
                key={category.id}
                className={
                  "group relative overflow-hidden rounded-2xl border p-4 " +
                  (category.status === 1
                    ? 'border-emerald-200/80 bg-emerald-50/40'
                    : 'border-amber-200/80 bg-amber-50/40')
                }
              >
                <div
                  aria-hidden="true"
                  className={
                    "pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full blur-2xl transition-transform duration-300 " +
                    (category.status === 1
                      ? 'bg-emerald-200/60 group-hover:translate-x-6 group-hover:translate-y-4'
                      : 'bg-amber-200/60 group-hover:translate-x-6 group-hover:translate-y-4')
                  }
                />

                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{category.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">ID #{category.id}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      category.status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {category.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="relative mt-3 min-h-12 text-sm text-slate-600">
                  {category.description || 'No description provided.'}
                </p>

                <div className="relative mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(category)}
                    title="Edit expense category"
                    aria-label="Edit expense category"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white/70 text-slate-700 shadow-sm transition hover:bg-white group-hover:border-slate-400"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    disabled={isDeleting}
                    title="Delete expense category"
                    aria-label="Delete expense category"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white/70 text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-60"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingCategory ? 'Edit Expense Category' : 'Add Expense Category'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
              <label className="block text-sm text-slate-700">
                Category Name
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800"
                  placeholder="e.g. Office Supplies"
                  maxLength={120}
                  required
                />
              </label>

              <label className="block text-sm text-slate-700">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="mt-1 h-24 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800"
                  placeholder="Optional details about this expense type..."
                  maxLength={500}
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.status === 1}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.checked ? 1 : 0 }))}
                />
                Active category
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isCreating || isUpdating ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-xl dark:border-red-500/20 dark:bg-slate-950">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-500">Confirm Delete</p>
            <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">Remove expense category?</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              This will permanently remove <span className="font-semibold text-slate-900 dark:text-slate-100">{deleteTarget.name}</span>.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteNow()}
                disabled={isDeleting}
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

