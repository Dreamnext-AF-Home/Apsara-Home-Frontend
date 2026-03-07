'use client'

import { FormEvent, useMemo, useState } from 'react'
import {
  useCreateAdminWebPageItemMutation,
  useDeleteAdminWebPageItemMutation,
  useGetAdminWebPageItemsQuery,
  useUpdateAdminWebPageItemMutation,
  WebPageItem,
  WebPageType,
} from '@/store/api/webPagesApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'

type FormState = {
  key: string
  title: string
  subtitle: string
  body: string
  image_url: string
  link_url: string
  button_text: string
  sort_order: string
  is_active: boolean
  start_at: string
  end_at: string
}

const emptyForm: FormState = {
  key: '',
  title: '',
  subtitle: '',
  body: '',
  image_url: '',
  link_url: '',
  button_text: '',
  sort_order: '0',
  is_active: true,
  start_at: '',
  end_at: '',
}

const toDatetimeLocal = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const tzOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

const toApiDatetime = (value: string) => {
  if (!value.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

const toPayload = (form: FormState) => ({
  key: form.key.trim() || undefined,
  title: form.title.trim() || undefined,
  subtitle: form.subtitle.trim() || undefined,
  body: form.body.trim() || undefined,
  image_url: form.image_url.trim() || undefined,
  link_url: form.link_url.trim() || undefined,
  button_text: form.button_text.trim() || undefined,
  sort_order: Number(form.sort_order || 0),
  is_active: form.is_active,
  start_at: toApiDatetime(form.start_at),
  end_at: toApiDatetime(form.end_at),
})

const toForm = (item: WebPageItem): FormState => ({
  key: item.key ?? '',
  title: item.title ?? '',
  subtitle: item.subtitle ?? '',
  body: item.body ?? '',
  image_url: item.image_url ?? '',
  link_url: item.link_url ?? '',
  button_text: item.button_text ?? '',
  sort_order: String(item.sort_order ?? 0),
  is_active: item.is_active,
  start_at: toDatetimeLocal(item.start_at),
  end_at: toDatetimeLocal(item.end_at),
})

interface Props {
  type: WebPageType
  title: string
  description: string
}

export default function WebPageItemsManager({ type, title, description }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'active' | 'inactive' | 'all'>('all')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editTarget, setEditTarget] = useState<WebPageItem | null>(null)

  const { data, isLoading, isFetching, isError } = useGetAdminWebPageItemsQuery({
    type,
    page,
    perPage: 20,
    search: search.trim() || undefined,
    status,
  })

  const [createItem, { isLoading: isCreating }] = useCreateAdminWebPageItemMutation()
  const [updateItem, { isLoading: isUpdating }] = useUpdateAdminWebPageItemMutation()
  const [deleteItem] = useDeleteAdminWebPageItemMutation()

  const rows = useMemo(() => data?.items ?? [], [data?.items])
  const isBusy = isCreating || isUpdating

  const resetForm = () => {
    setForm(emptyForm)
    setEditTarget(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    try {
      if (editTarget) {
        await updateItem({ type, id: editTarget.id, data: toPayload(form) }).unwrap()
        showSuccessToast('Content item updated successfully.')
      } else {
        await createItem({ type, data: toPayload(form) }).unwrap()
        showSuccessToast('Content item created successfully.')
      }
      resetForm()
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } }
      const firstValidation = apiErr?.data?.errors ? Object.values(apiErr.data.errors)[0]?.[0] : undefined
      showErrorToast(firstValidation || apiErr?.data?.message || 'Failed to save content item.')
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Delete this item?')
    if (!confirmed) return

    try {
      await deleteItem({ type, id }).unwrap()
      showSuccessToast('Content item deleted successfully.')
      if (editTarget?.id === id) resetForm()
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to delete content item.')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">{editTarget ? 'Edit Item' : 'Add Item'}</h2>
          {editTarget ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={form.key} onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))} placeholder="Key (optional)" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} placeholder="Subtitle" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </div>

        <textarea value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} placeholder="Body / content text" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={form.image_url} onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} placeholder="Image URL" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={form.link_url} onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value }))} placeholder="Link URL" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={form.button_text} onChange={(e) => setForm((p) => ({ ...p, button_text: e.target.value }))} placeholder="Button text" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="number" min={0} value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} placeholder="Sort order" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input type="datetime-local" value={form.start_at} onChange={(e) => setForm((p) => ({ ...p, start_at: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input type="datetime-local" value={form.end_at} onChange={(e) => setForm((p) => ({ ...p, end_at: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
            Active
          </label>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isBusy} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
            {isBusy ? 'Saving...' : editTarget ? 'Update Item' : 'Create Item'}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search title, subtitle, key..."
            className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as 'active' | 'inactive' | 'all')
              setPage(1)
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Failed to load web page items.
          </div>
        ) : isLoading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[960px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-3 py-2.5 font-semibold">Title</th>
                  <th className="px-3 py-2.5 font-semibold">Key</th>
                  <th className="px-3 py-2.5 font-semibold">Sort</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Schedule</th>
                  <th className="px-3 py-2.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 last:border-b-0 text-sm">
                    <td className="px-3 py-2.5 text-slate-800">
                      <p className="font-medium">{row.title || '(Untitled)'}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[260px]">{row.subtitle || row.body || '-'}</p>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">{row.key || '-'}</td>
                    <td className="px-3 py-2.5 text-slate-700">{row.sort_order}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                        {row.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">
                      <p>Start: {row.start_at ? new Date(row.start_at).toLocaleString() : '-'}</p>
                      <p>End: {row.end_at ? new Date(row.end_at).toLocaleString() : '-'}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditTarget(row)
                            setForm(toForm(row))
                          }}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                      No items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {isFetching ? <div className="text-xs text-slate-500">Refreshing...</div> : null}

        <div className="flex items-center justify-between text-xs text-slate-500">
          <p>
            Showing {data?.meta?.from ?? 0} - {data?.meta?.to ?? 0} of {data?.meta?.total ?? 0}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={(data?.meta?.current_page ?? 1) <= 1}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 disabled:opacity-40"
            >
              Prev
            </button>
            <span>Page {data?.meta?.current_page ?? 1} / {data?.meta?.last_page ?? 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(data?.meta?.current_page ?? 1) >= (data?.meta?.last_page ?? 1)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

