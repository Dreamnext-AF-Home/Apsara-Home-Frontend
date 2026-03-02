'use client'

import { usePathname } from 'next/navigation'
import DashboardLayout from '@/components/superAdmin/DashboardLayout'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
