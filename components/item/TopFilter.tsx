'use client'

import { useState, useEffect } from 'react'

interface TopFilterProps {
  onSearchChange?: (search: string) => void
  onViewTypeChange?: (viewType: 'grid' | 'list') => void
  onShowNumberChange?: (showNumber: number | 'all') => void
  onSortChange?: (sort: string) => void
  onClearFilters?: () => void
  searchValue?: string
  viewType?: 'grid' | 'list'
  showNumber?: number | 'all'
  sortValue?: string
  className?: string
  hasActiveFilters?: boolean
  showPageSizeControl?: boolean
}

const SHOW_NUMBER_OPTIONS = ['all', 12, 16, 24, 48, 96]
const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' }
]

export default function TopFilter({
  onSearchChange,
  onViewTypeChange,
  onShowNumberChange,
  onSortChange,
  onClearFilters,
  searchValue = '',
  viewType = 'grid',
  showNumber = 12,
  sortValue = 'default',
  className = '',
  hasActiveFilters = false,
  showPageSizeControl = true
}: TopFilterProps) {
  const [search, setSearch] = useState(searchValue)
  const [currentViewType, setCurrentViewType] = useState<'grid' | 'list'>(viewType)
  const [currentShowNumber, setCurrentShowNumber] = useState<number | 'all'>(showNumber)
  const [currentSort, setCurrentSort] = useState(sortValue)
  const [showGridTooltip, setShowGridTooltip] = useState(false)
  const [showListTooltip, setShowListTooltip] = useState(false)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onSearchChange?.(value)
  }

  const handleViewTypeChange = (type: 'grid' | 'list') => {
    setCurrentViewType(type)
    onViewTypeChange?.(type)
  }

  const handleShowNumberChange = (number: number | 'all') => {
    setCurrentShowNumber(number)
    onShowNumberChange?.(number)
  }

  const handleSortChange = (sort: string) => {
    setCurrentSort(sort)
    onSortChange?.(sort)
  }

  // Sync internal state with props when they change
  useEffect(() => {
    setSearch(searchValue)
  }, [searchValue])

  useEffect(() => {
    setCurrentViewType(viewType)
  }, [viewType])

  useEffect(() => {
    setCurrentShowNumber(showNumber)
  }, [showNumber])

  useEffect(() => {
    setCurrentSort(sortValue)
  }, [sortValue])

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 sm:p-4 ${className}`}>
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Search bar */}
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 py-2 sm:py-3 pl-9 sm:pl-12 pr-9 sm:pr-12 text-sm sm:text-base text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-sky-400 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-400/30 transition-all"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end">
          {/* Clear filters button */}
          <button
            onClick={() => onClearFilters?.()}
            className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border transition-colors ${
              hasActiveFilters
                ? 'text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 border-sky-200 dark:border-sky-900/30 bg-sky-50 dark:bg-sky-900/10 hover:bg-sky-100 dark:hover:bg-sky-900/20 cursor-pointer'
                : 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-50'
            }`}
            disabled={!hasActiveFilters}
            title={hasActiveFilters ? 'Clear all filters' : 'No active filters'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Clear
          </button>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden sm:inline text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Sort:</span>
            <select
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 transition-all cursor-pointer hover:border-sky-300"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {showPageSizeControl && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden sm:inline text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Show:</span>
              <select
                value={currentShowNumber}
                onChange={(e) => handleShowNumberChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 transition-all cursor-pointer hover:border-sky-300"
              >
                {SHOW_NUMBER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View toggle */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 sm:p-1">
            <div className="relative">
              <button
                onClick={() => handleViewTypeChange('grid')}
                className={`p-1.5 sm:p-2 rounded-md transition-colors cursor-pointer hover:scale-105 ${
                  currentViewType === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-sky-500 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-sky-500 dark:hover:text-sky-400'
                }`}
                onMouseEnter={() => setShowGridTooltip(true)}
                onMouseLeave={() => setShowGridTooltip(false)}
                title="Grid View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </button>
              {showGridTooltip && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap z-10">
                  Grid View
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => handleViewTypeChange('list')}
                className={`p-1.5 sm:p-2 rounded-md transition-colors cursor-pointer hover:scale-105 ${
                  currentViewType === 'list'
                    ? 'bg-white dark:bg-gray-600 text-sky-500 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-sky-500 dark:hover:text-sky-400'
                }`}
                onMouseEnter={() => setShowListTooltip(true)}
                onMouseLeave={() => setShowListTooltip(false)}
                title="List View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                </svg>
              </button>
              {showListTooltip && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap z-10">
                  List View
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
