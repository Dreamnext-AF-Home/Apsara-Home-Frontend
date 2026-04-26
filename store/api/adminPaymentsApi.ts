import { baseApi } from './baseApi'

export interface AdminPaymentSummary {
  today_paid_amount: number
  today_paid_count: number
  successful_payments_count: number
  pending_payments_count: number
  failed_payments_count: number
  gross_collected_amount: number
}

export interface AdminPaymentMethodBreakdownItem {
  key: string
  label: string
  count: number
  amount: number
}

export interface AdminRecentTransactionItem {
  id: number
  checkout_id: string
  payment_intent_id?: string | null
  status: string
  amount: number
  payment_method: string
  customer_name: string
  customer_email?: string | null
  product_name?: string | null
  paid_at?: string | null
  created_at?: string | null
}

export interface AdminVoucherSummary {
  available: boolean
  total_issued: number
  active: number
  redeemed: number
  expired: number
  issued_value: number
  reserved_value: number
}

export interface AdminRecentVoucherItem {
  id: number
  code: string
  amount: number
  status: string
  used_count: number
  max_uses?: number | null
  expires_at?: string | null
  redeemed_at?: string | null
  created_at?: string | null
  issuer_name: string
  issuer_email?: string | null
  redeemer_name?: string | null
}

export interface AdminEncashmentSnapshot {
  total_requests: number
  pending_requests: number
  released_requests: number
  released_amount: number
}

export interface AdminSalesTrendSeriesItem {
  key: string
  label: string
  color: string
}

export interface AdminSalesTrendPoint {
  time: string
  [key: string]: string | number
}

export interface AdminSalesTrends {
  series: AdminSalesTrendSeriesItem[]
  daily: AdminSalesTrendPoint[]
  monthly: AdminSalesTrendPoint[]
  yearly: AdminSalesTrendPoint[]
}

export interface AdminPaymentsOverviewResponse {
  summary: AdminPaymentSummary
  payment_methods: AdminPaymentMethodBreakdownItem[]
  sales_trends: AdminSalesTrends
  recent_transactions: AdminRecentTransactionItem[]
  voucher_summary: AdminVoucherSummary
  recent_vouchers: AdminRecentVoucherItem[]
  encashment_summary: AdminEncashmentSnapshot
}

export const adminPaymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminPaymentsOverview: builder.query<AdminPaymentsOverviewResponse, void>({
      query: () => ({
        url: '/api/admin/payments/overview',
        method: 'GET',
      }),
      providesTags: ['Orders', 'Encashment'],
    }),
  }),
})

export const {
  useGetAdminPaymentsOverviewQuery,
} = adminPaymentsApi
