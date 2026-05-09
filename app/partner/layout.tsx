'use client'

import { useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import PartnerDashboardLayout from '@/components/partner/DashboardLayout'

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const [pathname] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : ''))

  if (pathname === '/partner/login') {
    return (
      <SessionProvider basePath="/api/partner/auth">
        {children}
      </SessionProvider>
    )
  }

  return (
    <SessionProvider basePath="/api/partner/auth">
      <PartnerDashboardLayout>{children}</PartnerDashboardLayout>
    </SessionProvider>
  )
}
