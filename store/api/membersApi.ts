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
  totalSpent: number
  totalEarnings: number
  totalReferrals: number
}

interface MembersQueryParams {
  page?: number
  perPage?: number
  search?: string
  status?: MemberStatus
  tier?: MemberTier
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
        },
      }),
      keepUnusedDataFor: 300,
      providesTags: ['Members'],
    }),
    getMembersStats: builder.query<MembersStatsResponse, void>({
      query: () => '/api/admin/members/stats',
      keepUnusedDataFor: 300,
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
  useGetMembersStatsQuery,
  useGetMembersKycQuery,
  useApproveMemberKycMutation,
  useRejectMemberKycMutation,
} = membersApi
