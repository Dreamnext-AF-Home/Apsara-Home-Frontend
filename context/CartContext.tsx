'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useAddToCartMutation, useGetCartQuery, useRemoveCartItemMutation, useUpdateCartItemMutation } from '@/store/api/cartApi'
import { extractPartnerSlugFromPath } from '@/libs/storefrontRouting'
import {
  addToCart as addToCartAction,
  removeFromCart as removeFromCartAction,
  updateQuantity as updateQuantityAction,
  setCartOpen,
  toggleCartItemSelected as toggleCartItemSelectedAction,
  setCartSelection as setCartSelectionAction,
  setCartItems,
} from '@/store/slices/cartSlice'

const GUEST_CART_STORAGE_KEY_PREFIX = 'guest_cart_items'

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
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const role = String(session?.user?.role ?? '').toLowerCase()
  const isLoggedIn = status === 'authenticated' && role === 'customer'
  const { items, isOpen, selectedIds } = useAppSelector((state) => state.cart)
  const guestCartHydratedRef = useRef(false)
  const guestCartHydratedKeyRef = useRef<string>('')
  const partnerSlug = extractPartnerSlugFromPath(pathname)
  const guestCartStorageKey = `${GUEST_CART_STORAGE_KEY_PREFIX}:${partnerSlug || 'main'}`
  const { data: cartData, isLoading: isCartLoading } = useGetCartQuery(undefined, {
    skip: !isLoggedIn,
  })
  const [addToCartApi] = useAddToCartMutation()
  const [updateCartItemApi] = useUpdateCartItemMutation()
  const [removeCartItemApi] = useRemoveCartItemMutation()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isLoggedIn || isCartLoading) return
    if (guestCartHydratedRef.current && guestCartHydratedKeyRef.current === guestCartStorageKey) return

    try {
      const raw = window.localStorage.getItem(guestCartStorageKey)
      const parsed = raw ? (JSON.parse(raw) as CartItem[]) : []
      const scopedItems = Array.isArray(parsed) ? parsed : []
      dispatch(setCartItems(scopedItems))
      dispatch(setCartSelectionAction({ ids: scopedItems.map((item) => item.id) }))
    } catch {
      // Ignore invalid local storage payload.
    } finally {
      guestCartHydratedRef.current = true
      guestCartHydratedKeyRef.current = guestCartStorageKey
    }
  }, [dispatch, guestCartStorageKey, isCartLoading, isLoggedIn])

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isLoggedIn) return
    if (!guestCartHydratedRef.current) return

    try {
      window.localStorage.setItem(guestCartStorageKey, JSON.stringify(items))
    } catch {
      // Ignore localStorage write failures.
    }
  }, [guestCartStorageKey, isLoggedIn, items])

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    dispatch(addToCartAction(item))

    if (isLoggedIn && typeof item.productId === 'number' && item.productId > 0) {
      void addToCartApi({
        product_id: item.productId,
        variant_id: typeof item.variantId === 'number' && item.variantId > 0 ? item.variantId : undefined,
        quantity: 1,
        selected_color: item.selectedColor ?? undefined,
        selected_size: item.selectedSize ?? undefined,
        selected_type: item.selectedType ?? undefined,
      }).unwrap().catch(() => {
        // RTK Query invalidation + server cart sync will reconcile state.
      })
    }
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
