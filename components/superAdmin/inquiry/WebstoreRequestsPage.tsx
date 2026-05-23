'use client'

import { useMemo, useState } from 'react'
import {
  useApproveWebstoreRequestMutation,
  useApproveWebstoreReceiptMutation,
  useDeleteWebstoreRequestMutation,
  useGetWebstoreRequestsQuery,
  useRejectWebstoreReceiptMutation,
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
  const [receiptConfirm, setReceiptConfirm] = useState<{
    open: boolean
    receiptId: number | null
    action: 'approve' | 'reject'
    label?: string | null
  }>({ open: false, receiptId: null, action: 'approve', label: null })
  const [approveReceipt, { isLoading: isApprovingReceipt }] = useApproveWebstoreReceiptMutation()
  const [rejectReceipt, { isLoading: isRejectingReceipt }] = useRejectWebstoreReceiptMutation()
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
    approvedAt?: string | null
    plan?: string | null
    planTerm?: string | null
    subscriptionFee?: number | null
    effectiveMonthly?: number | null
    billingOption?: string | null
    paymentMethod?: string | null
    checkoutId?: string | null
    paymentReference?: string | null
    paymentIntentId?: string | null
    baseCheckoutId?: string | null
    basePaymentReference?: string | null
    basePaymentIntentId?: string | null
    remainingBalance?: number | null
    receiptUrls?: string[] | null
    receiptItems?: Array<{
      id?: number | null
      label?: string | null
      submittedAt?: string | null
      receiptUrls?: string[] | null
      checkoutId?: string | null
      paymentReference?: string | null
      paymentIntentId?: string | null
      baseCheckoutId?: string | null
      basePaymentReference?: string | null
      basePaymentIntentId?: string | null
      approvalStatus?: string | null
      approvedAt?: string | null
      type?: string | null
    }> | null
  }>({ open: false, id: null, displayName: null, slugName: null, customerName: null, email: null, username: null, status: null, submittedAt: null })
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null)

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

  const openReceiptConfirm = (action: 'approve' | 'reject', receiptId: number, label?: string | null) => {
    setReceiptConfirm({ open: true, action, receiptId, label: label ?? null })
  }

  const closeReceiptConfirm = () => {
    setReceiptConfirm({ open: false, receiptId: null, action: 'approve', label: null })
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
    approved_at?: string | null
    plan?: string | null
    plan_term?: string | null
    subscription_fee?: number | null
    effective_monthly?: number | null
    billing_option?: string | null
    payment_method?: string | null
    checkout_id?: string | null
    payment_reference?: string | null
    payment_intent_id?: string | null
    base_checkout_id?: string | null
    base_payment_reference?: string | null
    base_payment_intent_id?: string | null
    remaining_balance?: number | null
    receipt_urls?: string[] | null
    receipt_items?: Array<{
      id?: number | null
      label?: string | null
      submitted_at?: string | null
      receipt_urls?: string[] | null
      checkout_id?: string | null
      payment_reference?: string | null
      payment_intent_id?: string | null
      base_checkout_id?: string | null
      base_payment_reference?: string | null
      base_payment_intent_id?: string | null
      approval_status?: string | null
      approved_at?: string | null
      type?: string | null
    }> | null
  }) => {
    const mappedReceiptItems = (item.receipt_items ?? []).map((receipt, index) => ({
      id: receipt.id ?? null,
      label: receipt.label ?? `Receipt ${index + 1}`,
      submittedAt: receipt.submitted_at ?? null,
      receiptUrls: receipt.receipt_urls ?? [],
      checkoutId: receipt.checkout_id ?? null,
      paymentReference: receipt.payment_reference ?? null,
      paymentIntentId: receipt.payment_intent_id ?? null,
      baseCheckoutId: receipt.base_checkout_id ?? null,
      basePaymentReference: receipt.base_payment_reference ?? null,
      basePaymentIntentId: receipt.base_payment_intent_id ?? null,
      approvalStatus: receipt.approval_status ?? null,
      approvedAt: receipt.approved_at ?? null,
      type: receipt.type ?? null,
    }))
    const approvedReceipt = [...mappedReceiptItems].reverse().find((receipt) => {
      const status = String(receipt.approvalStatus ?? '').toLowerCase()
      return status === 'approved' || (!status && receipt.type !== 'webstore_payment_continuation')
    }) ?? null

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
      approvedAt: item.approved_at ?? null,
      plan: item.plan ?? null,
      planTerm: item.plan_term ?? null,
      subscriptionFee: item.subscription_fee ?? null,
      effectiveMonthly: item.effective_monthly ?? null,
      billingOption: item.billing_option ?? null,
      paymentMethod: item.payment_method ?? null,
      checkoutId: approvedReceipt?.baseCheckoutId ?? item.base_checkout_id ?? item.checkout_id ?? null,
      paymentReference: approvedReceipt?.basePaymentReference ?? item.base_payment_reference ?? item.payment_reference ?? null,
      paymentIntentId: approvedReceipt?.basePaymentIntentId ?? item.base_payment_intent_id ?? item.payment_intent_id ?? null,
      remainingBalance: item.remaining_balance ?? null,
      receiptUrls: item.receipt_urls ?? [],
      receiptItems: mappedReceiptItems,
    })
  }

  const closeDetails = () => {
    setDetails({
      open: false,
      id: null,
      displayName: null,
      slugName: null,
      customerName: null,
      email: null,
      username: null,
      status: null,
      submittedAt: null,
      approvedAt: null,
      plan: null,
      planTerm: null,
      subscriptionFee: null,
      effectiveMonthly: null,
      billingOption: null,
      paymentMethod: null,
      checkoutId: null,
      paymentReference: null,
      paymentIntentId: null,
      remainingBalance: null,
      receiptUrls: [],
      receiptItems: [],
    })
    closeReceiptConfirm()
    setReceiptPreviewUrl(null)
  }

  const handleApproveReceipt = async (receiptId: number) => {
    if (!details.id || !receiptId) return

    try {
      await approveReceipt({ id: details.id, detailId: receiptId }).unwrap()
      setDetails((prev) => {
        if (!prev.open || !Array.isArray(prev.receiptItems)) return prev
        const updatedReceiptItems = prev.receiptItems.map((receipt) =>
          receipt.id === receiptId
            ? {
                ...receipt,
                approvalStatus: 'approved',
                approvedAt: new Date().toISOString(),
              }
            : receipt,
        )
        const latestReceipt = updatedReceiptItems[updatedReceiptItems.length - 1] ?? null
        return {
          ...prev,
          receiptItems: updatedReceiptItems,
          checkoutId: latestReceipt?.checkoutId ?? prev.checkoutId,
          paymentReference: latestReceipt?.paymentReference ?? prev.paymentReference,
          paymentIntentId: latestReceipt?.paymentIntentId ?? prev.paymentIntentId,
        }
      })
    } catch (error) {
      const apiErr = error as { data?: { message?: string }; message?: string }
      showErrorToast(apiErr?.data?.message || apiErr?.message || 'Failed to approve receipt.')
    }
  }

  const handleRejectReceipt = async (receiptId: number) => {
    if (!details.id || !receiptId) return

    try {
      await rejectReceipt({ id: details.id, detailId: receiptId }).unwrap()
      setDetails((prev) => {
        if (!prev.open || !Array.isArray(prev.receiptItems)) return prev
        const updatedReceiptItems = prev.receiptItems.map((receipt) =>
          receipt.id === receiptId
            ? {
                ...receipt,
                approvalStatus: 'rejected',
                approvedAt: null,
              }
            : receipt,
        )
        const latestReceipt = updatedReceiptItems[updatedReceiptItems.length - 1] ?? null
        return {
          ...prev,
          receiptItems: updatedReceiptItems,
          checkoutId: latestReceipt?.checkoutId ?? prev.checkoutId,
          paymentReference: latestReceipt?.paymentReference ?? prev.paymentReference,
          paymentIntentId: latestReceipt?.paymentIntentId ?? prev.paymentIntentId,
        }
      })
    } catch (error) {
      const apiErr = error as { data?: { message?: string }; message?: string }
      showErrorToast(apiErr?.data?.message || apiErr?.message || 'Failed to reject receipt.')
    }
  }

  const confirmReceiptAction = async () => {
    if (!receiptConfirm.receiptId) return
    const receiptId = receiptConfirm.receiptId
    const action = receiptConfirm.action
    closeReceiptConfirm()
    if (action === 'approve') {
      await handleApproveReceipt(receiptId)
    } else {
      await handleRejectReceipt(receiptId)
    }
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

  const latestReceiptCheckoutId = String(details.checkoutId ?? '').trim()
  const latestReceiptReferenceId = String(
    details.paymentReference ?? details.paymentIntentId ?? '',
  ).trim()

  const parseDateSafe = (value?: string | null): Date | null => {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const formatDate = (value?: string | null): string => {
    const date = parseDateSafe(value)
    if (!date) return '-'
    return date.toLocaleDateString(undefined, { month: 'long', day: '2-digit', year: 'numeric' })
  }

  const formatDateTime = (value?: string | null): string => {
    const date = parseDateSafe(value)
    if (!date) return '-'
    return date.toLocaleString(undefined, {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const planTermMonths = (plan?: string | null, term?: string | null): number => {
    const raw = String(term ?? '').toLowerCase()
    const matched = raw.match(/(\d+)/)
    if (matched) return Number(matched[1])
    const normalizedPlan = String(plan ?? '').toLowerCase()
    if (normalizedPlan === 'quarterly') return 3
    if (normalizedPlan === 'semi_annual' || normalizedPlan === 'semi-annual') return 6
    if (normalizedPlan === 'annual') return 12
    return 0
  }

  const formatPlanLabel = (value?: string | null): string => {
    const v = String(value ?? '').trim()
    if (!v) return '-'
    const normalized = v.toLowerCase()
    if (normalized === 'semi_annual' || normalized === 'semi-annual') return 'Semi-annual'
    return v
  }

  const formatSingleCapitalized = (value?: string | null): string => {
    const v = String(value ?? '').trim()
    if (!v) return '-'
    return v.charAt(0).toUpperCase() + v.slice(1)
  }

  const formatBillingLabel = (value?: string | null): string => {
    const v = String(value ?? '').trim()
    if (!v) return '-'
    const normalized = v.toLowerCase()
    if (normalized === 'monthly') return 'Monthly Installment'
    if (normalized === 'full') return 'Full Payment'
    return v.charAt(0).toUpperCase() + v.slice(1)
  }

  const formatPaymentMethodLabel = (value?: string | null): string => {
    const v = String(value ?? '').trim()
    if (!v) return '-'
    const normalized = v.toLowerCase()
    if (normalized === 'gcash') return 'Gcash'
    return v.charAt(0).toUpperCase() + v.slice(1)
  }

  const computeEndDate = (
    startRaw?: string | null,
    billing?: string | null,
    plan?: string | null,
    term?: string | null,
    overallStatus?: string | null,
    receiptItems?: Array<{
      type?: string | null
      approvalStatus?: string | null
      approvedAt?: string | null
    }> | null,
  ): string => {
    const startDate = parseDateSafe(startRaw)
    if (!startDate) return '-'

    const endDate = new Date(startDate)
    const normalizedBilling = String(billing ?? '').toLowerCase()
    const format = (d: Date) => d.toLocaleDateString(undefined, { month: 'long', day: '2-digit', year: 'numeric' })

    if (normalizedBilling === 'monthly') {
      const requestApproved = String(overallStatus ?? '').toLowerCase() === 'approved'
      const continuationMonths = Array.isArray(receiptItems)
        ? receiptItems.filter((receipt) =>
            receipt?.type === 'webstore_payment_continuation'
            && (receipt?.approvalStatus === 'approved' || Boolean(receipt?.approvedAt)),
          ).length
        : 0
      const monthsPaid = (requestApproved ? 1 : 0) + continuationMonths
      endDate.setMonth(endDate.getMonth() + monthsPaid)
      return format(endDate)
    }

    const months = planTermMonths(plan, term)
    if (months <= 0) return '-'
    endDate.setMonth(endDate.getMonth() + months)
    return format(endDate)
  }

  const getReceiptStatus = (receipt?: {
    approvalStatus?: string | null
    approvedAt?: string | null
  } | null) => {
    const status = String(receipt?.approvalStatus ?? '').toLowerCase()
    if (status === 'rejected') return 'rejected'
    if (status === 'approved' || Boolean(receipt?.approvedAt)) return 'approved'
    return 'pending'
  }

  const getLatestPendingReceipt = <T extends {
    id?: number | null
    label?: string | null
    type?: string | null
    approvalStatus?: string | null
    approvedAt?: string | null
  }>(receipts?: T[] | null): T | null => {
    if (!Array.isArray(receipts) || receipts.length === 0) return null
    return [...receipts].reverse().find((receipt) => {
      if (receipt?.type !== 'webstore_payment_continuation') return false
      const status = getReceiptStatus(receipt)
      return status === 'pending'
    }) ?? null
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
                          const latestPendingReceipt = getLatestPendingReceipt(item.receipt_items)
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
                                  onClick={() => {
                                    if (latestPendingReceipt?.id != null) {
                                      openReceiptConfirm(
                                        'reject',
                                        latestPendingReceipt.id,
                                        latestPendingReceipt.label ?? 'Latest receipt',
                                      )
                                      return
                                    }
                                    openConfirm('reject', item.id, item.display_name, item.slug_name)
                                  }}
                                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15"
                                >
                                  {latestPendingReceipt?.id != null ? 'Reject Receipt' : 'Reject'}
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
          <div className="flex max-h-[92vh] w-full max-w-[980px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">
                  Webstore Request
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                  Subscription Details
                </h3>
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

            <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 px-5 py-4 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_0_4px_rgba(6,182,212,0.14)]" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Subscription Summary</p>
                  </div>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:text-slate-200 dark:ring-slate-800">
                    Webstore Receipt
                  </span>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                      <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                        {/* Customer */}
                        <div className="flex min-h-[112px] min-w-0 flex-col items-center justify-start border-r border-slate-200 px-3 py-3 text-center dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-500 ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.9 6.02 9 9 0 015.12 17.804z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </span>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d82ab]">Customer</p>
                          </div>
                          <p className="mt-1 max-w-full break-words text-sm font-semibold leading-tight text-[#163060]">
                            {details.customerName || '-'}
                          </p>
                        </div>

                        {/* Plan & Terms */}
                        <div className="flex min-h-[112px] min-w-0 flex-col items-center justify-start border-r border-slate-200 px-3 py-3 text-center dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h6M9 9h6M9 13h6M7 3h10a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 012-2z" />
                              </svg>
                            </span>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d82ab]">Plan &amp; Terms</p>
                          </div>
                          <div className="mt-1 inline-flex flex-col items-center">
                            <span className="max-w-full break-words text-center text-sm font-semibold leading-tight text-[#163060]">
                              {formatPlanLabel(details.plan)}
                            </span>
                            <span className="mt-1 inline-flex w-fit whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30">
                              {formatPlanLabel(details.planTerm)}
                            </span>
                          </div>
                        </div>

                        {/* Subscription fee */}
                        <div className="flex min-h-[112px] min-w-0 flex-col items-center justify-start border-r border-slate-200 px-3 py-3 text-center dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 text-orange-500 ring-1 ring-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/20">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 .9-4 2s1.79 2 4 2 4 .9 4 2-1.79 2-4 2m0-8c1.11 0 2.09.28 2.75.72M12 8V6m0 12v-2" />
                              </svg>
                            </span>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d82ab]">Sub fee &amp; Monthly cost</p>
                          </div>
                          <div className="mt-1 inline-flex flex-col items-center">
                            <span className="max-w-full break-words text-center text-sm font-semibold leading-tight text-[#163060]">
                              {details.subscriptionFee != null ? `₱${Number(details.subscriptionFee).toLocaleString()}` : '-'}
                            </span>
                            <span className="mt-1 inline-flex w-fit whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
                              {details.effectiveMonthly != null ? `₱${Number(details.effectiveMonthly).toLocaleString()}` : '-'}
                            </span>
                          </div>
                        </div>

                        {/* Billing & Payment */}
                        <div className="flex min-h-[112px] min-w-0 flex-col items-center justify-start border-r border-slate-200 px-3 py-3 text-center dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-500 ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M5 7v10a2 2 0 002 2h12a2 2 0 002-2V7M5 11h14" />
                              </svg>
                            </span>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d82ab]">Billing &amp; Payment Method</p>
                          </div>
                          <div className="mt-1 inline-flex flex-col items-center">
                            <span className="max-w-full break-words text-center text-sm font-semibold leading-tight text-[#163060]">
                              {formatBillingLabel(details.billingOption)}
                            </span>
                            <span className="mt-1 inline-flex w-fit whitespace-nowrap rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-500/30">
                              {formatPaymentMethodLabel(details.paymentMethod)}
                            </span>
                          </div>
                        </div>

                        {/* Start Date */}
                        <div className="flex min-h-[112px] min-w-0 flex-col items-center justify-start border-r border-slate-200 px-3 py-3 text-center dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-50 text-violet-500 ring-1 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
                              </svg>
                            </span>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d82ab]">Start Date</p>
                          </div>
                          <p className="mt-1 max-w-full break-words text-center text-sm font-semibold leading-tight text-[#163060]">
                            {formatDate(details.approvedAt)}
                          </p>
                        </div>

                        {/* End Date */}
                        <div className="flex min-h-[112px] min-w-0 flex-col items-center justify-start border-r border-slate-200 px-3 py-3 text-center dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-500 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
                              </svg>
                            </span>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d82ab]">End Date</p>
                          </div>
                          <p className="mt-1 max-w-full break-words text-center text-sm font-semibold leading-tight text-[#163060]">
                            {computeEndDate(
                              details.approvedAt,
                              details.billingOption,
                              details.plan,
                              details.planTerm,
                              details.status,
                              details.receiptItems,
                            )}
                          </p>
                        </div>

                      </div>

                      {/* Receipt */}
                      <div className="border-t border-slate-200 px-2 py-3 text-left dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-500 ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4h14a1 1 0 011 1v14l-3-2-3 2-3-2-3 2-3-2-3 2V5a1 1 0 011-1z" />
                              </svg>
                            </span>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d82ab]">Receipt</p>
                          </div>
                          <div className="mt-0.5 grid max-h-[360px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                            {Array.isArray(details.receiptItems) && details.receiptItems.length > 0 ? (
                              details.receiptItems.map((receipt, index) => {
                                const urls = Array.isArray(receipt.receiptUrls) ? receipt.receiptUrls : []
                                const primaryUrl = urls[0] ?? null
                                const receiptId = receipt.id ?? null
                                const receiptStatus = getReceiptStatus(receipt)
                                const isApproved = receiptStatus === 'approved'
                                const isRejected = receiptStatus === 'rejected'
                                const canReview = receipt.type === 'webstore_payment_continuation' && !isApproved && !isRejected && receiptId != null
                                return (
                                  <div key={`${receipt.label ?? 'receipt'}-${index}`} className="w-full overflow-hidden rounded-2xl border border-sky-100 bg-sky-50/60 shadow-sm dark:border-sky-500/20 dark:bg-sky-500/10">
                                    <button
                                      type="button"
                                      disabled={!primaryUrl}
                                      onClick={() => primaryUrl && setReceiptPreviewUrl(primaryUrl)}
                                      className="block w-full text-left transition hover:bg-white/50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-950/20"
                                      aria-label={primaryUrl ? `Preview ${receipt.label ?? `Receipt ${index + 1}`}` : `${receipt.label ?? `Receipt ${index + 1}`} has no image`}
                                    >
                                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-950/40">
                                        {primaryUrl ? (
                                          <img
                                            src={primaryUrl}
                                            alt={receipt.label ?? `Receipt ${index + 1}`}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <div className="flex h-full w-full items-center justify-center">
                                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-sky-500 ring-1 ring-sky-200 dark:bg-slate-900 dark:ring-sky-500/30">
                                              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4h14a1 1 0 011 1v14l-3-2-3 2-3-2-3 2-3-2-3 2V5a1 1 0 011-1z" />
                                              </svg>
                                            </span>
                                          </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent px-3 py-2 text-white">
                                          <div className="flex items-end justify-between gap-2">
                                            <p className="truncate text-xs font-bold">{receipt.label ?? `Receipt ${index + 1}`}</p>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isApproved ? 'bg-emerald-500/20 text-emerald-100' : isRejected ? 'bg-rose-500/20 text-rose-100' : 'bg-amber-500/20 text-amber-100'}`}>
                                              {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                    <div className="px-3 py-2">
                                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                        {formatDateTime(receipt.submittedAt)}
                                      </p>
                                    </div>
                                    <div className="mt-1.5 flex flex-col gap-1">
                                      {canReview ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => receiptId != null && openReceiptConfirm('approve', receiptId, receipt.label ?? `Receipt ${index + 1}`)}
                                            disabled={isApprovingReceipt || isRejectingReceipt}
                                            className="w-full rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/15"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => receiptId != null && openReceiptConfirm('reject', receiptId, receipt.label ?? `Receipt ${index + 1}`)}
                                            disabled={isApprovingReceipt || isRejectingReceipt}
                                            className="w-full rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15"
                                          >
                                            Reject
                                          </button>
                                        </>
                                      ) : null}
                                    </div>
                                  </div>
                                )
                              })
                            ) : Array.isArray(details.receiptUrls) && details.receiptUrls.length > 0 ? (
                              details.receiptUrls.slice(0, 1).map((url, index) => (
                                  <div key={`${url}-${index}`} className="w-full overflow-hidden rounded-2xl border border-sky-100 bg-sky-50/60 shadow-sm dark:border-sky-500/20 dark:bg-sky-500/10">
                                    <button
                                      type="button"
                                      onClick={() => setReceiptPreviewUrl(url)}
                                    className="block w-full text-left transition hover:bg-white/50 dark:hover:bg-slate-950/20"
                                    aria-label={`Preview Receipt ${index + 1}`}
                                  >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-950/40">
                                      <img src={url} alt={`Receipt ${index + 1}`} className="h-full w-full object-cover" />
                                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent px-3 py-2 text-white">
                                        <div className="flex items-end justify-between gap-2">
                                          <p className="truncate text-xs font-bold">Receipt {index + 1}</p>
                                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-100">
                                            Pending
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                </div>
                              ))
                            ) : (
                              <span className="text-sm font-semibold text-slate-400">-</span>
                            )}
                          </div>
                      </div>
                    <div className="grid grid-cols-1 border-t border-slate-200/70 md:grid-cols-4">
                      <div className="border-b border-slate-200 p-4 md:border-b-0 md:border-r dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-500 ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h12M6 4a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2M6 8h12M6 12h12M6 16h6" />
                            </svg>
                          </span>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d82ab]">Latest Checkout ID</p>
                        </div>
                        {latestReceiptCheckoutId ? (
                          <p className="mt-1 break-words text-sm font-semibold leading-tight text-[#163060]">
                            {latestReceiptCheckoutId}
                          </p>
                        ) : (
                          <span className="mt-1 inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
                            Not Match ID
                          </span>
                        )}
                      </div>
                      <div className="border-b border-slate-200 p-4 md:border-b-0 md:border-r dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10M7 15h6M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                            </svg>
                          </span>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d82ab]">Latest Payment Reference</p>
                        </div>
                        {latestReceiptReferenceId ? (
                          <p className="mt-1 break-words text-sm font-semibold leading-tight text-[#163060]">
                            {latestReceiptReferenceId}
                          </p>
                        ) : (
                          <span className="mt-1 inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
                            Not Match ID
                          </span>
                        )}
                      </div>
                      <div className="border-b border-slate-200 p-4 md:border-b-0 md:border-r dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-50 text-sky-500 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 .9-4 2s1.79 2 4 2 4 .9 4 2-1.79 2-4 2m0-8c1.11 0 2.09.28 2.75.72M12 8V6m0 12v-2" />
                            </svg>
                          </span>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d82ab]">Remaining Balance</p>
                        </div>
                        <p className="mt-1 break-words text-sm font-semibold leading-tight text-[#163060]">
                          {details.remainingBalance != null ? `₱${Number(details.remainingBalance).toLocaleString()}` : '-'}
                        </p>
                      </div>
                      <div className="border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 text-orange-500 ring-1 ring-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/20">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 .9-4 2s1.79 2 4 2 4 .9 4 2-1.79 2-4 2m0-8c1.11 0 2.09.28 2.75.72M12 8V6m0 12v-2" />
                            </svg>
                          </span>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d82ab]">Overall Payment Status</p>
                        </div>
                        <div className="mt-2 inline-flex">
                          {details.remainingBalance == null ? (
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                              -
                            </span>
                          ) : details.remainingBalance <= 0 ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                              Paid
                            </span>
                          ) : (
                            <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
                              Still unpaid
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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

      {receiptConfirm.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {receiptConfirm.action === 'approve' ? 'Confirm Receipt Approval' : 'Confirm Receipt Rejection'}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {receiptConfirm.action === 'approve'
                  ? `Approving ${receiptConfirm.label || 'this receipt'} will deduct its amount from the customer remaining balance.`
                  : `Rejecting ${receiptConfirm.label || 'this receipt'} will keep it out of the active subscription balance.`}
              </p>
            </div>
            <div className="p-5">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Receipt</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{receiptConfirm.label || '-'}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
              <button
                type="button"
                onClick={closeReceiptConfirm}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmReceiptAction()}
                disabled={isApprovingReceipt || isRejectingReceipt}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  receiptConfirm.action === 'approve'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/15'
                    : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15'
                }`}
              >
                {receiptConfirm.action === 'approve'
                  ? (isApprovingReceipt ? 'Approving...' : 'Approve')
                  : (isRejectingReceipt ? 'Rejecting...' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {receiptPreviewUrl ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setReceiptPreviewUrl(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Receipt Preview</p>
              <button
                type="button"
                onClick={() => setReceiptPreviewUrl(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Close receipt preview"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[78vh] overflow-auto bg-slate-50 p-4 dark:bg-slate-950/40">
              <img
                src={receiptPreviewUrl}
                alt="Receipt preview"
                className="mx-auto h-auto max-w-full rounded-xl border border-slate-200 bg-white dark:border-slate-700"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
