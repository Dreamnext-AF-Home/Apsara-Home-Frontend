'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useGetAdminOrdersQuery } from '@/store/api/adminOrdersApi'
import { useGetAdminPaymentsOverviewQuery } from '@/store/api/adminPaymentsApi'
import { useGetExpensesSummaryQuery } from '@/store/api/expensesApi'
import { useGetMembersStatsQuery } from '@/store/api/membersApi'
import { useGetSupplierStatsQuery } from '@/store/api/suppliersApi'
import type { StatsGridInitialData } from './statsGridTypes'

interface StatCard {
  label: string
  changeType: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
  iconBg: string
  iconText: string
  iconBgDark: string
  iconTextDark: string
  border: string
  borderDark: string
  valColor: string
}

interface ResolvedStatCard extends StatCard {
  value: string
  change: string
  modalSummary?: string
  href?: string
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(value || 0)

const formatCount = (value: number) => new Intl.NumberFormat('en-PH').format(value || 0)

const pluralize = (value: number, singular: string, plural = `${singular}s`) =>
  `${formatCount(value)} ${value === 1 ? singular : plural}`

const formatDelta = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}% vs last month`

const dateKey = (value: Date) => {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const monthRange = (offsetMonths: number) => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + offsetMonths + 1, 0)
  return { from: dateKey(start), to: dateKey(end) }
}

const stats: StatCard[] = [
  {
    label: 'Total Orders',
    changeType: 'neutral',
    iconBg: 'bg-blue-50', iconText: 'text-blue-600',
    iconBgDark: 'dark:bg-blue-500/10', iconTextDark: 'dark:text-blue-300',
    border: 'border-blue-100', borderDark: 'dark:border-blue-500/30', valColor: 'text-blue-700',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  },
  {
    label: 'Total Rewards Computed',
    changeType: 'neutral',
    iconBg: 'bg-teal-50', iconText: 'text-teal-600',
    iconBgDark: 'dark:bg-teal-500/10', iconTextDark: 'dark:text-teal-300',
    border: 'border-teal-100', borderDark: 'dark:border-teal-500/30', valColor: 'text-teal-700',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>,
  },
  {
    label: 'Withdrawals Released',
    changeType: 'neutral',
    iconBg: 'bg-emerald-50', iconText: 'text-emerald-600',
    iconBgDark: 'dark:bg-emerald-500/10', iconTextDark: 'dark:text-emerald-300',
    border: 'border-emerald-100', borderDark: 'dark:border-emerald-500/30', valColor: 'text-emerald-700',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>,
  },
  {
    label: 'Withdrawals Pending',
    changeType: 'neutral',
    iconBg: 'bg-red-50', iconText: 'text-red-500',
    iconBgDark: 'dark:bg-red-500/10', iconTextDark: 'dark:text-red-300',
    border: 'border-red-100', borderDark: 'dark:border-red-500/30', valColor: 'text-red-700',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>,
  },
  {
    label: 'Total Expenses',
    changeType: 'neutral',
    iconBg: 'bg-orange-50', iconText: 'text-orange-600',
    iconBgDark: 'dark:bg-orange-500/10', iconTextDark: 'dark:text-orange-300',
    border: 'border-orange-100', borderDark: 'dark:border-orange-500/30', valColor: 'text-orange-700',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z" /></svg>,
  },
  {
    label: 'Total Members',
    changeType: 'neutral',
    iconBg: 'bg-purple-50', iconText: 'text-purple-600',
    iconBgDark: 'dark:bg-purple-500/10', iconTextDark: 'dark:text-purple-300',
    border: 'border-purple-100', borderDark: 'dark:border-purple-500/30', valColor: 'text-purple-700',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /></svg>,
  },
  {
    label: 'Total Suppliers',
    changeType: 'neutral',
    iconBg: 'bg-amber-50', iconText: 'text-amber-600',
    iconBgDark: 'dark:bg-amber-500/10', iconTextDark: 'dark:text-amber-300',
    border: 'border-amber-100', borderDark: 'dark:border-amber-500/30', valColor: 'text-amber-700',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7l9-4 9 4-9 4-9-4zm0 10l9 4 9-4M3 12l9 4 9-4" /></svg>,
  },
  {
    label: 'Suppliers Performance',
    changeType: 'neutral',
    iconBg: 'bg-lime-50', iconText: 'text-lime-600',
    iconBgDark: 'dark:bg-lime-500/10', iconTextDark: 'dark:text-lime-300',
    border: 'border-lime-100', borderDark: 'dark:border-lime-500/30', valColor: 'text-lime-700',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  },
  {
    label: 'New Suppliers',
    changeType: 'neutral',
    iconBg: 'bg-fuchsia-50', iconText: 'text-fuchsia-600',
    iconBgDark: 'dark:bg-fuchsia-500/10', iconTextDark: 'dark:text-fuchsia-300',
    border: 'border-fuchsia-100', borderDark: 'dark:border-fuchsia-500/30', valColor: 'text-fuchsia-700',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" /></svg>,
  },
  {
    label: 'Supplier Payouts',
    changeType: 'neutral',
    iconBg: 'bg-rose-50', iconText: 'text-rose-600',
    iconBgDark: 'dark:bg-rose-500/10', iconTextDark: 'dark:text-rose-300',
    border: 'border-rose-100', borderDark: 'dark:border-rose-500/30', valColor: 'text-rose-700',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a5 5 0 0 0-10 0v2m-2 0h14v11H5V9zm7 4v4" /></svg>,
  },
  {
    label: 'Total E-Wallet Float',
    changeType: 'neutral',
    iconBg: 'bg-indigo-50', iconText: 'text-indigo-600',
    iconBgDark: 'dark:bg-indigo-500/10', iconTextDark: 'dark:text-indigo-300',
    border: 'border-indigo-100', borderDark: 'dark:border-indigo-500/30', valColor: 'text-indigo-700',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z" /></svg>,
  },
  {
    label: 'Total GC Float',
    changeType: 'neutral',
    iconBg: 'bg-pink-50', iconText: 'text-pink-600',
    iconBgDark: 'dark:bg-pink-500/10', iconTextDark: 'dark:text-pink-300',
    border: 'border-pink-100', borderDark: 'dark:border-pink-500/30', valColor: 'text-pink-700',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 0 0-2 2v3a2 2 0 1 0 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 1 0 0-4V7a2 2 0 0 0-2-2H5z" /></svg>,
  },
  {
    label: "Today's Revenue",
    changeType: 'neutral',
    iconBg: 'bg-cyan-50', iconText: 'text-cyan-600',
    iconBgDark: 'dark:bg-cyan-500/10', iconTextDark: 'dark:text-cyan-300',
    border: 'border-cyan-100', borderDark: 'dark:border-cyan-500/30', valColor: 'text-cyan-700',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  },
  {
    label: 'Monthly Revenue',
    changeType: 'neutral',
    iconBg: 'bg-sky-50', iconText: 'text-sky-600',
    iconBgDark: 'dark:bg-sky-500/10', iconTextDark: 'dark:text-sky-300',
    border: 'border-sky-100', borderDark: 'dark:border-sky-500/30', valColor: 'text-sky-700',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" /></svg>,
  },
  {
    label: 'Active Sessions',
    changeType: 'neutral',
    iconBg: 'bg-emerald-50', iconText: 'text-emerald-600',
    iconBgDark: 'dark:bg-emerald-500/10', iconTextDark: 'dark:text-emerald-300',
    border: 'border-emerald-100', borderDark: 'dark:border-emerald-500/30', valColor: 'text-emerald-700',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2" /></svg>,
  },
  {
    label: 'Growth Rate',
    changeType: 'neutral',
    iconBg: 'bg-violet-50', iconText: 'text-violet-600',
    iconBgDark: 'dark:bg-violet-500/10', iconTextDark: 'dark:text-violet-300',
    border: 'border-violet-100', borderDark: 'dark:border-violet-500/30', valColor: 'text-violet-700',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  },
]

const statHrefMap: Record<string, string> = {
  'Total Orders': '/admin/orders',
  'Total Rewards Computed': '/admin/members/wallet',
  'Withdrawals Released': '/admin/encashment/released',
  'Withdrawals Pending': '/admin/encashment/pending',
  'Total Expenses': '/admin/expenses',
  'Total Members': '/admin/members',
  'Total Suppliers': '/admin/suppliers',
  'Suppliers Performance': '/admin/suppliers',
  'New Suppliers': '/admin/suppliers',
  'Supplier Payouts': '/admin/suppliers',
  'Total E-Wallet Float': '/admin/payments/ewallet',
  'Total GC Float': '/admin/payments/giftcards',
  "Today's Revenue": '/admin/payments',
  'Monthly Revenue': '/admin/payments',
}

type StatsGridProps = {
  initialData?: StatsGridInitialData
}

const StatsGrid = ({ initialData }: StatsGridProps) => {
  const [selectedStat, setSelectedStat] = useState<ResolvedStatCard | null>(null)
  const currentMonth = useMemo(() => monthRange(0), [])
  const lastMonth = useMemo(() => monthRange(-1), [])

  const { data: fetchedOrdersData } = useGetAdminOrdersQuery({ page: 1, perPage: 1, filter: 'all' })
  const { data: fetchedMembersStats } = useGetMembersStatsQuery()
  const { data: fetchedPaymentsOverview } = useGetAdminPaymentsOverviewQuery()
  const { data: fetchedSupplierStats } = useGetSupplierStatsQuery()
  const { data: fetchedCurrentExpenses } = useGetExpensesSummaryQuery({ from: currentMonth.from, to: currentMonth.to, status: 1 })
  const { data: fetchedLastExpenses } = useGetExpensesSummaryQuery({ from: lastMonth.from, to: lastMonth.to, status: 1 })

  const ordersData = fetchedOrdersData ?? initialData?.ordersData
  const membersStats = fetchedMembersStats ?? initialData?.membersStats
  const paymentsOverview = fetchedPaymentsOverview ?? initialData?.paymentsOverview
  const supplierStats = fetchedSupplierStats ?? initialData?.supplierStats
  const currentExpenses = fetchedCurrentExpenses ?? initialData?.currentExpenses
  const lastExpenses = fetchedLastExpenses ?? initialData?.lastExpenses

  const resolvedStats = useMemo<ResolvedStatCard[]>(() => {
    const currentExpenseTotal = Number(currentExpenses?.total_amount ?? 0)
    const lastExpenseTotal = Number(lastExpenses?.total_amount ?? 0)

    let expensePct = 0
    if (lastExpenseTotal > 0) {
      expensePct = ((currentExpenseTotal - lastExpenseTotal) / lastExpenseTotal) * 100
    } else if (currentExpenseTotal > 0) {
      expensePct = 100
    }

    const expenseChangeType: ResolvedStatCard['changeType'] =
      currentExpenseTotal > lastExpenseTotal ? 'down' : currentExpenseTotal < lastExpenseTotal ? 'up' : 'neutral'

    const totalOrders = Number(ordersData?.meta?.total ?? 0)
    const totalMembers = Number(membersStats?.total ?? 0)
    const newMembers = Number(membersStats?.newMembers ?? 0)

    const todayPaidAmount = Number(paymentsOverview?.summary?.today_paid_amount ?? 0)
    const todayPaidCount = Number(paymentsOverview?.summary?.today_paid_count ?? 0)
    const grossCollectedAmount = Number(paymentsOverview?.summary?.gross_collected_amount ?? 0)
    const successfulPayments = Number(paymentsOverview?.summary?.successful_payments_count ?? 0)
    const pendingPayments = Number(paymentsOverview?.summary?.pending_payments_count ?? 0)
    const paymentMethods = paymentsOverview?.payment_methods ?? []

    const releasedRequests = Number(paymentsOverview?.encashment_summary?.released_requests ?? 0)
    const releasedAmount = releasedRequests > 0
      ? Number(paymentsOverview?.encashment_summary?.released_amount ?? 0)
      : 0
    const pendingRequests = Number(paymentsOverview?.encashment_summary?.pending_requests ?? 0)

    const totalSuppliers = Number(supplierStats?.summary?.total_suppliers ?? 0)
    const activeSuppliers = Number(supplierStats?.summary?.active_suppliers ?? 0)
    const suppliersWithProducts = Number(supplierStats?.summary?.suppliers_with_products ?? 0)
    const suppliersWithSales = Number(supplierStats?.summary?.suppliers_with_sales ?? 0)
    const newSuppliers = Number(supplierStats?.summary?.new_suppliers_this_month ?? 0)
    const supplierPaidOrders = Number(supplierStats?.summary?.supplier_paid_orders ?? 0)
    const supplierSalesAmount = Number(supplierStats?.summary?.supplier_sales_amount ?? 0)

    const supplierPerformancePct = totalSuppliers > 0
      ? Math.round((suppliersWithSales / totalSuppliers) * 100)
      : 0

    const eWalletFloat = paymentMethods
      .filter((item) => ['gcash', 'maya', 'paymaya', 'e-wallet', 'ewallet'].includes(String(item.key ?? '').toLowerCase()))
      .reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
    const eWalletMethods = paymentMethods.filter((item) =>
      ['gcash', 'maya', 'paymaya', 'e-wallet', 'ewallet'].includes(String(item.key ?? '').toLowerCase()) && Number(item.amount ?? 0) > 0,
    )
    const eWalletMethodCount = eWalletMethods.length
    const eWalletMethodLabels = eWalletMethods
      .map((item) => String(item.label ?? item.key ?? '').trim())
      .filter(Boolean)

    const gcFloat = paymentMethods
      .filter((item) => ['gift_certificate', 'gift-certificate', 'gc'].includes(String(item.key ?? '').toLowerCase()))
      .reduce((sum, item) => sum + Number(item.amount ?? 0), 0)

    const liveStatMap: Record<string, Pick<ResolvedStatCard, 'value' | 'change' | 'changeType' | 'modalSummary'>> = {
      'Total Orders': {
        value: formatCount(totalOrders),
        change: totalOrders > 0 ? `${pluralize(totalOrders, 'order')} found in the database` : 'No orders found in the database yet',
        changeType: totalOrders > 0 ? 'up' : 'neutral',
      },
      'Total Rewards Computed': {
        value: '--',
        change: 'Live rewards summary is not connected to the dashboard yet',
        changeType: 'neutral',
      },
      'Withdrawals Released': {
        value: formatMoney(releasedAmount),
        change: releasedRequests > 0 ? `${pluralize(releasedRequests, 'released request')} from the database` : 'No released withdrawal requests yet',
        changeType: releasedRequests > 0 ? 'up' : 'neutral',
      },
      'Withdrawals Pending': {
        value: formatCount(pendingRequests),
        change: pendingRequests > 0 ? `${pluralize(pendingRequests, 'pending request')} awaiting release` : 'No pending withdrawal requests',
        changeType: pendingRequests > 0 ? 'down' : 'neutral',
      },
      'Total Expenses': {
        value: formatMoney(currentExpenseTotal),
        change: formatDelta(expensePct),
        changeType: expenseChangeType,
      },
      'Total Members': {
        value: formatCount(totalMembers),
        change: newMembers > 0 ? `${pluralize(newMembers, 'new member')} from live member stats` : 'No new members reported in the live stats',
        changeType: newMembers > 0 ? 'up' : 'neutral',
      },
      'Total Suppliers': {
        value: formatCount(totalSuppliers),
        change: totalSuppliers > 0
          ? `${pluralize(activeSuppliers, 'active supplier')} and ${pluralize(suppliersWithProducts, 'supplier')} with products`
          : 'No suppliers found in the database yet',
        changeType: totalSuppliers > 0 ? 'up' : 'neutral',
      },
      'Suppliers Performance': {
        value: totalSuppliers > 0 ? `${supplierPerformancePct}%` : '0%',
        change: suppliersWithSales > 0
          ? `${pluralize(suppliersWithSales, 'supplier')} recorded paid orders`
          : 'No suppliers with paid orders yet',
        changeType: suppliersWithSales > 0 ? 'up' : 'neutral',
      },
      'New Suppliers': {
        value: formatCount(newSuppliers),
        change: newSuppliers > 0
          ? `${pluralize(newSuppliers, 'supplier')} joined this month`
          : 'No new suppliers recorded this month',
        changeType: newSuppliers > 0 ? 'up' : 'neutral',
      },
      'Supplier Payouts': {
        value: formatMoney(supplierSalesAmount),
        change: supplierPaidOrders > 0
          ? `${pluralize(supplierPaidOrders, 'paid supplier order')} recorded`
          : 'No paid supplier orders recorded yet',
        changeType: supplierSalesAmount > 0 ? 'up' : 'neutral',
      },
      'Total E-Wallet Float': {
        value: formatMoney(eWalletFloat),
        change: eWalletFloat > 0
          ? 'Collected from live e-wallet payment methods'
          : 'No e-wallet collections returned by the live overview',
        changeType: eWalletFloat > 0 ? 'up' : 'neutral',
        modalSummary: eWalletFloat > 0
          ? `${pluralize(eWalletMethodCount, 'e-wallet method')} currently contribute to this float. Active sources: ${eWalletMethodLabels.join(', ')}.`
          : 'No successful e-wallet collections were returned by the live payments overview.',
      },
      'Total GC Float': {
        value: formatMoney(gcFloat),
        change: gcFloat > 0
          ? 'Collected from live GC payment methods'
          : 'No GC collections returned by the live overview',
        changeType: gcFloat > 0 ? 'up' : 'neutral',
      },
      "Today's Revenue": {
        value: formatMoney(todayPaidAmount),
        change: todayPaidCount > 0 ? `${pluralize(todayPaidCount, 'paid order')} recorded today` : 'No paid orders recorded today',
        changeType: todayPaidAmount > 0 ? 'up' : 'neutral',
      },
      'Monthly Revenue': {
        value: formatMoney(grossCollectedAmount),
        change: successfulPayments > 0
          ? `${pluralize(successfulPayments, 'successful payment')} recorded so far`
          : pendingPayments > 0
            ? `${pluralize(pendingPayments, 'payment')} still pending`
            : 'No payment activity returned by the live overview',
        changeType: successfulPayments > 0 ? 'up' : pendingPayments > 0 ? 'down' : 'neutral',
      },
      'Active Sessions': {
        value: '--',
        change: 'Live session metrics are not connected to the dashboard yet',
        changeType: 'neutral',
      },
      'Growth Rate': {
        value: '--',
        change: 'Live growth-rate metrics are not connected to the dashboard yet',
        changeType: 'neutral',
      },
    }

    return stats.map((stat) => ({
      ...stat,
      value: liveStatMap[stat.label]?.value ?? '--',
      change: liveStatMap[stat.label]?.change ?? 'Live data is not connected yet',
      changeType: liveStatMap[stat.label]?.changeType ?? 'neutral',
      modalSummary: liveStatMap[stat.label]?.modalSummary ?? liveStatMap[stat.label]?.change ?? 'Live data is not connected yet',
      href: statHrefMap[stat.label],
    }))
  }, [currentExpenses?.total_amount, lastExpenses?.total_amount, membersStats?.newMembers, membersStats?.total, ordersData?.meta?.total, paymentsOverview, supplierStats])

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {resolvedStats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.3 }}
          className="h-full"
        >
          {stat.href ? (
            <button
              type="button"
              onClick={() => setSelectedStat(stat)}
              className={`group flex h-full w-full rounded-2xl border ${stat.border} ${stat.borderDark} bg-white p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-800`}
            >
              <div className="w-full">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <p className="text-[11px] font-medium leading-tight text-gray-400 dark:text-gray-500">{stat.label}</p>
                  <div className={`${stat.iconBg} ${stat.iconText} ${stat.iconBgDark} ${stat.iconTextDark} flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105`}>
                    {stat.icon}
                  </div>
                </div>
                <p className={`mb-2 text-xl font-bold ${stat.valColor} dark:text-gray-100`}>{stat.value}</p>
                <div className="flex items-center gap-1">
                  {stat.changeType === 'up' && (
                    <svg className="h-3 w-3 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  )}
                  {stat.changeType === 'down' && (
                    <svg className="h-3 w-3 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  )}
                  <span className={`text-[11px] font-medium ${stat.changeType === 'up' ? 'text-emerald-600 dark:text-emerald-300' : stat.changeType === 'down' ? 'text-red-500 dark:text-red-300' : 'text-gray-400 dark:text-gray-500'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </button>
          ) : (
            <div className={`group h-full rounded-2xl border ${stat.border} ${stat.borderDark} bg-white p-4 transition-all duration-300 dark:bg-gray-800`}>
              <div className="mb-3 flex items-start justify-between gap-2">
                <p className="text-[11px] font-medium leading-tight text-gray-400 dark:text-gray-500">{stat.label}</p>
                <div className={`${stat.iconBg} ${stat.iconText} ${stat.iconBgDark} ${stat.iconTextDark} flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105`}>
                  {stat.icon}
                </div>
              </div>
              <p className={`mb-2 text-xl font-bold ${stat.valColor} dark:text-gray-100`}>{stat.value}</p>
              <div className="flex items-center gap-1">
                {stat.changeType === 'up' && (
                  <svg className="h-3 w-3 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                )}
                {stat.changeType === 'down' && (
                  <svg className="h-3 w-3 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                )}
                <span className={`text-[11px] font-medium ${stat.changeType === 'up' ? 'text-emerald-600 dark:text-emerald-300' : stat.changeType === 'down' ? 'text-red-500 dark:text-red-300' : 'text-gray-400 dark:text-gray-500'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      ))}

      <AnimatePresence>
        {selectedStat ? (
          <motion.div
            key="stats-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
            onClick={() => setSelectedStat(null)}
          >
            <motion.div
              key="stats-modal-panel"
              initial={{ opacity: 0, y: 26, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-35px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                    Dashboard Metric
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                    {selectedStat.label}
                  </h3>
                  <p className={`mt-3 text-3xl font-bold ${selectedStat.valColor} dark:text-white`}>
                    {selectedStat.value}
                  </p>
                </div>
                <motion.div
                  initial={{ rotate: -8, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.08, duration: 0.25, ease: 'easeOut' }}
                  className={`${selectedStat.iconBg} ${selectedStat.iconText} ${selectedStat.iconBgDark} ${selectedStat.iconTextDark} flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl`}
                >
                  {selectedStat.icon}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.22, ease: 'easeOut' }}
                className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Summary
                </p>
                <div className="mt-3 flex items-start gap-2">
                  {selectedStat.changeType === 'up' && (
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  )}
                  {selectedStat.changeType === 'down' && (
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  )}
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {selectedStat.modalSummary ?? selectedStat.change}
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.22, ease: 'easeOut' }}
                className="mt-6 flex items-center justify-end gap-3"
              >
                <button
                  type="button"
                  onClick={() => setSelectedStat(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                {selectedStat.href ? (
                  <Link
                    href={selectedStat.href}
                    className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                    onClick={() => setSelectedStat(null)}
                  >
                    View details
                  </Link>
                ) : null}
              </motion.div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default StatsGrid
