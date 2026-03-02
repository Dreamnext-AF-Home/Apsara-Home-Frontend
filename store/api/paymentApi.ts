import { baseApi } from './baseApi'

export type CheckoutPaymentMethod = 'online_banking' | 'card' | 'gcash' | 'maya'

export interface CheckoutCustomerPayload {
  name?: string
  email?: string
  phone?: string
  address?: string
}

export interface CreateCheckoutSessionPayload {
  amount: number
  description: string
  payment_method: CheckoutPaymentMethod
  customer?: CheckoutCustomerPayload
  order?: {
    product_name?: string
    product_image?: string
    quantity?: number
    selected_color?: string | null
    selected_size?: string | null
    selected_type?: string | null
  }
}

export interface CreateCheckoutSessionResponse {
  checkout_id: string | null
  checkout_url: string | null
}

export interface VerifyCheckoutSessionResponse {
  checkout_id: string
  status: string | null
  payment_intent_id: string | null
  raw?: Record<string, unknown>
}

export type CustomerOrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface CustomerOrderItem {
  id: number
  name: string
  image: string
  quantity: number
  price: number
}

export interface CustomerOrder {
  id: number
  order_number: string
  status: CustomerOrderStatus
  items: CustomerOrderItem[]
  total: number
  shipping_fee: number
  payment_method: string
  shipping_address: string
  created_at: string
  estimated_delivery?: string | null
}

export interface CheckoutHistoryResponse {
  orders: CustomerOrder[]
}

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createCheckoutSession: builder.mutation<CreateCheckoutSessionResponse, CreateCheckoutSessionPayload>({
      query: (body) => ({
        url: '/api/payments/checkout-session',
        method: 'POST',
        body,
      }),
    }),
    verifyCheckoutSession: builder.query<VerifyCheckoutSessionResponse, string>({
      query: (checkoutId) => ({
        url: `/api/payments/checkout-session/${checkoutId}`,
        method: 'GET',
      }),
    }),
    getCheckoutHistory: builder.query<CheckoutHistoryResponse, void>({
      query: () => ({
        url: '/api/orders/history',
        method: 'GET',
      }),
      providesTags: ['Orders'],
    }),
  }),
})

export const {
  useCreateCheckoutSessionMutation,
  useLazyVerifyCheckoutSessionQuery,
  useGetCheckoutHistoryQuery,
} = paymentApi
