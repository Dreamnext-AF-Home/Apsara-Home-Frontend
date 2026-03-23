'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMeQuery } from '@/store/api/userApi'

const modalMotion = {
  hidden: { opacity: 0, scale: 0.96, y: 18 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 18 },
}

export default function GlobalVerificationPrompt() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const role = String(session?.user?.role ?? '').toLowerCase()
  const isCustomerSession = status === 'authenticated' && (role === 'customer' || role === '')
  const { data: me } = useMeQuery(undefined, { skip: !isCustomerSession })
  const [dismissedKey, setDismissedKey] = useState<string | null>(null)

  const hasLoadedCustomer = Boolean(me?.id)
  const rawStatus = me?.verification_status ?? 'not_verified'
  const isVerified = rawStatus === 'verified' || me?.account_status === 1
  const shouldPrompt = isCustomerSession && hasLoadedCustomer && !isVerified && rawStatus === 'not_verified'
  const storageKey = me?.id ? `verification-prompt-dismissed:${me.id}:${rawStatus}` : null
  const isHiddenRoute = useMemo(
    () => Boolean(pathname && (
      pathname.startsWith('/admin')
      || pathname.startsWith('/supplier')
      || pathname.startsWith('/login')
      || pathname.startsWith('/verification')
    )),
    [pathname],
  )
  const dismissed = storageKey
    ? (dismissedKey === storageKey || (typeof window !== 'undefined' && sessionStorage.getItem(storageKey) === '1'))
    : false

  useEffect(() => {
    if (status === 'unauthenticated' && typeof window !== 'undefined') {
      sessionStorage.removeItem('afhome-force-verification-prompt')
    }
  }, [status])

  useEffect(() => {
    if (isVerified && typeof window !== 'undefined') {
      sessionStorage.removeItem('afhome-force-verification-prompt')
    }
  }, [isVerified])

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('afhome-force-verification-prompt')
    }
    if (storageKey && typeof window !== 'undefined') {
      sessionStorage.setItem(storageKey, '1')
    }
    setDismissedKey(storageKey)
  }

  const handleVerifyNow = () => {
    handleClose()
    router.push('/profile?tab=encashment&focus=verification#verification-form')
  }

  if (status !== 'authenticated' || !isCustomerSession) {
    return null
  }

  if (!shouldPrompt || dismissed || isHiddenRoute) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        key="global-verification-prompt"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      >
        <motion.div
          variants={modalMotion}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-orange-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]"
        >
          <div className="bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.22),_transparent_52%),linear-gradient(180deg,#fff7ed_0%,#ffffff_100%)] px-6 pb-6 pt-7">
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-orange-200 bg-white/80 text-slate-400 transition hover:text-slate-700"
              aria-label="Close verification reminder"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">Verification Needed</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Please verify your account.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Complete your KYC details to unlock verification-based features and keep your affiliate account ready for payouts and referrals.
            </p>

            <div className="mt-5 rounded-2xl border border-orange-100 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Current status</p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
                <span className="h-2 w-2 rounded-full bg-orange-400" />
                Not verified
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleVerifyNow}
                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
              >
                Verify Now
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
