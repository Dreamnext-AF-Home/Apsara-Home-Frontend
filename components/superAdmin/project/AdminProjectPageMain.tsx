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

const ROOM_OPTIONS = [
  'Bathroom',
  'Bedroom',
  'Dining Room',
  'Kitchen',
  'Living Room',
  'Office',
  'Outdoor',
] as const

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE_BYTES = 15 * 1024 * 1024 // 15MB

function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)}MB`
  const kb = bytes / 1024
  if (kb >= 1) return `${kb.toFixed(kb >= 10 ? 0 : 1)}KB`
  return `${bytes}B`
}

function getMaxBytesForAssetType(assetType: UploadAssetType) {
  return assetType === 'image' ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES
}

function validateProjectGalleryFiles(files: File[], assetType: UploadAssetType) {
  const maxBytes = getMaxBytesForAssetType(assetType)

  const tooLarge = files
    .filter((f) => f.size > maxBytes)
    .map((f) => `${f.name} (${formatBytes(f.size)})`)

  if (tooLarge.length > 0) {
    throw new Error(
      `${assetType === 'image' ? 'Image' : 'Video'} file size must be <= ${assetType === 'image' ? '10MB' : '15MB'}. Too large: ${tooLarge.join(
        ', '
      )}`
    )
  }
}

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

      <p className="text-sm font-semibold text-slate-700 group-hover:text-cyan-700 dark:text-slate-200 dark:group-hover:text-cyan-300">
        {label}
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {files.length > 0 ? `${files.length} file(s) selected` : 'Click or drag and drop multiple files here'}
      </p>
    </label>
  )
}

async function uploadFilesToCloudinary(files: File[], assetType: UploadAssetType) {
  validateProjectGalleryFiles(files, assetType)

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

  const [previewTarget, setPreviewTarget] = useState<
    | null
    | {
        type: 'photo-gallery'
        id: number
        title: string
        subtitle?: string | null
        image_url?: string | null
        category?: string
      }
    | {
        type: 'video-gallery'
        id: number
        title: string
        subtitle?: string | null
        link_url?: string | null
      }
  >(null)

  const [previewOpen, setPreviewOpen] = useState(false)

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

  const openPreviewForPhoto = (item: (typeof photos)[number]) => {
    const category = String((item.payload as Record<string, unknown> | null)?.category ?? '')
    setPreviewTarget({
      type: 'photo-gallery',
      id: item.id,
      title: item.title || 'Untitled photo',
      subtitle: item.subtitle ?? null,
      image_url: item.image_url ?? null,
      category: category || undefined,
    })
    setPreviewOpen(true)
  }

  const openPreviewForVideo = (item: (typeof videos)[number]) => {
    setPreviewTarget({
      type: 'video-gallery',
      id: item.id,
      title: item.title || 'Untitled video',
      subtitle: item.subtitle ?? null,
      link_url: item.link_url ?? null,
    })
    setPreviewOpen(true)
  }

  const closePreview = () => {
    setPreviewOpen(false)
    setTimeout(() => setPreviewTarget(null), 120)
  }

  const handlePhotoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!photoName.trim()) return showErrorToast('Photo name is required.')
    if (!photoDescription.trim()) return showErrorToast('Photo description is required.')
    if (photoFiles.length === 0) return showErrorToast('Please attach at least one photo.')

    try {
      validateProjectGalleryFiles(photoFiles, 'image')
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
      validateProjectGalleryFiles(videoFiles, 'video')
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
      <div className="relative overflow-hidden rounded-3xl border border-sky-200/70 bg-gradient-to-br from-white via-sky-50 to-cyan-50 p-6 shadow-sm dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900/40 dark:to-cyan-950/20 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.12),transparent_35%)]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200/80 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-400/20 dark:bg-sky-500/15 dark:text-sky-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <path d="M8 14l2-2 3 3 4-4" />
                <path d="M8 9h.01" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 md:text-2xl">Project Gallery Uploads</h1>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Upload and manage photo and video galleries.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Photos */}
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-sky-50 p-5 shadow-sm dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-950/40 dark:via-slate-950/40 dark:to-sky-950/30 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Photo Gallery
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {photos.length} item(s)
            </p>
          </div>

          <form onSubmit={handlePhotoSubmit} className="mt-4 space-y-4">
            <input
              value={photoName}
              onChange={(e) => setPhotoName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              placeholder="Photo name"
            />
            <textarea
              value={photoDescription}
              onChange={(e) => setPhotoDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              placeholder="Description"
            />
            <select
              value={photoLocation}
              onChange={(e) => setPhotoLocation(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              {ROOM_OPTIONS.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>

            <div className="relative">
              <FileDropzone
                label="Upload photos"
                accept="image/jpeg,image/png,image/webp,image/gif"
                files={photoFiles}
                onFilesChange={setPhotoFiles}
              />
            </div>

            <button type="submit" disabled={photoUploading} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {photoUploading ? 'Uploading...' : 'Upload Photo Gallery'}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Saved Photo Gallery</p>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
            </div>

            {loadingPhotos ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 animate-pulse" />
                ))}
              </div>
            ) : photos.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-900/40">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No photos yet</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Upload your first project photo gallery.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
                {photos.map((item) => {
                  const category = String((item.payload as Record<string, unknown> | null)?.category ?? 'Uncategorized')
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openPreviewForPhoto(item)}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950/40"
                    >
                      <div className="relative aspect-square bg-slate-50 dark:bg-slate-900/40">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image_url}
                            alt={item.title || 'Photo'}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            No image
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                        <div className="absolute left-3 top-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 shadow-sm">
                            {category || 'Category'}
                          </span>
                        </div>

                        <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setDeleteError(null)
                              setDeleteTarget({ type: 'photo-gallery', id: item.id, title: item.title || 'Untitled photo' })
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-rose-600 shadow ring-1 ring-black/5 transition hover:bg-white"
                            aria-label="Delete photo"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="p-3">
                        <p className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title || 'Untitled photo'}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.subtitle || ''}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Videos */}
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-cyan-50 p-5 shadow-sm dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-950/40 dark:via-slate-950/40 dark:to-cyan-950/30 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Videos Gallery</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{videos.length} item(s)</p>
          </div>

          <form onSubmit={handleVideoSubmit} className="mt-4 space-y-4">
            <input
              value={videoName}
              onChange={(e) => setVideoName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              placeholder="Video name"
            />
            <textarea
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              placeholder="Description"
            />

            <div className="relative">
              <FileDropzone
                label="Upload videos"
                accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-ms-wmv"
                files={videoFiles}
                onFilesChange={setVideoFiles}
              />
            </div>

            <button type="submit" disabled={videoUploading} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {videoUploading ? 'Uploading...' : 'Upload Videos Gallery'}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Saved Videos Gallery</p>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
            </div>

            {loadingVideos ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 animate-pulse" />
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-900/40">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No videos yet</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Upload your first project video gallery.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
                {videos.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openPreviewForVideo(item)}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950/40"
                  >
                    <div className="relative aspect-square bg-slate-50 dark:bg-slate-900/40">
                      {item.link_url ? (
                        <video
                          src={item.link_url}
                          preload="metadata"
                          muted
                          playsInline
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          No video
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      <div className="absolute left-3 top-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 shadow-sm">Video</span>
                      </div>

                      <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setDeleteError(null)
                            setDeleteTarget({ type: 'video-gallery', id: item.id, title: item.title || 'Untitled video' })
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-rose-600 shadow ring-1 ring-black/5 transition hover:bg-white"
                          aria-label="Delete video"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="p-3">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title || 'Untitled video'}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.subtitle || ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Preview Modal (Delete uses existing confirm flow) */}
      {previewOpen && previewTarget ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div
            className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-cyan-400">
                  {previewTarget.type === 'photo-gallery' ? 'PHOTO PREVIEW' : 'VIDEO PREVIEW'}
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{previewTarget.title}</h3>
                {previewTarget.subtitle ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{previewTarget.subtitle}</p> : null}

                {previewTarget.type === 'photo-gallery' && previewTarget.category ? (
                  <span className="mt-2 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-200/70 dark:bg-cyan-950/40 dark:text-cyan-200 dark:ring-cyan-800">
                    {previewTarget.category}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null)
                    setDeleteTarget({
                      type: previewTarget.type,
                      id: previewTarget.id,
                      title: previewTarget.title,
                    })
                    closePreview()
                  }}
                  className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Delete
                </button>

                <button
                  type="button"
                  onClick={closePreview}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700">
              {previewTarget.type === 'photo-gallery' ? (
                <div className="relative bg-slate-950">
                  {previewTarget.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewTarget.image_url}
                      alt={previewTarget.title}
                      className="h-[60vh] w-full object-contain bg-black"
                    />
                  ) : (
                    <div className="flex h-[60vh] w-full items-center justify-center bg-black">
                      <p className="text-sm text-white/70">No image</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative bg-slate-950">
                  {previewTarget.link_url ? (
                    <video
                      src={previewTarget.link_url}
                      controls
                      autoPlay
                      className="h-[60vh] w-full bg-black object-contain"
                    />
                  ) : (
                    <div className="flex h-[60vh] w-full items-center justify-center bg-black">
                      <p className="text-sm text-white/70">No video</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {previewTarget.type === 'video-gallery' && previewTarget.link_url ? (
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tip: Use the video controls to pause/seek.</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Confirm Delete Modal (existing flow) */}
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

            {deleteError ? <p className="mt-3 text-xs font-medium text-rose-600">{deleteError}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
