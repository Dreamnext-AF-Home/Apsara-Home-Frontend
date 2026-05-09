'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/superAdmin/DashboardLayout'
import { SessionProvider } from 'next-auth/react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [pathname] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : ''))

  if (pathname === '/admin/login') {
    return (
      <SessionProvider basePath="/api/admin/auth">
        {children}
      </SessionProvider>
    )
  }

  return (
    <SessionProvider basePath="/api/admin/auth">
      <DashboardLayout>{children}</DashboardLayout>
    </SessionProvider>
  )
}
