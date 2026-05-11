'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import {
  useGetAdminGeneralSettingsQuery,
  useUpdateAdminGeneralSettingsMutation,
} from '@/store/api/adminSettingsApi'

type Branch = {
  name: string
  address: string
  google_map_link?: string
  waze_link?: string
}

type SectionId = 'system' | 'branches' | 'assets' | 'localization' | 'checkout'

function clsx(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(' ')
}

export default function AdminGeneralSettingsPageMain() {
  const { data, isFetching } = useGetAdminGeneralSettingsQuery()
  const [saveSettings, { isLoading: isSaving }] = useUpdateAdminGeneralSettingsMutation()
  const hasHydrated = useRef(false)
  const branchesTouched = useRef(false)

  const [activeSection, setActiveSection] = useState<SectionId>('system')

  const normalizeAssetUrl = (value: string | null | undefined) => {
    if (!value) return null
    const cleanedValue = value.trim().replace(/^"+|"+$/g, '').replace(/%22$/i, '')
    if (!cleanedValue) return null

    const fallbackBase =
      process.env.NEXT_PUBLIC_LARAVEL_API_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '')

    // Best-effort allowlisting: only return an absolute URL if it matches the configured API base.
    const baseUrl = (() => {
      try {
        return fallbackBase ? new URL(fallbackBase) : null
      } catch {
        return null
      }
    })()

    try {
      const parsed = new URL(cleanedValue)

      // If it's already relative to the storage path, rewrite to the API base.
      if (baseUrl && parsed.pathname.startsWith('/storage/')) {
        if (parsed.host !== baseUrl.host) {
          parsed.protocol = baseUrl.protocol
          parsed.host = baseUrl.host
          return parsed.toString()
        }
      }

      const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
      if (baseUrl && isLocalhost) {
        parsed.protocol = baseUrl.protocol
        parsed.host = baseUrl.host
        return parsed.toString()
      }

      // If it's a full absolute URL, only accept if it matches the base URL.
      if (baseUrl && parsed.host === baseUrl.host && (parsed.protocol === 'http:' || parsed.protocol === 'https:')) {
        return parsed.toString()
      }

      // Prevent arbitrary external hosts from being used as img src.
      return null
    } catch {
      // Handle storage-relative paths like `/storage/...`
      if (baseUrl && cleanedValue.startsWith('/')) {
        try {
          return new URL(cleanedValue, baseUrl).toString()
        } catch {
          return null
        }
      }
      return null
    }
  }

  const sanitizeExternalHttpUrl = (value: string | null | undefined) => {
    if (!value) return null
    const cleanedValue = value.trim().replace(/^"+|"+$/g, '').replace(/%22$/i, '')
    if (!cleanedValue) return null

    // Prevent `javascript:` / `data:` / other schemes from being used in href.
    try {
      const parsed = new URL(cleanedValue)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
      return parsed.toString()
    } catch {
      return null
    }
  }

  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10MB
  const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])

  const uploadSettingsAsset = async (file: File): Promise<string> => {
    if (!(file instanceof File)) throw new Error('Invalid file.')
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error('File is too large. Max size is 10MB.')
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      throw new Error('Unsupported image type.')
    }

    const payload = new FormData()
    payload.append('file', file)
    payload.append('folder', 'web-content')

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: payload,
    })

    let json: any = null
    try {
      json = await response.json()
    } catch {
      // backend may return non-JSON on failure
    }

    const url = json?.url
    const errorMessage = typeof json?.error === 'string' ? json.error : null

    if (!response.ok || typeof url !== 'string') {
      throw new Error(errorMessage || 'Image upload failed.')
    }

    return url
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

  const sectionTabs = useMemo(
    () =>
      [
        { id: 'system' as const, label: 'System', eyebrow: 'Brand & Contact' },
        { id: 'branches' as const, label: 'Branches', eyebrow: 'Offices & Locations' },
        { id: 'assets' as const, label: 'Assets', eyebrow: 'Logo & QR' },
        { id: 'localization' as const, label: 'Localization', eyebrow: 'Timezone & Language' },
        { id: 'checkout' as const, label: 'Checkout', eyebrow: 'Payment Visibility' },
      ] as const,
    [],
  )

  const inputBaseClass =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 transition dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20'

  const validateBeforeSave = () => {
    const sys = systemName.trim()
    const comp = companyName.trim()
    const email = supportEmail.trim()
    const phone = contactNumber.trim()
    const addr = address.trim()

    if (sys.length < 2 || sys.length > 80) return showErrorToast('System name must be between 2 and 80 characters.'), false
    if (comp.length > 80) return showErrorToast('Company name must be 80 characters or less.'), false

    if (email.length > 0 && email.length > 120) return showErrorToast('Support email must be 120 characters or less.'), false
    if (email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showErrorToast('Please provide a valid support email.'), false

    if (phone.length > 0 && phone.length > 30) return showErrorToast('Contact number must be 30 characters or less.'), false
    if (phone.length > 0 && !/^[0-9+()\-\s]+$/.test(phone)) return showErrorToast('Contact number contains invalid characters.'), false

    if (addr.length > 0 && addr.length > 200) return showErrorToast('Address must be 200 characters or less.'), false

    if (branches.length > 20) return showErrorToast('Too many branches. Max 20.'), false
    for (const b of branches) {
      if (b.name.trim().length < 1) return showErrorToast('Branch name cannot be empty.'), false
      if (b.name.trim().length > 80) return showErrorToast('Branch name must be 80 characters or less.'), false
      if (b.address.trim().length < 1) return showErrorToast('Branch address cannot be empty.'), false
      if (b.address.trim().length > 200) return showErrorToast('Branch address must be 200 characters or less.'), false
      if (b.google_map_link && sanitizeExternalHttpUrl(b.google_map_link) === null) return showErrorToast('Google Map link must be a valid http/https URL.'), false
      if (b.waze_link && sanitizeExternalHttpUrl(b.waze_link) === null) return showErrorToast('Waze link must be a valid http/https URL.'), false
    }

    return true
  }

  const SectionPanel = () => {
    switch (activeSection) {
      case 'system':
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">System Information</p>
                <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Brand & Contact</h2>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase text-amber-700 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                Top priority
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                System Name
                <input value={systemName} onChange={(event) => setSystemName(event.target.value)} className={inputBaseClass} placeholder="Apsara Home" />
              </label>

              <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Company Name
                <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} className={inputBaseClass} placeholder="Company name" />
              </label>

              <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Support Email
                <input type="email" value={supportEmail} onChange={(event) => setSupportEmail(event.target.value)} className={inputBaseClass} placeholder="support@company.com" />
              </label>

              <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Contact Number
                <input value={contactNumber} onChange={(event) => setContactNumber(event.target.value)} className={inputBaseClass} placeholder="+63" />
              </label>

              <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300 md:col-span-2">
                Address
                <input value={address} onChange={(event) => setAddress(event.target.value)} className={inputBaseClass} placeholder="Company address" />
              </label>
            </div>
          </div>
        )

      case 'branches':
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Company Branches</p>
              <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Offices & Locations</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Add office name and address entries.</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-700/50 dark:to-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Manage Branches</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Add, edit, or remove office entries.</p>
                </div>
                <button type="button" onClick={() => setIsBranchesModalOpen(true)} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-cyan-700 shadow-sm ring-1 ring-cyan-100 transition hover:shadow-md dark:bg-slate-700 dark:text-cyan-300 dark:ring-slate-600">
                  Open Branch Manager
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
          </div>
        )

      case 'assets':
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Assets</p>
              <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Logo, Favicon, Website QR</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Upload images used across the admin and storefront.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
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
                    <input type="file" accept="image/*" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} className="sr-only" />
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
                    <input type="file" accept="image/*" onChange={(event) => setFaviconFile(event.target.files?.[0] ?? null)} className="sr-only" />
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
                    <input type="file" accept="image/*" onChange={(event) => setWebsiteQrCodeFile(event.target.files?.[0] ?? null)} className="sr-only" />
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
        )

      case 'localization':
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Localization</p>
              <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">PH-based defaults</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Timezone, currency, date formatting, and language preferences.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Timezone
                <select value={timezone} onChange={(event) => setTimezone(event.target.value)} className={inputBaseClass}>
                  <option value="Asia/Manila">Asia/Manila</option>
                  <option value="Asia/Shanghai">Asia/Shanghai</option>
                  <option value="UTC">UTC</option>
                </select>
              </label>

              <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Currency
                <select value={currency} onChange={(event) => setCurrency(event.target.value)} className={inputBaseClass}>
                  <option value="PHP">PHP (₱)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </label>

              <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Date Format
                <select value={dateFormat} onChange={(event) => setDateFormat(event.target.value)} className={inputBaseClass}>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </label>

              <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Language
                <select value={language} onChange={(event) => setLanguage(event.target.value)} className={inputBaseClass}>
                  <option value="English">English</option>
                  <option value="Filipino">Filipino</option>
                </select>
              </label>
            </div>
          </div>
        )

      case 'checkout':
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Checkout Payments</p>
                <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Test Payment Visibility</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  When enabled, customers on the live website can see the test/live payment mode switch during checkout.
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase ${
                  enableTestPayments
                    ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                }`}
              >
                {enableTestPayments ? 'Test visible on checkout' : 'Live only'}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 dark:border-slate-700 dark:from-slate-700/50 dark:to-slate-800">
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
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <div className="pointer-events-none absolute -right-24 -top-20 h-48 w-48 rounded-full bg-cyan-200/50 blur-3xl dark:bg-cyan-600/20" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-600/20" />
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-cyan-700 dark:text-cyan-300">Settings</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">General Settings</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Configure system identity details, localization defaults, and checkout visibility.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:sticky lg:top-24 self-start">
          <div className="px-2 py-2">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Sections</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Jump to what you need.</p>
          </div>

          <nav className="mt-3 space-y-1" aria-label="Settings sections">
            {sectionTabs.map((tab) => {
              const active = activeSection === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSection(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all',
                    active
                      ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-500/40'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:-translate-y-0.5 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800/70',
                  )}
                >
                  <span
                    className={clsx(
                      'flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition-all',
                      active
                        ? 'bg-white/15 ring-white/25'
                        : 'bg-slate-50 ring-slate-200 dark:bg-slate-900/40 dark:ring-slate-700',
                    )}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d={
                          tab.id === 'system'
                            ? 'M12 6v6l4 2'
                            : tab.id === 'branches'
                              ? 'M3 7h18M3 12h18M3 17h18'
                              : tab.id === 'assets'
                                ? 'M4 7h16M4 12h10M4 17h16'
                                : tab.id === 'localization'
                                  ? 'M12 8v4l3 3'
                                  : 'M12 20s7-4.5 7-10A7 7 0 0 0 5 10c0 5.5 7 10 7 10z'
                        }
                      />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className={clsx('block text-sm font-bold', active ? 'text-white' : 'text-slate-800 dark:text-slate-100')}>{tab.label}</span>
                    <span className={clsx('block truncate text-xs font-semibold', active ? 'text-white/80' : 'text-slate-500 dark:text-slate-400')}>{tab.eyebrow}</span>
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <SectionPanel />

          <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={async () => {
                if (!validateBeforeSave()) return

                const payload = new FormData()
                let nextLogoUrl: string | null = logoUrl
                let nextFaviconUrl: string | null = faviconUrl
                let nextWebsiteQrCodeUrl: string | null = websiteQrCodeUrl

                try {
                  if (logoFile) nextLogoUrl = await uploadSettingsAsset(logoFile)
                  if (faviconFile) nextFaviconUrl = await uploadSettingsAsset(faviconFile)
                  if (websiteQrCodeFile) nextWebsiteQrCodeUrl = await uploadSettingsAsset(websiteQrCodeFile)
                } catch (error) {
                  console.error(error)
                  showErrorToast((error as Error)?.message || 'Failed to upload image. Please try again.')
                  return
                }

                payload.append('system_name', systemName.trim())
                payload.append('company_name', companyName.trim())
                payload.append('support_email', supportEmail.trim())
                payload.append('contact_number', contactNumber.trim())
                payload.append('address', address.trim())
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
        </main>
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
                      setBranches((prev) => prev.map((item, idx) => (idx === editingBranchIndex ? nextBranch : item)))
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
                      {sanitizeExternalHttpUrl(branch.google_map_link)?.trim() ? (
                        <a
                          href={sanitizeExternalHttpUrl(branch.google_map_link) ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block text-xs font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                        >
                          Google Map
                        </a>
                      ) : null}
                      {sanitizeExternalHttpUrl(branch.waze_link)?.trim() ? (
                        <a
                          href={sanitizeExternalHttpUrl(branch.waze_link) ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
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
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700 shadow-sm ring-1 ring-cyan-100 dark:bg-slate-700 dark:text-cyan-300 dark:ring-cyan-600"
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

