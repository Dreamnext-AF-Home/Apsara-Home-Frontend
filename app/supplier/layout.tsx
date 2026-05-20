'use client'

import { SessionProvider } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import SupplierLayoutShell from '@/components/supplier/SupplierLayoutShell'

const UNAUTHENTICATED_PATHS = ['/supplier/login', '/supplier/forgot-password', '/supplier/reset-password']

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (UNAUTHENTICATED_PATHS.includes(pathname)) {
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
