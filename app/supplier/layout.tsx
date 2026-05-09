'use client'

import { useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import SupplierLayoutShell from '@/components/supplier/SupplierLayoutShell'

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const [pathname] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : ''))

  if (
    pathname === '/supplier/login' ||
    pathname === '/supplier/forgot-password' ||
    pathname === '/supplier/reset-password'
  ) {
    return (
      <SessionProvider basePath="/api/supplier/auth">
        {children}
      </SessionProvider>
    )
  }

  return (
    <SessionProvider basePath="/api/supplier/auth">
      <SupplierLayoutShell>{children}</SupplierLayoutShell>
    </SessionProvider>
  )
}
