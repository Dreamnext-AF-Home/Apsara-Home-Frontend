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
  created_at?: string | null
  updated_at?: string | null
}

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
      refetchOnFocus: false,
      refetchOnReconnect: false,
      providesTags: ['Orders'],
    }),
  }),
})

export const { useGetSupplierOrdersQuery } = supplierOrdersApi
