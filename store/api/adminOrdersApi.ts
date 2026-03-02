import { baseApi } from './baseApi'

export type AdminApprovalStatus = 'pending_approval' | 'approved' | 'rejected'
export type AdminFulfillmentStatus =
  | 'pending'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface AdminOrder {
  id: number
  customer_id: number
  checkout_id: string
  payment_status: string
  approval_status: AdminApprovalStatus
  approval_notes?: string | null
  approved_by?: number | null
  approved_at?: string | null
  fulfillment_status: AdminFulfillmentStatus
  product_name: string
  product_image?: string | null
  quantity: number
  amount: number
  payment_method?: string | null
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  customer_address?: string | null
  paid_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface AdminOrdersResponse {
  orders: AdminOrder[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
  counts: {
    all: number
    pending: number
    processing: number
    cancelled: number
    completed: number
  }
}

interface AdminOrdersQuery {
  filter?: string
  search?: string
  page?: number
  perPage?: number
}

export const adminOrdersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminOrders: builder.query<AdminOrdersResponse, AdminOrdersQuery | void>({
      query: (params) => ({
        url: '/api/admin/orders',
        method: 'GET',
        params: {
          filter: params?.filter ?? 'all',
          q: params?.search,
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 20,
        },
      }),
      providesTags: ['Orders'],
    }),
    approveAdminOrder: builder.mutation<{ message: string }, { id: number; notes?: string }>({
      query: ({ id, notes }) => ({
        url: `/api/admin/orders/${id}/approve`,
        method: 'PATCH',
        body: { notes },
      }),
      invalidatesTags: ['Orders'],
    }),
    rejectAdminOrder: builder.mutation<{ message: string }, { id: number; notes?: string }>({
      query: ({ id, notes }) => ({
        url: `/api/admin/orders/${id}/reject`,
        method: 'PATCH',
        body: { notes },
      }),
      invalidatesTags: ['Orders'],
    }),
    updateAdminOrderStatus: builder.mutation<{ message: string }, { id: number; status: AdminFulfillmentStatus }>({
      query: ({ id, status }) => ({
        url: `/api/admin/orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Orders'],
    }),
  }),
})

export const {
  useGetAdminOrdersQuery,
  useApproveAdminOrderMutation,
  useRejectAdminOrderMutation,
  useUpdateAdminOrderStatusMutation,
} = adminOrdersApi
