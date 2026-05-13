import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { adminAuthOptions } from '@/libs/adminAuth'
import { partnerAuthOptions } from '@/libs/partnerAuth'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 20
const MAX_ROWS = 2000
const MAX_COLS = 100
const MAX_BODY_CHARS = 1_000_000
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

const normalizeCell = (value: unknown) => {
  if (value === null || typeof value === 'undefined') return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

export async function POST(request: Request) {
  try {
    const [adminSession, partnerSession] = await Promise.all([
      getServerSession(adminAuthOptions),
      getServerSession(partnerAuthOptions),
    ])
    if (!adminSession?.user && !partnerSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ip = getClientIp(request)
    const limitKey = `push-sheet:${ip}`
    if (isRateLimited(limitKey)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }

    const contentLength = Number(request.headers.get('content-length') ?? 0)
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_CHARS) {
      return NextResponse.json({ error: 'Request body too large.' }, { status: 413 })
    }

    const body = await request.json()
    const { spreadsheetId, gid, data } = body

    if (!spreadsheetId || !data) {
      return NextResponse.json({ error: 'Missing spreadsheetId or data' }, { status: 400 })
    }
    if (typeof spreadsheetId !== 'string' || !/^[a-zA-Z0-9-_]+$/.test(spreadsheetId)) {
      return NextResponse.json({ error: 'Invalid spreadsheetId' }, { status: 400 })
    }
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Data must be a non-empty array' }, { status: 400 })
    }
    if (data.length > MAX_ROWS) {
      return NextResponse.json({ error: `Data exceeds max rows (${MAX_ROWS})` }, { status: 400 })
    }

    const sheetGid = gid || '0'

    // Convert data to CSV format for Google Sheets
    const firstRow = data[0]
    if (!firstRow || typeof firstRow !== 'object' || Array.isArray(firstRow)) {
      return NextResponse.json({ error: 'Each row must be an object' }, { status: 400 })
    }

    const headers = Object.keys(firstRow as Record<string, unknown>)
    if (headers.length === 0) {
      return NextResponse.json({ error: 'Data rows must contain at least one column' }, { status: 400 })
    }
    if (headers.length > MAX_COLS) {
      return NextResponse.json({ error: `Too many columns (max ${MAX_COLS})` }, { status: 400 })
    }

    const csvRows = [
      headers.join(','),
      ...data.map((row: unknown) =>
        headers.map(header => {
          const rowObject = (row && typeof row === 'object' && !Array.isArray(row))
            ? (row as Record<string, unknown>)
            : {}
          const value = normalizeCell(rowObject[header])
          // Handle strings with commas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value ?? ''
        }).join(',')
      )
    ]
    const csvContent = csvRows.join('\n')

    // For now, we'll return the CSV content with instructions
    // In production, you would use Google Sheets API with OAuth/service account
    return NextResponse.json({
      success: true,
      message: 'Data prepared for spreadsheet',
      csvContent,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=${sheetGid}`,
      instructions: 'Copy the CSV content below and paste it into your Google Sheet'
    })
  } catch (error) {
    console.error('Error pushing to spreadsheet:', error)
    return NextResponse.json({ error: 'Failed to push data to spreadsheet' }, { status: 500 })
  }
}
