'use client'

import { FormEvent, useMemo, useState } from 'react'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import {
  Expense,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useGetExpensesQuery,
  useLazyGetExpensesQuery,
  useUpdateExpenseMutation,
} from '@/store/api/expensesApi'
import { useGetExpenseCategoriesQuery } from '@/store/api/expenseCategoriesApi'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(value || 0)

const formatDateShort = (value?: string | null) => {
  if (!value) return ''

  const raw = String(value).trim()
  // Prefer the date part to avoid timezone shifts (e.g. ISO strings).
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      const d = new Date(year, month - 1, day)
      return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(d)
    }
  }

  const fallback = new Date(raw)
  if (Number.isNaN(fallback.getTime())) return raw
  return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(fallback)
}

const todayKey = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const getApiMessage = (error: unknown, fallback: string) => {
  const apiError = error as {
    data?: {
      message?: string
      errors?: Record<string, string[]>
    }
  }

  const firstValidation = apiError?.data?.errors ? Object.values(apiError.data.errors).flat()[0] : undefined
  return firstValidation || apiError?.data?.message || fallback
}

const csvEscape = (value: unknown) => {
  const str = value == null ? '' : String(value)
  return `"${str.replace(/"/g, '""')}"`
}

type FormState = {
  category_id: number
  sub_category_name: string
  invoice_url: string
  invoice_file: File | null
  remove_invoice: boolean
  amount: string
  transaction_date: string
  intent: string
  status: number
}

const emptyForm = (): FormState => ({
  category_id: 0,
  sub_category_name: '',
  invoice_url: '',
  invoice_file: null,
  remove_invoice: false,
  amount: '',
  transaction_date: todayKey(),
  intent: '',
  status: 1,
})

