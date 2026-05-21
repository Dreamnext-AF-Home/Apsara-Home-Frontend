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
  status: WebstoreRequestStatus;
  submitted_at?: string | null;
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
  useRejectWebstoreRequestMutation,
  useDeleteWebstoreRequestMutation,
} = adminInquiriesApi;
