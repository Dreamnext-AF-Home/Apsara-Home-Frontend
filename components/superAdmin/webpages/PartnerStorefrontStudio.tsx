'use client'

import type { ReactNode } from 'react'
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import { getPartnerStorefrontConfig, parseIdList } from '@/libs/partnerStorefront'
import { Loader2, Trash2 } from 'lucide-react'
import { useGetCategoriesQuery } from '@/store/api/categoriesApi'
import { type Product, useLazyGetProductsQuery, useLazyGetPublicProductQuery } from '@/store/api/productsApi'
import { useDeletePartnerUserMutation, useGetPartnerUsersQuery } from '@/store/api/partnerUsersApi'

import {
  useCreateAdminWebPageItemMutation,
  useDeleteAdminWebPageItemMutation,
  useGetAdminWebPageItemsQuery,
  useUpdateAdminWebPageItemMutation,
  type WebPageItem,
} from '@/store/api/webPagesApi'

type DraftState = {
  id?: number
  slug: string
  displayName: string
  heroTitle: string
  heroSubtitle: string
  logoUrl: string
  tabLogoUrl: string
  heroVideoUrl: string
  logoVersion: string
  referralLink: string
  themeColor: string
  accentColor: string
  notificationEmail: string
  domainLink: string
  allowedCategoryIds: number[]
  featuredProductIds: number[]
  enableAiSupport: boolean
  enableActivateDiscount: boolean
}


const emptyDraft: DraftState = {
  slug: '',
  displayName: '',
  heroTitle: '',
  heroSubtitle: '',
  logoUrl: '',
  tabLogoUrl: '',
  heroVideoUrl: '',
  logoVersion: '',
  referralLink: '',
  themeColor: '#0f766e',
  accentColor: '#f97316',
  notificationEmail: '',
  domainLink: '',
  allowedCategoryIds: [],
  featuredProductIds: [],
  enableAiSupport: false,
  enableActivateDiscount: false,
}


const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const toDraft = (item?: WebPageItem): DraftState => {
  const config = getPartnerStorefrontConfig(item)
  if (!config || !item) return emptyDraft
  return {
    id: item.id,
    slug: config.slug,
    displayName: config.displayName,
    heroTitle: config.heroTitle,
    heroSubtitle: config.heroSubtitle,
    logoUrl: config.logoUrl ?? '',
    tabLogoUrl: config.tabLogoUrl ?? '',
    heroVideoUrl: config.heroVideoUrl ?? '',
    logoVersion: config.logoVersion ?? '',
    referralLink: config.referralLink ?? '',
    themeColor: config.themeColor,
    accentColor: config.accentColor,
    notificationEmail: config.notificationEmail,
    domainLink: config.domainLink,
    allowedCategoryIds: config.allowedCategoryIds,
    featuredProductIds: config.featuredProductIds,
    enableAiSupport: config.enableAiSupport,
    enableActivateDiscount: config.enableActivateDiscount,
  }
}


const panelClass =
  'rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/20'

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/70 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/30'

const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium leading-6 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/70 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/30'

const softCardClass =
  'rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/70'

const broadcastStorefrontUpdate = (slug: string) => {
  if (typeof window === 'undefined') return
  const normalizedSlug = String(slug ?? '').trim().toLowerCase()
  if (!normalizedSlug) return
  const payload = { slug: normalizedSlug, ts: Date.now() }
  window.localStorage.setItem('afhome:partner-storefront-updated', JSON.stringify(payload))
  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel('afhome:partner-storefront')
    channel.postMessage(payload)
    channel.close()
  }
}

