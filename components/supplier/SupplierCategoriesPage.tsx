'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useGetSupplierCategoriesQuery } from '@/store/api/suppliersApi'

export default function SupplierCategoriesPage() {
  const { data: session } = useSession()
  const supplierId = Number(session?.user?.supplierId ?? 0)
  const { data, isLoading, isError } = useGetSupplierCategoriesQuery(supplierId, {
    skip: supplierId <= 0,
  })

  const categories = useMemo(() => data?.categories ?? [], [data?.categories])

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
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">Allowed Categories</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">View your assigned product categories.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          You can only post or update products under the categories assigned to your supplier company by the admin team.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Category Access</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900">Assigned Categories</h2>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {categories.length} category{categories.length === 1 ? '' : 'ies'}
          </span>
        </div>

        {isLoading ? (
          <p className="mt-5 text-sm text-slate-500">Loading category access...</p>
        ) : isError ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load allowed categories.
          </p>
        ) : categories.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No categories assigned yet. Ask the admin team to assign the categories your supplier can use.
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <p className="text-sm font-semibold text-slate-900">{category.name}</p>
                <p className="mt-1 text-xs text-slate-500">/{category.url || 'no-slug'}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
