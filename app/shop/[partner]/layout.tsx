import type { Metadata } from 'next'
import { getPartnerStorefrontBySlug, getPartnerStorefrontRecordBySlug } from '@/libs/partnerStorefrontServer'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { partnerAuthOptions } from '@/libs/partnerAuth'
import { adminAuthOptions } from '@/libs/adminAuth'

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ partner: string }>
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { partner } = await params
  const normalizedPartner = String(partner ?? '').trim().toLowerCase()
  const storefront = await getPartnerStorefrontBySlug(normalizedPartner)
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL

  const rawIconUrl = storefront?.tabLogoUrl || storefront?.logoUrl || ''
  const iconUrl = (() => {
    const value = String(rawIconUrl).trim()
    if (!value) return undefined
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) return value
    if (!apiUrl) return value.startsWith('/') ? value : `/${value}`
    return `${apiUrl.replace(/\/$/, '')}/${value.replace(/^\/+/, '')}`
  })()
  if (!iconUrl) return {}

  return {
    icons: {
      icon: iconUrl,
      apple: iconUrl,
      shortcut: iconUrl,
    },
  }
}

export default async function PartnerShopLayout({ children, params }: LayoutProps) {
  const { partner } = await params
  const normalizedPartner = String(partner ?? '').trim().toLowerCase()
  const adminSession = await getServerSession(adminAuthOptions)
  if (adminSession?.user) {
    return children
  }

  const session = await getServerSession(partnerAuthOptions)
  const user = session?.user

  if (user) {
    const normalizedRole = String((user as { role?: string } | undefined)?.role ?? '').trim().toLowerCase()
    const userLevelId = Number((user as { userLevelId?: number } | undefined)?.userLevelId ?? 0)
    const isAdminByRole = normalizedRole === 'super_admin' || normalizedRole === 'admin' || normalizedRole === 'web_content'
    const isAdminByLevel = userLevelId === 1 || userLevelId === 2

    if (isAdminByRole || isAdminByLevel) {
      return children
    }

    const record = await getPartnerStorefrontRecordBySlug(normalizedPartner, { fresh: true })
    if (record) {
      const assignedStorefrontIds = (user.storefrontIds ?? [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id))
      const disabledStorefrontIds = (user.disabledStorefrontIds ?? [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id))

      const isAssigned = assignedStorefrontIds.includes(record.id)
      const isDisabled = disabledStorefrontIds.includes(record.id)

      if (!isAssigned || isDisabled) {
        redirect(`/unauthorized?store=${encodeURIComponent(record.config.displayName)}`)
      }
    }
  }

  return children
}
