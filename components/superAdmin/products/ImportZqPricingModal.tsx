'use client'

import { useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  useBulkUpdateZqPricingMutation,
  type BulkUpdateZqPricingRow,
  type BulkUpdateZqPricingResultRow,
} from '@/store/api/productsApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'

/* ─── types ─────────────────────────────────────────────────────────── */

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface ParsedRow {
  rowIndex: number
  externalId: string
  memberPrice: string
  dealerPrice: string
  pv: string
  pvTier: string
  reversedPvMultiplier: string
  validationError: string | null
}

type Stage = 'idle' | 'preview' | 'result'

/* ─── CSV parsing ────────────────────────────────────────────────────  */

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      let field = ''
      i++
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') { field += '"'; i += 2 }
          else { i++; break }
        } else { field += line[i++] }
      }
      fields.push(field)
      if (line[i] === ',') i++
    } else {
      const end = line.indexOf(',', i)
      if (end === -1) { fields.push(line.slice(i)); break }
      fields.push(line.slice(i, end))
      i = end + 1
    }
  }
  return fields
}

/* Column headers exactly as written by exportZqToCSV (case-insensitive match) */
const EXPECTED_COLS = {
  externalId:           'external id',
  memberPrice:          'member price (₱)',
  dealerPrice:          'dealer price (₱)',
  pv:                   'pv',
  pvTier:               'pv tier',
  reversedPvMultiplier: 'reversed pv multiplier',
} as const

function parseCsv(raw: string): ParsedRow[] {
  /* strip UTF-8 BOM */
  const text  = raw.startsWith('﻿') ? raw.slice(1) : raw
  const lines = text.split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const idx = (name: string) => headers.indexOf(name)

  const colIdx = {
    externalId:           idx(EXPECTED_COLS.externalId),
    memberPrice:          idx(EXPECTED_COLS.memberPrice),
    dealerPrice:          idx(EXPECTED_COLS.dealerPrice),
    pv:                   idx(EXPECTED_COLS.pv),
    pvTier:               idx(EXPECTED_COLS.pvTier),
    reversedPvMultiplier: idx(EXPECTED_COLS.reversedPvMultiplier),
  }

  if (colIdx.externalId === -1) {
    throw new Error(
      `Missing required column "External ID". ` +
      `Detected headers: ${headers.join(', ')}. ` +
      `Make sure you are uploading a file exported from the ZQ products table.`
    )
  }

  const rows: ParsedRow[] = []

  for (let lineNum = 1; lineNum < lines.length; lineNum++) {
    const raw2 = lines[lineNum]
    if (!raw2 || raw2.trim() === '') continue

    const cells = parseCsvLine(raw2)
    const cell  = (i: number) => (i >= 0 ? (cells[i] ?? '').trim() : '')

    const externalId = cell(colIdx.externalId)
    if (!externalId) continue

    const mpStr   = cell(colIdx.memberPrice)
    const dpStr   = cell(colIdx.dealerPrice)
    const pvStr   = cell(colIdx.pv)
    const tierStr = cell(colIdx.pvTier)
    const multStr = cell(colIdx.reversedPvMultiplier)

    const isNumericOrEmpty = (v: string) => v === '' || /^\d+(\.\d+)?$/.test(v)

    let validationError: string | null = null
    if (!isNumericOrEmpty(mpStr))   validationError = `Member Price "${mpStr}" is not a valid number`
    else if (!isNumericOrEmpty(dpStr))   validationError = `Dealer Price "${dpStr}" is not a valid number`
    else if (!isNumericOrEmpty(pvStr))   validationError = `PV "${pvStr}" is not a valid number`
    else if (!isNumericOrEmpty(multStr)) validationError = `Reversed PV Multiplier "${multStr}" is not a valid number`
    else if (tierStr && tierStr !== 'low_end' && tierStr !== 'high_end')
      validationError = `PV Tier must be "low_end" or "high_end", got "${tierStr}"`

    rows.push({
      rowIndex: lineNum,
      externalId,
      memberPrice: mpStr,
      dealerPrice: dpStr,
      pv: pvStr,
      pvTier: tierStr || 'low_end',
      reversedPvMultiplier: multStr,
      validationError,
    })
  }

  return rows
}

