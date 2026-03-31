'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import type { CustomerCheckoutLineItem } from '@/types/CustomerCheckout/types'

export default function CartDrawer() {
  const router = useRouter()
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, cartCount, total } = useCart()
  const checkoutItems: CustomerCheckoutLineItem[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    image: item.image,
    price: item.price,
    quantity: item.quantity,
    prodpv: item.prodpv ?? 0,
    selectedColor: item.selectedColor ?? null,
    selectedSize: item.selectedSize ?? null,
    selectedType: item.selectedType ?? null,
    selectedSku: item.selectedSku ?? null,
  }))

  const handleCustomerCheckout = () => {
    if (checkoutItems.length === 0) return

    const handlingFee = total >= 5000 ? 0 : 99
    const firstItem = checkoutItems[0]

    localStorage.setItem('guest_checkout', JSON.stringify({
      product: {
        id: checkoutItems.length === 1 ? firstItem.id : firstItem.id,
        name: checkoutItems.length === 1 ? firstItem.name : `${checkoutItems.length} selected items from AF Home`,
        image: firstItem.image,
        price: total,
        prodpv: checkoutItems.length === 1 ? (firstItem.prodpv ?? 0) : checkoutItems.reduce((sum, item) => sum + ((item.prodpv ?? 0) * item.quantity), 0),
        sku: checkoutItems.length === 1 ? (firstItem.selectedSku ?? undefined) : undefined,
      },
      quantity: cartCount,
      selectedColor: checkoutItems.length === 1 ? (firstItem.selectedColor ?? null) : null,
      selectedSize: checkoutItems.length === 1 ? (firstItem.selectedSize ?? null) : null,
      selectedType: checkoutItems.length === 1 ? (firstItem.selectedType ?? null) : null,
      selectedSku: checkoutItems.length === 1 ? (firstItem.selectedSku ?? null) : null,
      items: checkoutItems,
      subtotal: total,
      handlingFee,
      total: total + handlingFee,
    }))

    setIsOpen(false)
    router.push('/checkout/customer')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">Your Cart</h2>
                {cartCount > 0 && (
                  <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 transition-colors hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Your cart is empty</p>
                    <p className="mt-1 text-sm text-gray-400">Add some items to get started</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 60 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-4 rounded-2xl bg-gray-50 p-3"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-800">{item.name}</p>
                          {(item.selectedColor || item.selectedSize || item.selectedType || item.selectedSku) ? (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.selectedColor ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{item.selectedColor}</span> : null}
                              {item.selectedSize ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{item.selectedSize}</span> : null}
                              {item.selectedType ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{item.selectedType}</span> : null}
                              {item.selectedSku ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{item.selectedSku}</span> : null}
                            </div>
                          ) : null}
                          <p className="mt-0.5 text-sm font-bold text-orange-500">
                            ₱{item.price.toLocaleString()}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-base font-bold leading-none transition-colors hover:border-orange-400 hover:text-orange-500"
                            >
                              -
                            </button>
                            <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-base font-bold leading-none transition-colors hover:border-orange-400 hover:text-orange-500"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                          <p className="text-sm font-bold text-slate-900">
                            ₱{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-3 border-t border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Subtotal</span>
                  <span className="text-xl font-bold text-slate-900">₱{total.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400">Shipping calculated at checkout</p>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 font-semibold text-white transition-colors hover:bg-orange-600"
                  onClick={handleCustomerCheckout}
                >
                  Proceed to Checkout
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </motion.button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
