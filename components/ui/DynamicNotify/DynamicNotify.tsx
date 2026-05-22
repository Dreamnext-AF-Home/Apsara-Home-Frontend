'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'

/* ── Types ─────────────────────────────────────────────────────────
   A standalone, general-purpose toast system inspired by Apple's
   Dynamic Island. Separate from <DynamicIslandToast /> (which is the
   login-only singleton). This one stacks multiple toasts.
─────────────────────────────────────────────────────────────────── */
export type NotifyStatus = 'loading' | 'success' | 'error' | 'info' | 'warning'

export type NotifyOptions = {
  /** Optional secondary line under the title. */
  description?: string
  /** ms before auto-dismiss. 0 / Infinity = sticky. Loading is sticky by default. */
  duration?: number
  /** Custom leading icon — overrides the default status icon. Emoji or JSX both work. */
  icon?: React.ReactNode
  /** Pass an existing id to update a toast in place (used by notify.promise). */
  id?: string
}

type Toast = {
  id: string
  status: NotifyStatus
  message: React.ReactNode
  description?: React.ReactNode
  duration: number
  icon?: React.ReactNode
}

/* ── Singleton dispatch — imperative API ────────────────────────
   Mount <DynamicNotifyToaster /> once (e.g. in app/layout.tsx),
   then call notify.* from anywhere.
─────────────────────────────────────────────────────────────────── */
type Dispatch = {
  add: (t: Toast) => void
  remove: (id: string) => void
}
let _dispatch: Dispatch | null = null

let _count = 0
const nextId = () => `dn-${Date.now()}-${_count++}`

const DEFAULT_DURATION: Record<NotifyStatus, number> = {
  loading: Infinity, // stays until updated/dismissed
  success: 2600,
  error: 4000,
  info: 3200,
  warning: 3600,
}

function push(
  status: NotifyStatus,
  message: React.ReactNode,
  opts: NotifyOptions = {},
): string {
  const id = opts.id ?? nextId()
  _dispatch?.add({
    id,
    status,
    message,
    description: opts.description,
    duration: opts.duration ?? DEFAULT_DURATION[status],
    icon: opts.icon,
  })
  return id
}

export const notify = {
  show:    (message: React.ReactNode, opts?: NotifyOptions) => push('info', message, opts),
  loading: (message: React.ReactNode = 'Loading…',  opts?: NotifyOptions) => push('loading', message, opts),
  success: (message: React.ReactNode = 'Done',      opts?: NotifyOptions) => push('success', message, opts),
  error:   (message: React.ReactNode = 'Something went wrong', opts?: NotifyOptions) => push('error', message, opts),
  info:    (message: React.ReactNode = 'Heads up',  opts?: NotifyOptions) => push('info', message, opts),
  warning: (message: React.ReactNode = 'Careful',   opts?: NotifyOptions) => push('warning', message, opts),
  dismiss: (id: string) => _dispatch?.remove(id),

  /**
   * Drive a toast through a promise's lifecycle.
   *   notify.promise(saveUser(), {
   *     loading: 'Saving…',
   *     success: (user) => `Saved ${user.name}`,
   *     error: (err) => err.message,
   *   })
   */
  promise<T>(
    promise: Promise<T>,
    msgs: {
      loading: React.ReactNode
      success: React.ReactNode | ((value: T) => React.ReactNode)
      error: React.ReactNode | ((err: unknown) => React.ReactNode)
    },
    opts?: Omit<NotifyOptions, 'id'>,
  ): Promise<T> {
    const id = push('loading', msgs.loading, opts)
    promise.then(
      (value) => {
        const m = typeof msgs.success === 'function' ? msgs.success(value) : msgs.success
        push('success', m, { ...opts, id })
      },
      (err) => {
        const m = typeof msgs.error === 'function' ? msgs.error(err) : msgs.error
        push('error', m, { ...opts, id })
      },
    )
    return promise
  },
}

/* ── Icons ─────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <>
      <style>{`@keyframes dn-spin { to { transform: rotate(360deg) } }`}</style>
      <svg
        width="15" height="15" viewBox="0 0 15 15" fill="none"
        style={{ animation: 'dn-spin 0.7s linear infinite', flexShrink: 0 }}
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

function InfoIcon() {
  return (
    <motion.svg width="15" height="15" viewBox="0 0 15 15" fill="none"
      initial={{ scale: 0 }} animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
    >
      <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.5 6.7v3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="7.5" cy="4.5" r="0.95" fill="currentColor" />
    </motion.svg>
  )
}

function WarningIcon() {
  return (
    <motion.svg width="15" height="15" viewBox="0 0 15 15" fill="none"
      initial={{ scale: 0 }} animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
    >
      <path d="M7.5 1.6L14 13H1L7.5 1.6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.5 6.2v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="7.5" cy="11" r="0.95" fill="currentColor" />
    </motion.svg>
  )
}

/* ── Status config ─────────────────────────────────────────────── */
const CONFIG: Record<NotifyStatus, {
  icon: React.ReactNode
  textColor: string
  dotColor: string
  glow: string
}> = {
  loading: { icon: <Spinner />,     textColor: '#ffffff', dotColor: '#a1a1aa', glow: 'rgba(161,161,170,0.16)' },
  success: { icon: <CheckIcon />,   textColor: '#6ee7b7', dotColor: '#34d399', glow: 'rgba(52,211,153,0.22)'  },
  error:   { icon: <XIcon />,       textColor: '#fca5a5', dotColor: '#f87171', glow: 'rgba(248,113,113,0.18)' },
  info:    { icon: <InfoIcon />,    textColor: '#93c5fd', dotColor: '#60a5fa', glow: 'rgba(96,165,250,0.18)'  },
  warning: { icon: <WarningIcon />, textColor: '#fcd34d', dotColor: '#fbbf24', glow: 'rgba(251,191,36,0.18)'  },
}

