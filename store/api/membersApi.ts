import { Member } from '@/types/members/types'
import { MemberStatus, MemberTier } from '@/types/members/types'
import { baseApi } from './baseApi'

export interface MembersMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface MembersResponse {
  members: Member[]
  meta: MembersMeta
}

export interface MembersStatsResponse {
  total: number
  active: number
  pending: number
  blocked: number
  newMembers: number
  newMembersPeriod: MembersStatsPeriod
  newMembersLabel: string
  totalSpent: number
  totalEarnings: number
  totalReferrals: number
}

export type MembersStatsPeriod = '7d' | '30d' | 'last_month' | '3m'

export type MemberStatKey =
  | 'total_members'
  | 'active'
  | 'pending'
  | 'blocked'
  | 'new_members'
  | 'total_spent'
  | 'total_earnings'
  | 'total_referrals'

export interface MemberStatDetailsResponse {
  stat: MemberStatKey
  title: string
  metricLabel: string
  search?: string
  members: Array<Member & {
    metricValue: string
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
  }>
  meta: MembersMeta
}

export type ReferralAdminStatus = 'active' | 'pending' | 'blocked' | 'kyc_review'

export interface AdminReferralNode {
  id: number
  name: string
  username: string
  email: string
  avatar?: string
  tier: string
  commissionEarned: number
  referralCount: number
  joinedAt: string
  status: ReferralAdminStatus
  children?: AdminReferralNode[]
}

export interface AdminReferralTreeResponse {
  summary: {
    totalMembers: number
    activeMembers: number
    pendingMembers: number
    blockedMembers: number
    totalReferrals: number
    totalCommissionPaid: number
    avgCommissionPerMember: number
  }
  roots: AdminReferralNode[]
}

export interface TopEarnerResponseItem {
  id: number
  name: string
  email: string
  tier: MemberTier
  earnings: number
  orders: number
  referrals: number
  status: MemberStatus
  joinedAt: string
  lastActive: string
  totalSpent: number
  avatar?: string
}

export interface TopEarnersResponse {
  summary: {
    totalEarnings: number
    activeEarners: number
    avgEarnings: number
    topEarnerAmount: number
    totalMembers: number
  }
  members: TopEarnerResponseItem[]
}

interface MembersQueryParams {
  page?: number
  perPage?: number
  search?: string
  status?: MemberStatus
  tier?: MemberTier
  registration?: 'new' | 'referred' | 'direct'
  profilePhoto?: 'with_photo' | 'no_photo'
  sort?: 'default' | 'newest_registered' | 'oldest_registered' | 'earnings_low_high' | 'earnings_high_low' | 'referrals_high_low'
}

interface PartnerMembersQueryParams {
  page?: number
  perPage?: number
  search?: string
  storefrontId?: number
}

interface TopEarnersQueryParams {
  search?: string
  tier?: MemberTier | 'All Tiers'
  sort?: 'earnings' | 'orders' | 'referrals' | 'total_spent'
}

export interface UpdateMemberPayload {
  id: number
  name: string
  username: string
  email: string
  contactNumber?: string
  status: MemberStatus
  tier: MemberTier
  addressLine?: string
  barangay?: string
  city?: string
  province?: string
  region?: string
  zipCode?: string
}

export interface AssignSponsorPayload {
  id: number
  sponsorUsername: string
}

export type MemberKycStatus = 'pending_review' | 'on_hold' | 'approved' | 'rejected'

export interface MemberKycItem {
  id: number
  reference_no: string
  status: MemberKycStatus
  full_name: string
  birth_date?: string | null
  id_type: string
  id_number?: string | null
  contact_number?: string | null
  address_line?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country?: string | null
  notes?: string | null
  id_front_url: string
  id_back_url?: string | null
  selfie_url: string
  reviewed_by?: number | null
  review_notes?: string | null
  reviewed_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  customer: {
    id: number
    name: string
    email?: string | null
    username?: string | null
    account_status?: number | null
    lock_status?: number | null
  }
}

export interface MemberKycResponse {
  requests: MemberKycItem[]
  meta: MembersMeta
  counts: {
    all: number
    pending_review: number
    on_hold: number
    approved: number
    rejected: number
  }
}

export interface GenerateTemporaryPasswordResponse {
  message: string
  temporary_password: string
  username: string
  member_name: string
  password_change_required: boolean
}

interface MemberKycQueryParams {
  page?: number
  perPage?: number
  search?: string
  filter?: 'all' | 'pending_review' | 'approved' | 'rejected' | 'on_hold'
}

