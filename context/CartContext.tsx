'use client'

import { ReactNode, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useGetCartQuery, useRemoveCartItemMutation, useUpdateCartItemMutation } from '@/store/api/cartApi'
import {
  addToCart as addToCartAction,
  removeFromCart as removeFromCartAction,
  updateQuantity as updateQuantityAction,
  setCartOpen,
  toggleCartItemSelected as toggleCartItemSelectedAction,
  setCartSelection as setCartSelectionAction,
  setCartItems,
} from '@/store/slices/cartSlice'

export interface CartItem {
  id: string
  cartItemId?: number
  productId?: number
  variantId?: number
  name: string
  price: number
  originalPrice?: number | null
  image: string
  quantity: number
  prodpv?: number | null
  brand?: string | null
  manualCheckoutEnabled?: boolean
  selectedColor?: string | null
  selectedStyle?: string | null
  selectedSize?: string | null
  selectedType?: string | null
  selectedSku?: string | null
}

interface CartContextType {
  items: CartItem[]
  selectedIds: string[]
  selectedItems: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  toggleItemSelected: (id: string) => void
  setSelection: (ids: string[]) => void
  selectAll: () => void
  clearSelection: () => void
  cartCount: number
  total: number
  selectedCount: number
  selectedTotal: number
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

// Backward-compatible wrapper: existing tree can keep <CartProvider>.
export function CartProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useCart(): CartContextType {
  const dispatch = useAppDispatch()
  const { data: session, status } = useSession()
  const role = String(session?.user?.role ?? '').toLowerCase()
  const isLoggedIn = status === 'authenticated' && (role === 'customer' || role === '')
  const { items, isOpen, selectedIds } = useAppSelector((state) => state.cart)
  const { data: cartData, isLoading: isCartLoading } = useGetCartQuery(undefined, {
    skip: !isLoggedIn,
  })
  const [updateCartItemApi] = useUpdateCartItemMutation()
  const [removeCartItemApi] = useRemoveCartItemMutation()

  // Sync cart items from backend when logged in
  useEffect(() => {
    if (isLoggedIn && cartData?.cart_items) {
      const backendItems: CartItem[] = cartData.cart_items.map((item) => ({
        id: String(item.crt_id),
        cartItemId: item.crt_id,
        productId: item.crt_product_id,
        variantId: item.crt_variant_id,
        name: item.product_name || `Product ${item.crt_product_id}`,
        price: Number(item.crt_unit_price),
        originalPrice: item.product_price_srp ? Number(item.product_price_srp) : null,
        image: item.product_image || '',
        quantity: item.crt_quantity,
        prodpv: item.product_prodpv ? Number(item.product_prodpv) : null,
        brand: item.brand_name || null,
        manualCheckoutEnabled: Boolean(item.product_manual_checkout_enabled),
        selectedColor: item.crt_selected_color || null,
        selectedStyle: item.crt_selected_type || null,
        selectedSize: item.crt_selected_size || null,
        selectedType: item.crt_selected_type || null,
        selectedSku: null,
      }))
      dispatch(setCartItems(backendItems))
    }
  }, [isLoggedIn, cartData, dispatch])

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    dispatch(addToCartAction(item))
  }

  const removeFromCart = (id: string) => {
    dispatch(removeFromCartAction(id))

    if (isLoggedIn) {
      const cartItemId = items.find((item) => item.id === id)?.cartItemId ?? Number(id)
      if (Number.isFinite(cartItemId)) {
        void removeCartItemApi(cartItemId).unwrap().catch(() => {
          // RTK Query invalidation will restore the server state if the request fails.
        })
      }
    }
  }

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id)
      return
    }

    dispatch(updateQuantityAction({ id, quantity: qty }))

    if (isLoggedIn) {
      const cartItemId = items.find((item) => item.id === id)?.cartItemId ?? Number(id)
      if (Number.isFinite(cartItemId)) {
        void updateCartItemApi({ id: cartItemId, quantity: qty }).unwrap().catch(() => {
          // RTK Query invalidation will restore the server state if the request fails.
        })
      }
    }
  }

  const setIsOpen = (open: boolean) => {
    dispatch(setCartOpen(open))
  }

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const selectedItems = items.filter((item) => selectedIds.includes(item.id))
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0)
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const toggleItemSelected = (id: string) => {
    dispatch(toggleCartItemSelectedAction(id))
  }

  const selectAll = () => {
    dispatch(setCartSelectionAction({ ids: items.map((item) => item.id) }))
  }

  const clearSelection = () => {
    dispatch(setCartSelectionAction({ ids: [] }))
  }

  const setSelection = (ids: string[]) => {
    dispatch(setCartSelectionAction({ ids }))
  }

  return {
    items,
    selectedIds,
    selectedItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleItemSelected,
    setSelection,
    selectAll,
    clearSelection,
    cartCount,
    total,
    selectedCount,
    selectedTotal,
    isOpen,
    setIsOpen,
  }
}
