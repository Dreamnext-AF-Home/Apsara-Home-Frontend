'use client'

import { useMemo, useState } from 'react'
import { useGetSupplierOrdersQuery } from '@/store/api/supplierOrdersApi'

interface ReportRow {
  id: string
  customer: string
  product: string
  productDetails: string
  quantity: number
  selectedColor: string
  selectedSize: string
  selectedType: string
  amount: number
  date: string
  status: string
  trackingNo: string
  rawDate: string
}

const getStatusLabel = (order: { payment_status?: string | null; fulfillment_status?: string | null }) => {
  const payment = String(order.payment_status ?? '').toLowerCase()
  const fulfillment = String(order.fulfillment_status ?? '').toLowerCase()

  if (['pending', 'unpaid', 'failed'].includes(payment)) return 'To Pay'
  if (['processing', 'packed'].includes(fulfillment)) return 'To Ship'
  if (['shipped', 'out_for_delivery'].includes(fulfillment)) return 'To Receive'
  if (['delivered'].includes(fulfillment)) return 'Delivered'
  if (['cancelled', 'refunded'].includes(fulfillment)) return 'Cancelled'
  if (['returned_refunded', 'return'].includes(fulfillment)) return 'Return'
  return 'Processing'
}

export default function SupplierOrderReportsPage({
  title,
  filter = 'all',
}: {
  title: string
  filter?: string
}) {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const { data, isLoading, isError } = useGetSupplierOrdersQuery({
    filter,
    page: 1,
    perPage: 50,
  })

  const rows = useMemo<ReportRow[]>(() => {
    const orders = data?.orders ?? []
    return orders.map((order) => {
      const dateValue = order.created_at || order.paid_at || ''
      return {
        id: order.checkout_id || `#${order.id}`,
        customer: order.customer_name ?? 'Customer',
        product: order.product_name ?? 'Order Item',
        productDetails: (order.product_description ?? '').toString(),
        quantity: Number(order.quantity ?? 0),
        selectedColor: (order.selected_color ?? '').toString(),
        selectedSize: (order.selected_size ?? '').toString(),
        selectedType: (order.selected_type ?? '').toString(),
        amount: Number(order.amount ?? 0),
        date: dateValue ? new Date(dateValue).toLocaleString() : '—',
        status: getStatusLabel(order),
        trackingNo: order.tracking_no ?? '—',
        rawDate: dateValue,
      }
    })
  }, [data?.orders])

  const filteredRows = useMemo(() => {
    const baseRows = rows.filter((row) => {
      if (filter === 'completed') {
        return row.status.toLowerCase() === 'delivered' || row.status.toLowerCase() === 'completed'
      }
      return true
    })

    if (!dateFrom && !dateTo) return baseRows
    const fromValue = dateFrom ? new Date(dateFrom) : null
    const toValue = dateTo ? new Date(dateTo) : null
    return baseRows.filter((row) => {
      if (!row.rawDate) return false
      const rowDate = new Date(row.rawDate)
      if (fromValue && rowDate < fromValue) return false
      if (toValue) {
        const end = new Date(toValue)
        end.setHours(23, 59, 59, 999)
        if (rowDate > end) return false
      }
      return true
    })
  }, [rows, dateFrom, dateTo, filter])

  const totals = useMemo(() => {
    const totalOrders = filteredRows.length
    const totalAmount = filteredRows.reduce((sum, row) => sum + row.amount, 0)
    const totalNetSales = totalAmount
    return { totalOrders, totalAmount, totalNetSales }
  }, [filteredRows])

  const handleDownload = () => {
    if (isDownloading) return
    setIsDownloading(true)
    window.setTimeout(() => setIsDownloading(false), 900)
    const headers = [
      'Customer Name',
      'Product',
      'Quantity',
      'Color',
      'Size',
      'Type',
      'Amount',
      'Date',
      'Order No.',
      'Tracking No.',
      'Status',
    ]
    const rowsData = filteredRows.map((row) => [
      row.customer,
      row.product,
      row.quantity || 1,
      row.selectedColor,
      row.selectedSize,
      row.selectedType,
      row.amount,
      row.date,
      row.id,
      row.trackingNo,
      row.status,
    ])
    const escapeValue = (value: string | number) => {
      const str = String(value ?? '')
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }
    const csv = [
      headers.map(escapeValue).join(','),
      ...rowsData.map((row) => row.map(escapeValue).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const fromLabel = dateFrom ? dateFrom : 'all'
    const toLabel = dateTo ? dateTo : 'all'
    const filename = `supplier-order-report_${fromLabel}_to_${toLabel}.csv`
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">Generate reports for your supplier orders.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date From</p>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date To</p>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Export</p>
            <button
              type="button"
              className={`mt-2 w-full rounded-xl border border-cyan-200 bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-cyan-200/50 transition ${
                isDownloading ? 'animate-pulse' : 'hover:bg-cyan-700'
              } active:scale-[0.99]`}
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? 'Preparing Download...' : 'Download Report'}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Orders</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{totals.totalOrders}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Amount</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">PHP {totals.totalAmount.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Net Sales</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">PHP {totals.totalNetSales.toLocaleString()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-0 shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Order Report</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3">Customer Name</th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Order No.</th>
                <th className="px-6 py-3">Tracking No.</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                    Loading report...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-rose-600">
                    Failed to load report data.
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                    No orders found for the selected range.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-semibold text-slate-900">{row.customer}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="font-semibold text-slate-700">{row.product}</div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        Qty: {row.quantity || 1}
                        {row.selectedColor ? ` • Color: ${row.selectedColor}` : ''}
                        {row.selectedSize ? ` • Size: ${row.selectedSize}` : ''}
                        {row.selectedType ? ` • Type: ${row.selectedType}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">PHP {row.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-600">{row.date}</td>
                    <td className="px-6 py-4 text-slate-600">{row.id}</td>
                    <td className="px-6 py-4 text-slate-600">{row.trackingNo}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
