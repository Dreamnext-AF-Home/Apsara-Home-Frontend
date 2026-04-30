import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getServerSession } from 'next-auth'
import { adminAuthOptions } from '@/libs/adminAuth'

export const runtime = 'nodejs'

const signRateWindowMs = 60_000
const signRateLimit = 30
const signHits = new Map<string, { count: number; startedAt: number }>()

export async function POST(req: NextRequest) {
  const session = await getServerSession(adminAuthOptions)
  const role = String((session?.user as { role?: string } | undefined)?.role ?? '').toLowerCase()
  if (!session?.user || !['super_admin', 'admin', 'web_content'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const hit = signHits.get(ip)
  if (!hit || now - hit.startedAt > signRateWindowMs) {
    signHits.set(ip, { count: 1, startedAt: now })
  } else {
    if (hit.count >= signRateLimit) {
      return NextResponse.json({ error: 'Too many signature requests. Please wait and try again.' }, { status: 429 })
    }
    hit.count += 1
    signHits.set(ip, hit)
  }

  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!apiSecret) {
    return NextResponse.json({ error: 'Cloudinary not configured.' }, { status: 500 })
  }

  try {
    const body = await req.json() as { params_to_sign?: Record<string, unknown> }
    const paramsToSign = body.params_to_sign ?? {}

    const paramsString = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${String(paramsToSign[key])}`)
      .join('&')

    const signature = crypto
      .createHash('sha1')
      .update(paramsString + apiSecret)
      .digest('hex')

    return NextResponse.json({ signature })
  } catch {
    return NextResponse.json({ error: 'Failed to generate signature.' }, { status: 500 })
  }
}
