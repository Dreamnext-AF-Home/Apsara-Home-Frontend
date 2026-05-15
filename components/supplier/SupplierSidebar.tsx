'use client'

import type { ElementType, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  Box,
  Building2,
  ChevronDown,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Package,
  Smartphone,
  Users,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { clearAccessTokenCache } from '@/store/api/baseApi'

const mainItems = [
  { label: 'Dashboard', href: '/supplier/dashboard', icon: BarChart3 },
  { label: 'Products', href: '/supplier/products', icon: Package },
  { label: 'Orders', href: '/supplier/orders', icon: ClipboardList },
]

const reportItems = [
  { label: 'Order Report', href: '/supplier/reports/orders', icon: ClipboardList },
  { label: 'Delivered Orders', href: '/supplier/reports/delivered', icon: FileText },
]

const mobileAdsItems = [
  { label: 'Home', href: '/supplier/mobile-ads', icon: Home },
  { label: 'Products', href: '/supplier/mobile-ads/products', icon: Package },
  { label: 'Categories', href: '/supplier/mobile-ads/categories', icon: Box },
]

const settingsItems = [
  { label: 'Categories', href: '/supplier/categories', icon: Box },
  { label: 'Users', href: '/supplier/users', icon: Users },
  { label: 'Company', href: '/supplier/company', icon: Building2 },
]

function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'SP'
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.26em] text-slate-400/80 dark:text-slate-500">{children}</p>
}

function SidebarNavButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: ElementType
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
        active
          ? 'bg-[linear-gradient(135deg,rgba(6,182,212,0.18),rgba(37,99,235,0.12))] text-cyan-700 shadow-sm shadow-cyan-500/10 dark:bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(99,102,241,0.16))] dark:text-cyan-200'
          : 'text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.04] dark:hover:text-white'
      }`}
    >
      {active ? (
        <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-cyan-500 dark:bg-cyan-300" />
      ) : null}
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition ${
          active
            ? 'border-cyan-200 bg-white text-cyan-700 dark:border-cyan-400/20 dark:bg-white/10 dark:text-cyan-200'
            : 'border-slate-200 bg-white text-slate-500 group-hover:border-cyan-200 group-hover:text-cyan-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400 dark:group-hover:border-cyan-400/20 dark:group-hover:text-cyan-200'
        }`}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="flex-1 text-left">{label}</span>
    </button>
  )
}

