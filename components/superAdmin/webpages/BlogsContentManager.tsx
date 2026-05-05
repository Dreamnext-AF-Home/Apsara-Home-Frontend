'use client'

import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useCreateAdminWebPageItemMutation,
  useDeleteAdminWebPageItemMutation,
  useGetAdminWebPageItemsQuery,
  useUpdateAdminWebPageItemMutation,
  type WebPageItem,
} from '@/store/api/webPagesApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'

// ─── Types ──────────────────────────────────────────────────────────────────────

type SectionField = {
  key: string
  label: string
  kind?: 'text' | 'textarea' | 'select'
  options?: string[]
}

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
  payload: Record<string, string>
}

// ─── Section config ─────────────────────────────────────────────────────────────

const BLOGS_TYPE = 'home-blogs' as const

const blogFields: SectionField[] = [
  { key: 'category', label: 'Category' },
  { key: 'date', label: 'Date label (e.g. March 15, 2024)' },
  { key: 'read_time', label: 'Read time (e.g. 5 min read)' },
  { key: 'slug', label: 'URL slug' },
]

// ─── Form helpers ───────────────────────────────────────────────────────────────

const emptyForm: FormState = {
  key: '', title: '', subtitle: '', body: '',
  image_url: '', link_url: '', button_text: '',
  sort_order: '0', is_active: true, payload: {},
}

const slugify = (v: string) =>
  v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const toForm = (item: WebPageItem): FormState => {
  const p = (item.payload ?? {}) as Record<string, unknown>
  return {
    key: item.key ?? '',
    title: item.title ?? '',
    subtitle: item.subtitle ?? '',
    body: item.body ?? '',
    image_url: item.image_url ?? '',
    link_url: item.link_url ?? '',
    button_text: item.button_text ?? '',
    sort_order: String(item.sort_order ?? 0),
    is_active: item.is_active,
    payload: blogFields.reduce<Record<string, string>>((acc, f) => {
      const v = p[f.key]
      acc[f.key] = typeof v === 'string' ? v : ''
      return acc
    }, {}),
  }
}

const toPayload = (form: FormState) => ({
  key: form.key.trim() || slugify(form.title) || 'blog-post',
  title: form.title.trim() || undefined,
  subtitle: form.subtitle.trim() || undefined,
  body: form.body.trim() || undefined,
  image_url: form.image_url.trim() || undefined,
  link_url: form.link_url.trim() || undefined,
  button_text: form.button_text.trim() || undefined,
  sort_order: Number.parseInt(form.sort_order, 10) || 0,
  is_active: form.is_active,
  payload: Object.fromEntries(
    Object.entries(form.payload).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v !== ''),
  ),
})

const mergeItem = (item: WebPageItem, form: FormState): WebPageItem => ({
  ...item,
  title: form.title || null,
  subtitle: form.subtitle || null,
  body: form.body || null,
  image_url: form.image_url || null,
  link_url: form.link_url || null,
  button_text: form.button_text || null,
  sort_order: Number(form.sort_order) || 0,
  is_active: form.is_active,
  payload: { ...((item.payload as Record<string, string>) ?? {}), ...form.payload },
})

// ─── FieldZone ───────────────────────────────────────────────────────────────────

function FieldZone({
  fieldKey,
  label,
  onFocus,
  isActive,
  children,
}: {
  fieldKey: string
  label: string
  onFocus: (fieldKey: string) => void
  isActive: boolean
  children: ReactNode
}) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onFocus(fieldKey) }}
      className={`group/fz relative cursor-pointer rounded-lg transition-all duration-100 ${
        isActive
          ? 'bg-cyan-50/70 ring-2 ring-cyan-400 ring-offset-1'
          : 'hover:bg-cyan-50/40 hover:ring-2 hover:ring-cyan-200 hover:ring-offset-1'
      }`}
    >
      <span
        className={`pointer-events-none absolute -top-5 left-0 z-20 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white transition-opacity ${
          isActive ? 'bg-cyan-500 opacity-100' : 'bg-cyan-400 opacity-0 group-hover/fz:opacity-100'
        }`}
      >
        {label}
      </span>
      {children}
    </div>
  )
}

// ─── Canvas primitives ──────────────────────────────────────────────────────────

function AddNewButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 py-4 text-sm font-medium text-stone-400 transition hover:border-stone-400 hover:bg-white/60 hover:text-stone-600"
    >
      <span className="text-lg leading-none">+</span>
      {label}
    </button>
  )
}

