'use client'

import { useMemo, useState } from 'react'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import { useCreateAddsContentMutation, useDeleteAddsContentMutation, useGetAddsContentQuery, useUpdateAddsContentStatusMutation, useUpdateAddsContentMutation } from '@/store/api/addsContentApi'

const getApiErrorMessage = (error: any, fallback: string) => {
  const direct = String(error?.data?.message || '').trim()
  if (direct) return direct

  const validationErrors = error?.data?.errors
  if (validationErrors && typeof validationErrors === 'object') {
    const firstField = Object.keys(validationErrors)[0]
    const firstFieldErrors = firstField ? validationErrors[firstField] : null
    if (Array.isArray(firstFieldErrors) && firstFieldErrors[0]) {
      return String(firstFieldErrors[0])
    }
  }

  const generic = String(error?.message || '').trim()
  if (generic) return generic
  return fallback
}

export default function AddsContentClient() {
  const [isOpen, setIsOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [dateCreated, setDateCreated] = useState(() => new Date().toISOString().slice(0, 10))
  const [pageTarget, setPageTarget] = useState('shop')
  const [isDateOpen, setIsDateOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [statusConfirm, setStatusConfirm] = useState<{ id: number; status: 0 | 1; label: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number } | null>(null)
  const [createAddsContent, { isLoading }] = useCreateAddsContentMutation()
  const [updateAddsContent, { isLoading: isUpdating }] = useUpdateAddsContentMutation()
  const [updateStatus, { isLoading: isStatusLoading }] = useUpdateAddsContentStatusMutation()
  const [deleteAddsContent, { isLoading: isDeleteLoading }] = useDeleteAddsContentMutation()
  const { data: addsContentData, isLoading: isAddsLoading } = useGetAddsContentQuery()
  const MAX_VIDEO_MB = 20


  const monthLabels = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const selectedDate = useMemo(() => {
    if (!dateCreated) return undefined
    const parsed = new Date(`${dateCreated}T00:00:00`)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }, [dateCreated])

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const base = selectedDate ?? new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  const monthMatrix = useMemo(() => {
    const start = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
    const end = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0)
    const daysInMonth = end.getDate()
    const startDay = start.getDay()
    const cells: Array<{ date: Date | null; isCurrentMonth: boolean }> = []

    for (let i = 0; i < startDay; i += 1) {
      cells.push({ date: null, isCurrentMonth: false })
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push({
        date: new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), d),
        isCurrentMonth: true,
      })
    }
    while (cells.length % 7 !== 0) {
      cells.push({ date: null, isCurrentMonth: false })
    }

    const weeks = []
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7))
    }
    return weeks
  }, [visibleMonth])

  const displayDate = useMemo(() => {
    if (!selectedDate) return 'Select date'
    return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(selectedDate)
  }, [selectedDate])

  const formatCardDate = (value?: string | null) => {
    if (!value) return '—'
    const parsed = new Date(`${value}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return value
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(parsed)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-400">Web Content</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Ads Content</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          This page will manage advertising placements, promos, and sponsored content blocks once connected to the
          web content service.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-orange-100/70 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-amber-100/70 blur-3xl animate-pulse" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">Campaign Builder</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">Add New Content</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Create advertising placements, promo tiles, and sponsored content blocks with a single action.
              You can later attach images, links, and scheduling windows.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingItemId(null)
              setImageFile(null)
              setVideoFile(null)
              setDateCreated(new Date().toISOString().slice(0, 10))
              setPageTarget('shop')
              setIsOpen(true)
            }}
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 5v14m-7-7h14" />
              </svg>
            </span>
            Add Content
            <span className="inline-flex h-2 w-2 rounded-full bg-white/90 animate-ping" />
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-200 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-amber-700 dark:hover:text-amber-300"
          >
            View Drafts
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
          <div className="relative z-[61] w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">New Campaign</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                  {editingItemId ? 'Edit Content Details' : 'Add Content Details'}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Fill in image, video, and schedule details.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-amber-200 hover:text-amber-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-amber-700 dark:hover:text-amber-300"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Image</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-amber-700 shadow-sm ring-1 ring-amber-100 transition hover:shadow-md">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 16.5V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v9.5a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5z" />
                      </svg>
                    </span>
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                      className="sr-only"
                    />
                  </label>
                  <span className="text-xs text-slate-500">
                    {imageFile ? imageFile.name : 'No file selected'}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Video</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-amber-700 shadow-sm ring-1 ring-amber-100 transition hover:shadow-md">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 6h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
                      </svg>
                    </span>
                    Upload Video
                    <input
                      type="file"
                      accept="video/*"
                      onChange={async (event) => {
                        const selected = event.target.files?.[0] ?? null
                        if (!selected) {
                          setVideoFile(null)
                          return
                        }
                        const sizeMb = selected.size / (1024 * 1024)
                        if (sizeMb > MAX_VIDEO_MB) {
                          showErrorToast(`The maximum video size is ${MAX_VIDEO_MB}MB.`)
                          event.target.value = ''
                          setVideoFile(null)
                          return
                        }
                        setVideoFile(selected)
                      }}
                      className="sr-only"
                    />
                  </label>
                  <span className="text-xs text-slate-500">
                    {videoFile ? videoFile.name : 'No file selected'}
                  </span>
                </div>
              </div>

              <div className="relative sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Date Created</label>
                <button
                  type="button"
                  onClick={() => setIsDateOpen((v) => !v)}
                  className="mt-2 flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 transition hover:border-amber-200"
                >
                  <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className={selectedDate ? 'text-slate-800' : 'text-slate-400'}>{displayDate}</span>
                  </div>
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <p className="mt-1 text-[11px] text-slate-500">Pick the date this content should be recorded.</p>

                {isDateOpen && (
                  <div className="absolute z-[70] bottom-full mb-2 w-[320px] max-h-[320px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex items-center justify-between px-1">
                      <button
                        type="button"
                        onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
                        className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:border-amber-200 hover:text-amber-600"
                      >
                        ‹
                      </button>
                      <div className="text-sm font-semibold text-slate-800">
                        {monthLabels[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
                      </div>
                      <button
                        type="button"
                        onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
                        className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:border-amber-200 hover:text-amber-600"
                      >
                        ›
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-semibold uppercase text-slate-400">
                      {weekdayLabels.map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>
                    <div className="mt-2 grid grid-cols-7 gap-y-1 text-center text-sm">
                      {monthMatrix.map((week, wi) => (
                        <div key={`week-${wi}`} className="contents">
                          {week.map((cell, di) => {
                            const isSelected =
                              cell.date &&
                              selectedDate &&
                              cell.date.toDateString() === selectedDate.toDateString()
                            const isToday = cell.date && cell.date.toDateString() === new Date().toDateString()
                            return (
                              <button
                                type="button"
                                key={`day-${wi}-${di}`}
                                disabled={!cell.date}
                                onClick={() => {
                                  if (!cell.date) return
                                  setDateCreated(cell.date.toISOString().slice(0, 10))
                                  setIsDateOpen(false)
                                }}
                                className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg transition ${
                                  !cell.date
                                    ? 'opacity-0'
                                    : isSelected
                                      ? 'bg-amber-500 text-white'
                                      : isToday
                                        ? 'border border-amber-200 text-amber-700 hover:bg-amber-50'
                                        : 'text-slate-700 hover:bg-amber-50 hover:text-amber-700'
                                }`}
                              >
                                {cell.date?.getDate()}
                              </button>
                            )
                          })}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setDateCreated('')
                          setIsDateOpen(false)
                        }}
                        className="text-slate-500 hover:text-amber-600"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date()
                          setDateCreated(today.toISOString().slice(0, 10))
                          setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1))
                          setIsDateOpen(false)
                        }}
                        className="font-semibold text-amber-600 hover:text-amber-700"
                      >
                        Today
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:col-span-2">
                Show On Page
                <select
                  value={pageTarget}
                  onChange={(event) => setPageTarget(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-amber-200"
                >
                  <option value="shop">Shop</option>
                  <option value="home">Home</option>
                  <option value="landing">Landing</option>
                  <option value="product">Product</option>
                  <option value="category">Category</option>
                  <option value="brand">Brand</option>
                  <option value="all">All Pages</option>
                </select>
                <span className="block text-[11px] font-medium normal-case text-slate-500">
                  Choose where this ad will appear. Select “All Pages” for global popups.
                </span>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-amber-200 hover:text-amber-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const formData = new FormData()
                  if (imageFile) formData.append('image', imageFile)
                  if (videoFile) formData.append('video', videoFile)
                  if (dateCreated) formData.append('date_created', dateCreated)
                  if (pageTarget) formData.append('page', pageTarget)

                  if (!imageFile && !videoFile) {
                    showErrorToast('Please upload an image or a video.')
                    return
                  }

                  try {
                    const response = editingItemId
                      ? await updateAddsContent({ id: editingItemId, data: formData }).unwrap()
                      : await createAddsContent(formData).unwrap()
                    showSuccessToast(response.message || 'Content saved.')
                    setIsOpen(false)
                    setImageFile(null)
                    setVideoFile(null)
                    setDateCreated('')
                    setPageTarget('shop')
                    setEditingItemId(null)
                  } catch (error: any) {
                    showErrorToast(getApiErrorMessage(error, 'Failed to save content.'))
                  }
                }}
                disabled={isLoading || isUpdating}
                className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-60"
              >
                {isLoading || isUpdating ? 'Saving...' : 'Save Content'}
              </button>
            </div>
          </div>
        </div>
      )}

      {statusConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="absolute inset-0" onClick={() => setStatusConfirm(null)} />
          <div className="relative z-[71] w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">Confirm Action</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">{statusConfirm.label} Content</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Are you sure you want to set this content to <span className="font-semibold">{statusConfirm.label}</span>?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusConfirm(null)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-amber-200 hover:text-amber-700"
              >
                Close
              </button>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setStatusConfirm(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-amber-200 hover:text-amber-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isStatusLoading}
                onClick={async () => {
                  if (!statusConfirm) return
                  await updateStatus({ id: statusConfirm.id, status: statusConfirm.status })
                  setStatusConfirm(null)
                }}
                className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-60"
              >
                {isStatusLoading ? 'Updating...' : `Yes, ${statusConfirm.label}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="absolute inset-0" onClick={() => setDeleteConfirm(null)} />
          <div className="relative z-[71] w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-600">Delete Content</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">Remove this content?</h3>
                <p className="mt-2 text-sm text-slate-500">
                  This will permanently delete the image/video from storage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-rose-200 hover:text-rose-600"
              >
                Close
              </button>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-rose-200 hover:text-rose-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleteLoading}
                onClick={async () => {
                  if (!deleteConfirm) return
                  try {
                    const response = await deleteAddsContent({ id: deleteConfirm.id }).unwrap()
                    showSuccessToast(response.message || 'Content deleted.')
                  } catch (error: any) {
                    showErrorToast(error?.data?.message || 'Failed to delete content.')
                  } finally {
                    setDeleteConfirm(null)
                  }
                }}
                className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-60"
              >
                {isDeleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Library</p>
            <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">Uploaded Content</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isAddsLoading ? 'Loading...' : `${addsContentData?.items?.length ?? 0} items`}
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(addsContentData?.items ?? []).map((item) => {
            const hasImage = Boolean(item.image_url)
            const hasVideo = Boolean(item.video_url)
            const statusLabel = (item.status ?? 0) === 0 ? 'Active' : 'Draft'
            const header = (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>#{item.id}</span>
                <span>{formatCardDate(item.date_created)}</span>
              </div>
            )

            if (hasImage && hasVideo) {
              return (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm relative">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>#{item.id}</span>
                    <span>{formatCardDate(item.date_created)}</span>
                  </div>
                  <span className="mt-2 inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-600">
                    {item.page ? item.page : 'shop'}
                  </span>
                  <div className="mt-5 space-y-3">
                    <div className="group relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                      <img
                        src={item.image_url ?? ''}
                        alt="Uploaded"
                        className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
                        {statusLabel === 'Active' ? 'Active' : 'Draft'}
                      </span>
                      <div className="absolute right-3 top-3 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => {
                          setEditingItemId(item.id)
                          setDateCreated(item.date_created ?? '')
                          setPageTarget(item.page ?? 'shop')
                          setImageFile(null)
                          setVideoFile(null)
                          setIsOpen(true)
                          }}
                          className="rounded-full bg-white/80 px-4 py-1.5 text-[12px] font-semibold text-sky-600 shadow-sm transition hover:bg-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ id: item.id })}
                          className="rounded-full bg-white/80 px-4 py-1.5 text-[12px] font-semibold text-rose-600 shadow-sm transition hover:bg-white"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="group relative">
                      <video
                        src={item.video_url ?? ''}
                        controls
                        className="h-32 w-full rounded-xl border border-slate-100 bg-black"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
                        {statusLabel === 'Active' ? 'Active' : 'Draft'}
                      </span>
                      <div className="absolute right-3 top-3 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => {
                        setEditingItemId(item.id)
                        setDateCreated(item.date_created ?? '')
                        setPageTarget(item.page ?? 'shop')
                        setImageFile(null)
                        setVideoFile(null)
                        setIsOpen(true)
                          }}
                          className="rounded-full bg-white/80 px-4 py-1.5 text-[12px] font-semibold text-sky-600 shadow-sm transition hover:bg-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ id: item.id })}
                          className="rounded-full bg-white/80 px-4 py-1.5 text-[12px] font-semibold text-rose-600 shadow-sm transition hover:bg-white"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                    <button
                      type="button"
                      disabled={isStatusLoading}
                      onClick={() => setStatusConfirm({ id: item.id, status: 0, label: 'Activate' })}
                      className={`flex-1 rounded-full px-3 py-1 text-[11px] font-semibold ${
                        statusLabel === 'Active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Activate
                    </button>
                    <button
                      type="button"
                      disabled={isStatusLoading}
                      onClick={() => setStatusConfirm({ id: item.id, status: 1, label: 'Draft' })}
                      className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-amber-200 hover:text-amber-700"
                    >
                      Draft
                    </button>
                  </div>
                </div>
              )
            }

            if (hasImage) {
              return (
                <div key={`${item.id}-image`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm relative">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>#{item.id}</span>
                    <span>{formatCardDate(item.date_created)}</span>
                  </div>
                  <span className="mt-2 inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-600">
                    {item.page ? item.page : 'shop'}
                  </span>
                  <div className="mt-5 group relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                    <img
                      src={item.image_url ?? ''}
                      alt="Uploaded"
                      className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
                      {statusLabel === 'Active' ? 'Active' : 'Draft'}
                    </span>
                    <div className="absolute right-3 top-3 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItemId(item.id)
                          setDateCreated(item.date_created ?? '')
                          setPageTarget(item.page ?? 'shop')
                          setImageFile(null)
                          setVideoFile(null)
                          setIsOpen(true)
                        }}
                        className="rounded-full bg-white/80 px-4 py-1.5 text-[12px] font-semibold text-sky-600 shadow-sm transition hover:bg-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ id: item.id })}
                        className="rounded-full bg-white/80 px-4 py-1.5 text-[12px] font-semibold text-rose-600 shadow-sm transition hover:bg-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                    <button
                      type="button"
                      disabled={isStatusLoading}
                      onClick={() => setStatusConfirm({ id: item.id, status: 0, label: 'Activate' })}
                      className={`flex-1 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                        statusLabel === 'Active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      } hover:border hover:border-emerald-400`}
                    >
                      Activate
                    </button>
                    <button
                      type="button"
                      disabled={isStatusLoading}
                      onClick={() => setStatusConfirm({ id: item.id, status: 1, label: 'Draft' })}
                      className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-amber-200 hover:text-amber-700"
                    >
                      Draft
                    </button>
                  </div>
                </div>
              )
            }

            if (hasVideo) {
              return (
                <div key={`${item.id}-video`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm relative">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>#{item.id}</span>
                    <span>{formatCardDate(item.date_created)}</span>
                  </div>
                  <span className="mt-2 inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-600">
                    {item.page ? item.page : 'shop'}
                  </span>
                  <div className="mt-5 group relative">
                    <video
                      src={item.video_url ?? ''}
                      controls
                      className="h-40 w-full rounded-xl border border-slate-100 bg-black"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
                      {statusLabel === 'Active' ? 'Active' : 'Draft'}
                    </span>
                    <div className="absolute right-3 top-3 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItemId(item.id)
                          setDateCreated(item.date_created ?? '')
                          setPageTarget(item.page ?? 'shop')
                          setImageFile(null)
                          setVideoFile(null)
                          setIsOpen(true)
                        }}
                        className="rounded-full bg-white/80 px-4 py-1.5 text-[12px] font-semibold text-sky-600 shadow-sm transition hover:bg-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ id: item.id })}
                        className="rounded-full bg-white/80 px-4 py-1.5 text-[12px] font-semibold text-rose-600 shadow-sm transition hover:bg-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                    <button
                      type="button"
                      disabled={isStatusLoading}
                      onClick={() => setStatusConfirm({ id: item.id, status: 0, label: 'Activate' })}
                      className={`flex-1 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                        statusLabel === 'Active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      } hover:border hover:border-emerald-400`}
                    >
                      Activate
                    </button>
                    <button
                      type="button"
                      disabled={isStatusLoading}
                      onClick={() => setStatusConfirm({ id: item.id, status: 1, label: 'Draft' })}
                      className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-amber-200 hover:text-amber-700"
                    >
                      Draft
                    </button>
                  </div>
                </div>
              )
            }

            return null
          })}
          {!isAddsLoading && (addsContentData?.items?.length ?? 0) === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No content uploaded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
