'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useGetCategoriesQuery } from '@/store/api/categoriesApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import { useGetProductsQuery } from '@/store/api/productsApi'
import {
  useCreateAdminWebPageItemMutation,
  useGetAdminWebPageItemsQuery,
  type WebPageItem,
  useUpdateAdminWebPageItemMutation,
} from '@/store/api/webPagesApi'

type BuilderSectionId =
  | 'announcements'
  | 'campaign-banners'
  | 'category-grid'
  | 'featured-collection'
  | 'promo-pair'
  | 'newsletter'

type BuilderSectionStatus = 'live' | 'draft' | 'planned'

type BuilderField = {
  key: string
  label: string
  value: string
  kind?: 'textarea'
}

type BuilderSection = {
  id: BuilderSectionId
  label: string
  eyebrow: string
  title: string
  description: string
  status: BuilderSectionStatus
  accent: string
  fields: BuilderField[]
  dbId?: number
}

const defaultSections: BuilderSection[] = [
  {
    id: 'announcements',
    label: 'Announcements',
    eyebrow: 'Top Utility Bar',
    title: 'Service chips and campaign labels',
    description: 'Used for service advisories, trust signals, and quick promo chips above the shop content.',
    status: 'live',
    accent: 'from-orange-500/20 to-amber-400/10',
    fields: [
      { key: 'chip_group', label: 'Chip group', value: 'Nationwide Shipping, Authenticity Guaranteed, Customer Care' },
    ],
  },
  {
    id: 'campaign-banners',
    label: 'Campaign Banners',
    eyebrow: 'Top Promos',
    title: 'Promo banner strip',
    description: 'Two large visual promos that can use image URLs plus direct links into collections or categories.',
    status: 'live',
    accent: 'from-sky-500/20 to-cyan-400/10',
    fields: [
      { key: 'left_title', label: 'Left banner title', value: 'Weekend Furniture Drop' },
      { key: 'left_subtitle', label: 'Left banner subtitle', value: 'Refresh your living room this week' },
      { key: 'left_image', label: 'Left banner image URL', value: '/Images/HeroSection/chairs_stools.jpg' },
      { key: 'left_link', label: 'Left banner link', value: '/shop?category=8' },
      { key: 'right_title', label: 'Right banner title', value: 'Appliance Upgrade Days' },
      { key: 'right_subtitle', label: 'Right banner subtitle', value: 'Choose your best appliance today' },
      { key: 'right_image', label: 'Right banner image URL', value: '/Images/PromoBanners/ct2-img2-large.jpg' },
      { key: 'right_link', label: 'Right banner link', value: '/shop?category=4' },
    ],
  },
  {
    id: 'category-grid',
    label: 'Category Grid',
    eyebrow: 'Hero Section',
    title: 'Shop by category cards',
    description: 'This block can now pull real categories by ID. You can still override card images per slot.',
    status: 'live',
    accent: 'from-violet-500/20 to-fuchsia-400/10',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', value: 'Shop by Category' },
      { key: 'heading', label: 'Heading', value: 'Find Your Perfect Furniture' },
      { key: 'category_ids', label: 'Category IDs (comma-separated)', value: '8,4,15,22' },
      { key: 'card_1_image', label: 'Card 1 image URL', value: '/Images/HeroSection/chairs_stools.jpg' },
      { key: 'card_2_image', label: 'Card 2 image URL', value: '/Images/HeroSection/Dinning_table.jpg' },
      { key: 'card_3_image', label: 'Card 3 image URL', value: '/Images/HeroSection/sofas.jpg' },
      { key: 'card_4_image', label: 'Card 4 image URL', value: '/Images/HeroSection/tv_racks.jpg' },
    ],
  },
  {
    id: 'featured-collection',
    label: 'Featured Collection',
    eyebrow: 'Featured Section',
    title: 'Lead image + product picks',
    description: 'This block can now pull real products by ID for the right-side cards, while the hero card stays editable.',
    status: 'live',
    accent: 'from-emerald-500/20 to-lime-400/10',
    fields: [
      { key: 'left_eyebrow', label: 'Lead eyebrow', value: 'Featured' },
      { key: 'left_heading', label: 'Lead heading', value: 'Minimal & Simple Design' },
      { key: 'left_description', label: 'Lead description', value: 'Crafted for the modern home with a lighter, calmer visual merchandising tone.', kind: 'textarea' },
      { key: 'lead_image', label: 'Lead image URL', value: '/Images/FeaturedSection/home_living.jpg' },
      { key: 'lead_link', label: 'Lead button link', value: '/shop' },
      { key: 'right_eyebrow', label: 'Product eyebrow', value: 'Sale Items' },
      { key: 'right_heading', label: 'Product heading', value: 'Top Picks This Week' },
      { key: 'product_ids', label: 'Product IDs (comma-separated)', value: '' },
    ],
  },
  {
    id: 'promo-pair',
    label: 'Promo Pair',
    eyebrow: 'Promo Banners',
    title: 'Split callout banners',
    description: 'Two wide visual promos for category pushes. Image URLs and links are editable per side.',
    status: 'live',
    accent: 'from-cyan-500/20 to-blue-400/10',
    fields: [
      { key: 'left_eyebrow', label: 'Left eyebrow', value: 'Limited Offer' },
      { key: 'left_heading', label: 'Left heading', value: 'Build Your Home with Furniture' },
      { key: 'left_button', label: 'Left button', value: 'Shop Now' },
      { key: 'left_image', label: 'Left image URL', value: '/Images/PromoBanners/ct2-img1-large.jpg' },
      { key: 'left_link', label: 'Left link', value: '/shop?category=8' },
      { key: 'right_eyebrow', label: 'Right eyebrow', value: 'New Collection' },
      { key: 'right_heading', label: 'Right heading', value: 'Choose Your Best Appliance' },
      { key: 'right_button', label: 'Right button', value: 'Explore' },
      { key: 'right_image', label: 'Right image URL', value: '/Images/PromoBanners/ct2-img2-large.jpg' },
      { key: 'right_link', label: 'Right link', value: '/shop?category=4' },
    ],
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    eyebrow: 'Footer Conversion',
    title: 'Email capture section',
    description: 'Bottom-of-page conversion block for subscribers, launch updates, and campaign retention.',
    status: 'live',
    accent: 'from-slate-500/20 to-slate-300/10',
    fields: [
      { key: 'badge', label: 'Badge', value: 'Newsletter' },
      { key: 'heading', label: 'Heading', value: 'Stay in the Loop' },
      { key: 'description', label: 'Description', value: 'Get exclusive deals, new arrivals, and interior tips delivered to your inbox.', kind: 'textarea' },
      { key: 'button', label: 'Button copy', value: 'Subscribe' },
    ],
  },
]

