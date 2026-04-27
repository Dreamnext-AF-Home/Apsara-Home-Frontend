'use client'

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react'
import {
  useCreateAdminWebPageItemMutation,
  useDeleteAdminWebPageItemMutation,
  useGetAdminWebPageItemsQuery,
  useUpdateAdminWebPageItemMutation,
  WebPageItem,
} from '@/store/api/webPagesApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'

type FormState = {
  title: string
  image_url: string
  pdf_url: string
  sort_order: string
  is_active: boolean
}

const emptyForm: FormState = {
  title: '',
  image_url: '',
  pdf_url: '',
  sort_order: '0',
  is_active: true,
}

const toPayload = (form: FormState) => ({
  title: form.title.trim() || undefined,
  image_url: form.image_url.trim() || undefined,
  link_url: form.pdf_url.trim() || undefined,
  button_text: 'Open Assembly Guide',
  sort_order: Number(form.sort_order || 0),
  is_active: form.is_active,
})

const toForm = (item: WebPageItem): FormState => ({
  title: item.title ?? '',
  image_url: item.image_url ?? '',
  pdf_url: item.link_url ?? '',
  sort_order: String(item.sort_order ?? 0),
  is_active: item.is_active,
})

export default function AssemblyGuidesManager() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'active' | 'inactive' | 'all'>('all')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editTarget, setEditTarget] = useState<WebPageItem | null>(null)
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [useManualPdfLink, setUseManualPdfLink] = useState(false)
  const pdfInputRef = useRef<HTMLInputElement | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)

  const { data, isLoading, isFetching, isError } = useGetAdminWebPageItemsQuery({
    type: 'assembly-guides',
    page,
    perPage: 20,
    search: search.trim() || undefined,
    status,
  })

  const [createItem, { isLoading: isCreating }] = useCreateAdminWebPageItemMutation()
  const [updateItem, { isLoading: isUpdating }] = useUpdateAdminWebPageItemMutation()
  const [deleteItem] = useDeleteAdminWebPageItemMutation()

  const rows = useMemo(() => data?.items ?? [], [data?.items])
  const latestItems = useMemo(() => {
    return rows
      .filter((row) => row.created_at)
      .sort((a, b) => {
        const left = new Date(a.created_at ?? 0).getTime()
        const right = new Date(b.created_at ?? 0).getTime()
        return right - left
      })
      .slice(0, 3)
  }, [rows])
  const isBusy = isCreating || isUpdating

  const resetForm = () => {
    setForm(emptyForm)
    setEditTarget(null)
    setUseManualPdfLink(false)
    if (pdfInputRef.current) {
      pdfInputRef.current.value = ''
    }
    if (coverInputRef.current) {
      coverInputRef.current.value = ''
    }
  }

  const handlePdfUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const payload = new FormData()
    payload.append('file', file)
    payload.append('folder', 'assembly-guides')
    payload.append('asset_type', 'pdf')

    setIsUploadingPdf(true)

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: payload,
      })

      const result = (await response.json()) as { url?: string; error?: string }

      if (!response.ok || !result.url) {
        throw new Error(result.error || 'Failed to upload PDF.')
      }

      setForm((prev) => ({
        ...prev,
        pdf_url: result.url ?? prev.pdf_url,
      }))
      setUseManualPdfLink(false)
      showSuccessToast('PDF uploaded successfully.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload PDF.'
      showErrorToast(message)
    } finally {
      setIsUploadingPdf(false)
      if (pdfInputRef.current) {
        pdfInputRef.current.value = ''
      }
    }
  }

  const handleCoverUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const payload = new FormData()
    payload.append('file', file)
    payload.append('folder', 'assembly-guides')

    setIsUploadingCover(true)

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: payload,
      })

      const result = (await response.json()) as { url?: string; error?: string }

      if (!response.ok || !result.url) {
        throw new Error(result.error || 'Failed to upload cover image.')
      }

      setForm((prev) => ({
        ...prev,
        image_url: result.url ?? prev.image_url,
      }))
      showSuccessToast('Cover image uploaded successfully.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload cover image.'
      showErrorToast(message)
    } finally {
      setIsUploadingCover(false)
      if (coverInputRef.current) {
        coverInputRef.current.value = ''
      }
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    try {
      if (editTarget) {
        await updateItem({ type: 'assembly-guides', id: editTarget.id, data: toPayload(form) }).unwrap()
        showSuccessToast('Assembly guide updated successfully.')
      } else {
        await createItem({ type: 'assembly-guides', data: toPayload(form) }).unwrap()
        showSuccessToast('Assembly guide created successfully.')
      }
      resetForm()
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } }
      const firstValidation = apiErr?.data?.errors ? Object.values(apiErr.data.errors)[0]?.[0] : undefined
      showErrorToast(firstValidation || apiErr?.data?.message || 'Failed to save assembly guide.')
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Delete this PDF guide?')
    if (!confirmed) return

    try {
      await deleteItem({ type: 'assembly-guides', id }).unwrap()
      showSuccessToast('Assembly guide deleted successfully.')
      if (editTarget?.id === id) resetForm()
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to delete assembly guide.')
    }
  }

  return (
    <div className="space-y-6 dark:bg-slate-950 dark:text-slate-100">
      <section className="overflow-hidden rounded-[2rem] border border-cyan-100 bg-[linear-gradient(135deg,_#f0fdfa,_#ffffff_58%,_#ecfeff)] shadow-[0_24px_70px_rgba(15,118,110,0.08)] dark:border-cyan-900/30 dark:bg-[linear-gradient(135deg,_rgba(8,51,68,0.35),_rgba(15,23,42,0.96)_58%,_rgba(8,47,73,0.42))]">
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.3fr_0.7fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-400">PDF Workspace</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Assembly Guides Manager</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Add direct PDF guides for the public Assembly Guides page. Keep the form simple: title, PDF link, optional cover image, then publish.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-cyan-100 bg-white/80 p-5 dark:border-cyan-900/30 dark:bg-slate-900/70">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Quick rules</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <li>Use a direct PDF URL</li>
              <li>Cover image is optional</li>
              <li>Inactive guides stay hidden from public page</li>
              <li>Lower sort number appears first</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-400">
                {editTarget ? 'Edit Mode' : 'Create'}
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                {editTarget ? 'Update PDF Guide' : 'Add Assembly Guide'}
              </h2>
            </div>

            {editTarget ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Guide Title">
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ex. ARPER BED 72x75 Assembly Guide"
                className={inputClassName}
              />
            </Field>

            <Field label="PDF URL">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {useManualPdfLink ? 'Google Drive Link' : 'Upload PDF'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setUseManualPdfLink((prev) => !prev)}
                    className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-[11px] font-semibold text-cyan-700 transition hover:bg-cyan-50"
                  >
                    {useManualPdfLink ? 'Use PDF Upload' : 'Use Google Drive Link'}
                  </button>
                </div>

                {useManualPdfLink ? (
                  <input
                    value={form.pdf_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, pdf_url: e.target.value }))}
                    placeholder="Paste Google Drive share link here"
                    className={inputClassName}
                  />
                ) : null}

                <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800/80">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Attach PDF file</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Upload a PDF here and we will automatically fill and lock the PDF URL for you.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={isUploadingPdf || useManualPdfLink}
                      className="rounded-2xl border border-cyan-200 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {useManualPdfLink ? 'Upload Disabled' : isUploadingPdf ? 'Uploading PDF...' : 'Attach PDF'}
                    </button>
                  </div>
                </div>

                <input
                  value={form.pdf_url}
                  readOnly
                  disabled={!form.pdf_url || useManualPdfLink}
                  placeholder={useManualPdfLink ? 'Google Drive link will appear here' : 'Upload a PDF to generate the link'}
                  className={`${inputClassName} cursor-not-allowed bg-slate-100 text-slate-500 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500`}
                />
              </div>
            </Field>

            <Field label="Cover Image URL">
              <div className="space-y-3">
                <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800/80">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Attach cover image</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Upload an optional preview image and we will auto-fill and lock the cover URL.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isUploadingCover}
                      className="rounded-2xl border border-cyan-200 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUploadingCover ? 'Uploading image...' : 'Attach Image'}
                    </button>
                  </div>
                </div>

                <input
                  value={form.image_url}
                  readOnly
                  disabled
                  placeholder="Optional preview image"
                  className={`${inputClassName} cursor-not-allowed bg-slate-100 text-slate-500 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500`}
                />
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <Field label="Sort Order">
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                  className={inputClassName}
                />
              </Field>

              <Field label="Visibility">
                <label className="flex h-[46px] items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <span>{form.is_active ? 'Visible on public page' : 'Hidden from public page'}</span>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 accent-cyan-600"
                  />
                </label>
              </Field>
            </div>

            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-sm text-cyan-800 dark:border-cyan-900/30 dark:bg-cyan-950/20 dark:text-cyan-200">
              Tip: the PDF URL is auto-generated from the attached file and stays locked to avoid accidental edits. If you need a different file, just attach a new PDF or switch to a Google Drive link.
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isBusy}
              className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? 'Saving...' : editTarget ? 'Update Guide' : 'Create Guide'}
            </button>
          </div>
        </form>

        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mt-2 rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Recently Added</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Recently Assembly Guides Uploaded</p>
              </div>
            </div>

            {latestItems.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No guides added yet.</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {latestItems.map((item) => {
                  const card = (
                    <div className="overflow-hidden rounded-[1.25rem] border border-orange-100 bg-white shadow-sm">
                      <div className="rounded-t-[1.25rem] border-b border-orange-100 bg-[linear-gradient(135deg,_#fff7ed,_#fffbf5_45%,_#ffedd5)] p-4">
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm ring-1 ring-orange-100">
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                            <path d="M9 15h6" />
                            <path d="M9 11h2" />
                          </svg>
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-500">
                          Assembly Guide
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {item.title || '(Untitled guide)'}
                        </p>
                        <p className="mt-2 text-xs leading-6 text-slate-600">
                          Click to open the assembly guide.
                        </p>

                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                          <span className="text-xs font-semibold text-orange-600">Open Assembly Guide</span>
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M7 17 17 7" />
                              <path d="M8 7h9v9" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  )

                  return item.link_url ? (
                    <a
                      key={`latest-${item.id}`}
                      href={item.link_url}
                      target={item.link_url.startsWith('http') ? '_blank' : undefined}
                      rel={item.link_url.startsWith('http') ? 'noreferrer' : undefined}
                      className="block"
                    >
                      {card}
                    </a>
                  ) : (
                    <div key={`latest-${item.id}`} className="block">
                      {card}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      {children}
    </label>
  )
}

const inputClassName =
  'w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
