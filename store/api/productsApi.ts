import { baseApi } from './baseApi'

export interface Product {
  id: number
  supplierId?: number
  name: string
  description?: string | null
  specifications?: string | null
  catid: number
  catsubid: number
  priceSrp: number
  priceDp: number
  priceMember?: number
  prodpv?: number
  qty: number
  weight: number
  psweight?: number
  pswidth?: number
  pslenght?: number
  psheight?: number
  material?: string | null
  assemblyRequired?: boolean
  warranty?: string | null
  roomType?: number
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
  name?: string
  color?: string
  colorHex?: string
  size?: string
  priceSrp?: number
  priceDp?: number
  priceMember?: number
  prodpv?: number
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
  pd_room_type?: number | null
  pd_catsubid?: number
  pd_price_srp: number
  pd_price_dp?: number
  pd_price_member?: number
  pd_prodpv?: number
  pd_qty?: number
  pd_weight?: number
  pd_psweight?: number
  pd_pswidth?: number
  pd_pslenght?: number
  pd_psheight?: number
  pd_description?: string
  pd_specifications?: string
  pd_material?: string
  pd_warranty?: string
  pd_assembly_required?: boolean
  pd_parent_sku?: string
  pd_type?: number
  pd_musthave?: boolean
  pd_bestseller?: boolean
  pd_salespromo?: boolean
  pd_verified?: boolean
  pd_status?: number
  pd_image?: string | null
  pd_images?: string[] | null
  pd_variants?: CreateProductVariantPayload[]
}

export interface CreateProductVariantPayload {
  pv_sku?: string
  pv_name?: string
  pv_color?: string
  pv_color_hex?: string
  pv_size?: string
  pv_price_srp?: number
  pv_price_dp?: number
  pv_price_member?: number
  pv_prodpv?: number
  pv_qty?: number
  pv_status?: number
  pv_images?: string[]
}

interface ProductsQueryParams {
  page?: number
  perPage?: number
  search?: string
  status?: string
  catId?: number
  roomType?: number
  supplierId?: number
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

  const rawVariants = Array.isArray(input.variants)
    ? input.variants
    : Array.isArray(input.pd_variants)
      ? input.pd_variants
      : []

  const parsedVariants = rawVariants.map((variant) => {
        const row = variant as ProductVariant & Record<string, unknown>
        return {
          id: typeof row.id === 'number' ? row.id : undefined,
          sku: typeof row.sku === 'string' ? row.sku : (typeof row.pv_sku === 'string' ? row.pv_sku : undefined),
          name: typeof row.name === 'string' ? row.name : (typeof row.pv_name === 'string' ? row.pv_name : undefined),
          color: typeof row.color === 'string' ? row.color : (typeof row.pv_color === 'string' ? row.pv_color : undefined),
          colorHex: typeof row.colorHex === 'string' ? row.colorHex : (typeof row.pv_color_hex === 'string' ? row.pv_color_hex : undefined),
          size: typeof row.size === 'string' ? row.size : (typeof row.pv_size === 'string' ? row.pv_size : undefined),
          priceSrp: typeof row.priceSrp === 'number' ? row.priceSrp : (typeof row.priceSrp === 'string' ? Number(row.priceSrp) : (typeof row.pv_price_srp === 'number' ? row.pv_price_srp : (typeof row.pv_price_srp === 'string' ? Number(row.pv_price_srp) : undefined))),
          priceDp: typeof row.priceDp === 'number' ? row.priceDp : (typeof row.priceDp === 'string' ? Number(row.priceDp) : (typeof row.pv_price_dp === 'number' ? row.pv_price_dp : (typeof row.pv_price_dp === 'string' ? Number(row.pv_price_dp) : undefined))),
          priceMember: typeof row.priceMember === 'number' ? row.priceMember : (typeof row.priceMember === 'string' ? Number(row.priceMember) : (typeof row.pv_price_member === 'number' ? row.pv_price_member : (typeof row.pv_price_member === 'string' ? Number(row.pv_price_member) : undefined))),
          prodpv: typeof row.prodpv === 'number' ? row.prodpv : (typeof row.prodpv === 'string' ? Number(row.prodpv) : (typeof row.pv_prodpv === 'number' ? row.pv_prodpv : (typeof row.pv_prodpv === 'string' ? Number(row.pv_prodpv) : undefined))),
          qty: typeof row.qty === 'number' ? row.qty : (typeof row.qty === 'string' ? Number(row.qty) : (typeof row.pv_qty === 'number' ? row.pv_qty : (typeof row.pv_qty === 'string' ? Number(row.pv_qty) : undefined))),
          status: typeof row.status === 'number' ? row.status : (typeof row.status === 'string' ? Number(row.status) : (typeof row.pv_status === 'number' ? row.pv_status : (typeof row.pv_status === 'string' ? Number(row.pv_status) : undefined))),
          images: toStringArray(row.images ?? row.pv_images),
        } satisfies ProductVariant
      })

