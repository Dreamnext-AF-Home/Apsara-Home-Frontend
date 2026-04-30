'use client'

import { ChangeEvent, DragEvent, FormEvent, useMemo, useState } from 'react'
import {
  useCreateAdminWebPageItemMutation,
  useDeleteAdminWebPageItemMutation,
  useGetAdminWebPageItemsQuery,
  useUpdateAdminWebPageItemMutation,
} from '@/store/api/webPagesApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'

type UploadAssetType = 'image' | 'video'

const ROOM_OPTIONS = ['Bathroom', 'Bedroom', 'Dining Room', 'Kitchen', 'Living Room', 'Office', 'Outdoor'] as const

function FileDropzone({
  label,
  accept,
  files,
  onFilesChange,
}: {
  label: string
  accept: string
  files: File[]
  onFilesChange: (files: File[]) => void
}) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const dropped = Array.from(event.dataTransfer.files ?? [])
    if (dropped.length === 0) return
    onFilesChange([...files, ...dropped])
  }

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`group flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
        isDragging
          ? 'border-cyan-400 bg-cyan-50 dark:border-cyan-500 dark:bg-cyan-950/30'
          : 'border-slate-300 bg-slate-50 hover:border-cyan-300 hover:bg-cyan-50/60 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-cyan-700'
      }`}
    >
      <input
        type="file"
        className="hidden"
        accept={accept}
        multiple
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const picked = Array.from(event.target.files ?? [])
          onFilesChange([...files, ...picked])
          event.currentTarget.value = ''
        }}
      />
      <p className="text-sm font-semibold text-slate-700 group-hover:text-cyan-700 dark:text-slate-200 dark:group-hover:text-cyan-300">{label}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {files.length > 0 ? `${files.length} file(s) selected` : 'Click or drag and drop multiple files here'}
      </p>
    </label>
  )
}

async function uploadFilesToCloudinary(files: File[], assetType: UploadAssetType) {
  const uploaded: string[] = []

  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'project-gallery')
    formData.append('asset_type', assetType)

    const response = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || !payload?.url) throw new Error(payload?.error || 'Failed to upload files.')
    uploaded.push(payload.url)
  }

  return uploaded
}

