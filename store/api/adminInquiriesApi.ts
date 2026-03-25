import { baseApi } from "./baseApi";

export type UsernameChangeRequestStatus = 'pending_review' | 'approved' | 'rejected';

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
  }),
});

export const {
  useGetUsernameChangeRequestsQuery,
  useApproveUsernameChangeMutation,
  useRejectUsernameChangeMutation,
} = adminInquiriesApi;
