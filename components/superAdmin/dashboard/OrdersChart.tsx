'use client'

import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useGetAdminOrdersQuery } from '@/store/api/adminOrdersApi'

const COLORS = {
  Completed: '#14b8a6',
  Pending: '#f59e0b',
  Processing: '#3b82f6',
  Cancelled: '#f97316',
}

const OrdersChart = () => {
  const [mounted, setMounted] = useState(false)
  const { data } = useGetAdminOrdersQuery({ page: 1, perPage: 1, filter: 'all' })

  useEffect(() => {
    setMounted(true)
  }, [])

  const chartData = useMemo(() => {
    const counts = data?.counts
    return [
      { name: 'Completed', value: Number(counts?.completed ?? 0), color: COLORS.Completed },
      { name: 'Pending', value: Number(counts?.pending ?? 0), color: COLORS.Pending },
      { name: 'Processing', value: Number(counts?.processing ?? 0), color: COLORS.Processing },
      { name: 'Cancelled', value: Number(counts?.cancelled ?? 0), color: COLORS.Cancelled },
    ].filter((item) => item.value > 0)
  }, [data?.counts])

  const total = Number(data?.counts?.all ?? 0)

  if (!mounted) return <div className="h-95 animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800" />

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Orders Overview</h3>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Total: {total} orders from the database</p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                {chartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} orders`]}
                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(51,65,85,0.7)', fontSize: '12px', backgroundColor: 'rgba(15,23,42,0.95)', color: '#e2e8f0' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate text-xs text-gray-500 dark:text-gray-400">{item.name}</span>
                <span className="ml-auto text-xs font-semibold text-gray-700 dark:text-gray-200">{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex h-[280px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          No order data is available for the chart yet.
        </div>
      )}
    </div>
  )
}

export default OrdersChart
