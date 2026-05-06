'use client'

import type { ReactNode } from 'react'
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import { getPartnerStorefrontConfig, parseIdList } from '@/libs/partnerStorefront'
import { useGetCategoriesQuery } from '@/store/api/categoriesApi'
import { type Product, useLazyGetProductsQuery, useLazyGetPublicProductQuery } from '@/store/api/productsApi'
import {
  useCreateAdminWebPageItemMutation,
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
  logoVersion: string
  referralLink: string
  themeColor: string
  accentColor: string
  notificationEmail: string
  domainLink: string
  allowedCategoryIds: number[]
  featuredProductIds: number[]
  enableAiSupport: boolean
}

const emptyDraft: DraftState = {
  slug: '',
  displayName: '',
  heroTitle: '',
  heroSubtitle: '',
  logoUrl: '',
  tabLogoUrl: '',
  logoVersion: '',
  referralLink: '',
  themeColor: '#0f766e',
  accentColor: '#f97316',
  notificationEmail: '',
  domainLink: '',
  allowedCategoryIds: [],
  featuredProductIds: [],
  enableAiSupport: false,
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
    logoVersion: config.logoVersion ?? '',
    referralLink: config.referralLink ?? '',
    themeColor: config.themeColor,
    accentColor: config.accentColor,
    notificationEmail: config.notificationEmail,
    domainLink: config.domainLink,
    allowedCategoryIds: config.allowedCategoryIds,
    featuredProductIds: config.featuredProductIds,
    enableAiSupport: config.enableAiSupport,
  }
}

const panelClass =
  'rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/20'

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/70 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/30'

const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/70 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/30'

const softCardClass =
  'rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70'