export default function PartnerStorefrontStudio() {
  const [selectedId, setSelectedId] = useState<number | 'new'>('new')
  const [draft, setDraft] = useState<DraftState>(emptyDraft)
  const [discountToggleByStorefrontId, setDiscountToggleByStorefrontId] = useState<Record<number, boolean>>({})
  const [helperCategoryId, setHelperCategoryId] = useState<number | ''>('')
  const [selectedProductsCategoryFilter, setSelectedProductsCategoryFilter] = useState<number | 'all'>('all')
  const [helperProducts, setHelperProducts] = useState<Product[]>([])
  const [helperProductById, setHelperProductById] = useState<Record<number, Product>>({})
  const [isLoadingHelperProducts, setIsLoadingHelperProducts] = useState(false)
  const [logoVersion, setLogoVersion] = useState(0)
  const missingSelectedProductRequestIdsRef = useRef<Set<number>>(new Set())
  const { data: session } = useSession()

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean
    item?: WebPageItem
    displayName?: string
  }>({ open: false })

  const sessionRole = String(session?.user?.role ?? '').toLowerCase()
  const sessionUserLevelId = Number((session?.user as { userLevelId?: number } | undefined)?.userLevelId ?? 0)
  const storefrontIds = (session?.user as { storefrontIds?: number[] } | undefined)?.storefrontIds ?? []
  const isPartnerScoped = sessionUserLevelId === 4 || sessionRole === 'web_content'
  const canManageAiSupport = sessionUserLevelId === 1 || sessionUserLevelId === 2 || sessionRole === 'super_admin' || sessionRole === 'admin'
  // Only restrict to specific IDs when some are explicitly assigned; empty = full access (same pattern as wc: permissions)
  const validStorefrontIds = storefrontIds.filter((id) => Number.isInteger(id) && id > 0)
  const hasSpecificStorefrontIds = isPartnerScoped && validStorefrontIds.length > 0
  const allowedStorefrontIds = useMemo(
    () => (hasSpecificStorefrontIds ? validStorefrontIds : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasSpecificStorefrontIds, storefrontIds],
  )
  const { data, isLoading, isError, refetch } = useGetAdminWebPageItemsQuery(
    {
      type: 'partner-storefront',
      page: 1,
      perPage: 100,
      status: 'all',
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    },
  )
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploadingTabLogo, setIsUploadingTabLogo] = useState(false)
  const tabLogoInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploadingHeroVideo, setIsUploadingHeroVideo] = useState(false)
  const [isUploadingReferralLink, setIsUploadingReferralLink] = useState(false)
  const heroVideoInputRef = useRef<HTMLInputElement | null>(null)
  const { data: categoriesData } = useGetCategoriesQuery({ per_page: 200 })
  const [fetchProducts] = useLazyGetProductsQuery()
  const [fetchPublicProduct] = useLazyGetPublicProductQuery()
  const [createItem, { isLoading: isCreating }] = useCreateAdminWebPageItemMutation()
  const [updateItem, { isLoading: isUpdating }] = useUpdateAdminWebPageItemMutation()
  const [deleteItem, { isLoading: isDeleting }] = useDeleteAdminWebPageItemMutation()
  const [deletePartnerUser, { isLoading: isDeletingPartnerUser }] = useDeletePartnerUserMutation()
  const storefrontDeleteTargetId = deleteModal.open ? Number(deleteModal.item?.id ?? 0) : 0
  const { data: relatedPartnerUsersData } = useGetPartnerUsersQuery(
    storefrontDeleteTargetId > 0
      ? { storefrontId: storefrontDeleteTargetId, page: 1, perPage: 200 }
      : undefined,
    {
      skip: storefrontDeleteTargetId <= 0,
      refetchOnMountOrArgChange: true,
    },
  )

  const storefronts = useMemo(() => {
    const items = (data?.items ?? [])
      .map((item) => ({
        item,
        config: getPartnerStorefrontConfig(item),
      }))
      .filter((entry): entry is { item: WebPageItem; config: NonNullable<ReturnType<typeof getPartnerStorefrontConfig>> } => Boolean(entry.config))

    const scoped = hasSpecificStorefrontIds
      ? items.filter((entry) => allowedStorefrontIds.includes(entry.item.id))
      : items

    return scoped.sort((a, b) => a.config.displayName.localeCompare(b.config.displayName))
  }, [data?.items, allowedStorefrontIds, hasSpecificStorefrontIds])

  const categories = categoriesData?.categories ?? []
  const allowedCategoryOptions = useMemo(
    () => categories.filter((category) => draft.allowedCategoryIds.includes(category.id)),
    [categories, draft.allowedCategoryIds],
  )
  const selectedProducts = useMemo(
    () => draft.featuredProductIds.map((id) => helperProductById[id]).filter((product): product is Product => Boolean(product)),
    [draft.featuredProductIds, helperProductById],
  )
  const missingSelectedProductIds = useMemo(
    () => draft.featuredProductIds.filter((id) => !helperProductById[id]),
    [draft.featuredProductIds, helperProductById],
  )
  const selectedProductCategoryOptions = useMemo(
    () =>
      Array.from(new Set(selectedProducts.map((product) => product.catid))).map((categoryId) => ({
        id: categoryId,
        label: categories.find((category) => category.id === categoryId)?.name ?? `Category ${categoryId}`,
      })),
    [selectedProducts, categories],
  )
  const filteredSelectedProducts = useMemo(
    () =>
      selectedProductsCategoryFilter === 'all'
        ? selectedProducts
        : selectedProducts.filter((product) => product.catid === selectedProductsCategoryFilter),
    [selectedProducts, selectedProductsCategoryFilter],
  )
  const filteredMissingSelectedProductIds = useMemo(
    () => (selectedProductsCategoryFilter === 'all' ? missingSelectedProductIds : []),
    [missingSelectedProductIds, selectedProductsCategoryFilter],
  )

  const selectStorefront = (item?: WebPageItem) => {
    if (!item) {
      setSelectedId('new')
      setDraft(emptyDraft)
      setLogoVersion(Date.now())
      if (logoInputRef.current) {
        logoInputRef.current.value = ''
      }
      if (tabLogoInputRef.current) {
        tabLogoInputRef.current.value = ''
      }
      if (heroVideoInputRef.current) {
        heroVideoInputRef.current.value = ''
      }
      return
    }

    setSelectedId(item.id)
    setDraft(toDraft(item))
    const storedVersion = Number.parseInt(toDraft(item).logoVersion || '', 10)
    setLogoVersion(Number.isFinite(storedVersion) ? storedVersion : Date.now())
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
    if (tabLogoInputRef.current) {
      tabLogoInputRef.current.value = ''
    }
    if (heroVideoInputRef.current) {
      heroVideoInputRef.current.value = ''
    }
  }

  const getProductIdsByCategory = async (categoryId: number) => {
    const perPage = 200
    const firstPage = await fetchProducts({
      page: 1,
      perPage,
      catId: categoryId,
    }).unwrap()

    let allProducts = [...(firstPage.products ?? [])]
    const lastPage = Number(firstPage.meta?.last_page ?? 1)

    for (let page = 2; page <= lastPage; page += 1) {
      const nextPage = await fetchProducts({
        page,
        perPage,
        catId: categoryId,
      }).unwrap()
      allProducts = [...allProducts, ...(nextPage.products ?? [])]
    }

    return new Set(allProducts.map((product) => product.id))
  }

  const toggleCategory = async (categoryId: number) => {
    const isCurrentlySelected = draft.allowedCategoryIds.includes(categoryId)
    const nextAllowedCategoryIds = isCurrentlySelected
      ? draft.allowedCategoryIds.filter((id) => id !== categoryId)
      : [...draft.allowedCategoryIds, categoryId]

    let nextFeaturedProductIds = draft.featuredProductIds

    if (isCurrentlySelected && draft.featuredProductIds.length > 0) {
      try {
        const categoryProductIdSet = await getProductIdsByCategory(categoryId)
        nextFeaturedProductIds = draft.featuredProductIds.filter((id) => !categoryProductIdSet.has(id))
      } catch {
        showErrorToast('Failed to filter selected products for this category.')
      }
    }

    const nextDraft = {
      ...draft,
      allowedCategoryIds: nextAllowedCategoryIds,
      featuredProductIds: nextFeaturedProductIds,
    }

    setDraft(nextDraft)

    if (typeof selectedId === 'number') {
      const payload = buildStorefrontPayload(nextDraft)
      updateItem({ type: 'partner-storefront', id: selectedId, data: payload })
        .unwrap()
        .then(() => {
          broadcastStorefrontUpdate(nextDraft.slug)
          refetch()
        })
        .catch(() => {
          showErrorToast('Failed to update categories.')
        })
    }
  }

  const buildStorefrontPayload = (nextDraft: DraftState) => {
    const slug = toSlug(nextDraft.slug || nextDraft.displayName)
    return {
      key: slug,
      title: nextDraft.displayName.trim() || slug,
      subtitle: nextDraft.heroTitle.trim() || `${nextDraft.displayName.trim() || slug} Shop`,
      body: nextDraft.heroSubtitle.trim(),
      image_url: nextDraft.logoUrl.trim() || undefined,
      is_active: true,
      payload: {
          fields: {
          slug,
          display_name: nextDraft.displayName.trim(),

          hero_title: nextDraft.heroTitle.trim(),
          hero_subtitle: nextDraft.heroSubtitle.trim(),
          logo_url: nextDraft.logoUrl.trim(),
          tab_logo_url: nextDraft.tabLogoUrl.trim(),
          hero_video_url: nextDraft.heroVideoUrl.trim(),
          logo_version: nextDraft.logoVersion.trim(),
          referral_link: nextDraft.referralLink.trim(),
          theme_color: nextDraft.themeColor.trim(),
          accent_color: nextDraft.accentColor.trim(),
          notification_email: nextDraft.notificationEmail.trim(),
          domain_link: nextDraft.domainLink.trim(),
          allowed_category_ids: nextDraft.allowedCategoryIds.length > 0 ? nextDraft.allowedCategoryIds.join(',') : '0',
          featured_product_ids: nextDraft.featuredProductIds.length > 0 ? nextDraft.featuredProductIds.join(',') : '0',
          enable_ai_support: nextDraft.enableAiSupport ? '1' : '0',
          activate_discount: nextDraft.enableActivateDiscount ? '1' : '0',

        },
      },
    }
  }

  const toggleFeaturedProduct = (productId: number) => {
    setDraft((current) => {
      const nextFeaturedProductIds = current.featuredProductIds.includes(productId)
        ? current.featuredProductIds.filter((id) => id !== productId)
        : [...current.featuredProductIds, productId]
      const nextDraft = { ...current, featuredProductIds: nextFeaturedProductIds }

      if (typeof selectedId === 'number') {
        if (hasSpecificStorefrontIds && !allowedStorefrontIds.includes(selectedId)) {
          showErrorToast('You do not have access to edit this storefront.')
          return current
        }

        const payload = buildStorefrontPayload(nextDraft)
        updateItem({ type: 'partner-storefront', id: selectedId, data: payload })
          .unwrap()
          .then(() => {
            broadcastStorefrontUpdate(nextDraft.slug)
            refetch()
          })
          .catch(() => {
            showErrorToast('Failed to update selected products.')
          })
      }

      return nextDraft
    })
  }

  const handleDeleteStorefront = async (item: WebPageItem, displayName: string) => {
    if (isPartnerScoped) {
      showErrorToast('Only admin users can delete partner storefronts.')
      return
    }

    setDeleteModal({ open: true, item, displayName })
  }

  const confirmDeleteStorefrontNow = async () => {
    if (!deleteModal.item) return

    const item = deleteModal.item
    const displayName = deleteModal.displayName ?? ''

    try {
      const relatedUsers = (relatedPartnerUsersData?.users ?? []).filter((user) =>
        (user.storefront_ids ?? []).includes(item.id),
      )
      for (const user of relatedUsers) {
        await deletePartnerUser({ id: user.id }).unwrap()
      }

      await deleteItem({ type: 'partner-storefront', id: item.id }).unwrap()
      showSuccessToast(
        relatedUsers.length > 0
          ? (displayName
              ? `Partner storefront "${displayName}" deleted with ${relatedUsers.length} related partner user account(s).`
              : `Partner storefront deleted with ${relatedUsers.length} related partner user account(s).`)
          : (displayName ? `Partner storefront "${displayName}" deleted.` : 'Partner storefront deleted.'),
      )

      if (selectedId === item.id) {
        setSelectedId('new')
        setDraft(emptyDraft)
      }

      setDeleteModal({ open: false })
      await refetch()
    } catch (error) {
      const apiErr = error as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to delete storefront and related partner users.')
      setDeleteModal({ open: false })
    }
  }



  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const payload = new FormData()
    payload.append('file', file)
    payload.append('folder', 'partner-storefronts')

    setIsUploadingLogo(true)

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: payload,
      })

      const result = (await response.json()) as { url?: string; error?: string }

      if (!response.ok || !result.url) {
        throw new Error(result.error || 'Failed to upload logo.')
      }

      const nextLogoUrl = result.url ?? ''
      const nextVersion = Date.now()
      const nextDraft = { ...draft, logoUrl: nextLogoUrl, logoVersion: String(nextVersion) }
      const targetId = typeof selectedId === 'number' ? selectedId : nextDraft.id

      setDraft((current) => ({
        ...current,
        logoUrl: nextLogoUrl || current.logoUrl,
        logoVersion: String(nextVersion),
      }))
      setLogoVersion(nextVersion)

      if (targetId) {
        if (hasSpecificStorefrontIds && !allowedStorefrontIds.includes(targetId)) {
          showErrorToast('You do not have access to edit this storefront.')
          return
        }

        const slug = toSlug(nextDraft.slug || nextDraft.displayName)
        if (!slug) {
          showErrorToast('Add a slug or display name first.')
          return
        }

        const payload = buildStorefrontPayload(nextDraft)

        try {
          await updateItem({ type: 'partner-storefront', id: targetId, data: payload }).unwrap()
          showSuccessToast('Logo saved to storefront.')
          refetch()
        } catch (error) {
          const apiErr = error as { data?: { message?: string } }
          showErrorToast(apiErr?.data?.message || 'Failed to save logo.')
        }
      } else {
        showSuccessToast('Logo uploaded successfully.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload logo.'
      showErrorToast(message)
    } finally {
      setIsUploadingLogo(false)
      if (logoInputRef.current) {
        logoInputRef.current.value = ''
      }
    }
  }

  const handleRemoveLogo = async () => {
    if (typeof selectedId !== 'number') {
      setDraft((current) => ({ ...current, logoUrl: '', logoVersion: '' }))
      showSuccessToast('Logo cleared. Click "Save Storefront" to apply it.')
      return
    }

    if (hasSpecificStorefrontIds && !allowedStorefrontIds.includes(selectedId)) {
      showErrorToast('You do not have access to edit this storefront.')
      return
    }

    const nextVersion = Date.now()
    const slug = toSlug(draft.slug || draft.displayName)
    if (!slug) {
      showErrorToast('Add a slug or display name first.')
      return
    }

    const payload = buildStorefrontPayload({
      ...draft,
      logoUrl: '',
      logoVersion: String(nextVersion),
    })

    try {
      await updateItem({ type: 'partner-storefront', id: selectedId, data: payload }).unwrap()
      setDraft((current) => ({ ...current, logoUrl: '', logoVersion: String(nextVersion) }))
      setLogoVersion(nextVersion)
      showSuccessToast('Logo removed.')
      refetch()
    } catch (error) {
      const apiErr = error as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to remove logo.')
    }
  }

  const handleTabLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const payload = new FormData()
    payload.append('file', file)
    payload.append('folder', 'partner-storefronts')

    setIsUploadingTabLogo(true)

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: payload,
      })

      const result = (await response.json()) as { url?: string; error?: string }

      if (!response.ok || !result.url) {
        throw new Error(result.error || 'Failed to upload tab logo.')
      }

      const nextTabLogoUrl = result.url ?? ''
      const nextVersion = Date.now()
      const nextDraft = { ...draft, tabLogoUrl: nextTabLogoUrl, logoVersion: String(nextVersion) }
      const targetId = typeof selectedId === 'number' ? selectedId : nextDraft.id

      setDraft((current) => ({
        ...current,
        tabLogoUrl: nextTabLogoUrl || current.tabLogoUrl,
        logoVersion: String(nextVersion),
      }))
      setLogoVersion(nextVersion)

      if (targetId) {
        if (isPartnerScoped && !allowedStorefrontIds.includes(targetId)) {
          showErrorToast('You do not have access to edit this storefront.')
          return
        }

        const slug = toSlug(nextDraft.slug || nextDraft.displayName)
        if (!slug) {
          showErrorToast('Add a slug or display name first.')
          return
        }

        const data = buildStorefrontPayload(nextDraft)

        try {
          await updateItem({ type: 'partner-storefront', id: targetId, data }).unwrap()
          showSuccessToast('Tab logo saved to storefront.')
          refetch()
        } catch (error) {
          const apiErr = error as { data?: { message?: string } }
          showErrorToast(apiErr?.data?.message || 'Failed to save tab logo.')
        }
      } else {
        showSuccessToast('Tab logo uploaded successfully.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload tab logo.'
      showErrorToast(message)
    } finally {
      setIsUploadingTabLogo(false)
      if (tabLogoInputRef.current) {
        tabLogoInputRef.current.value = ''
      }
    }
  }

  const handleRemoveTabLogo = async () => {
    if (typeof selectedId !== 'number') {
      setDraft((current) => ({ ...current, tabLogoUrl: '', logoVersion: '' }))
      showSuccessToast('Tab logo cleared. Click "Save Storefront" to apply it.')
      return
    }

    if (isPartnerScoped && !allowedStorefrontIds.includes(selectedId)) {
      showErrorToast('You do not have access to edit this storefront.')
      return
    }

    const nextVersion = Date.now()
    const slug = toSlug(draft.slug || draft.displayName)
    if (!slug) {
      showErrorToast('Add a slug or display name first.')
      return
    }

    const data = buildStorefrontPayload({
      ...draft,
      tabLogoUrl: '',
      logoVersion: String(nextVersion),
    })

    try {
      await updateItem({ type: 'partner-storefront', id: selectedId, data }).unwrap()
      setDraft((current) => ({ ...current, tabLogoUrl: '', logoVersion: String(nextVersion) }))
      setLogoVersion(nextVersion)
      showSuccessToast('Tab logo removed.')
      refetch()
    } catch (error) {
      const apiErr = error as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to remove tab logo.')
    }
  }

  const handleHeroVideoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const payload = new FormData()
    payload.append('file', file)
    payload.append('folder', 'partner-storefronts')
    payload.append('asset_type', 'video')

    setIsUploadingHeroVideo(true)

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: payload,
      })

      const result = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !result.url) {
        throw new Error(result.error || 'Failed to upload video.')
      }

      const nextVideoUrl = result.url ?? ''
      const nextDraft = { ...draft, heroVideoUrl: nextVideoUrl }
      const targetId = typeof selectedId === 'number' ? selectedId : nextDraft.id

      setDraft((current) => ({
        ...current,
        heroVideoUrl: nextVideoUrl || current.heroVideoUrl,
      }))

      if (targetId) {
        if (hasSpecificStorefrontIds && !allowedStorefrontIds.includes(targetId)) {
          showErrorToast('You do not have access to edit this storefront.')
          return
        }

        const slug = toSlug(nextDraft.slug || nextDraft.displayName)
        if (!slug) {
          showErrorToast('Add a slug or display name first.')
          return
        }

        const data = buildStorefrontPayload(nextDraft)
        try {
          await updateItem({ type: 'partner-storefront', id: targetId, data }).unwrap()
          showSuccessToast('Hero video saved to storefront.')
          refetch()
        } catch (error) {
          const apiErr = error as { data?: { message?: string } }
          showErrorToast(apiErr?.data?.message || 'Failed to save hero video.')
        }
      } else {
        showSuccessToast('Hero video uploaded successfully.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload hero video.'
      showErrorToast(message)
    } finally {
      setIsUploadingHeroVideo(false)
      if (heroVideoInputRef.current) {
        heroVideoInputRef.current.value = ''
      }
    }
  }

  const handleRemoveHeroVideo = async () => {
    if (typeof selectedId !== 'number') {
      setDraft((current) => ({ ...current, heroVideoUrl: '' }))
      showSuccessToast('Hero video cleared. Click "Save Storefront" to apply it.')
      return
    }

    if (hasSpecificStorefrontIds && !allowedStorefrontIds.includes(selectedId)) {
      showErrorToast('You do not have access to edit this storefront.')
      return
    }

    const slug = toSlug(draft.slug || draft.displayName)
    if (!slug) {
      showErrorToast('Add a slug or display name first.')
      return
    }

    const data = buildStorefrontPayload({
      ...draft,
      heroVideoUrl: '',
    })

    try {
      await updateItem({ type: 'partner-storefront', id: selectedId, data }).unwrap()
      setDraft((current) => ({ ...current, heroVideoUrl: '' }))
      showSuccessToast('Hero video removed.')
      refetch()
    } catch (error) {
      const apiErr = error as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to remove hero video.')
    }
  }

  const saveStorefront = async () => {
    if (isPartnerScoped && !draft.id) {
      showErrorToast('You can only edit your assigned storefront.')
      return
    }

    if (hasSpecificStorefrontIds && draft.id && !allowedStorefrontIds.includes(draft.id)) {
      showErrorToast('You do not have access to edit this storefront.')
      return
    }

    const slug = toSlug(draft.slug || draft.displayName)
    if (!slug) {
      showErrorToast('Add a slug or display name first.')
      return
    }

    const payload = buildStorefrontPayload(draft)

    try {
      let savedItem: WebPageItem

      if (draft.id) {
        const result = await updateItem({ type: 'partner-storefront', id: draft.id, data: payload }).unwrap()
        savedItem = result.item
      } else {
        const result = await createItem({ type: 'partner-storefront', data: payload }).unwrap()
        savedItem = result.item
      }

      setDraft(toDraft(savedItem))
      setSelectedId(savedItem.id)
      showSuccessToast('Partner storefront saved.')
      broadcastStorefrontUpdate(slug)
      refetch()
    } catch (error) {
      const apiErr = error as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to save partner storefront.')
    }
  }

  const handleApplyReferralLink = async () => {
    const referral = draft.referralLink.trim()
    if (!referral) {
      showErrorToast('Enter a referral link before uploading.')
      return
    }

    if (!draft.id) {
      showSuccessToast('Referral link set. Click "Save Storefront" to apply it.')
      return
    }

    if (hasSpecificStorefrontIds && !allowedStorefrontIds.includes(draft.id)) {
      showErrorToast('You do not have access to edit this storefront.')
      return
    }

    const slug = toSlug(draft.slug || draft.displayName)
    if (!slug) {
      showErrorToast('Add a slug or display name first.')
      return
    }

    setIsUploadingReferralLink(true)

    try {
      await updateItem({ type: 'partner-storefront', id: draft.id, data: buildStorefrontPayload(draft) }).unwrap()
      showSuccessToast('Referral link saved successfully.')
      broadcastStorefrontUpdate(draft.slug || draft.displayName)
      refetch()
    } catch (error) {
      const apiErr = error as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to save referral link.')
    } finally {
      setIsUploadingReferralLink(false)
    }
  }

  const handleRemoveReferralLink = async () => {
    const previousReferral = draft.referralLink
    if (!previousReferral.trim()) return

    const nextDraft = { ...draft, referralLink: '' }
    setDraft(nextDraft)

    if (!nextDraft.id) {
      showSuccessToast('Referral link removed. Click "Save Storefront" to apply it.')
      return
    }

    if (hasSpecificStorefrontIds && !allowedStorefrontIds.includes(nextDraft.id)) {
      setDraft((current) => ({ ...current, referralLink: previousReferral }))
      showErrorToast('You do not have access to edit this storefront.')
      return
    }

    const slug = toSlug(nextDraft.slug || nextDraft.displayName)
    if (!slug) {
      setDraft((current) => ({ ...current, referralLink: previousReferral }))
      showErrorToast('Add a slug or display name first.')
      return
    }

    try {
      await updateItem({ type: 'partner-storefront', id: nextDraft.id, data: buildStorefrontPayload(nextDraft) }).unwrap()
      showSuccessToast('Referral link removed.')
      broadcastStorefrontUpdate(nextDraft.slug || nextDraft.displayName)
      refetch()
    } catch (error) {
      setDraft((current) => ({ ...current, referralLink: previousReferral }))
      const apiErr = error as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to remove referral link.')
    }
  }

  useEffect(() => {
    if (!isPartnerScoped) return

    if (storefronts.length === 0) {
      setSelectedId('new')
      setDraft(emptyDraft)
      return
    }

    const currentAllowed = selectedId !== 'new' && storefronts.some((entry) => entry.item.id === selectedId)
    if (!currentAllowed) {
      const first = storefronts[0].item
      setSelectedId(first.id)
      setDraft(toDraft(first))
    }
  }, [isPartnerScoped, storefronts, selectedId])

  useEffect(() => {
    if (allowedCategoryOptions.length === 0) {
      setHelperCategoryId('')
      return
    }

    setHelperCategoryId((current) => {
      if (current && allowedCategoryOptions.some((category) => category.id === current)) {
        return current
      }
      return allowedCategoryOptions[0].id
    })
  }, [allowedCategoryOptions])

  useEffect(() => {
    if (selectedProductsCategoryFilter === 'all') return
    const stillValid = selectedProductCategoryOptions.some((category) => category.id === selectedProductsCategoryFilter)
    if (!stillValid) {
      setSelectedProductsCategoryFilter('all')
    }
  }, [selectedProductsCategoryFilter, selectedProductCategoryOptions])

  useEffect(() => {
    let isCancelled = false

    const missingIds = draft.featuredProductIds.filter(
      (id) => !helperProductById[id] && !missingSelectedProductRequestIdsRef.current.has(id),
    )
    if (missingIds.length === 0) {
      return
    }

    missingIds.forEach((id) => missingSelectedProductRequestIdsRef.current.add(id))

    const loadMissingSelectedProducts = async () => {
      try {
        const results = await Promise.allSettled(
          missingIds.map(async (id) => {
            const product = await fetchPublicProduct(id).unwrap()
            return { id, product }
          }),
        )

        if (isCancelled) return

        const resolvedProducts = results
          .filter((result): result is PromiseFulfilledResult<{ id: number; product: Product }> => result.status === 'fulfilled')
          .map((result) => result.value.product)
          .filter((product): product is Product => Boolean(product) && typeof product.id === 'number')

        if (resolvedProducts.length > 0) {
          setHelperProductById((current) => {
            const next = { ...current }
            resolvedProducts.forEach((product) => {
              next[product.id] = product
            })
            return next
          })
        }
      } finally {
        missingIds.forEach((id) => missingSelectedProductRequestIdsRef.current.delete(id))
      }
    }

    void loadMissingSelectedProducts()

    return () => {
      isCancelled = true
    }
  }, [draft.featuredProductIds, fetchPublicProduct, helperProductById])

  useEffect(() => {
    let isCancelled = false

    const loadCategoryProducts = async () => {
      if (!helperCategoryId) {
        setHelperProducts([])
        return
      }

      setIsLoadingHelperProducts(true)

      try {
        const perPage = 200
        const firstPage = await fetchProducts({
          page: 1,
          perPage,
          status: '1',
          catId: helperCategoryId,
        }).unwrap()

        let allProducts = [...(firstPage.products ?? [])]
        const lastPage = Number(firstPage.meta?.last_page ?? 1)

        for (let page = 2; page <= lastPage; page += 1) {
          const nextPage = await fetchProducts({
            page,
            perPage,
            status: '1',
            catId: helperCategoryId,
          }).unwrap()
          allProducts = [...allProducts, ...(nextPage.products ?? [])]
        }

        const uniqueProducts = Array.from(
          allProducts.reduce((map, product) => {
            map.set(product.id, product)
            return map
          }, new Map<number, Product>()).values(),
        )

        if (!isCancelled) {
          setHelperProducts(uniqueProducts)
          setHelperProductById((current) => {
            const next = { ...current }
            uniqueProducts.forEach((product) => {
              next[product.id] = product
            })
            return next
          })
        }
      } catch {
        if (!isCancelled) {
          setHelperProducts([])
          showErrorToast('Failed to load products for the selected category.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingHelperProducts(false)
        }
      }
    }

    void loadCategoryProducts()

    return () => {
      isCancelled = true
    }
  }, [helperCategoryId, fetchProducts])

  if (isLoading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading partner storefronts...</div>
  }

  if (isError) {
    return <div className="rounded-3xl border border-red-200 bg-red-50 p-12 text-center text-sm font-semibold text-red-600 shadow-sm dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">Failed to load partner storefronts.</div>
  }

  const saving = isCreating || isUpdating || isDeleting || isDeletingPartnerUser

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)] text-slate-900 dark:text-slate-100">
      {deleteModal.open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Delete storefront confirmation"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close delete confirmation"
            onClick={() => setDeleteModal({ open: false })}
          />

          <div className="relative z-[51] w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-500">Confirm Delete</p>
            <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">Delete storefront?</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              This will delete <span className="font-semibold text-slate-900 dark:text-slate-100">{deleteModal.displayName ?? 'this storefront'}</span> and also delete related partner user account records. This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => setDeleteModal({ open: false })}
                disabled={isDeleting || isDeletingPartnerUser}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-rose-900/20 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
                onClick={() => void confirmDeleteStorefrontNow()}
                disabled={isDeleting || isDeletingPartnerUser}
              >
                {isDeleting || isDeletingPartnerUser ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <aside className="space-y-4">
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-5 shadow-sm dark:border-emerald-900/50 dark:from-slate-900 dark:via-emerald-950/40 dark:to-slate-900 dark:shadow-black/20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.20em] text-emerald-700 dark:text-emerald-300">Partner Storefronts</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Storefront Studio</h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">Build and manage branded partner shop pages with curated categories, product highlights, and landing page branding in one place.</p>
            </div>
            {!isPartnerScoped ? (
              <button
                type="button"
                onClick={() => selectStorefront()}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
              >
                New
              </button>
            ) : null}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300">
              {storefronts.length} storefront{storefronts.length === 1 ? '' : 's'}
            </span>
            <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Live editor
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/20">
          <div className="mb-2 px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Your Storefronts</p>
          </div>

          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {storefronts.map(({ item, config }) => {
              const active = selectedId === item.id
              const isDiscountEnabled = discountToggleByStorefrontId[item.id] ?? config.enableActivateDiscount
              return (
                <div key={item.id} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => selectStorefront(item)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? 'border-emerald-300 bg-emerald-50/60 shadow-sm dark:border-emerald-700/70 dark:bg-emerald-900/20'
                        : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-emerald-700/60 dark:hover:bg-emerald-900/15'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{config.displayName}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">/{config.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {active ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            Active
                          </span>
                        ) : null}
                        {!isPartnerScoped ? (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleDeleteStorefront(item, config.displayName)
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                event.stopPropagation()
                                void handleDeleteStorefront(item, config.displayName)
                              }
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/40"
                            aria-label={`Delete ${config.displayName}`}
                            title={`Delete ${config.displayName}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{config.allowedCategoryIds.length} selected categories</p>
                  </button>

                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 10V7a2 2 0 0 0-2-2h-3" />
                          <path d="M14 3H8a2 2 0 0 0-2 2v3" />
                          <path d="M4 14v3a2 2 0 0 0 2 2h3" />
                          <path d="M10 21h6a2 2 0 0 0 2-2v-3" />
                          <path d="m8 12 2 2 6-6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Activate discount</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Enable this option to activate the discount.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isDiscountEnabled}
                          onChange={() => {
                            // Optimistic UI per storefront row.
                            const next = !isDiscountEnabled
                            setDiscountToggleByStorefrontId((current) => ({ ...current, [item.id]: next }))

                            if (selectedId === item.id) {
                              setDraft((current) => ({ ...current, enableActivateDiscount: next }))
                            }

                            if (hasSpecificStorefrontIds && !allowedStorefrontIds.includes(item.id)) {
                              showErrorToast('You do not have access to edit this storefront.')
                              setDiscountToggleByStorefrontId((current) => ({ ...current, [item.id]: isDiscountEnabled }))
                              return
                            }

                            const baseDraft = toDraft(item)
                            const payload = buildStorefrontPayload({
                              ...baseDraft,
                              enableActivateDiscount: next,
                            })

                            updateItem({ type: 'partner-storefront', id: item.id, data: payload })
                              .unwrap()
                              .then(() => {
                                setDiscountToggleByStorefrontId((current) => {
                                  const nextState = { ...current }
                                  delete nextState[item.id]
                                  return nextState
                                })
                                broadcastStorefrontUpdate(baseDraft.slug || baseDraft.displayName)
                                refetch()
                              })
                              .catch(() => {
                                setDiscountToggleByStorefrontId((current) => ({ ...current, [item.id]: isDiscountEnabled }))
                                showErrorToast('Failed to update activate discount.')
                              })
                          }}
                        />
                        <div
                          className={`peer h-6 w-10 rounded-full border transition ${
                            isDiscountEnabled
                              ? '!border-emerald-500 !bg-emerald-500'
                              : 'border-slate-200 bg-slate-300'
                          }`}
                        />
                        <div
                          className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform dark:bg-slate-900 ${
                            isDiscountEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </label>
                      <span
                        className={`text-xs font-bold uppercase whitespace-nowrap leading-none ${
                          isDiscountEnabled ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {isDiscountEnabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}


            {storefronts.length === 0 ? (
              <p className="p-3 text-sm text-slate-500 dark:text-slate-400">
                {hasSpecificStorefrontIds ? 'No storefront assigned to this account yet.' : 'No partner storefronts yet.'}
              </p>
            ) : null}
          </div>
        </div>
      </aside>

      <section className="space-y-5">
        <div className={panelClass}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 px-4 py-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Identity</p>
              <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">Configure your storefront identity, hero messaging, brand assets, and partner settings for a polished launch.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300">
              Live
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Slug" className="md:order-1">
              <input
                value={draft.slug}
                onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
                onBlur={(event) => setDraft((current) => ({ ...current, slug: toSlug(event.target.value) }))}
                placeholder="Your Shop name"
                className={inputClass}
              />
            </Field>
            <Field label="Display Name" className="md:order-2">
              <input
                value={draft.displayName}
                onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))}
                placeholder="Your Shop name"
                className={inputClass}
              />
            </Field>
            <Field label="Hero Title" className="md:order-3">
              <input
                value={draft.heroTitle}
                onChange={(event) => setDraft((current) => ({ ...current, heroTitle: event.target.value }))}
                placeholder="Shop name Shop Furniture Store"
                className={inputClass}
              />
            </Field>
            <Field label="Partner Notification Email" className="md:order-4">
              <input
                value={draft.notificationEmail}
                onChange={(event) => setDraft((current) => ({ ...current, notificationEmail: event.target.value }))}
                placeholder="youremail@.gmail.com"
                className={inputClass}
              />
            </Field>
            <Field label="Logo Upload" className="md:order-7">
              <div className="space-y-3">
                <div className={`${softCardClass} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Upload storefront logo</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">PNG, JPG, or WebP. Upload directly from your device.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    {draft.logoUrl ? (
                      <button
                        type="button"
                        onClick={() => void handleRemoveLogo()}
                        className="min-w-[112px] whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold leading-tight text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Remove
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="inline-flex min-w-[140px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold leading-tight text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                    >
                      {isUploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                      <span>Upload Logo</span>
                    </button>
                  </div>
                </div>
                {draft.logoUrl ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                      <img
                        src={`${draft.logoUrl}${draft.logoUrl.includes('?') ? '&' : '?'}v=${logoVersion || draft.logoVersion || '1'}`}
                        alt="Uploaded logo preview"
                        className="h-full w-full object-contain p-1"
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Logo uploaded.</p>
                  </div>
                ) : null}
              </div>
            </Field>
            <Field label="Referral & Shop Link Upload" className="md:order-6">
              <div className="space-y-3">
                <div className={softCardClass}>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Add referral & shop link</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Set both links for this storefront in one place.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Referral Link</p>
                  <input
                    value={draft.referralLink}
                    onChange={(event) => setDraft((current) => ({ ...current, referralLink: event.target.value }))}
                    placeholder="https://www.afhome.ph/ref/username "
                    className="min-w-0 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/70 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/30"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    value={draft.domainLink}
                    onChange={(event) => setDraft((current) => ({ ...current, domainLink: event.target.value }))}
                    placeholder="https://www.afhome.ph/shop?ref=username"
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/70 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/30"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleApplyReferralLink()}
                      disabled={isUploadingReferralLink || saving}
                      className="inline-flex min-w-[116px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold leading-tight text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                    >
                      {isUploadingReferralLink ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                      <span>Save Link</span>
                    </button>
                    {draft.referralLink.trim() ? (
                      <button
                        type="button"
                        onClick={() => void handleRemoveReferralLink()}
                        disabled={saving}
                        className="min-w-[112px] whitespace-nowrap rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold leading-tight text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-slate-800 dark:text-red-300 dark:hover:bg-red-950/30"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Shop URL</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Saved when you click <span className="font-semibold text-slate-700 dark:text-slate-200">Save Storefront</span>, or upload directly for existing storefronts.</p>
              </div>
            </Field>
            <Field label="Tab Logo Upload" className="md:col-span-1 md:order-9">
              <div className="space-y-3">
                <div className={`${softCardClass} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Upload browser tab logo</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Used as favicon on your partner storefront page.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      ref={tabLogoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon"
                      onChange={handleTabLogoUpload}
                      className="hidden"
                    />
                    {draft.tabLogoUrl ? (
                      <button
                        type="button"
                        onClick={() => void handleRemoveTabLogo()}
                        className="min-w-[112px] whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold leading-tight text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Remove
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => tabLogoInputRef.current?.click()}
                      disabled={isUploadingTabLogo}
                      className="inline-flex min-w-[140px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold leading-tight text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                    >
                      {isUploadingTabLogo ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                      <span>Upload Tab Logo</span>
                    </button>
                  </div>
                </div>
                {draft.tabLogoUrl ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                      <img
                        src={`${draft.tabLogoUrl}${draft.tabLogoUrl.includes('?') ? '&' : '?'}v=${logoVersion || draft.logoVersion || '1'}`}
                        alt="Uploaded tab logo preview"
                        className="h-full w-full object-contain p-1"
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tab logo uploaded.</p>
                  </div>
                ) : null}
              </div>
            </Field>
            <Field label="Hero Video Upload" className="md:col-span-1 md:order-8">
              <div className="space-y-3">
                <div className={softCardClass}>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Upload storefront hero video</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Accepted: MP4, MOV, WEBM, AVI, WMV. Minimum file size is 5MB.</p>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      ref={heroVideoInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-ms-wmv"
                      onChange={handleHeroVideoUpload}
                      className="hidden"
                    />
                    {draft.heroVideoUrl ? (
                      <button
                        type="button"
                        onClick={() => void handleRemoveHeroVideo()}
                        className="min-w-[112px] whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold leading-tight text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Remove
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => heroVideoInputRef.current?.click()}
                      disabled={isUploadingHeroVideo}
                      className="inline-flex min-w-[164px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold leading-tight text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                    >
                      {isUploadingHeroVideo ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                      <span>Upload Hero Video</span>
                    </button>
                  </div>
                </div>
                {draft.heroVideoUrl ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <video
                      src={draft.heroVideoUrl}
                      controls
                      className="w-full max-h-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900"
                    />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Hero video uploaded.</p>
                  </div>
                ) : null}
              </div>
            </Field>
            <Field label="Hero Subtitle" className="md:col-span-2 md:order-10">
              <textarea
                value={draft.heroSubtitle}
                onChange={(event) => setDraft((current) => ({ ...current, heroSubtitle: event.target.value }))}
                placeholder="Curated home furniture for condo buyers."
                rows={3}
                className={inputClass}
              />
            </Field>
            <Field label="Theme Color" className="md:order-11">
              <input
                type="color"
                value={draft.themeColor}
                onChange={(event) => setDraft((current) => ({ ...current, themeColor: event.target.value }))}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2 dark:border-slate-700 dark:bg-slate-800/80"
              />
            </Field>
            <Field label="Accent Color" className="md:order-12">
              <input
                type="color"
                value={draft.accentColor}
                onChange={(event) => setDraft((current) => ({ ...current, accentColor: event.target.value }))}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2 dark:border-slate-700 dark:bg-slate-800/80"
              />
            </Field>
            {canManageAiSupport ? (
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2 md:order-13 dark:border-slate-700 dark:bg-slate-800/70">
                <input
                  type="checkbox"
                  checked={draft.enableAiSupport}
                  onChange={(event) => setDraft((current) => ({ ...current, enableAiSupport: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Enable AI Support</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Show the floating AI chat widget on this partner storefront.</p>
                </div>
              </label>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void saveStorefront()}
              disabled={saving}
              className="inline-flex min-w-[148px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              <span>Save Storefront</span>
            </button>
            <a
              href={draft.slug ? `/shop/${draft.slug}` : '#'}
              target="_blank"
              rel="noreferrer"
              className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                draft.slug
                  ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  : 'pointer-events-none border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500'
              }`}
            >
              Open Preview
            </a>
          </div>

        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <div className={panelClass}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Allowed Categories</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">Only the selected categories will appear on the partner storefront page, creating a cleaner curated shop experience.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {draft.allowedCategoryIds.length} selected
              </span>
            </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {categories.map((category) => {
                    const active = draft.allowedCategoryIds.includes(category.id)

                    const categoryName = (category.name ?? '').toLowerCase()
                    const iconTone = categoryName.includes('mobile') || categoryName.includes('accessories')
                      ? 'border-violet-100 bg-violet-50 text-violet-500'
                      : categoryName.includes('decor')
                        ? 'border-emerald-100 bg-emerald-50 text-emerald-500'
                        : categoryName.includes('essential') || categoryName.includes('home ')
                          ? 'border-amber-100 bg-amber-50 text-amber-500'
                          : categoryName.includes('appliance')
                            ? 'border-sky-100 bg-sky-50 text-sky-500'
                            : categoryName.includes('auto') || categoryName.includes('care')
                              ? 'border-rose-100 bg-rose-50 text-rose-500'
                              : categoryName.includes('living')
                                ? 'border-purple-100 bg-purple-50 text-purple-500'
                                : categoryName.includes('service')
                                  ? 'border-cyan-100 bg-cyan-50 text-cyan-500'
                                  : categoryName.includes('propert')
                                    ? 'border-orange-100 bg-orange-50 text-orange-500'
                                    : 'border-slate-200 bg-slate-50 text-slate-500'
                    const countTone = categoryName.includes('mobile') || categoryName.includes('accessories')
                      ? 'text-violet-500'
                      : categoryName.includes('decor')
                        ? 'text-emerald-500'
                        : categoryName.includes('essential') || categoryName.includes('home ')
                          ? 'text-amber-500'
                          : categoryName.includes('appliance')
                            ? 'text-sky-500'
                            : categoryName.includes('auto') || categoryName.includes('care')
                              ? 'text-rose-500'
                              : categoryName.includes('living')
                                ? 'text-purple-500'
                                : categoryName.includes('service')
                                  ? 'text-cyan-500'
                                  : categoryName.includes('propert')
                                    ? 'text-orange-500'
                                    : 'text-slate-500'
                    const modernIcon =
                      categoryName.includes('mobile') || categoryName.includes('accessories') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
                          <path d="M11 18h2" />
                        </svg>
                      ) : categoryName.includes('decor') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M4 12h16" />
                          <path d="M6.5 12V9a3.5 3.5 0 0 1 7 0v3" />
                          <path d="M10.5 12V9a3.5 3.5 0 0 1 7 0v3" />
                          <path d="M5 12v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
                        </svg>
                      ) : categoryName.includes('essential') || categoryName.includes('home ') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M3 10.5L12 3l9 7.5" />
                          <path d="M5 9.5V21h14V9.5" />
                          <path d="M10 21v-6h4v6" />
                        </svg>
                      ) : categoryName.includes('appliance') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <rect x="5" y="2.5" width="14" height="19" rx="2.5" />
                          <circle cx="12" cy="13" r="4" />
                          <path d="M8 6.5h8" />
                        </svg>
                      ) : categoryName.includes('auto') || categoryName.includes('care') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M6 16h12l-1.5-5a2 2 0 0 0-1.9-1.4H9.4A2 2 0 0 0 7.5 11z" />
                          <path d="M4 16h16v2a2 2 0 0 1-2 2h-1v-2H7v2H6a2 2 0 0 1-2-2z" />
                          <circle cx="8" cy="16.5" r="0.8" />
                          <circle cx="16" cy="16.5" r="0.8" />
                        </svg>
                      ) : categoryName.includes('living') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M12 2l5 9h-10z" />
                          <path d="M12 11v9" />
                          <path d="M8 20h8" />
                        </svg>
                      ) : categoryName.includes('service') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M21 7.5a3 3 0 0 1-3 3h-1l-4.7 4.7a2 2 0 0 1-2.8 0L8 13.7a2 2 0 0 1 0-2.8L12.7 6H14a3 3 0 1 1 0 6h-1.2" />
                          <path d="M4 20l4-4" />
                        </svg>
                      ) : categoryName.includes('propert') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <rect x="4" y="3" width="16" height="18" rx="2" />
                          <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M4 7h16" />
                          <path d="M4 12h16" />
                          <path d="M4 17h16" />
                        </svg>
                      )

                    const text = active ? 'text-slate-900 dark:text-slate-100' : 'text-slate-800 dark:text-slate-100'
                    const sub = active ? 'text-slate-500 dark:text-slate-300' : 'text-slate-500 dark:text-slate-300'

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className={[
                          'group relative flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition',
                          'focus:outline-none focus:ring-4 focus:ring-slate-200/70 dark:focus:ring-slate-700/40',
                          active
                            ? 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900/40'
                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/20 dark:hover:border-slate-600',
                        ].join(' ')}
                        aria-pressed={active}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <div
                              className={[
                                'flex h-12 w-12 items-center justify-center rounded-xl border',
                                'dark:bg-slate-900/30',
                                iconTone,
                                'dark:border-slate-700/60 dark:bg-slate-800/70',
                              ].join(' ')}
                              aria-hidden="true"
                            >
                              <div className="text-current">
                                {modernIcon}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className={`truncate text-sm font-semibold ${text}`}>{category.name}</p>
                              <p className={`mt-0.5 text-xs ${sub}`}>
                                ID {category.id} • <span className={countTone}>{category.product_count ?? 0} items</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <span
                          className={[
                            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition',
                            active
                              ? 'border-slate-400 bg-slate-100 dark:border-slate-500 dark:bg-slate-700/60'
                              : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900/40',
                          ].join(' ')}
                          aria-label={active ? 'Selected' : 'Not selected'}
                        >
                          {active ? <span className="h-2.5 w-2.5 rounded-full bg-slate-500 dark:bg-slate-200" /> : <span className="h-2.5 w-2.5 rounded-full bg-transparent" />}
                        </span>
                      </button>
                    )
                  })}
                </div>
            </div>

            <div className={`flex h-[500px] flex-col ${panelClass}`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Selected Products</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {draft.featuredProductIds.length} selected
                </span>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">Products checked in Product Helper will appear here and auto-save.</p>
              <label className="mt-3 block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Filter Category</span>
                <select
                  value={selectedProductsCategoryFilter}
                  onChange={(event) => {
                    const next = event.target.value
                    if (next === 'all') {
                      setSelectedProductsCategoryFilter('all')
                      return
                    }
                    const nextId = Number.parseInt(next, 10)
                    setSelectedProductsCategoryFilter(Number.isFinite(nextId) ? nextId : 'all')
                  }}
                  className={selectClass}
                >
                  <option value="all">All Categories</option>
                  {selectedProductCategoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label} (ID {category.id})
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {filteredSelectedProducts.map((product) => {
                  const imageUrl =
                    (typeof product.image === 'string' && product.image.trim().length > 0
                      ? product.image
                      : undefined) ??
                    (Array.isArray(product.images) && typeof product.images[0] === 'string'
                      ? product.images[0]
                      : undefined)

                  return (
                    <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                        {imageUrl ? (
                          <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold uppercase text-slate-400 dark:text-slate-500">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{product.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">ID {product.id} Â· Category {product.catid}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFeaturedProduct(product.id)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
                {filteredMissingSelectedProductIds.map((id) => (
                  <div key={id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Product ID {id}</p>
                    <button
                      type="button"
                      onClick={() => toggleFeaturedProduct(id)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {filteredSelectedProducts.length === 0 && filteredMissingSelectedProductIds.length === 0 ? (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400">
                    {draft.featuredProductIds.length === 0 ? 'No selected products yet.' : 'No selected products in this category.'}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className={`hidden ${panelClass}`}>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Featured Product IDs</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">These IDs can be used by shop builder sections for curated product cards.</p>
              <textarea
                value={draft.featuredProductIds.join(',')}
                onChange={(event) => setDraft((current) => ({ ...current, featuredProductIds: parseIdList(event.target.value) }))}
                rows={4}
                placeholder="12,18,25,36"
                className={`mt-3 ${inputClass}`}
              />
            </div>

            <div className={`flex h-[500px] flex-col ${panelClass}`}>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Product Helper</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">Select active products from the allowed category to feature them on your partner storefront.</p>
              <label className="mt-3 block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Category</span>
                <select
                  value={helperCategoryId}
                  onChange={(event) => {
                    const nextId = Number.parseInt(event.target.value, 10)
                    setHelperCategoryId(Number.isFinite(nextId) ? nextId : '')
                  }}
                  disabled={allowedCategoryOptions.length === 0}
                  className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {allowedCategoryOptions.length === 0 ? (
                    <option value="">Select allowed categories first</option>
                  ) : null}
                  {allowedCategoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} (ID {category.id})
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {isLoadingHelperProducts ? (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400">
                    Loading products...
                  </p>
                ) : null}
                {helperProducts.map((product) => {
                  const imageUrl =
                    (typeof product.image === 'string' && product.image.trim().length > 0
                      ? product.image
                      : undefined) ??
                    (Array.isArray(product.images) && typeof product.images[0] === 'string'
                      ? product.images[0]
                      : undefined)
                  const isFeatured = draft.featuredProductIds.includes(product.id)

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggleFeaturedProduct(product.id)}
                      className="relative w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-slate-600"
                    >
                      <span className="absolute right-3 top-3">
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={() => toggleFeaturedProduct(product.id)}
                          onClick={(event) => event.stopPropagation()}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900"
                        />
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                          {imageUrl ? (
                            <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{product.name}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">ID {product.id} Â· Category {product.catid}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
                {!isLoadingHelperProducts && allowedCategoryOptions.length > 0 && helperProducts.length === 0 ? (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400">
                    No active products found for this category.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  )
}








