import { baseApi } from './baseApi';

export type EncashmentStatus = 'pending' | 'approved' | 'approved_by_admin' | 'rejected' | 'released' | 'on_hold';
export type EncashmentChannel = 'bank' | 'gcash' | 'maya';
export type PayoutMethodType = 'gcash' | 'maya' | 'online_banking' | 'card';

export interface EncashmentPayoutMethodItem {
  id: number;
  label: string;
  method_type: PayoutMethodType;
  channel: EncashmentChannel;
  account_name?: string | null;
  account_number?: string | null;
  mobile_number?: string | null;
  email_address?: string | null;
  bank_name?: string | null;
  bank_code?: string | null;
  account_type?: '' | 'savings' | 'checking' | null;
  card_holder_name?: string | null;
  card_brand?: '' | 'visa' | 'mastercard' | 'jcb' | 'amex' | 'other' | null;
  card_last4?: string | null;
  is_default: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EncashmentRequestItem {
  id: number;
  reference_no: string;
  invoice_no?: string | null;
  amount: number;
  channel: EncashmentChannel;
  account_name?: string | null;
  account_number?: string | null;
  notes?: string | null;
  status: EncashmentStatus;
  proof_url?: string | null;
  proof_uploaded_at?: string | null;
  approved_at?: string | null;
  released_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EncashmentListResponse {
  requests: EncashmentRequestItem[];
  payout_methods?: EncashmentPayoutMethodItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  eligibility?: {
    eligible: boolean;
    message: string;
    available_amount: number;
    locked_amount: number;
    gross_earnings: number;
    current_points: number;
    remaining_cooldown_minutes: number;
    has_active_account: boolean;
    is_verified?: boolean;
  };
  policy?: {
    min_amount: number;
    min_points: number;
    cooldown_hours: number;
    require_active_account: boolean;
  };
  verification?: {
    status: 'verified' | 'pending_review' | 'blocked' | 'not_submitted';
    reference_no?: string | null;
    submitted_at?: string | null;
  };
  monthly_activation?: {
    status: 'active' | 'inactive';
    threshold_pv: number;
    current_month_pv: number;
    qualifying_pv: number;
    remaining_pv: number;
    deadline_day: number;
    deadline_at?: string | null;
    window_open: boolean;
    evaluated_at?: string | null;
    month_key: string;
    month_label: string;
  };
}

export interface CreateEncashmentPayload {
  amount: number;
  channel: EncashmentChannel;
  account_name?: string;
  account_number?: string;
  notes?: string;
}

export interface CreateEncashmentPayoutMethodPayload {
  label: string;
  method_type: PayoutMethodType;
  account_name?: string;
  account_number?: string;
  mobile_number?: string;
  email_address?: string;
  bank_name?: string;
  bank_code?: string;
  account_type?: '' | 'savings' | 'checking';
  card_holder_name?: string;
  card_brand?: '' | 'visa' | 'mastercard' | 'jcb' | 'amex' | 'other';
  card_last4?: string;
  is_default?: boolean;
}

export interface CreateEncashmentResponse {
  message: string;
  request: EncashmentRequestItem;
  eligibility?: EncashmentListResponse['eligibility'];
  policy?: EncashmentListResponse['policy'];
}

export interface CreateEncashmentPayoutMethodResponse {
  message: string;
  method: EncashmentPayoutMethodItem;
}

export interface VerificationRequestResponse {
  message: string;
  status: 'verified' | 'pending_review';
  approval_owner: 'admin';
  reference_no?: string;
  verification?: EncashmentListResponse['verification'];
}

export interface VerificationRequestPayload {
  full_name: string;
  birth_date?: string;
  id_type: string;
  id_number?: string;
  contact_number?: string;
  address_line?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  notes?: string;
  id_front_url: string;
  id_back_url?: string;
  selfie_url: string;
  profile_photo_url?: string;
}

export type AdminEncashmentStatus = 'pending' | 'approved_by_admin' | 'released' | 'rejected' | 'on_hold';

export interface AdminEncashmentItem {
  id: number;
  reference_no: string;
  invoice_no?: string | null;
  affiliate_name?: string | null;
  affiliate_email?: string | null;
  amount: number;
  channel: EncashmentChannel;
  account_name?: string | null;
  account_number?: string | null;
  notes?: string | null;
  status: AdminEncashmentStatus;
  admin_notes?: string | null;
  accounting_notes?: string | null;
  proof_url?: string | null;
  proof_public_id?: string | null;
  proof_uploaded_by?: number | null;
  proof_uploaded_at?: string | null;
  wallet_cash_balance?: number;
  wallet_locked_amount?: number;
  wallet_available_amount?: number;
  can_release_by_balance?: boolean;
  balance_shortfall?: number;
  approved_by?: number | null;
  approved_at?: string | null;
  released_by?: number | null;
  released_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AdminEncashmentResponse {
  requests: AdminEncashmentItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  counts: {
    all: number;
    pending: number;
    released: number;
  };
}

interface AdminEncashmentQuery {
  filter?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export type WalletTypeFilter = 'all' | 'cash' | 'pv' | 'rewards';

export interface WalletLedgerItem {
  id: number;
  wallet_type: 'cash' | 'pv';
  entry_type: 'credit' | 'debit';
  amount: number;
  source_type?: string | null;
  source_id?: number | null;
  reference_no?: string | null;
  notes?: string | null;
  created_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AffiliateVoucherItem {
  id: number;
  code: string;
  amount: number;
  status: 'active' | 'redeemed' | 'cancelled' | 'expired' | string;
  redeemed_by_customer_id?: number | null;
  redeemed_at?: string | null;
  expires_at?: string | null;
  max_uses?: number | null;
  used_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateAffiliateVoucherPayload {
  amount: number;
  expires_at?: string;
  max_uses?: number;
}

export interface CreateAffiliateVoucherResponse {
  message: string;
  voucher: AffiliateVoucherItem;
}

export interface WalletOverviewResponse {
  summary: {
    cash_balance: number;
    pv_balance: number;
    current_pv: number;
    personal_purchase_pv: number;
    group_pv: number;
    current_month_group_pv: number;
    current_cv: number;
    pending_pv: number;
    lifetime_pv: number;
    affiliate_retail_profit?: number;
    pending_referral_earnings?: number;
    yearly_purchase_pv?: number;
    affiliate_performance_bonus?: number;
    global_purchase_bonus?: number;
    group_purchase_bonus?: number;
    monthly_purchase_points?: number;
    total_bonus?: number;
    direct_referral_total_pv?: number;
    cash_credits: number;
    cash_debits: number;
    pv_credits: number;
    pv_debits: number;
    encashment_locked: number;
    encashment_available: number;
    af_voucher_balance: number;
    available_egc_balance: number;
    cashback_balance: number;
    cashback_rate: number;
    af_voucher_source_balance: number;
    af_voucher_reserved_balance: number;
    cashback_source_balance: number;
    cashback_reserved_balance: number;
    personal_cashback_balance?: number;
    personal_cashback_source_balance?: number;
    personal_cashback_reserved_balance?: number;
    personal_cashback_rate?: number;
    personal_cashback_voucher_expiry_days?: number;
    can_create_affiliate_voucher: boolean;
    referrals: {
      total: number;
      verified: number;
      active: number;
    };
    monthly_activation?: EncashmentListResponse['monthly_activation'];
  };
  ledger: WalletLedgerItem[];
  affiliate_vouchers: AffiliateVoucherItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

export const encashmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEncashmentRequests: builder.query<EncashmentListResponse, void>({
      query: () => ({
        url: '/api/encashment/requests',
        method: 'GET',
      }),
      providesTags: ['Encashment'],
    }),
    createEncashmentRequest: builder.mutation<CreateEncashmentResponse, CreateEncashmentPayload>({
      query: (body) => ({
        url: '/api/encashment/requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Encashment'],
    }),
    createEncashmentPayoutMethod: builder.mutation<CreateEncashmentPayoutMethodResponse, CreateEncashmentPayoutMethodPayload>({
      query: (body) => ({
        url: '/api/encashment/payout-methods',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Encashment'],
    }),
    deleteEncashmentPayoutMethod: builder.mutation<{ message: string }, { id: number }>({
      query: ({ id }) => ({
        url: `/api/encashment/payout-methods/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Encashment'],
    }),
    submitEncashmentVerificationRequest: builder.mutation<VerificationRequestResponse, VerificationRequestPayload>({
      query: (body) => ({
        url: '/api/encashment/verification-request',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Encashment'],
    }),
    getWalletOverview: builder.query<WalletOverviewResponse, { page?: number; perPage?: number; walletType?: WalletTypeFilter } | void>({
      query: (params) => ({
        url: '/api/encashment/wallet',
        method: 'GET',
        params: {
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 20,
          wallet_type: params?.walletType ?? 'all',
        },
      }),
      providesTags: ['Encashment'],
    }),
    createAffiliateVoucher: builder.mutation<CreateAffiliateVoucherResponse, CreateAffiliateVoucherPayload>({
      query: (body) => ({
        url: '/api/encashment/vouchers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Encashment'],
    }),
    getAdminEncashmentRequests: builder.query<AdminEncashmentResponse, AdminEncashmentQuery | void>({
      query: (params) => ({
        url: '/api/admin/encashment',
        method: 'GET',
        params: {
          filter: params?.filter ?? 'all',
          q: params?.search,
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 20,
        },
      }),
      providesTags: ['Encashment'],
    }),
    approveAdminEncashment: builder.mutation<{ message: string }, { id: number; notes?: string }>({
      query: ({ id, notes }) => ({
        url: `/api/admin/encashment/${id}/approve`,
        method: 'PATCH',
        body: { notes },
      }),
      invalidatesTags: ['Encashment'],
    }),
    rejectAdminEncashment: builder.mutation<{ message: string }, { id: number; notes?: string }>({
      query: ({ id, notes }) => ({
        url: `/api/admin/encashment/${id}/reject`,
        method: 'PATCH',
        body: { notes },
      }),
      invalidatesTags: ['Encashment'],
    }),
    releaseAdminEncashment: builder.mutation<{ message: string }, { id: number; notes?: string; proof_url?: string; proof_public_id?: string }>({
      query: ({ id, notes, proof_url, proof_public_id }) => ({
        url: `/api/admin/encashment/${id}/release`,
        method: 'PATCH',
        body: { notes, proof_url, proof_public_id },
      }),
      invalidatesTags: ['Encashment'],
    }),
  }),
});

export const {
  useGetEncashmentRequestsQuery,
  useCreateEncashmentRequestMutation,
  useCreateEncashmentPayoutMethodMutation,
  useDeleteEncashmentPayoutMethodMutation,
  useSubmitEncashmentVerificationRequestMutation,
  useGetWalletOverviewQuery,
  useCreateAffiliateVoucherMutation,
  useGetAdminEncashmentRequestsQuery,
  useApproveAdminEncashmentMutation,
  useRejectAdminEncashmentMutation,
  useReleaseAdminEncashmentMutation,
} = encashmentApi;
