'use client'

import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useGetAdminPaymentsOverviewQuery } from '@/store/api/adminPaymentsApi'

const tabs = ["Today's", 'Monthly', 'Yearly']

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value || 0)

const SalesChart = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [mounted, setMounted] = useState(false)
  const { data, isLoading, isFetching, isError } = useGetAdminPaymentsOverviewQuery()

  useEffect(() => {
    setMounted(true)
  }, [])

  const chartConfig = useMemo(() => {
    const trends = data?.sales_trends
    const chartData = [trends?.daily ?? [], trends?.monthly ?? [], trends?.yearly ?? []][activeTab]
    const series = trends?.series ?? []
    return { chartData, series }
  }, [activeTab, data?.sales_trends])

  const totalAmount = useMemo(() => {
    return chartConfig.chartData.reduce((sum, row) => {
      return sum + chartConfig.series.reduce((inner, item) => inner + Number(row[item.key] ?? 0), 0)
    }, 0)
  }, [chartConfig.chartData, chartConfig.series])

  if (!mounted) return <div className="h-85 animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800" />

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Sales Order Report</h3>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            {isLoading ? 'Loading live sales trends...' : `Real payment totals from the database - ${formatMoney(totalAmount)}`}
          </p>
        </div>
        <div className="flex self-start rounded-xl bg-gray-100 p-1 dark:bg-gray-800/80 sm:self-auto">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(index)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                activeTab === index
                  ? 'bg-white text-teal-600 dark:bg-gray-700 dark:text-teal-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <div className="flex h-[210px] items-center justify-center text-sm text-red-500 dark:text-red-300">
          Unable to load the sales order report from the database.
        </div>
      ) : chartConfig.series.length === 0 || chartConfig.chartData.length === 0 ? (
        <div className="flex h-[210px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          No sales trend data is available yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={chartConfig.chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              {chartConfig.series.map((item) => (
                <linearGradient key={item.key} id={`sales-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={item.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={item.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,114,128,0.18)" />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => formatMoney(Number(value))}
            />
            <Tooltip
              formatter={(value, name) => [formatMoney(Number(value ?? 0)), String(name ?? '')]}
              contentStyle={{ borderRadius: '12px', border: '1px solid rgba(51,65,85,0.7)', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.10)', backgroundColor: 'rgba(15,23,42,0.95)', color: '#e2e8f0' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '16px', color: '#6b7280' }} />
            {chartConfig.series.map((item) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={item.color}
                fill={`url(#sales-${item.key})`}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}

      {isFetching && !isLoading && (
        <div className="mt-4 border-t border-gray-200 pt-2 text-right text-[11px] text-gray-400 dark:border-gray-700 dark:text-gray-500">
          Refreshing live sales data...
        </div>
      )}
    </div>
  )
}

export default SalesChart
