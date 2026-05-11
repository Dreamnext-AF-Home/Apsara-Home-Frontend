'use client'

import Link from 'next/link'

import { usePathname } from 'next/navigation'

interface PartnerSidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

const links = [
  {
    href: '/partner',
    label: 'Storefronts',
    description: 'Manage storefront content',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M3 10l2-6h14l2 6" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9 14h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/partner/webpages/partner-orders',
    label: 'Orders',
    description: 'Track storefront transactions',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M7 3h10l4 4v14H3V3h4z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 3v5h10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 13h8M8 17h5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/partner/webpages/partner-users',
    label: 'Partner Users',
    description: 'Control portal access',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path
          d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
          strokeLinecap="round"
        />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M22 11h-6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/partner/webpages/partner-members',
    label: 'Members',
    description: 'Member accounts',

    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path
          d="M17 20v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 20v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]


export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: PartnerSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={[
          'fixed left-0 top-0 z-40 h-screen border-r border-slate-200/80 bg-gradient-to-b from-white to-slate-50/90 shadow-xl shadow-slate-900/5 transition-all dark:border-slate-800 dark:from-slate-950 dark:to-slate-950 lg:static lg:translate-x-0 lg:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-24' : 'w-80',
        ].join(' ')}
      >
        <div className="border-b border-slate-200/80 p-4 dark:border-slate-800">
          <div
            className={`rounded-2xl bg-slate-900 text-white transition-all ${
              isCollapsed ? 'px-2 py-3' : 'px-3 py-3.5'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-3'}`}>
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-300 text-slate-900 shadow-sm">
                  <span className="text-sm font-black">AF</span>
                </div>
                {!isCollapsed ? (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                      Partner Portal
                    </p>
                    <p className="text-sm font-semibold text-white">Control Panel</p>
                  </div>
                ) : null}
              </div>

              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="hidden h-8 w-8 items-center justify-center rounded-lg border border-white/20 text-slate-200 transition hover:bg-white/10 lg:inline-flex"
                  aria-label="Collapse sidebar"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : null}
            </div>

            {isCollapsed ? (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="mt-3 hidden h-8 w-full items-center justify-center rounded-lg border border-white/20 text-slate-200 transition hover:bg-white/10 lg:inline-flex"
                aria-label="Expand sidebar"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        <nav className="space-y-2 p-3">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={[
                  'group relative flex items-center rounded-2xl border px-3 py-2.5 text-sm transition-all duration-200',
                  isCollapsed ? 'justify-center' : 'gap-3',
                  isActive
                    ? 'border-sky-200 bg-gradient-to-r from-sky-100 to-cyan-50 text-sky-900 shadow-sm dark:border-sky-800/60 dark:from-sky-900/30 dark:to-cyan-900/20 dark:text-sky-200'
                    : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-white dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900',
                ].join(' ')}
                title={isCollapsed ? link.label : undefined}
              >
                {isActive ? (
                  <span className="absolute left-0 top-2 h-8 w-1 rounded-r-full bg-sky-500 dark:bg-sky-300" />
                ) : null}
                <span
                  className={[
                    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                    isActive
                      ? 'bg-white text-sky-700 shadow-sm dark:bg-slate-900 dark:text-sky-200'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-700',
                  ].join(' ')}
                >
                  {link.icon}
                </span>
                {!isCollapsed ? (
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{link.label}</span>
                    <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {link.description}
                    </span>
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