/* ── Single toast row ──────────────────────────────────────────── */
function ToastPill({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const cfg = CONFIG[toast.status]
  const hasDesc = Boolean(toast.description)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -32, scaleX: 0.5, scaleY: 0.7 }}
      animate={
        toast.status === 'error'
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
      onClick={onClose}
      style={{
        display: 'inline-flex',
        alignItems: hasDesc ? 'flex-start' : 'center',
        gap: 9,
        background: 'rgba(8, 8, 8, 0.9)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: hasDesc ? 22 : 100,
        padding: hasDesc ? '12px 20px 12px 14px' : '10px 20px 10px 13px',
        boxShadow: [
          '0 14px 44px rgba(0,0,0,0.5)',
          '0 2px 8px rgba(0,0,0,0.25)',
          'inset 0 0 0 1px rgba(255,255,255,0.04)',
          `0 0 28px ${cfg.glow}`,
        ].join(', '),
        minWidth: 164,
        maxWidth: 360,
        cursor: 'pointer',
        pointerEvents: 'auto',
        willChange: 'transform',
      }}
    >
      {/* Pulsing dot — the Dynamic Island camera */}
      <motion.div
        layout
        style={{
          width: 10, height: 10, borderRadius: '50%',
          background: cfg.dotColor, flexShrink: 0,
          marginTop: hasDesc ? 4 : 0,
          boxShadow: `0 0 8px ${cfg.dotColor}80`,
        }}
        animate={
          toast.status === 'loading'
            ? { scale: [1, 1.4, 1], opacity: [1, 0.65, 1] }
            : { scale: 1, opacity: 1 }
        }
        transition={
          toast.status === 'loading'
            ? { repeat: Infinity, duration: 1.1, ease: 'easeInOut' }
            : { duration: 0.25 }
        }
      />

      {/* Status icon — remounts on status change for entrance animation */}
      <motion.div
        key={toast.status}
        layout
        style={{
          flexShrink: 0, display: 'flex', alignItems: 'center',
          marginTop: hasDesc ? 1 : 0,
          color: cfg.textColor,
          fontSize: 15, lineHeight: 1,
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 24, delay: 0.05 }}
      >
        {toast.icon ?? cfg.icon}
      </motion.div>

      {/* Text block */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={String(toast.message)}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              letterSpacing: '-0.015em',
              color: cfg.textColor,
              whiteSpace: hasDesc ? 'normal' : 'nowrap',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
            }}
          >
            {toast.message}
          </motion.span>
        </AnimatePresence>

        {hasDesc && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: '-0.01em',
              color: 'rgba(255,255,255,0.55)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
            }}
          >
            {toast.description}
          </span>
        )}
      </div>
    </motion.div>
  )
}

/* ── DynamicNotifyToaster ───────────────────────────────────────
   Mount this ONCE, near the root (app/layout.tsx):
     <DynamicNotifyToaster />

   Then call from anywhere:
     notify.success('Saved!')
     notify.error('Could not save', { description: 'Try again later' })
     notify.info('New update available')
     notify.warning('Low stock')
     const id = notify.loading('Uploading…')
     notify.success('Uploaded', { id })   // updates the same toast
     notify.promise(fetchThing(), { loading: '…', success: 'Done', error: 'Failed' })
─────────────────────────────────────────────────────────────────── */
export function DynamicNotifyToaster({
  position = 'top',
  max = 4,
}: {
  position?: 'top' | 'bottom'
  max?: number
}) {
  const [mounted, setMounted] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const remove = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const tm = timers.current.get(id)
    if (tm) { clearTimeout(tm); timers.current.delete(id) }
  }

  const arm = (t: Toast) => {
    const existing = timers.current.get(t.id)
    if (existing) clearTimeout(existing)
    if (Number.isFinite(t.duration) && t.duration > 0) {
      timers.current.set(t.id, setTimeout(() => remove(t.id), t.duration))
    } else {
      timers.current.delete(t.id)
    }
  }

  useEffect(() => {
    setMounted(true)
    const timersAtMount = timers.current

    _dispatch = {
      add: (t) => {
        setToasts(prev => {
          const idx = prev.findIndex(x => x.id === t.id)
          if (idx !== -1) {
            const copy = [...prev]
            copy[idx] = t
            return copy
          }
          const next = [...prev, t]
          return next.length > max ? next.slice(next.length - max) : next
        })
        arm(t)
      },
      remove,
    }

    return () => {
      _dispatch = null
      timersAtMount.forEach(clearTimeout)
      timersAtMount.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max])

  if (!mounted) return null

  const atTop = position === 'top'

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: atTop ? 18 : undefined,
        bottom: atTop ? undefined : 18,
        left: 0, right: 0,
        display: 'flex',
        flexDirection: atTop ? 'column' : 'column-reverse',
        alignItems: 'center',
        gap: 8,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <ToastPill key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
