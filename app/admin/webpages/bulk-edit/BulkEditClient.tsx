'use client'

import { useMemo, useState } from 'react'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import { useBulkUpdateApplyMutation, useBulkUpdatePreviewMutation } from '@/store/api/productsApi'

export default function BulkEditClient() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([])
  const [previewRows, setPreviewRows] = useState<Array<Record<string, unknown>>>([])
  const [previewSummary, setPreviewSummary] = useState<{ total: number; ready: number; failed: number } | null>(null)
  const [applySummary, setApplySummary] = useState<{ total: number; updated: number; failed: number } | null>(null)
  const [isParsing, setIsParsing] = useState(false)

  const [previewBulkUpdate, { isLoading: isPreviewLoading }] = useBulkUpdatePreviewMutation()
  const [applyBulkUpdate, { isLoading: isApplyLoading }] = useBulkUpdateApplyMutation()

  const isBusy = isParsing || isPreviewLoading || isApplyLoading

  const normalizeKey = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_')

  const parseNumber = (value: unknown) => {
    if (value === null || value === undefined) return null
    if (typeof value === 'number' && !Number.isNaN(value)) return value
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.\-]/g, '')
      if (!cleaned) return null
      const num = Number(cleaned)
      return Number.isNaN(num) ? null : num
    }
    return null
  }

  const pickValue = (row: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
        return row[key]
      }
    }
    return null
  }

  const parsedRows = useMemo(() => rows, [rows])

  const parseCsvLine = (line: string) => {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index]
      const nextChar = line[index + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          index += 1
        } else {
          inQuotes = !inQuotes
        }
        continue
      }

      if (char === ',' && !inQuotes) {
        values.push(current)
        current = ''
        continue
      }

      current += char
    }

    values.push(current)
    return values
  }

  const parseCsv = (content: string) => {
    const normalizedContent = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines: string[] = []
    let current = ''
    let inQuotes = false

    for (let index = 0; index < normalizedContent.length; index += 1) {
      const char = normalizedContent[index]
      const nextChar = normalizedContent[index + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          index += 1
        } else {
          inQuotes = !inQuotes
        }
        continue
      }

      if (char === '\n' && !inQuotes) {
        lines.push(current)
        current = ''
        continue
      }

      current += char
    }

    if (current || lines.length > 0) {
      lines.push(current)
    }

    const nonEmptyLines = lines.filter((line) => line.trim() !== '')
    if (nonEmptyLines.length === 0) return []

    const [headerLine, ...dataLines] = nonEmptyLines
    const headers = parseCsvLine(headerLine).map((header) => normalizeKey(header))

    return dataLines.map((line) => {
      const cells = parseCsvLine(line)
      const row: Record<string, unknown> = {}

      headers.forEach((header, index) => {
        if (!header) return
        row[header] = cells[index] ?? ''
      })

      return row
    })
  }

  const handleFile = async (file: File) => {
    setIsParsing(true)
    setApplySummary(null)
    setPreviewRows([])
    setPreviewSummary(null)
    setFileName(file.name)

    try {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Only CSV files are supported.')
      }

      const content = await file.text()
      const parsed = parseCsv(content)
      setRows(parsed)
      showSuccessToast(`Loaded ${parsed.length} rows from ${file.name}`)
    } catch {
      showErrorToast('Failed to read the file. Please upload a valid CSV file.')
      setRows([])
      setFileName(null)
    } finally {
      setIsParsing(false)
    }
  }

  const buildPayloadRows = () => {
    return parsedRows
      .map((row) => {
        const sku = String(
          pickValue(row, ['sku', 'pd_parent_sku', 'product_sku', 'parent_sku', 'item_sku']) ?? '',
        ).trim()
        const idRaw = pickValue(row, ['id', 'pd_id', 'product_id'])
        const id = idRaw ? Number(idRaw) : null
        const name = pickValue(row, ['product_name', 'name', 'pd_name'])
        const categoryRaw = pickValue(row, ['category_id', 'catid', 'pd_catid', 'category'])
        const roomRaw = pickValue(row, ['room_type', 'shop_by_room', 'pd_room_type', 'shop_by_room_id'])
        const categoryId = parseNumber(categoryRaw)
        const roomType = parseNumber(roomRaw)
        const material = pickValue(row, ['material', 'pd_material'])
        const priceSrp = parseNumber(pickValue(row, ['srp_price', 'price_srp', 'pd_price_srp', 'srp', 'price']))
        const priceDp = parseNumber(pickValue(row, ['dealer_price', 'price_dp', 'pd_price_dp', 'dp']))
        const priceMember = parseNumber(pickValue(row, ['member_price', 'price_member', 'pd_price_member']))
        const qtyRaw = pickValue(row, [
          'qty',
          'quantity',
          'quanatatity',
          'quanity',
          'quantaty',
          'quantitiy',
          'pd_qty',
        ])
        const qty = parseNumber(qtyRaw)
        const weight = parseNumber(pickValue(row, ['weight', 'net_weight', 'pd_weight']))
        const width = parseNumber(pickValue(row, ['width', 'pd_pswidth']))
        const length = parseNumber(pickValue(row, ['length', 'pd_pslenght']))
        const height = parseNumber(pickValue(row, ['height', 'pd_psheight']))
        const packageWeight = parseNumber(pickValue(row, ['package_weight', 'psweight', 'pd_psweight']))

        if (!sku && !id) return null
        if (
          name === null &&
          categoryRaw === null &&
          roomRaw === null &&
          material === null &&
          priceSrp === null &&
          priceDp === null &&
          priceMember === null &&
          qtyRaw === null &&
          weight === null &&
          width === null &&
          length === null &&
          height === null &&
          packageWeight === null
        ) return null

        return {
          id: id ?? undefined,
          sku: sku || undefined,
          pd_name: typeof name === 'string' ? name : undefined,
          pd_catid: categoryId ?? (typeof categoryRaw === 'string' ? categoryRaw : undefined),
          pd_room_type: roomType ?? (typeof roomRaw === 'string' ? roomRaw : undefined),
          // brand updates are intentionally ignored for bulk edit
          pd_material: typeof material === 'string' ? material : undefined,
          pd_price_srp: priceSrp ?? undefined,
          pd_price_dp: priceDp ?? undefined,
          pd_price_member: priceMember ?? undefined,
          pd_qty: qtyRaw !== null ? (qty ?? undefined) : undefined,
          pd_weight: weight ?? undefined,
          pd_pswidth: width ?? undefined,
          pd_pslenght: length ?? undefined,
          pd_psheight: height ?? undefined,
          pd_psweight: packageWeight ?? undefined,
        }
      })
      .filter(Boolean) as Array<Record<string, unknown>>
  }

  const handlePreview = async () => {
    const payloadRows = buildPayloadRows()
    if (payloadRows.length === 0) {
      showErrorToast('No valid rows found. Make sure SKU/ID and at least one editable column exist.')
      return
    }

    try {
      const response = await previewBulkUpdate({ rows: payloadRows }).unwrap()
      setPreviewRows(response.results ?? [])
      setPreviewSummary(response.summary ?? null)
      showSuccessToast(response.message || 'Preview generated.')
    } catch (error: any) {
      showErrorToast(error?.data?.message || 'Failed to generate preview.')
    }
  }

  const handleApply = async () => {
    const payloadRows = buildPayloadRows()
    if (payloadRows.length === 0) {
      showErrorToast('No valid rows found to apply.')
      return
    }

    try {
      const response = await applyBulkUpdate({ rows: payloadRows }).unwrap()
      setApplySummary(response.summary ?? null)
      showSuccessToast(response.message || 'Bulk update applied.')
    } catch (error: any) {
      showErrorToast(error?.data?.message || 'Failed to apply bulk update.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-400">Web Content</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Bulk Edit</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Upload a spreadsheet to update product details in bulk (name, category, room, material, prices,
          quantity, and dimensions).
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-100/60 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-sky-100/70 blur-3xl animate-pulse" />

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-400">Bulk Workspace</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">Bulk Edit Interface</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Upload a CSV file to apply product updates across multiple items in one streamlined pass.
                Use SKU or Product ID plus any fields you want to change. Suggested headers:
                <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">
                  Product Name, Category, Shop By Room, Material, SRP Price, Member Price, Dealer Price,
                  Quantity (or Qty), Weight, Width, Length, Height, Package Weight.
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 dark:border-cyan-900/40 dark:bg-cyan-950/30">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Tip</p>
              <p className="mt-1 text-sm font-medium text-cyan-900 dark:text-cyan-100">Use the latest export to avoid ID mismatches.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <label
              htmlFor="bulk-edit-upload"
              className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-6 text-center transition hover:border-cyan-300 hover:shadow-md dark:border-cyan-900/40 dark:from-cyan-950/20 dark:via-slate-900 dark:to-sky-950/20"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-cyan-100 dark:bg-slate-800 dark:ring-cyan-900/30">
                <svg className="h-6 w-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 16V6m0 0l-3 3m3-3l3 3M4 16.5a2.5 2.5 0 002.5 2.5h11a2.5 2.5 0 002.5-2.5" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Drop your file here</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">CSV up to 10MB</p>
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-xs font-semibold text-white transition group-hover:bg-cyan-700">
                Browse Files
                <span className="inline-flex h-2 w-2 rounded-full bg-white/90 animate-ping" />
              </span>
              <input
                id="bulk-edit-upload"
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void handleFile(file)
                }}
              />
            </label>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Quick Actions</p>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  className="w-full rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100"
                >
                  Download Template
                </button>
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={isBusy}
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
                >
                  Upload & Preview Changes
                </button>
              </div>
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preview shows current values and the fields that will be updated.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-800">File: {fileName || 'None'}</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-800">Rows loaded: {parsedRows.length}</span>
          </div>
        </div>
      </div>

      {(previewRows.length > 0 || previewSummary) && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Preview</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">Proposed Price Updates</h3>
              {previewSummary && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Total: {previewSummary.total} · Ready: {previewSummary.ready} · Failed: {previewSummary.failed}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleApply}
              disabled={isBusy || previewRows.length === 0}
              className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:opacity-60"
            >
              Apply Updates
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-[80px_140px_1.2fr_1.6fr_120px] gap-0 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <span>Row</span>
              <span>SKU</span>
              <span>Product</span>
              <span>Changes</span>
              <span>Status</span>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {previewRows.map((row: any) => (
                <div
                  key={`${row.row}-${row.sku}-${row.status}`}
                  className="grid grid-cols-[80px_140px_1.2fr_1.6fr_120px] items-center gap-0 border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400">#{row.row}</span>
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{row.sku || '—'}</span>
                  <span className="text-slate-800 dark:text-slate-100">{row.name || row.message}</span>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {row.current && row.next
                      ? Object.keys(row.next).map((key: string) => {
                        const labelMap: Record<string, string> = {
                          pd_name: 'Product Name',
                          pd_catid: 'Category',
                          pd_room_type: 'Shop By Room',
                          pd_material: 'Material',
                          pd_price_srp: 'SRP Price',
                          pd_price_member: 'Member Price',
                          pd_price_dp: 'Dealer Price',
                          pd_qty: 'Quantity',
                          pd_weight: 'Weight',
                          pd_pswidth: 'Width',
                          pd_pslenght: 'Length',
                          pd_psheight: 'Height',
                          pd_psweight: 'Package Weight',
                        }
                        const label = labelMap[key] ?? key
                        return (
                          <div key={`${row.row}-${key}`}>
                            <span className="font-semibold">{label}</span>: {row.current?.[key] ?? '—'} → {row.next?.[key] ?? '—'}
                          </div>
                        )
                      })
                      : row.message}
                  </div>
                  <span
                    className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      row.status === 'ready'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {row.status === 'ready' ? 'Ready' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {applySummary && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
              Applied updates: {applySummary.updated} succeeded, {applySummary.failed} failed, out of {applySummary.total}.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
