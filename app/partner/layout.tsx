'use client'

import { usePathname } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import PartnerDashboardLayout from '@/components/partner/DashboardLayout'

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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