export default function ExpensesPageMain() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(0)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [isExporting, setIsExporting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [invoicePreviewUrl, setInvoicePreviewUrl] = useState<string | null>(null)
  const [forceIframePreview, setForceIframePreview] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [invoiceFileInputKey, setInvoiceFileInputKey] = useState(0)
  const [form, setForm] = useState<FormState>(emptyForm())

  const { data: categoriesData } = useGetExpenseCategoriesQuery()
  const categories = useMemo(
    () => (categoriesData?.categories ?? []).filter((category) => (category.status ?? 1) === 1),
    [categoriesData],
  )

  const { data, isLoading, isFetching, isError, error: loadError } = useGetExpensesQuery({
    categoryId: selectedCategoryId > 0 ? selectedCategoryId : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    perPage,
  })

  const expenses = data?.expenses ?? []
  const totalRecords = data?.total ?? 0
  const currentPage = data?.current_page ?? page
  const lastPage = Math.max(1, data?.last_page ?? 1)
  const totalAmount = useMemo(() => {
    if (typeof data?.filtered_total_amount === 'number') return data.filtered_total_amount
    return expenses.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  }, [data?.filtered_total_amount, expenses])

  const loadErrorMessage = useMemo(() => {
    if (!loadError) return null
    const err = loadError as { status?: number; data?: { message?: string } | string }
    const status = typeof err.status === 'number' ? err.status : undefined
    const message =
      typeof err.data === 'string'
        ? err.data
        : (err.data as { message?: string } | undefined)?.message

    if (status === 401) return 'Your session expired. Please refresh the page or sign in again.'
    if (status === 403) return message || 'You do not have access to view expenses.'
    return message || 'Failed to load expenses.'
  }, [loadError])

  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation()
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation()
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation()
  const [triggerGetExpenses] = useLazyGetExpensesQuery()

  const openAdd = () => {
    setEditing(null)
    setForm((prev) => {
      const next = emptyForm()
      const firstCategory = categories[0]
      if (firstCategory) next.category_id = firstCategory.id
      return { ...next, transaction_date: prev.transaction_date || next.transaction_date }
    })
    setModalOpen(true)
  }

  const openEdit = (row: Expense) => {
    setEditing(row)
    setForm({
      category_id: row.category_id,
      sub_category_name: row.sub_category_name || '',
      invoice_url: row.invoice_url || '',
      invoice_file: null,
      remove_invoice: false,
      amount: String(row.amount ?? ''),
      transaction_date: row.transaction_date || todayKey(),
      intent: row.intent || '',
      status: row.status ?? 1,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    if (isCreating || isUpdating) return
    setModalOpen(false)
    setEditing(null)
    setInvoiceFileInputKey((prev) => prev + 1)
    setForm(emptyForm())
  }

  const toPayload = (): FormData | null => {
    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount < 0) {
      showErrorToast('Amount must be a valid number.')
      return null
    }
    if (!form.category_id || form.category_id <= 0) {
      showErrorToast('Please select a category.')
      return null
    }
    if (!form.transaction_date) {
      showErrorToast('Transaction date is required.')
      return null
    }
    if (!form.intent.trim()) {
      showErrorToast('Intent is required.')
      return null
    }

    const payload = new FormData()
    payload.append('category_id', String(form.category_id))
    payload.append('sub_category_name', form.sub_category_name.trim())
    payload.append('amount', String(amount))
    payload.append('transaction_date', form.transaction_date)
    payload.append('intent', form.intent.trim())
    payload.append('status', String(form.status))
    payload.append('remove_invoice', form.remove_invoice ? '1' : '0')
    payload.append('invoice_url', form.remove_invoice ? '' : form.invoice_url.trim())
    if (!form.remove_invoice && form.invoice_file) {
      payload.append('invoice_file', form.invoice_file)
    }

    return payload
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payload = toPayload()
    if (!payload) return

    try {
      if (editing) {
        const response = await updateExpense({ id: editing.id, data: payload }).unwrap()
        showSuccessToast(response.message || 'Expense updated.')
      } else {
        const response = await createExpense(payload).unwrap()
        showSuccessToast(response.message || 'Expense created.')
      }
      closeModal()
    } catch (error) {
      showErrorToast(getApiMessage(error, 'Failed to save expense.'))
    }
  }

  const handleDelete = async (row: Expense) => {
    const ok = window.confirm(
      `Delete this expense?\n\n${row.category?.name || 'Category'} • ${formatMoney(row.amount)} • ${formatDateShort(row.transaction_date)}`,
    )
    if (!ok) return

    try {
      const response = await deleteExpense(row.id).unwrap()
      showSuccessToast(response.message || 'Expense deleted.')
    } catch (error) {
      showErrorToast(getApiMessage(error, 'Failed to delete expense.'))
    }
  }

  const handleExport = async () => {
    if (isExporting) return
    try {
      setIsExporting(true)
      const exportPerPage = 100
      const allRows: Expense[] = []

      const firstPage = await triggerGetExpenses(
        {
          categoryId: selectedCategoryId > 0 ? selectedCategoryId : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page: 1,
          perPage: exportPerPage,
        },
        true,
      ).unwrap()

      allRows.push(...(firstPage.expenses ?? []))
      const last = Math.max(1, firstPage.last_page ?? 1)

      for (let p = 2; p <= last; p += 1) {
        const next = await triggerGetExpenses(
          {
            categoryId: selectedCategoryId > 0 ? selectedCategoryId : undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            page: p,
            perPage: exportPerPage,
          },
          true,
        ).unwrap()
        allRows.push(...(next.expenses ?? []))
      }

      if (allRows.length === 0) {
        showErrorToast('No expenses to export for current filters.')
        return
      }

      const header = ['ID', 'Category', 'Sub-category', 'Intent', 'Amount', 'Transaction Date', 'Invoice URL', 'Status']
      const lines = [
        header.map(csvEscape).join(','),
        ...allRows.map((row) =>
          [
            row.id,
            row.category?.name ?? '',
            row.sub_category_name ?? '',
            row.intent ?? '',
            Number(row.amount ?? 0).toFixed(2),
            row.transaction_date ?? '',
            row.invoice_url ?? '',
            row.status === 1 ? 'Active' : 'Inactive',
          ]
            .map(csvEscape)
            .join(','),
        ),
      ]

      const csv = '\uFEFF' + lines.join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
      a.href = url
      a.download = `expenses-export-${stamp}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      showSuccessToast(`Exported ${allRows.length} expense record(s).`)
    } catch (error) {
      showErrorToast(getApiMessage(error, 'Failed to export expenses.'))
    } finally {
      setIsExporting(false)
    }
  }

  const closeInvoicePreview = () => {
    setInvoicePreviewUrl(null)
    setForceIframePreview(false)
  }

  const resolveInvoiceUrl = (rawUrl: string): string => {
    const value = String(rawUrl || '').trim()
    if (!value) return ''
    if (/^https?:\/\//i.test(value)) return value

    const apiBase = String(process.env.NEXT_PUBLIC_LARAVEL_API_URL || '').trim().replace(/\/+$/, '')
    if (!apiBase) return value

    if (value.startsWith('/')) {
      return `${apiBase}${value}`
    }

    return `${apiBase}/${value.replace(/^\/+/, '')}`
  }

  const getInvoicePreviewType = (url: string): 'image' | 'pdf' | 'other' => {
    const clean = url.split('?')[0].toLowerCase()
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(clean)) return 'image'
    if (clean.endsWith('.pdf')) return 'pdf'
    return 'other'
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-24 -top-20 h-52 w-52 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amber-200/35 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-700">Accounting</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Expenses</h1>
            <p className="mt-2 text-sm text-slate-600">Add and manage expense entries by category and transaction date.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              type="button"
              onClick={openAdd}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
            >
              + Add Expense
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Records</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalRecords}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total (Filtered)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{formatMoney(totalAmount)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Categories</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{categories.length}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_auto] lg:items-end">
            <label className="text-xs text-slate-500">
              Category
              <select
                value={selectedCategoryId}
                onChange={(event) => {
                  setSelectedCategoryId(Number(event.target.value))
                  setPage(1)
                }}
                className="mt-1 h-[42px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"
              >
                <option value={0}>All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-500">
              From
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value)
                  setPage(1)
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800"
              />
            </label>

            <label className="text-xs text-slate-500">
              To
              <input
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value)
                  setPage(1)
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId(0)
                setDateFrom('')
                setDateTo('')
                setPage(1)
              }}
              className="h-[42px] rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <p className="text-xs text-slate-500">
              {isFetching
                ? 'Refreshing...'
                : `${expenses.length} on this page | ${totalRecords} total result(s)`}
            </p>
          </div>
        </div>

        {isError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {loadErrorMessage || 'Failed to load expenses.'}
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs font-semibold text-slate-500">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Sub-category</th>
                <th className="px-4 py-3">Intent</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Transaction Date</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                expenses.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-b-0 text-sm">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{row.category?.name || 'Category'}</p>
                      <p className="text-xs text-slate-400">#{row.id}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.sub_category_name?.trim() || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <p className="line-clamp-2">{row.intent}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatMoney(Number(row.amount ?? 0))}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateShort(row.transaction_date)}</td>
                    <td className="px-4 py-3">
                      {row.invoice_url ? (
                        <button
                          type="button"
                          onClick={() => {
                            setForceIframePreview(false)
                            setInvoicePreviewUrl(resolveInvoiceUrl(row.invoice_url ?? ''))
                          }}
                          className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          View Invoice
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">No invoice</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          title={row.invoice_url ? 'Edit expense invoice' : 'Upload invoice'}
                          aria-label={row.invoice_url ? 'Edit expense invoice' : 'Upload invoice'}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-slate-700"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          disabled={isDeleting}
                          title="Delete expense"
                          aria-label="Delete expense"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white hover:bg-red-50 disabled:opacity-60"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-red-600"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Rows per page</span>
            <select
              value={perPage}
              onChange={(event) => {
                const next = Math.max(10, Number(event.target.value) || 10)
                setPerPage(next)
                setPage(1)
              }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1 || isFetching}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <p className="text-xs text-slate-500">
              Page {currentPage} of {lastPage}
            </p>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(lastPage, prev + 1))}
              disabled={currentPage >= lastPage || isFetching}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Expense' : 'Add Expense'}</h2>
                <p className="mt-0.5 text-xs text-slate-500">Category, sub-category, amount, date, intent, and invoice.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
              <label className="block text-sm text-slate-700">
                Expense Category
                <select
                  value={form.category_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, category_id: Number(event.target.value) }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"
                  required
                >
                  <option value={0} disabled>
                    Select category
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-slate-700">
                Sub-category Name
                <input
                  type="text"
                  value={form.sub_category_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, sub_category_name: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800"
                  placeholder="Enter sub-category name"
                  maxLength={180}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  Amount
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800"
                    placeholder="0.00"
                    required
                  />
                </label>

                <label className="block text-sm text-slate-700">
                  Transaction Date
                  <input
                    type="date"
                    value={form.transaction_date}
                    onChange={(event) => setForm((prev) => ({ ...prev, transaction_date: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  Invoice Link
                  <input
                    type="url"
                    value={form.invoice_url}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        invoice_url: event.target.value,
                        remove_invoice: false,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800"
                    placeholder="https://... (optional)"
                    disabled={form.remove_invoice}
                  />
                  {form.invoice_url.trim() ? (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          invoice_url: '',
                        }))
                      }
                      className="mt-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Remove link
                    </button>
                  ) : null}
                </label>

                <label className="block text-sm text-slate-700">
                  Invoice Image File
                  <input
                    key={invoiceFileInputKey}
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null
                      setForm((prev) => ({ ...prev, invoice_file: file, remove_invoice: false }))
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700"
                    disabled={form.remove_invoice}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    {form.invoice_file ? `Selected: ${form.invoice_file.name}` : 'Optional. Upload photo/screenshot of receipt.'}
                  </p>
                  {form.invoice_file ? (
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, invoice_file: null }))
                        setInvoiceFileInputKey((prev) => prev + 1)
                      }}
                      className="mt-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Remove file
                    </button>
                  ) : null}
                </label>
              </div>

              {editing?.invoice_url ? (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.remove_invoice}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        remove_invoice: event.target.checked,
                        ...(event.target.checked ? { invoice_url: '', invoice_file: null } : {}),
                      }))
                    }
                  />
                  Remove current invoice (link/image)
                </label>
              ) : null}

              <label className="block text-sm text-slate-700">
                Intent
                <textarea
                  value={form.intent}
                  onChange={(event) => setForm((prev) => ({ ...prev, intent: event.target.value }))}
                  className="mt-1 h-24 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800"
                  placeholder="Describe the purpose of this expense..."
                  maxLength={500}
                  required
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.status === 1}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.checked ? 1 : 0 }))}
                />
                Active expense
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
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isCreating || isUpdating ? 'Saving...' : editing ? 'Save Changes' : 'Create Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {invoicePreviewUrl ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Invoice Preview</h2>
                <p className="mt-0.5 text-xs text-slate-500">Preview the uploaded invoice without leaving this page.</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={invoicePreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={closeInvoicePreview}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] overflow-auto bg-slate-50 p-4">
              {getInvoicePreviewType(invoicePreviewUrl) === 'image' && !forceIframePreview ? (
                <img
                  src={invoicePreviewUrl}
                  alt="Invoice"
                  onError={() => setForceIframePreview(true)}
                  className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg border border-slate-200 bg-white"
                />
              ) : getInvoicePreviewType(invoicePreviewUrl) === 'pdf' ? (
                <iframe
                  src={invoicePreviewUrl}
                  title="Invoice PDF Preview"
                  className="h-[70vh] w-full rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <iframe
                  src={invoicePreviewUrl}
                  title="Invoice Preview"
                  className="h-[70vh] w-full rounded-lg border border-slate-200 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
