'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CartProvider } from '@/context/CartContext'
import { WishlistProvider } from '@/context/WishlistContext'
import CartDrawer from '@/components/ui/CartDrawer'
import WishlistDrawer from '@/components/ui/WishlistDrawer'
import { Provider as ReduxProvider } from 'react-redux'
import { SessionProvider, signOut, useSession } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { store } from '@/store/store'
import { Toaster } from 'react-hot-toast'
import { useMeQuery } from '@/store/api/userApi'
import { useEffect, useState } from 'react'
import { useAccountDeletedListener } from '@/hooks/useAccountDeletedListener'
import AdsPopup from '@/components/shop/AdsPopup'
import { useEchoSetup } from '@/hooks/useEchoSetup'

function CustomerSessionGuard() {
  const { data: session, status } = useSession()
  const role = String(session?.user?.role ?? '').toLowerCase()
  const isCustomerSession = status === 'authenticated' && (role === 'customer' || role === '')

  // Poll the member identity in the background so blocked accounts are signed out
  // even when the current page is not using the navbar/profile queries.
  useMeQuery(undefined, {
    skip: !isCustomerSession,
    pollingInterval: 12_000,
    refetchOnFocus: true,
  })

  return null
}

function CustomerBannedOverlay() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const showOverlay = () => setVisible(true)
    window.addEventListener('afhome:customer-blocked', showOverlay)
    return () => window.removeEventListener('afhome:customer-blocked', showOverlay)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-rose-500/20 bg-slate-900 text-center shadow-2xl shadow-black/60"
          >
            <div className="h-1 w-full bg-gradient-to-r from-rose-600 via-rose-400 to-rose-600" />
            <div className="px-8 py-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-400">
                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.24em] text-rose-300">Account Restricted</p>
              <h3 className="mt-3 text-2xl font-bold text-white">Your member account has been banned</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Your current session will be closed for security. Please contact support if you believe this was a mistake.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-400" />
                Redirecting to login...
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function EchoInitializer() {
  useEchoSetup()
  return null
}

function AccountDeletedListener() {
  useAccountDeletedListener()
  return null
}

function CustomerDeletedOverlay() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleDeleted = () => {
      setVisible(true)
      setTimeout(() => {
        signOut({ callbackUrl: '/login' })
      }, 3000)
    }
    window.addEventListener('afhome:customer-deleted', handleDeleted)
    return () => window.removeEventListener('afhome:customer-deleted', handleDeleted)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-900 text-center shadow-2xl shadow-black/60"
          >
            <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
            <div className="px-8 py-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-400">
                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.24em] text-amber-300">Account Removed</p>
              <h3 className="mt-3 text-2xl font-bold text-white">Your account has been deleted</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Your account has been deleted by an administrator. You will be signed out shortly.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-200">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                Redirecting to login...
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <SessionProvider>
        <ReduxProvider store={store}>
          <CartProvider>
          <WishlistProvider>
            <EchoInitializer />
            <CustomerSessionGuard />
            <AccountDeletedListener />
            <CustomerBannedOverlay />
            <CustomerDeletedOverlay />
            {children}
            <AdsPopup />
            <CartDrawer />
            <WishlistDrawer />
            <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                background: '#ffffff',
                color: '#1f2937',
                border: '1px solid #fed7aa',
                boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                fontSize: '14px',
              },
            }}
          />
          </WishlistProvider>
          </CartProvider>
        </ReduxProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