export default function PartnerStorefrontStudio() {
  const [selectedId, setSelectedId] = useState<number | 'new'>('new')
  const [draft, setDraft] = useState<DraftState>(emptyDraft)
  const [helperCategoryId, setHelperCategoryId] = useState<number | ''>('')
  const [selectedProductsCategoryFilter, setSelectedProductsCategoryFilter] = useState<number | 'all'>('all')
  const [helperProducts, setHelperProducts] = useState<Product[]>([])
  const [helperProductById, setHelperProductById] = useState<Record<number, Product>>({})
  const [isLoadingHelperProducts, setIsLoadingHelperProducts] = useState(false)
  const [logoVersion, setLogoVersion] = useState(0)
  const missingSelectedProductRequestIdsRef = useRef<Set<number>>(new Set())
  const { data: session } = useSession()
  const sessionRole = String(session?.user?.role ?? '').toLowerCase()
  const sessionUserLevelId = Number((session?.user as { userLevelId?: number } | undefined)?.userLevelId ?? 0)
  const storefrontIds = (session?.user as { storefrontIds?: number[] } | undefined)?.storefrontIds ?? []
  const isPartnerScoped = sessionUserLevelId === 4 || sessionRole === 'web_content'
  const canManageAiSupport = sessionUserLevelId === 1 || sessionUserLevelId === 2 || sessionRole === 'super_admin' || sessionRole === 'admin'
  const allowedStorefrontIds = useMemo(
    () => (isPartnerScoped ? storefrontIds.filter((id) => Number.isInteger(id) && id > 0) : []),
    [isPartnerScoped, storefrontIds],
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
  const { data: categoriesData } = useGetCategoriesQuery({ per_page: 200 })
  const [fetchProducts] = useLazyGetProductsQuery()
  const [fetchPublicProduct] = useLazyGetPublicProductQuery()
  const [createItem, { isLoading: isCreating }] = useCreateAdminWebPageItemMutation()
  const [updateItem, { isLoading: isUpdating }] = useUpdateAdminWebPageItemMutation()

  const storefronts = useMemo(() => {
    const items = (data?.items ?? [])
      .map((item) => ({
        item,
        config: getPartnerStorefrontConfig(item),
      }))
      .filter((entry): entry is { item: WebPageItem; config: NonNullable<ReturnType<typeof getPartnerStorefrontConfig>> } => Boolean(entry.config))

    const scoped = isPartnerScoped
      ? items.filter((entry) => allowedStorefrontIds.includes(entry.item.id))
      : items

    return scoped.sort((a, b) => a.config.displayName.localeCompare(b.config.displayName))
  }, [data?.items, allowedStorefrontIds, isPartnerScoped])

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
          logo_version: nextDraft.logoVersion.trim(),
          referral_link: nextDraft.referralLink.trim(),
          theme_color: nextDraft.themeColor.trim(),
          accent_color: nextDraft.accentColor.trim(),
          notification_email: nextDraft.notificationEmail.trim(),
          domain_link: nextDraft.domainLink.trim(),
          allowed_category_ids: nextDraft.allowedCategoryIds.join(','),
          featured_product_ids: nextDraft.featuredProductIds.join(','),
          enable_ai_support: nextDraft.enableAiSupport ? '1' : '0',
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
        if (isPartnerScoped && !allowedStorefrontIds.includes(selectedId)) {
          showErrorToast('You do not have access to edit this storefront.')
          return current
        }

        const payload = buildStorefrontPayload(nextDraft)
        updateItem({ type: 'partner-storefront', id: selectedId, data: payload })
          .unwrap()
          .then(() => {
            refetch()
          })
          .catch(() => {
            showErrorToast('Failed to update selected products.')
          })
      }

      return nextDraft
    })
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
      showSuccessToast('Logo uploaded successfully.')

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
        showErrorToast('Logo uploaded. Click "Save Storefront" to apply it.')
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
      showSuccessToast('Tab logo uploaded successfully.')

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
        showErrorToast('Tab logo uploaded. Click "Save Storefront" to apply it.')
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

  const saveStorefront = async () => {
    if (isPartnerScoped && !draft.id) {
      showErrorToast('You can only edit your assigned storefront.')
      return
    }

    if (isPartnerScoped && draft.id && !allowedStorefrontIds.includes(draft.id)) {
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
      if (draft.id) {
        await updateItem({ type: 'partner-storefront', id: draft.id, data: payload }).unwrap()
      } else {
        await createItem({ type: 'partner-storefront', data: payload }).unwrap()
      }

      setDraft((current) => ({ ...current, slug }))
      showSuccessToast('Partner storefront saved.')
      refetch()
    } catch (error) {
      const apiErr = error as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to save partner storefront.')
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

    if (isPartnerScoped && !allowedStorefrontIds.includes(nextDraft.id)) {
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

  const saving = isCreating || isUpdating

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)] text-slate-900 dark:text-slate-100">
      <aside className="space-y-4">
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-5 shadow-sm dark:border-emerald-900/50 dark:from-slate-900 dark:via-emerald-950/40 dark:to-slate-900 dark:shadow-black/20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">Partner Storefronts</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Storefront Studio</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Build and manage branded partner shop pages with curated categories and product highlights.</p>
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
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300">
              {storefronts.length} storefront{storefronts.length === 1 ? '' : 's'}
            </span>
            <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Live editor
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/20">
          <div className="mb-2 px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Your Storefronts</p>
          </div>
          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {storefronts.map(({ item, config }) => {
              const active = selectedId === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectStorefront(item)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    active
                      ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:border-emerald-700 dark:bg-emerald-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{config.displayName}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">/{config.slug}</p>
                    </div>
                    {active ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Active</span> : null}
                  </div>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{config.allowedCategoryIds.length} selected categories</p>
                </button>
              )
            })}

            {storefronts.length === 0 ? (
              <p className="p-3 text-sm text-slate-500 dark:text-slate-400">
                {isPartnerScoped ? 'No storefront assigned to this account yet.' : 'No partner storefronts yet.'}
              </p>
            ) : null}
          </div>
        </div>
      </aside>

      <section className="space-y-5">
        <div className={panelClass}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">Identity</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Configure core storefront details and branding.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300">
              Live
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Slug">
              <input
                value={draft.slug}
                onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
                onBlur={(event) => setDraft((current) => ({ ...current, slug: toSlug(event.target.value) }))}
                placeholder="testshop"
                className={inputClass}
              />
            </Field>
            <Field label="Display Name">
              <input
                value={draft.displayName}
                onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))}
                placeholder="Synergy Shop"
                className={inputClass}
              />
            </Field>
            <Field label="Hero Title">
              <input
                value={draft.heroTitle}
                onChange={(event) => setDraft((current) => ({ ...current, heroTitle: event.target.value }))}
                placeholder="Synergy Shop Furniture Store"
                className={inputClass}
              />
            </Field>
            <Field label="Partner Notification Email">
              <input
                value={draft.notificationEmail}
                onChange={(event) => setDraft((current) => ({ ...current, notificationEmail: event.target.value }))}
                placeholder="ops@synergy.com"
                className={inputClass}
              />
            </Field>
            
            <Field label="Logo Upload">
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
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Remove
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                    >
                      {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
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
            <Field label="Referral Upload">
              <div className="space-y-3">
                <div className={softCardClass}>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Upload referral link</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Paste your referral URL for this storefront.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={draft.referralLink}
                    onChange={(event) => setDraft((current) => ({ ...current, referralLink: event.target.value }))}
                    placeholder="https://www.afhome.ph/shop?ref=yourcode"
                    className={inputClass}
                  />
                  {draft.referralLink.trim() ? (
                    <button
                      type="button"
                      onClick={() => void handleRemoveReferralLink()}
                      disabled={saving}
                      className="shrink-0 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-slate-800 dark:text-red-300 dark:hover:bg-red-950/30"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Saved when you click <span className="font-semibold text-slate-700 dark:text-slate-200">Save Storefront</span>.</p>
              </div>
            </Field>
            <Field label="Tab Logo Upload">
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
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Remove
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => tabLogoInputRef.current?.click()}
                      disabled={isUploadingTabLogo}
                      className="rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                    >
                      {isUploadingTabLogo ? 'Uploading...' : 'Upload Tab Logo'}
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
            <Field label="Hero Subtitle" className="md:col-span-2">
              <textarea
                value={draft.heroSubtitle}
                onChange={(event) => setDraft((current) => ({ ...current, heroSubtitle: event.target.value }))}
                placeholder="Curated home furniture for condo buyers."
                rows={3}
                className={inputClass}
              />
            </Field>
            <Field label="Theme Color">
              <input
                type="color"
                value={draft.themeColor}
                onChange={(event) => setDraft((current) => ({ ...current, themeColor: event.target.value }))}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2 dark:border-slate-700 dark:bg-slate-800/80"
              />
            </Field>
            <Field label="Accent Color">
              <input
                type="color"
                value={draft.accentColor}
                onChange={(event) => setDraft((current) => ({ ...current, accentColor: event.target.value }))}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2 dark:border-slate-700 dark:bg-slate-800/80"
              />
            </Field>
            {canManageAiSupport ? (
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2 dark:border-slate-700 dark:bg-slate-800/70">
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
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Storefront'}
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
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Allowed Categories</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Only these categories will appear on the partner shop page.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {draft.allowedCategoryIds.length} selected
              </span>
            </div>

              <div className="mt-4 grid gap-2 md:grid-cols-2">
              {categories.map((category) => {
                const active = draft.allowedCategoryIds.includes(category.id)
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{category.name}</p>
                      <p className="text-xs text-slate-400">ID {category.id} · {category.product_count ?? 0} items</p>
                    </div>
                    <span className={`h-4 w-4 rounded-full border-2 ${active ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900'}`} />
                  </button>
                )
              })}
              </div>
            </div>

            <div className={`flex h-[500px] flex-col ${panelClass}`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Selected Products</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {draft.featuredProductIds.length} selected
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Products checked in Product Helper will appear here and auto-save.</p>
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
                        <p className="text-xs text-slate-500 dark:text-slate-400">ID {product.id} · Category {product.catid}</p>
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
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Product Helper</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">All active products in the selected category.</p>
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
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{product.name}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">ID {product.id} · Category {product.catid}</p>
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
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  )
}

