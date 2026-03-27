import { baseApi } from './baseApi'

export interface SupplierOrder {
  id: number
  checkout_id: string
  payment_status: string
  fulfillment_status: string
  product_name: string
  product_image?: string
  quantity: number
  amount: number
  payment_method?: string
  customer_name?: string
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
}

interface SupplierOrdersQuery {
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
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 20,
        },
      }),
      providesTags: ['Orders'],
    }),
  }),
})

export const { useGetSupplierOrdersQuery } = supplierOrdersApi
