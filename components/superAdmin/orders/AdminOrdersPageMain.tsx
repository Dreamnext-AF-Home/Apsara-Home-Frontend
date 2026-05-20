'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@heroui/react/button'
import { Card } from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { Label } from '@heroui/react/label'
import { ListBox } from '@heroui/react/list-box'
import { ListBoxItem } from '@heroui/react/list-box-item'
import { Pagination } from '@heroui/react/pagination'
import { SearchField } from '@heroui/react/search-field'
import { Select } from '@heroui/react/select'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AdminCourier,
  AdminOrdersResponse,
  AdminShipmentStatus,
  useBookAdminOrderCourierMutation,
  useCancelAdminOrderCourierMutation,
  useGetAdminOrderCourierWaybillMutation,
  useGetAdminOrderCourierEpodMutation,
  useApproveAdminOrderMutation,
  useFetchAdminOrderZqDetailMutation,
  useGetAdminOrdersQuery,
  usePushAdminOrderToZqMutation,
  useRejectAdminOrderMutation,
  useSyncAdminOrderZqTrackingMutation,
  useTrackAdminOrderCourierMutation,
  useUpdateAdminOrderFulfillmentModeMutation,
  useUpdateAdminOrderShipmentStatusMutation,
} from '@/store/api/adminOrdersApi'
import { useGetAdminGeneralSettingsQuery } from '@/store/api/adminSettingsApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'

/* ─── constants ────────────────────────────────────────────── */

const FILTER_LABELS: Record<string, string> = {
  all:               'All Orders',
  pending:           'Pending Approval',
  processing:        'Processing',
  paid:              'Paid',
  packed:            'Packed',
  shipped:           'Shipped',
  out_for_delivery:  'Out for Delivery',
  delivered:         'Delivered',
  cancelled:         'Cancelled',
  refunded:          'Refunded',
  returned_refunded: 'Returned / Refunded',
  failed_payments:   'Failed Payments',
  order_history:     'Order History',
  completed:         'Completed',
}

const ORDER_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Needs Approval' },
  { value: 'processing', label: 'Ready to Process' },
  { value: 'shipped', label: 'In Fulfillment' },
  { value: 'out_for_delivery', label: 'In Transit' },
  { value: 'completed', label: 'Completed' },
  { value: 'returned_refunded', label: 'Returns / Refunds' },
  { value: 'failed_payments', label: 'Issues (Failed/Cancelled)' },
]

const SHIPMENT_STATUS_OPTIONS: Array<{ value: AdminShipmentStatus; label: string }> = [
  { value: 'for_pickup', label: 'For Pickup' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed_delivery', label: 'Failed Delivery' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned_to_sender', label: 'Returned to Sender' },
]

const COURIER_OPTIONS: Array<{ value: AdminCourier; label: string }> = [
  { value: 'jnt', label: 'J&T Express' },
  { value: 'xde', label: 'XDE' },
]

type FulfillmentMode = 'manual' | 'local_courier' | 'zq'

const FULFILLMENT_MODE_OPTIONS: Array<{ value: FulfillmentMode; label: string }> = [
  { value: 'manual', label: 'Manual' },
  { value: 'local_courier', label: 'Local Courier' },
  { value: 'zq', label: 'AF HOME GLOBAL SUPPLIER' },
]

