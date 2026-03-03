import { baseApi } from './baseApi'

export interface Product {
  id: number
  name: string
  description?: string | null
  catid: number
  catsubid: number
  priceSrp: number
  priceDp: number
  prodpv?: number
  qty: number
  weight: number
  type: number
  musthave: boolean
  bestseller: boolean
  salespromo: boolean
  verified?: boolean
  status: number
  sku: string
  image: string | null
  images?: string[] | null
  variants?: ProductVariant[] | null
  createdAt: string | null
  updatedAt: string | null
}

export interface ProductVariant {
  id?: number
  sku?: string
  color?: string
  colorHex?: string
  size?: string
  priceSrp?: number
  priceDp?: number
  qty?: number
  status?: number
  images?: string[]
}

export interface ProductsMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface ProductsResponse {
  products: Product[]
  meta: ProductsMeta
}

export interface CreateProductPayload {
  pd_name: string
  pd_catid: number
  pd_catsubid?: number
  pd_price_srp: number
  pd_price_dp?: number
  pd_prodpv?: number
  pd_qty?: number
  pd_weight?: number
  pd_psweight?: number
  pd_pslenght?: number
  pd_psheight?: number
  pd_description?: string
  pd_parent_sku?: string
  pd_type?: number
  pd_musthave?: boolean
  pd_bestseller?: boolean
  pd_salespromo?: boolean
  pd_verified?: boolean
  pd_status?: number
  pd_image?: string
  pd_images?: string[]
  pd_variants?: CreateProductVariantPayload[]
}

export interface CreateProductVariantPayload {
  pv_sku?: string
  pv_color?: string
  pv_color_hex?: string
  pv_size?: string
  pv_price_srp?: number
  pv_price_dp?: number
  pv_qty?: number
  pv_status?: number
  pv_images?: string[]
}

interface ProductsQueryParams {
  page?: number
  perPage?: number
  search?: string
  status?: string
}

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      }
    } catch {
      // keep fallback below
    }
    return [value]
  }

  return []
}

export const normalizeProduct = (input: Product & Record<string, unknown>): Product => {
  const parsedImages = toStringArray(input.images ?? input.pd_images)
  const primaryImage = typeof input.image === 'string' && input.image.trim().length > 0
    ? input.image
    : (typeof input.pd_image === 'string' && input.pd_image.trim().length > 0 ? input.pd_image : null)

  const images = parsedImages.length > 0
    ? parsedImages
    : (primaryImage ? [primaryImage] : [])

  const parsedVariants = Array.isArray(input.variants)
    ? input.variants.map((variant) => {
        const row = variant as ProductVariant & Record<string, unknown>
        return {
          id: typeof row.id === 'number' ? row.id : undefined,
          sku: typeof row.sku === 'string' ? row.sku : undefined,
          color: typeof row.color === 'string' ? row.color : undefined,
          colorHex: typeof row.colorHex === 'string' ? row.colorHex : undefined,
          size: typeof row.size === 'string' ? row.size : undefined,
          priceSrp: typeof row.priceSrp === 'number' ? row.priceSrp : (typeof row.priceSrp === 'string' ? Number(row.priceSrp) : undefined),
          priceDp: typeof row.priceDp === 'number' ? row.priceDp : (typeof row.priceDp === 'string' ? Number(row.priceDp) : undefined),
          qty: typeof row.qty === 'number' ? row.qty : (typeof row.qty === 'string' ? Number(row.qty) : undefined),
          status: typeof row.status === 'number' ? row.status : (typeof row.status === 'string' ? Number(row.status) : undefined),
          images: toStringArray(row.images),
        } satisfies ProductVariant
      })
    : []

  return {
    ...input,
    prodpv:
      typeof input.prodpv === 'number'
        ? input.prodpv
        : (typeof input.pd_prodpv === 'number' ? input.pd_prodpv : (typeof input.pd_prodpv === 'string' ? Number(input.pd_prodpv) : 0)),
    image: primaryImage ?? images[0] ?? null,
    images,
    variants: parsedVariants,
  }
}

export const normalizeProductsResponse = (response: ProductsResponse | Record<string, unknown>): ProductsResponse => {
  const rawProducts = Array.isArray((response as ProductsResponse).products)
    ? (response as ProductsResponse).products
    : []

  return {
    ...(response as ProductsResponse),
    products: rawProducts.map((product) => normalizeProduct(product as Product & Record<string, unknown>)),
  }
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ProductsResponse, ProductsQueryParams | void>({
      query: (params) => ({
        url: '/api/admin/products',
        method: 'GET',
        params: {
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 25,
          q: params?.search,
          status: params?.status,
        },
      }),
      transformResponse: (response: ProductsResponse) => normalizeProductsResponse(response),
      providesTags: ['Products'],
    }),
    createProduct: builder.mutation<{ message: string; product: Partial<Product> }, CreateProductPayload>({
      query: (body) => ({
        url: '/api/admin/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation<{ message: string }, { id: number; data: Partial<CreateProductPayload> }>({
      query: ({ id, data }) => ({
        url: `/api/admin/products/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),
    deleteProduct: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/api/admin/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products'],
    }),
  }),
})

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi
