import { baseApi } from './baseApi'

export interface SupplierOrder {
  id: number
  customer_id: number
  checkout_id: string
  payment_status: string
  approval_status: string
  approval_notes?: string | null
  approved_by?: number | null
  approved_at?: string | null
  fulfillment_status: string
  courier?: string | null
  tracking_no?: string | null
  shipment_status?: string | null
  shipment_payload?: Record<string, unknown> | null
  shipped_at?: string | null
  product_name: string
  product_description?: string | null
  product_image?: string | null
  quantity: number
  selected_color?: string | null
  selected_size?: string | null
  selected_type?: string | null
  amount: number
  payment_method?: string | null
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  customer_address?: string | null
  paid_at?: string | null
  zq_platform_order_id?: string | null
  zq_status?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type SupplierFulfillmentStatus =
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'

export type SupplierShipmentStatus =
  | 'for_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed_delivery'
  | 'cancelled'
  | 'returned_to_sender'

export interface SupplierOrdersResponse {
  orders: SupplierOrder[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
  counts: {
    total: number
    to_pay: number
    to_ship: number
    to_receive: number
    cancelled: number
    completed: number
    return: number
  }
}

export interface SupplierNotificationItem {
  id: string
  title: string
  description: string
  count: number
  href: string
  updated_at?: string | null
  payload?: Record<string, unknown> | null
}

export interface SupplierNotificationsResponse {
  unread_count: number
  items: SupplierNotificationItem[]
  generated_at: string
}

interface SupplierOrdersQuery {
  filter?: string
  search?: string
  page?: number
  perPage?: number
}

export const supplierOrdersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSupplierOrders: builder.query<SupplierOrdersResponse, SupplierOrdersQuery | void>({
      query: (params) => ({
        url: '/api/supplier/orders',
        method: 'GET',
        params: {
          filter: params?.filter ?? 'all',
          q: params?.search,
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 20,
        },
      }),
      keepUnusedDataFor: 300,
      providesTags: ['Orders'],
    }),
    getSupplierOrderNotifications: builder.query<SupplierNotificationsResponse, void>({
      query: () => ({
        url: '/api/supplier/orders/notifications',
        method: 'GET',
      }),
      providesTags: ['SupplierNotifications'],
    }),
    updateSupplierOrderFulfillment: builder.mutation<
      { message: string; order: SupplierOrder },
      { id: number; fulfillment_status: SupplierFulfillmentStatus }
    >({
      query: ({ id, fulfillment_status }) => ({
        url: `/api/supplier/orders/${id}/fulfillment`,
        method: 'PATCH',
        body: { fulfillment_status },
      }),
      invalidatesTags: ['Orders', 'SupplierNotifications'],
    }),
    updateSupplierOrderTracking: builder.mutation<
      { message: string; order: SupplierOrder },
      { id: number; courier: string; tracking_no: string; shipment_status?: SupplierShipmentStatus }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/supplier/orders/${id}/tracking`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Orders', 'SupplierNotifications'],
    }),
    approveSupplierOrder: builder.mutation<
      { message: string; order: SupplierOrder },
      { id: number; notes?: string }
    >({
      query: ({ id, notes }) => ({
        url: `/api/supplier/orders/${id}/approve`,
        method: 'POST',
        body: notes ? { notes } : {},
      }),
      invalidatesTags: ['Orders', 'SupplierNotifications'],
    }),
    pushSupplierOrderToZq: builder.mutation<
      { message: string; zq: Record<string, unknown>; order: SupplierOrder },
      { id: number }
    >({
      query: ({ id }) => ({
        url: `/api/supplier/orders/${id}/push-to-zq`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Orders', 'SupplierNotifications'],
    }),
  }),
})

export const {
  useGetSupplierOrdersQuery,
  useGetSupplierOrderNotificationsQuery,
  useUpdateSupplierOrderFulfillmentMutation,
  useUpdateSupplierOrderTrackingMutation,
  useApproveSupplierOrderMutation,
  usePushSupplierOrderToZqMutation,
} = supplierOrdersApi
