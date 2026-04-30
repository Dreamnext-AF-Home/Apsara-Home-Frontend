'use client'

import { Button } from '@heroui/react/button'
import { motion } from "framer-motion"
import MembersToolbar from "./MembersToolbar"
import MembersStats from "./MembersStats"
import type { MembersStatCardKey } from "./MembersStats"
import MembersTable from "./MembersTable"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Member, MemberStatus, MemberTier } from "@/types/members/types"
import AddMemberModal from "./AddMemberModal"
import {
    MembersMeta,
    MembersResponse,
    MembersStatsPeriod,
    MembersStatsResponse,
    useGetMembersQuery,
    useGetMembersStatsQuery,
    useLazyGetMemberStatDetailsQuery,
    useLazyGetMembersQuery,
} from "@/store/api/membersApi"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

interface MembersPageMainProps {
    initialData?: MembersResponse | null
    initialStats?: MembersStatsResponse | null
}

function SkeletonTable() {
    return (
        <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div className="h-4 w-28 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-4">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800/60" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-32 rounded bg-slate-100 dark:bg-slate-800/60" />
                            <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-slate-800/60" />
                        </div>
                        <div className="h-6 w-20 rounded-full bg-slate-100 dark:bg-slate-800/60" />
                        <div className="h-7 w-16 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
                    </div>
                ))}
            </div>
        </div>
    )
}