const phpToCents = (v: string): number | null => {
  if (!v.trim()) return null
  const n = parseFloat(v)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null
}

const toPayloadRow = (row: ParsedRow): BulkUpdateZqPricingRow => ({
  externalId:           row.externalId,
  member_price:         phpToCents(row.memberPrice),
  dealer_price:         phpToCents(row.dealerPrice),
  pv:                   row.pv !== '' ? parseFloat(row.pv) : null,
  pv_tier:              row.pvTier || null,
  reversed_pv_multiplier: row.reversedPvMultiplier !== '' ? parseFloat(row.reversedPvMultiplier) : null,
})

/* ─── component ──────────────────────────────────────────────────────  */

export default function ImportZqPricingModal({ isOpen, onClose, onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [stage,      setStage]      = useState<Stage>('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [results,    setResults]    = useState<BulkUpdateZqPricingResultRow[]>([])
  const [summary,    setSummary]    = useState<{ updated: number; skipped: number; errors: number } | null>(null)

  const [bulkUpdate, { isLoading: isImporting }] = useBulkUpdateZqPricingMutation()

  const validRows   = parsedRows.filter((r) => !r.validationError)
  const invalidRows = parsedRows.filter((r) =>  r.validationError)

  const reset = () => {
    setStage('idle')
    setParseError(null)
    setParsedRows([])
    setResults([])
    setSummary(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleClose = () => { reset(); onClose() }

  const processFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please select a .csv file.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = (e.target?.result ?? '') as string
        const rows = parseCsv(text)
        if (rows.length === 0) { setParseError('No data rows found in this CSV.'); return }
        setParseError(null)
        setParsedRows(rows)
        setStage('preview')
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Failed to parse the CSV file.')
      }
    }
    reader.readAsText(file, 'utf-8')
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleImport = async () => {
    if (validRows.length === 0) return
    try {
      const res = await bulkUpdate({ rows: validRows.map(toPayloadRow) }).unwrap()
      setSummary(res.summary)
      setResults(res.results)
      setStage('result')
      if (res.summary.updated > 0) {
        showSuccessToast(`${res.summary.updated} product${res.summary.updated !== 1 ? 's' : ''} updated.`)
        onSuccess?.()
      }
    } catch (err) {
      const error = err as { data?: { message?: string } }
      showErrorToast(error?.data?.message ?? 'Bulk update failed.')
    }
  }

  const nonUpdatedResults = results.filter((r) => r.status !== 'updated')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-md"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_32px_100px_-36px_rgba(15,23,42,0.55)] dark:border-slate-800 dark:bg-slate-950"
            >
              {/* ── Header ── */}
              <div className="shrink-0 border-b border-slate-200/80 bg-gradient-to-r from-sky-50 via-white to-cyan-50 px-4 py-4 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-sky-950/30 sm:px-6 sm:py-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-lg shadow-sky-500/30">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-300">Global Supplier Workspace</p>
                      <h2 className="mt-1 text-lg font-bold leading-none text-slate-900 dark:text-slate-100">Import ZQ Pricing CSV</h2>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {stage === 'idle'    && 'Upload a CSV exported from the ZQ products table'}
                        {stage === 'preview' && `${parsedRows.length} rows parsed — review before importing`}
                        {stage === 'result'  && 'Import complete'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isImporting}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* ── Body ── */}
              <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">

                {/* ── Stage: idle ── */}
                {stage === 'idle' && (
                  <>
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      className={[
                        'w-full rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all',
                        isDragging
                          ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/20'
                          : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-sky-700',
                      ].join(' ')}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className={[
                          'flex h-14 w-14 items-center justify-center rounded-2xl transition',
                          isDragging ? 'bg-sky-100' : 'bg-slate-100 dark:bg-slate-800',
                        ].join(' ')}>
                          <svg className={['h-6 w-6', isDragging ? 'text-sky-500' : 'text-slate-400'].join(' ')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Drop a CSV file here, or <span className="text-sky-600 underline">click to browse</span>
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Must use the exported columns from "Export ZQ CSV"
                          </p>
                        </div>
                      </div>
                    </button>

                    {parseError && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5C3.312 18.333 4.274 20 5.814 20z"/>
                        </svg>
                        <p className="text-sm text-red-600">{parseError}</p>
                      </div>
                    )}

                    <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Expected columns</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['External ID','Member Price (₱)','Dealer Price (₱)','PV','PV Tier','Reversed PV Multiplier'].map((col) => (
                          <span key={col} className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {col}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] text-slate-400">Only pricing columns will be updated. Other columns in the file are ignored.</p>
                    </div>
                  </>
                )}

                {/* ── Stage: preview ── */}
                {stage === 'preview' && (
                  <>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">{parsedRows.length} rows total</span>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{validRows.length} valid</span>
                      {invalidRows.length > 0 && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">{invalidRows.length} invalid (will be skipped)</span>
                      )}
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-slate-50">
                            <tr className="border-b border-slate-200">
                              {['External ID','Member Price (₱)','Dealer Price (₱)','PV','PV Tier','Rev. PV Mult.'].map((h) => (
                                <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {validRows.slice(0, 8).map((row) => (
                              <tr key={row.rowIndex} className="hover:bg-slate-50/60">
                                <td className="px-3 py-2.5 font-mono text-slate-700">{row.externalId}</td>
                                <td className="px-3 py-2.5 text-slate-600">{row.memberPrice || '—'}</td>
                                <td className="px-3 py-2.5 text-slate-600">{row.dealerPrice || '—'}</td>
                                <td className="px-3 py-2.5 text-slate-600">{row.pv || '—'}</td>
                                <td className="px-3 py-2.5 text-slate-600">{row.pvTier}</td>
                                <td className="px-3 py-2.5 text-slate-600">{row.reversedPvMultiplier || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {validRows.length > 8 && (
                        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-400">
                          + {validRows.length - 8} more rows not shown in preview
                        </div>
                      )}
                    </div>

                    {invalidRows.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-red-600">Invalid Rows (will be skipped)</p>
                        <ul className="space-y-1">
                          {invalidRows.map((r) => (
                            <li key={r.rowIndex} className="text-xs text-red-700">
                              Row {r.rowIndex} — <span className="font-mono">{r.externalId}</span>: {r.validationError}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {/* ── Stage: result ── */}
                {stage === 'result' && summary && (
                  <>
                    <div className="mb-5 flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        ✓ {summary.updated} updated
                      </span>
                      {summary.skipped > 0 && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                          {summary.skipped} skipped
                        </span>
                      )}
                      {summary.errors > 0 && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                          {summary.errors} errors
                        </span>
                      )}
                    </div>

                    {nonUpdatedResults.length > 0 ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <p className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          Skipped / Error rows
                        </p>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead className="bg-white">
                              <tr className="border-b border-slate-100">
                                <th className="px-3 py-2.5 text-left font-semibold text-slate-500">External ID</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Status</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Reason</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {nonUpdatedResults.map((r) => (
                                <tr key={r.row}>
                                  <td className="px-3 py-2.5 font-mono text-slate-700">{r.externalId ?? '—'}</td>
                                  <td className="px-3 py-2.5">
                                    <span className={[
                                      'rounded-full px-2 py-0.5 text-[11px] font-semibold border',
                                      r.status === 'skipped'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-red-50 text-red-700 border-red-200',
                                    ].join(' ')}>
                                      {r.status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-500">{r.reason ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                          <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-slate-700">All {summary.updated} products updated successfully!</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="shrink-0 flex items-center justify-between border-t border-slate-200/80 bg-slate-50/60 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50 sm:px-6">
                <div>
                  {stage === 'preview' && (
                    <button type="button" onClick={reset} className="text-xs text-slate-500 underline hover:text-slate-700">
                      Choose a different file
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {stage === 'result' && (
                    <button
                      type="button"
                      onClick={reset}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      Import Another
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isImporting}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {stage === 'result' ? 'Done' : 'Cancel'}
                  </button>
                  {stage === 'preview' && (
                    <button
                      type="button"
                      onClick={() => void handleImport()}
                      disabled={isImporting || validRows.length === 0}
                      className="flex items-center gap-2 rounded-2xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-500/30 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
                    >
                      {isImporting ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Importing…
                        </>
                      ) : (
                        `Import ${validRows.length} row${validRows.length !== 1 ? 's' : ''}`
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
