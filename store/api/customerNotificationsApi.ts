import { baseApi } from './baseApi'

export type CustomerNotificationSeverity = 'info' | 'warning' | 'critical' | 'success'

export interface CustomerNotificationItem {
  id: string
  title: string
  description: string
  count: number
  severity: CustomerNotificationSeverity
  href: string
}

export interface CustomerNotificationsResponse {
  unread_count: number
  items: CustomerNotificationItem[]
  generated_at: string
}

export const customerNotificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomerNotifications: builder.query<CustomerNotificationsResponse, string | number | void>({
      query: () => ({
        url: '/api/notifications/customer',
        method: 'GET',
      }),
      providesTags: ['CustomerNotifications'],
    }),
  }),
})

export const { useGetCustomerNotificationsQuery } = customerNotificationsApi
