'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Product, useGetProductsQuery } from '@/store/api/productsApi'
import { useGetSupplierCategoriesQuery, useGetSupplierUsersQuery, useGetSuppliersQuery } from '@/store/api/suppliersApi'

export default function SupplierDashboardHome() {
  const { data: session, status } = useSession()
  const supplierId = Number(session?.user?.supplierId ?? 0)
  const supplierName = session?.user?.supplierName || session?.user?.name || 'Supplier'
  const isMainSupplier = Boolean(session?.user?.isMainSupplier)
  const skip = status !== 'authenticated' || supplierId <= 0

  const { data: productsData } = useGetProductsQuery(
    { supplierId, perPage: 5 },
    { skip, refetchOnMountOrArgChange: true }
  )
  const { data: activeProductsData } = useGetProductsQuery(
    { supplierId, perPage: 1, status: '1' },
    { skip, refetchOnMountOrArgChange: true }
  )
  const { data: inactiveProductsData } = useGetProductsQuery(
    { supplierId, perPage: 1, status: '0' },
    { skip, refetchOnMountOrArgChange: true }
  )
  const { data: inventoryData } = useGetProductsQuery(
    { supplierId, perPage: 100 },
    { skip, refetchOnMountOrArgChange: true }
  )
  const { data: supplierCategoriesData } = useGetSupplierCategoriesQuery(supplierId, { skip })
  const { data: supplierUsersData } = useGetSupplierUsersQuery(supplierId, { skip })
  const { data: suppliersData } = useGetSuppliersQuery(undefined, { skip: status !== 'authenticated' })

  const supplier = useMemo(
    () => (suppliersData?.suppliers ?? []).find((item) => item.id === supplierId),
    [supplierId, suppliersData?.suppliers]
  )
  const recentProducts = useMemo(() => productsData?.products ?? [], [productsData?.products])
  const lowStockCount = useMemo(
    () => (inventoryData?.products ?? []).filter((product) => Number(product.qty ?? 0) > 0 && Number(product.qty ?? 0) <= 5).length,
    [inventoryData?.products]
  )
  const mainSupplierUser = useMemo(
    () => (supplierUsersData?.users ?? []).find((user) => user.is_main_supplier),
    [supplierUsersData?.users]
  )
  const subSupplierCount = useMemo(
    () => (supplierUsersData?.users ?? []).filter((user) => !user.is_main_supplier).length,
    [supplierUsersData?.users]
  )

  const cards = [
    {
      title: 'Total Products',
      value: String(productsData?.meta?.total ?? 0),
      description: 'Current catalog items under your supplier account.',
      href: '/supplier/products',
    },
    {
      title: 'Active Products',
      value: String(activeProductsData?.meta?.total ?? 0),
      description: 'Products currently active in your supplier catalog.',
      href: '/supplier/products',
    },
    {
      title: 'Inactive Products',
      value: String(inactiveProductsData?.meta?.total ?? 0),
      description: 'Products that still need attention before going live.',
      href: '/supplier/products',
    },
    {
      title: 'Low Stock',
      value: String(lowStockCount),
      description: 'Products with quantity from 1 to 5 in the current supplier catalog.',
      href: '/supplier/products',
    },
    {
      title: 'Allowed Categories',
      value: String(supplierCategoriesData?.categories?.length ?? 0),
      description: 'Categories you are allowed to use for product posting.',
      href: '/supplier/categories',
    },
    {
      title: 'Supplier Users',
      value: String(supplierUsersData?.users?.length ?? 0),
      description: 'Separate supplier portal logins currently active for your team.',
      href: '/supplier/users',
    },
  ]

  const quickActions = [
    { label: 'Add Product', href: '/supplier/products' },
    { label: 'View Categories', href: '/supplier/categories' },
    { label: 'Manage Users', href: '/supplier/users' },
    { label: 'Company Profile', href: '/supplier/company' },
  ]

  const categoryPreview = supplierCategoriesData?.categories.slice(0, 6) ?? []

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-cyan-100 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_36%),linear-gradient(135deg,_#ecfeff,_#ffffff_55%,_#f0fdfa)] p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">Supplier Dashboard</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Welcome back, {supplierName}.
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-700">
                {isMainSupplier ? 'Main Supplier' : 'Sub Supplier'}
              </span>
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                {supplier?.status === 1 ? 'Company Active' : 'Company Inactive'}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use this workspace to manage your company catalog, control supplier team access,
              and review the categories assigned to your products.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="inline-flex items-center rounded-2xl border border-cyan-200 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-50"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{card.title}</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{card.description}</p>
            <span className="mt-4 inline-flex text-sm font-semibold text-cyan-700">Open</span>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Supplier Snapshot</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <SnapshotCard label="Company" value={supplier?.company || supplier?.name || 'Not linked'} />
            <SnapshotCard label="Contact" value={supplier?.contact || 'Not provided'} />
            <SnapshotCard label="Email" value={supplier?.email || 'Not provided'} />
            <SnapshotCard label="Status" value={supplier?.status === 1 ? 'Active' : 'Inactive'} />
            <SnapshotCard label="Main Supplier" value={mainSupplierUser?.fullname || mainSupplierUser?.username || 'Not assigned'} />
            <SnapshotCard label="Sub Suppliers" value={String(subSupplierCount)} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Quick Guidance</h2>
              <p className="mt-1 text-sm text-slate-500">
                Keep your team aligned before posting new items.
              </p>
            </div>
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {isMainSupplier ? 'Owner Access' : 'Staff Access'}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {[
              isMainSupplier
                ? 'Invite separate supplier users instead of sharing one supplier login'
                : 'Only the main supplier can invite new supplier users for this company',
              'Review your allowed categories before posting products',
              'Check low stock items so your catalog stays accurate',
              'Keep company profile and supplier contacts up to date',
            ].map((step, index) => (
              <div key={step} className="flex gap-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm text-slate-600">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Products</h2>
              <p className="mt-1 text-sm text-slate-500">Latest products from your supplier catalog.</p>
            </div>
            <Link href="/supplier/products" className="text-sm font-semibold text-cyan-700 hover:text-cyan-600">
              Manage
            </Link>
          </div>
          {recentProducts.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No products yet. Start by adding your first supplier product.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {recentProducts.map((product) => (
                <RecentProductRow key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Assigned Categories</h2>
              <p className="mt-1 text-sm text-slate-500">Preview of categories you can use for product posting.</p>
            </div>
            <Link href="/supplier/categories" className="text-sm font-semibold text-cyan-700 hover:text-cyan-600">
              View all
            </Link>
          </div>
          {(supplierCategoriesData?.categories?.length ?? 0) === 0 ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No categories assigned yet. Ask the admin team to assign categories to your supplier.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {categoryPreview.map((category) => (
                  <span
                    key={category.id}
                    className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Category Access Rule
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Only assigned categories can be used when adding or editing supplier products.
                  If you need another category, request it from the admin team first.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Inventory Attention</h2>
              <p className="mt-1 text-sm text-slate-500">
                Products that may need an update before customers see issues.
              </p>
            </div>
            <Link href="/supplier/products" className="text-sm font-semibold text-cyan-700 hover:text-cyan-600">
              Review
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InventoryStatusCard
              label="Low Stock"
              value={String(lowStockCount)}
              tone={lowStockCount > 0 ? 'amber' : 'emerald'}
              description={lowStockCount > 0 ? 'Needs restock or quantity review' : 'No low stock alerts right now'}
            />
            <InventoryStatusCard
              label="Inactive Products"
              value={String(inactiveProductsData?.meta?.total ?? 0)}
              tone={(inactiveProductsData?.meta?.total ?? 0) > 0 ? 'slate' : 'emerald'}
              description={
                (inactiveProductsData?.meta?.total ?? 0) > 0
                  ? 'Products not currently live'
                  : 'All tracked products are active'
              }
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Team Access</h2>
              <p className="mt-1 text-sm text-slate-500">
                Quick view of who owns and uses this supplier workspace.
              </p>
            </div>
            <Link href="/supplier/users" className="text-sm font-semibold text-cyan-700 hover:text-cyan-600">
              Open users
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            <TeamAccessRow
              label="Main Supplier"
              value={mainSupplierUser?.fullname || mainSupplierUser?.username || supplierName}
              badge="Owner"
            />
            <TeamAccessRow
              label="Sub Suppliers"
              value={String(subSupplierCount)}
              badge={subSupplierCount > 0 ? 'Active' : 'None'}
            />
            <TeamAccessRow
              label="Your Access"
              value={isMainSupplier ? 'Can manage supplier users' : 'Product and company access only'}
              badge={isMainSupplier ? 'Main' : 'Sub'}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function SnapshotCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  )
}

function InventoryStatusCard({
  label,
  value,
  description,
  tone,
}: {
  label: string
  value: string
  description: string
  tone: 'amber' | 'emerald' | 'slate'
}) {
  const toneClasses = {
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    slate: 'border-slate-200 bg-slate-50 text-slate-800',
  }[tone]

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-2 text-sm leading-6 opacity-90">{description}</p>
    </div>
  )
}

function TeamAccessRow({ label, value, badge }: { label: string; value: string; badge: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <p className="mt-2 text-sm font-semibold text-slate-800">{value}</p>
      </div>
      <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
        {badge}
      </span>
    </div>
  )
}

function RecentProductRow({ product }: { product: Product }) {
  const updatedLabel = formatProductDate(product.updatedAt || product.createdAt)

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
          <p className="mt-1 text-xs text-slate-500">SKU: {product.sku || 'No SKU'}</p>
          <p className="mt-1 text-xs text-slate-500">Qty: {Number(product.qty ?? 0)}</p>
          <p className="mt-1 text-xs text-slate-500">Updated: {updatedLabel}</p>
        </div>
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
            Number(product.status) === 1 || Number(product.status) === 2
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-600'
          }`}
        >
          {Number(product.status) === 1 || Number(product.status) === 2 ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  )
}

function formatProductDate(value: string | null) {
  if (!value) {
    return 'Not available'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return 'Not available'
  }

  return parsed.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
