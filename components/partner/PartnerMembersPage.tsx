'use client'

import { useMemo, useState } from 'react'
import { useGetPartnerMembersQuery } from '@/store/api/membersApi'
import type { Member } from '@/types/members/types'

type ApiError = {
  status?: number | string
  data?: { message?: string; error?: string }
  error?: string
}

const PER_PAGE = 25

const extractErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') return 'Unknown error.'

  const e = error as ApiError
  const message = e.data?.message || e.data?.error || e.error

  if (message && String(message).trim() !== '') {
    if (e.status !== undefined) return `${e.status}: ${String(message)}`
    return String(message)
  }

  if (e.status !== undefined) return `${e.status}: Request failed.`
  return 'Request failed.'
}

const normalize = (value?: string | null) => String(value ?? '').trim().toLowerCase()

const getInitials = (name?: string | null) => {
  const cleaned = String(name ?? '').trim()
  if (!cleaned) return 'U'

  const parts = cleaned.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  const initials = `${first}${last}`.toUpperCase()
  return initials || 'U'
}

const formatJoinedDate = (member: Member) => {
  const raw = member.joinedAt || member.createdAt || member.created_at || ''
  if (!raw) return 'N/A'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const INITIALS_STYLES = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'bg-orange-100 text-orange-700 border-orange-200',
]

const initialsColorClass = (name?: string | null) => {
  const base = String(name ?? '').trim().toLowerCase()
  if (!base) return INITIALS_STYLES[0]

  let hash = 0
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0
  }
  return INITIALS_STYLES[hash % INITIALS_STYLES.length]
}

const sponsorLabel = (member: Member) => {
  const username = String(member.referredByUsername ?? '').trim()
  const name = String(member.referredByName ?? '').trim()

  if (username && name) return `${name} (@${username})`
  if (username) return `@${username}`
  if (name) return name
  return 'None'
}

const sponsorKey = (member: Member) => {
  const username = normalize(member.referredByUsername)
  if (username) return `u:${username}`

  const name = normalize(member.referredByName)
  if (name) return `n:${name}`

  return 'none'
}

export default function PartnerMembersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sponsorFilter, setSponsorFilter] = useState('all')

  const { data, isLoading, isFetching, error } = useGetPartnerMembersQuery({
    page,
    perPage: PER_PAGE,
    search: search.trim() ? search.trim() : undefined,
  })

  const members = data?.members ?? []
  const meta = data?.meta

  const sponsorOptions = useMemo(() => {
    const map = new Map<string, string>()

    for (const member of members) {
      const key = sponsorKey(member)
      if (key === 'none') continue
      if (!map.has(key)) map.set(key, sponsorLabel(member))
    }

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [members])

  const filteredMembers = useMemo(() => {
    if (sponsorFilter === 'all') return members
    return members.filter((member) => sponsorKey(member) === sponsorFilter)
  }, [members, sponsorFilter])

  const totalPages = Math.max(1, Number(meta?.last_page ?? 1))
  const canPrev = page > 1
  const canNext = page < totalPages
  const loading = isLoading

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-teal-500/20 via-cyan-500/15 to-emerald-500/20 dark:from-teal-500/10 dark:via-cyan-500/10 dark:to-emerald-500/10" />
        <div className="relative p-6 sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Members</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search and filter members by sponsor.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                {filteredMembers.length} shown
              </div>
            </div>
          </div>

          {isFetching && !loading ? (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Refreshing members...</p>
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</label>
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search by name, username, or email"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Sponsor</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                value={sponsorFilter}
                onChange={(e) => setSponsorFilter(e.target.value)}
                disabled={loading}
              >
                <option value="all">All sponsors</option>
                {sponsorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading members...</div> : null}

        {!loading && error ? (
          <div className="space-y-1 p-6 text-sm text-rose-600 dark:text-rose-300">
            <p>Failed to load members.</p>
            <p className="text-xs">{extractErrorMessage(error)}</p>
          </div>
        ) : null}

        {!loading && !error && filteredMembers.length === 0 ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">No members found.</div>
        ) : null}

        {!loading && !error && filteredMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Member</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Sponsor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMembers.map((member) => {
                  const fullAddress = String(member.fullAddress ?? '').trim() || 'N/A'
                  const memberUsername = String(member.username ?? '').trim()
                  const sponsorName = String(member.referredByName ?? '').trim() || 'None'
                  const sponsorUsername = String(member.referredByUsername ?? '').trim()
                  const sponsorAvatar = String(member.referredByAvatar ?? '').trim()
                  const avatar = String(member.avatar ?? '').trim()
                  const initials = getInitials(member.name)
                  const initialsClass = initialsColorClass(member.name)
                  const joinedDate = formatJoinedDate(member)

                  return (
                    <tr key={member.id} className="align-top transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className={`h-10 w-10 shrink-0 overflow-hidden rounded-full border ${avatar ? 'border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800' : initialsClass}`}>
                            {avatar ? (
                              <img src={avatar} alt={member.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-semibold">{initials}</div>
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{member.name}</p>
                            {memberUsername ? <p className="text-xs text-slate-500 dark:text-slate-400">@{memberUsername}</p> : null}
                            <p className="text-sm text-slate-600 dark:text-slate-300">{member.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{member.contactNumber || 'N/A'}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                            {sponsorAvatar ? (
                              <img src={sponsorAvatar} alt={sponsorName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-500">S</div>
                            )}
                          </div>

                          <div>
                            <p>{sponsorName}</p>
                            {sponsorUsername ? <p className="text-xs text-slate-500 dark:text-slate-400">@{sponsorUsername}</p> : null}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{fullAddress}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{joinedDate}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Page {meta?.current_page ?? page} of {totalPages} | {meta?.total ?? filteredMembers.length} total members
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={!canPrev || isFetching}
              >
                Previous
              </button>

              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!canNext || isFetching}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
