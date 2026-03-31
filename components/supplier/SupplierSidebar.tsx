'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  Box,
  Building2,
  ClipboardList,
  FileText,
  Package,
  Users,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { clearAccessTokenCache } from '@/store/api/baseApi'

const items = [
  { label: 'Dashboard', href: '/supplier/dashboard', icon: BarChart3 },
  { label: 'Products', href: '/supplier/products', icon: Package },
]

const reportItems = [
  { label: 'Order Report', href: '/supplier/reports/orders', icon: ClipboardList },
  { label: 'Delivered Order Report', href: '/supplier/reports/delivered', icon: FileText },
]

const postReportItems = [
  { label: 'Categories', href: '/supplier/categories', icon: Box },
  { label: 'Users', href: '/supplier/users', icon: Users },
  { label: 'Company', href: '/supplier/company', icon: Building2 },
]

export default function SupplierSidebar({ className = '' }: { className?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [reportsOpen, setReportsOpen] = useState(false)
  const { data: session } = useSession()
  const supplierName = session?.user?.supplierName || session?.user?.name || 'Supplier'
  const reportsActive = pathname?.startsWith('/supplier/reports') ?? false

  return (
    <aside className={`w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col ${className}`}>
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-700">Supplier Portal</p>
        <h2 className="mt-2 text-lg font-bold text-slate-900">{supplierName}</h2>
        <p className="mt-1 text-xs text-slate-400">Workspace</p>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {items.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => {
                router.push(item.href)
              }}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                active ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                  active
                    ? 'border-cyan-200 bg-white text-cyan-700'
                    : 'border-slate-200 bg-white text-slate-500 group-hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => {
            router.push('/supplier/orders')
          }}
          className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
            pathname === '/supplier/orders' ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
              pathname === '/supplier/orders'
                ? 'border-cyan-200 bg-white text-cyan-700'
                : 'border-slate-200 bg-white text-slate-500 group-hover:text-slate-700'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
          </span>
          <span>Orders</span>
        </button>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setReportsOpen((prev) => !prev)}
            className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
              reportsActive ? 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                  reportsActive
                    ? 'border-cyan-200 bg-white text-cyan-700'
                    : 'border-slate-200 bg-white text-slate-500 group-hover:text-slate-700'
                }`}
              >
                <FileText className="h-4 w-4" />
              </span>
              Reports
            </span>
            <span className={`text-xs transition ${reportsOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>
          <AnimatePresence initial={false}>
            {reportsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="mt-1 space-y-0.5 pl-2 overflow-hidden"
              >
                {reportItems.map((item) => {
                  const active = pathname === item.href
                  const Icon = item.icon
                  return (
                    <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      router.push(item.href)
                    }}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold ${
                      active ? 'text-cyan-700' : 'text-slate-600'
                    }`}
                  >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                          active
                            ? 'border-cyan-200 bg-white text-cyan-700'
                            : 'border-slate-200 bg-white text-slate-500'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="whitespace-nowrap">{item.label}</span>
                    </button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {postReportItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => {
                router.push(item.href)
              }}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                active ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                  active
                    ? 'border-cyan-200 bg-white text-cyan-700'
                    : 'border-slate-200 bg-white text-slate-500 group-hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          onClick={async () => {
            clearAccessTokenCache()
            await signOut({ callbackUrl: '/supplier/login' })
          }}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
