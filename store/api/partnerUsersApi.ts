import { baseApi } from './baseApi'

export interface PartnerUserItem {
  id: number
  name: string
  username: string
  email: string
  user_level_id: number
  storefront_ids: number[]
  disabled_storefront_ids?: number[]
  is_banned?: boolean
}

export interface PartnerUsersResponse {
  users: PartnerUserItem[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export interface PartnerUsersQuery {
  search?: string
  page?: number
  perPage?: number
  storefrontId?: number
}

export interface CreatePartnerUserPayload {
  name: string
  username: string
  email?: string
  password: string
  storefront_ids?: number[]
}

export interface UpdatePartnerUserPayload {
  id: number
  name?: string
  username?: string
  email?: string
  password?: string
  storefront_ids?: number[]
  disabled_storefront_ids?: number[]
}

export const partnerUsersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPartnerUsers: builder.query<PartnerUsersResponse, PartnerUsersQuery | void>({
      query: (params) => ({
        url: '/api/admin/partner-users',
        method: 'GET',
        params: {
          q: params?.search,
          storefront_id: params?.storefrontId,
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 20,
        },
      }),
      providesTags: ['AdminUsers'],
    }),
    createPartnerUser: builder.mutation<{ message: string; user: PartnerUserItem }, CreatePartnerUserPayload>({
      query: (body) => ({
        url: '/api/admin/partner-users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    updatePartnerUser: builder.mutation<{ message: string; user: PartnerUserItem }, UpdatePartnerUserPayload>({
      query: ({ id, ...body }) => ({
        url: `/api/admin/partner-users/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    deletePartnerUser: builder.mutation<{ message: string }, { id: number }>({
      query: ({ id }) => ({
        url: `/api/admin/partner-users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUsers'],
    }),
  }),
})

export const {
  useGetPartnerUsersQuery,
  useCreatePartnerUserMutation,
  useUpdatePartnerUserMutation,
  useDeletePartnerUserMutation,
} = partnerUsersApi