export default function SupplierSidebar({
  className = '',
  onClose,
}: {
  className?: string
  onClose?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [reportsOpen, setReportsOpen] = useState(pathname?.startsWith('/supplier/reports') ?? false)
  const [mobileAdsOpen, setMobileAdsOpen] = useState(pathname?.startsWith('/supplier/mobile-ads') ?? false)
  const { data: session } = useSession()
  const supplierName = session?.user?.supplierName || session?.user?.name || 'Supplier'
  const isMainSupplier = Boolean(session?.user?.isMainSupplier)
  const userEmail = session?.user?.email || ''
  const reportsActive = pathname?.startsWith('/supplier/reports') ?? false
  const mobileAdsActive = pathname?.startsWith('/supplier/mobile-ads') ?? false

  const navigate = (href: string) => {
    router.push(href)
    onClose?.()
  }

  return (
    <aside className={`flex w-72 shrink-0 flex-col border-r border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,249,255,0.94))] backdrop-blur-2xl dark:border-white/8 dark:bg-[linear-gradient(180deg,rgba(6,13,24,0.96),rgba(9,17,32,0.98))] ${className}`}>
      <div className="px-5 pb-4 pt-5">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/85 p-4 shadow-lg shadow-slate-200/40 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#2563eb)] text-sm font-bold text-white shadow-lg shadow-cyan-500/25">
              {getInitials(supplierName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Supplier Portal</p>
              <h2 className="mt-1 truncate text-lg font-bold text-slate-900 dark:text-white">{supplierName}</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{userEmail || 'Workspace access active'}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.03]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Access</p>
              <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isMainSupplier ? 'Main Supplier Owner' : 'Sub Supplier Staff'}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-3">
        <div>
          <SectionLabel>Main</SectionLabel>
          <div className="space-y-1.5">
            {mainItems.map((item) => (
              <SidebarNavButton
                key={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname === item.href}
                onClick={() => navigate(item.href)}
              />
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Analytics</SectionLabel>
          <button
            type="button"
            onClick={() => setReportsOpen((prev) => !prev)}
            className={`group flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${
              reportsActive
                ? 'bg-[linear-gradient(135deg,rgba(6,182,212,0.18),rgba(37,99,235,0.12))] text-cyan-700 dark:bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(99,102,241,0.16))] dark:text-cyan-200'
                : 'text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.04] dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                  reportsActive
                    ? 'border-cyan-200 bg-white text-cyan-700 dark:border-cyan-400/20 dark:bg-white/10 dark:text-cyan-200'
                    : 'border-slate-200 bg-white text-slate-500 group-hover:border-cyan-200 group-hover:text-cyan-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400 dark:group-hover:border-cyan-400/20 dark:group-hover:text-cyan-200'
                }`}
              >
                <FileText className="h-4 w-4" />
              </span>
              Reports
            </span>
            <ChevronDown className={`h-4 w-4 transition ${reportsOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence initial={false}>
            {reportsOpen ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="mt-2 overflow-hidden"
              >
                <div className="space-y-1.5 pl-3">
                  {reportItems.map((item) => {
                    const active = pathname === item.href
                    const Icon = item.icon

                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => navigate(item.href)}
                        className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition ${
                          active
                            ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200'
                            : 'text-slate-500 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-white'
                        }`}
                      >
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border ${
                            active
                              ? 'border-cyan-200 bg-white text-cyan-700 dark:border-cyan-400/20 dark:bg-white/10 dark:text-cyan-200'
                              : 'border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div>
          <SectionLabel>Mobile</SectionLabel>
          <button
            type="button"
            onClick={() => setMobileAdsOpen((prev) => !prev)}
            className={`group flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${
              mobileAdsActive
                ? 'bg-[linear-gradient(135deg,rgba(6,182,212,0.18),rgba(37,99,235,0.12))] text-cyan-700 dark:bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(99,102,241,0.16))] dark:text-cyan-200'
                : 'text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.04] dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                  mobileAdsActive
                    ? 'border-cyan-200 bg-white text-cyan-700 dark:border-cyan-400/20 dark:bg-white/10 dark:text-cyan-200'
                    : 'border-slate-200 bg-white text-slate-500 group-hover:border-cyan-200 group-hover:text-cyan-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400 dark:group-hover:border-cyan-400/20 dark:group-hover:text-cyan-200'
                }`}
              >
                <Smartphone className="h-4 w-4" />
              </span>
              Mobile Management
            </span>
            <ChevronDown className={`h-4 w-4 transition ${mobileAdsOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence initial={false}>
            {mobileAdsOpen ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="mt-2 overflow-hidden"
              >
                <div className="space-y-1.5 pl-3">
                  {mobileAdsItems.map((item) => {
                    const active = pathname === item.href
                    const Icon = item.icon

                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => navigate(item.href)}
                        className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition ${
                          active
                            ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200'
                            : 'text-slate-500 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-white'
                        }`}
                      >
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border ${
                            active
                              ? 'border-cyan-200 bg-white text-cyan-700 dark:border-cyan-400/20 dark:bg-white/10 dark:text-cyan-200'
                              : 'border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div>
          <SectionLabel>Settings</SectionLabel>
          <div className="space-y-1.5">
            {settingsItems.map((item) => (
              <SidebarNavButton
                key={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname === item.href}
                onClick={() => navigate(item.href)}
              />
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-slate-200/80 p-4 dark:border-white/8">
        <button
          type="button"
          onClick={async () => {
            clearAccessTokenCache()
            await signOut({ callbackUrl: '/supplier/login' })
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
