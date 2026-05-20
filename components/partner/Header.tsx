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
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false)

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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsTutorialModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Watch Tutorial
          </button>
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
      </div>

      {isTutorialModalOpen ? (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4">
          <button
            type="button"
            aria-label="Close tutorial"
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={() => setIsTutorialModalOpen(false)}
          />
          <div className="relative z-[81] my-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setIsTutorialModalOpen(false)}
              aria-label="Close tutorial"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              ×
            </button>
            <div className="mb-3 flex items-center justify-between pr-10">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Storefront Studio Tutorial</h3>
            </div>
            <div className="mx-auto flex h-[78vh] w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-black dark:border-slate-700">
              <video
                className="h-full w-full object-contain"
                src="/loginpageVideo/ttrl.mp4"
                controls
                autoPlay
                playsInline
              />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
