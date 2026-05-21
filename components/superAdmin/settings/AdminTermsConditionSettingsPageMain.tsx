'use client'

import { useEffect, useMemo, useState } from 'react'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import {
  useCreateAdminWebPageItemMutation,
  useGetAdminWebPageItemsQuery,
  useUpdateAdminWebPageItemMutation,
} from '@/store/api/webPagesApi'
import RichTextEditor from '@/components/ui/RichTextEditor'

type TermsVariant = 'general' | 'webstore'

export default function AdminTermsConditionSettingsPageMain() {
  const { data, isLoading, isFetching, refetch } = useGetAdminWebPageItemsQuery({
    type: 'terms-and-conditions',
    page: 1,
    perPage: 50,
    status: 'all',
  })
  const [createItem, { isLoading: isCreating }] = useCreateAdminWebPageItemMutation()
  const [updateItem, { isLoading: isUpdating }] = useUpdateAdminWebPageItemMutation()

  const [variant, setVariant] = useState<TermsVariant>('general')
  const variantLabel = variant === 'general' ? 'General' : 'Webstore'
  const existing = useMemo(
    () => (data?.items ?? []).find((item) => String(item.key ?? '').trim().toLowerCase() === variant) ?? null,
    [data?.items, variant],
  )
  const [title, setTitle] = useState('Terms and Conditions')
  const [body, setBody] = useState('')

  useEffect(() => {
    const fallbackTitle = variant === 'general' ? 'Terms and Conditions' : 'Webstore Terms and Conditions'
    setTitle(existing?.title?.trim() || fallbackTitle)
    setBody(existing?.body?.trim() || '')
  }, [existing?.id, existing?.title, existing?.body, variant])

  const isSaving = isCreating || isUpdating

  const handleSave = async () => {
    if (!title.trim()) {
      showErrorToast('Title is required.')
      return
    }
    if (!body.trim()) {
      showErrorToast('Terms content is required.')
      return
    }

    const payload = {
      key: variant,
      title: title.trim(),
      body: body.trim(),
      sort_order: 0,
      is_active: true,
    }

    try {
      if (existing?.id) {
        await updateItem({
          type: 'terms-and-conditions',
          id: existing.id,
          data: payload,
        }).unwrap()
      } else {
        await createItem({
          type: 'terms-and-conditions',
          data: payload,
        }).unwrap()
      }
      await refetch()
      showSuccessToast('Terms and Conditions saved.')
    } catch (error) {
      const apiErr = error as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to save Terms and Conditions.')
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Terms &amp; Condition</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Edit and publish the Terms and Conditions shown on the public page.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isLoading || isFetching}
          className="inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save Terms'}
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Terms Type</label>
          <select
            value={variant}
            onChange={(event) => setVariant(event.target.value as TermsVariant)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-900/35"
          >
            <option value="general">General</option>
            <option value="webstore">Webstore</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Title</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-900/35"
            placeholder="Terms and Conditions"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Content</label>
          <RichTextEditor
            value={body}
            onChange={setBody}
            placeholder="Write your Terms and Conditions here..."
            editorClassName="min-h-[520px] max-h-[72vh]"
          />
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Tip: separate sections with blank lines. You are editing the {variantLabel} terms.
          </p>
        </div>
      </div>
    </section>
  )
}
