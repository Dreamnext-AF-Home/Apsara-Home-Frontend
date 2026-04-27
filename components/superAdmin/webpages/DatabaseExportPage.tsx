'use client'

import { useEffect, useMemo, useState } from 'react'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import { useDeleteDatabaseExportMutation, useDownloadDatabaseExportMutation, useExportDatabaseMutation, useListDatabaseExportsQuery } from '@/store/api/adminDatabaseApi'

type ApiErrorLike = {
  data?: {
    message?: string
  }
}

const formatBytes = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`
}

const formatDate = (value?: string) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DatabaseExportPage() {
  const PER_PAGE = 10
  const [currentPage, setCurrentPage] = useState(1)
  const { data, isFetching, refetch } = useListDatabaseExportsQuery({ page: currentPage, per_page: PER_PAGE })
  const [exportDatabase, { isLoading }] = useExportDatabaseMutation()
  const [downloadDatabaseExport] = useDownloadDatabaseExportMutation()
  const [deleteDatabaseExport, { isLoading: isDeleting }] = useDeleteDatabaseExportMutation()
  const [latestExportPreview, setLatestExportPreview] = useState<string>('')
  const [latestSummary, setLatestSummary] = useState<{ name: string; tables: number; rows: number; size: number; generatedAt: string; previewTable: string } | null>(null)

  const exportItems = useMemo(() => data?.exports ?? [], [data?.exports])
  const exportMeta = data?.meta

  useEffect(() => {
    const lastPage = exportMeta?.last_page ?? 1
    if (currentPage > lastPage) {
      setCurrentPage(lastPage)
    }
  }, [currentPage, exportMeta?.last_page])

  const handleDownload = async (path: string, fileName?: string) => {
    try {
      const downloadName = fileName || `db_backup(${new Date().toISOString().slice(0, 10)}).zip`
      const blob = await downloadDatabaseExport({
        path,
        download_name: downloadName,
      }).unwrap()

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = downloadName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      showErrorToast('Failed to download export file.')
    }
  }

  const handleExport = async () => {
    try {
      const response = await exportDatabase().unwrap()
      const preview = response.export?.preview_csv ?? ''

      setLatestExportPreview(preview)
      setLatestSummary({
        name: response.export?.name ?? 'database-export.zip',
        tables: response.export?.table_count ?? 0,
        rows: response.export?.total_rows ?? 0,
        size: response.export?.size_bytes ?? 0,
        generatedAt: response.export?.generated_at ?? new Date().toISOString(),
        previewTable: response.export?.preview_table ?? 'N/A',
      })

      if (response.export?.path) {
        await handleDownload(response.export.path, response.export.download_name)
      }

      showSuccessToast(response.message || 'Database exported successfully.')
      setCurrentPage(1)
      await refetch()
    } catch (error: unknown) {
      const apiError = error as ApiErrorLike
      showErrorToast(apiError?.data?.message || 'Failed to export database.')
    }
  }

  const handleDelete = async (path: string, fileName: string) => {
    const confirmed = window.confirm(`Delete export file "${fileName}"? This cannot be undone.`)
    if (!confirmed) return

    try {
      const response = await deleteDatabaseExport({ path }).unwrap()
      showSuccessToast(response.message || 'Export file deleted successfully.')
      await refetch()
    } catch (error: unknown) {
      const apiError = error as ApiErrorLike
      showErrorToast(apiError?.data?.message || 'Failed to delete export file.')
    }
  }

  return (
    <div className="space-y-6 dark:bg-slate-950 dark:text-slate-100">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-400">Web Content</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Database Export</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Create a CSV export archive of your current database and review a CSV preview here right after export.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={isLoading}
            className="inline-flex items-center rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
          >
            {isLoading ? 'Exporting...' : 'Export Database'}
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {isFetching ? 'Refreshing...' : 'Refresh List'}
          </button>
        </div>
      </div>

      {latestSummary && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Latest Export</p>
          <p className="mt-2 text-sm text-emerald-900">
            <span className="font-semibold">{latestSummary.name}</span> • {latestSummary.tables} tables • {latestSummary.rows} rows • {formatBytes(latestSummary.size)} • {formatDate(latestSummary.generatedAt)}
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            Archive format: ZIP with one CSV per table (`_summary.csv` included). Preview table: {latestSummary.previewTable}
          </p>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Export History</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Showing 10 exports per page.</p>
        {exportItems.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No exports yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-[1.6fr_0.7fr_0.9fr_0.6fr] bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <span>File</span>
              <span>Size</span>
              <span>Created</span>
              <span>Action</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {exportItems.map((item) => (
                <div key={item.path} className="grid grid-cols-[1.6fr_0.7fr_0.9fr_0.6fr] items-center px-4 py-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <span className="truncate font-medium">{item.name}</span>
                  <span>{formatBytes(item.size_bytes)}</span>
                  <span>{formatDate(item.last_modified_at)}</span>
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(item.path, item.download_name)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.path, item.name)}
                      disabled={isDeleting}
                      className="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/40 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-950/30"
                    >
                      Delete
                    </button>
                  </span>
                </div>
              ))}
            </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>
                {`Showing ${exportMeta?.from ?? 0}-${exportMeta?.to ?? 0} of ${exportMeta?.total ?? 0}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={isFetching || (exportMeta?.current_page ?? 1) <= 1}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Page {exportMeta?.current_page ?? 1} of {exportMeta?.last_page ?? 1}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => page + 1)}
                  disabled={isFetching || (exportMeta?.current_page ?? 1) >= (exportMeta?.last_page ?? 1)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {latestExportPreview && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Export CSV Preview</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">This CSV preview is from your most recent export action.</p>
          <pre className="mt-4 max-h-[520px] overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100">
            {latestExportPreview}
          </pre>
        </div>
      )}
    </div>
  )
}