const csvEscape = (value: unknown) => {
    const text = String(value ?? '')
    if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`
    }
    return text
}

type ModalMember = Member & {
    metricValue?: string
    referralChildren?: Array<{
        id: number
        name: string
        username: string
        email: string
        contactNumber: string
        status: MemberStatus
        tier: MemberTier
        joinedAt: string
    }>
}

const modalDescriptions: Record<MembersStatCardKey, { intro: string; emptyTitle: string; emptyDescription: string }> = {
    total_members: {
        intro: 'Live member records loaded directly from the database.',
        emptyTitle: 'No members found.',
        emptyDescription: 'No member records were returned from the database.',
    },
    active: {
        intro: 'Live active-member records loaded directly from the database.',
        emptyTitle: 'No active members found.',
        emptyDescription: 'There are no active-member records to show right now.',
    },
    pending: {
        intro: 'Live pending and KYC-related member records loaded directly from the database.',
        emptyTitle: 'No pending or KYC members found.',
        emptyDescription: 'There are no pending or KYC-review records to show right now.',
    },
    blocked: {
        intro: 'Live blocked-member records loaded directly from the database.',
        emptyTitle: 'No blocked members found.',
        emptyDescription: 'There are no blocked-member records to show right now.',
    },
    new_members: {
        intro: 'Live recent registrations loaded directly from the database for the selected period.',
        emptyTitle: 'No recent members found.',
        emptyDescription: 'There are no registration records to show for the selected period.',
    },
    total_spent: {
        intro: 'These are the actual members contributing to Total Spent, ranked from the database.',
        emptyTitle: 'No spending records found.',
        emptyDescription: 'No members with recorded spending were returned from the database.',
    },
    total_earnings: {
        intro: 'These are the actual members contributing to Total Earnings, ranked from the database.',
        emptyTitle: 'No earnings records found.',
        emptyDescription: 'No members with recorded earnings were returned from the database.',
    },
    total_referrals: {
        intro: 'These are the actual members contributing to Total Referrals, ranked from the database.',
        emptyTitle: 'No referral records found.',
        emptyDescription: 'No members with referral counts were returned from the database.',
    },
}

const MembersPageMain = ({ initialData = null, initialStats = null }: MembersPageMainProps) => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [status, setStatus] = useState<'all' | MemberStatus>('all')
    const [tier, setTier] = useState<'all' | MemberTier>('all')
    const [registration, setRegistration] = useState<'all' | 'new' | 'referred' | 'direct'>('all')
    const [profilePhoto, setProfilePhoto] = useState<'all' | 'with_photo' | 'no_photo'>('all')
    const [sort, setSort] = useState<'default' | 'newest_registered' | 'oldest_registered' | 'earnings_low_high' | 'earnings_high_low' | 'referrals_high_low'>('default')
    const [statsPeriod, setStatsPeriod] = useState<MembersStatsPeriod>('7d')
    const [showModal, setShowModal] = useState(false)
    const [selectedStatCard, setSelectedStatCard] = useState<MembersStatCardKey | null>(null)
    const [statModalMembers, setStatModalMembers] = useState<ModalMember[]>([])
    const [expandedReferralMembers, setExpandedReferralMembers] = useState<number[]>([])
    const [statModalSearch, setStatModalSearch] = useState('')
    const [debouncedStatModalSearch, setDebouncedStatModalSearch] = useState('')
    const [statModalMeta, setStatModalMeta] = useState<MembersMeta | null>(null)
    const [statModalTitle, setStatModalTitle] = useState('Member Details')
    const [statModalMetricLabel, setStatModalMetricLabel] = useState('Metric')
    const [statModalError, setStatModalError] = useState<string | null>(null)
    const [isStatModalLoading, setIsStatModalLoading] = useState(false)
    const [isStatModalLoadingMore, setIsStatModalLoadingMore] = useState(false)
    const [statModalPage, setStatModalPage] = useState(1)
    const [isExporting, setIsExporting] = useState(false)
    const [page, setPage] = useState(1)
    const [stableData, setStableData] = useState<MembersResponse | null>(initialData)
    const [stableStats, setStableStats] = useState<MembersStatsResponse | null>(initialStats)
    const statModalRequestIdRef = useRef(0)
    const perPage = 7
    const statPageSize = 30
    const urlSearch = (searchParams.get('q') ?? '').trim()

    useEffect(() => {
        const modal = (searchParams.get('modal') ?? '').toLowerCase()
        if (modal === 'add-member') {
            setShowModal(true)
        }
    }, [searchParams])

    useEffect(() => {
        setSearch(urlSearch)
        setPage(1)
    }, [urlSearch])

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearch(search.trim())
        }, 300)

        return () => clearTimeout(timeout)
    }, [search])

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedStatModalSearch(statModalSearch.trim())
        }, 300)

        return () => clearTimeout(timeout)
    }, [statModalSearch])

    const isUsingDefaultView =
        page === 1 &&
        debouncedSearch === '' &&
        status === 'all' &&
        tier === 'all' &&
        registration === 'all' &&
        profilePhoto === 'all' &&
        sort === 'default'

    const shouldSkipInitialMembersRefetch = Boolean(initialData && isUsingDefaultView)
    const shouldSkipInitialStatsRefetch = Boolean(initialStats && statsPeriod === '7d')

    const { data: statsData } = useGetMembersStatsQuery({ period: statsPeriod }, {
        skip: shouldSkipInitialStatsRefetch,
    })
    const [triggerExportMembers] = useLazyGetMembersQuery()
    const [triggerStatDetails] = useLazyGetMemberStatDetailsQuery()

    const { data, isLoading, isFetching, isError } = useGetMembersQuery(
        {
            page,
            perPage,
            search: debouncedSearch !== '' ? debouncedSearch : undefined,
            status: status === 'all' ? undefined : status,
            tier: tier === 'all' ? undefined : tier,
            registration: registration === 'all' ? undefined : registration,
            profilePhoto: profilePhoto === 'all' ? undefined : profilePhoto,
            sort,
        },
        {
            skip: shouldSkipInitialMembersRefetch,
        }
    )

    useEffect(() => {
        if (data) {
            setStableData(data)
        }
    }, [data])

    useEffect(() => {
        if (statsData) {
            setStableStats(statsData)
        }
    }, [statsData])

    const effectiveData = shouldSkipInitialMembersRefetch ? (initialData ?? null) : (data ?? stableData ?? initialData ?? null)
    const effectiveStats = statsData ?? stableStats ?? initialStats ?? null
    const members = useMemo(() => effectiveData?.members ?? [], [effectiveData])
    const sortedMembers = useMemo(() => members, [members])
    const meta = effectiveData?.meta

    const loadStatPage = useCallback(async (stat: MembersStatCardKey, nextPage: number, append: boolean, searchValue?: string) => {
        const requestId = ++statModalRequestIdRef.current
        const normalizedSearch = (searchValue ?? '').trim()

        try {
            if (append) {
                setIsStatModalLoadingMore(true)
            } else {
                setIsStatModalLoading(true)
                setStatModalError(null)
            }

            const response = await triggerStatDetails({
                stat,
                page: nextPage,
                perPage: statPageSize,
                search: normalizedSearch,
                period: stat === 'new_members' ? statsPeriod : undefined,
            }).unwrap()

            if (requestId !== statModalRequestIdRef.current) {
                return
            }

            setStatModalTitle(response.title)
            setStatModalMetricLabel(response.metricLabel)
            setStatModalMeta(response.meta)
            setStatModalMembers((prev) => append ? [...prev, ...response.members] : response.members)
        } catch (error) {
            if (requestId !== statModalRequestIdRef.current) {
                return
            }

            console.error('Failed to load member stat details', error)
            setStatModalError('Failed to load live member records for this stat.')
            if (!append) {
                setStatModalMembers([])
                setStatModalMeta(null)
            }
        } finally {
            if (requestId === statModalRequestIdRef.current) {
                setIsStatModalLoading(false)
                setIsStatModalLoadingMore(false)
            }
        }
    }, [statsPeriod, triggerStatDetails])

    useEffect(() => {
        if (!selectedStatCard) {
            setStatModalMembers([])
            setExpandedReferralMembers([])
            setStatModalSearch('')
            setDebouncedStatModalSearch('')
            setStatModalPage(1)
            setStatModalMeta(null)
            setStatModalError(null)
            return
        }

        setStatModalMembers([])
        setExpandedReferralMembers([])
        setStatModalSearch('')
        setDebouncedStatModalSearch('')
        setStatModalPage(1)
        setStatModalMeta(null)
        setStatModalError(null)
        loadStatPage(selectedStatCard, 1, false, '')
    }, [loadStatPage, selectedStatCard])

    useEffect(() => {
        if (!selectedStatCard) {
            return
        }

        setExpandedReferralMembers([])
        setStatModalPage(1)
        setStatModalMembers([])
        setStatModalMeta(null)
        setStatModalError(null)
        loadStatPage(selectedStatCard, 1, false, debouncedStatModalSearch)
    }, [debouncedStatModalSearch, loadStatPage, selectedStatCard])

    const handleSearch = (value: string) => {
        setSearch(value)
        setPage(1)
    }

    const handleStatus = (value: 'all' | MemberStatus) => {
        setStatus(value)
        setPage(1)
    }

    const handleTier = (value: 'all' | MemberTier) => {
        setTier(value)
        setPage(1)
    }

    const handleRegistration = (value: 'all' | 'new' | 'referred' | 'direct') => {
        setRegistration(value)
        setPage(1)
    }

    const handleProfilePhoto = (value: 'all' | 'with_photo' | 'no_photo') => {
        setProfilePhoto(value)
        setPage(1)
    }

    const handleSort = (value: 'default' | 'newest_registered' | 'oldest_registered' | 'earnings_low_high' | 'earnings_high_low' | 'referrals_high_low') => {
        setSort(value)
        setPage(1)
    }

    const handleExport = async () => {
        if (isExporting) return

        try {
            setIsExporting(true)
            const exportPerPage = 100
            const firstPage = await triggerExportMembers({
                page: 1,
                perPage: exportPerPage,
                search: debouncedSearch !== '' ? debouncedSearch : undefined,
                status: status === 'all' ? undefined : status,
                tier: tier === 'all' ? undefined : tier,
                registration: registration === 'all' ? undefined : registration,
                profilePhoto: profilePhoto === 'all' ? undefined : profilePhoto,
                sort,
            }).unwrap()

            const exportRows = [...(firstPage.members ?? [])]
            const lastPage = Math.max(firstPage.meta?.last_page ?? 1, 1)

            for (let nextPage = 2; nextPage <= lastPage; nextPage += 1) {
                const pageResponse = await triggerExportMembers({
                    page: nextPage,
                    perPage: exportPerPage,
                    search: debouncedSearch !== '' ? debouncedSearch : undefined,
                    status: status === 'all' ? undefined : status,
                    tier: tier === 'all' ? undefined : tier,
                    registration: registration === 'all' ? undefined : registration,
                    profilePhoto: profilePhoto === 'all' ? undefined : profilePhoto,
                    sort,
                }).unwrap()

                exportRows.push(...(pageResponse.members ?? []))
            }


            const headers = [
                'Member ID',
                'Name',
                'Email',
                'Sponsor',
                'Status',
                'Verification Status',
                'Tier',
                'Orders',
                'Total Spent',
                'Earnings',
                'Wallet Cash Credits',
                'Wallet PV Credits',
                'Referrals',
                'Joined',
                'Address',
                'Barangay',
                'City',
                'Province',
                'Region',
                'Zip Code',
                'Full Address',
            ]

            const rows = exportRows.map((member) => [
                member.id,
                member.name,
                member.email,
                member.referredByName ?? member.referredByUsername ?? '',
                member.status,
                member.verificationStatus ?? '',
                member.tier,
                member.orders,
                member.totalSpent,
                member.earnings,
                Number(member.walletCashCredits ?? 0),
                Number(member.walletPvCredits ?? 0),
                member.referrals,
                member.joinedAt,
                member.addressLine ?? '',
                member.barangay ?? '',
                member.city ?? '',
                member.province ?? '',
                member.region ?? '',
                member.zipCode ?? '',
                member.fullAddress ?? '',
            ])

            const csv = [headers, ...rows]
                .map((row) => row.map(csvEscape).join(','))
                .join('\n')

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const now = new Date()
            const pad = (value: number) => String(value).padStart(2, '0')
            const filename = `members-export-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.csv`
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            document.body.appendChild(link)
            link.click()
            link.remove()
            URL.revokeObjectURL(url)
        } finally {
            setIsExporting(false)
        }
    }

    const selectedStatMeta = selectedStatCard ? modalDescriptions[selectedStatCard] : null
    const canLoadMoreStatMembers = Boolean(
        selectedStatCard &&
        statModalMeta &&
        statModalMeta.current_page < statModalMeta.last_page
    )
    const usePaginationControls = selectedStatCard === 'total_members'

    return (
        <div className="space-y-5">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between gap-4"
            >
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">Members</h1>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-300">Manage member profiles, tiers and activities</p>
                </div>
                <Button
                    onPress={() => setShowModal(true)}
                    className="shrink-0 rounded-xl bg-teal-600 text-white transition hover:bg-teal-700"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Add Member</span>
                </Button>
            </motion.div>

            <MembersStats
                stats={effectiveStats ?? undefined}
                selectedPeriod={statsPeriod}
                onPeriodChange={setStatsPeriod}
                onCardClick={setSelectedStatCard}
            />

            <MembersToolbar
                search={search}
                onSearch={handleSearch}
                status={status}
                onStatus={handleStatus}
                tier={tier}
                onTier={handleTier}
                registration={registration}
                onRegistration={handleRegistration}
                profilePhoto={profilePhoto}
                onProfilePhoto={handleProfilePhoto}
                sort={sort}
                onSort={handleSort}
                resultCount={meta?.total ?? members.length}
                onExport={handleExport}
                isExporting={isExporting}
            />

            {isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Failed to load members list from customer data.
                </div>
            ) : isLoading && !effectiveData ? (
                <SkeletonTable />
            ) : (
                <div className="space-y-2">
                    {isFetching && <div className="google-loading-bar" />}
                    <MembersTable
                        rows={sortedMembers}
                        currentPage={meta?.current_page ?? 1}
                        totalPages={meta?.last_page ?? 1}
                        totalRecords={meta?.total ?? members.length}
                        from={meta?.from ?? null}
                        to={meta?.to ?? null}
                        onPageChange={setPage}
                    />
                </div>
            )}

            <AddMemberModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false)
                    if ((searchParams.get('modal') ?? '').toLowerCase() === 'add-member') {
                        router.replace(pathname)
                    }
                }}
                onSubmit={(data) => {
                    console.log('New member data: ', data)
                }}
            />

            {selectedStatCard && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/55"
                        onClick={() => setSelectedStatCard(null)}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 18, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                            <div>
                                <h2 className="text-base font-bold text-slate-800">{statModalTitle}</h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {selectedStatMeta?.intro ?? 'Live records loaded from the database.'}
                                </p>
                                        {statModalMeta && (
                                            <p className="mt-1 text-[11px] font-medium text-teal-600">
                                                {usePaginationControls
                                                    ? `Page ${statModalMeta.current_page.toLocaleString()} of ${statModalMeta.last_page.toLocaleString()} for ${statModalMeta.total.toLocaleString()} database records`
                                                    : `Showing ${statModalMembers.length.toLocaleString()} of ${statModalMeta.total.toLocaleString()} database records`}
                                            </p>
                                        )}
                                        {debouncedStatModalSearch !== '' ? (
                                            <p className="mt-1 text-[11px] text-slate-400">
                                                Search results for &quot;{debouncedStatModalSearch}&quot;
                                            </p>
                                        ) : null}
                                    </div>
                            <button
                                onClick={() => setSelectedStatCard(null)}
                                className="h-9 w-9 rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                            >
                                ×
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto">
                            {isStatModalLoading ? (
                                <div className="space-y-3 px-5 py-5">
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <div key={index} className="animate-pulse rounded-2xl border border-slate-100 px-4 py-3">
                                            <div className="h-4 w-44 rounded bg-slate-100" />
                                            <div className="mt-2 h-3 w-60 rounded bg-slate-100" />
                                        </div>
                                    ))}
                                </div>
                            ) : statModalError ? (
                                <div className="px-5 py-12 text-center">
                                    <p className="text-sm font-medium text-red-600">{statModalError}</p>
                                    <p className="mt-1 text-xs text-slate-400">Try reopening the modal to fetch the live records again.</p>
                                </div>
                            ) : statModalMembers.length > 0 ? (
                                <div>
                                    <div className="border-b border-slate-100 px-5 py-4">
                                        <div className="relative">
                                            <svg
                                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <input
                                                type="text"
                                                value={statModalSearch}
                                                onChange={(event) => setStatModalSearch(event.target.value)}
                                                placeholder="Search member, email, address, tier..."
                                                className="h-11 w-full rounded-[18px] border border-gray-300 bg-white px-4 pl-10 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-0 dark:border-white/18 dark:bg-white/12 dark:text-white dark:placeholder-white/55 dark:focus:border-sky-400/60 dark:focus:bg-white/18"
                                            />
                                        </div>
                                        {debouncedStatModalSearch !== '' ? (
                                            <p className="mt-2 text-[11px] text-slate-400">
                                                Full database search is active for this modal
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                                    {statModalMembers.map((member, index) => (
                                        <motion.div
                                            key={`${member.id}-${index}`}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.18, delay: Math.min(index * 0.015, 0.18) }}
                                            className="px-5 py-4"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-800">{member.name}</p>
                                                    <p className="truncate text-xs text-slate-500">{member.email}</p>
                                                    <p className="mt-1 truncate text-[11px] text-slate-400">
                                                        {member.fullAddress || member.referredByName || member.status}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-3">
                                                    {selectedStatCard === 'total_referrals' && (member.referralChildren?.length ?? 0) > 0 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setExpandedReferralMembers((prev) =>
                                                                    prev.includes(member.id)
                                                                        ? prev.filter((id) => id !== member.id)
                                                                        : [...prev, member.id]
                                                                )
                                                            }
                                                            className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-[11px] font-semibold text-teal-700 transition hover:bg-teal-100"
                                                        >
                                                            {expandedReferralMembers.includes(member.id)
                                                                ? 'Hide Under'
                                                                : `View Under (${member.referralChildren?.length ?? 0})`}
                                                        </button>
                                                    ) : null}
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-teal-700">{member.metricValue ?? '-'}</p>
                                                        <p className="text-[11px] text-slate-400">{statModalMetricLabel}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedStatCard === 'total_referrals' &&
                                            expandedReferralMembers.includes(member.id) &&
                                            (member.referralChildren?.length ?? 0) > 0 ? (
                                                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                        Direct Members Under {member.name}
                                                    </p>
                                                    <div className="space-y-2">
                                                        {member.referralChildren?.map((child) => (
                                                            <div
                                                                key={child.id}
                                                                className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2"
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-xs font-semibold text-slate-800">{child.name}</p>
                                                                    <p className="truncate text-[11px] text-slate-500">{child.email || child.username}</p>
                                                                </div>
                                                                <div className="shrink-0 text-right">
                                                                    <p className="text-[11px] font-semibold text-slate-700">{child.tier}</p>
                                                                    <p className="text-[10px] text-slate-400">{child.joinedAt || child.status}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </motion.div>
                                    ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="px-5 py-12 text-center">
                                    <p className="text-sm font-medium text-slate-600">{selectedStatMeta?.emptyTitle ?? 'No records found.'}</p>
                                    <p className="mt-1 text-xs text-slate-400">{selectedStatMeta?.emptyDescription ?? 'No live records were returned from the database.'}</p>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs text-slate-400">
                                    {usePaginationControls
                                        ? 'Browse the full member database using the pagination controls below.'
                                        : 'Scroll to inspect records. Search queries now run against the full database.'}
                                </p>
                                {usePaginationControls && selectedStatCard && statModalMeta ? (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onPress={() => {
                                                const nextPage = Math.max(1, (statModalMeta.current_page ?? statModalPage) - 1)
                                                setStatModalPage(nextPage)
                                                loadStatPage(selectedStatCard, nextPage, false, debouncedStatModalSearch)
                                            }}
                                            isDisabled={isStatModalLoading || statModalMeta.current_page <= 1}
                                            className="rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Prev
                                        </Button>
                                        <span className="min-w-[72px] text-center text-sm font-semibold text-slate-600">
                                            {statModalMeta.current_page} / {statModalMeta.last_page}
                                        </span>
                                        <Button
                                            onPress={() => {
                                                const nextPage = Math.min(statModalMeta.last_page, (statModalMeta.current_page ?? statModalPage) + 1)
                                                setStatModalPage(nextPage)
                                                loadStatPage(selectedStatCard, nextPage, false, debouncedStatModalSearch)
                                            }}
                                            isDisabled={isStatModalLoading || statModalMeta.current_page >= statModalMeta.last_page}
                                            className="rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                ) : canLoadMoreStatMembers && selectedStatCard ? (
                                    <Button
                                        onPress={() => loadStatPage(selectedStatCard, (statModalMeta?.current_page ?? 1) + 1, true, debouncedStatModalSearch)}
                                        isDisabled={isStatModalLoadingMore}
                                        className="rounded-xl bg-teal-600 text-white transition hover:bg-teal-700 disabled:bg-teal-300"
                                    >
                                        {isStatModalLoadingMore ? 'Loading...' : 'Load More'}
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

export default MembersPageMain
