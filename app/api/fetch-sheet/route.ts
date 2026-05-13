import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { adminAuthOptions } from '@/libs/adminAuth'
import { partnerAuthOptions } from '@/libs/partnerAuth'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 30
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

const getClientIp = (request: Request) => {
  const forwarded = request.headers.get('x-forwarded-for') ?? ''
  const first = forwarded.split(',')[0]?.trim()
  if (first) return first
  return request.headers.get('x-real-ip') ?? 'unknown'
}

const isRateLimited = (key: string) => {
  const now = Date.now()
  const current = rateLimitStore.get(key)
  if (!current || now >= current.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  current.count += 1
  if (current.count > RATE_LIMIT_MAX_REQUESTS) return true
  rateLimitStore.set(key, current)
  return false
}

export async function GET(request: Request) {
  const [adminSession, partnerSession] = await Promise.all([
    getServerSession(adminAuthOptions),
    getServerSession(partnerAuthOptions),
  ])
  if (!adminSession?.user && !partnerSession?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIp(request)
  const limitKey = `fetch-sheet:${ip}`
  if (isRateLimited(limitKey)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const sheetUrl = searchParams.get('url')

  if (!sheetUrl) {
    return NextResponse.json({ error: 'Missing url parameter.' }, { status: 400 })
  }

  if (sheetUrl.length > 2048) {
    return NextResponse.json({ error: 'URL is too long.' }, { status: 400 })
  }

  if (!sheetUrl.startsWith('https://docs.google.com/spreadsheets/d/')) {
    return NextResponse.json({ error: 'Only Google Sheets URLs are allowed.' }, { status: 400 })
  }

  const idMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (!idMatch) {
    return NextResponse.json({ error: 'Invalid Google Sheets URL.' }, { status: 400 })
  }

  const spreadsheetId = idMatch[1]
  const gidMatch = sheetUrl.match(/[?&#]gid=(\d+)/)
  const gid = gidMatch ? gidMatch[1] : '0'
  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`

  try {
    const response = await fetch(exportUrl)
    if (!response.ok) {
      return NextResponse.json(
        { error: `Google Sheets returned ${response.status}. Make sure the sheet is shared as "Anyone with the link can view".` },
        { status: 502 },
      )
    }

    const csv = await response.text()
    return new NextResponse(csv, {
      status: 200,
      headers: { 'Content-Type': 'text/csv; charset=utf-8' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to reach Google Sheets. Check the URL and try again.' }, { status: 502 })
  }
}
