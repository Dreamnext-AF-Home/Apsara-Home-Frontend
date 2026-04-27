'use client'

import { useEffect, useRef, useState } from 'react'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import {
  useGetAdminGeneralSettingsQuery,
  useUpdateAdminGeneralSettingsMutation,
} from '@/store/api/adminSettingsApi'

export default function AdminGeneralSettingsPageMain() {
  const { data, isFetching } = useGetAdminGeneralSettingsQuery()
  const [saveSettings, { isLoading: isSaving }] = useUpdateAdminGeneralSettingsMutation()
  const hasHydrated = useRef(false)
  const branchesTouched = useRef(false)

  const normalizeAssetUrl = (value: string | null | undefined) => {
    if (!value) return null
    const cleanedValue = value.trim().replace(/^"+|"+$/g, '').replace(/%22$/i, '')
    if (!cleanedValue) return null

    const fallbackBase =
      process.env.NEXT_PUBLIC_LARAVEL_API_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '')

    try {
      const parsed = new URL(cleanedValue)
      const base = fallbackBase ? new URL(fallbackBase) : null

      // If the backend is hosted on a different domain (e.g. backend.*) but it returns a
      // /storage/* URL pointing at the frontend host, rewrite it to the API host.
      if (base && parsed.pathname.startsWith('/storage/') && parsed.host !== base.host) {
        parsed.protocol = base.protocol
        parsed.host = base.host
        return parsed.toString()
      }

      const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
      if (isLocalhost && base) {
        parsed.protocol = base.protocol
        parsed.host = base.host
        return parsed.toString()
      }

      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && parsed.protocol === 'http:' && base) {
        if (parsed.host === base.host || parsed.host === window.location.host) {
          parsed.protocol = 'https:'
          return parsed.toString()
        }
      }

      return parsed.toString()
    } catch {
      if (fallbackBase && cleanedValue.startsWith('/')) return new URL(cleanedValue, fallbackBase).toString()
      return cleanedValue
    }
  }

  const uploadSettingsAsset = async (file: File): Promise<string> => {
    const payload = new FormData()
    payload.append('file', file)
    payload.append('folder', 'web-content')

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: payload,
    })

    const json = await response.json()
    if (!response.ok || typeof json?.url !== 'string') {
      throw new Error(typeof json?.error === 'string' ? json.error : 'Image upload failed.')
    }

    return json.url
  }

  const [systemName, setSystemName] = useState('Apsara Home')
  const [companyName, setCompanyName] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [address, setAddress] = useState('')
  const [branches, setBranches] = useState<{ name: string; address: string; google_map_link?: string; waze_link?: string }[]>([])
  const [isBranchesModalOpen, setIsBranchesModalOpen] = useState(false)
  const [branchDraftName, setBranchDraftName] = useState('')
  const [branchDraftAddress, setBranchDraftAddress] = useState('')
  const [branchDraftGoogleMapLink, setBranchDraftGoogleMapLink] = useState('')
  const [branchDraftWazeLink, setBranchDraftWazeLink] = useState('')
  const [editingBranchIndex, setEditingBranchIndex] = useState<number | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [websiteQrCodeFile, setWebsiteQrCodeFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [websiteQrCodeUrl, setWebsiteQrCodeUrl] = useState<string | null>(null)

  const [timezone, setTimezone] = useState('Asia/Manila')
  const [currency, setCurrency] = useState('PHP')
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')
  const [language, setLanguage] = useState('English')
  const [enableTestPayments, setEnableTestPayments] = useState(false)

  const resetBranchDraft = () => {
    setBranchDraftName('')
    setBranchDraftAddress('')
    setBranchDraftGoogleMapLink('')
    setBranchDraftWazeLink('')
    setEditingBranchIndex(null)
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!data?.settings || hasHydrated.current) return
    const settings = data.settings
    setSystemName(settings.system_name || 'Apsara Home')
    setCompanyName(settings.company_name || '')
    setSupportEmail(settings.support_email || '')
    setContactNumber(settings.contact_number || '')
    setAddress(settings.address || '')
    try {
      const parsed = settings.branches ? JSON.parse(settings.branches) : []
      if (!Array.isArray(parsed)) {
        if (!branchesTouched.current) setBranches([])
      } else {
        if (!branchesTouched.current) {
          setBranches(
            parsed
              .map((item) => ({
                name: typeof item?.name === 'string' ? item.name : '',
                address: typeof item?.address === 'string' ? item.address : '',
                google_map_link: typeof item?.google_map_link === 'string' ? item.google_map_link : '',
                waze_link: typeof item?.waze_link === 'string' ? item.waze_link : '',
              }))
              .filter((item) => item.name.trim() || item.address.trim()),
          )
        }
      }
    } catch {
      if (!branchesTouched.current) setBranches([])
    }
    setLogoUrl(normalizeAssetUrl(settings.logo_url))
    setFaviconUrl(normalizeAssetUrl(settings.favicon_url))
    setWebsiteQrCodeUrl(normalizeAssetUrl(settings.website_qr_code_url))
    setTimezone(settings.timezone || 'Asia/Manila')
    setCurrency(settings.currency || 'PHP')
    setDateFormat(settings.date_format || 'MM/DD/YYYY')
    setLanguage(settings.language || 'English')
    setEnableTestPayments(Boolean(settings.enable_test_payments))
    hasHydrated.current = true
  }, [data])
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <div className="pointer-events-none absolute -right-24 -top-20 h-48 w-48 rounded-full bg-cyan-200/50 blur-3xl dark:bg-cyan-600/20" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-600/20" />
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-cyan-700 dark:text-cyan-300">Settings</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">General Settings</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Configure system identity details and localization defaults for your admin experience.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">System Information</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Brand & Contact</h2>
          </div>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase text-amber-700 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200">Top priority</span>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            System Name
            <input
              value={systemName}
              onChange={(event) => setSystemName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
              placeholder="Apsara Home"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Company Name
            <input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
              placeholder="Company name"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Support Email
            <input
              type="email"
              value={supportEmail}
              onChange={(event) => setSupportEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
              placeholder="support@company.com"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Contact Number
            <input
              value={contactNumber}
              onChange={(event) => setContactNumber(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
              placeholder="+63"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300 md:col-span-2">
            Address
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
              placeholder="Company address"
            />
          </label>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 md:col-span-2 dark:border-slate-700 dark:from-slate-700/50 dark:to-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Company Branches</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Add office name and address entries.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsBranchesModalOpen(true)}
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-cyan-700 shadow-sm ring-1 ring-cyan-100 transition hover:shadow-md dark:bg-slate-700 dark:text-cyan-300 dark:ring-slate-600"
              >
                Manage Branches
              </button>
            </div>
            {branches.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No branches added yet.</p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {branches.map((branch, index) => (
                  <li key={`${branch.name}-${index}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-700">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{branch.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{branch.address}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-700/50 dark:to-slate-800">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Upload Logo</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-cyan-700 shadow-sm ring-1 ring-cyan-100 transition hover:shadow-md dark:bg-slate-700 dark:text-cyan-300 dark:ring-slate-600">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-300">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 16.5V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v9.5a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5z" />
                  </svg>
                </span>
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">{logoFile ? logoFile.name : 'No file selected'}</span>
            </div>
            {logoUrl ? (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-400">
                <img src={logoUrl} alt="Current logo" className="h-8 w-8 rounded-md object-contain" />
                <span>Current logo uploaded.</span>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-700/50 dark:to-slate-800">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Upload Favicon</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-cyan-700 shadow-sm ring-1 ring-cyan-100 transition hover:shadow-md dark:bg-slate-700 dark:text-cyan-300 dark:ring-slate-600">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-300">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 16.5V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v9.5a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5z" />
                  </svg>
                </span>
                Upload Favicon
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setFaviconFile(event.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">{faviconFile ? faviconFile.name : 'No file selected'}</span>
            </div>
            {faviconUrl ? (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-400">
                <img src={faviconUrl} alt="Current favicon" className="h-8 w-8 rounded-md object-contain" />
                <span>Current favicon uploaded.</span>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 md:col-span-2 dark:border-slate-700 dark:from-slate-700/50 dark:to-slate-800">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Upload Website QR Code</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Shown on the website for customers to scan.</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-cyan-700 shadow-sm ring-1 ring-cyan-100 transition hover:shadow-md dark:bg-slate-700 dark:text-cyan-300 dark:ring-slate-600">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-300">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 16.5V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v9.5a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5z" />
                  </svg>
                </span>
                Upload QR Code
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setWebsiteQrCodeFile(event.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">{websiteQrCodeFile ? websiteQrCodeFile.name : 'No file selected'}</span>
            </div>
            {websiteQrCodeUrl ? (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-400">
                <img src={websiteQrCodeUrl} alt="Current website QR code" className="h-16 w-16 rounded-md object-contain" />
                <span>Current QR code uploaded.</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Localization</p>
          <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">PH-based defaults</h2>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Timezone
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
            >
              <option value="Asia/Manila">Asia/Manila</option>
              <option value="Asia/Shanghai">Asia/Shanghai</option>
              <option value="UTC">UTC</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Currency
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
            >
              <option value="PHP">PHP (₱)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Date Format
            <select
              value={dateFormat}
              onChange={(event) => setDateFormat(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Language
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
            >
              <option value="English">English</option>
              <option value="Filipino">Filipino</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Checkout Payments</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Test Payment Visibility</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              When enabled, customers on the live website can see the test/live payment mode switch during checkout.
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase ${
            enableTestPayments
              ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
          }`}>
            {enableTestPayments ? 'Test visible on checkout' : 'Live only'}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 dark:border-slate-700 dark:from-slate-700/50 dark:to-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Enable Test Payments on Customer Checkout</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Recommended to keep this off in production unless you intentionally want customers to access PayMongo test mode.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enableTestPayments}
              onClick={() => setEnableTestPayments((prev) => !prev)}
              className={`relative inline-flex h-8 w-15 shrink-0 items-center rounded-full border transition-all ${
                enableTestPayments
                  ? 'border-orange-300 bg-orange-500 dark:border-orange-600 dark:bg-orange-600'
                  : 'border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                  enableTestPayments ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={async () => {
            const payload = new FormData()
            let nextLogoUrl: string | null = logoUrl
            let nextFaviconUrl: string | null = faviconUrl
            let nextWebsiteQrCodeUrl: string | null = websiteQrCodeUrl

            try {
              if (logoFile) {
                nextLogoUrl = await uploadSettingsAsset(logoFile)
              }

              if (faviconFile) {
                nextFaviconUrl = await uploadSettingsAsset(faviconFile)
              }

              if (websiteQrCodeFile) {
                nextWebsiteQrCodeUrl = await uploadSettingsAsset(websiteQrCodeFile)
              }
            } catch (error) {
              console.error(error)
              showErrorToast((error as Error)?.message || 'Failed to upload image. Please try again.')
              return
            }

            payload.append('system_name', systemName)
            payload.append('company_name', companyName)
            payload.append('support_email', supportEmail)
            payload.append('contact_number', contactNumber)
            payload.append('address', address)
            payload.append('branches', JSON.stringify(branches))
            payload.append('timezone', timezone)
            payload.append('currency', currency)
            payload.append('date_format', dateFormat)
            payload.append('language', language)
            payload.append('enable_test_payments', enableTestPayments ? '1' : '0')
            if (nextLogoUrl) payload.append('logo_url', nextLogoUrl)
            if (nextFaviconUrl) payload.append('favicon_url', nextFaviconUrl)
            if (nextWebsiteQrCodeUrl) payload.append('website_qr_code_url', nextWebsiteQrCodeUrl)

            try {
              const response = await saveSettings(payload).unwrap()
              setLogoUrl(normalizeAssetUrl(response.settings.logo_url))
              setFaviconUrl(normalizeAssetUrl(response.settings.favicon_url))
              setWebsiteQrCodeUrl(normalizeAssetUrl(response.settings.website_qr_code_url))
              setLogoFile(null)
              setFaviconFile(null)
              setWebsiteQrCodeFile(null)
              showSuccessToast(response.message || 'Settings saved.')
            } catch (error) {
              console.error(error)
              showErrorToast('Failed to save settings. Please try again.')
            }
          }}
          disabled={isSaving || isFetching}
          className="rounded-full bg-gradient-to-r from-cyan-600 to-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:from-cyan-700 dark:to-sky-600"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {isBranchesModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsBranchesModalOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Branches</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Company Offices</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add office name and address details.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsBranchesModalOpen(false)}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Office Name
                  <input
                    value={branchDraftName}
                    onChange={(event) => setBranchDraftName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
                    placeholder="Main Office"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Office Address
                  <input
                    value={branchDraftAddress}
                    onChange={(event) => setBranchDraftAddress(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
                    placeholder="123 Makati Ave, Metro Manila"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Google Map Link
                  <input
                    value={branchDraftGoogleMapLink}
                    onChange={(event) => setBranchDraftGoogleMapLink(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
                    placeholder="https://maps.app.goo.gl/..."
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Waze Link
                  <input
                    value={branchDraftWazeLink}
                    onChange={(event) => setBranchDraftWazeLink(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
                    placeholder="https://waze.com/ul?..."
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!branchDraftName.trim() || !branchDraftAddress.trim()) {
                      showErrorToast('Please add both office name and address.')
                      return
                    }
                    const nextBranch = {
                      name: branchDraftName.trim(),
                      address: branchDraftAddress.trim(),
                      google_map_link: branchDraftGoogleMapLink.trim(),
                      waze_link: branchDraftWazeLink.trim(),
                    }

                    if (editingBranchIndex !== null) {
                      setBranches((prev) =>
                        prev.map((item, idx) => (idx === editingBranchIndex ? nextBranch : item)),
                      )
                    } else {
                      setBranches((prev) => [...prev, nextBranch])
                    }
                    branchesTouched.current = true
                    resetBranchDraft()
                  }}
                  className="rounded-full bg-gradient-to-r from-cyan-600 to-sky-500 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-md dark:from-cyan-700 dark:to-sky-600"
                >
                  {editingBranchIndex !== null ? 'Update Branch' : 'Add Branch'}
                </button>
                {editingBranchIndex !== null ? (
                  <button
                    type="button"
                    onClick={resetBranchDraft}
                    className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600"
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {branches.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No branches added yet.</p>
              ) : (
                branches.map((branch, index) => (
                  <div
                    key={`${branch.name}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{branch.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{branch.address}</p>
                      {branch.google_map_link?.trim() ? (
                        <a
                          href={branch.google_map_link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block text-xs font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                        >
                          Google Map
                        </a>
                      ) : null}
                      {branch.waze_link?.trim() ? (
                        <a
                          href={branch.waze_link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block text-xs font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                        >
                          Waze
                        </a>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBranchIndex(index)
                        setBranchDraftName(branch.name || '')
                        setBranchDraftAddress(branch.address || '')
                        setBranchDraftGoogleMapLink(branch.google_map_link || '')
                        setBranchDraftWazeLink(branch.waze_link || '')
                      }}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700 shadow-sm ring-1 ring-cyan-100 dark:bg-slate-700 dark:text-cyan-300 dark:ring-slate-600"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        branchesTouched.current = true
                        setBranches((prev) => prev.filter((_, idx) => idx !== index))
                        if (editingBranchIndex === index) {
                          resetBranchDraft()
                        } else if (editingBranchIndex !== null && editingBranchIndex > index) {
                          setEditingBranchIndex(editingBranchIndex - 1)
                        }
                      }}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm ring-1 ring-rose-100"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