  return {
    ...input,
    specifications: typeof input.specifications === 'string' ? input.specifications : null,
    priceMember:
      typeof input.priceMember === 'number'
        ? input.priceMember
        : (typeof input.pd_price_member === 'number' ? input.pd_price_member : (typeof input.pd_price_member === 'string' ? Number(input.pd_price_member) : undefined)),
    prodpv:
      typeof input.prodpv === 'number'
        ? input.prodpv
        : (typeof input.pd_prodpv === 'number' ? input.pd_prodpv : (typeof input.pd_prodpv === 'string' ? Number(input.pd_prodpv) : 0)),
    psweight:
      typeof input.psweight === 'number'
        ? input.psweight
        : (typeof input.pd_psweight === 'number' ? input.pd_psweight : (typeof input.pd_psweight === 'string' ? Number(input.pd_psweight) : undefined)),
    pslenght:
      typeof input.pslenght === 'number'
        ? input.pslenght
        : (typeof input.pd_pslenght === 'number' ? input.pd_pslenght : (typeof input.pd_pslenght === 'string' ? Number(input.pd_pslenght) : undefined)),
    psheight:
      typeof input.psheight === 'number'
        ? input.psheight
        : (typeof input.pd_psheight === 'number' ? input.pd_psheight : (typeof input.pd_psheight === 'string' ? Number(input.pd_psheight) : undefined)),
    roomType:
      typeof input.roomType === 'number'
        ? input.roomType
        : (typeof input.pd_room_type === 'number' ? input.pd_room_type : (typeof input.pd_room_type === 'string' ? Number(input.pd_room_type) : undefined)),
    image: primaryImage ?? images[0] ?? null,
    images,
    variants: parsedVariants,
  }
}

export const normalizeProductsResponse = (response: ProductsResponse | Record<string, unknown>): ProductsResponse => {
  const rawProducts = Array.isArray((response as ProductsResponse).products)
    ? (response as ProductsResponse).products
    : []
  const normalizedProducts = rawProducts.map((product) => normalizeProduct(product as Product & Record<string, unknown>))
  const uniqueProducts = Array.from(
    normalizedProducts.reduce((map, product) => {
      map.set(product.id, product)
      return map
    }, new Map<number, Product>()).values(),
  )

  return {
    ...(response as ProductsResponse),
    products: uniqueProducts,
  }
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicProducts: builder.query<ProductsResponse, ProductsQueryParams | void>({
      query: (params) => ({
        url: '/api/products',
        method: 'GET',
        cache: 'no-store',
        params: {
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 25,
          q: params?.search,
          status: params?.status,
          cat_id: params?.catId,
          room_type: params?.roomType,
          supplier_id: params?.supplierId,
        },
      }),
      transformResponse: (response: ProductsResponse) => normalizeProductsResponse(response),
      providesTags: ['Products'],
    }),
    getProducts: builder.query<ProductsResponse, ProductsQueryParams | void>({
      query: (params) => ({
        url: '/api/admin/products',
        method: 'GET',
        cache: 'no-store',
        params: {
          page: params?.page ?? 1,
          per_page: params?.perPage ?? 25,
          q: params?.search,
          status: params?.status,
          cat_id: params?.catId,
          room_type: params?.roomType,
          supplier_id: params?.supplierId,
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
  useGetPublicProductsQuery,
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi
