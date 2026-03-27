'use client'

import { useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useGetSupplierOrdersQuery } from '@/store/api/supplierOrdersApi'

export default function SupplierOrdersPage() {
  const { data: session } = useSession()
  const supplierName = session?.user?.supplierName || session?.user?.name || 'Supplier'
  const supplierId = Number(session?.user?.supplierId ?? 0)
  const { data, isLoading, isError } = useGetSupplierOrdersQuery(undefined, { skip: supplierId <= 0 })
  const [reportFilter, setReportFilter] = useState<'all' | 'delivered'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const orders = useMemo(() => {
    const list = data?.orders ?? []
    const filteredByReport = reportFilter === 'delivered'
      ? list.filter((order) => {
          const status = String(order.fulfillment_status || '').toLowerCase()
          return status === 'delivered' || status === 'complete' || status === 'completed'
        })
      : list

    if (!dateFrom && !dateTo) {
      return filteredByReport
    }

    return filteredByReport.filter((order) => {
      const dateValue = order.paid_at || order.created_at
      if (!dateValue) {
        return false
      }
      const orderDate = new Date(dateValue)
      if (Number.isNaN(orderDate.getTime())) {
        return false
      }
      if (dateFrom) {
        const fromDate = new Date(`${dateFrom}T00:00:00`)
        if (orderDate < fromDate) {
          return false
        }
      }
      if (dateTo) {
        const toDate = new Date(`${dateTo}T23:59:59`)
        if (orderDate > toDate) {
          return false
        }
      }
      return true
    })
  }, [data?.orders, reportFilter, dateFrom, dateTo])

  const totals = useMemo(() => {
    const totalOrders = orders.length
    const totalAmount = orders.reduce((sum, order) => sum + Number(order.amount || 0), 0)
    const totalDiscount = 0
    const totalNetSales = totalAmount - totalDiscount
    return { totalOrders, totalAmount, totalNetSales }
  }, [orders])

  const handleExport = () => {
    if (orders.length === 0) {
      return
    }
    const header = [
      'Buyer name',
      'Amount',
      'Discount',
      'Total due price',
      'Order no.',
      'Date purchased',
      'Order details',
    ]
    const rows = orders.map((order) => {
      const discount = 0
      const totalDue = Number(order.amount || 0) - discount
      const datePurchased = order.paid_at || order.created_at || ''
      const orderDetails = `${order.payment_status || ''}${order.fulfillment_status ? ` / ${order.fulfillment_status}` : ''}`
      return [
        order.customer_name || '',
        Number(order.amount || 0).toFixed(2),
        discount.toFixed(2),
        totalDue.toFixed(2),
        order.checkout_id || `#${order.id}`,
        datePurchased,
        orderDetails,
      ]
    })
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `supplier-orders-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (supplierId <= 0) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        This supplier account is not linked to a supplier company yet.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-cyan-100 bg-[linear-gradient(135deg,_#ecfeff,_#ffffff_55%,_#f0fdfa)] p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">Supplier Orders</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Orders for {supplierName}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          These orders include products under your company brand.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Orders</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900">Recent Orders</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Date from</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Date to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Report</span>
              <select
                value={reportFilter}
                onChange={(event) => setReportFilter(event.target.value as 'all' | 'delivered')}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
              >
                <option value="all">Order report</option>
                <option value="delivered">Delivered report</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-50"
            >
              Export
            </button>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {orders.length} order{orders.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total Orders</p>
            <p className="mt-2 text-lg font-bold text-slate-800">{totals.totalOrders}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total Amount</p>
            <p className="mt-2 text-lg font-bold text-slate-800">PHP {totals.totalAmount.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total Net Sales</p>
            <p className="mt-2 text-lg font-bold text-slate-800">PHP {totals.totalNetSales.toLocaleString()}</p>
          </div>
        </div>

        {isLoading ? (
          <p className="mt-5 text-sm text-slate-500">Loading orders...</p>
        ) : isError ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load supplier orders.
          </p>
        ) : orders.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No orders yet under this supplier brand.
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Buyer name</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Total due price</th>
                  <th className="px-4 py-3">Order no.</th>
                  <th className="px-4 py-3">Date purchased</th>
                  <th className="px-4 py-3">Order details</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {order.customer_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      PHP {Number(order.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-700">PHP 0</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      PHP {Number(order.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {order.checkout_id || `#${order.id}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {order.paid_at
                        ? new Date(order.paid_at).toLocaleDateString()
                        : (order.created_at ? new Date(order.created_at).toLocaleDateString() : '-')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Payment:</span> {order.payment_status || '-'}
                      </div>
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Fulfillment:</span> {order.fulfillment_status || 'pending'}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        {order.product_image ? (
                          <img
                            src={order.product_image}
                            alt={order.product_name}
                            className="h-9 w-9 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-slate-100" />
                        )}
                        <span className="text-xs font-semibold text-slate-700">{order.product_name}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}


