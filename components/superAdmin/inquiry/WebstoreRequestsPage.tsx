'use client'

import { useMemo, useState } from 'react'
import {
  useApproveWebstoreRequestMutation,
  useDeleteWebstoreRequestMutation,
  useGetWebstoreRequestsQuery,
  useRejectWebstoreRequestMutation,
} from '@/store/api/adminInquiriesApi'
import { useDeleteAdminWebPageItemMutation, useGetAdminWebPageItemsQuery } from '@/store/api/webPagesApi'
import { getPartnerStorefrontConfig } from '@/libs/partnerStorefront'
import { showErrorToast } from '@/libs/toast'

type RequestStatus = 'all' | 'pending_review' | 'approved' | 'rejected' | 'deleted'
type StatusKey = Exclude<RequestStatus, 'all'>

type StatusStyleMap = Record<StatusKey, string>

const statusStyles: StatusStyleMap = {
  pending_review:
    'border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  approved:
    'border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  rejected:
    'border border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
  deleted:
    'border border-slate-300/80 bg-slate-100 text-slate-700 dark:border-slate-600/60 dark:bg-slate-700/30 dark:text-slate-200',
}

const prettyStatus = (status: StatusKey) => {
  if (status === 'pending_review') return 'Pending'
  if (status === 'approved') return 'Approved'
  if (status === 'deleted') return 'Deleted'
  return 'Rejected'
}

