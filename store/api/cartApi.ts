import { baseApi } from './baseApi'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

export interface CartItem {
  crt_id: number
  crt_customer_id: number
  crt_product_id: number
  crt_variant_id?: number
  crt_quantity: number
  crt_selected_color?: string
  crt_selected_size?: string
  crt_selected_type?: string
  crt_unit_price: number
  crt_total_price: number
  crt_status: string
  crt_created_at: string
  crt_updated_at: string
  product_name?: string
  product_image?: string
  product_price_srp?: number
  product_price_dp?: number
  product_price_member?: number
  product_prodpv?: number
  brand_name?: string
  product_manual_checkout_enabled?: boolean
}

export interface CartResponse {
  cart_items: CartItem[]
  total_amount: number
  total_items: number
}

export interface AddToCartRequest {
  product_id: number
  variant_id?: number
  quantity: number
  selected_color?: string
  selected_size?: string
  selected_type?: string
}

export interface UpdateCartRequest {
  quantity: number
}

type UnknownRow = Record<string, unknown>

const asObject = (value: unknown): UnknownRow => {
  if (value && typeof value === 'object') return value as UnknownRow
  return {}
}

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

const asString = (value: unknown): string => {
  return typeof value === 'string' ? value : ''
}

const normalizeCartItem = (rowInput: unknown): CartItem | null => {
  const row = asObject(rowInput)
  const crt_id = asNumber(row.crt_id) ?? asNumber(row.id) ?? null
  const crt_customer_id = asNumber(row.crt_customer_id) ?? 0
  const crt_product_id = asNumber(row.crt_product_id) ?? asNumber(row.product_id) ?? 0
  const crt_variant_id = asNumber(row.crt_variant_id) ?? asNumber(row.variant_id) ?? undefined
  const crt_quantity = asNumber(row.crt_quantity) ?? asNumber(row.quantity) ?? 1
  const crt_selected_color = asString(row.crt_selected_color) || asString(row.selected_color) || undefined
  const crt_selected_size = asString(row.crt_selected_size) || asString(row.selected_size) || undefined
  const crt_selected_type = asString(row.crt_selected_type) || asString(row.selected_type) || undefined
  const crt_unit_price = asNumber(row.crt_unit_price) ?? asNumber(row.unit_price) ?? 0
  const crt_total_price = asNumber(row.crt_total_price) ?? asNumber(row.total_price) ?? 0
  const crt_status = asString(row.crt_status) || asString(row.status) || 'active'
  const crt_created_at = asString(row.crt_created_at) || asString(row.created_at) || ''
  const crt_updated_at = asString(row.crt_updated_at) || asString(row.updated_at) || ''
  const product_name = asString(row.product_name) || undefined
  const product_image = asString(row.product_image) || undefined
  const product_price_srp = asNumber(row.product_price_srp) ?? undefined
  const product_price_dp = asNumber(row.product_price_dp) ?? undefined
  const product_price_member = asNumber(row.product_price_member) ?? undefined
  const product_prodpv = asNumber(row.product_prodpv) ?? undefined
  const brand_name = asString(row.brand_name) || undefined
  const product_manual_checkout_enabled = Boolean(
    row.product_manual_checkout_enabled ?? row.manualCheckoutEnabled ?? row.pd_manual_checkout_enabled,
  )

  if (!crt_id || !crt_product_id) return null

  return {
    crt_id,
    crt_customer_id,
    crt_product_id,
    crt_variant_id,
    crt_quantity,
    crt_selected_color,
    crt_selected_size,
    crt_selected_type,
    crt_unit_price,
    crt_total_price,
    crt_status,
    crt_created_at,
    crt_updated_at,
    product_name,
    product_image,
    product_price_srp,
    product_price_dp,
    product_price_member,
    product_prodpv,
    brand_name,
    product_manual_checkout_enabled,
  }
}

const normalizeCartResponse = (payload: unknown): CartResponse => {
  const obj = asObject(payload)
  const items =
    (Array.isArray(payload) ? payload : null) ??
    (Array.isArray(obj.cart_items) ? obj.cart_items : null) ??
    (Array.isArray(obj.items) ? obj.items : null) ??
    []

  const normalizedItems = items
    .map((row) => normalizeCartItem(row))
    .filter((row): row is CartItem => Boolean(row))

  const total_amount = asNumber(obj.total_amount) ?? 0
  const total_items = asNumber(obj.total_items) ?? 0

  return {
    cart_items: normalizedItems,
    total_amount,
    total_items,
  }
}

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query<CartResponse, void>({
      query: () => ({
        url: '/api/cart',
        method: 'GET',
      }),
      providesTags: ['Cart'],
    }),
    addToCart: builder.mutation<{ message: string; cart_item: CartItem }, AddToCartRequest>({
      query: (body) => ({
        url: '/api/cart/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: builder.mutation<{ message: string; cart_item: CartItem }, { id: number; quantity: number }>({
      query: ({ id, ...body }) => ({
        url: `/api/cart/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Cart'],
    }),
    removeCartItem: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/api/cart/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
    clearCart: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/api/cart',
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
  }),
})

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} = cartApi
