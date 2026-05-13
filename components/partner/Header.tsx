'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { clearPartnerSession } from '@/libs/adminSession'
import { baseApi, clearAccessTokenCache } from '@/store/api/baseApi'
import { useAppDispatch } from '@/store/hooks'


interface PartnerHeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: PartnerHeaderProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    const loginPath = '/partner/login'

    dispatch(baseApi.util.resetApiState())
    clearAccessTokenCache()
    await clearPartnerSession(loginPath)

    // Prevent NextAuth from doing absolute redirects (which can jump to the live domain).
    await signOut({ redirect: false, callbackUrl: loginPath })

    router.replace(loginPath)
    router.refresh()
  }


  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Open navigation"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Partner Portal</p>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 12H3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </header>
  )
}
