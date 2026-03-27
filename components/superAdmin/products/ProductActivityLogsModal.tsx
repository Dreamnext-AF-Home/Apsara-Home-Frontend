'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProductActivityLog, useGetProductActivityLogsQuery } from '@/store/api/productsApi'

interface ProductActivityLogsModalProps {
  isOpen: boolean
  onClose: () => void
  canViewAll: boolean
}

const formatActivityDate = (value?: string | null) => {
  if (!value) return 'Unknown time'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Unknown time'

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed)
}

const actionLabel = (action: string) => {
  switch (action) {
    case 'created':
      return 'Added'
    case 'updated':
      return 'Updated'
    case 'deleted':
      return 'Deleted'
    default:
      return action
  }
}

const actionBadgeClass = (action: string) => {
  switch (action) {
    case 'created':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'updated':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'deleted':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

function ActivityRow({ log }: { log: ProductActivityLog }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${actionBadgeClass(log.action)}`}>
              {actionLabel(log.action)}
            </span>
            <p className="text-sm font-semibold text-slate-800 truncate">{log.productName}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>SKU: {log.productSku?.trim() ? log.productSku : 'N/A'}</span>
            <span>By: {log.actorName?.trim() ? log.actorName : 'Unknown user'}</span>
            <span>{formatActivityDate(log.createdAt)}</span>
          </div>
          {(log.actorEmail || log.actorRole) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              {log.actorEmail ? <span>{log.actorEmail}</span> : null}
              {log.actorRole ? <span className="uppercase tracking-[0.12em]">{log.actorRole.replace(/_/g, ' ')}</span> : null}
            </div>
          )}
        </div>
        <div className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {log.status}
        </div>
      </div>
    </div>
  )
}

export default function ProductActivityLogsModal({ isOpen, onClose, canViewAll }: ProductActivityLogsModalProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [scope, setScope] = useState<'my' | 'all'>('my')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!canViewAll && scope !== 'my') {
      setScope('my')
    }
  }, [canViewAll, scope])

  const { data, isFetching, isLoading } = useGetProductActivityLogsQuery(
    {
      page: 1,
      perPage: 20,
      search: debouncedSearch || undefined,
      scope,
    },
    { skip: !isOpen },
  )

  const logs = useMemo(() => data?.logs ?? [], [data?.logs])

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-4 top-8 z-[71] mx-auto flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-2xl"
          >
            <div className="border-b border-slate-200 bg-white px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Recent Product Activity</h2>
                  <p className="mt-1 text-sm text-slate-500">Check if a product was really added, updated, or deleted and who did it.</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                  aria-label="Close activity history"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setScope('my')}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${scope === 'my' ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/25' : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:text-teal-700'}`}
                  >
                    My Activity
                  </button>
                  {canViewAll ? (
                    <button
                      onClick={() => setScope('all')}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${scope === 'all' ? 'bg-slate-800 text-white shadow-sm shadow-slate-800/15' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800'}`}
                    >
                      All Activity
                    </button>
                  ) : null}
                </div>

                <div className="relative w-full sm:max-w-sm">
                  <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
                  </svg>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search product name or SKU..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {isLoading || isFetching ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 text-center">
                  <div>
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m3 6V7m3 10v-4M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No product activity found</p>
                    <p className="mt-1 text-sm text-slate-500">Newly added or updated products will appear here once saved.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => <ActivityRow key={log.id} log={log} />)}
                </div>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
