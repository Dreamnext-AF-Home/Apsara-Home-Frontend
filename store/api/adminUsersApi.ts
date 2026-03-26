import { baseApi } from './baseApi'

export interface AdminUserItem {
  id: number
  name: string
  username: string
  email: string
  role: string
  user_level_id: number
  supplier_id?: number | null
  supplier_name?: string | null
  admin_permissions?: string[]
  is_banned?: boolean
}

export interface AdminUsersResponse {
  users: AdminUserItem[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

interface AdminUsersQuery {
  search?: string
  page?: number
  perPage?: number
}

export interface CreateAdminUserPayload {
  name: string
  username: string
  email?: string
  user_level_id: number
  supplier_id?: number | null
  admin_permissions?: string[]
}

export interface CreateAdminUserResponse {
  message: string
  setup_url: string
  delivery: 'link_only' | 'email_and_link'
  invite: {
    name: string
    username: string
    email: string
    role: string
    role_label?: string
    expires_at: string
    admin_permissions?: string[]
  }
}

export interface UpdateAdminUserPayload {
  id: number
  name?: string
  username?: string
  email?: string
  password?: string
  user_level_id?: number
  supplier_id?: number | null
  admin_permissions?: string[]
}

export const adminUsersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminUsers: builder.query<AdminUsersResponse, AdminUsersQuery | void>({
      query: (params) => ({
        url: '/api/admin/users',
        method: 'GET',
        params: {
          q: params?.search,
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 20,
        },
      }),
      providesTags: ['AdminUsers'],
    }),
    createAdminUser: builder.mutation<CreateAdminUserResponse, CreateAdminUserPayload>({
      query: (body) => ({
        url: '/api/admin/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    updateAdminUser: builder.mutation<{ message: string; user: AdminUserItem }, UpdateAdminUserPayload>({
      query: ({ id, ...body }) => ({
        url: `/api/admin/users/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    deleteAdminUser: builder.mutation<{ message: string }, { id: number }>({
      query: ({ id }) => ({
        url: `/api/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    banAdminUser: builder.mutation<{ message: string; user: AdminUserItem }, { id: number }>({
      query: ({ id }) => ({
        url: `/api/admin/users/${id}/ban`,
        method: 'PUT',
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    unbanAdminUser: builder.mutation<{ message: string; user: AdminUserItem }, { id: number }>({
      query: ({ id }) => ({
        url: `/api/admin/users/${id}/unban`,
        method: 'PUT',
      }),
      invalidatesTags: ['AdminUsers'],
    }),
  }),
})

export const {
  useGetAdminUsersQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useBanAdminUserMutation,
  useUnbanAdminUserMutation,
} = adminUsersApi
