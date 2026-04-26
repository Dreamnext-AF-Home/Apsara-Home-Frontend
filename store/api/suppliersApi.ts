import { baseApi } from './baseApi'

export interface SupplierItem {
  id: number
  name: string
  company: string
  email: string
  contact: string
  address: string
  status: number
  assigned_categories?: Array<{
    id: number
    name: string
    url: string
  }>
}

export interface CreateSupplierPayload {
  name: string
  company: string
  email?: string
  contact?: string
  address?: string
  status?: number
}

export interface InviteSupplierUserPayload {
  supplier_id: number
  fullname: string
  username: string
  email?: string
  level_type?: number
}

export interface InviteSupplierUserResponse {
  message: string
  setup_url: string
  delivery: 'link_only' | 'email_and_link'
  invite: {
    supplier_id: number
    supplier_name: string
    fullname: string
    username: string
    email: string | null
    level_type: number
    expires_at: string
  }
}

export interface SupplierCategoriesResponse {
  supplier_id: number
  categories: Array<{
    id: number
    name: string
    url: string
  }>
}

export interface SupplierPortalUser {
  id: number
  supplier_id: number
  fullname: string
  username: string
  email: string
  level_type: number
  is_main_supplier?: boolean
  role_label?: string
}

export interface SupplierStatsSummary {
  total_suppliers: number
  active_suppliers: number
  supplier_users: number
  suppliers_with_products: number
  suppliers_with_sales: number
  new_suppliers_this_month: number
  supplier_paid_orders: number
  supplier_sales_amount: number
}

export interface SupplierStatsResponse {
  summary: SupplierStatsSummary
}

export interface UpdateSupplierUserPayload {
  id: number
  fullname: string
  username: string
  email?: string
  password?: string
}

export const suppliersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<{ suppliers: SupplierItem[] }, void>({
      query: () => ({
        url: '/api/admin/suppliers',
        method: 'GET',
      }),
      providesTags: ['Suppliers'],
    }),
    getSupplierStats: builder.query<SupplierStatsResponse, void>({
      query: () => ({
        url: '/api/admin/suppliers/stats',
        method: 'GET',
      }),
      providesTags: ['Suppliers', 'Orders'],
    }),
    createSupplier: builder.mutation<{ message: string; supplier: SupplierItem }, CreateSupplierPayload>({
      query: (body) => ({
        url: '/api/admin/suppliers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Suppliers'],
    }),
    updateSupplier: builder.mutation<{ message: string; supplier: SupplierItem }, { id: number; data: CreateSupplierPayload }>({
      query: ({ id, data }) => ({
        url: `/api/admin/suppliers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Suppliers'],
    }),
    deleteSupplier: builder.mutation<{ message: string }, { id: number; company?: string; name?: string }>({
      query: ({ id, company, name }) => ({
        url: `/api/admin/suppliers/${id}`,
        method: 'DELETE',
        body: {
          company,
          name,
        },
      }),
      invalidatesTags: ['Suppliers'],
    }),
    inviteSupplierUser: builder.mutation<InviteSupplierUserResponse, InviteSupplierUserPayload>({
      query: (body) => ({
        url: '/api/admin/supplier-users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Suppliers'],
    }),
    getSupplierCategories: builder.query<SupplierCategoriesResponse, number>({
      query: (supplierId) => ({
        url: `/api/admin/suppliers/${supplierId}/categories`,
        method: 'GET',
      }),
      providesTags: ['Suppliers', 'Categories'],
    }),
    updateSupplierCategories: builder.mutation<
      SupplierCategoriesResponse & { message: string },
      { supplierId: number; category_ids: number[] }
    >({
      query: ({ supplierId, category_ids }) => ({
        url: `/api/admin/suppliers/${supplierId}/categories`,
        method: 'PUT',
        body: { category_ids },
      }),
      invalidatesTags: ['Suppliers', 'Categories'],
    }),
    getSupplierUsers: builder.query<{ supplier_id: number; users: SupplierPortalUser[] }, number | void>({
      query: (supplierId) => ({
        url: '/api/admin/supplier-users',
        method: 'GET',
        params: supplierId ? { supplier_id: supplierId } : undefined,
      }),
      providesTags: ['Suppliers'],
    }),
    updateSupplierUser: builder.mutation<{ message: string; user: SupplierPortalUser }, UpdateSupplierUserPayload>({
      query: ({ id, ...body }) => ({
        url: `/api/admin/supplier-users/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Suppliers'],
    }),
    deleteSupplierUser: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/api/admin/supplier-users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Suppliers'],
    }),
  }),
})

export const {
  useGetSuppliersQuery,
  useGetSupplierStatsQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useInviteSupplierUserMutation,
  useGetSupplierCategoriesQuery,
  useGetSupplierUsersQuery,
  useUpdateSupplierUserMutation,
  useUpdateSupplierCategoriesMutation,
  useDeleteSupplierUserMutation,
} = suppliersApi
