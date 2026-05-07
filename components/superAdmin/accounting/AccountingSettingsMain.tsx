'use client'

import { useState } from 'react'

const STRIPE = {
  backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
  backgroundSize: '10px 10px',
}

function SettingField({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-8 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="sm:max-w-xs">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0 sm:w-64">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
        checked ? 'bg-sky-600' : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
      <span className="sr-only">{label}</span>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

export default function AccountingSettingsMain() {
  const [minPayout, setMinPayout] = useState('500')
  const [maxPayout, setMaxPayout] = useState('50000')
  const [requireDualApproval, setRequireDualApproval] = useState(false)
  const [autoHoldLarge, setAutoHoldLarge] = useState(true)
  const [autoHoldThreshold, setAutoHoldThreshold] = useState('25000')
  const [requireInvoice, setRequireInvoice] = useState(true)
  const [notifyOnRelease, setNotifyOnRelease] = useState(true)
  const [notifyOnReject, setNotifyOnReject] = useState(true)
  const [notifyOnHold, setNotifyOnHold] = useState(false)
  const [approvalDeadline, setApprovalDeadline] = useState('48')
  const [releaseDeadline, setReleaseDeadline] = useState('24')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-sky-400 dark:focus:border-sky-500 focus:ring-1 focus:ring-sky-400/30'

  return (
    <div className="space-y-5">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 dark:from-slate-900 dark:to-black shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.1),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.04]" style={STRIPE} />
        <div className="relative px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-md bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Accounting
                </span>
                <span className="rounded-full bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 text-[10px] font-semibold text-amber-300">
                  Admin Only
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Accounting Settings</h1>
              <p className="mt-0.5 text-sm text-slate-400">Configure payout thresholds, approval policies, and workflow preferences</p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                saved
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white text-slate-900 hover:bg-slate-100 shadow-md'
              }`}
            >
              {saved ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Saved!
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2M15 8l-3-3m0 0L9 8m3-3v12" /></svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Payout Thresholds ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/15">
            <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z" />
            </svg>
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Payout Thresholds</h2>
        </div>
        <div className="px-5">
          <SettingField label="Minimum Payout Amount" description="Requests below this amount will be automatically rejected.">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₱</span>
              <input type="number" value={minPayout} onChange={(e) => setMinPayout(e.target.value)} className={`${inputCls} pl-7`} />
            </div>
          </SettingField>
          <SettingField label="Maximum Payout Amount" description="Requests exceeding this amount require additional review before approval.">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₱</span>
              <input type="number" value={maxPayout} onChange={(e) => setMaxPayout(e.target.value)} className={`${inputCls} pl-7`} />
            </div>
          </SettingField>
          <SettingField label="Auto-hold Large Payouts" description="Automatically place on hold any request exceeding the threshold below.">
            <Toggle checked={autoHoldLarge} onChange={setAutoHoldLarge} label="Auto-hold large payouts" />
          </SettingField>
          {autoHoldLarge && (
            <SettingField label="Auto-hold Threshold" description="Requests above this amount are automatically placed on hold.">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₱</span>
                <input type="number" value={autoHoldThreshold} onChange={(e) => setAutoHoldThreshold(e.target.value)} className={`${inputCls} pl-7`} />
              </div>
            </SettingField>
          )}
        </div>
      </div>

      {/* ── Approval Policies ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-500/15">
            <svg className="h-4 w-4 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Approval Policies</h2>
        </div>
        <div className="px-5">
          <SettingField label="Require Dual Approval" description="All requests must be approved by two separate admin accounts before releasing.">
            <Toggle checked={requireDualApproval} onChange={setRequireDualApproval} label="Require dual approval" />
          </SettingField>
          <SettingField label="Require Invoice Number" description="A valid invoice number must be assigned before a payout can be released.">
            <Toggle checked={requireInvoice} onChange={setRequireInvoice} label="Require invoice number" />
          </SettingField>
          <SettingField label="Approval Deadline (hours)" description="SLA target for approving a pending request. Used for queue aging alerts.">
            <input type="number" value={approvalDeadline} onChange={(e) => setApprovalDeadline(e.target.value)} className={inputCls} />
          </SettingField>
          <SettingField label="Release Deadline (hours)" description="SLA target for releasing an approved payout after it enters the release queue.">
            <input type="number" value={releaseDeadline} onChange={(e) => setReleaseDeadline(e.target.value)} className={inputCls} />
          </SettingField>
        </div>
      </div>

      {/* ── Notifications ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
            <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Workflow Notifications</h2>
        </div>
        <div className="px-5">
          <SettingField label="Notify on Payout Release" description="Send email notification to the affiliate when their payout is released.">
            <Toggle checked={notifyOnRelease} onChange={setNotifyOnRelease} label="Notify on release" />
          </SettingField>
          <SettingField label="Notify on Rejection" description="Send email notification when a payout request is rejected.">
            <Toggle checked={notifyOnReject} onChange={setNotifyOnReject} label="Notify on rejection" />
          </SettingField>
          <SettingField label="Notify on Hold" description="Send email notification when a request is placed on hold for review.">
            <Toggle checked={notifyOnHold} onChange={setNotifyOnHold} label="Notify on hold" />
          </SettingField>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div className="overflow-hidden rounded-2xl border border-red-200 dark:border-red-500/30 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-red-100 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15">
            <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wide text-red-600 dark:text-red-400">Danger Zone</h2>
        </div>
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Reset All Settings</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Restore all accounting settings to their factory defaults. This action cannot be undone.</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

    </div>
  )
}