function CanvasItem({
  item, selected, onSelect, children,
}: {
  item: WebPageItem
  selected: WebPageItem | null
  onSelect: (item: WebPageItem) => void
  children: ReactNode
}) {
  const isSelected = selected?.id === item.id

  return (
    <div
      onClick={() => onSelect(item)}
      className={`group relative cursor-pointer rounded-3xl transition-all duration-150 ${
        isSelected
          ? 'ring-2 ring-cyan-500 ring-offset-4'
          : 'ring-2 ring-transparent hover:ring-2 hover:ring-cyan-300 hover:ring-offset-4'
      }`}
    >
      <span className={`pointer-events-none absolute -right-1 -top-1 z-10 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm transition-opacity ${
        isSelected
          ? 'bg-cyan-500 text-white opacity-100'
          : 'bg-white text-cyan-600 ring-1 ring-cyan-200 opacity-0 group-hover:opacity-100'
      }`}>
        {isSelected ? '✎ Editing' : '✎ Edit'}
      </span>
      {children}
    </div>
  )
}

// ─── Canvas ──────────────────────────────────────────────────────────────────────

interface CanvasProps {
  items: WebPageItem[]
  selected: WebPageItem | null
  onSelect: (item: WebPageItem) => void
  onAddNew: () => void
  isLoading: boolean
  onFieldFocus?: (item: WebPageItem, fieldKey: string) => void
  focusedField?: string | null
}

function BlogsCanvas({ items, selected, onSelect, onAddNew, isLoading, onFieldFocus, focusedField }: CanvasProps) {
  return (
    <div className="mx-auto max-w-4xl p-8">
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-2 w-32 animate-pulse rounded-full bg-stone-200" />
        </div>
      )}

      {/* Section header */}
      <div className="mb-8">
        <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-stone-400">
          <span className="h-px w-8 bg-stone-300" />
          Blog Posts
        </p>
        <h2 className="mt-4 text-3xl font-medium tracking-tight text-stone-900">
          Manage your blog content
        </h2>
        <p className="mt-2 text-sm text-stone-500">
          Click any blog card to edit. Changes will reflect on the blog page.
        </p>
      </div>

      {/* Blog items */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map(item => {
          const p = (item.payload ?? {}) as Record<string, string>
          const isThisSelected = selected?.id === item.id
          const fz = (fieldKey: string, label: string) => ({
            fieldKey,
            label,
            onFocus: (key: string) => onFieldFocus?.(item, key),
            isActive: isThisSelected && focusedField === fieldKey,
          })

          return (
            <CanvasItem key={item.id} item={item} selected={selected} onSelect={onSelect}>
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <FieldZone {...fz('image_url', 'Image')}>
                  <div className="aspect-video overflow-hidden bg-gradient-to-br from-stone-50 to-stone-100">
                    {item.image_url
                      ? <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full items-center justify-center"><p className="text-[10px] text-stone-400">No image</p></div>
                    }
                  </div>
                </FieldZone>
                <div className="p-4">
                  <FieldZone {...fz('category', 'Category / Date')}>
                    <div className="flex flex-wrap gap-1 text-[9px] uppercase tracking-wider text-stone-400">
                      {p.category && <span>{p.category}</span>}
                      {p.date && <><span>·</span><span>{p.date}</span></>}
                      {p.read_time && <><span>·</span><span>{p.read_time}</span></>}
                    </div>
                  </FieldZone>
                  <FieldZone {...fz('title', 'Title')}>
                    <h3 className="mt-1.5 text-sm font-semibold leading-snug text-stone-900">{item.title}</h3>
                  </FieldZone>
                  <FieldZone {...fz('subtitle', 'Subtitle')}>
                    {(item.subtitle ?? item.body) ? (
                      <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-stone-500">{item.subtitle ?? item.body}</p>
                    ) : null}
                  </FieldZone>
                </div>
              </div>
            </CanvasItem>
          )
        })}
      </div>

      {items.length === 0 && !isLoading && (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 p-8 text-center">
          <p className="text-sm text-stone-500">No blog posts yet. Add your first blog post.</p>
        </div>
      )}

      <AddNewButton onClick={onAddNew} label="Add blog post" />
    </div>
  )
}

// ─── Edit Panel ─────────────────────────────────────────────────────────────────

function Field({ label, fieldKey, focusedField, children }: { label: string; fieldKey: string; focusedField?: string | null; children: ReactNode }) {
  const isFocused = focusedField === fieldKey
  return (
    <div className={`space-y-1.5 rounded-xl border p-3 transition-all ${
      isFocused ? 'border-cyan-300 bg-cyan-50/50' : 'border-slate-200 bg-white'
    }`}>
      <label className={`block text-xs font-semibold ${isFocused ? 'text-cyan-700' : 'text-slate-600'}`}>{label}</label>
      {children}
    </div>
  )
}

