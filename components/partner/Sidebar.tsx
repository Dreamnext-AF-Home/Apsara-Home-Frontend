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
  { href: '/partner', label: 'Storefronts' },
  { href: '/partner/webpages/partner-orders', label: 'Orders' },
  { href: '/partner/webpages/partner-users', label: 'Partner Users' },
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
          'fixed left-0 top-0 z-40 h-screen border-r border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-950 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-20' : 'w-72',
        ].join(' ')}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{isCollapsed ? 'AF' : 'AF Partner'}</span>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:inline-flex"
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>

        <nav className="space-y-1 p-3">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={[
                  'block rounded-xl px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                ].join(' ')}
                title={isCollapsed ? link.label : undefined}
              >
                {isCollapsed ? link.label.charAt(0) : link.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
