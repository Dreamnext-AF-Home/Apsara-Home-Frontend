import { baseApi } from './baseApi'

export type AdminNotificationSeverity = 'info' | 'warning' | 'critical' | 'success'

export interface AdminNotificationItem {
  id: string
  type?: string
  title: string
  description: string
  count: number
  is_read?: boolean
  severity: AdminNotificationSeverity
  href: string
  updated_at?: string | null
  payload?: Record<string, unknown> | null
}

export interface AdminNotificationsResponse {
  unread_count: number
  items: AdminNotificationItem[]
  generated_at: string
}

export const adminNotificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminNotifications: builder.query<AdminNotificationsResponse, void>({
      query: () => ({
        url: '/api/admin/orders/notifications',
        method: 'GET',
      }),
      providesTags: ['AdminNotifications'],
    }),
    markAdminNotificationRead: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/api/admin/orders/notifications/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminNotifications'],
    }),
    markAllAdminNotificationsRead: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/api/admin/orders/notifications/read-all',
        method: 'POST',
      }),
      invalidatesTags: ['AdminNotifications'],
    }),
  }),
})

export const {
  useGetAdminNotificationsQuery,
  useMarkAdminNotificationReadMutation,
  useMarkAllAdminNotificationsReadMutation,
} = adminNotificationsApi
