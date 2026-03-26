'use client'

import { ReactNode } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  addToCart as addToCartAction,
  removeFromCart as removeFromCartAction,
  updateQuantity as updateQuantityAction,
  setCartOpen,
} from '@/store/slices/cartSlice'

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  prodpv?: number | null
  selectedColor?: string | null
  selectedSize?: string | null
  selectedType?: string | null
  selectedSku?: string | null
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  cartCount: number
  total: number
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

// Backward-compatible wrapper: existing tree can keep <CartProvider>.
export function CartProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useCart(): CartContextType {
  const dispatch = useAppDispatch()
  const { items, isOpen } = useAppSelector((state) => state.cart)

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    dispatch(addToCartAction(item))
  }

  const removeFromCart = (id: string) => {
    dispatch(removeFromCartAction(id))
  }

  const updateQuantity = (id: string, qty: number) => {
    dispatch(updateQuantityAction({ id, quantity: qty }))
  }

  const setIsOpen = (open: boolean) => {
    dispatch(setCartOpen(open))
  }

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    cartCount,
    total,
    isOpen,
    setIsOpen,
  }
}
