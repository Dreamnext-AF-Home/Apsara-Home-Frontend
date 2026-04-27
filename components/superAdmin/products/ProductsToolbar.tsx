'use client'

import { useMemo } from 'react'
import { Button } from '@heroui/react/button'
import { Card } from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { Label } from '@heroui/react/label'
import { ListBox } from '@heroui/react/list-box'
import { ListBoxItem } from '@heroui/react/list-box-item'
import { SearchField } from '@heroui/react/search-field'
import { Select } from '@heroui/react/select'
import { useGetCategoriesQuery } from '@/store/api/categoriesApi'
import { useGetProductBrandsQuery } from '@/store/api/productBrandsApi'

interface ProductsToolbarProps {
  search: string
  onSearch: (v: string) => void
  status: string
  onStatus: (v: string) => void
  catId: number | undefined
  onCatId: (v: number | undefined) => void
  brandType: number | undefined
  onBrandType: (v: number | undefined) => void
  showBrandFilter?: boolean
  resultCount: number
  supplierId?: number
  supplierFilterId?: number
  onSupplierFilterId?: (v: number | undefined) => void
  supplierOptions?: Array<{ id: number; label: string }>
  selectedCount?: number
  onViewSelected?: () => void
  manualCheckoutCount?: number
  onViewManualCheckout?: () => void
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
  { value: 'new', label: 'New' },
]

