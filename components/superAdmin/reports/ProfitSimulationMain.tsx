'use client'

import { useMemo, useState } from 'react'
import { useGetProductsQuery } from '@/store/api/productsApi'

type Scenario = 'single' | 'bulk' | 'monthly'

type RateConfig = {
  cashback: number
  unilevel: number
  directEdge: number
  global: number
  productPoints: number
}

const DEFAULT_RATES: RateConfig = {
  cashback: 4,
  unilevel: 6,
  directEdge: 2.9,
  global: 1,
  productPoints: 86.1,
}

const SCENARIO_COPY: Record<Scenario, { label: string; helper: string; quantity: number }> = {
  single: {
    label: 'Single Order',
    helper: 'Best for checking one customer checkout.',
    quantity: 1,
  },
  bulk: {
    label: 'Bulk Orders',
    helper: 'Best for testing repeated sales of the same product.',
    quantity: 10,
  },
  monthly: {
    label: 'Monthly Projection',
    helper: 'Best for estimating month-end payout impact.',
    quantity: 50,
  },
}

const numberFormatter = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat('en-PH', {
  maximumFractionDigits: 2,
})

const money = (value: number) => `PHP ${numberFormatter.format(Number.isFinite(value) ? value : 0)}`
const pv = (value: number) => `${numberFormatter.format(Number.isFinite(value) ? value : 0)} PV`
const percent = (value: number) => `${numberFormatter.format(Number.isFinite(value) ? value : 0)}%`

