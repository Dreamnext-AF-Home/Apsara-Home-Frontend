'use client'

import { motion } from "framer-motion"
import MembersToolbar from "./MembersToolbar"
import MembersStats from "./MembersStats"
import MembersTable from "./MembersTable"
import { useEffect, useState } from "react"
import { MemberStatus, MemberTier } from "@/types/members/types"
import AddMemberModal from "./AddMemberModal"
import { MembersResponse, MembersStatsResponse, useGetMembersQuery, useGetMembersStatsQuery } from "@/store/api/membersApi"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"

interface MembersPageMainProps {
    initialData?: MembersResponse | null
    initialStats?: MembersStatsResponse | null
}

const MembersPageMain = ({ initialData = null, initialStats = null }: MembersPageMainProps) => {
    const { status: authStatus } = useSession()
    const searchParams = useSearchParams()
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [status, setStatus] = useState<'all' | MemberStatus>('all')
    const [tier, setTier] = useState<'all' | MemberTier>('all');
    const [showModal, setShowModal] = useState(false);
    const [page, setPage] = useState(1)
    const [stableData, setStableData] = useState<MembersResponse | null>(initialData)
    const [stableStats, setStableStats] = useState<MembersStatsResponse | null>(initialStats)
    const perPage = 25
    const urlSearch = (searchParams.get('q') ?? '').trim()

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

    const shouldSkipMembersQuery = authStatus === 'unauthenticated'
    const isUsingDefaultView =
        page === 1 &&
        debouncedSearch === '' &&
        status === 'all' &&
        tier === 'all'

    const shouldSkipInitialMembersRefetch = Boolean(initialData && isUsingDefaultView)

    const { data: statsData } = useGetMembersStatsQuery(undefined, {
        skip: shouldSkipMembersQuery || Boolean(initialStats),
    })

    const { data, isLoading, isFetching, isError } = useGetMembersQuery(
        {
            page,
            perPage,
            search: debouncedSearch !== '' ? debouncedSearch : undefined,
            status: status === 'all' ? undefined : status,
            tier: tier === 'all' ? undefined : tier,
        },
        {
            skip: shouldSkipMembersQuery || shouldSkipInitialMembersRefetch,
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

    const effectiveData = data ?? stableData ?? initialData ?? null
    const effectiveStats = statsData ?? stableStats ?? initialStats ?? null
    const members = effectiveData?.members ?? []
    const meta = effectiveData?.meta

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

    return (
        <div className="space-y-5">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between gap-4"
            >
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Members</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage member profiles, tiers and activities</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-teal-500/30 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Add Member</span>
                </button>
            </motion.div>

            <MembersStats stats={effectiveStats ?? undefined} />

            <MembersToolbar
                search={search}
                onSearch={handleSearch}
                status={status}
                onStatus={handleStatus}
                tier={tier}
                onTier={handleTier}
                resultCount={meta?.total ?? members.length}
            />

            {authStatus === 'loading' && !effectiveData ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    Loading your session...
                </div>
            ) : authStatus === 'unauthenticated' && !effectiveData ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Please sign in first to load the members list.
                </div>
            ) : isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Failed to load members list from customer data.
                </div>
            ) : isLoading && !effectiveData ? (
                <div className="rounded-2xl border border-slate-100 bg-white p-4 animate-pulse">
                    <div className="grid grid-cols-9 gap-3 mb-3">
                        {Array.from({ length: 9 }).map((_, index) => (
                            <div key={index} className="h-3 rounded bg-slate-200" />
                        ))}
                    </div>
                    <div className="space-y-3">
                        {Array.from({ length: 8 }).map((_, rowIndex) => (
                            <div key={rowIndex} className="grid grid-cols-9 gap-3">
                                {Array.from({ length: 9 }).map((_, colIndex) => (
                                    <div key={colIndex} className="h-8 rounded bg-slate-100" />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {isFetching && (
                        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full w-1/3 animate-pulse rounded-full bg-teal-500" />
                        </div>
                    )}
                    <MembersTable
                        rows={members}
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
                onClose={() => setShowModal(false)}
                onSubmit={(data) => {
                    console.log('New member data: ', data)
                }}
            />
        </div>
    )
}

export default MembersPageMain
