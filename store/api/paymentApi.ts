import { baseApi } from './baseApi'

export type CheckoutPaymentMethod = 'online_banking' | 'card' | 'gcash' | 'maya'

export interface CheckoutCustomerPayload {
  name?: string
  email?: string
  phone?: string
  address?: string
  referred_by?: string
  is_member?: boolean
}

export interface CreateCheckoutSessionPayload {
  amount: number
  description: string
  payment_method: CheckoutPaymentMethod
  voucher_code?: string
  customer?: CheckoutCustomerPayload
  order?: {
    product_name?: string
    product_id?: number
    product_sku?: string | null
    product_pv?: number
    product_image?: string
    quantity?: number
    selected_color?: string | null
    selected_size?: string | null
    selected_type?: string | null
    subtotal?: number
    handling_fee?: number
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

export interface ValidateVoucherResponse {
  valid: boolean
  voucher: {
    id: number
    code: string
    amount: number
    max_uses?: number | null
    used_count?: number | null
    expires_at?: string | null
  }
  discount: number
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
  selected_color?: string | null
  selected_size?: string | null
  selected_type?: string | null
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
  courier?: string | null
  tracking_no?: string | null
  shipment_status?: string | null
  shipped_at?: string | null
  created_at: string
  estimated_delivery?: string | null
}

export interface CheckoutHistoryResponse {
  orders: CustomerOrder[]
}

export interface GuestTrackOrderResponse {
  order: CustomerOrder & {
    customer_name: string
    courier?: string | null
    tracking_no?: string | null
    shipment_status?: string | null
    shipped_at?: string | null
  }
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
    validateVoucher: builder.mutation<ValidateVoucherResponse, { code: string; subtotal?: number }>({
      query: (body) => ({
        url: '/api/payments/validate-voucher',
        method: 'POST',
        body,
      }),
    }),
    getCheckoutHistory: builder.query<CheckoutHistoryResponse, void>({
      query: () => ({
        url: '/api/orders/history',
        method: 'GET',
      }),
      providesTags: ['Orders'],
    }),
    trackGuestOrder: builder.query<GuestTrackOrderResponse, { orderNumber: string; contact: string }>({
      query: ({ orderNumber, contact }) => ({
        url: '/api/orders/track',
        method: 'GET',
        params: {
          order_number: orderNumber,
          contact,
        },
      }),
    }),
  }),
})

export const {
  useCreateCheckoutSessionMutation,
  useLazyVerifyCheckoutSessionQuery,
  useValidateVoucherMutation,
  useGetCheckoutHistoryQuery,
  useLazyTrackGuestOrderQuery,
} = paymentApi
