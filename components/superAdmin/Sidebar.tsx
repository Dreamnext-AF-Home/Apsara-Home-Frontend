'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useGetAdminMeQuery, useLogoutMutation } from '@/store/api/authApi'
import { useGetAdminOrdersQuery } from '@/store/api/adminOrdersApi'
import { membersApi, useGetMembersStatsQuery } from '@/store/api/membersApi'
import { baseApi, clearAccessTokenCache } from '@/store/api/baseApi'
import { useAppDispatch } from '@/store/hooks'
import { canAccessWebContentSection, normalizeAdminPermissions } from '@/libs/adminPermissions'
import { clearAdminSession } from '@/libs/adminSession'

interface SubItem { label: string; path: string; badge?: number }
interface NavItem {
  id: string
  label: string
  path?: string
  icon: React.ReactNode
  badge?: number
  children?: SubItem[]
  sectionLabel?: string
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

const getInitials = (name?: string | null) => {
  const value = (name ?? '').trim()
  if (!value) return 'AD'
  const parts = value.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

const formatRole = (role?: string | null) => {
  if (!role) return 'Administrator'
  return role.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

const navItems: NavItem[] = [
  {
    id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 4h7v7H3V4zm11 0h7v4h-7V4zm0 7h7v9h-7v-9zM3 15h7v5H3v-5z" /></svg>,
  },
  {
    id: 'chat', label: 'Chat', path: '/admin/chat',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  },
  {
    id: 'email-blast', label: 'Email Blast', path: '/admin/email-blast', sectionLabel: 'Communications',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  },
  {
    id: 'members', label: 'Members', badge: 3, sectionLabel: 'Operations',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    children: [
      { label: 'All Members', path: '/admin/members' },
      { label: 'Member Tiers / Levels', path: '/admin/members/tiers' },
      { label: 'KYC / Verifications', path: '/admin/members/kyc' },
      { label: 'Wallet / Credits', path: '/admin/members/wallet' },
      { label: 'Commission / Referral Tree', path: '/admin/members/referrals' },
      { label: 'Top Earners', path: '/admin/members/top-earners' },
      { label: 'Members Activity Logs', path: '/admin/members/activity-logs' },
      { label: 'Exports', path: '/admin/members/exports' },
    ],
  },
  {
    id: 'orders', label: 'Orders', path: '/admin/orders', badge: 12,
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  },
  {
    id: 'interior-requests', label: 'Interior Requests', path: '/admin/interior-requests',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h3m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h6.586a2 2 0 011.414.586l3.414 3.414A2 2 0 0119 8.414V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    id: 'encashment', label: 'Encashment', sectionLabel: 'Finance',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    children: [
      { label: 'All Requests', path: '/admin/encashment' },
      { label: 'Queue / Pending', path: '/admin/encashment/pending' },
      { label: 'Ready for Release', path: '/admin/encashment/approved_by_admin' },
      { label: 'Released', path: '/admin/encashment/released' },
      { label: 'Rejected', path: '/admin/encashment/rejected' },
      { label: 'Failed Payouts', path: '/admin/encashment/failed' },
    ],
  },
  {
    id: 'accounting', label: 'Accounting',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-2.21 0-4 1.12-4 2.5S9.79 13 12 13s4 1.12 4 2.5S14.21 18 12 18s-4-1.12-4-2.5M12 6v12" /></svg>,
    children: [
      { label: 'Dashboard', path: '/admin/accounting' },
      { label: 'Release Center', path: '/admin/encashment/approved_by_admin' },
      { label: 'Disbursement History', path: '/admin/accounting/disbursement-history' },
      { label: 'Reconciliation', path: '/admin/accounting/reconciliation' },
      { label: 'Invoices', path: '/admin/accounting/invoices' },
      { label: 'Audit Trail', path: '/admin/accounting/audit' },
      { label: 'Reports', path: '/admin/accounting/reports' },
      { label: 'Settings', path: '/admin/accounting/settings' },
    ],
  },
  {
    id: 'finance', label: 'Finance Office',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v12m6-6H6M4 7h16M4 17h16" /></svg>,
    children: [
      { label: 'Dashboard', path: '/admin/finance' },
      { label: 'Wallet Check Queue', path: '/admin/encashment' },
      { label: 'Release Center', path: '/admin/encashment/approved_by_admin' },
      { label: 'Released', path: '/admin/encashment/released' },
      { label: 'Invoices', path: '/admin/accounting/invoices' },
      { label: 'Profit Simulation', path: '/admin/reports/profit-simulation' },
    ],
  },
  {
    id: 'reports', label: 'Reports',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    children: [
      { label: 'Sales Report', path: '/admin/reports/sales' },
      { label: 'Member Report', path: '/admin/reports/members' },
      { label: 'Product Report', path: '/admin/reports/products' },
      { label: 'Financial Report', path: '/admin/reports/financial' },
      { label: 'Profit Simulation', path: '/admin/reports/profit-simulation' },
    ],
  },
  {
    id: 'products', label: 'Products', sectionLabel: 'Catalog',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    children: [
      { label: 'All Products', path: '/admin/products' },
      { label: 'Categories', path: '/admin/products/categories' },
      { label: 'Brands', path: '/admin/products/brands' },
      { label: 'Inventory', path: '/admin/products/inventory' },
      { label: 'Reviews', path: '/admin/products/reviews' },
      { label: 'Import Image', path: '/admin/products/import-image' },
      { label: 'CSV Import Tutorial', path: '/admin/products/csv-import-tutorial' },
    ],
  },
  {
    id: 'shipping', label: 'Shipping',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>,
    children: [
      { label: 'Shipping Rates', path: '/admin/shipping/rates' },
      { label: 'Couriers', path: '/admin/shipping/couriers' },
      { label: 'Tracking', path: '/admin/shipping/tracking' },
    ],
  },
  {
    id: 'suppliers', label: 'Suppliers', path: '/admin/suppliers',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    id: 'inquiry', label: 'Inquiry', path: '/admin/inquiry', sectionLabel: 'System',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 8h10M7 12h6m-6 4h8M5 4h14a2 2 0 012 2v11a2 2 0 01-2 2H9l-4 3v-3H5a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>,
  },
  {
    id: 'project', label: 'Project', path: '/admin/project',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  },
  {
    id: 'webpages', label: 'Web Content',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>,
    children: [
      { label: 'Home', path: '/admin/webpages/home' },
      { label: 'Shop Builder', path: '/admin/webpages/shop-builder' },
      { label: 'DreamBuild', path: '/admin/webpages/dreambuild' },
      { label: 'Partner Storefronts', path: '/admin/webpages/partner-storefronts' },
      { label: 'Partner Users', path: '/admin/webpages/partner-users' },
      { label: 'Assembly Guides', path: '/admin/webpages/assembly-guides' },

      { label: 'Announcements', path: '/admin/webpages/announcements' },

      { label: 'Ads Content', path: '/admin/webpages/adds-content' },
      { label: 'Database', path: '/admin/webpages/database' },
    ],
  },
  {
    id: 'expenses', label: 'Expenses',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    children: [
      { label: 'All Expenses', path: '/admin/expenses' },
      { label: 'Categories', path: '/admin/expenses/categories' },
    ],
  },
  {
    id: 'payments', label: 'Payments',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    children: [
      { label: 'Transactions', path: '/admin/payments' },
      { label: 'E-Wallet', path: '/admin/payments/ewallet' },
      { label: 'Vouchers', path: '/admin/payments/giftcards' },
    ],
  },
  {
    id: 'settings', label: 'Settings',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    children: [
      { label: 'General', path: '/admin/settings/general' },
      { label: 'Users & Roles', path: '/admin/settings/users' },
      { label: 'Security', path: '/admin/settings/security' },
      { label: 'Notifications', path: '/admin/settings/notifications' },
      { label: 'Terms & Condition', path: '/admin/settings/terms-condition' },
    ],
  },
]

const ADMIN_VISIBLE_NAV_IDS = new Set([
  'dashboard',
  'chat',
  'email-blast',
  'orders',
  'interior-requests',
  'products',
  'shipping',
  'webpages',
  'inquiry',
  'settings',
])
const ADMIN_PERMISSION_NAV_IDS: Record<string, string> = {
  members: 'members',
  orders: 'orders',
  interior_requests: 'interior-requests',
  products: 'products',
  shipping: 'shipping',
  suppliers: 'suppliers',
  web_content: 'webpages',
  inquiry: 'inquiry',
  settings_users: 'settings',
}
const MERCHANT_VISIBLE_NAV_IDS = new Set([
  'dashboard',
  'orders',
  'products',
  'shipping',
])
const SUPPLIER_VISIBLE_NAV_IDS = new Set([
  'dashboard',
  'products',
  'suppliers',
])

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { data: session, update } = useSession()
  const [openMenus, setOpenMenus] = useState<string[]>([])
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutApi] = useLogoutMutation()
  const sessionRole = String(session?.user?.role ?? '').toLowerCase()
  const sessionUserLevelId = Number((session?.user as { userLevelId?: number } | undefined)?.userLevelId ?? 0)
  const sessionAdminPermissions = (session?.user as { adminPermissions?: string[] } | undefined)?.adminPermissions
  const rawSessionPermissions = useMemo(
    () => (sessionAdminPermissions ?? []).filter((permission): permission is string => typeof permission === 'string'),
    [sessionAdminPermissions],
  )
  const sessionPermissions = useMemo(() => normalizeAdminPermissions(rawSessionPermissions), [rawSessionPermissions])
  const sessionAccessToken = String((session?.user as { accessToken?: string } | undefined)?.accessToken ?? '')
  const adminIdentityKey = sessionAccessToken
    ? `${String((session?.user as { id?: string } | undefined)?.id ?? 'unknown')}:${sessionAccessToken}`
    : undefined
  const { data: adminMe, isLoading: isAdminMeLoading, isFetching: isAdminMeFetching } = useGetAdminMeQuery(adminIdentityKey, { skip: !sessionAccessToken })
  const orderCountQueryOptions = { skip: !sessionAccessToken }
  const { data: allOrdersData } = useGetAdminOrdersQuery({ filter: 'all', page: 1, perPage: 1 }, orderCountQueryOptions)
  const { data: membersStats } = useGetMembersStatsQuery(undefined, { skip: !sessionAccessToken })
  const resolvedAdminMe = adminMe
  const isRefreshingAdminIdentity = Boolean(sessionAccessToken) && !resolvedAdminMe && (isAdminMeLoading || isAdminMeFetching)
  const displayName = String(resolvedAdminMe?.name ?? session?.user?.name ?? '').trim() || (isRefreshingAdminIdentity ? 'Refreshing admin...' : 'Admin')
  const displayEmail = String(resolvedAdminMe?.email ?? session?.user?.email ?? '').trim()
  const displayUsername = String(resolvedAdminMe?.username ?? '').trim()
  const displayEmailText = displayEmail || (isRefreshingAdminIdentity ? 'Reloading profile details...' : (displayUsername ? `@${displayUsername}` : 'No email on file'))
  const effectiveRole = String(resolvedAdminMe?.role ?? sessionRole).toLowerCase()
  const effectiveUserLevelId = Number(resolvedAdminMe?.user_level_id ?? sessionUserLevelId)
  const isSuperAdmin = effectiveRole === 'super_admin' || effectiveUserLevelId === 1
  const isAdmin = effectiveRole === 'admin' || effectiveUserLevelId === 2
  const isWebContent = effectiveRole === 'web_content' || effectiveUserLevelId === 4
  const isAccounting = effectiveRole === 'accounting' || effectiveUserLevelId === 5
  const isFinanceOfficer = effectiveRole === 'finance_officer' || effectiveUserLevelId === 6
  const isMerchantAdmin = effectiveRole === 'merchant_admin' || effectiveUserLevelId === 7
  const isSupplierAdmin = effectiveRole === 'supplier_admin' || effectiveUserLevelId === 8
  const isAdminPortalRole = isSuperAdmin || isAdmin || isWebContent || isAccounting || isFinanceOfficer || isMerchantAdmin || isSupplierAdmin
  const rawEffectivePermissions = ((resolvedAdminMe?.admin_permissions ?? rawSessionPermissions) as string[])
    .filter((permission): permission is string => typeof permission === 'string')
  const effectiveAdminPermissions = normalizeAdminPermissions(rawEffectivePermissions)
  const webContentPermissions = rawEffectivePermissions.filter((permission) => permission.startsWith('wc:'))
  const adminPermissions = effectiveAdminPermissions
  const hasCustomAdminPermissions = isAdmin && adminPermissions.length > 0
  const customAdminNavIds = new Set(['dashboard', ...adminPermissions.map((permission) => ADMIN_PERMISSION_NAV_IDS[permission]).filter(Boolean)])
  const canManageAdminUsers = isSuperAdmin || isAdmin
  const displayRole = isSuperAdmin
    ? 'Super Admin'
    : isAccounting
    ? 'Accounting'
    : isFinanceOfficer
      ? 'Finance Officer'
      : isMerchantAdmin
        ? 'Merchant Admin'
        : isSupplierAdmin
          ? 'Supplier Admin'
      : formatRole(resolvedAdminMe?.role)
  const displayInitials = getInitials(displayName)
  const avatarSrc = resolvedAdminMe?.avatar_url || session?.user?.image

  useEffect(() => {
    if (!adminMe || !isAdminPortalRole) return

    const sessionLevel = Number((session?.user as { userLevelId?: number } | undefined)?.userLevelId ?? 0)
    const sessionId = String((session?.user as { id?: string | number } | undefined)?.id ?? '')
    const adminMeId = String(adminMe.id ?? '')
    if (sessionId && adminMeId && sessionId !== adminMeId) {
      // Do not overwrite the current session with a different admin identity.
      return
    }
    const latestRawPermissions = (adminMe.admin_permissions ?? [])
      .filter((permission): permission is string => typeof permission === 'string')
    const latestPermissions = Number(adminMe.user_level_id ?? 0) === 4
      ? latestRawPermissions
      : normalizeAdminPermissions(latestRawPermissions)
    const latestStorefrontIds = Array.isArray((adminMe as { storefront_ids?: number[] }).storefront_ids)
      ? ((adminMe as { storefront_ids?: number[] }).storefront_ids ?? [])
      : []

    const roleChanged = sessionRole !== String(adminMe.role ?? '').toLowerCase()
    const levelChanged = sessionLevel !== Number(adminMe.user_level_id ?? 0)
    const currentSessionPermissions = Number(adminMe.user_level_id ?? 0) === 4
      ? rawSessionPermissions
      : sessionPermissions
    const permissionsChanged = currentSessionPermissions.join('|') !== latestPermissions.join('|')
    const storefrontsChanged = ((session?.user as { storefrontIds?: number[] } | undefined)?.storefrontIds ?? []).join('|') !== latestStorefrontIds.join('|')

    if (!roleChanged && !levelChanged && !permissionsChanged && !storefrontsChanged) return

    void update({
      role: adminMe.role,
      userLevelId: adminMe.user_level_id,
      adminPermissions: latestPermissions,
      storefrontIds: latestStorefrontIds,
      supplierId: adminMe.supplier_id ?? null,
    })
  }, [adminMe, isAdminPortalRole, rawSessionPermissions, session?.user, sessionPermissions, sessionRole, update])

  const toggleMenu = (id: string) =>
    setOpenMenus(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const isPartnerRoute = pathname.startsWith('/partner')
    const loginPath = isPartnerRoute ? '/partner/login' : '/admin/login'
    dispatch(baseApi.util.resetApiState())
    clearAccessTokenCache()
    await clearAdminSession(loginPath)
    void logoutApi().unwrap().catch((error) => {
      console.log(error)
    })
    void signOut({ callbackUrl: loginPath })
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`)
  const isChildActive = (children?: SubItem[]) => Boolean(children?.some((c) => pathname === c.path))
  const isExactActive = (path: string) => pathname === path

  const visibleNavItems = navItems
    .map((item) => {
      if (item.id === 'members') {
        return {
          ...item,
          badge: membersStats?.total ?? 0,
        }
      }

      if (item.id === 'orders') {
        return {
          ...item,
          badge: allOrdersData?.meta.total ?? 0,
        }
      }

      if (item.id === 'settings') {
        const settingsChildren = (item.children ?? []).filter((child) => {
          if (child.path === '/admin/settings/users') {
            return canManageAdminUsers
          }
          return !isMerchantAdmin && !isSupplierAdmin && !isAccounting && !isFinanceOfficer
        })

        if (hasCustomAdminPermissions) {
          const permissionScopedChildren = settingsChildren.filter((child) => child.path === '/admin/settings/users')
          return permissionScopedChildren.length > 0 ? { ...item, children: permissionScopedChildren } : null
        }

        return settingsChildren.length > 0 ? { ...item, children: settingsChildren } : null
      }

      if (item.id === 'webpages' && isWebContent) {
        const children = (item.children ?? []).filter((child) => {
          if (child.path === '/admin/webpages/shop-builder') {
            return canAccessWebContentSection(webContentPermissions, 'wc:shop-builder')
          }
          if (child.path === '/admin/webpages/dreambuild') {
            return canAccessWebContentSection(webContentPermissions, 'wc:dreambuild')
          }
          if (child.path === '/admin/webpages/partner-storefronts' || child.path === '/admin/webpages/partner-users') {
            return canAccessWebContentSection(webContentPermissions, 'wc:partner-storefronts')
          }
          return webContentPermissions.length === 0
        })
        return children.length > 0 ? { ...item, children } : null
      }
      return item
    })
    .filter((item): item is NavItem => Boolean(item))
    .filter((item) => {
    if (isWebContent) return item.id === 'webpages'
    if (isSuperAdmin) return true
    if (isAccounting) return item.id === 'accounting' || item.id === 'encashment'
    if (isFinanceOfficer) return item.id === 'finance'
    if (isMerchantAdmin) return MERCHANT_VISIBLE_NAV_IDS.has(item.id)
    if (isSupplierAdmin) return SUPPLIER_VISIBLE_NAV_IDS.has(item.id)
    if (isAdmin) return hasCustomAdminPermissions ? customAdminNavIds.has(item.id) : ADMIN_VISIBLE_NAV_IDS.has(item.id)
    return true
  })

  useEffect(() => {
    const criticalRoutes = isSupplierAdmin
      ? [
          '/admin/dashboard',
          '/admin/products',
          '/admin/suppliers',
        ]
      : isMerchantAdmin
        ? [
            '/admin/dashboard',
            '/admin/orders',
            '/admin/products',
            '/admin/shipping/rates',
          ]
      : isAdmin
      ? [
          '/admin/dashboard',
          ...(hasCustomAdminPermissions && adminPermissions.includes('members') ? ['/admin/members'] : []),
          ...(hasCustomAdminPermissions && adminPermissions.includes('orders') ? ['/admin/orders'] : ['/admin/orders']),
          ...(hasCustomAdminPermissions && adminPermissions.includes('interior_requests') ? ['/admin/interior-requests'] : ['/admin/interior-requests']),
          ...(hasCustomAdminPermissions && adminPermissions.includes('products') ? ['/admin/products', '/admin/products/categories'] : ['/admin/products', '/admin/products/categories']),
          ...(isWebContent ? ['/admin/webpages'] : []),
          ...(hasCustomAdminPermissions && adminPermissions.includes('settings_users') ? ['/admin/settings/users'] : []),
        ]
      : isWebContent
      ? [
          '/admin/webpages',
        ]
      : [
          '/admin/dashboard',
          '/admin/interior-requests',
          '/admin/members',
          '/admin/products',
          '/admin/products/categories',
        ]
    criticalRoutes.forEach((route) => router.prefetch(route))
  }, [adminPermissions, hasCustomAdminPermissions, isAdmin, isMerchantAdmin, isSuperAdmin, isSupplierAdmin, isWebContent, router])

  const prefetchMembersData = () => {
    dispatch(
      membersApi.endpoints.getMembers.initiate(
        { page: 1, perPage: 25 },
        { subscribe: false, forceRefetch: false }
      )
    )
    dispatch(
      membersApi.endpoints.getMembersStats.initiate(undefined, {
        subscribe: false,
        forceRefetch: false,
      })
    )
  }

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed top-0 left-0 h-[100dvh] z-30 flex flex-col
        bg-white/95 dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-700/50 backdrop-blur-xl
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'w-16' : 'w-64'}
        lg:translate-x-0 lg:sticky lg:top-0
      `}>
        {/* Logo */}
        <div className={`flex items-center h-16 px-3 border-b border-slate-200/80 dark:border-slate-700/50 shrink-0 ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-cyan-50 ring-1 ring-slate-200 dark:bg-transparent dark:ring-0">
            <Image
              src="/af_home_logo.png"
              alt="AF Home"
              fill
              className="object-contain"
              priority
            />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 dark:text-white font-bold text-sm leading-none whitespace-nowrap">AF Home</p>
              <p className="text-teal-600 dark:text-teal-400 text-xs mt-0.5">{displayRole}</p>
            </div>
          )}
          {!isCollapsed && (
            <button onClick={onToggleCollapse} className="hidden lg:flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" /></svg>
            </button>
          )}
          {isCollapsed && (
            <button onClick={onToggleCollapse} className="hidden lg:flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors absolute right-1 top-4">
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" /></svg>
            </button>
          )}
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white ml-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
          {visibleNavItems.map((item) => {
            const hasChildren = !!item.children?.length
            const childActive = isChildActive(item.children)
            const active = item.id === 'finance'
              ? pathname === '/admin/finance'
              : item.path
                ? isActive(item.path)
                : childActive
            const exactActive = item.path ? isExactActive(item.path) : false
            const menuOpen = isAccounting || isFinanceOfficer ? true : openMenus.includes(item.id) || childActive || exactActive

            return (
              <div key={item.id}>
                {!isCollapsed && item.sectionLabel && (
                  <div className={`flex items-center gap-2 px-2 pb-1.5 ${visibleNavItems[0]?.id === item.id ? 'pt-1' : 'pt-4'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{item.sectionLabel}</span>
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700/60" />
                  </div>
                )}
                {hasChildren ? (
                  <button
                    onClick={() => !isCollapsed && !isAccounting && !isFinanceOfficer && toggleMenu(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group relative
                      ${active
                      ? 'bg-sky-500 text-white dark:bg-sky-600 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    <span className={`shrink-0 flex items-center justify-center h-7 w-7 rounded-lg transition-colors ${active ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}`}>{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left font-medium">{item.label}</span>
                        {typeof item.badge === 'number' && item.badge > 0 && (
                          <span className="bg-sky-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center">
                            {item.badge}
                          </span>
                        )}
                        {!isAccounting && !isFinanceOfficer && (
                          <svg className={`w-4 h-4 shrink-0 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        )}
                      </>
                    )}
                    {isCollapsed && (
                      <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700">{item.label}</span>
                    )}
                  </button>
                ) : (
                  <Link href={item.path ?? '#'} prefetch onClick={() => isOpen && onClose()}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group relative
                      ${active
                        ? 'bg-sky-500 text-white dark:bg-sky-600 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    <span className={`shrink-0 flex items-center justify-center h-7 w-7 rounded-lg transition-colors ${active ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}`}>{item.icon}</span>
                    {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    {isCollapsed && (
                      <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700">{item.label}</span>
                    )}
                  </Link>
                )}

                {/* Submenu */}
                {hasChildren && !isCollapsed && (
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1 ml-2 space-y-0.5 py-1">
                          {item.children?.map((child) => (
                            <Link
                              key={child.path}
                              href={child.path}
                              prefetch
                              onMouseEnter={() => child.path === '/admin/members' && prefetchMembersData()}
                              onClick={() => {
                                if (child.path === '/admin/members') prefetchMembersData()
                                if (isOpen) onClose()
                              }}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200 border-l-2
                                ${isExactActive(child.path)
                                  ? 'border-sky-500 text-sky-700 dark:text-sky-300 font-semibold bg-sky-50 dark:bg-sky-900/20'
                                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70'}
                              `}
                            >
                              <span className="flex-1 truncate">{child.label}</span>
                              {typeof child.badge === 'number' && child.badge > 0 && (
                                <span className={`${isExactActive(child.path)
                                  ? 'inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:border-sky-900/50 dark:bg-sky-900/30 dark:text-sky-300'
                                  : 'min-w-[20px] rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-center bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                  {child.badge}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className={`shrink-0 p-3 border-t border-slate-200/80 dark:border-slate-700/50`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-2xl bg-gradient-to-br from-slate-50 to-white ring-1 ring-slate-200 shadow-sm dark:from-slate-800 dark:to-slate-800 dark:ring-slate-700/70 dark:shadow-none">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-xs">{displayInitials}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 dark:text-white text-xs font-semibold truncate">{displayName}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs truncate">{displayEmailText}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 w-full disabled:opacity-60 ${isCollapsed ? 'justify-center' : ''}`}
          >
            {isLoggingOut
              ? <svg className="w-5 h-5 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            }
            {!isCollapsed && <span className="font-medium">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