const statusConfig: Record<BuilderSectionStatus, { label: string; dot: string; badge: string }> = {
  live: {
    label: 'Live',
    dot: 'bg-emerald-500',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  draft: {
    label: 'Draft',
    dot: 'bg-amber-400',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  planned: {
    label: 'Planned',
    dot: 'bg-slate-400',
    badge: 'border-slate-200 bg-slate-100 text-slate-600',
  },
}

const fallbackImage = '/Images/HeroSection/chairs_stools.jpg'

const getFieldValue = (section: BuilderSection, key: string) =>
  section.fields.find((field) => field.key === key)?.value ?? ''

const parseIdList = (value: string) =>
  value
    .split(',')
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isFinite(item) && item > 0)

const mergeItemIntoSection = (section: BuilderSection, item?: WebPageItem): BuilderSection => {
  if (!item) return section

  const payload = (item.payload ?? {}) as {
    status?: BuilderSectionStatus
    eyebrow?: string
    accent?: string
    fields?: Record<string, string>
  }

  return {
    ...section,
    dbId: item.id,
    eyebrow: payload.eyebrow || section.eyebrow,
    title: item.subtitle || section.title,
    description: item.body || section.description,
    status: payload.status || section.status,
    accent: payload.accent || section.accent,
    fields: section.fields.map((field) => ({
      ...field,
      value: payload.fields?.[field.key] ?? field.value,
    })),
  }
}

// Section icons
function SectionIcon({ id }: { id: BuilderSectionId }) {
  if (id === 'announcements') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    )
  }
  if (id === 'campaign-banners') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
      </svg>
    )
  }
  if (id === 'category-grid') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  }
  if (id === 'featured-collection') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    )
  }
  if (id === 'promo-pair') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