const toNumber = (value: string | number) => {
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

const getProductImage = (image: string | null, images?: string[] | null) => {
  if (image?.trim()) return image
  return images?.find((item) => item?.trim()) ?? null
}

const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? '')
          return value.includes(',') || value.includes('"') || value.includes('\n')
            ? `"${value.replace(/"/g, '""')}"`
            : value
        })
        .join(','),
    )
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function ProfitSimulationMain() {
  const [scenario, setScenario] = useState<Scenario>('single')
  const [productSearch, setProductSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [productName, setProductName] = useState('Manual Product')
  const [sellingPrice, setSellingPrice] = useState('0')
  const [productCost, setProductCost] = useState('0')
  const [productPv, setProductPv] = useState('0')
  const [quantity, setQuantity] = useState('1')
  const [shippingCost, setShippingCost] = useState('0')
  const [targetMargin, setTargetMargin] = useState('15')
  const [rates, setRates] = useState<RateConfig>(DEFAULT_RATES)
  const hasProductSearch = productSearch.trim().length > 0

  const { data: productsData, isFetching: productsFetching } = useGetProductsQuery(
    {
      page: 1,
      perPage: 8,
      search: productSearch.trim(),
    },
    { skip: !hasProductSearch },
  )

  const computed = useMemo(() => {
    const qty = Math.max(0, toNumber(quantity))
    const price = Math.max(0, toNumber(sellingPrice))
    const cost = Math.max(0, toNumber(productCost))
    const basePv = Math.max(0, toNumber(productPv))
    const shipping = Math.max(0, toNumber(shippingCost))
    const totalPv = basePv * qty
    const grossSales = price * qty
    const totalProductCost = cost * qty

    const cashback = totalPv * (rates.cashback / 100)
    const unilevelPool = totalPv * (rates.unilevel / 100)
    const unilevelPerLevelRate = rates.unilevel / 10
    const unilevelPerLevel = totalPv * (unilevelPerLevelRate / 100)
    const directEdge = totalPv * (rates.directEdge / 100)
    const globalBonus = totalPv * (rates.global / 100)
    const productPoints = totalPv * (rates.productPoints / 100)
    const cashAllocation = cashback + unilevelPool + directEdge + globalBonus
    const totalAllocation = cashAllocation + productPoints
    const estimatedMargin = grossSales - totalProductCost - shipping - cashAllocation
    const marginPercent = grossSales > 0 ? (estimatedMargin / grossSales) * 100 : 0
    const breakEvenCostPerUnit = qty > 0 ? Math.max(0, (grossSales - shipping - cashAllocation) / qty) : 0
    const allocationPercentOfSales = grossSales > 0 ? (cashAllocation / grossSales) * 100 : 0

    return {
      qty,
      price,
      cost,
      basePv,
      shipping,
      totalPv,
      grossSales,
      totalProductCost,
      cashback,
      unilevelPool,
      unilevelPerLevelRate,
      unilevelPerLevel,
      directEdge,
      globalBonus,
      productPoints,
      cashAllocation,
      totalAllocation,
      estimatedMargin,
      marginPercent,
      breakEvenCostPerUnit,
      allocationPercentOfSales,
    }
  }, [productCost, productPv, quantity, rates, sellingPrice, shippingCost])

  const allocationRows = [
    { label: 'Cashback / e-GC', rate: rates.cashback, value: computed.cashback, color: 'bg-emerald-500' },
    { label: 'Unilevel Pool', rate: rates.unilevel, value: computed.unilevelPool, color: 'bg-sky-500' },
    { label: '50K Points Reward', rate: rates.directEdge, value: computed.directEdge, color: 'bg-amber-500' },
    { label: 'Global Purchase Bonus', rate: rates.global, value: computed.globalBonus, color: 'bg-violet-500' },
    { label: 'Product Purchase Points', rate: rates.productPoints, value: computed.productPoints, color: 'bg-slate-700' },
  ]

  const projectionRows = [10, 50, 100].map((orders) => {
    const totalPv = computed.basePv * orders
    const grossSales = computed.price * orders
    const cashAllocation =
      totalPv * ((rates.cashback + rates.unilevel + rates.directEdge + rates.global) / 100)
    const margin = grossSales - computed.cost * orders - computed.shipping - cashAllocation
    return { orders, totalPv, grossSales, cashAllocation, margin }
  })

  const levelRows = Array.from({ length: 10 }, (_, index) => ({
    level: index + 1,
    rate: computed.unilevelPerLevelRate,
    value: computed.unilevelPerLevel,
  }))

  const rateTotal = rates.cashback + rates.unilevel + rates.directEdge + rates.global + rates.productPoints
  const isProfitable = computed.estimatedMargin >= 0
  const targetMarginRate = Math.min(Math.max(toNumber(targetMargin), 0), 95)
  const meetsTargetMargin = computed.marginPercent >= targetMarginRate
  const decisionStatus = !isProfitable ? 'loss' : meetsTargetMargin ? 'healthy' : 'belowTarget'
  const decisionLabel =
    decisionStatus === 'loss' ? 'Loss Risk' : decisionStatus === 'healthy' ? 'Healthy' : 'Below Target'
  const decisionTone =
    decisionStatus === 'loss'
      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
      : decisionStatus === 'healthy'
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
  const targetMarginGap = computed.marginPercent - targetMarginRate
  const suggestedMinSellingPrice =
    computed.qty > 0 && targetMarginRate < 100
      ? Math.max(
          0,
          (computed.totalProductCost + computed.shipping + computed.cashAllocation) /
            (computed.qty * (1 - targetMarginRate / 100)),
        )
      : 0
  const hasHighPayoutRisk = computed.allocationPercentOfSales > 30
  const productOptions = productsData?.products ?? []

  const handleScenarioChange = (nextScenario: Scenario) => {
    setScenario(nextScenario)
    setQuantity(String(SCENARIO_COPY[nextScenario].quantity))
  }

  const handleProductSearchChange = (value: string) => {
    setProductSearch(value)
  }

  const handleSelectProduct = (productId: string) => {
    const selected = productOptions.find((product) => String(product.id) === productId)
    if (!selected) return

    setSelectedProductId(productId)
    setProductSearch('')
    setProductName(selected.name)
    setSellingPrice(String(selected.priceMember || selected.priceSrp || 0))
    setProductCost(String(selected.priceDp || 0))
    setProductPv(String(selected.prodpv || 0))
  }

  const handleUseManualProduct = () => {
    setSelectedProductId(null)
    setProductSearch('')
    setProductName('Manual Product')
  }

  const handleTargetMarginChange = (value: string) => {
    if (value === '') {
      setTargetMargin('')
      return
    }

    setTargetMargin(String(Math.min(Math.max(toNumber(value), 0), 95)))
  }

  const handleRateChange = (key: keyof RateConfig, value: string) => {
    setRates((current) => ({ ...current, [key]: Math.max(0, toNumber(value)) }))
  }

  const exportSimulation = () => {
    downloadCsv('profit-simulation.csv', [
      ['AF Home Profit Simulation'],
      ['Product', productName],
      ['Scenario', SCENARIO_COPY[scenario].label],
      ['Quantity', computed.qty],
      ['Selling Price', computed.price],
      ['Product Cost', computed.cost],
      ['Product PV', computed.basePv],
      ['Shipping Cost / Subsidy', computed.shipping],
      [],
      ['Summary', 'Amount'],
      ['Gross Sales', computed.grossSales],
      ['Total Product Cost', computed.totalProductCost],
      ['Cash Allocation', computed.cashAllocation],
      ['Product Purchase Points', computed.productPoints],
      ['Estimated Company Margin', computed.estimatedMargin],
      ['Margin %', computed.marginPercent],
      ['Target Margin %', targetMarginRate],
      ['Suggested Minimum Selling Price', suggestedMinSellingPrice],
      ['Break-even Cost Per Unit', computed.breakEvenCostPerUnit],
      [],
      ['Allocation', 'Rate', 'Amount'],
      ...allocationRows.map((row) => [row.label, `${row.rate}%`, row.value]),
      [],
      ['Unilevel Level', 'Rate', 'Amount'],
      ...levelRows.map((row) => [`Level ${row.level}`, `${row.rate}%`, row.value]),
    ])
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-xl dark:border-slate-800">
          <div className="relative p-6 sm:p-8">
            <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_top_left,#0ea5e9,transparent_32%),radial-gradient(circle_at_bottom_right,#10b981,transparent_28%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">Finance Reports</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Profit Simulation</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                  Test product PV, payout allocation, and estimated company margin without changing live orders,
                  wallets, or product records.
                </p>
              </div>
              <button
                type="button"
                onClick={exportSimulation}
                className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-300"
              >
                Export CSV
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {(Object.keys(SCENARIO_COPY) as Scenario[]).map((item) => {
            const active = scenario === item
            return (
              <button
                type="button"
                key={item}
                onClick={() => handleScenarioChange(item)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? 'border-cyan-300 bg-cyan-50 shadow-lg shadow-cyan-500/10 dark:border-cyan-700 dark:bg-cyan-950/40'
                    : 'border-slate-200 bg-white hover:border-cyan-200 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <p className="text-sm font-black text-slate-900 dark:text-white">{SCENARIO_COPY[item].label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {SCENARIO_COPY[item].helper}
                </p>
              </button>
            )
          })}
        </section>

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Inputs</p>
              <h2 className="mt-2 text-xl font-black">Simulation Setup</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Select a product or enter values manually. Product cost is editable because true supplier cost may differ.
              </p>
            </div>

            <div className="space-y-4">
              <div className="block">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Search Product</span>
                  <button
                    type="button"
                    onClick={handleUseManualProduct}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Use Manual Input
                  </button>
                </div>
                <input
                  value={productSearch}
                  onChange={(event) => handleProductSearchChange(event.target.value)}
                  placeholder="Search product name or SKU..."
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950"
                />
                {hasProductSearch && (
                  <div className="mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                    {productsFetching && (
                      <div className="bg-slate-50 px-4 py-3 text-xs font-bold text-cyan-600 dark:bg-slate-950">
                        Loading products...
                      </div>
                    )}
                    {!productsFetching && productOptions.length === 0 && (
                      <div className="bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                        No matching products. You can still enter the values manually below.
                      </div>
                    )}
                    {!productsFetching &&
                      productOptions.map((product) => {
                        const productId = String(product.id)
                        const active = selectedProductId === productId
                        const productImage = getProductImage(product.image, product.images)

                        return (
                          <button
                            type="button"
                            key={product.id}
                            onClick={() => handleSelectProduct(productId)}
                            className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition last:border-b-0 dark:border-slate-800 ${
                              active
                                ? 'bg-cyan-50 text-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-100'
                                : 'bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900'
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-xs font-black text-slate-400 dark:bg-slate-800">
                                {productImage ? (
                                  <img src={productImage} alt={product.name} className="h-full w-full object-cover" />
                                ) : (
                                  'AF'
                                )}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-bold">{product.name}</span>
                                <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
                                  {product.sku ? `${product.sku} - ` : ''}
                                  {money(product.priceMember || product.priceSrp || 0)} - {pv(product.prodpv || 0)}
                                </span>
                              </span>
                            </span>
                            {active && (
                              <span className="shrink-0 text-xs font-black text-cyan-700 dark:text-cyan-300">
                                Selected
                              </span>
                            )}
                          </button>
                        )
                      })}
                  </div>
                )}
              </div>

              <label className="block">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Product Name</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      selectedProductId
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {selectedProductId ? 'Product Applied' : 'Manual Product'}
                  </span>
                </div>
                <input
                  value={productName}
                  disabled
                  className="mt-2 w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Selling / Member Price', sellingPrice, setSellingPrice],
                  ['Product Cost / Supplier Cost', productCost, setProductCost],
                  ['Product PV', productPv, setProductPv],
                  ['Quantity / Orders', quantity, setQuantity],
                  ['Shipping Cost / Subsidy', shippingCost, setShippingCost],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label as string}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={value as string}
                      onChange={(event) => (setter as (next: string) => void)(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['Gross Sales', money(computed.grossSales), 'price x quantity'],
                ['Total Cost', money(computed.totalProductCost), 'cost x quantity'],
                ['Cash Allocations', money(computed.cashAllocation), 'cashback + pools'],
                ['Company Margin', money(computed.estimatedMargin), `${percent(computed.marginPercent)} margin`],
              ].map(([label, value, helper], index) => (
                <div
                  key={label}
                  className={`rounded-3xl border p-5 shadow-sm ${
                    index === 3
                      ? isProfitable
                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30'
                        : 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-3 text-2xl font-black tabular-nums">{value}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
                </div>
              ))}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Result</p>
                  <h2 className="mt-2 text-xl font-black">Business Decision</h2>
                </div>
                <span
                  className={`rounded-full px-4 py-2 text-sm font-black ${decisionTone}`}
                >
                  {decisionLabel}
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Target Margin</p>
                  <p className={`mt-2 text-xl font-black ${meetsTargetMargin ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {percent(targetMarginRate)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {targetMarginGap >= 0 ? '+' : ''}
                    {percent(targetMarginGap)} vs target
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Min Price for Target</p>
                  <p className="mt-2 text-xl font-black">{money(suggestedMinSellingPrice)}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">per unit at current cost/PV</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Break-even Cost / Unit</p>
                  <p className="mt-2 text-xl font-black">{money(computed.breakEvenCostPerUnit)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Cash Allocation vs Sales</p>
                  <p className="mt-2 text-xl font-black">{percent(computed.allocationPercentOfSales)}</p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Rate Check</p>
                <p className={`mt-2 text-xl font-black ${Math.abs(rateTotal - 100) < 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {percent(rateTotal)}
                </p>
              </div>

              {(hasHighPayoutRisk || !isProfitable || !meetsTargetMargin || Math.abs(rateTotal - 100) >= 0.01) && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  {!isProfitable && <p className="font-bold">Warning: estimated margin is negative for this setup.</p>}
                  {isProfitable && !meetsTargetMargin && (
                    <p className="font-bold">Margin is profitable but below the target margin.</p>
                  )}
                  {hasHighPayoutRisk && <p className="mt-1">Cash allocation is above 30% of gross sales. Review pricing/cost assumptions.</p>}
                  {Math.abs(rateTotal - 100) >= 0.01 && <p className="mt-1">Allocation rates do not total 100%. Check formula settings.</p>}
                </div>
              )}
            </section>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">PV Allocation</p>
              <h2 className="mt-2 text-xl font-black">Breakdown Output</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Product Purchase Points are shown for PV allocation. Cash profitability deducts cash/liability pools only.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700">
              <span className="font-bold">Total PV:</span> {pv(computed.totalPv)}
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-5">
            {allocationRows.map((row) => {
              const width = computed.totalAllocation > 0 ? Math.min((row.value / computed.totalAllocation) * 100, 100) : 0
              return (
                <div key={row.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      {row.rate}%
                    </span>
                    <span className="text-sm font-black tabular-nums">{row.value === computed.productPoints ? pv(row.value) : money(row.value)}</span>
                  </div>
                  <p className="mt-3 text-sm font-bold">{row.label}</p>
                  <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Unilevel</p>
                <h2 className="mt-2 text-xl font-black">Level 1 to 10 Share</h2>
              </div>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                {rates.unilevel}% / 10 = {computed.unilevelPerLevelRate.toFixed(2)}%
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400 dark:bg-slate-950">
                  <tr>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3">Rate</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {levelRows.map((row) => (
                    <tr key={row.level}>
                      <td className="px-4 py-3 font-bold">Level {row.level}</td>
                      <td className="px-4 py-3">{row.rate.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right font-black">{money(row.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Projection</p>
              <h2 className="mt-2 text-xl font-black">If 10 / 50 / 100 Orders</h2>
            </div>

            <div className="mt-5 space-y-3">
              {projectionRows.map((row) => (
                <div key={row.orders} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black">{row.orders} orders</p>
                    <p className={`text-sm font-black ${row.margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Margin {money(row.margin)}
                    </p>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3 dark:text-slate-400">
                    <span>Sales: {money(row.grossSales)}</span>
                    <span>PV: {compactFormatter.format(row.totalPv)}</span>
                    <span>Payout pools: {money(row.cashAllocation)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Rates</p>
            <h2 className="mt-2 text-xl font-black">Formula Controls</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              These controls affect this simulation only. They do not change live system rates.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Margin %</span>
              <input
                type="number"
                min="0"
                max="95"
                step="0.01"
                value={targetMargin}
                onChange={(event) => handleTargetMarginChange(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            {[
              ['Cashback %', 'cashback'],
              ['Unilevel %', 'unilevel'],
              ['50K Reward %', 'directEdge'],
              ['Global %', 'global'],
              ['Product Points %', 'productPoints'],
            ].map(([label, key]) => (
              <label key={key} className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rates[key as keyof RateConfig]}
                  onChange={(event) => handleRateChange(key as keyof RateConfig, event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
