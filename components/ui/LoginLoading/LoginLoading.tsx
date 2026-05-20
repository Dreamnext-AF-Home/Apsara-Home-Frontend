'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'

/* ── Types ─────────────────────────────────────────────────────── */
export type IslandStatus = 'loading' | 'success' | 'error'

type IslandState = {
  visible: boolean
  status: IslandStatus
  message: string
}

/* ── Singleton dispatch — imperative API ────────────────────────
   Mount <DynamicIslandToast /> once in your page/layout,
   then call dynamicIsland.* from anywhere.
─────────────────────────────────────────────────────────────────── */
let _dispatch: ((s: IslandState) => void) | null = null

export const dynamicIsland = {
  loading: (message = 'Logging in…')          => _dispatch?.({ visible: true,  status: 'loading', message }),
  success: (message = 'Welcome back!')        => _dispatch?.({ visible: true,  status: 'success', message }),
  error:   (message = 'Something went wrong') => _dispatch?.({ visible: true,  status: 'error',   message }),
  dismiss: ()                                 => _dispatch?.({ visible: false, status: 'loading', message: '' }),
}

/* ── Icons ─────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <>
      <style>{`@keyframes di-spin { to { transform: rotate(360deg) } }`}</style>
      <svg
        width="15" height="15" viewBox="0 0 15 15" fill="none"
        style={{ animation: 'di-spin 0.7s linear infinite', flexShrink: 0 }}
      >
        <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
        <path d="M7.5 2A5.5 5.5 0 0 1 13 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </>
  )
}

function CheckIcon() {
  return (
    <motion.svg width="15" height="15" viewBox="0 0 15 15" fill="none"
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
    >
      <motion.path
        d="M2.5 7.5L6 11L12.5 4"
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.08 }}
      />
    </motion.svg>
  )
}

function XIcon() {
  return (
    <motion.svg width="15" height="15" viewBox="0 0 15 15" fill="none"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
    >
      <path d="M3 3l9 9M12 3l-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </motion.svg>
  )
}

/* ── Status config ─────────────────────────────────────────────── */
const CONFIG: Record<IslandStatus, {
  icon: React.ReactNode
  textColor: string
  dotColor: string
  glow: string
}> = {
  loading: {
    icon:      <Spinner />,
    textColor: '#ffffff',
    dotColor:  '#34d399',
    glow:      'rgba(52, 211, 153, 0.18)',
  },
  success: {
    icon:      <CheckIcon />,
    textColor: '#6ee7b7',
    dotColor:  '#34d399',
    glow:      'rgba(52, 211, 153, 0.22)',
  },
  error: {
    icon:      <XIcon />,
    textColor: '#fca5a5',
    dotColor:  '#f87171',
    glow:      'rgba(248, 113, 113, 0.18)',
  },
}

/* ── DynamicIslandToast ─────────────────────────────────────────
   Mount this once in your login page or layout:
     <DynamicIslandToast />

   Then call anywhere:
     dynamicIsland.loading('Logging in…')
     dynamicIsland.success('Welcome back!')
     dynamicIsland.error('Invalid credentials')
     dynamicIsland.dismiss()
─────────────────────────────────────────────────────────────────── */
export function DynamicIslandToast() {
  const [mounted, setMounted] = useState(false)
  const [state, setState] = useState<IslandState>({
    visible: false,
    status: 'loading',
    message: '',
  })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMounted(true)

    _dispatch = (next) => {
      setState(next)
      if (timer.current) clearTimeout(timer.current)

      if (next.visible && next.status !== 'loading') {
        const delay = next.status === 'success' ? 2400 : 3800
        timer.current = setTimeout(
          () => setState(prev => ({ ...prev, visible: false })),
          delay,
        )
      }
    }

    return () => {
      _dispatch = null
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  if (!mounted) return null

  const cfg = CONFIG[state.status]

  return createPortal(
    <div
      style={{
        position: 'fixed', top: 18, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
        zIndex: 9999, pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="wait">
        {state.visible && (
          <motion.div
            key="di-island"
            layout
            initial={{ opacity: 0, y: -32, scaleX: 0.5, scaleY: 0.7 }}
            animate={
              state.status === 'error'
                ? { opacity: 1, y: 0, scaleX: 1, scaleY: 1, x: [0, -10, 10, -7, 7, -4, 4, 0] }
                : { opacity: 1, y: 0, scaleX: 1, scaleY: 1, x: 0 }
            }
            exit={{ opacity: 0, y: -22, scaleY: 0.55, filter: 'blur(8px)' }}
            transition={{
              type: 'spring',
              stiffness: 360,
              damping: 26,
              mass: 0.85,
              opacity: { duration: 0.15 },
              x: { duration: 0.5, ease: [0.36, 0.07, 0.19, 0.97], delay: 0.05 },
              filter: { duration: 0.2 },
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              background: 'rgba(8, 8, 8, 0.9)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 100,
              padding: '10px 20px 10px 13px',
              boxShadow: [
                '0 14px 44px rgba(0,0,0,0.5)',
                '0 2px 8px rgba(0,0,0,0.25)',
                'inset 0 0 0 1px rgba(255,255,255,0.04)',
                `0 0 28px ${cfg.glow}`,
              ].join(', '),
              minWidth: 164,
              willChange: 'transform',
            }}
          >
            {/* Pulsing dot — like the Dynamic Island camera */}
            <motion.div
              layout
              style={{
                width: 10, height: 10, borderRadius: '50%',
                background: cfg.dotColor, flexShrink: 0,
                boxShadow: `0 0 8px ${cfg.dotColor}80`,
              }}
              animate={
                state.status === 'loading'
                  ? { scale: [1, 1.4, 1], opacity: [1, 0.65, 1] }
                  : { scale: 1, opacity: 1 }
              }
              transition={
                state.status === 'loading'
                  ? { repeat: Infinity, duration: 1.1, ease: 'easeInOut' }
                  : { duration: 0.25 }
              }
            />

            {/* Status icon — remounts on status change for entrance animation */}
            <motion.div
              key={state.status}
              layout
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: cfg.textColor }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24, delay: 0.05 }}
            >
              {cfg.icon}
            </motion.div>

            {/* Message — slides on change */}
            <AnimatePresence mode="wait">
              <motion.span
                key={state.message}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  letterSpacing: '-0.015em',
                  color: cfg.textColor,
                  whiteSpace: 'nowrap',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                }}
              >
                {state.message}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