export default function WebstoreRequestsPage() {
  const { data, isLoading, isError } = useGetWebstoreRequestsQuery()
  const [approveRequest, { isLoading: isApproving }] = useApproveWebstoreRequestMutation()
  const [rejectRequest, { isLoading: isRejecting }] = useRejectWebstoreRequestMutation()
  const [deleteRequest, { isLoading: isDeleting }] = useDeleteWebstoreRequestMutation()
  const [deleteStorefront, { isLoading: isDeletingStorefront }] = useDeleteAdminWebPageItemMutation()
  const { data: storefrontsData } = useGetAdminWebPageItemsQuery({
    type: 'partner-storefront',
    page: 1,
    perPage: 500,
    status: 'all',
  })

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequestStatus>('all')

  const [confirm, setConfirm] = useState<{
    open: boolean
    action: 'approve' | 'reject' | 'delete'
    id: number | null
    displayName?: string | null
    slugName?: string | null
  }>({ open: false, action: 'approve', id: null, displayName: null, slugName: null })
  const [deleteAcknowledge, setDeleteAcknowledge] = useState(false)
  const [details, setDetails] = useState<{
    open: boolean
    id: number | null
    displayName?: string | null
    slugName?: string | null
    customerName?: string | null
    email?: string | null
    username?: string | null
    status?: string | null
    submittedAt?: string | null
  }>({ open: false, id: null, displayName: null, slugName: null, customerName: null, email: null, username: null, status: null, submittedAt: null })

  const rows = useMemo(() => {
    const source = data?.requests ?? []
    const q = search.trim().toLowerCase()

    return source.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (!q) return true

      const haystack = [
        item.customer_name,
        item.customer_email,
        item.username,
        item.email,
        item.slug_name,
        item.display_name,
        String(item.ticket_id),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [data?.requests, search, statusFilter])

  const counts = useMemo(() => {
    const all = data?.requests ?? []
    const pending = all.filter((r) => r.status === 'pending_review').length
    const approved = all.filter((r) => r.status === 'approved').length
    const rejected = all.filter((r) => r.status === 'rejected').length
    const deleted = all.filter((r) => r.status === 'deleted').length
    return { all: all.length, pending, approved, rejected, deleted }
  }, [data?.requests])

  const openConfirm = (
    action: 'approve' | 'reject' | 'delete',
    id: number,
    displayName?: string | null,
    slugName?: string | null,
  ) => {
    setDeleteAcknowledge(false)
    setConfirm({ open: true, action, id, displayName: displayName ?? null, slugName: slugName ?? null })
  }

  const closeConfirm = () => {
    setDeleteAcknowledge(false)
    setConfirm({ open: false, action: 'approve', id: null, displayName: null, slugName: null })
  }

  const openDetails = (item: {
    id: number
    display_name?: string | null
    slug_name?: string | null
    customer_name?: string | null
    customer_email?: string | null
    username?: string | null
    status?: string | null
    submitted_at?: string | null
  }) => {
    setDetails({
      open: true,
      id: item.id,
      displayName: item.display_name ?? null,
      slugName: item.slug_name ?? null,
      customerName: item.customer_name ?? null,
      email: item.customer_email ?? null,
      username: item.username ?? null,
      status: item.status ?? null,
      submittedAt: item.submitted_at ?? null,
    })
  }

  const closeDetails = () => {
    setDetails({ open: false, id: null, displayName: null, slugName: null, customerName: null, email: null, username: null, status: null, submittedAt: null })
  }

  const handleConfirm = async () => {
    if (!confirm.id) return

    try {
      if (confirm.action === 'approve') {
        await approveRequest({ id: confirm.id }).unwrap()
      } else if (confirm.action === 'reject') {
        await rejectRequest({ id: confirm.id }).unwrap()
      } else if (confirm.action === 'delete') {
        const rowSlug = String(confirm.slugName ?? '').trim().toLowerCase()
        if (rowSlug) {
          const storefront = (storefrontsData?.items ?? []).find((entry) => {
            const config = getPartnerStorefrontConfig(entry)
            return config?.slug === rowSlug
          })
          if (storefront) {
            await deleteStorefront({ type: 'partner-storefront', id: storefront.id }).unwrap()
          }
        }
        await deleteRequest({ id: confirm.id }).unwrap()
      }
      closeConfirm()
    } catch (error) {
      const apiErr = error as { data?: { message?: string }; message?: string }
      showErrorToast(apiErr?.data?.message || apiErr?.message || 'Failed to process request.')
      closeConfirm()
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-[260px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <span className="inline-flex h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_0_3px_rgba(6,182,212,0.12)]" />
              System · Inquiries
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Webstore Requests
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Review partner webstore submissions and approve to auto-create storefronts.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <label className="sr-only" htmlFor="webstore-search">Search</label>
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                />
              </svg>
              <input
                id="webstore-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, username, ticket..."
                className="w-64 max-w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus)}
              className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 shadow-sm focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-100/60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
            >
              <option value="all">All Status ({counts.all})</option>
              <option value="pending_review">Pending ({counts.pending})</option>
              <option value="approved">Approved ({counts.approved})</option>
              <option value="rejected">Rejected ({counts.rejected})</option>
              <option value="deleted">Deleted ({counts.deleted})</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(
            [
              { key: 'all' as const, label: 'All', count: counts.all },
              { key: 'pending_review' as const, label: 'Pending', count: counts.pending },
              { key: 'approved' as const, label: 'Approved', count: counts.approved },
              { key: 'rejected' as const, label: 'Rejected', count: counts.rejected },
              { key: 'deleted' as const, label: 'Deleted', count: counts.deleted },
            ] as const
          ).map((chip) => {
            const active = statusFilter === chip.key
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setStatusFilter(chip.key)}
                className={
                  active
                    ? 'rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800 shadow-sm dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200'
                    : 'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60'
                }
              >
                {chip.label} <span className="ml-1 text-[11px] opacity-70">{chip.count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Showing</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {rows.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {rows.length === 1 ? 'request' : 'requests'}
            </span>
          </div>

          {isLoading ? (
            <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full bg-cyan-500" /> Loading...
            </div>
          ) : null}
        </div>

        {isError ? (
          <div className="p-5 text-sm text-rose-600 dark:text-rose-300">Failed to load webstore requests.</div>
        ) : null}

        {!isLoading && !rows.length && !isError ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">No webstore requests yet.</div>
        ) : null}

        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Ticket</th>
                  <th className="px-5 py-3 text-left font-semibold">Customer</th>
                  <th className="px-5 py-3 text-left font-semibold">Username</th>
                  <th className="px-5 py-3 text-left font-semibold">Slug</th>
                  <th className="px-5 py-3 text-left font-semibold">Display</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Submitted</th>
                  <th className="px-5 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((item) => {
                  const submitted = item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '-'
                  const status = item.status as StatusKey
                  const statusClass = statusStyles[status] ?? statusStyles.pending_review

                  return (
                    <tr
                      key={item.id}
                      className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          #{item.ticket_id}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="min-w-[180px]">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {item.customer_name || item.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.customer_email || item.email || 'No email'}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{item.username ? `@${item.username}` : '-'}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">{item.slug_name || '-'}</td>
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-200">{item.display_name || '-'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold ${statusClass}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                          {prettyStatus(status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{submitted}</td>
                      <td className="px-5 py-4">
                        {(() => {
                          const rowSlug = String(item.slug_name ?? '').trim().toLowerCase()
                          const storefront = rowSlug
                            ? (storefrontsData?.items ?? []).find((entry) => {
                                const config = getPartnerStorefrontConfig(entry)
                                return config?.slug === rowSlug
                              })
                            : undefined
                          const busy = isApproving || isRejecting || isDeleting || isDeletingStorefront

                          const RequestDeleteIcon = (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => openConfirm('delete', item.id, item.display_name, item.slug_name)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-slate-700 transition hover:bg-slate-200 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                              title="Delete request"
                              aria-label="Delete request"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                              </svg>
                              </button>
                          )

                          if (item.status === 'pending_review') {
                            return (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openDetails(item)}
                                  className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/15"
                                >
                                  Subscription Details
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => openConfirm('approve', item.id, item.display_name, item.slug_name)}
                                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/15"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => openConfirm('reject', item.id, item.display_name, item.slug_name)}
                                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15"
                                >
                                  Reject
                                </button>
                                {RequestDeleteIcon}
                              </div>
                            )
                          }

                          return (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openDetails(item)}
                                className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/15"
                              >
                                Subscription Details
                              </button>
                              {RequestDeleteIcon}
                            </div>
                          )
                        })()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {confirm.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="relative border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div
                className={
                  confirm.action === 'approve'
                    ? 'absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500'
                    : confirm.action === 'reject' || confirm.action === 'delete'
                      ? 'absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500'
                      : 'absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500'
                }
              />
              <div className="pt-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {confirm.action === 'approve'
                    ? 'Confirm Approval'
                    : confirm.action === 'reject'
                      ? 'Confirm Rejection'
                      : 'Confirm Delete'}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {confirm.action === 'approve'
                    ? 'Approving will also auto-create or update partner storefront using slug and display name.'
                    : confirm.action === 'reject'
                      ? 'This will mark the request as rejected.'
                      : 'This will permanently remove the request and linked partner storefront (if it exists).'}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Display name</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{confirm.displayName || '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Slug</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{confirm.slugName || '-'}</p>
              </div>
              {confirm.action === 'delete' ? (
                <label className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                  <input
                    type="checkbox"
                    checked={deleteAcknowledge}
                    onChange={(event) => setDeleteAcknowledge(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500/40 dark:border-rose-500/40"
                  />
                  <span>I understand this delete action is permanent and cannot be undone.</span>
                </label>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
              <button
                type="button"
                onClick={closeConfirm}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  isApproving ||
                  isRejecting ||
                  isDeleting ||
                  isDeletingStorefront ||
                  (confirm.action === 'delete' && !deleteAcknowledge)
                }
                onClick={handleConfirm}
                className={
                  'rounded-2xl px-4 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ' +
                  (confirm.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : confirm.action === 'reject'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-slate-700 hover:bg-slate-800')
                }
              >
                {confirm.action === 'approve'
                  ? isApproving
                    ? 'Approving...'
                    : 'Confirm Approval'
                  : confirm.action === 'reject'
                    ? isRejecting
                      ? 'Rejecting...'
                      : 'Confirm Rejection'
                    : isDeleting || isDeletingStorefront
                      ? 'Deleting...'
                      : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {details.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">Webstore Request</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">Subscription Details</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Preview only for now.</p>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Close subscription details"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-3 px-5 py-5 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Customer</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{details.customerName || '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{details.email || '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Username</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{details.username ? `@${details.username}` : '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{details.status || '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Slug</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{details.slugName || '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Display Name</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{details.displayName || '-'}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
              <button
                type="button"
                onClick={closeDetails}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

