'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { clearAccessTokenCache } from '@/store/api/baseApi'

const items = [
  { label: 'Dashboard', href: '/supplier/dashboard' },
  { label: 'Products', href: '/supplier/products' },
  { label: 'Categories', href: '/supplier/categories' },
  { label: 'Users', href: '/supplier/users' },
  { label: 'Company', href: '/supplier/company' },
]

export default function SupplierSidebar({ className = '' }: { className?: string }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const supplierName = session?.user?.supplierName || session?.user?.name || 'Supplier'

  return (
    <aside className={`w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col ${className}`}>
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Supplier Portal</p>
        <h2 className="mt-2 text-lg font-bold text-slate-900">{supplierName}</h2>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${active ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {item.label}
            </Link>
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
