import { baseApi } from './baseApi'

export interface AddsContentItem {
  id: number
  image_url?: string | null
  video_url?: string | null
  date_created?: string | null
  status?: number
  page?: string | null
  created_at?: string | null
}

export const addsContentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAddsContentPublic: builder.query<{ items: AddsContentItem[] }, { page?: string } | void>({
      query: (params) => ({
        url: '/api/web-pages/adds-content',
        method: 'GET',
        params: params?.page ? { page: params.page } : undefined,
      }),
      keepUnusedDataFor: 0,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      providesTags: ['WebPages'],
    }),
    getAddsContent: builder.query<{ items: AddsContentItem[] }, void>({
      query: () => ({
        url: '/api/admin/webpages/adds-content',
        method: 'GET',
      }),
      providesTags: ['WebPages'],
    }),
    createAddsContent: builder.mutation<{ message: string; item: AddsContentItem }, FormData>({
      query: (body) => ({
        url: '/api/admin/webpages/adds-content',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WebPages'],
    }),
    updateAddsContentStatus: builder.mutation<{ message: string; item: { id: number; status: number } }, { id: number; status: number }>({
      query: ({ id, status }) => ({
        url: `/api/admin/webpages/adds-content/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['WebPages'],
    }),
    updateAddsContent: builder.mutation<{ message: string; item: AddsContentItem }, { id: number; data: FormData }>({
      query: ({ id, data }) => ({
        url: `/api/admin/webpages/adds-content/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['WebPages'],
    }),
    deleteAddsContent: builder.mutation<{ message: string; id: number }, { id: number }>({
      query: ({ id }) => ({
        url: `/api/admin/webpages/adds-content/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['WebPages'],
    }),
  }),
})

export const {
  useGetAddsContentPublicQuery,
  useGetAddsContentQuery,
  useCreateAddsContentMutation,
  useUpdateAddsContentStatusMutation,
  useUpdateAddsContentMutation,
  useDeleteAddsContentMutation,
} = addsContentApi
