'use client'

import { useMemo, useRef, useState } from 'react'
import { BulkImportProductsRow, useBulkImportProductsMutation } from '@/store/api/productsApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'

interface BulkProductImportPanelProps {
  onClose: () => void
  onImported?: () => void
}

type ParsedCsv = {
  headers: string[]
  rows: BulkImportProductsRow[]
}

const REQUIRED_COLUMNS = ['pd_name', 'pd_catid', 'pd_price_srp']
const OPTIONAL_COLUMNS = [
  'pd_parent_sku',
  'pd_brand_type',
  'pd_catsubid',
  'pd_room_type',
  'pd_price_dp',
  'pd_price_member',
  'pd_prodpv',
  'pd_qty',
  'pd_weight',
  'pd_psweight',
  'pd_pswidth',
  'pd_pslenght',
  'pd_psheight',
  'pd_description',
  'pd_specifications',
  'pd_material',
  'pd_warranty',
  'pd_image',
  'pd_images',
  'pd_type',
  'pd_status',
  'pd_musthave',
  'pd_bestseller',
  'pd_salespromo',
  'pd_assembly_required',
]

const SAMPLE_ROWS = [
  ['Sample Chair', 'CHAIR-001', '12', '2499', '1999', '1799', '10', 'https://example.com/chair.jpg'],
  ['Sample Table', 'TABLE-001', '15', '5999', '4999', '4599', '4', 'https://example.com/table.jpg'],
]

const parseCsvLine = (line: string) => {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values.map((value) => value.replace(/^"|"$/g, '').trim())
}

const parseCsvText = (text: string): ParsedCsv => {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one product row.')
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim())
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column))
  if (missing.length > 0) {
    throw new Error(`Missing required column(s): ${missing.join(', ')}`)
  }

  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })

    return row
  })

  return { headers, rows }
}

const buildTemplateCsv = () => {
  const headers = ['pd_name', 'pd_parent_sku', 'pd_catid', 'pd_price_srp', 'pd_price_dp', 'pd_price_member', 'pd_qty', 'pd_image']
  const rows = [headers, ...SAMPLE_ROWS]
  return rows.map((row) => row.join(',')).join('\n')
}

export default function BulkProductImportPanel({ onClose, onImported }: BulkProductImportPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [fileName, setFileName] = useState('')
  const [csvText, setCsvText] = useState('')
  const [parseError, setParseError] = useState('')
  const [importMode, setImportMode] = useState<'create_only' | 'create_or_update'>('create_or_update')
  const [importProducts, { isLoading }] = useBulkImportProductsMutation()

  const parsed = useMemo(() => {
    if (!csvText.trim()) return null

    try {
      setParseError('')
      return parseCsvText(csvText)
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Failed to parse CSV file.')
      return null
    }
  }, [csvText])

  const previewRows = useMemo(
    () =>
      (parsed?.rows ?? []).map((row, index) => ({
        index: index + 1,
        name: String(row.pd_name ?? '').trim() || 'Unnamed product',
        sku: String(row.pd_parent_sku ?? '').trim() || 'No SKU',
        category: String(row.pd_catid ?? '').trim() || 'N/A',
        srp: String(row.pd_price_srp ?? '').trim() || '0',
        qty: String(row.pd_qty ?? '').trim() || '0',
      })),
    [parsed],
  )

  const handlePickFile = async (file?: File | null) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please upload a .csv file.')
      return
    }

    const text = await file.text()
    setFileName(file.name)
    setCsvText(text)
  }

  const downloadTemplate = () => {
    const blob = new Blob([buildTemplateCsv()], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'afhome-product-import-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (!parsed || parsed.rows.length === 0) {
      showErrorToast('Upload a valid CSV file first.')
      return
    }

    try {
      const response = await importProducts({
        mode: importMode,
        rows: parsed.rows,
      }).unwrap()

      const summary = response.summary
      showSuccessToast(`Import finished: ${summary.created} created, ${summary.updated} updated, ${summary.failed} failed.`)
      onImported?.()
      onClose()
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message || 'Bulk import failed.'
      showErrorToast(message)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-5">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Upload one CSV file to create many products at once. Required columns: <span className="font-semibold">{REQUIRED_COLUMNS.join(', ')}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-500/30 transition hover:bg-teal-700"
          >
            Select CSV File
          </button>
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Download Template
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => void handlePickFile(event.target.files?.[0] ?? null)}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Import Mode</p>
              <p className="text-xs text-slate-500">Choose whether matching SKU rows should create only or update existing products.</p>
            </div>
            <div className="flex rounded-xl bg-slate-100 p-1">
              {[
                { value: 'create_or_update', label: 'Create or Update' },
                { value: 'create_only', label: 'Create Only' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setImportMode(option.value as 'create_only' | 'create_or_update')}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    importMode === option.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-700">Supported optional columns</p>
              <p className="mt-1">{OPTIONAL_COLUMNS.join(', ')}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Tip</p>
              <p className="mt-1">Use `pd_images` if you want multiple image URLs. Separate them using `|` inside one cell.</p>
            </div>
          </div>
        </div>

        {fileName ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            Selected file: <span className="font-semibold">{fileName}</span>
          </div>
        ) : null}

        {parseError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{parseError}</div>
        ) : null}

        {parsed ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Rows Ready</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{parsed.rows.length}</p>
                <p className="text-xs text-slate-500">Products detected in this CSV</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Columns Found</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{parsed.headers.length}</p>
                <p className="text-xs text-slate-500">CSV headers recognized</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Mode</p>
                <p className="mt-1 text-lg font-bold text-slate-800">{importMode === 'create_or_update' ? 'Create or Update' : 'Create Only'}</p>
                <p className="text-xs text-slate-500">Import behavior for matching SKU</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">Upload Summary</p>
                <p className="text-xs text-slate-500">Ito ang mga product rows na ma-u-upload kapag tinuloy mo ang import.</p>
              </div>
              <div className="max-h-80 overflow-auto divide-y divide-slate-100">
                {previewRows.map((row) => (
                  <div key={`${row.index}-${row.sku}-${row.name}`} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">Row {row.index}</span>
                          <p className="text-sm font-semibold text-slate-800">{row.name}</p>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>SKU: {row.sku}</span>
                          <span>Category ID: {row.category}</span>
                          <span>SRP: PHP {row.srp}</span>
                          <span>Qty: {row.qty}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">Raw Preview</p>
                <p className="text-xs text-slate-500">Quick table view of the uploaded CSV fields.</p>
              </div>
              <div className="max-h-72 overflow-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      {parsed.headers.slice(0, 6).map((header) => (
                        <th key={header} className="px-4 py-3 font-semibold text-slate-600">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsed.rows.slice(0, 8).map((row, index) => (
                      <tr key={index} className="bg-white">
                        {parsed.headers.slice(0, 6).map((header) => (
                          <td key={header} className="px-4 py-3 text-slate-600">{String((row as Record<string, unknown>)[header] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6 sm:py-4 flex items-center gap-3">
        <p className="text-xs text-slate-400 flex-1">Manual add still works. This option is only for bulk CSV imports.</p>
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={isLoading || !parsed || parsed.rows.length === 0}
          className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-teal-500/30 transition hover:bg-teal-700 disabled:opacity-60"
        >
          {isLoading ? 'Importing...' : 'Import Products'}
        </button>
      </div>
    </div>
  )
}