export default function AdminProjectPageMain() {
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'photo-gallery' | 'video-gallery'; id: number; title: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [photoName, setPhotoName] = useState('')
  const [photoDescription, setPhotoDescription] = useState('')
  const [photoLocation, setPhotoLocation] = useState<string>(ROOM_OPTIONS[0])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoUploading, setPhotoUploading] = useState(false)

  const [videoName, setVideoName] = useState('')
  const [videoDescription, setVideoDescription] = useState('')
  const [videoFiles, setVideoFiles] = useState<File[]>([])
  const [videoUploading, setVideoUploading] = useState(false)

  const { data: photoData, isLoading: loadingPhotos, refetch: refetchPhotos } = useGetAdminWebPageItemsQuery({
    type: 'photo-gallery',
    page: 1,
    perPage: 100,
    status: 'all',
  })
  const { data: videoData, isLoading: loadingVideos, refetch: refetchVideos } = useGetAdminWebPageItemsQuery({
    type: 'video-gallery',
    page: 1,
    perPage: 100,
    status: 'all',
  })
  const [createItem] = useCreateAdminWebPageItemMutation()
  const [deleteItem] = useDeleteAdminWebPageItemMutation()
  const [updateItem] = useUpdateAdminWebPageItemMutation()

  const photos = useMemo(() => photoData?.items ?? [], [photoData])
  const videos = useMemo(() => videoData?.items ?? [], [videoData])

  const handlePhotoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!photoName.trim()) return showErrorToast('Photo name is required.')
    if (!photoDescription.trim()) return showErrorToast('Photo description is required.')
    if (photoFiles.length === 0) return showErrorToast('Please attach at least one photo.')

    try {
      setPhotoUploading(true)
      const urls = await uploadFilesToCloudinary(photoFiles, 'image')
      for (const [index, url] of urls.entries()) {
        await createItem({
          type: 'photo-gallery',
          data: {
            title: photoName.trim(),
            subtitle: photoDescription.trim(),
            image_url: url,
            payload: { category: photoLocation },
            sort_order: Math.min(999999, photos.length + index + 1),
            is_active: true,
          },
        }).unwrap()
      }
      setPhotoFiles([])
      setPhotoName('')
      setPhotoDescription('')
      setPhotoLocation(ROOM_OPTIONS[0])
      await refetchPhotos()
      showSuccessToast('Photo gallery uploaded and saved.')
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Failed to upload photos.')
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleVideoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!videoName.trim()) return showErrorToast('Video name is required.')
    if (!videoDescription.trim()) return showErrorToast('Video description is required.')
    if (videoFiles.length === 0) return showErrorToast('Please attach at least one video.')

    try {
      setVideoUploading(true)
      const urls = await uploadFilesToCloudinary(videoFiles, 'video')
      for (const [index, url] of urls.entries()) {
        await createItem({
          type: 'video-gallery',
          data: {
            title: videoName.trim(),
            subtitle: videoDescription.trim(),
            link_url: url,
            sort_order: Math.min(999999, videos.length + index + 1),
            is_active: true,
          },
        }).unwrap()
      }
      setVideoFiles([])
      setVideoName('')
      setVideoDescription('')
      await refetchVideos()
      showSuccessToast('Video gallery uploaded and saved.')
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Failed to upload videos.')
    } finally {
      setVideoUploading(false)
    }
  }

  const handleDelete = async (type: 'photo-gallery' | 'video-gallery', id: number) => {
    try {
      setIsDeleting(true)
      setDeleteError(null)
      await deleteItem({ type, id }).unwrap()
      if (type === 'photo-gallery') await refetchPhotos()
      if (type === 'video-gallery') await refetchVideos()
      showSuccessToast('Gallery item deleted.')
      setDeleteTarget(null)
    } catch (error) {
      const apiMessage =
        typeof error === 'object' &&
        error !== null &&
        'data' in error &&
        typeof (error as { data?: { message?: string } }).data?.message === 'string'
          ? (error as { data?: { message?: string } }).data?.message
          : null

      // Fallback: if hard delete fails, hide from public/admin by setting inactive.
      try {
        await updateItem({
          type,
          id,
          data: { is_active: false },
        }).unwrap()
        if (type === 'photo-gallery') await refetchPhotos()
        if (type === 'video-gallery') await refetchVideos()
        showSuccessToast('Item archived (inactive) because hard delete was rejected.')
        setDeleteTarget(null)
      } catch (updateError) {
        const updateMessage =
          typeof updateError === 'object' &&
          updateError !== null &&
          'data' in updateError &&
          typeof (updateError as { data?: { message?: string } }).data?.message === 'string'
            ? (updateError as { data?: { message?: string } }).data?.message
            : null
        const message = updateMessage || apiMessage || 'Failed to delete item.'
        setDeleteError(message)
        showErrorToast(message)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 dark:bg-slate-950 dark:text-slate-100">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 md:text-2xl">Project Gallery Uploads</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Upload and manage photo and video galleries. Uploaded items are also used on the public media pages.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Photo Gallery</h2>
          <form onSubmit={handlePhotoSubmit} className="mt-4 space-y-4">
            <input value={photoName} onChange={(e) => setPhotoName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Photo name" />
            <textarea value={photoDescription} onChange={(e) => setPhotoDescription(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Description" />
            <select value={photoLocation} onChange={(e) => setPhotoLocation(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
              {ROOM_OPTIONS.map((room) => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
            <FileDropzone label="Upload photos" accept="image/jpeg,image/png,image/webp,image/gif" files={photoFiles} onFilesChange={setPhotoFiles} />
            <button type="submit" disabled={photoUploading} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {photoUploading ? 'Uploading...' : 'Upload Photo Gallery'}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Saved Photo Gallery</p>
            {loadingPhotos ? <p className="text-sm text-slate-500">Loading photos...</p> : photos.length === 0 ? <p className="text-sm text-slate-500">No photo items yet.</p> : (
              <div className="grid gap-3 sm:grid-cols-2">
                {photos.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/50">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title || 'Photo'}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center bg-slate-200 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        No image preview
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-semibold">{item.title || 'Untitled photo'}</p>
                      <p className="text-xs text-slate-500">{item.subtitle || ''}</p>
                      <p className="text-xs text-cyan-700 dark:text-cyan-300">Category: {String((item.payload as Record<string, unknown> | null)?.category ?? 'Uncategorized')}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null)
                          setDeleteTarget({ type: 'photo-gallery', id: item.id, title: item.title || 'Untitled photo' })
                        }}
                        className="mt-2 text-xs font-semibold text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Videos Gallery</h2>
          <form onSubmit={handleVideoSubmit} className="mt-4 space-y-4">
            <input value={videoName} onChange={(e) => setVideoName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Video name" />
            <textarea value={videoDescription} onChange={(e) => setVideoDescription(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Description" />
            <FileDropzone label="Upload videos" accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-ms-wmv" files={videoFiles} onFilesChange={setVideoFiles} />
            <button type="submit" disabled={videoUploading} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {videoUploading ? 'Uploading...' : 'Upload Videos Gallery'}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Saved Videos Gallery</p>
            {loadingVideos ? <p className="text-sm text-slate-500">Loading videos...</p> : videos.length === 0 ? <p className="text-sm text-slate-500">No video items yet.</p> : (
              <div className="grid gap-3 sm:grid-cols-2">
                {videos.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/50">
                    {item.link_url ? (
                      <video
                        src={item.link_url}
                        controls
                        preload="metadata"
                        className="h-40 w-full bg-black object-cover"
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center bg-slate-200 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        No video preview
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-semibold">{item.title || 'Untitled video'}</p>
                      <p className="text-xs text-slate-500">{item.subtitle || ''}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null)
                          setDeleteTarget({ type: 'video-gallery', id: item.id, title: item.title || 'Untitled video' })
                        }}
                        className="mt-2 text-xs font-semibold text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Confirm Delete</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <span className="font-semibold">{deleteTarget.title}</span>? This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null)
                  setDeleteError(null)
                }}
                disabled={isDeleting}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  void handleDelete(deleteTarget.type, deleteTarget.id)
                }}
                disabled={isDeleting}
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
            {deleteError ? (
              <p className="mt-3 text-xs font-medium text-rose-600">{deleteError}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
