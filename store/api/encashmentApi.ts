import { baseApi } from './baseApi';

export type EncashmentStatus = 'pending' | 'approved' | 'approved_by_admin' | 'rejected' | 'released' | 'on_hold';
export type EncashmentChannel = 'bank' | 'gcash' | 'maya';

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
  approved_at?: string | null;
  released_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EncashmentListResponse {
  requests: EncashmentRequestItem[];
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
  };
  policy?: {
    min_amount: number;
    min_points: number;
    cooldown_hours: number;
    require_active_account: boolean;
  };
}

export interface CreateEncashmentPayload {
  amount: number;
  channel: EncashmentChannel;
  account_name?: string;
  account_number?: string;
  notes?: string;
}

export interface CreateEncashmentResponse {
  message: string;
  request: EncashmentRequestItem;
  eligibility?: EncashmentListResponse['eligibility'];
  policy?: EncashmentListResponse['policy'];
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

export type WalletTypeFilter = 'all' | 'cash' | 'pv';

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

export interface WalletOverviewResponse {
  summary: {
    cash_balance: number;
    pv_balance: number;
    cash_credits: number;
    cash_debits: number;
    pv_credits: number;
    pv_debits: number;
    encashment_locked: number;
    encashment_available: number;
  };
  ledger: WalletLedgerItem[];
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
    releaseAdminEncashment: builder.mutation<{ message: string }, { id: number; notes?: string }>({
      query: ({ id, notes }) => ({
        url: `/api/admin/encashment/${id}/release`,
        method: 'PATCH',
        body: { notes },
      }),
      invalidatesTags: ['Encashment'],
    }),
  }),
});

export const {
  useGetEncashmentRequestsQuery,
  useCreateEncashmentRequestMutation,
  useGetWalletOverviewQuery,
  useGetAdminEncashmentRequestsQuery,
  useApproveAdminEncashmentMutation,
  useRejectAdminEncashmentMutation,
  useReleaseAdminEncashmentMutation,
} = encashmentApi;