function ToolbarSelect({
  ariaLabel,
  value,
  options,
  isDisabled,
  onChange,
}: {
  ariaLabel: string
  value: string
  options: Array<{ value: string; label: string }>
  isDisabled?: boolean
  onChange: (value: string) => void
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? 'Select'

  return (
    <Select
      aria-label={ariaLabel}
      selectedKey={value}
      onSelectionChange={(key) => onChange(key == null ? '' : String(key))}
      isDisabled={isDisabled}
      className="w-full"
    >
      <Select.Trigger className="flex min-h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-left text-sm text-slate-700 transition-all duration-200 hover:bg-slate-50 focus:border-sky-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/14 dark:focus:border-sky-400/70 dark:focus:bg-white/14">
        <span className="truncate">{selectedLabel}</span>
        <Select.Indicator className="h-4 w-4 text-slate-400 dark:text-slate-400" />
      </Select.Trigger>
      <Select.Popover className="min-w-[var(--trigger-width)] rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <ListBox className="p-1 text-slate-700 dark:text-slate-100">
          {options.map((option) => (
            <ListBoxItem
              id={option.value}
              key={`${option.value}-${option.label}`}
              className="rounded-xl text-slate-700 transition-colors hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:bg-slate-800 data-[selected=true]:bg-sky-50 data-[selected=true]:text-sky-700 dark:data-[selected=true]:bg-sky-900/30 dark:data-[selected=true]:text-sky-200"
            >
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  )
}

export default function ProductsToolbar({
  search,
  onSearch,
  status,
  onStatus,
  catId,
  onCatId,
  brandType,
  onBrandType,
  showBrandFilter = true,
  resultCount,
  supplierId,
  supplierFilterId,
  onSupplierFilterId,
  supplierOptions = [],
  selectedCount = 0,
  onViewSelected,
  manualCheckoutCount = 0,
  onViewManualCheckout,
}: ProductsToolbarProps) {
  const { data: categoriesData } = useGetCategoriesQuery(
    supplierId && supplierId > 0
      ? { supplier_id: supplierId }
      : undefined,
  )
  const { data: brandsData } = useGetProductBrandsQuery(undefined, { skip: !showBrandFilter })

  const categories = useMemo(() => {
    const seen = new Set<number>()
    return (categoriesData?.categories ?? []).filter((category) => {
      if (seen.has(category.id)) return false
      seen.add(category.id)
      return true
    })
  }, [categoriesData?.categories])

  const brands = useMemo(() => {
    const seen = new Set<number>()
    return (brandsData?.brands ?? []).filter((brand) => {
      if (seen.has(brand.id)) return false
      seen.add(brand.id)
      return true
    })
  }, [brandsData?.brands])

  const uniqueSupplierOptions = useMemo(() => {
    const seen = new Set<number>()
    return supplierOptions.filter((supplier) => {
      if (seen.has(supplier.id)) return false
      seen.add(supplier.id)
      return true
    })
  }, [supplierOptions])

  const hasSupplierScopedCategories = !supplierId || supplierId <= 0 || categories.length > 0
  const hasFilter = search !== '' || status !== '' || catId !== undefined || brandType !== undefined || supplierFilterId !== undefined
  const showSupplierFilter = typeof onSupplierFilterId === 'function' && uniqueSupplierOptions.length > 0

  return (
    <Card className="border border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
      <Card.Content className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab.value}
                size="sm"
                variant={status === tab.value ? 'primary' : 'tertiary'}
                onPress={() => onStatus(tab.value)}
                className={status === tab.value
                  ? 'rounded-xl bg-sky-600 px-4 text-xs font-semibold text-white hover:bg-sky-700'
                  : 'rounded-xl border border-transparent bg-slate-100 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-800 dark:bg-white/12 dark:text-slate-200 dark:hover:bg-white/18 dark:hover:text-white'}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="flex w-full max-w-4xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
            <div className="w-full lg:max-w-xl">
              <SearchField
                aria-label="Search products"
                value={search}
                onChange={onSearch}
                className="w-full"
              >
                <Label className="sr-only">Search products</Label>
                <SearchField.Group className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition-all duration-200 focus-within:border-sky-400 focus-within:bg-white dark:border-white/15 dark:bg-white/10 dark:focus-within:border-sky-400/70 dark:focus-within:bg-white/14">
                  <SearchField.SearchIcon className="h-4 w-4 text-slate-400 dark:text-slate-400" />
                  <SearchField.Input
                    placeholder="Search by name or SKU..."
                    className="flex-1 border-none bg-transparent p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-400"
                  />
                  {search ? <SearchField.ClearButton className="text-slate-400 transition hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200" /> : null}
                </SearchField.Group>
              </SearchField>
            </div>

            {onViewManualCheckout ? (
              <div className="flex items-center gap-2 self-start lg:self-auto">
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={onViewManualCheckout}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/14"
                >
                  View Manual Checkout
                </Button>
                <Chip size="sm" variant="soft" className="h-11 border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                  {manualCheckoutCount} added
                </Chip>
              </div>
            ) : null}

            {selectedCount > 0 && onViewSelected ? (
              <div className="flex items-center gap-2 self-start lg:self-auto">
                <Chip size="sm" variant="soft" className="h-11 border border-sky-200 bg-sky-50 px-3 text-sm font-medium text-sky-700 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-300">
                  {selectedCount} selected
                </Chip>
                <Button
                  size="sm"
                  variant="primary"
                  onPress={onViewSelected}
                  className="min-h-11 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  Add to Manual Checkout
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <div className={`grid gap-3 ${showSupplierFilter ? 'xl:grid-cols-[1.1fr_1fr_1.4fr_auto]' : showBrandFilter ? 'lg:grid-cols-[1.1fr_1fr_auto]' : 'md:grid-cols-[1.1fr_auto]'}`}>
          <ToolbarSelect
            ariaLabel="Filter products by category"
            value={catId === undefined ? '' : String(catId)}
            isDisabled={!hasSupplierScopedCategories}
            onChange={(value) => onCatId(value === '' ? undefined : Number(value))}
            options={[
              { value: '', label: hasSupplierScopedCategories ? 'All Categories' : 'No categories assigned' },
              ...categories.map((category) => ({ value: String(category.id), label: category.name })),
            ]}
          />

          {showBrandFilter ? (
            <ToolbarSelect
              ariaLabel="Filter products by brand"
              value={brandType === undefined ? '' : String(brandType)}
              onChange={(value) => onBrandType(value === '' ? undefined : Number(value))}
              options={[
                { value: '', label: 'All Brands' },
                ...brands.map((brand) => ({ value: String(brand.id), label: brand.name })),
              ]}
            />
          ) : null}

          {showSupplierFilter ? (
            <ToolbarSelect
              ariaLabel="Filter products by supplier"
              value={supplierFilterId === undefined ? '' : String(supplierFilterId)}
              onChange={(value) => onSupplierFilterId(value === '' ? undefined : Number(value))}
              options={[
                { value: '', label: 'All Suppliers' },
                ...uniqueSupplierOptions.map((supplier) => ({ value: String(supplier.id), label: supplier.label })),
              ]}
            />
          ) : null}

          <div className="flex items-center justify-start xl:justify-end">
            <Chip size="sm" variant="soft" className="h-11 border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <span className="font-semibold text-slate-800 dark:text-slate-100">{resultCount.toLocaleString()}</span>&nbsp;results
            </Chip>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{resultCount.toLocaleString()}</span> product{resultCount !== 1 ? 's' : ''}
            {hasFilter ? <span className="ml-1 text-teal-600 dark:text-teal-300">filtered</span> : null}
          </p>
          <p className="text-slate-400 dark:text-slate-500">Products filters now use the same HeroUI search and select pattern as the newer admin sections.</p>
        </div>
      </Card.Content>
    </Card>
  )
}
