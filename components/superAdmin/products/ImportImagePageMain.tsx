'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import RichTextEditor from '@/components/ui/RichTextEditor'
import { colorNameToHex, hexToColorName } from '@/libs/colorUtils'

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget(
        options: Record<string, unknown>,
        callback: (
          error: { status: string; statusText: string } | null,
          result: CloudinaryWidgetResult,
        ) => void,
      ): CloudinaryWidget
    }
  }
}

type CloudinaryWidgetResult = {
  event: string
  info: {
    secure_url: string
    original_filename: string
    bytes: number
    public_id: string
    format: string
    width: number
    height: number
  }
}

type CloudinaryWidget = {
  open(): void
  close(): void
  destroy(): void
}

interface UploadedImage {
  url: string
  filename: string
  bytes: number
  publicId: string
  width: number
  height: number
}

const CLOUD_NAME = 'dc05ncs6l'
const API_KEY = '492967473972197'

const generateSkuFromName = (name: string) => {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '')
  if (!letters) return ''
  const vowels = new Set(['A', 'E', 'I', 'O', 'U'])
  const consonants = letters.split('').filter(ch => !vowels.has(ch))
  const vowelChars = letters.split('').filter(ch => vowels.has(ch))
  const prefix = [
    consonants[0] ?? letters[0] ?? 'P',
    consonants[1] ?? letters[1] ?? 'R',
    consonants[2] ?? letters[2] ?? 'D',
    vowelChars[0] ?? letters[3] ?? 'X',
  ].join('')
  return `${prefix}-${Date.now().toString().slice(-5)}`
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ImportImagePageMain() {
  const widgetRef = useRef<CloudinaryWidget | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [copied, setCopied] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  
  // Track batch uploads to preserve selection order
  const batchRef = useRef<Map<string, UploadedImage>>(new Map())
  const batchOrderRef = useRef<string[]>([])
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Description builder state
  const [descHtml, setDescHtml] = useState('')
  const [descCopied, setDescCopied] = useState(false)

  // Color lookup state — mirrors AddProductModal's color input pattern
  const [colorName, setColorName] = useState('')
  const [colorHex, setColorHex] = useState('#94a3b8')
  const [colorCopied, setColorCopied] = useState(false)

  // SKU generator state
  const [skuProductName, setSkuProductName] = useState('')
  const [skuCopied, setSkuCopied] = useState(false)
  const generatedSku = useMemo(
    () => generateSkuFromName(skuProductName),
    [skuProductName],
  )

  // Load Cloudinary widget script once
  useEffect(() => {
    if (document.getElementById('cld-upload-widget')) {
      setScriptLoaded(true)
      return
    }
    const script = document.createElement('script')
    script.id = 'cld-upload-widget'
    script.src = 'https://upload-widget.cloudinary.com/global/all.js'
    script.onload = () => setScriptLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Create widget once script is ready
  useEffect(() => {
    if (!scriptLoaded || !window.cloudinary || widgetRef.current) return

    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUD_NAME,
        apiKey: API_KEY,
        uploadSignature: (
          callback: (sig: string) => void,
          paramsToSign: Record<string, unknown>,
        ) => {
          void fetch('/api/admin/cloudinary-sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params_to_sign: paramsToSign }),
          })
            .then((r) => r.json())
            .then((data: { signature: string }) => callback(data.signature))
        },
        folder: 'apsara/products',
        multiple: true,
        sources: [
          'local',
          'url',
          'camera',
          'image_search',
          'google_drive',
          'dropbox',
          'shutterstock',
          'getty',
          'istock',
          'unsplash',
        ],
        resourceType: 'image',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        maxFileSize: 5_000_000,
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
        styles: {
          palette: {
            window: '#FFFFFF',
            windowBorder: '#E2E8F0',
            tabIcon: '#0F766E',
            menuIcons: '#5A616A',
            textDark: '#1E293B',
            textLight: '#FFFFFF',
            link: '#0F766E',
            action: '#0F766E',
            inactiveTabIcon: '#94A3B8',
            error: '#EF4444',
            inProgress: '#0F766E',
            complete: '#10B981',
            sourceBg: '#F8FAFC',
          },
          fonts: {
            "'Inter', sans-serif": {
              url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap',
              active: true,
            },
          },
        },
      },
      (error, result) => {
        if (error) return
        if (result.event === 'success') {
          const uploadedImage: UploadedImage = {
            url: result.info.secure_url,
            filename: result.info.original_filename,
            bytes: result.info.bytes,
            publicId: result.info.public_id,
            width: result.info.width,
            height: result.info.height,
          }
          // Store in batch map with publicId as key
          batchRef.current.set(result.info.public_id, uploadedImage)
          // Track selection order - Cloudinary fires success events in selection order
          if (!batchOrderRef.current.includes(result.info.public_id)) {
            batchOrderRef.current.push(result.info.public_id)
          }
        } else if (result.event === 'queues-end') {
          // All uploads in batch complete - add images in selection order
          const orderedImages = batchOrderRef.current
            .map((publicId) => batchRef.current.get(publicId))
            .filter((img): img is UploadedImage => img !== undefined)
          
          if (orderedImages.length > 0) {
            setImages((prev) => [...prev, ...orderedImages])
          }
          // Clear batch tracking
          batchRef.current.clear()
          batchOrderRef.current = []
        } else if (result.event === 'abort') {
          // Widget closed without completing - clear batch
          batchRef.current.clear()
          batchOrderRef.current = []
        }
      },
    )

    return () => {
      widgetRef.current?.destroy()
      widgetRef.current = null
    }
  }, [scriptLoaded])

  const openWidget = () => widgetRef.current?.open()

  const removeImage = (publicId: string) =>
    setImages((prev) => prev.filter((img) => img.publicId !== publicId))

  const clearAll = () => {
    setImages([])
    setCopied(false)
    setCopiedIndex(null)
  }

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return
    
    const newImages = [...images]
    const [draggedImage] = newImages.splice(draggedIndex, 1)
    newImages.splice(dropIndex, 0, draggedImage)
    
    setImages(newImages)
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const urls = images.map((img) => img.url)
  const combinedUrl = urls.join('|')

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }

  const handleCopyAll = async () => {
    await copyToClipboard(combinedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyOne = async (url: string, index: number) => {
    await copyToClipboard(url)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleCopyDesc = async () => {
    if (!descHtml) return
    await copyToClipboard(descHtml)
    setDescCopied(true)
    setTimeout(() => setDescCopied(false), 2000)
  }

  const handleCopyHex = async () => {
    await copyToClipboard(colorHex)
    setColorCopied(true)
    setTimeout(() => setColorCopied(false), 2000)
  }

  const handleCopySku = async () => {
    if (!generatedSku) return
    await copyToClipboard(generatedSku)
    setSkuCopied(true)
    setTimeout(() => setSkuCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Import Image</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Upload images to Cloudinary and copy the resulting URL(s).
        </p>
      </div>

      {/* Upload card */}
      <div className="rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center gap-4 px-8 py-10 text-center">
        <div className="rounded-2xl bg-teal-50 p-4">
          <svg className="h-8 w-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">
            {images.length > 0 ? 'Upload more images' : 'Upload images to Cloudinary'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Upload from device, camera, Google Drive, Dropbox, Image Search, and more
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={openWidget}
            disabled={!scriptLoaded}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-500/20 transition hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scriptLoaded ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {images.length > 0 ? 'Upload More' : 'Upload Images'}
              </>
            ) : (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Loading widget…
              </>
            )}
          </button>

          {images.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-red-300 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 hover:border-red-400"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear &amp; Upload Again
            </button>
          )}
        </div>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-2">
            Drag images to reorder them. The order shown will be the order in the link.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {images.map((img, index) => (
              <div
                key={img.publicId}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm cursor-move transition-all ${
                  draggedIndex === index
                    ? 'border-teal-400 opacity-50 scale-95'
                    : 'border-slate-200 hover:border-teal-300'
                }`}
              >
                <div className="absolute top-2 left-2 z-10">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white text-[10px] font-bold shadow">
                    {index + 1}
                  </span>
                </div>
                <div className="relative aspect-square w-full bg-slate-100">
                  <Image
                    src={img.url}
                    alt={img.filename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                  <div className="absolute top-2 right-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="px-2 py-1.5">
                  <p className="truncate text-[10px] font-medium text-slate-600">{img.filename}</p>
                  <p className="text-[10px] text-slate-400">
                    {(img.bytes / 1024).toFixed(0)} KB · {img.width}×{img.height}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(img.publicId)}
                  className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow opacity-0 transition-opacity group-hover:opacity-100"
                  title="Remove"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result URL panel */}
      {urls.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                {urls.length === 1 ? 'Image URL' : `Image URLs — ${urls.length} images, pipe-separated`}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {urls.length > 1
                  ? 'URLs are joined with | — paste directly into the image field.'
                  : 'Paste this URL into the image field.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyAll}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                copied ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy URL{urls.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>

          <div className="px-4 py-3 space-y-2">
            {urls.length > 1 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                  Combined (pipe-separated)
                </p>
                <div
                  onClick={handleCopyAll}
                  className="cursor-pointer select-all break-all rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 transition"
                  title="Click to copy all"
                >
                  {combinedUrl}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              {urls.length > 1 && (
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Individual URLs
                </p>
              )}
              {urls.map((url, i) => (
                <div key={url} className="flex items-center gap-2">
                  {urls.length > 1 && (
                    <span className="shrink-0 text-[10px] font-semibold text-slate-400 w-4 text-right">
                      {i + 1}.
                    </span>
                  )}
                  <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 group/row hover:border-teal-300 hover:bg-teal-50 transition">
                    <span className="flex-1 break-all font-mono text-[11px] text-slate-700 select-all">
                      {url}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleCopyOne(url, i)}
                      className="shrink-0 rounded-lg p-1 text-slate-400 opacity-0 group-hover/row:opacity-100 transition hover:bg-teal-100 hover:text-teal-600"
                      title="Copy this URL"
                    >
                      {copiedIndex === i ? (
                        <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Description Builder ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Description Builder</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Write and format your product description, then copy the HTML to paste into the product form.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyDesc}
            disabled={!descHtml}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${
              descCopied
                ? 'bg-violet-500 text-white'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            {descCopied ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy HTML
              </>
            )}
          </button>
        </div>

        <div className="p-4 space-y-3">
          <RichTextEditor
            value={descHtml}
            onChange={(html) => setDescHtml(html === '<p></p>' ? '' : html)}
            placeholder="Describe this product…"
          />

          {descHtml && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">HTML Output</p>
                <button
                  type="button"
                  onClick={handleCopyDesc}
                  className={`text-[11px] font-semibold transition ${
                    descCopied ? 'text-violet-500' : 'text-slate-400 hover:text-violet-600'
                  }`}
                >
                  {descCopied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div
                onClick={handleCopyDesc}
                title="Click to copy HTML"
                className="cursor-pointer select-all rounded-xl border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-[11px] leading-relaxed text-emerald-300 hover:border-violet-400 transition overflow-auto whitespace-pre-wrap break-words max-h-40"
              >
                {descHtml}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SKU Generator + Color to Hex (side by side) ───────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">SKU Generator &amp; Color to Hex</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate a product SKU from a product name, or convert a color name to its hex code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* ── SKU Generator ── */}
          <div className="p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-600">SKU Generator</p>

            <div className="flex gap-2">
              <input
                type="text"
                value={skuProductName}
                onChange={(e) => {
                  setSkuProductName(e.target.value)
                  setSkuCopied(false)
                }}
                placeholder="Product name (e.g. Jasper Sofa)"
                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
              />
            </div>

            {generatedSku && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 leading-none mb-0.5">Generated SKU</p>
                  <p className="font-mono text-base font-bold text-slate-800">{generatedSku}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySku}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    skuCopied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  {skuCopied ? (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy SKU
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ── Color to Hex ── */}
          <div className="p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-600">Color to Hex</p>

            {/* Color input row — same pattern as AddProductModal */}
            <div className="flex gap-2 items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              {/* Swatch / native color picker */}
              <label className="shrink-0 cursor-pointer relative group">
                <div
                  className="h-9 w-9 rounded-lg border-2 border-white ring-1 ring-slate-200 group-hover:ring-teal-400 transition-all shadow-sm"
                  style={{ backgroundColor: colorHex }}
                />
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => {
                    const hex = e.target.value
                    setColorHex(hex)
                    setColorName(hexToColorName(hex))
                    setColorCopied(false)
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>

              {/* Color name text input */}
              <input
                type="text"
                value={colorName}
                onChange={(e) => {
                  const name = e.target.value
                  setColorName(name)
                  const matched = colorNameToHex(name)
                  if (matched) setColorHex(matched)
                  setColorCopied(false)
                }}
                placeholder="Color name (e.g. Matte Black, Walnut, Navy Blue)"
                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
              />
            </div>

            {/* Hex result + copy */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div
                className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 shadow-sm"
                style={{ backgroundColor: colorHex }}
              />
              <div className="flex-1 min-w-0">
                {colorName.trim() && (
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 leading-none mb-0.5">
                    {colorName}
                  </p>
                )}
                <p className="font-mono text-base font-bold text-slate-800">{colorHex}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyHex}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  colorCopied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {colorCopied ? (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Hex
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