const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"

function EditPanel({
  form, setForm, editTarget, section, onCancel, onSubmit, onDelete, isBusy, focusedField, setFocusedField, isUploadingImage, onUploadImage,
}: {
  form: FormState
  setForm: (f: FormState) => void
  editTarget: WebPageItem | null
  section: { label: string; itemLabel: string; fields: SectionField[] }
  onCancel: () => void
  onSubmit: (e: FormEvent) => void
  onDelete: () => void
  isBusy: boolean
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  isUploadingImage: boolean
  onUploadImage: (file: File) => Promise<void>
}) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focusedField && scrollAreaRef.current) {
      const el = scrollAreaRef.current.querySelector(`[data-field="${focusedField}"]`) as HTMLElement
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.focus()
      }
    }
  }, [focusedField])

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {editTarget ? 'Editing' : 'New Blog Post'}
            </p>
            {editTarget && (
              <p className="mt-0.5 truncate text-sm font-bold text-slate-800">
                {editTarget.title ?? editTarget.key ?? 'Blog Post'}
              </p>
            )}
          </div>
          <button type="button" onClick={onCancel} className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">✕</button>
        </div>
        {focusedField && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-cyan-50 px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <p className="text-[10px] font-semibold text-cyan-600">
              Editing: <span className="font-bold">{focusedField.replace(/_/g, ' ')}</span>
            </p>
          </div>
        )}
      </div>

      <div ref={scrollAreaRef} className="flex-1 space-y-3 overflow-y-auto p-5">
        <Field label="Title" fieldKey="title" focusedField={focusedField}>
          <input data-field="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Blog post title" className={inputClass} />
        </Field>
        <Field label="Subtitle" fieldKey="subtitle" focusedField={focusedField}>
          <input data-field="subtitle" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="Short excerpt" className={inputClass} />
        </Field>
        <Field label="Body / content" fieldKey="body" focusedField={focusedField}>
          <textarea data-field="body" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={4} placeholder="Full blog content" className={inputClass} />
        </Field>

        <Field label="Image" fieldKey="image_url" focusedField={focusedField}>
          <input
            data-field="image_url"
            value={form.image_url}
            onChange={e => setForm({ ...form, image_url: e.target.value })}
            placeholder="Paste URL or upload below"
            className={inputClass}
          />
          <label className={`mt-1.5 inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-semibold transition ${
            isUploadingImage
              ? 'cursor-wait border-cyan-200 bg-cyan-50 text-cyan-500'
              : 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-white'
          }`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16" />
              <line x1="12" y1="12" x2="12" y2="21" />
              <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
            </svg>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={isUploadingImage}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void onUploadImage(file)
                e.currentTarget.value = ''
              }}
            />
            {isUploadingImage ? 'Uploading…' : 'Upload Image'}
          </label>
          {form.image_url && (
            <img src={form.image_url} alt="" className="mt-2 h-24 w-full rounded-xl object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
        </Field>

        <Field label="Link URL" fieldKey="link_url" focusedField={focusedField}>
          <input data-field="link_url" value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} placeholder="/blog/slug or https://..." className={inputClass} />
        </Field>

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-cyan-700">
            Blog fields
          </p>
          <div className="space-y-3">
            {blogFields.map(field => (
              <Field key={field.key} label={field.label} fieldKey={field.key} focusedField={focusedField}>
                {field.kind === 'textarea' ? (
                  <textarea data-field={field.key} value={form.payload[field.key]} onChange={(e) => setForm({ ...form, payload: { ...form.payload, [field.key]: e.target.value } })} rows={2} className={inputClass} />
                ) : (
                  <input data-field={field.key} value={form.payload[field.key] ?? ''} onChange={(e) => setForm({ ...form, payload: { ...form.payload, [field.key]: e.target.value } })} className={inputClass} />
                )}
              </Field>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Sort order" fieldKey="sort_order" focusedField={focusedField}>
            <input data-field="sort_order" type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Key (auto)" fieldKey="key" focusedField={focusedField}>
            <input data-field="key" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="Auto from title" className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-slate-100 p-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
          Active (visible on site)
        </label>
        <button type="submit" disabled={isBusy} className="w-full rounded-2xl bg-cyan-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-cyan-700/20 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60">
          {isBusy ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Blog Post'}
        </button>
        {editTarget && (
          <button type="button" onClick={onDelete} className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100">
            Delete
          </button>
        )}
      </div>
    </form>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function BlogsContentManager() {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editTarget, setEditTarget] = useState<WebPageItem | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const { data, isLoading, isFetching, isError } = useGetAdminWebPageItemsQuery({
    type: BLOGS_TYPE, page: 1, perPage: 100, status: 'all',
  })

  const [createItem, { isLoading: isCreating }] = useCreateAdminWebPageItemMutation()
  const [updateItem, { isLoading: isUpdating }] = useUpdateAdminWebPageItemMutation()
  const [deleteItem] = useDeleteAdminWebPageItemMutation()

  const isBusy = isCreating || isUpdating

  const displayItems = useMemo(() => {
    const saved = data?.items ?? []
    if (!editTarget) return saved
    return saved.map(item => item.id === editTarget.id ? mergeItem(item, form) : item)
  }, [data?.items, editTarget, form])

  const resetForm = () => {
    setForm(emptyForm)
    setEditTarget(null)
    setPanelOpen(false)
    setFocusedField(null)
  }

  const openPanel = (item: WebPageItem, focusField?: string | null) => {
    const isSameItem = editTarget !== null && editTarget.id === item.id
    if (!isSameItem) {
      setEditTarget(item)
      setForm(toForm(item))
    }
    setPanelOpen(true)
    setFocusedField(focusField ?? null)
  }

  const handleSelect = (item: WebPageItem) => openPanel(item)
  const handleFieldFocus = (item: WebPageItem, fieldKey: string) => openPanel(item, fieldKey)
  const handleAddNew = () => { setEditTarget(null); setForm(emptyForm); setPanelOpen(true); setFocusedField(null) }

  const handleUploadImage = async (file: File) => {
    setIsUploadingImage(true)
    try {
      const payload = new FormData()
      payload.append('file', file)
      payload.append('folder', 'web-content')
      payload.append('asset_type', 'image')
      const response = await fetch('/api/admin/upload', { method: 'POST', body: payload })
      const result = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !result.url) throw new Error(result.error ?? 'Upload failed')
      setForm({ ...form, image_url: result.url! })
      showSuccessToast('Image uploaded.')
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Failed to upload image.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      if (editTarget) {
        await updateItem({ type: BLOGS_TYPE, id: editTarget.id, data: toPayload(form) }).unwrap()
        showSuccessToast('Blog post updated.')
      } else {
        await createItem({ type: BLOGS_TYPE, data: toPayload(form) }).unwrap()
        showSuccessToast('Blog post created.')
      }
      resetForm()
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } }
      const first = apiErr?.data?.errors ? Object.values(apiErr.data.errors)[0]?.[0] : undefined
      showErrorToast(first ?? apiErr?.data?.message ?? 'Failed to save.')
    }
  }

  const handleDelete = async () => {
    if (!editTarget) return
    if (!window.confirm(`Delete "${editTarget.title ?? editTarget.key ?? 'Blog Post'}"?`)) return
    try {
      await deleteItem({ type: BLOGS_TYPE, id: editTarget.id }).unwrap()
      showSuccessToast('Blog post deleted.')
      resetForm()
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message ?? 'Failed to delete.')
    }
  }

  return (
    <div
      className="flex overflow-hidden rounded-3xl border border-slate-200 bg-[#edeae5] shadow-sm"
      style={{ height: 'calc(100vh - 120px)', minHeight: 640 }}
    >
      {/* Canvas */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Fake browser bar */}
        <div className="shrink-0 border-b border-stone-300/40 bg-[#e2ddd7] px-5 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/50" />
            </div>
            <div className="flex-1 rounded-lg bg-white/60 px-3 py-1 text-xs text-stone-500">
              /blog
            </div>
          </div>
        </div>

        {/* Canvas content */}
        <div className="flex-1 overflow-y-auto bg-stone-50">
          <BlogsCanvas
            items={displayItems}
            selected={editTarget}
            onSelect={handleSelect}
            onAddNew={handleAddNew}
            isLoading={isLoading}
            onFieldFocus={handleFieldFocus}
            focusedField={focusedField}
          />
        </div>
      </div>

      {/* Edit panel */}
      {panelOpen && (
        <div className="flex w-96 shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white shadow-xl">
          <EditPanel
            form={form}
            setForm={setForm}
            editTarget={editTarget}
            section={{ label: 'Blogs', itemLabel: 'Blog Post', fields: blogFields }}
            onCancel={resetForm}
            onSubmit={handleSubmit}
            onDelete={handleDelete}
            isBusy={isBusy}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            isUploadingImage={isUploadingImage}
            onUploadImage={handleUploadImage}
          />
        </div>
      )}
    </div>
  )
}
