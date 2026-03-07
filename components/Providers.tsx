'use client'

import { CartProvider } from '@/context/CartContext'
import CartDrawer from '@/components/ui/CartDrawer'
import { Provider as ReduxProvider } from 'react-redux'
import { SessionProvider } from 'next-auth/react'
import { store } from '@/store/store'
import { Toaster } from 'react-hot-toast'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider> 
        <ReduxProvider store={store}>
          <CartProvider>
          {children}
          <CartDrawer />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                background: '#ffffff',
                color: '#1f2937',
                border: '1px solid #fed7aa',
                boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                fontSize: '14px',
              },
            }}
          />
          </CartProvider>
        </ReduxProvider>
    </SessionProvider>
  )
}
