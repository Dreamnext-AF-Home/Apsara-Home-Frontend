'use client'

import { useMemo, useState } from 'react'
import { useGetMembersQuery } from '@/store/api/membersApi'

type SponsorInfo = {
  username?: string | null
  name?: string | null
}

type MemberRecord = {
  id: number
  fullname?: string | null
  name?: string | null
  email?: string | null
  contactNumber?: string | null
  phone?: string | null
  addressLine?: string | null
  barangay?: string | null
  city?: string | null
  province?: string | null
  region?: string | null
  zipCode?: string | null
  sponsor?: SponsorInfo | null
  referredByUsername?: string | null
  referredByName?: string | null
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      {label ? (
        <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      ) : null}
      <span className="min-w-0 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </span>
    </div>
  )
}

export default function PartnerMembersPage() {
  const [q, setQ] = useState('')
  const [sponsorFilter, setSponsorFilter] = useState<'all' | 'sponsored' | 'not_sponsored'>('all')

  const { data, isLoading, isError, error } = useGetMembersQuery(
    {
      page: 1,
      perPage: 50,
      search: q.trim() ? q.trim() : undefined,
    },
    { refetchOnMountOrArgChange: true },
  )

  const members = useMemo(() => (data?.members ?? []) as MemberRecord[], [data?.members])

  const filteredMembers = useMemo(() => {
    if (sponsorFilter === 'all') return members

    return members.filter((m) => {
      const sponsorUsername = String(m.sponsor?.username ?? m.referredByUsername ?? '').trim()
      const hasSponsor = sponsorUsername !== ''
      return sponsorFilter === 'sponsored' ? hasSponsor : !hasSponsor
    })
  }, [members, sponsorFilter])

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-teal-50 p-4 shadow-sm dark:border-slate-800 dark:bg-gradient-to-br dark:from-sky-950/20 dark:via-slate-950/40 dark:to-teal-950/20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-sky-400/15 via-cyan-400/10 to-teal-400/15 dark:from-sky-400/10 dark:via-cyan-400/5 dark:to-teal-400/10" />

        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">Members</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search and filter members by sponsor.</p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="w-full sm:w-[360px]">
              <label className="sr-only" htmlFor="member-search">
                Search members
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 5.5 5.5a7.5 7.5 0 0 0 11.15 11.15Z"
                    />
                  </svg>
                </span>
                <input
                  id="member-search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search..."
                  className="h-11 w-full rounded-[18px] border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition-all duration-200 focus:border-sky-400 focus:ring-0 dark:border-white/15 dark:bg-white/10 dark:text-white"
                />
              </div>
            </div>

            <div className="w-full sm:w-[240px]">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Sponsor
              </label>
              <select
                value={sponsorFilter}
                onChange={(e) => setSponsorFilter(e.target.value as any)}
                className="h-11 w-full rounded-[18px] border border-gray-200 bg-white px-4 text-sm outline-none transition-all duration-200 focus:border-sky-400 focus:ring-0 dark:border-white/15 dark:bg-white/10 dark:text-white"
              >
                <option value="all">All</option>
                <option value="sponsored">Sponsored</option>
                <option value="not_sponsored">Not sponsored</option>
              </select>
            </div>

            <div className="flex w-full items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 sm:w-[160px] dark:border-slate-800 dark:bg-slate-950/40">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Shown</span>
              <span className="tabular-nums text-sm font-bold text-slate-900 dark:text-slate-100">{filteredMembers.length}</span>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">Loading members...</div>
      ) : null}

      {isError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          Failed to load members.
          <div className="mt-2 text-xs opacity-90">
            {String((error as any)?.data?.message || (error as any)?.error || '') || 'Please try again.'}
          </div>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {filteredMembers.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">No members found.</div>
          ) : (
            <div className="min-w-[780px]">
              <div className="grid grid-cols-12 gap-0 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                <div className="col-span-3">Member</div>
                <div className="col-span-3">Contact</div>
                <div className="col-span-3">Sponsor</div>
                <div className="col-span-3">Address</div>
              </div>

              {filteredMembers.map((m) => {
                const fullname = String(m.fullname ?? m.name ?? '').trim() || 'N/A'
                const email = String(m.email ?? '').trim()
                const contact = String(m.contactNumber ?? m.phone ?? '').trim() || 'N/A'
                const sponsorUsername = String(m.sponsor?.username ?? m.referredByUsername ?? '').trim()
                const sponsorName = String(m.referredByName ?? m.sponsor?.name ?? '').trim()
                const sponsor = sponsorUsername || sponsorName || 'Not assigned'

                const address = [m.addressLine, m.barangay, m.city, m.province, m.region, m.zipCode]
                  .map((x) => (x ? String(x).trim() : ''))
                  .filter(Boolean)
                  .join(', ')

                return (
                  <div
                    key={m.id}
                    className="grid grid-cols-12 gap-0 px-4 py-4 text-sm even:bg-slate-50/40 dark:even:bg-slate-950/20"
                  >
                    <div className="col-span-3 min-w-0">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 shadow-sm ring-1 ring-sky-200/70 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900/40">
                          👤
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-bold text-slate-900 dark:text-slate-100">{fullname}</div>
                          <div className="mt-1 truncate text-slate-500 dark:text-slate-400">{email || '—'}</div>
                          <div className="mt-1 text-[11px] font-bold text-slate-400">ID #{m.id}</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3 min-w-0">
                      <Info label="" value={contact} />
                    </div>

                    <div className="col-span-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <span aria-hidden className="text-sky-600">🧭</span>
                        <span className="truncate font-semibold text-slate-800 dark:text-slate-100">{sponsor}</span>
                      </div>
                    </div>

                    <div className="col-span-3 min-w-0">
                      <div className="truncate text-slate-700 dark:text-slate-200">{address || 'N/A'}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}

