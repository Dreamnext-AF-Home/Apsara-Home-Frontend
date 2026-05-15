'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useCart, type CartItem } from '@/context/CartContext'
import { usePathname, useRouter } from 'next/navigation'
import type { CustomerCheckoutLineItem } from '@/types/CustomerCheckout/types'
import { useEffect, useMemo } from 'react'
import PrimaryButton from '@/components/ui/buttons/PrimaryButton'
import { resolveCheckoutSource } from '@/libs/checkoutSource'
import { buildStorefrontProductPath, extractPartnerSlugFromPath } from '@/libs/storefrontRouting'

export default function CartDrawer() {
  const router = useRouter()
  const pathname = usePathname()
  const partnerSlug = extractPartnerSlugFromPath(pathname)
  const checkoutTarget = partnerSlug ? `/${partnerSlug}/checkout/customer` : '/checkout/customer'
  const {
    items,
    selectedIds,
    selectedItems,
    selectedCount,
    selectedTotal,
    toggleItemSelected,
    setSelection,
    selectAll,
    clearSelection,
    isOpen,
    setIsOpen,
    removeFromCart,
    updateQuantity,
    cartCount,
  } = useCart()

  const groupedItems = useMemo(() => items.reduce((map, item) => {
    const resolvedBrand = (item.brand ?? '').trim()
    const key = resolvedBrand || 'Other'
    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key)?.push(item)
    return map
  }, new Map<string, typeof items>()), [items])
  const checkoutItems: CustomerCheckoutLineItem[] = selectedItems.map((item) => ({
    id: String(item.productId ?? item.id),
    cartItemId: item.cartItemId,
    productId: item.productId,
    variantId: item.variantId,
    name: item.name,
    image: item.image,
    price: item.price,
    quantity: item.quantity,
    prodpv: item.prodpv ?? 0,
    selectedColor: item.selectedColor ?? null,
    selectedStyle: item.selectedStyle ?? null,
    selectedSize: item.selectedSize ?? null,
    selectedType: item.selectedType ?? null,
    selectedSku: item.selectedSku ?? null,
    manualCheckoutEnabled: item.manualCheckoutEnabled ?? undefined,
  }))

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('guest_checkout')
      if (!raw) return
      const draft = JSON.parse(raw) as {
        items?: CustomerCheckoutLineItem[]
        handlingFee?: number
        product?: Record<string, unknown>
      }
      if (!Array.isArray(draft.items) || draft.items.length === 0) return
      if (checkoutItems.length === 0) return

      const firstItem = checkoutItems[0]
      const subtotal = checkoutItems.reduce((sum, item) => sum + (Number(item.price ?? 0) * Math.max(1, Number(item.quantity ?? 1))), 0)
      const totalQuantity = checkoutItems.reduce((sum, item) => sum + Math.max(1, Number(item.quantity ?? 1)), 0)
      const handlingFee = Number(draft.handlingFee ?? 0)
      const totalPv = checkoutItems.length === 1
        ? (firstItem.prodpv ?? 0)
        : checkoutItems.reduce((sum, item) => sum + ((item.prodpv ?? 0) * Math.max(1, Number(item.quantity ?? 1))), 0)

      const nextDraft = {
        ...draft,
        product: {
          ...(draft.product ?? {}),
          id: firstItem.productId ?? firstItem.id,
          name: checkoutItems.length === 1 ? firstItem.name : `${checkoutItems.length} selected items from AF Home`,
          image: firstItem.image,
          price: subtotal,
          prodpv: totalPv,
          sku: checkoutItems.length === 1 ? (firstItem.selectedSku ?? undefined) : undefined,
          manualCheckoutEnabled: checkoutItems.every((item) => item.manualCheckoutEnabled === true),
        },
        quantity: totalQuantity,
        variantId: checkoutItems.length === 1 ? (firstItem.variantId ?? null) : null,
        selectedColor: checkoutItems.length === 1 ? (firstItem.selectedColor ?? null) : null,
        selectedStyle: checkoutItems.length === 1 ? (firstItem.selectedStyle ?? null) : null,
        selectedSize: checkoutItems.length === 1 ? (firstItem.selectedSize ?? null) : null,
        selectedType: checkoutItems.length === 1 ? (firstItem.selectedType ?? null) : null,
        selectedSku: checkoutItems.length === 1 ? (firstItem.selectedSku ?? null) : null,
        items: checkoutItems,
        subtotal,
        total: subtotal + handlingFee,
      }

      window.localStorage.setItem('guest_checkout', JSON.stringify(nextDraft))
      window.dispatchEvent(new CustomEvent('checkout-cart-updated'))
    } catch {
      // Ignore local storage sync errors.
    }
  }, [checkoutItems])

  const handleCustomerCheckout = () => {
    if (checkoutItems.length === 0) return

    const handlingFee = 0
    const firstItem = checkoutItems[0]
    const firstProductId = Number(firstItem.productId ?? firstItem.id)
    const totalSelectedQuantity = checkoutItems.reduce((sum, item) => sum + Math.max(1, Number(item.quantity ?? 1)), 0)
    const checkoutSource = resolveCheckoutSource()

    localStorage.setItem('guest_checkout', JSON.stringify({
      product: {
        id: Number.isFinite(firstProductId) ? firstProductId : undefined,
        name: checkoutItems.length === 1 ? firstItem.name : `${checkoutItems.length} selected items from AF Home`,
        image: firstItem.image,
        price: selectedTotal,
        prodpv: checkoutItems.length === 1 ? (firstItem.prodpv ?? 0) : checkoutItems.reduce((sum, item) => sum + ((item.prodpv ?? 0) * item.quantity), 0),
        sku: checkoutItems.length === 1 ? (firstItem.selectedSku ?? undefined) : undefined,
        manualCheckoutEnabled: checkoutItems.every((item) => item.manualCheckoutEnabled === true),
      },
      quantity: totalSelectedQuantity,
      variantId: checkoutItems.length === 1 ? (firstItem.variantId ?? null) : null,
      selectedColor: checkoutItems.length === 1 ? (firstItem.selectedColor ?? null) : null,
      selectedStyle: checkoutItems.length === 1 ? (firstItem.selectedStyle ?? null) : null,
      selectedSize: checkoutItems.length === 1 ? (firstItem.selectedSize ?? null) : null,
      selectedType: checkoutItems.length === 1 ? (firstItem.selectedType ?? null) : null,
      selectedSku: checkoutItems.length === 1 ? (firstItem.selectedSku ?? null) : null,
      items: checkoutItems,
      subtotal: selectedTotal,
      handlingFee,
      total: selectedTotal + handlingFee,
      sourceLabel: checkoutSource.sourceLabel ?? null,
      sourceSlug: checkoutSource.sourceSlug ?? null,
      sourceHost: checkoutSource.sourceHost ?? null,
      sourceUrl: checkoutSource.sourceUrl ?? null,
    }))

    setIsOpen(false)
    router.push(checkoutTarget)
  }

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return

    selectedIds.forEach((id) => removeFromCart(id))
  }

  const handleOpenCartItem = (item: CartItem) => {
    const productId = Number(item.productId)
    const targetPath = buildStorefrontProductPath(
      item.name,
      Number.isFinite(productId) && productId > 0 ? productId : undefined,
      pathname,
    )
    setIsOpen(false)
    router.push(targetPath)
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
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[60] flex w-full max-w-md flex-col bg-white dark:bg-gray-800 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Cart</h2>
                {cartCount > 0 && (
                  <span className="rounded-full bg-sky-500 px-2 py-0.5 text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 cursor-pointer text-slate-600 dark:text-gray-300"
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
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-500">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Your cart is empty</p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Add some items to get started</p>
                  </div>
                  <PrimaryButton onClick={() => setIsOpen(false)} className="!px-6 !py-2.5 !text-sm">
                    Continue Shopping
                  </PrimaryButton>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {Array.from(groupedItems.entries()).map(([brandName, brandItems]) => (
                      <div key={brandName} className="space-y-3">
                        <div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 px-3 py-2">
                          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={brandItems.every((item) => selectedIds.includes(item.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const merged = new Set(selectedIds)
                                  brandItems.forEach((item) => merged.add(item.id))
                                  setSelection(Array.from(merged))
                                } else {
                                  const removeIds = new Set(brandItems.map((item) => item.id))
                                  setSelection(selectedIds.filter((id) => !removeIds.has(id)))
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-200 cursor-pointer"
                              style={{ cursor: 'pointer' }}
                            />
                            <span className="flex items-center gap-1.5 font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-gray-300">
                              {brandName}
                            </span>
                          </label>
                          <span className="text-[11px] text-slate-400 dark:text-gray-500">
                            {brandItems.length} item{brandItems.length === 1 ? '' : 's'}
                          </span>
                        </div>
{brandItems.map((item) => (
  <motion.div
    key={item.id}
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: 60 }}
    transition={{ duration: 0.2 }}
    className="flex gap-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50 p-3 cursor-pointer"
    onClick={() => handleOpenCartItem(item)}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleOpenCartItem(item)
      }
    }}
    tabIndex={0}
    role="button"
    aria-label={`Open ${item.name}`}
  >
                            <label className="mt-1 flex items-start cursor-pointer" onClick={(event) => event.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(item.id)}
                                onChange={() => toggleItemSelected(item.id)}
                                onClick={(event) => event.stopPropagation()}
                                className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-200 cursor-pointer"
                                style={{ cursor: 'pointer' }}
                              />
                            </label>
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-600">
      {item.image ? (
        <Image src={item.image} alt={item.name} fill className="object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-500">
            <path d="M21 8v13H3V8" />
            <path d="M1 3h22v5H1z" />
            <path d="M10 12h4" />
          </svg>
        </div>
      )}
    </div>

    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">{item.name}</p>
      {(item.selectedColor || item.selectedStyle || item.selectedSize || item.selectedType || item.selectedSku) ? (
        <div className="mt-1 flex flex-wrap gap-1">
          {item.selectedColor ? <span className="rounded-full bg-slate-100 dark:bg-gray-600 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-gray-300">{item.selectedColor}</span> : null}
          {item.selectedStyle ? <span className="rounded-full bg-slate-100 dark:bg-gray-600 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-gray-300">{item.selectedStyle}</span> : null}
          {item.selectedSize ? <span className="rounded-full bg-slate-100 dark:bg-gray-600 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-gray-300">{item.selectedSize}</span> : null}
          {item.selectedType ? <span className="rounded-full bg-slate-100 dark:bg-gray-600 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-gray-300">{item.selectedType}</span> : null}
          {item.selectedSku ? <span className="rounded-full bg-slate-100 dark:bg-gray-600 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-gray-300">{item.selectedSku}</span> : null}
        </div>
      ) : null}
      <div className="mt-0.5 flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold text-sky-500 dark:text-sky-400">
          {'\u20b1'}{item.price.toLocaleString()}
        </p>
        {typeof item.originalPrice === 'number' && item.originalPrice > item.price && (
          <p className="text-xs font-semibold text-slate-400 dark:text-gray-500 line-through">
            {'\u20b1'}{item.originalPrice.toLocaleString()}
          </p>
        )}
        {typeof item.prodpv === 'number' && item.prodpv > 0 && (
          <span className="rounded-full border border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400">
            PV {item.prodpv.toLocaleString()}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={(event) => {
            event.stopPropagation()
            updateQuantity(item.id, item.quantity - 1)
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-lg font-bold leading-none transition-colors hover:border-sky-400 hover:text-sky-500 dark:hover:border-sky-500 dark:hover:text-sky-400 text-slate-700 dark:text-gray-300"
        >
          -
        </button>
        <span className="w-5 text-center text-sm font-semibold text-slate-700 dark:text-gray-300">{item.quantity}</span>
        <button
          onClick={(event) => {
            event.stopPropagation()
            updateQuantity(item.id, item.quantity + 1)
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-lg font-bold leading-none transition-colors hover:border-sky-400 hover:text-sky-500 dark:hover:border-sky-500 dark:hover:text-sky-400 text-slate-700 dark:text-gray-300"
        >
          +
        </button>
      </div>
    </div>

    <div className="flex flex-col items-end justify-between">
      <button
        onClick={(event) => {
          event.stopPropagation()
          removeFromCart(item.id)
        }}
        className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
      <p className="text-sm font-bold text-slate-900 dark:text-white">
        {'\u20b1'}{(item.price * item.quantity).toLocaleString()}
      </p>
    </div>
  </motion.div>
))}
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-3 border-t border-gray-100 dark:border-gray-700 p-5">
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                    Delete Selected ({selectedIds.length})
                  </button>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{'\u20b1'}{selectedTotal.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Shipping calculated at checkout</p>
                <PrimaryButton
                  onClick={handleCustomerCheckout}
                  disabled={checkoutItems.length === 0}
                  className="w-full !py-3.5 !text-sm"
                >
                  Proceed to Checkout
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </PrimaryButton>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