export const membersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMembers: builder.query<MembersResponse, MembersQueryParams | void>({
      query: (params) => ({
        url: '/api/admin/members',
        method: 'GET',
        params: {
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 25,
          q: params?.search,
          status: params?.status,
          tier: params?.tier,
          registration: params?.registration,
          profile_photo: params?.profilePhoto,
          sort: params?.sort,
        },
      }),
      keepUnusedDataFor: 300,
      providesTags: ['Members'],
    }),
    getPartnerMembers: builder.query<MembersResponse, PartnerMembersQueryParams | void>({
      query: (params) => ({
        url: '/api/admin/partner-members',
        method: 'GET',
        params: {
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 50,
          q: params?.search,
          storefront_id: params?.storefrontId,
        },
      }),
      keepUnusedDataFor: 120,
      providesTags: ['Members'],
    }),
    getMembersStats: builder.query<MembersStatsResponse, { period?: MembersStatsPeriod } | void>({
      query: (params) => ({
        url: '/api/admin/members/stats',
        method: 'GET',
        params: {
          period: params?.period ?? '7d',
        },
      }),
      keepUnusedDataFor: 300,
      providesTags: ['Members'],
    }),
    getMemberStatDetails: builder.query<MemberStatDetailsResponse, { stat: MemberStatKey; page?: number; perPage?: number; search?: string; period?: MembersStatsPeriod }>({
      query: ({ stat, page = 1, perPage = 25, search, period = '7d' }) => ({
        url: `/api/admin/members/stats/${stat}`,
        method: 'GET',
        params: {
          page,
          per_page: perPage,
          q: search?.trim() ? search.trim() : undefined,
          period,
        },
      }),
      keepUnusedDataFor: 120,
      providesTags: ['Members'],
    }),
    getMembersReferralTree: builder.query<AdminReferralTreeResponse, void>({
      query: () => '/api/admin/members/referrals',
      keepUnusedDataFor: 120,
      providesTags: ['Members'],
    }),
    getTopEarners: builder.query<TopEarnersResponse, TopEarnersQueryParams | void>({
      query: (params) => ({
        url: '/api/admin/members/top-earners',
        method: 'GET',
        params: {
          q: params?.search?.trim() ? params.search.trim() : undefined,
          tier: params?.tier && params.tier !== 'All Tiers' ? params.tier : undefined,
          sort: params?.sort ?? 'earnings',
        },
      }),
      keepUnusedDataFor: 120,
      providesTags: ['Members'],
    }),
    getMembersKyc: builder.query<MemberKycResponse, MemberKycQueryParams | void>({
      query: (params) => ({
        url: '/api/admin/members/kyc',
        method: 'GET',
        params: {
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 20,
          q: params?.search,
          filter: params?.filter ?? 'pending_review',
        },
      }),
      keepUnusedDataFor: 120,
      providesTags: ['Members'],
    }),
    updateMember: builder.mutation<{ message: string }, UpdateMemberPayload>({
      query: ({ id, ...body }) => ({
        url: `/api/admin/members/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Members'],
    }),
    assignSponsor: builder.mutation<{ message: string }, AssignSponsorPayload>({
      query: ({ id, sponsorUsername }) => ({
        url: `/api/admin/members/${id}/assign-sponsor`,
        method: 'PATCH',
        body: { sponsor_username: sponsorUsername.trim() },
      }),
      invalidatesTags: ['Members'],
    }),
    deleteMember: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/api/admin/members/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Members'],
    }),
    generateMemberTemporaryPassword: builder.mutation<GenerateTemporaryPasswordResponse, number>({
      query: (id) => ({
        url: `/api/admin/members/${id}/temporary-password`,
        method: 'POST',
      }),
      invalidatesTags: ['Members'],
    }),
    approveMemberKyc: builder.mutation<{ message: string }, { id: number; notes?: string }>({
      query: ({ id, notes }) => ({
        url: `/api/admin/members/kyc/${id}/approve`,
        method: 'PATCH',
        body: { notes },
      }),
      invalidatesTags: ['Members'],
    }),
    rejectMemberKyc: builder.mutation<{ message: string }, { id: number; notes: string }>({
      query: ({ id, notes }) => ({
        url: `/api/admin/members/kyc/${id}/reject`,
        method: 'PATCH',
        body: { notes },
      }),
      invalidatesTags: ['Members'],
    }),
  }),
})

export const {
  useGetMembersQuery,
  useGetPartnerMembersQuery,
  useLazyGetMembersQuery,
  useGetMembersStatsQuery,
  useLazyGetMemberStatDetailsQuery,
  useGetMembersReferralTreeQuery,
  useGetTopEarnersQuery,
  useGetMembersKycQuery,
  useUpdateMemberMutation,
  useAssignSponsorMutation,
  useDeleteMemberMutation,
  useGenerateMemberTemporaryPasswordMutation,
  useApproveMemberKycMutation,
  useRejectMemberKycMutation,
} = membersApi
