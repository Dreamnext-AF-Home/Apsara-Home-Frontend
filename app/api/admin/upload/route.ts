import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { getServerSession } from 'next-auth'
import { adminAuthOptions } from '@/libs/adminAuth'

export const runtime = 'nodejs'
export const maxDuration = 30

const uploadRateWindowMs = 60_000
const uploadRateLimit = 20
const uploadHits = new Map<string, { count: number; startedAt: number }>()

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET

cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: cloudinaryApiKey,
  api_secret: cloudinaryApiSecret,
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(adminAuthOptions)
    const role = String((session?.user as { role?: string } | undefined)?.role ?? '').toLowerCase()
    if (!session?.user || !['super_admin', 'admin', 'web_content'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const now = Date.now()
    const hit = uploadHits.get(ip)
    if (!hit || now - hit.startedAt > uploadRateWindowMs) {
      uploadHits.set(ip, { count: 1, startedAt: now })
    } else {
      if (hit.count >= uploadRateLimit) {
        return NextResponse.json({ error: 'Too many upload requests. Please wait and try again.' }, { status: 429 })
      }
      hit.count += 1
      uploadHits.set(ip, hit)
    }

    if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured on this deployment.' },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folderType = String(formData.get('folder') ?? 'products').toLowerCase()
    const assetType = String(formData.get('asset_type') ?? 'image').toLowerCase()

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const isPdf = assetType === 'pdf'
    const isVideo = assetType === 'video'
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const allowedPdfTypes = ['application/pdf']
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-ms-wmv']
    const allowedTypes = isPdf ? allowedPdfTypes : isVideo ? allowedVideoTypes : allowedImageTypes
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: isPdf
          ? 'Invalid file type. Only PDF files are allowed.'
          : isVideo
            ? 'Invalid file type. Only MP4, MOV, WEBM, AVI, and WMV are allowed.'
          : 'Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.',
      }, { status: 400 })
    }

    const maxSizeBytes = isPdf ? 20 * 1024 * 1024 : isVideo ? 150 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return NextResponse.json({
        error: isPdf
          ? 'File too large. Maximum size is 20MB for PDF files.'
          : isVideo
            ? 'File too large. Maximum size is 150MB for video files.'
          : 'File too large. Maximum size is 5MB.',
      }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    const folderMap: Record<string, string> = {
      products: 'apsara/products',
      encashment: 'apsara/encashment/proofs',
      verification: 'apsara/verification',
      profile: 'apsara/profile',
      'assembly-guides': 'apsara/assembly-guides',
      'web-content': 'apsara/web-content',
      'project-gallery': 'apsara/project-gallery',
    }
    const folder = folderMap[folderType] ?? folderMap.products

    const result = isPdf
      ? await cloudinary.uploader.upload(base64, {
          folder,
          resource_type: 'raw',
          use_filename: true,
          unique_filename: true,
        })
      : isVideo
        ? await cloudinary.uploader.upload(base64, {
            folder,
            resource_type: 'video',
            use_filename: true,
            unique_filename: true,
          })
      : await cloudinary.uploader.upload(base64, {
          folder,
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        })

    return NextResponse.json({ url: result.secure_url, public_id: result.public_id })
  } catch (err: unknown) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}
