import { baseApi } from './baseApi'

export type WebPageType = 'home' | 'banners' | 'announcements' | 'assembly-guides' | 'shop-builder' | 'partner-storefront'

export interface WebPageItem {
  id: number
  type: string
  key?: string | null
  title?: string | null
  subtitle?: string | null
  body?: string | null
  image_url?: string | null
  link_url?: string | null
  button_text?: string | null
  payload?: Record<string, unknown> | null
  sort_order: number
  is_active: boolean
  start_at?: string | null
  end_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface WebPageItemsResponse {
  items: WebPageItem[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export interface PublicHomeContentResponse {
  home: WebPageItem[]
  banners: WebPageItem[]
  announcements: WebPageItem[]
  generated_at: string
}

export interface PublicWebPageItemsResponse {
  items: WebPageItem[]
  generated_at: string
}

export interface UpsertWebPageItemPayload {
  key?: string
  title?: string
  subtitle?: string
  body?: string
  image_url?: string
  link_url?: string
  button_text?: string
  payload?: Record<string, unknown> | null
  sort_order?: number
  is_active?: boolean
  start_at?: string | null
  end_at?: string | null
}

export const webPagesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicHomeContent: builder.query<PublicHomeContentResponse, void>({
      query: () => ({
        url: '/api/web-pages/home',
        method: 'GET',
      }),
      providesTags: ['WebPages'],
    }),
    getPublicWebPageItems: builder.query<PublicWebPageItemsResponse, WebPageType>({
      query: (type) => ({
        url: `/api/web-pages/${type}`,
        method: 'GET',
      }),
      providesTags: ['WebPages'],
    }),
    getAdminWebPageItems: builder.query<WebPageItemsResponse, { type: WebPageType; page?: number; perPage?: number; search?: string; status?: 'active' | 'inactive' | 'all' }>({
      query: ({ type, page = 1, perPage = 20, search, status = 'all' }) => ({
        url: `/api/admin/web-pages/${type}`,
        method: 'GET',
        params: {
          page,
          per_page: perPage,
          q: search || undefined,
          status,
        },
      }),
      providesTags: ['WebPages'],
    }),
    createAdminWebPageItem: builder.mutation<{ message: string; item: WebPageItem }, { type: WebPageType; data: UpsertWebPageItemPayload }>({
      query: ({ type, data }) => ({
        url: `/api/admin/web-pages/${type}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WebPages'],
    }),
    updateAdminWebPageItem: builder.mutation<{ message: string; item: WebPageItem }, { type: WebPageType; id: number; data: UpsertWebPageItemPayload }>({
      query: ({ type, id, data }) => ({
        url: `/api/admin/web-pages/${type}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['WebPages'],
    }),
    deleteAdminWebPageItem: builder.mutation<{ message: string }, { type: WebPageType; id: number }>({
      query: ({ type, id }) => ({
        url: `/api/admin/web-pages/${type}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['WebPages'],
    }),
  }),
})

export const {
  useGetPublicHomeContentQuery,
  useGetPublicWebPageItemsQuery,
  useGetAdminWebPageItemsQuery,
  useCreateAdminWebPageItemMutation,
  useUpdateAdminWebPageItemMutation,
  useDeleteAdminWebPageItemMutation,
} = webPagesApi
