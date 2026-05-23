import { baseApi } from "./baseApi";

export type UsernameChangeRequestStatus = 'pending_review' | 'approved' | 'rejected';
export type WebstoreRequestStatus = 'pending_review' | 'approved' | 'rejected' | 'deleted';

export interface AdminUsernameChangeRequest {
  id: number;
  ticket_id: number;
  customer_id: number;
  customer_name?: string | null;
  customer_email?: string | null;
  current_username?: string | null;
  requested_username?: string | null;
  status: UsernameChangeRequestStatus;
  submitted_at?: string | null;
}

export interface AdminUsernameChangeRequestsResponse {
  requests: AdminUsernameChangeRequest[];
}

export interface AdminWebstoreReceiptItem {
  id?: number | null;
  label?: string | null;
  submitted_at?: string | null;
  receipt_urls?: string[] | null;
  billing_option?: string | null;
  payment_method?: string | null;
  checkout_id?: string | null;
  payment_reference?: string | null;
  payment_intent_id?: string | null;
  approval_status?: string | null;
  approved_at?: string | null;
  approved_by?: number | null;
  type?: string | null;
}

export interface AdminWebstoreRequest {
  id: number;
  ticket_id: number;
  customer_id: number;
  customer_name?: string | null;
  customer_email?: string | null;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  slug_name?: string | null;
  display_name?: string | null;
  plan?: string | null;
  plan_term?: string | null;
  subscription_fee?: number | null;
  effective_monthly?: number | null;
  billing_option?: string | null;
  payment_method?: string | null;
  checkout_id?: string | null;
  payment_reference?: string | null;
  payment_intent_id?: string | null;
  base_checkout_id?: string | null;
  base_payment_reference?: string | null;
  base_payment_intent_id?: string | null;
  receipt_urls?: string[] | null;
  receipt_items?: AdminWebstoreReceiptItem[] | null;
  remaining_balance?: number | null;
  payment_count?: number | null;
  total_paid_amount?: number | null;
  status: WebstoreRequestStatus;
  submitted_at?: string | null;
  approved_at?: string | null;
}

export interface AdminWebstoreRequestsResponse {
  requests: AdminWebstoreRequest[];
}

export const adminInquiriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsernameChangeRequests: builder.query<AdminUsernameChangeRequestsResponse, void>({
      query: () => ({
        url: '/api/admin/inquiries/username-changes',
        method: 'GET',
      }),
      providesTags: ['AdminNotifications'],
    }),
    approveUsernameChange: builder.mutation<{ message: string }, { id: number }>({
      query: ({ id }) => ({
        url: `/api/admin/inquiries/username-changes/${id}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: ['AdminNotifications'],
    }),
    rejectUsernameChange: builder.mutation<{ message: string }, { id: number }>({
      query: ({ id }) => ({
        url: `/api/admin/inquiries/username-changes/${id}/reject`,
        method: 'PATCH',
      }),
      invalidatesTags: ['AdminNotifications'],
    }),
    getWebstoreRequests: builder.query<AdminWebstoreRequestsResponse, void>({
      query: () => ({
        url: '/api/admin/inquiries/webstore-requests',
        method: 'GET',
      }),
      providesTags: ['AdminNotifications', 'WebstoreRequests'],
    }),
    approveWebstoreRequest: builder.mutation<{ message: string }, { id: number }>({
      query: ({ id }) => ({
        url: `/api/admin/inquiries/webstore-requests/${id}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: ['AdminNotifications', 'WebstoreRequests', 'User'],
    }),
    approveWebstoreReceipt: builder.mutation<{ message: string }, { id: number; detailId: number }>({
      query: ({ id, detailId }) => ({
        url: `/api/admin/inquiries/webstore-requests/${id}/receipts/${detailId}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: ['AdminNotifications', 'WebstoreRequests', 'User'],
    }),
    rejectWebstoreReceipt: builder.mutation<{ message: string }, { id: number; detailId: number }>({
      query: ({ id, detailId }) => ({
        url: `/api/admin/inquiries/webstore-requests/${id}/receipts/${detailId}/reject`,
        method: 'PATCH',
      }),
      invalidatesTags: ['AdminNotifications', 'WebstoreRequests', 'User'],
    }),
    rejectWebstoreRequest: builder.mutation<{ message: string }, { id: number }>({
      query: ({ id }) => ({
        url: `/api/admin/inquiries/webstore-requests/${id}/reject`,
        method: 'PATCH',
      }),
      invalidatesTags: ['AdminNotifications', 'WebstoreRequests', 'User'],
    }),
    deleteWebstoreRequest: builder.mutation<{ message: string }, { id: number }>({
      query: ({ id }) => ({
        url: `/api/admin/inquiries/webstore-requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminNotifications', 'WebstoreRequests', 'User'],
    }),
  }),
});

export const {
  useGetUsernameChangeRequestsQuery,
  useApproveUsernameChangeMutation,
  useRejectUsernameChangeMutation,
  useGetWebstoreRequestsQuery,
  useApproveWebstoreRequestMutation,
  useApproveWebstoreReceiptMutation,
  useRejectWebstoreReceiptMutation,
  useRejectWebstoreRequestMutation,
  useDeleteWebstoreRequestMutation,
} = adminInquiriesApi;