const APPROVAL_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  approved:        { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30', label: 'Approved'        },
  rejected:        { dot: 'bg-red-400',     badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',                         label: 'Rejected'        },
  pending_approval:{ dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',             label: 'Pending'         },
  paid:            { dot: 'bg-teal-400',    badge: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/30',                   label: 'Paid'            },
  active:          { dot: 'bg-orange-400',  badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/30',       label: 'Active'          },
  pending:         { dot: 'bg-orange-400',  badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/30',       label: 'Pending'         },
}

const SLA_CONFIG = {
  overdue:   { badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',           dot: 'bg-red-400',     label: 'Overdue'  },
  due_soon:  { badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30', dot: 'bg-amber-400', label: 'Due Soon' },
  on_track:  { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30', dot: 'bg-emerald-400', label: 'On Track' },
}

const ZQ_STATUS_STYLES: Record<string, string> = {
  submitted:   'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30',
  processing:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
  unfulfilled: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600/40',
  paid:        'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30',
  success:     'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
  close:       'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30',
}

/* ─── helpers ──────────────────────────────────────────────── */

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value || 0)

const formatPv = (value: number) =>
  new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0)

const PV_ALLOCATION_RATES = {
  cashback: 0.04,
  unilevel: 0.06,
  directEdge: 0.029,
  global: 0.01,
  productPoints: 0.861,
} as const

const buildPvAllocation = (pv: number) => [
  {
    label: 'Cashback / e-GC',
    rate: '4%',
    value: pv * PV_ALLOCATION_RATES.cashback,
    unit: 'currency' as const,
    note: 'Cashback issued as voucher/e-GC.',
  },
  {
    label: 'Unilevel Pool',
    rate: '6%',
    value: pv * PV_ALLOCATION_RATES.unilevel,
    unit: 'currency' as const,
    note: 'Split across 10 levels at 0.6% per paid level.',
  },
  {
    label: '50K Points Reward',
    rate: '2.9%',
    value: pv * PV_ALLOCATION_RATES.directEdge,
    unit: 'points' as const,
    note: 'Counts toward the 50,000 direct Level 1 points goal.',
  },
  {
    label: 'Global Purchase Bonus',
    rate: '1%',
    value: pv * PV_ALLOCATION_RATES.global,
    unit: 'points' as const,
    note: 'Reserved for global bonus pool computation.',
  },
  {
    label: 'Product Purchase Points',
    rate: '86.1%',
    value: pv * PV_ALLOCATION_RATES.productPoints,
    unit: 'points' as const,
    note: 'Remaining product purchase point allocation.',
  },
]

const parseOrderDate = (value?: string | null) => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')
  const hasTimeZone = /([zZ]|[+-]\d{2}:\d{2})$/.test(normalized)
  const source = hasTimeZone ? normalized : `${normalized}+08:00`
  const parsed = new Date(source)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatDateOnly = (value?: string | null) => {
  const date = parseOrderDate(value)
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatTimeOnly = (value?: string | null) => {
  const date = parseOrderDate(value)
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const formatDuration = (minutes: number | null | undefined) => {
  if (minutes == null) return '-'
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hrs <= 0 ? `${mins}m` : `${hrs}h ${mins}m`
}

const getOrderSortTimestamp = (value?: string | null) => {
  const parsedDate = parseOrderDate(value)
  if (!parsedDate) return 0
  const parsed = parsedDate.getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

const getPaginationPages = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1])

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((first, second) => first - second)
}

const isNewOrder = (value?: string | null) => {
  const createdAt = parseOrderDate(value)
  if (!createdAt) return false
  return Date.now() - createdAt.getTime() <= 24 * 60 * 60 * 1000
}

const getInitials = (name?: string | null) => {
  if (!name) return '?'
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

const copyText = async (value: string) => {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    throw new Error('Clipboard is not available in this browser.')
  }

  await navigator.clipboard.writeText(value)
}

const extractApiError = (err: unknown, fallback: string) => {
  const data = (err as { data?: { message?: string; error?: string } })?.data
  return data?.error || data?.message || fallback
}

const isLocalCourier = (courier?: string | null) => {
  const normalized = String(courier ?? '').trim().toLowerCase()
  return normalized === 'jnt' || normalized === 'xde'
}

const formatCourierLabel = (courier?: string | null) => {
  const normalized = String(courier ?? '').trim().toLowerCase()
  if (normalized === 'afhome') return 'AF Home'
  if (normalized === 'jnt') return 'J&T'
  if (normalized === 'xde') return 'XDE'
  if (normalized === 'zq') return 'Global Supplier'
  return courier ?? ''
}

const extractCourierStatus = (payload: Record<string, unknown> | Array<unknown> | null | undefined): string | null => {
  if (!payload) return null

  if (Array.isArray(payload)) {
    const latestEntry = [...payload]
      .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null && !Array.isArray(entry))
      .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))[0]

    const listStatus = latestEntry?.status
    return typeof listStatus === 'string' && listStatus.trim() !== '' ? listStatus.trim() : null
  }

  const candidates = [
    payload.status,
    payload.code,
    payload.shipment_status,
    payload.message,
    (payload.data as Record<string, unknown> | undefined)?.status,
    (payload.data as Record<string, unknown> | undefined)?.shipment_status,
    (payload.result as Record<string, unknown> | undefined)?.status,
    (payload.result as Record<string, unknown> | undefined)?.shipment_status,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      return candidate.trim()
    }
  }

  return null
}

/* ─── stat card ────────────────────────────────────────────── */

function StatCard({ label, value, bg, text, border, icon }: {
  label: string; value: number; bg: string; text: string; border: string; icon: React.ReactNode
}) {
  return (
    <Card variant="default" className={`border ${border} bg-white shadow-none dark:border-slate-800 dark:bg-slate-900`}>
      <Card.Content className="px-5 py-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400">{label}</p>
            <p className="mt-2.5 text-3xl font-bold text-slate-800 dark:text-white">{value}</p>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg} ${text} dark:ring-1 dark:ring-white/10`}>
            {icon}
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

function EmptyOrdersState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/60">
        <svg className="h-7 w-7 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">No orders found</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">Try adjusting your search or filter.</p>
    </div>
  )
}

/* ─── main ─────────────────────────────────────────────────── */

function AdminOrderSelect({
  ariaLabel,
  value,
  options,
  isDisabled,
  selectedTone = 'default',
  onChange,
}: {
  ariaLabel: string
  value: string
  options: Array<{ value: string; label: string }>
  isDisabled?: boolean
  selectedTone?: 'default' | 'shipment'
  onChange: (value: string) => void
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? 'Select'
  const triggerClassName = selectedTone === 'shipment'
    ? 'flex min-h-10 w-full items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-3 text-left text-xs font-semibold text-teal-700 transition-all duration-200 hover:bg-teal-100 focus:border-teal-300 focus:bg-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-100 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300 dark:hover:bg-teal-500/15 dark:focus:bg-slate-800 dark:disabled:border-white/10 dark:disabled:bg-slate-800 dark:disabled:text-slate-500'
    : 'flex min-h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-xs text-slate-700 transition-all duration-200 hover:bg-white focus:border-teal-300 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800'

  return (
    <Select
      aria-label={ariaLabel}
      selectedKey={value}
      onSelectionChange={(key) => {
        if (key == null) return
        const nextValue = String(key)
        if (nextValue === value) return
        onChange(nextValue)
      }}
      isDisabled={isDisabled}
      className="w-full"
    >
      <Select.Trigger className={triggerClassName}>
        <span className="truncate">{selectedLabel}</span>
        <Select.Indicator className="h-4 w-4 text-slate-400" />
      </Select.Trigger>
      <Select.Popover className="min-w-[var(--trigger-width)] dark:border-slate-700 dark:bg-slate-900">
        <ListBox className="p-1">
          {options.map((option) => (
            <ListBoxItem
              id={option.value}
              key={option.value}
              className={option.value === value
                ? 'rounded-lg border border-teal-200 bg-teal-50 text-teal-700 opacity-100 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300'
                : 'rounded-lg text-slate-700 dark:text-slate-200'
              }
            >
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  )
}

function AdminOrderStaticValue({
  label,
  tone = 'default',
}: {
  label: string
  tone?: 'default' | 'shipment'
}) {
  const className = tone === 'shipment'
    ? 'flex min-h-10 w-full items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-3 text-left text-xs font-semibold text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300'
    : 'flex min-h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200'

  return (
    <div className={className}>
      <span className="truncate">{label}</span>
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Locked</span>
    </div>
  )
}

interface Props {
  initialFilter?: string
  initialData?: AdminOrdersResponse | null
}

type AdminOrderItem = AdminOrdersResponse['orders'][number]

const getOrderTotalPv = (order: AdminOrderItem) => {
  const earnedPv = Number(order.earned_pv ?? 0)
  if (earnedPv > 0) return earnedPv

  const productPv = Number(order.product_pv ?? 0)
  return productPv > 0 ? productPv : 0
}

export default function AdminOrdersPageMain({ initialFilter = 'all', initialData = null }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: adminGeneralSettingsData } = useGetAdminGeneralSettingsQuery()
  const [search,      setSearch]      = useState('')
  const [page,        setPage]        = useState(1)
  const [busyId,      setBusyId]      = useState<number | null>(null)
  const [courierByOrder, setCourierByOrder] = useState<Record<number, AdminCourier>>({})
  const [fulfillmentModeByOrder, setFulfillmentModeByOrder] = useState<Record<number, FulfillmentMode>>({})
  const [overdueFirst, setOverdueFirst] = useState(false)
  const [sortBy,      setSortBy]      = useState<'default' | 'customer_az' | 'amount_low_high'>('default')
  const [highlightedOrderId, setHighlightedOrderId] = useState<number | null>(null)
  const [payloadPreview, setPayloadPreview] = useState<{ checkoutId: string; payload: Record<string, unknown> | Array<unknown> | null } | null>(null)
  const [refundMediaPreview, setRefundMediaPreview] = useState<{ checkoutId: string; kind: 'image' | 'video'; urls: string[] } | null>(null)
  const [orderDetailPreview, setOrderDetailPreview] = useState<AdminOrderItem | null>(null)
  const [stableData, setStableData] = useState<AdminOrdersResponse | null>(initialData)
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const tableDragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 })
  const [isTableDragging, setIsTableDragging] = useState(false)

  const onTableMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button, input, a, select, [role="button"]')) return
    const el = tableScrollRef.current
    if (!el) return
    tableDragState.current = { isDragging: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft }
    setIsTableDragging(true)
  }, [])

  const onTableMouseMove = useCallback((e: React.MouseEvent) => {
    if (!tableDragState.current.isDragging) return
    e.preventDefault()
    const el = tableScrollRef.current
    if (!el) return
    const x = e.pageX - el.offsetLeft
    el.scrollLeft = tableDragState.current.scrollLeft - (x - tableDragState.current.startX) * 1.2
  }, [])

  const stopTableDrag = useCallback(() => {
    tableDragState.current.isDragging = false
    setIsTableDragging(false)
  }, [])

  const role       = (session?.user?.role ?? '').toLowerCase()
  const canApprove = role === 'super_admin' || role === 'admin' || role === 'merchant_admin'
  const canTrack   = canApprove || role === 'csr'
  const manualCheckoutModeEnabled = Boolean(adminGeneralSettingsData?.settings?.enable_manual_checkout_mode)
  const availableFulfillmentModeOptions = useMemo(
    () => (manualCheckoutModeEnabled
      ? FULFILLMENT_MODE_OPTIONS.filter((option) => option.value === 'manual')
      : FULFILLMENT_MODE_OPTIONS),
    [manualCheckoutModeEnabled],
  )

  const effectiveFilter = useMemo(() => {
    const normalized = initialFilter.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
    const aliases: Record<string, string> = {
      returned: 'refunded', returned_refunded: 'returned_refunded', history: 'order_history',
      deliverd: 'delivered', outfordelivery: 'out_for_delivery',
    }
    const mapped = aliases[normalized] ?? normalized
    const supported = ['all','pending','processing','paid','packed','shipped','out_for_delivery','delivered','cancelled','refunded','returned_refunded','failed_payments','order_history','completed']
    return supported.includes(mapped) ? mapped : 'all'
  }, [initialFilter])

  const { data, isLoading, isError, isFetching } = useGetAdminOrdersQuery({
    filter: effectiveFilter, search: search.trim() || undefined, page, perPage: 20,
  }, {
    skip: Boolean(initialData && effectiveFilter === 'all' && page === 1 && search.trim() === ''),
  })

  useEffect(() => {
    if (data) {
      setStableData(data)
    }
  }, [data])

  const effectiveData = data ?? stableData ?? initialData ?? null

  useEffect(() => {
    setPage(1)
  }, [effectiveFilter])

  const [approveOrder] = useApproveAdminOrderMutation()
  const [rejectOrder]  = useRejectAdminOrderMutation()
  const [bookCourier] = useBookAdminOrderCourierMutation()
  const [trackCourier] = useTrackAdminOrderCourierMutation()
  const [getCourierWaybill] = useGetAdminOrderCourierWaybillMutation()
  const [cancelCourier] = useCancelAdminOrderCourierMutation()
  const [getCourierEpod] = useGetAdminOrderCourierEpodMutation()
  const [updateFulfillmentMode] = useUpdateAdminOrderFulfillmentModeMutation()
  const [updateShipmentStatus] = useUpdateAdminOrderShipmentStatusMutation()
  const [pushToZq] = usePushAdminOrderToZqMutation()
  const [fetchZqDetail] = useFetchAdminOrderZqDetailMutation()
  const [syncZqTracking] = useSyncAdminOrderZqTrackingMutation()

  const visibleOrders = useMemo(() => {
    const list = [...(effectiveData?.orders ?? [])]
    return list.sort((a, b) => {
      if (overdueFirst) {
        const aOver = a.sla?.state === 'overdue' ? 1 : 0
        const bOver = b.sla?.state === 'overdue' ? 1 : 0
        if (aOver !== bOver) return bOver - aOver
        if (aOver === 1 && bOver === 1) {
          const aOverMin = a.sla?.overdue_minutes ?? 0
          const bOverMin = b.sla?.overdue_minutes ?? 0
          if (aOverMin !== bOverMin) return bOverMin - aOverMin
        }
      }
      if (sortBy === 'customer_az') {
        return (a.customer_name ?? '').trim().toLowerCase()
          .localeCompare((b.customer_name ?? '').trim().toLowerCase(), 'en', { sensitivity: 'base' })
      }
      if (sortBy === 'amount_low_high') return (a.amount ?? 0) - (b.amount ?? 0)
      const timeDiff = getOrderSortTimestamp(b.paid_at ?? b.created_at) - getOrderSortTimestamp(a.paid_at ?? a.created_at)
      if (timeDiff !== 0) return timeDiff
      return (b.id ?? 0) - (a.id ?? 0)
    })
  }, [effectiveData?.orders, overdueFirst, sortBy])

  useEffect(() => {
    if (!effectiveData?.orders?.length) return

    setCourierByOrder((prev) => {
      const next = { ...prev }
      for (const order of effectiveData.orders) {
        const courier = ((order.courier ?? '').toLowerCase() === 'xde' ? 'xde' : 'jnt') as AdminCourier
        if (!next[order.id]) {
          next[order.id] = courier
        }
      }
      return next
    })
  }, [effectiveData?.orders])

  useEffect(() => {
    if (!effectiveData?.orders?.length) return

    setFulfillmentModeByOrder((prev) => {
      const next = { ...prev }
      for (const order of effectiveData.orders) {
        const hasExistingZqFlow = Boolean(order.zq_platform_order_id || order.zq_order_id || order.zq_status)
        if (!next[order.id]) {
          next[order.id] = (order.fulfillment_mode as FulfillmentMode | undefined)
            ?? (hasExistingZqFlow ? 'zq' : (isLocalCourier(order.courier) ? 'local_courier' : 'manual'))
        }
      }
      return next
    })
  }, [effectiveData?.orders])

  useEffect(() => {
    const raw = searchParams.get('highlightOrderId')
    if (!raw) {
      return
    }

    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) {
      return
    }

    setHighlightedOrderId(parsed)
    const timeout = window.setTimeout(() => setHighlightedOrderId(null), 8000)
    return () => window.clearTimeout(timeout)
  }, [searchParams])

  useEffect(() => {
    if (!highlightedOrderId) return

    const row = document.getElementById(`admin-order-row-${highlightedOrderId}`)
    if (!row) return
    row.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightedOrderId, visibleOrders])

  const handleApprove = async (id: number) => {
    setBusyId(id)
    try {
      await approveOrder({ id }).unwrap()
      showSuccessToast('Order approved successfully.')
    } catch (err: unknown) {
      showErrorToast((err as { data?: { message?: string } })?.data?.message || 'Failed to approve order.')
    } finally { setBusyId(null) }
  }

  const handleReject = async (id: number) => {
    setBusyId(id)
    try {
      await rejectOrder({ id }).unwrap()
      showSuccessToast('Order rejected successfully.')
    } catch (err: unknown) {
      showErrorToast((err as { data?: { message?: string } })?.data?.message || 'Failed to reject order.')
    } finally { setBusyId(null) }
  }

  const handleShipmentStatusChange = async (
    id: number,
    shipmentStatus: AdminShipmentStatus,
    options?: { courier?: AdminCourier; clearCourier?: boolean },
  ) => {
    setBusyId(id)
    try {
      await updateShipmentStatus({
        id,
        shipment_status: shipmentStatus,
        courier: options?.courier,
        clear_courier: options?.clearCourier,
      }).unwrap()
      showSuccessToast(`Shipment status updated to ${shipmentStatus.replace(/_/g, ' ')}.`)
    } catch (err: unknown) {
      showErrorToast((err as { data?: { message?: string } })?.data?.message || 'Failed to update shipment status.')
    } finally { setBusyId(null) }
  }

  const handleFulfillmentModeChange = async (id: number, mode: FulfillmentMode) => {
    setBusyId(id)
    try {
      await updateFulfillmentMode({ id, mode }).unwrap()
      setFulfillmentModeByOrder((prev) => ({ ...prev, [id]: mode }))
      showSuccessToast(`Fulfillment mode locked to ${mode.replace(/_/g, ' ')}.`)
    } catch (err: unknown) {
      showErrorToast((err as { data?: { message?: string } })?.data?.message || 'Failed to update fulfillment mode.')
    } finally {
      setBusyId(null)
    }
  }

  const handleBookCourier = async (id: number) => {
    setBusyId(id)
    try {
      const courier = courierByOrder[id] ?? 'jnt'
      const result = await bookCourier({ id, courier }).unwrap()
      if (result.payload && !result.tracking_no) {
        setPayloadPreview({
          checkoutId: visibleOrders.find((order) => order.id === id)?.checkout_id ?? `Order #${id}`,
          payload: result.payload,
        })
      }
      showSuccessToast(
        result.tracking_no
          ? (result.message || `${courier.toUpperCase()} shipment booked.`)
          : `${courier.toUpperCase()} booking returned no tracking number yet.`,
      )
    } catch (err: unknown) {
      showErrorToast(extractApiError(err, 'Failed to book courier shipment.'))
    } finally { setBusyId(null) }
  }

  const handleTrackCourier = async (id: number) => {
    setBusyId(id)
    try {
      const courier = courierByOrder[id] ?? 'jnt'
      const result = await trackCourier({ id, courier }).unwrap()
      if (result.payload && !result.shipment_status) {
        setPayloadPreview({
          checkoutId: visibleOrders.find((order) => order.id === id)?.checkout_id ?? `Order #${id}`,
          payload: result.payload,
        })
      }
      const noLogsYet = Array.isArray(result.payload) && result.payload.length === 0
      showSuccessToast(
        result.shipment_status
          ? `Latest status: ${result.shipment_status.replace(/_/g, ' ')}`
          : noLogsYet
            ? 'No XDE status logs yet in staging.'
            : 'Tracking refreshed.',
      )
    } catch (err: unknown) {
      showErrorToast(extractApiError(err, 'Failed to refresh courier tracking.'))
    } finally { setBusyId(null) }
  }

  const handleOpenWaybill = async (id: number) => {
    setBusyId(id)
    try {
      const courier = courierByOrder[id] ?? 'jnt'
      const blob = await getCourierWaybill({ id, courier }).unwrap()
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
      showSuccessToast(`${courier.toUpperCase()} waybill opened in a new tab.`)
    } catch (err: unknown) {
      showErrorToast(extractApiError(err, 'Failed to open courier waybill.'))
    } finally { setBusyId(null) }
  }

  const handleCancelCourier = async (id: number) => {
    setBusyId(id)
    try {
      const courier = courierByOrder[id] ?? 'jnt'
      const result = await cancelCourier({ id, courier }).unwrap()
      if (result.payload) {
        setPayloadPreview({
          checkoutId: visibleOrders.find((order) => order.id === id)?.checkout_id ?? `Order #${id}`,
          payload: result.payload,
        })
      }
      showSuccessToast(result.message || `${courier.toUpperCase()} shipment cancellation submitted.`)
    } catch (err: unknown) {
      showErrorToast(extractApiError(err, 'Failed to cancel courier shipment.'))
    } finally { setBusyId(null) }
  }

  const handleOpenEpod = async (id: number) => {
    const order = visibleOrders.find((entry) => entry.id === id)
    if (order?.shipment_status !== 'delivered') {
      showErrorToast('EPOD is only available after successful delivery.')
      return
    }

    setBusyId(id)
    try {
      const courier = courierByOrder[id] ?? 'jnt'
      const blob = await getCourierEpod({ id, courier }).unwrap()
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
      showSuccessToast(`${courier.toUpperCase()} EPOD opened in a new tab.`)
    } catch (err: unknown) {
      showErrorToast(extractApiError(err, 'Failed to open courier EPOD.'))
    } finally { setBusyId(null) }
  }

  const handlePushToZq = async (id: number) => {
    setBusyId(id)
    try {
      const result = await pushToZq({ id }).unwrap()
      if (result.zq) {
        setPayloadPreview({
          checkoutId: visibleOrders.find((order) => order.id === id)?.checkout_id ?? `Order #${id}`,
          payload: result.zq,
        })
      }
      showSuccessToast(result.message || 'Order pushed to Global Supplier successfully.')
    } catch (err: unknown) {
      showErrorToast(extractApiError(err, 'Failed to push order to Global Supplier.'))
    } finally { setBusyId(null) }
  }

  const handleFetchZqDetail = async (id: number) => {
    setBusyId(id)
    try {
      const result = await fetchZqDetail({ id }).unwrap()
      if (result.zq) {
        setPayloadPreview({
          checkoutId: visibleOrders.find((order) => order.id === id)?.checkout_id ?? `Order #${id}`,
          payload: result.zq,
        })
      }
      showSuccessToast(result.message || 'Global Supplier order detail fetched successfully.')
    } catch (err: unknown) {
      showErrorToast(extractApiError(err, 'Failed to fetch Global Supplier detail.'))
    } finally { setBusyId(null) }
  }

  const handleSyncZqTracking = async (id: number) => {
    setBusyId(id)
    try {
      const result = await syncZqTracking({ id }).unwrap()
      if (result.zq) {
        setPayloadPreview({
          checkoutId: visibleOrders.find((order) => order.id === id)?.checkout_id ?? `Order #${id}`,
          payload: result.zq,
        })
      }
      showSuccessToast(result.message || 'Global Supplier tracking synced successfully.')
    } catch (err: unknown) {
      showErrorToast(extractApiError(err, 'Failed to sync Global Supplier tracking.'))
    } finally { setBusyId(null) }
  }

  const counts = effectiveData?.counts
  const currentPage = effectiveData?.meta?.current_page ?? 1
  const totalPages = effectiveData?.meta?.last_page ?? 1
  const paginationPages = useMemo(() => getPaginationPages(currentPage, totalPages), [currentPage, totalPages])
  const handleFilterChange = (value: string) => {
    if (value === effectiveFilter) return
    router.push(value === 'all' ? '/admin/orders' : `/admin/orders/${value}`)
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track checkout orders and handle approval workflow</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border ${
            canApprove ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${canApprove ? 'bg-teal-500' : 'bg-slate-400'}`} />
            {role || 'staff'}
          </span>
          <Button
            size="sm"
            variant="secondary"
            className="rounded-[18px] border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 dark:border-white/18 dark:bg-white/12 dark:text-slate-200"
          >
            <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </Button>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      {counts && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <StatCard label="Total Orders"   value={counts.all}        bg="bg-slate-100"   text="text-slate-600"   border="border-slate-200"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          />
          <StatCard label="Pending"        value={counts.pending}    bg="bg-amber-50"    text="text-amber-600"   border="border-amber-100"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="Processing"     value={counts.processing} bg="bg-blue-50"     text="text-blue-600"    border="border-blue-100"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
          />
          <StatCard label="Cancelled"      value={counts.cancelled}  bg="bg-red-50"      text="text-red-500"     border="border-red-100"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="Completed"      value={counts.completed}  bg="bg-emerald-50"  text="text-emerald-600" border="border-emerald-100"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </motion.div>
      )}

      {/* ── Toolbar ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Search */}
        <div className="hidden relative flex-1 min-w-50">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search checkout ID, customer, product…"
            className="h-11 w-full rounded-[18px] border border-gray-300 bg-white pl-9 pr-4 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-sky-400 focus:bg-white dark:border-white/18 dark:bg-white/12 dark:text-white dark:placeholder:text-white/55 dark:focus:border-sky-400/60 dark:focus:bg-white/18"
          />
        </div>

        {/* Sort */}
        <select
          hidden
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-[18px] border border-gray-300 bg-white px-3 py-2.5 text-sm text-slate-700 transition outline-none focus:border-sky-400 focus:bg-white dark:border-white/18 dark:bg-white/12 dark:text-slate-200 dark:focus:border-sky-400/60 dark:focus:bg-white/18"
        >
          <option value="default">Sort: Default</option>
          <option value="customer_az">Customer A–Z</option>
          <option value="amount_low_high">Amount: Low to High</option>
        </select>

        {/* Overdue toggle */}
        <label className="hidden items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setOverdueFirst(v => !v)}
            className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${overdueFirst ? 'bg-teal-500' : 'bg-slate-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${overdueFirst ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-xs font-medium text-slate-600">Overdue first</span>
        </label>

        {/* Active filter pill */}
        <span className="hidden text-xs text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full font-medium ml-auto">
          {FILTER_LABELS[effectiveFilter] ?? 'All Orders'}
        </span>
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full max-w-2xl">
            <SearchField
              aria-label="Search admin orders"
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(1)
              }}
              className="w-full"
            >
              <Label className="sr-only">Search admin orders</Label>
              <SearchField.Group className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition-all duration-200 focus-within:border-teal-300 focus-within:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:focus-within:bg-slate-800">
                <SearchField.SearchIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <SearchField.Input
                  placeholder="Search checkout ID, customer, or product..."
                  className="flex-1 border-none bg-transparent p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                {search ? <SearchField.ClearButton className="text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" /> : null}
              </SearchField.Group>
            </SearchField>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[220px]">
              <AdminOrderSelect
                ariaLabel="Filter admin orders by status"
                value={effectiveFilter}
                options={ORDER_FILTER_OPTIONS}
                onChange={handleFilterChange}
              />
            </div>

            <div className="min-w-[190px]">
              <AdminOrderSelect
                ariaLabel="Sort admin orders"
                value={sortBy}
                options={[
                  { value: 'default', label: 'Sort: Default' },
                  { value: 'customer_az', label: 'Customer A-Z' },
                  { value: 'amount_low_high', label: 'Amount: Low to High' },
                ]}
                onChange={(value) => setSortBy(value as typeof sortBy)}
              />
            </div>

            <Button
              size="sm"
              variant="tertiary"
              onPress={() => setOverdueFirst((value) => !value)}
              className={overdueFirst
                ? 'border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300'
                : 'border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}
            >
              {overdueFirst ? 'Overdue First: On' : 'Overdue First: Off'}
            </Button>

            <Chip size="sm" variant="soft" className="border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {FILTER_LABELS[effectiveFilter] ?? 'All Orders'}
            </Chip>
          </div>
        </div>
      </motion.div>

      {/* ── Error ── */}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Failed to load orders.
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && !effectiveData ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4 dark:border-slate-800">
            <div className="h-4 w-28 rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/70 dark:divide-slate-800/70 dark:divide-slate-800/60">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-slate-100 shrink-0 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="h-6 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="h-7 w-16 rounded-lg bg-slate-100 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          {isFetching && (
            <div className="google-loading-bar" />
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Order Queue</h2>
              <Chip size="sm" variant="soft" className="border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {visibleOrders.length} orders
              </Chip>
            </div>

            <div
              ref={tableScrollRef}
              className={`overflow-x-auto overflow-y-visible ${isTableDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
              onMouseDown={onTableMouseDown}
              onMouseMove={onTableMouseMove}
              onMouseUp={stopTableDrag}
              onMouseLeave={stopTableDrag}
            >
              <table aria-label="Admin orders table" className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                    <th className="min-w-[220px] px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Product</th>
                    <th className="min-w-[150px] px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Checkout</th>
                    <th className="min-w-[150px] px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Source</th>
                    <th className="min-w-[140px] px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Date</th>
                    {effectiveFilter !== 'returned_refunded' ? (
                      <th className="min-w-[260px] px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Customer / Delivery</th>
                    ) : null}
                    <th className="min-w-[120px] px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Amount</th>
                    {effectiveFilter === 'returned_refunded' ? (
                      <th className="min-w-[260px] px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Intent</th>
                    ) : null}
                    {effectiveFilter !== 'returned_refunded' ? (
                      <th className="min-w-[140px] px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Approval</th>
                    ) : null}
                    {effectiveFilter !== 'returned_refunded' ? (
                      <th className="min-w-[140px] px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">SLA</th>
                    ) : null}
                    {effectiveFilter !== 'returned_refunded' ? (
                      <th className="min-w-[340px] px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Tracking</th>
                    ) : null}
                    <th className="min-w-[200px] px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {visibleOrders.length ? (
                      visibleOrders.map(order => {
                      const isBusy             = busyId === order.id
                      const canApproveThisOrder = canApprove && order.approval_status === 'pending_approval'
                      const isDelivered = order.fulfillment_status === 'delivered'
                      const isCancelled = order.fulfillment_status === 'cancelled'
                      const isRefunded = order.fulfillment_status === 'refunded'
                      const isRefundQueue = effectiveFilter === 'returned_refunded' || isRefunded
                      const refundImageUrls = Array.isArray(order.refund_image_urls) ? order.refund_image_urls.filter(Boolean) : []
                      const refundVideoUrls = Array.isArray(order.refund_video_urls) ? order.refund_video_urls.filter(Boolean) : []
                      const canReviewRefund = isRefundQueue
                      const canTrackThisOrder   = canTrack && order.approval_status === 'approved' && !isDelivered && !isCancelled && !isRefunded
                      const approval = APPROVAL_CONFIG[order.approval_status] ?? APPROVAL_CONFIG.pending
                      const sla      = order.sla?.state ? SLA_CONFIG[order.sla.state as keyof typeof SLA_CONFIG] : null
                      const isCourierBooked = Boolean(order.courier && order.tracking_no)
                      const rawCourierStatus = extractCourierStatus(order.shipment_payload)
                      const zqStatusKey = String(order.zq_status ?? '').trim().toLowerCase()
                      const zqBadgeClass = ZQ_STATUS_STYLES[zqStatusKey] ?? 'bg-slate-50 text-slate-600 border-slate-200'
                      const hasZqOrder = Boolean(order.zq_platform_order_id || order.zq_order_id || zqStatusKey)
                      const selectedFulfillmentMode = fulfillmentModeByOrder[order.id]
                        ?? (order.fulfillment_mode as FulfillmentMode | undefined)
                        ?? (hasZqOrder ? 'zq' : 'manual')
                      const isManualMode = selectedFulfillmentMode === 'manual'
                      const isLocalCourierMode = selectedFulfillmentMode === 'local_courier'
                      const isZqMode = selectedFulfillmentMode === 'zq'
                      const fulfillmentModeLabel = FULFILLMENT_MODE_OPTIONS.find((option) => option.value === selectedFulfillmentMode)?.label ?? 'Manual'
                      const isFulfillmentModeLocked =
                        effectiveFilter === 'shipped'
                        || order.fulfillment_status === 'shipped'
                        || order.fulfillment_status === 'out_for_delivery'
                        || order.fulfillment_status === 'delivered'
                      const canPushZq = canTrackThisOrder && isZqMode && !hasZqOrder
                      const canUseZqLookup = canTrackThisOrder && isZqMode && hasZqOrder
                      const canUseCourierFlow = canTrackThisOrder && isLocalCourierMode && !hasZqOrder
                      const canUseManualFlow = canTrackThisOrder && isManualMode && !hasZqOrder
                      const showNewBadge = isNewOrder(order.created_at)
                      const createdDate = formatDateOnly(order.created_at)
                      const createdTime = formatTimeOnly(order.created_at)
                      const paidDate = order.paid_at ? formatDateOnly(order.paid_at) : null
                      const isCourierCancelled =
                        order.shipment_status === 'cancelled'
                        || rawCourierStatus === 'package_cancelled'
                        || rawCourierStatus === 'package cancelled'

                      return (
                        <tr
                          id={`admin-order-row-${order.id}`}
                          key={order.id}
                          className={`group border-b border-slate-100 transition-colors dark:border-slate-800 ${
                            highlightedOrderId === order.id
                              ? 'bg-teal-50/80 ring-1 ring-inset ring-teal-200 animate-pulse dark:bg-teal-500/10 dark:ring-teal-500/30'
                              : 'bg-white hover:bg-slate-50/60 dark:bg-slate-900 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          {/* Product */}
                          <td className="px-5 py-3.5 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-[#31405f] dark:bg-[#1b2640]">
                                {order.product_image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={order.product_image}
                                    alt={order.product_name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <svg className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="line-clamp-1 text-[15px] font-semibold leading-5 text-slate-800 dark:text-slate-100">{order.product_name}</p>
                                  {showNewBadge ? (
                                    <Chip size="sm" variant="soft" className="shrink-0 border border-sky-200 bg-sky-50 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                                      New
                                    </Chip>
                                  ) : null}
                                </div>
                                <p className="text-[12px] leading-4 text-slate-400 dark:text-slate-500">
                                  Qty {order.quantity}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Checkout */}
                          <td className="px-5 py-3.5 align-middle">
                            <p className="font-mono text-xs font-medium text-slate-800 dark:text-slate-100">{order.checkout_id}</p>
                            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                              {order.payment_status}
                            </p>
                          </td>

                          {/* Source */}
                          <td className="px-5 py-3.5 align-middle">
                            {order.source_label ? (
                              <div className="space-y-1">
                                <p className="text-[12px] font-semibold text-sky-600 dark:text-sky-400">
                                  {order.source_label}
                                </p>
                                {order.source_host ? (
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                    {order.source_host}
                                  </p>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-300 dark:text-slate-600">-</span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="px-5 py-3.5 align-middle whitespace-nowrap">
                            <p className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{createdDate}</p>
                            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-400">{createdTime} PH</p>
                            {order.paid_at && (
                              <div className="mt-1.5 border-t border-slate-100 pt-1.5 dark:border-slate-700/60">
                                <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Paid · {paidDate}</p>
                              </div>
                            )}
                          </td>

                          {/* Customer */}
                          {effectiveFilter !== 'returned_refunded' ? (
                          <td className="px-5 py-3.5 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="h-7 w-7 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {getInitials(order.customer_name)}
                              </div>
                              <div className="min-w-0 space-y-1">
                                <p className="line-clamp-1 text-[15px] font-semibold leading-5 text-slate-800 dark:text-slate-100">{order.customer_name || 'N/A'}</p>
                                <p className="line-clamp-1 text-[12px] leading-4 text-slate-400 dark:text-slate-500">{order.customer_email || 'No email provided'}</p>
                                <p className="line-clamp-1 text-[12px] leading-4 text-slate-500 dark:text-slate-400">
                                  {order.customer_phone || 'No phone provided'}
                                </p>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                    Delivery Address
                                  </p>
                                  <p className="mt-1 line-clamp-3 text-[12px] leading-5 text-slate-600 dark:text-slate-300">
                                    {order.customer_address || 'No delivery address provided'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                          ) : null}

                          {/* Amount */}
                          <td className="px-5 py-3.5 align-middle">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatMoney(order.amount)}</p>
                            {canReviewRefund ? (
                              <p className="mt-0.5 text-[11px] font-semibold text-amber-600">Pending refund request</p>
                            ) : null}
                            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                              {order.payment_method || '-'}
                            </p>
                          </td>

                          {effectiveFilter === 'returned_refunded' ? (
                            <td className="px-5 py-3.5 align-middle">
                              <p className="line-clamp-3 text-[12px] leading-5 text-slate-600 dark:text-slate-300">
                                {order.refund_reason || 'No reason provided.'}
                              </p>
                            </td>
                          ) : null}

                          {/* Approval badge */}
                          {effectiveFilter !== 'returned_refunded' ? (
                          <td className="min-w-[140px] px-5 py-3.5 align-middle">
                            <Chip size="sm" variant="soft" className={`inline-flex min-w-[92px] items-center justify-center whitespace-nowrap border text-[11px] font-semibold ${approval.badge}`}>
                              <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${approval.dot}`} />
                              {approval.label}
                            </Chip>
                          </td>
                          ) : null}

                          {/* SLA */}
                          {effectiveFilter !== 'returned_refunded' ? (
                          <td className="min-w-[140px] px-5 py-3.5 align-middle">
                            {sla ? (
                              <div className="space-y-1">
                                <Chip size="sm" variant="soft" className={`inline-flex min-w-[92px] items-center justify-center whitespace-nowrap border text-[11px] font-semibold ${sla.badge}`}>
                                  <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${sla.dot}`} />
                                  {sla.label}
                                </Chip>
                                {order.sla?.state === 'overdue' && (
                                  <p className="text-[11px] text-red-500">+{formatDuration(order.sla?.overdue_minutes)}</p>
                                )}
                                {order.sla?.state === 'due_soon' && (
                                  <p className="text-[11px] text-amber-600">Left: {formatDuration(order.sla?.remaining_minutes)}</p>
                                )}
                                {order.sla?.state === 'on_track' && (
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Elapsed: {formatDuration(order.sla?.elapsed_minutes)}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                          ) : null}

                          {/* Tracking select */}
                          {effectiveFilter !== 'returned_refunded' ? (
                          <td className="px-5 py-3.5 align-middle">
                            <div className="space-y-1.5">
                              {isFulfillmentModeLocked ? (
                                <AdminOrderStaticValue label={fulfillmentModeLabel} />
                              ) : (
                                <AdminOrderSelect
                                  ariaLabel={`Fulfillment mode for order ${order.checkout_id}`}
                                  value={selectedFulfillmentMode}
                                  options={availableFulfillmentModeOptions}
                                  isDisabled={isBusy || order.approval_status !== 'approved' || hasZqOrder}
                                  onChange={(value) => handleFulfillmentModeChange(order.id, value as FulfillmentMode)}
                                />
                              )}

                              {isZqMode ? (
                                  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-500/30 dark:bg-violet-500/10">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700">Global Supplier Flow</p>
                                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${zqBadgeClass}`}>
                                      {order.zq_status ?? 'Not sent'}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-[11px] leading-relaxed text-violet-700">
                                    {hasZqOrder
                                      ? 'Global Supplier handoff is active for this order. Use Global Supplier detail and tracking below.'
                                      : order.approval_status === 'approved'
                                        ? 'Push this order to Global Supplier first to unlock detail and tracking.'
                                        : 'Approve the order first before pushing it to Global Supplier.'}
                                  </p>
                                  {order.zq_platform_order_id ? (
                                    <p className="mt-2 break-all text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                                      Platform ID: {order.zq_platform_order_id}
                                    </p>
                                  ) : null}
                                  {order.zq_order_id ? (
                                    <p className="mt-1 break-all text-[11px] text-slate-600 dark:text-slate-300">
                                      Global Supplier Order: {order.zq_order_id}
                                    </p>
                                  ) : null}
                                </div>
                              ) : isManualMode ? (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-[#31405f] dark:bg-[#1b2640]">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Manual Flow</p>
                                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-[#3a4b6d] dark:bg-[#121a2b] dark:text-slate-300">
                                      Internal
                                    </span>
                                  </div>
                                  <p className="mt-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                                    This order is managed manually. No courier booking or Global Supplier handoff will be used.
                                  </p>
                                  <AdminOrderSelect
                                    ariaLabel={`Manual shipment status for order ${order.checkout_id}`}
                                    value={(order.shipment_status as AdminShipmentStatus | undefined) ?? 'for_pickup'}
                                    options={SHIPMENT_STATUS_OPTIONS}
                                    selectedTone="shipment"
                                    isDisabled={isBusy || !canUseManualFlow}
                                    onChange={(value) => handleShipmentStatusChange(order.id, value as AdminShipmentStatus, { clearCourier: true })}
                                  />
                                </div>
                              ) : (
                                <>
                                  <AdminOrderSelect
                                    ariaLabel={`Courier for order ${order.checkout_id}`}
                                    value={courierByOrder[order.id] ?? (((order.courier ?? '').toLowerCase() === 'xde' ? 'xde' : 'jnt') as AdminCourier)}
                                    options={COURIER_OPTIONS}
                                    isDisabled={isBusy || !canUseCourierFlow}
                                    onChange={(value) => setCourierByOrder(prev => ({ ...prev, [order.id]: value as AdminCourier }))}
                                  />
                                  <AdminOrderSelect
                                    ariaLabel={`Shipment status for order ${order.checkout_id}`}
                                    value={(order.shipment_status as AdminShipmentStatus | undefined) ?? 'for_pickup'}
                                    options={SHIPMENT_STATUS_OPTIONS}
                                    selectedTone="shipment"
                                    isDisabled={isBusy || !canUseCourierFlow || isCourierBooked}
                                    onChange={(value) => handleShipmentStatusChange(order.id, value as AdminShipmentStatus, { courier: courierByOrder[order.id] ?? 'jnt' })}
                                  />
                                  <div className="grid grid-cols-2 gap-1">
                                    <Button
                                      size="sm"
                                      variant="tertiary"
                                      isDisabled={isBusy || !canUseCourierFlow || isCourierCancelled}
                                      onPress={() => handleBookCourier(order.id)}
                                      className="border border-teal-200 bg-teal-50 px-2 py-1.5 text-[11px] font-semibold text-teal-700 transition hover:bg-teal-100"
                                    >
                                      Book
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="tertiary"
                                      isDisabled={isBusy || !canUseCourierFlow || !order.tracking_no || isCourierCancelled}
                                      onPress={() => handleTrackCourier(order.id)}
                                      className="border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-[#31405f] dark:bg-[#1b2640] dark:text-slate-200 dark:hover:bg-[#22304b]"
                                    >
                                      Track
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="tertiary"
                                      isDisabled={isBusy || !canUseCourierFlow || courierByOrder[order.id] !== 'xde' || !order.tracking_no || isCourierCancelled}
                                      onPress={() => handleOpenWaybill(order.id)}
                                      className="border border-blue-200 bg-blue-50 px-2 py-1.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
                                    >
                                      Waybill
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="tertiary"
                                      isDisabled={isBusy || !canUseCourierFlow || courierByOrder[order.id] !== 'xde' || !order.tracking_no || order.shipment_status !== 'delivered'}
                                      onPress={() => handleOpenEpod(order.id)}
                                      className="border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100"
                                    >
                                      EPOD
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="tertiary"
                                      isDisabled={isBusy || !canUseCourierFlow || courierByOrder[order.id] !== 'xde' || !order.tracking_no || isCourierCancelled}
                                      onPress={() => handleCancelCourier(order.id)}
                                      className="col-span-2 border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] font-semibold text-red-700 transition hover:bg-red-100"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                  <p className="text-[11px] text-teal-600">
                                    Local courier mode is active. Use J&T/XDE booking and tracking controls here.
                                  </p>
                                </>
                              )}

                              {(isDelivered || isCancelled || isRefunded) && (
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                  {isDelivered ? 'Delivered orders are locked.' : 'Tracking is disabled for this status.'}
                                </p>
                              )}
                              {order.courier || order.tracking_no || order.shipment_status ? (
                                <div className="space-y-2 text-[11px] text-slate-500 leading-relaxed dark:text-slate-300">
                                  {order.zq_platform_order_id || order.zq_status ? (
                                    <div className="rounded-xl border border-violet-200 bg-violet-50 p-2.5 dark:border-violet-500/30 dark:bg-violet-500/10">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700">Global Supplier</p>
                                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${zqBadgeClass}`}>
                                          {order.zq_status ?? 'Not sent'}
                                        </span>
                                      </div>
                                      {order.zq_platform_order_id ? (
                                        <p className="mt-1 break-all text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                                          Platform ID: {order.zq_platform_order_id}
                                        </p>
                                      ) : null}
                                      {order.zq_order_id ? (
                                        <p className="mt-1 break-all text-[11px] text-slate-600 dark:text-slate-300">
                                          Global Supplier Order: {order.zq_order_id}
                                        </p>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  {order.courier ? <p className="uppercase tracking-wide dark:text-slate-400">Courier: {formatCourierLabel(order.courier)}</p> : null}
                                  {rawCourierStatus ? <p className="capitalize dark:text-slate-400">Courier Status: {rawCourierStatus.replace(/_/g, ' ')}</p> : null}
                                  {order.tracking_no ? (
                                    <div className="rounded-xl border border-teal-200 bg-teal-50 p-2 dark:border-teal-500/25 dark:bg-[#1b2640]">
                                      <p className="text-[10px] font-bold uppercase tracking-wide text-teal-700">Tracking Number</p>
                                      <div className="mt-1 flex items-center gap-2">
                                        <p className="min-w-0 flex-1 break-all text-sm font-bold text-slate-900 dark:text-white">{order.tracking_no}</p>
                                        <Button
                                          size="sm"
                                          variant="tertiary"
                                          onPress={async () => {
                                            try {
                                              await copyText(order.tracking_no as string)
                                              showSuccessToast('Tracking number copied.')
                                            } catch (error) {
                                              const message = error instanceof Error ? error.message : 'Failed to copy tracking number.'
                                              showErrorToast(message)
                                            }
                                          }}
                                          className="shrink-0 border border-teal-200 bg-white px-2 py-1 text-[10px] font-semibold text-teal-700 transition hover:bg-teal-100 dark:border-teal-500/25 dark:bg-[#121a2b] dark:text-teal-300 dark:hover:bg-[#22304b]"
                                        >
                                          Copy
                                        </Button>
                                      </div>
                                    </div>
                                  ) : null}
                                  {order.shipment_status ? <p className="capitalize dark:text-slate-400">Shipment: {order.shipment_status.replace(/_/g, ' ')}</p> : null}
                                  <Button
                                    size="sm"
                                    variant="tertiary"
                                    onPress={() => setPayloadPreview({ checkoutId: order.checkout_id, payload: order.shipment_payload ?? null })}
                                  className="border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-[#31405f] dark:bg-[#1b2640] dark:text-slate-200 dark:hover:bg-[#22304b]"
                                  >
                                    {order.shipment_payload ? 'View Payload' : 'No Payload Yet'}
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-300 dark:text-slate-400">
                                  {order.approval_status === 'approved' ? 'No shipment info yet' : 'Awaiting approval'}
                                </p>
                              )}
                            </div>
                          </td>
                          ) : null}

                          {/* Actions */}
                          <td className="px-5 py-3.5 align-middle">
                            <div className="flex w-40 flex-col gap-1.5">
                              <Button
                                size="sm"
                                variant="tertiary"
                                onPress={() => setOrderDetailPreview(order)}
                                className="w-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
                              >
                                View Details
                              </Button>

                              {canReviewRefund ? (
                                <div className="flex flex-col gap-1.5 rounded-xl border border-amber-200 bg-amber-50/60 p-2 dark:border-amber-500/30 dark:bg-amber-500/10">
                                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Refund request</p>
                                  {order.refund_requested_at ? (
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                      Requested: {formatDateOnly(order.refund_requested_at)} {formatTimeOnly(order.refund_requested_at)} PH
                                    </p>
                                  ) : null}
                                  <div className="grid grid-cols-2 gap-1">
                                    <Button size="sm" variant="tertiary" isDisabled={isBusy} onPress={() => handleApprove(order.id)} className="border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100">
                                      Approve
                                    </Button>
                                    <Button size="sm" variant="tertiary" isDisabled={isBusy} onPress={() => handleReject(order.id)} className="border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-100">
                                      Reject
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1">
                                    {refundImageUrls.length > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() => setRefundMediaPreview({ checkoutId: order.checkout_id, kind: 'image', urls: refundImageUrls })}
                                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-[#31405f] dark:bg-[#1b2640] dark:text-slate-200 dark:hover:bg-[#22304b]"
                                      >
                                        View Image
                                      </button>
                                    ) : (
                                      <span className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-400 dark:border-[#31405f] dark:bg-[#1b2640] dark:text-slate-500">
                                        No Image
                                      </span>
                                    )}
                                    {refundVideoUrls.length > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() => setRefundMediaPreview({ checkoutId: order.checkout_id, kind: 'video', urls: refundVideoUrls })}
                                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-[#31405f] dark:bg-[#1b2640] dark:text-slate-200 dark:hover:bg-[#22304b]"
                                      >
                                        View Video
                                      </button>
                                    ) : (
                                      <span className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-400 dark:border-[#31405f] dark:bg-[#1b2640] dark:text-slate-500">
                                        No Video
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : canApproveThisOrder ? (
                                <div className="flex flex-col gap-1.5">
                                  <div className="grid grid-cols-2 gap-1">
                                    <Button size="sm" variant="tertiary" isDisabled={isBusy} onPress={() => handleApprove(order.id)} className="border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100">
                                      Approve
                                    </Button>
                                    <Button size="sm" variant="tertiary" isDisabled={isBusy} onPress={() => handleReject(order.id)} className="border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-100">
                                      Reject
                                    </Button>
                                  </div>
                                  <p className="text-[11px] text-slate-400 dark:text-slate-300">Approve first before fulfillment actions.</p>
                                </div>
                              ) : order.approval_status === 'approved' ? (
                                <div className="flex flex-col gap-1.5">
                                  {isZqMode ? (
                                    <>
                                      <Button size="sm" variant="tertiary" isDisabled={isBusy || !canPushZq} onPress={() => handlePushToZq(order.id)} className={`w-full border px-3 py-1.5 text-xs font-semibold transition ${canPushZq ? 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                                        {hasZqOrder ? 'Global Supplier Pushed' : 'Push Global Supplier'}
                                      </Button>
                                      <div className="grid grid-cols-2 gap-1">
                                      <Button size="sm" variant="tertiary" isDisabled={isBusy || !canUseZqLookup} onPress={() => handleFetchZqDetail(order.id)} className={`border px-2 py-1.5 text-[11px] font-semibold transition ${canUseZqLookup ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700' : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'}`}>
                                        Global Supplier Detail
                                      </Button>
                                        <Button size="sm" variant="tertiary" isDisabled={isBusy || !canUseZqLookup} onPress={() => handleSyncZqTracking(order.id)} className={`border px-2 py-1.5 text-[11px] font-semibold transition ${canUseZqLookup ? 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                                          Global Supplier Track
                                        </Button>
                                      </div>
                                    </>
                                  ) : (
                                    <Chip size="sm" variant="soft" className={`border text-[11px] font-semibold ${isManualMode ? 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200' : 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300'}`}>
                                      {isManualMode ? 'Manual Flow' : 'Local Courier Flow'}
                                    </Chip>
                                  )}
                                  {isZqMode ? (
                                    !hasZqOrder ? (
                                      <p className="text-[11px] text-slate-400 dark:text-slate-300">Push to Global Supplier first to unlock detail and tracking.</p>
                                    ) : (
                                      <p className="text-[11px] text-violet-600">Global Supplier lookup is now available for this order.</p>
                                    )
                                  ) : (
                                    <p className="text-[11px] text-slate-400 dark:text-slate-300">
                                      {isManualMode
                                        ? 'Use the tracking column for manual shipment status updates only.'
                                        : 'Use the courier controls in the tracking column for local fulfillment.'}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <Chip size="sm" variant="soft" className="border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 dark:border-[#31405f] dark:bg-[#1b2640] dark:text-slate-300">
                                  {order.approval_status === 'pending_approval' ? 'Awaiting approval' : 'No actions'}
                                </Chip>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr key="empty" className="bg-white dark:bg-[#121a2b]">
                      <td colSpan={effectiveFilter === 'returned_refunded' ? 7 : 10}>
                        <EmptyOrdersState />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{(effectiveData?.meta?.from ?? 0).toLocaleString()}</span> to{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{(effectiveData?.meta?.to ?? 0).toLocaleString()}</span> of{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{(effectiveData?.meta?.total ?? 0).toLocaleString()}</span> orders
                </p>
                <Pagination size="sm" className="w-full justify-start gap-3 md:justify-end">
                  <Pagination.Content>
                    <Pagination.Item>
                      <Pagination.Previous
                        isDisabled={currentPage === 1}
                        onPress={() => setPage(Math.max(1, currentPage - 1))}
                      >
                        <Pagination.PreviousIcon />
                        Prev
                      </Pagination.Previous>
                    </Pagination.Item>

                    {paginationPages.map((pageNumber, index) => {
                      const previousPage = paginationPages[index - 1]
                      const shouldShowEllipsis = typeof previousPage === 'number' && pageNumber - previousPage > 1

                      return (
                        <span key={`fragment-${pageNumber}`} className="contents">
                          {shouldShowEllipsis && (
                            <Pagination.Item>
                              <Pagination.Ellipsis />
                            </Pagination.Item>
                          )}
                          <Pagination.Item>
                            <Pagination.Link isActive={pageNumber === currentPage} onPress={() => setPage(pageNumber)}>
                              {pageNumber}
                            </Pagination.Link>
                          </Pagination.Item>
                        </span>
                      )
                    })}

                    <Pagination.Item>
                      <Pagination.Next
                        isDisabled={currentPage === totalPages}
                        onPress={() => setPage(Math.min(totalPages, currentPage + 1))}
                      >
                        Next
                        <Pagination.NextIcon />
                      </Pagination.Next>
                    </Pagination.Item>
                  </Pagination.Content>
                </Pagination>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {orderDetailPreview ? (() => {
        const orderPv = getOrderTotalPv(orderDetailPreview)
        const allocationRows = buildPvAllocation(orderPv)
        const pvSource = Number(orderDetailPreview.earned_pv ?? 0) > 0
          ? 'Posted earned PV'
          : Number(orderDetailPreview.product_pv ?? 0) > 0
            ? 'Checkout product PV'
            : 'No PV recorded'

        return (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0f172a]">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-500">Order Details</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{orderDetailPreview.checkout_id}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Full order summary, customer details, and PV allocation preview.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderDetailPreview(null)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>

              <div className="max-h-[calc(92vh-92px)] overflow-y-auto p-5">
                <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Product</p>
                    <div className="mt-4 flex gap-4">
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                        {orderDetailPreview.product_image ? (
                          <img src={orderDetailPreview.product_image} alt={orderDetailPreview.product_name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">No image</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{orderDetailPreview.product_name}</h4>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{orderDetailPreview.product_sku || 'No SKU'}</p>
                        <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                          <span className="rounded-xl bg-white px-3 py-2 dark:bg-slate-800">Qty: <b>{orderDetailPreview.quantity}</b></span>
                          <span className="rounded-xl bg-white px-3 py-2 dark:bg-slate-800">Amount: <b>{formatMoney(orderDetailPreview.amount)}</b></span>
                          {orderDetailPreview.selected_color ? <span className="rounded-xl bg-white px-3 py-2 dark:bg-slate-800">Color: <b>{orderDetailPreview.selected_color}</b></span> : null}
                          {orderDetailPreview.selected_size ? <span className="rounded-xl bg-white px-3 py-2 dark:bg-slate-800">Size: <b>{orderDetailPreview.selected_size}</b></span> : null}
                          {orderDetailPreview.selected_type ? <span className="rounded-xl bg-white px-3 py-2 dark:bg-slate-800">Type: <b>{orderDetailPreview.selected_type}</b></span> : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Customer & Delivery</p>
                    <div className="mt-4 grid gap-3 text-sm">
                      <div className="rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</p>
                        <p className="mt-1 font-bold text-slate-900 dark:text-white">{orderDetailPreview.customer_name || 'N/A'}</p>
                        <p className="text-slate-500 dark:text-slate-400">{orderDetailPreview.customer_email || 'No email'}</p>
                        <p className="text-slate-500 dark:text-slate-400">{orderDetailPreview.customer_phone || 'No phone'}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Delivery Address</p>
                        <p className="mt-1 text-slate-700 dark:text-slate-300">{orderDetailPreview.customer_address || 'No address provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Payment</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <p>Method: <b>{orderDetailPreview.payment_method || 'N/A'}</b></p>
                      <p>Status: <b className="capitalize">{orderDetailPreview.payment_status || 'N/A'}</b></p>
                      <p>Paid: <b>{formatDateOnly(orderDetailPreview.paid_at)}</b></p>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Workflow</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <p>Approval: <b className="capitalize">{orderDetailPreview.approval_status.replace(/_/g, ' ')}</b></p>
                      <p>Fulfillment: <b className="capitalize">{orderDetailPreview.fulfillment_status.replace(/_/g, ' ')}</b></p>
                      <p>Created: <b>{formatDateOnly(orderDetailPreview.created_at)} {formatTimeOnly(orderDetailPreview.created_at)}</b></p>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Shipment</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <p>Courier: <b>{formatCourierLabel(orderDetailPreview.courier) || 'N/A'}</b></p>
                      <p>Tracking: <b>{orderDetailPreview.tracking_no || 'N/A'}</b></p>
                      <p>Status: <b className="capitalize">{orderDetailPreview.shipment_status?.replace(/_/g, ' ') || 'N/A'}</b></p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50/70 p-5 dark:border-sky-500/30 dark:bg-sky-500/10">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-300">PV Allocation Breakdown</p>
                      <h4 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{formatPv(orderPv)} PV</h4>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Source: {pvSource}. Display values are rounded to 2 decimals.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/80 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      Total allocation: 100%
                    </div>
                  </div>

                  {orderPv > 0 ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                      {allocationRows.map((row) => (
                        <div key={row.label} className="rounded-2xl border border-white/90 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{row.label}</p>
                          <div className="mt-3 flex items-end justify-between gap-2">
                            <span className="text-sm font-bold text-sky-600 dark:text-sky-300">{row.rate}</span>
                            <span className="text-lg font-black text-slate-900 dark:text-white">
                              {row.unit === 'currency' ? formatMoney(row.value) : `${formatPv(row.value)} pts`}
                            </span>
                          </div>
                          <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{row.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                      No PV has been recorded for this order yet, so the allocation breakdown cannot be computed.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })() : null}

      {payloadPreview ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Shipment Payload</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">{payloadPreview.checkoutId}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPayloadPreview(null)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="p-5">
              {payloadPreview.payload ? (
                <pre className="max-h-[70vh] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
                  {JSON.stringify(payloadPreview.payload, null, 2)}
                </pre>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  No shipment payload has been saved for this order yet. That usually means the courier booking returned no stored payload, or the row has not been refreshed with one yet.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {refundMediaPreview ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Refund {refundMediaPreview.kind === 'image' ? 'Images' : 'Videos'}
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">{refundMediaPreview.checkoutId}</h3>
              </div>
              <button
                type="button"
                onClick={() => setRefundMediaPreview(null)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-5">
              {refundMediaPreview.urls.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {refundMediaPreview.urls.map((url, index) => (
                    <div key={`${url}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
                      {refundMediaPreview.kind === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt={`Refund image ${index + 1}`} className="h-64 w-full rounded-xl object-cover" />
                      ) : (
                        <video controls className="h-64 w-full rounded-xl bg-black">
                          <source src={url} />
                          Your browser does not support video playback.
                        </video>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  No media uploaded for this refund request.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
