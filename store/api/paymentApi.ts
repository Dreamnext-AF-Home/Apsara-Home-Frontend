import { baseApi } from './baseApi'

export type CheckoutPaymentMethod = 'online_banking' | 'card' | 'gcash' | 'maya'
export type CheckoutPaymentMode = 'test' | 'live'
export type CheckoutOnlineBankingProvider = 'dob'

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
  payment_mode?: CheckoutPaymentMode
  online_banking_provider?: CheckoutOnlineBankingProvider
  voucher_code?: string
  source_label?: string | null
  source_slug?: string | null
  storefront_partner?: string | null
  source_host?: string | null
  source_url?: string | null
  customer?: CheckoutCustomerPayload
  order?: {
    product_name?: string
    product_id?: number
    product_sku?: string | null
    product_pv?: number
    product_image?: string
    quantity?: number
    selected_color?: string | null
    selected_style?: string | null
    selected_size?: string | null
    selected_type?: string | null
    subtotal?: number
    handling_fee?: number
    source_type?: 'local' | 'zq'
    zq_product_id?: number | null
    zq_external_id?: string | null
    zq_offer_id?: string | null
  }
}

export interface CreateCheckoutSessionResponse {
  checkout_id: string | null
  checkout_url: string | null
  payment_mode?: CheckoutPaymentMode | null
}

export interface VerifyCheckoutSessionResponse {
  checkout_id: string
  status: string | null
  payment_intent_id: string | null
  payment_mode?: CheckoutPaymentMode | null
  customer?: {
    name?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
  }
  order_summary?: {
    description?: string | null
    amount?: number | null
    shipping_fee?: number | null
    payment_method?: string | null
    product_name?: string | null
    product_sku?: string | null
    quantity?: number | null
  }
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
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface CustomerOrderItem {
  id: number
  product_id?: number | null
  name: string
  image: string
  quantity: number
  price: number
  selected_color?: string | null
  selected_style?: string | null
  selected_size?: string | null
  selected_type?: string | null
}

export interface CustomerOrder {
  id: number
  order_number: string
  status: CustomerOrderStatus
  items: CustomerOrderItem[]
  total: number
  total_amount?: number
  shipping_fee: number
  payment_method: string
  shipping_address: string
  courier?: string | null
  tracking_no?: string | null
  tracking_number?: string | null
  shipment_status?: string | null
  shipped_at?: string | null
  created_at: string
  estimated_delivery?: string | null
  refund_reason?: string | null
  refund_image_urls?: string[]
  refund_video_urls?: string[]
  refund_requested_at?: string | null
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
    verifyCheckoutSession: builder.query<VerifyCheckoutSessionResponse, string | { checkoutId: string; paymentMode?: CheckoutPaymentMode }>({
      query: (arg) => {
        const checkoutId = typeof arg === 'string' ? arg : arg.checkoutId
        const paymentMode = typeof arg === 'string' ? undefined : arg.paymentMode

        return {
          url: `/api/payments/checkout-session/${checkoutId}`,
          method: 'GET',
          params: paymentMode ? { payment_mode: paymentMode } : undefined,
        }
      },
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
      transformResponse: (response: CheckoutHistoryResponse | { orders?: Array<Partial<CustomerOrder>> }) => ({
        orders: (response.orders ?? []).map((order) => ({
          ...order,
          id: Number(order.id ?? 0),
          order_number: String(order.order_number ?? ''),
          status: (order.status ?? 'pending') as CustomerOrderStatus,
          items: Array.isArray(order.items)
            ? order.items.map((item) => ({
                ...item,
                id: Number(item.id ?? 0),
                product_id: item.product_id ?? null,
                name: String(item.name ?? 'Order Item'),
                image: String(item.image ?? '/Images/HeroSection/sofas.jpg'),
                quantity: Number(item.quantity ?? 1) || 1,
                price: Number(item.price ?? 0) || 0,
              }))
            : [],
          total: Number(order.total ?? order.total_amount ?? 0) || 0,
          total_amount: Number(order.total_amount ?? order.total ?? 0) || 0,
          shipping_fee: Number(order.shipping_fee ?? 0) || 0,
          payment_method: String(order.payment_method ?? 'Payment'),
          shipping_address: String(order.shipping_address ?? 'Shipping address not available'),
          tracking_no: order.tracking_no ?? order.tracking_number ?? null,
          tracking_number: order.tracking_number ?? order.tracking_no ?? null,
          refund_reason: order.refund_reason ?? null,
          refund_image_urls: Array.isArray(order.refund_image_urls) ? order.refund_image_urls : [],
          refund_video_urls: Array.isArray(order.refund_video_urls) ? order.refund_video_urls : [],
          refund_requested_at: order.refund_requested_at ?? null,
          created_at: String(order.created_at ?? ''),
        })) as CustomerOrder[],
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
    confirmOrder: builder.mutation<{ message: string }, { id: number; rating: number; review: string; reviewImages?: File[]; reviewVideos?: File[] }>({
      query: ({ id, rating, review, reviewImages, reviewVideos }) => {
        const formData = new FormData()
        formData.append('rating', String(rating))
        formData.append('review', review)
        if (Array.isArray(reviewImages)) {
          for (const file of reviewImages) {
            formData.append('review_images[]', file)
          }
        }
        if (Array.isArray(reviewVideos)) {
          for (const file of reviewVideos) {
            formData.append('review_videos[]', file)
          }
        }

        return ({
        url: `/api/orders/${id}/confirm`,
        method: 'POST',
        body: formData,
      })
      },
      invalidatesTags: ['Orders'],
    }),
    refundOrder: builder.mutation<{ message: string }, { id: number; reason: string; refundImages?: File[]; refundVideos?: File[] }>({
      query: ({ id, reason, refundImages, refundVideos }) => {
        const formData = new FormData()
        formData.append('reason', reason)
        if (Array.isArray(refundImages)) {
          for (const file of refundImages) {
            formData.append('refund_images[]', file)
          }
        }
        if (Array.isArray(refundVideos)) {
          for (const file of refundVideos) {
            formData.append('refund_videos[]', file)
          }
        }

        return {
          url: `/api/orders/${id}/refund`,
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: ['Orders'],
    }),
  }),
})

export const {
  useCreateCheckoutSessionMutation,
  useLazyVerifyCheckoutSessionQuery,
  useValidateVoucherMutation,
  useGetCheckoutHistoryQuery,
  useLazyTrackGuestOrderQuery,
  useConfirmOrderMutation,
  useRefundOrderMutation,
} = paymentApi