export default function ShopBuilderStudio() {
  const [selectedSectionId, setSelectedSectionId] = useState<BuilderSectionId>('category-grid')
  const [uploadingFieldKey, setUploadingFieldKey] = useState<string | null>(null)
  const { data, isLoading, isError } = useGetAdminWebPageItemsQuery({
    type: 'shop-builder',
    page: 1,
    perPage: 50,
    status: 'all',
  })
  const { data: categoriesData } = useGetCategoriesQuery({ per_page: 200 })
  const { data: productsData } = useGetProductsQuery({ perPage: 30, status: '1' })
  const [createItem, { isLoading: isCreating }] = useCreateAdminWebPageItemMutation()
  const [updateItem, { isLoading: isUpdating }] = useUpdateAdminWebPageItemMutation()
  const [dirtySections, setDirtySections] = useState<Record<string, BuilderSection>>({})

  const categories = useMemo(() => categoriesData?.categories ?? [], [categoriesData?.categories])
  const products = useMemo(() => productsData?.products ?? [], [productsData?.products])

  const sections = useMemo(() => {
    const itemsByKey = new Map(
      (data?.items ?? [])
        .filter((item) => typeof item.key === 'string' && item.key.trim().length > 0)
        .map((item) => [String(item.key), item]),
    )

    return defaultSections.map((section) => {
      const base = mergeItemIntoSection(section, itemsByKey.get(section.id))
      return dirtySections[section.id] ?? base
    })
  }, [data?.items, dirtySections])

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) ?? sections[0],
    [sections, selectedSectionId],
  )

  const selectedCategoryCards = useMemo(() => {
    const categorySection = sections.find((section) => section.id === 'category-grid')
    if (!categorySection) return []
    const ids = parseIdList(getFieldValue(categorySection, 'category_ids'))
    const selected = ids
      .map((id, index) => {
        const category = categories.find((item) => item.id === id)
        if (!category) return null
        return {
          id: category.id,
          name: category.name,
          count: category.product_count ?? 0,
          image:
            getFieldValue(categorySection, `category_image_${category.id}`) ||
            getFieldValue(categorySection, `card_${index + 1}_image`) ||
            category.image ||
            fallbackImage,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))

    const remaining = categories
      .filter((category) => !selected.some((item) => item.id === category.id))
      .map((category) => ({
        id: category.id,
        name: category.name,
        count: category.product_count ?? 0,
        image: category.image || fallbackImage,
      }))

    if (selected.length > 0) return [...selected, ...remaining]

    return remaining
  }, [categories, sections])

  const categoryEditorCards = useMemo(() => {
    const categorySection = sections.find((section) => section.id === 'category-grid')
    if (!categorySection) return []

    const selectedIds = parseIdList(getFieldValue(categorySection, 'category_ids'))
    const selectedSet = new Set(selectedIds)
    const orderedCategories = [
      ...categories.filter((category) => selectedSet.has(category.id)),
      ...categories.filter((category) => !selectedSet.has(category.id)),
    ]

    return orderedCategories.map((category, index) => ({
      id: category.id,
      name: category.name,
      count: category.product_count ?? 0,
      image:
        getFieldValue(categorySection, `category_image_${category.id}`) ||
        getFieldValue(categorySection, `card_${index + 1}_image`) ||
        category.image ||
        fallbackImage,
    }))
  }, [categories, sections])

  const selectedFeatureProducts = useMemo(() => {
    const featuredSection = sections.find((section) => section.id === 'featured-collection')
    if (!featuredSection) return []
    const ids = parseIdList(getFieldValue(featuredSection, 'product_ids'))
    return ids
      .map((id) => products.find((item) => item.id === id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .slice(0, 4)
  }, [products, sections])

  const visibleSelectedFields = useMemo(() => {
    if (selectedSection.id !== 'category-grid') return selectedSection.fields
    return selectedSection.fields.filter((field) => !/^card_[1-4]_image$/.test(field.key))
  }, [selectedSection])

  const updateField = (sectionId: BuilderSectionId, fieldKey: string, value: string) => {
    setDirtySections((current) => {
      const base = sections.find((section) => section.id === sectionId)
      if (!base) return current
      return {
        ...current,
        [sectionId]: {
          ...base,
          fields: base.fields.map((field) => (field.key === fieldKey ? { ...field, value } : field)),
        },
      }
    })
  }

  const updateStatus = (sectionId: BuilderSectionId, status: BuilderSectionStatus) => {
    setDirtySections((current) => {
      const base = sections.find((section) => section.id === sectionId)
      if (!base) return current
      return { ...current, [sectionId]: { ...base, status } }
    })
  }

  const toggleCategorySelection = (categoryId: number) => {
    const sectionId: BuilderSectionId = 'category-grid'
    const categorySection = sections.find((section) => section.id === sectionId)
    if (!categorySection) return
    const currentIds = parseIdList(getFieldValue(categorySection, 'category_ids'))
    const nextIds = currentIds.includes(categoryId)
      ? currentIds.filter((id) => id !== categoryId)
      : [...currentIds, categoryId]
    updateField(sectionId, 'category_ids', nextIds.join(','))
  }

  const uploadImageForField = async (sectionId: BuilderSectionId, fieldKey: string, file: File | null) => {
    if (!file) return

    const payload = new FormData()
    payload.append('file', file)
    payload.append('folder', 'web-content')

    setUploadingFieldKey(fieldKey)

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: payload,
      })

      const result = (await response.json()) as { url?: string; error?: string }

      if (!response.ok || !result.url) {
        throw new Error(result.error || 'Failed to upload image.')
      }

      updateField(sectionId, fieldKey, result.url)
      showSuccessToast('Image uploaded.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image.'
      showErrorToast(message)
    } finally {
      setUploadingFieldKey(null)
    }
  }

  const saveSection = async () => {
    const section = selectedSection
    if (!section) return

    const payload = {
      key: section.id,
      title: section.label,
      subtitle: section.title,
      body: section.description,
      sort_order: defaultSections.findIndex((item) => item.id === section.id),
      is_active: true,
      payload: {
        status: section.status,
        eyebrow: section.eyebrow,
        accent: section.accent,
        fields: Object.fromEntries(section.fields.map((field) => [field.key, field.value])),
      },
    }

    try {
      if (section.dbId) {
        await updateItem({ type: 'shop-builder', id: section.dbId, data: payload }).unwrap()
      } else {
        await createItem({ type: 'shop-builder', data: payload }).unwrap()
      }

      setDirtySections((current) => {
        const next = { ...current }
        delete next[section.id]
        return next
      })
      showSuccessToast(`${section.label} saved.`)
    } catch (error) {
      const apiErr = error as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to save section.')
    }
  }

  const isSaving = isCreating || isUpdating
  const isDirty = Boolean(dirtySections[selectedSectionId])
  const savedCount = data?.items?.length ?? 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading shop builder…</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-12 text-center shadow-sm">
        <p className="text-sm font-semibold text-red-600">Failed to load shop builder data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-600">Shop Builder Studio</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">Page Editor</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {savedCount} of {sections.length} sections saved · Edit sections and click Save to publish.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty ? (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All saved
            </span>
          )}
          <a
            href="/shop"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            View Live /shop
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>

      {/* ── 3-column layout ── */}
      <div className="grid gap-4 xl:grid-cols-[256px_minmax(0,1fr)_348px]">

        {/* ── LEFT: Section nav ── */}
        <aside className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Sections</p>
            <p className="mt-0.5 text-xs text-slate-400">{sections.length} blocks total</p>
          </div>
          <nav className="space-y-1 p-3">
            {sections.map((section, index) => {
              const active = section.id === selectedSection.id
              const dirty = Boolean(dirtySections[section.id])
              const sc = statusConfig[section.status]

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedSectionId(section.id)}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                    active
                      ? 'bg-cyan-50 text-cyan-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-xl transition ${
                    active ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}>
                    <SectionIcon id={section.id} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-semibold leading-none ${active ? 'text-cyan-900' : 'text-slate-900'}`}>
                        {section.label}
                      </p>
                      {dirty ? <span className="h-1.5 w-1.5 flex-none rounded-full bg-amber-400" title="Unsaved" /> : null}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                      <p className="text-[11px] text-slate-400">{sc.label}</p>
                      <span className="text-[11px] text-slate-300">·</span>
                      <p className="text-[11px] text-slate-400">Block {index + 1}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* ── CENTER: Preview canvas ── */}
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Live Preview</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">/shop Visual Canvas</p>
            </div>
            <p className="text-[11px] text-slate-400">Click a section to edit it</p>
          </div>

          <div className="p-4">
            <div className="rounded-[28px] bg-slate-100 p-3">
              <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
                <PreviewAnnouncements section={sections[0]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} />
                <PreviewCampaignBanners section={sections[1]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} />
                <PreviewCategoryGrid section={sections[2]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} categoryCards={selectedCategoryCards} />
                <PreviewFeaturedCollection section={sections[3]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} featuredProducts={selectedFeatureProducts} />
                <PreviewPromoPair section={sections[4]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} />
                <PreviewNewsletter section={sections[5]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} />
              </div>
            </div>
          </div>
        </section>

        {/* ── RIGHT: Editor panel ── */}
        <aside className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Section header */}
          <div className={`rounded-t-3xl bg-linear-to-br ${selectedSection.accent} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{selectedSection.eyebrow}</p>
                <h2 className="mt-1.5 text-lg font-bold text-slate-900">{selectedSection.label}</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{selectedSection.description}</p>
              </div>
              <span className={`mt-0.5 flex-none rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusConfig[selectedSection.status].badge}`}>
                {statusConfig[selectedSection.status].label}
              </span>
            </div>

            {/* Status switcher */}
            <div className="mt-4 flex gap-1.5">
              {(['live', 'draft', 'planned'] as BuilderSectionStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateStatus(selectedSection.id, s)}
                  className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold capitalize transition ${
                    selectedSection.status === s
                      ? statusConfig[s].badge
                      : 'border-slate-200 bg-white/60 text-slate-500 hover:bg-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Fields</p>

            {visibleSelectedFields.map((field) => (
              <div key={field.key}>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {field.label}
                </label>
                {field.kind === 'textarea' ? (
                  <textarea
                    value={field.value}
                    onChange={(event) => updateField(selectedSection.id, field.key, event.target.value)}
                    rows={3}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                  />
                ) : field.key.includes('image') ? (
                  <div className="mt-1.5 space-y-2">
                    <input
                      value={field.value}
                      onChange={(event) => updateField(selectedSection.id, field.key, event.target.value)}
                      placeholder="Paste URL or upload below"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                    />
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-3.5 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-white">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 16 12 12 8 16" />
                        <line x1="12" y1="12" x2="12" y2="21" />
                        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                      </svg>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null
                          void uploadImageForField(selectedSection.id, field.key, file)
                          event.currentTarget.value = ''
                        }}
                      />
                      {uploadingFieldKey === field.key ? 'Uploading…' : 'Upload Image'}
                    </label>
                    {field.value ? (
                      <div className="relative h-28 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        <Image src={field.value} alt={field.label} fill className="object-cover" unoptimized />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <input
                    value={field.value}
                    onChange={(event) => updateField(selectedSection.id, field.key, event.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                  />
                )}
              </div>
            ))}

            {/* Category image overrides */}
            {selectedSection.id === 'category-grid' ? (
              <DynamicCategoryImageFields
                section={selectedSection}
                categoryCards={categoryEditorCards}
                onChange={updateField}
                onUpload={uploadImageForField}
                uploadingFieldKey={uploadingFieldKey}
              />
            ) : null}

            {/* Category picker */}
            {selectedSection.id === 'category-grid' ? (
              <CategoryPickerPanel
                categories={categories}
                selectedIds={parseIdList(getFieldValue(selectedSection, 'category_ids'))}
                onToggle={toggleCategorySelection}
              />
            ) : null}

            {/* Product reference helper */}
            {selectedSection.id === 'featured-collection' ? (
              <HelperPanel
                title="Available products"
                items={products.map((product) => `${product.id} — ${product.name}`)}
              />
            ) : null}
          </div>

          {/* Save button */}
          <div className="mt-auto border-t border-slate-100 p-5">
            <button
              type="button"
              onClick={() => void saveSection()}
              disabled={isSaving}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isDirty ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-400 hover:bg-slate-500'
              }`}
            >
              {isSaving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving…
                </>
              ) : isDirty ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save Section
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Saved
                </>
              )}
            </button>
            <p className="mt-3 text-center text-[11px] text-slate-400">
              Changes publish to <span className="font-semibold text-slate-600">/shop</span> immediately after saving.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared preview wrapper — click to select a section
// ─────────────────────────────────────────────────────────────────────────────

function PreviewSection({
  section,
  selectedId,
  onSelect,
  children,
  label,
}: {
  section: BuilderSection
  selectedId: BuilderSectionId
  onSelect: (id: BuilderSectionId) => void
  children: ReactNode
  label?: string
}) {
  const active = section.id === selectedId

  return (
    <button
      type="button"
      onClick={() => onSelect(section.id)}
      className={`group relative block w-full text-left outline-none transition-all duration-200 ${
        active ? 'ring-2 ring-inset ring-cyan-400' : 'ring-1 ring-inset ring-transparent hover:ring-slate-300'
      }`}
    >
      {/* Section label pill */}
      <span className={`absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm transition ${
        active ? 'bg-cyan-600 text-white' : 'bg-slate-900/70 text-white/70 opacity-0 group-hover:opacity-100'
      }`}>
        {label ?? section.label}
      </span>
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview sections — closely match /shop UI
// ─────────────────────────────────────────────────────────────────────────────

function PreviewAnnouncements(props: { section: BuilderSection; selectedId: BuilderSectionId; onSelect: (id: BuilderSectionId) => void }) {
  const chips = getFieldValue(props.section, 'chip_group').split(',').map((item) => item.trim()).filter(Boolean)

  return (
    <PreviewSection {...props}>
      <div className="bg-white px-4 py-3">
        <div className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((item) => (
              <span key={item} className="inline-flex rounded-full border border-orange-100 bg-white px-3 py-1 text-[11px] font-semibold text-orange-700">
                {item}
              </span>
            ))}
            {chips.length === 0 ? (
              <span className="text-xs text-slate-400">No chips set</span>
            ) : null}
          </div>
        </div>
      </div>
    </PreviewSection>
  )
}

function PreviewCampaignBanners(props: { section: BuilderSection; selectedId: BuilderSectionId; onSelect: (id: BuilderSectionId) => void }) {
  const banners = [
    {
      title: getFieldValue(props.section, 'left_title'),
      subtitle: getFieldValue(props.section, 'left_subtitle'),
      image: getFieldValue(props.section, 'left_image') || fallbackImage,
    },
    {
      title: getFieldValue(props.section, 'right_title'),
      subtitle: getFieldValue(props.section, 'right_subtitle'),
      image: getFieldValue(props.section, 'right_image') || fallbackImage,
    },
  ]

  return (
    <PreviewSection {...props}>
      <div className="px-4 py-4">
        <div className="grid gap-3 md:grid-cols-2">
          {banners.map((banner) => (
            <div key={banner.title} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
              <div className="relative min-h-35">
                <Image src={banner.image} alt={banner.title || 'Campaign banner'} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
                <div className="absolute inset-0 bg-linear-to-r from-slate-950/75 to-slate-900/20" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-base font-bold text-white">{banner.title}</p>
                  <p className="mt-0.5 text-xs text-white/80">{banner.subtitle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PreviewSection>
  )
}

function PreviewCategoryGrid(props: {
  section: BuilderSection
  selectedId: BuilderSectionId
  onSelect: (id: BuilderSectionId) => void
  categoryCards: Array<{ id: number; name: string; count: number; image: string }>
}) {
  const [offset, setOffset] = useState(0)
  const cards = props.categoryCards.length > 0
    ? props.categoryCards
    : [1, 2, 3, 4].map((index) => ({
        id: index,
        name: `Category ${index}`,
        count: 0,
        image: getFieldValue(props.section, `card_${index}_image`) || fallbackImage,
      }))

  const visibleCards = cards.slice(offset, offset + 4)
  const canGoLeft = offset > 0
  const canGoRight = offset + 4 < cards.length

  return (
    <PreviewSection {...props}>
      <div className="px-4 py-8">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
            {getFieldValue(props.section, 'eyebrow') || 'Shop by Category'}
          </p>
          <h2 className="mt-1.5 text-2xl font-bold text-slate-900">
            {getFieldValue(props.section, 'heading') || 'Find Your Perfect Furniture'}
          </h2>
        </div>

        <div className="relative">
          {canGoLeft ? (
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); setOffset((c) => Math.max(0, c - 1)) }}
              className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md md:inline-flex"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          ) : null}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {visibleCards.map((card) => (
              <div key={card.id} className="group relative overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="relative h-32">
                  <Image src={card.image} alt={card.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                  <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm font-bold leading-tight text-white transition-colors duration-300 group-hover:text-orange-300">{card.name}</p>
                    <p className="mt-0.5 text-[10px] text-white/60">{card.count} Products</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {canGoRight ? (
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); setOffset((c) => (c + 4 < cards.length ? c + 1 : c)) }}
              className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md md:inline-flex"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          ) : null}
        </div>

        {cards.length > 4 ? (
          <p className="mt-3 text-center text-[11px] text-slate-400">
            Showing {offset + 1}–{Math.min(offset + 4, cards.length)} of {cards.length} categories
          </p>
        ) : null}
      </div>
    </PreviewSection>
  )
}

function PreviewFeaturedCollection(props: {
  section: BuilderSection
  selectedId: BuilderSectionId
  onSelect: (id: BuilderSectionId) => void
  featuredProducts: Array<{ id: number; name: string; image: string | null; priceSrp: number }>
}) {
  const products = props.featuredProducts.length > 0
    ? props.featuredProducts
    : [1, 2, 3, 4].map((index) => ({ id: index, name: `Product ${index}`, image: fallbackImage, priceSrp: 2600 }))

  return (
    <PreviewSection {...props}>
      <div className="bg-gray-50 px-4 py-10">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          {/* Lead image */}
          <div className="group relative aspect-4/5 overflow-hidden rounded-3xl">
            <Image
              src={getFieldValue(props.section, 'lead_image') || fallbackImage}
              alt={getFieldValue(props.section, 'left_heading') || 'Featured'}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-orange-300">
                {getFieldValue(props.section, 'left_eyebrow') || 'Featured'}
              </p>
              <h2 className="mb-2 text-2xl font-bold leading-tight text-white">
                {getFieldValue(props.section, 'left_heading') || 'Minimal & Simple Design'}
              </h2>
              <p className="mb-4 text-xs text-white/60">
                {getFieldValue(props.section, 'left_description') || 'Crafted for the modern home.'}
              </p>
              <span className="inline-flex rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-semibold text-white">
                Shop Collection
              </span>
            </div>
          </div>

          {/* Products grid */}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-orange-500">
              {getFieldValue(props.section, 'right_eyebrow') || 'Sale Items'}
            </p>
            <h2 className="mb-5 text-xl font-bold text-slate-900">
              {getFieldValue(props.section, 'right_heading') || 'Top Picks This Week'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <div key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="relative h-28 bg-slate-100">
                    <Image src={product.image || fallbackImage} alt={product.name} fill className="object-cover" unoptimized />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs font-semibold text-slate-800">{product.name}</p>
                    <p className="mt-1 text-sm font-bold text-orange-500">PHP {product.priceSrp.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PreviewSection>
  )
}

function PreviewPromoPair(props: { section: BuilderSection; selectedId: BuilderSectionId; onSelect: (id: BuilderSectionId) => void }) {
  const promos = [
    {
      eyebrow: getFieldValue(props.section, 'left_eyebrow'),
      title: getFieldValue(props.section, 'left_heading'),
      button: getFieldValue(props.section, 'left_button'),
      image: getFieldValue(props.section, 'left_image') || fallbackImage,
      tone: 'from-slate-900/90 via-slate-900/40 to-transparent',
      badge: 'text-orange-300',
    },
    {
      eyebrow: getFieldValue(props.section, 'right_eyebrow'),
      title: getFieldValue(props.section, 'right_heading'),
      button: getFieldValue(props.section, 'right_button'),
      image: getFieldValue(props.section, 'right_image') || fallbackImage,
      tone: 'from-sky-900/90 via-sky-900/40 to-transparent',
      badge: 'text-sky-300',
    },
  ]

  return (
    <PreviewSection {...props}>
      <div className="px-4 py-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {promos.map((promo) => (
            <div key={promo.title} className="group relative h-72 overflow-hidden rounded-3xl">
              <Image src={promo.image} alt={promo.title || 'Promo'} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
              <div className={`absolute inset-0 bg-linear-to-t ${promo.tone}`} />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <p className={`mb-1.5 text-[10px] font-semibold uppercase tracking-widest ${promo.badge}`}>{promo.eyebrow}</p>
                <h3 className="mb-4 text-xl font-bold leading-tight text-white">{promo.title}</h3>
                <span className="inline-flex w-fit rounded-xl bg-white/15 px-5 py-2 text-xs font-semibold text-white backdrop-blur-sm">
                  {promo.button}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PreviewSection>
  )
}

function PreviewNewsletter(props: { section: BuilderSection; selectedId: BuilderSectionId; onSelect: (id: BuilderSectionId) => void }) {
  return (
    <PreviewSection {...props}>
      <div className="bg-slate-900 px-4 py-12 text-center">
        <span className="inline-block rounded-full bg-orange-500/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-orange-400">
          {getFieldValue(props.section, 'badge') || 'Newsletter'}
        </span>
        <h3 className="mx-auto mt-4 max-w-xs text-2xl font-bold text-white">
          {getFieldValue(props.section, 'heading') || 'Stay in the Loop'}
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/50">
          {getFieldValue(props.section, 'description') || 'Get exclusive deals and interior tips delivered to your inbox.'}
        </p>
        <div className="mx-auto mt-6 flex max-w-sm gap-2">
          <div className="h-11 flex-1 rounded-2xl border border-white/10 bg-white/10" />
          <div className="rounded-2xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white">
            {getFieldValue(props.section, 'button') || 'Subscribe'}
          </div>
        </div>
      </div>
    </PreviewSection>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Editor helper panels
// ─────────────────────────────────────────────────────────────────────────────

function HelperPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="mt-2 max-h-36 space-y-1 overflow-y-auto text-xs text-slate-500">
        {items.length > 0 ? items.map((item) => <p key={item}>{item}</p>) : <p className="text-slate-400">No data yet.</p>}
      </div>
    </div>
  )
}

function CategoryPickerPanel({
  categories,
  selectedIds,
  onToggle,
}: {
  categories: Array<{ id: number; name: string; product_count?: number }>
  selectedIds: number[]
  onToggle: (categoryId: number) => void
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Category picker</p>
      <p className="mt-1 text-[11px] text-slate-400">Toggle categories to include them in the shop carousel.</p>
      <div className="mt-3 max-h-52 space-y-1.5 overflow-y-auto">
        {categories.map((category) => {
          const active = selectedIds.includes(category.id)
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onToggle(category.id)}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                active
                  ? 'border-cyan-300 bg-cyan-50 text-cyan-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div>
                <p className="text-xs font-semibold">{category.name}</p>
                <p className="text-[10px] text-slate-400">ID {category.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">{category.product_count ?? 0}</span>
                <span className={`h-4 w-4 rounded-full border-2 transition ${
                  active ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300 bg-white'
                }`} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DynamicCategoryImageFields({
  section,
  categoryCards,
  onChange,
  onUpload,
  uploadingFieldKey,
}: {
  section: BuilderSection
  categoryCards: Array<{ id: number; name: string; count: number; image: string }>
  onChange: (sectionId: BuilderSectionId, fieldKey: string, value: string) => void
  onUpload: (sectionId: BuilderSectionId, fieldKey: string, file: File | null) => Promise<void>
  uploadingFieldKey: string | null
}) {
  if (categoryCards.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Category image overrides</p>
      <p className="mt-1 text-[11px] text-slate-400">Upload custom images per category slot.</p>
      <div className="mt-3 max-h-120 space-y-3 overflow-y-auto pr-0.5">
        {categoryCards.map((category) => {
          const fieldKey = `category_image_${category.id}`
          const fieldValue = getFieldValue(section, fieldKey) || category.image || ''

          return (
            <div key={category.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-900">{category.name}</p>
                  <p className="text-[10px] text-slate-400">ID {category.id} · {category.count} items</p>
                </div>
                {fieldValue ? (
                  <div className="relative h-10 w-16 flex-none overflow-hidden rounded-lg border border-slate-200">
                    <Image src={fieldValue} alt={category.name} fill className="object-cover" unoptimized />
                  </div>
                ) : null}
              </div>

              <input
                value={fieldValue}
                onChange={(event) => onChange(section.id, fieldKey, event.target.value)}
                placeholder="Image URL"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-2 focus:ring-cyan-100"
              />

              <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-cyan-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-cyan-700 transition hover:bg-cyan-50">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    void onUpload(section.id, fieldKey, file)
                    event.currentTarget.value = ''
                  }}
                />
                {uploadingFieldKey === fieldKey ? 'Uploading…' : 'Upload'}
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
