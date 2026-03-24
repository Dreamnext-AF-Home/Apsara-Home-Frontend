import { baseApi } from './baseApi'

export interface ProductBrand {
  id: number
  name: string
  image?: string | null
  status: number
}

interface ProductBrandsResponse {
  brands: ProductBrand[]
  total: number
}

interface ProductBrandPayload {
  pb_name: string
  pb_image?: string | null
  pb_status?: number
}

export const productBrandsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicProductBrands: builder.query<ProductBrandsResponse, { search?: string } | void>({
      query: (params) => ({
        url: '/api/product-brands',
        method: 'GET',
        params: {
          q: params?.search,
        },
      }),
      providesTags: ['Brands'],
    }),
    getProductBrands: builder.query<ProductBrandsResponse, { search?: string } | void>({
      query: (params) => ({
        url: '/api/admin/product-brands',
        method: 'GET',
        params: {
          q: params?.search,
        },
      }),
      providesTags: ['Brands'],
    }),
    createProductBrand: builder.mutation<{ message: string; brand: ProductBrand }, ProductBrandPayload>({
      query: (body) => ({
        url: '/api/admin/product-brands',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Brands'],
    }),
    updateProductBrand: builder.mutation<{ message: string }, { id: number; data: ProductBrandPayload }>({
      query: ({ id, data }) => ({
        url: `/api/admin/product-brands/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Brands'],
    }),
    deleteProductBrand: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/api/admin/product-brands/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Brands'],
    }),
  }),
})

export const {
  useGetPublicProductBrandsQuery,
  useGetProductBrandsQuery,
  useCreateProductBrandMutation,
  useUpdateProductBrandMutation,
  useDeleteProductBrandMutation,
} = productBrandsApi
