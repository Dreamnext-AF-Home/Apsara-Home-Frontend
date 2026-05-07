'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  | 'shop-header'
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
  kind?: 'textarea' | 'video'
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

const sectionFieldWhitelist: Partial<Record<BuilderSectionId, string[]>> = {
  'shop-header': [
    'contact_phone',
    'contact_email',
    'marquee_messages',
    'facebook_label',
    'facebook_url',
    'instagram_label',
    'instagram_url',
    'tiktok_label',
    'tiktok_url',
    'trust_item_1_title',
    'trust_item_1_desc',
    'trust_item_2_title',
    'trust_item_2_desc',
    'trust_item_3_title',
    'trust_item_3_desc',
    'trust_item_4_title',
    'trust_item_4_desc',
  ],
  'featured-collection': [
    'left_eyebrow',
    'left_heading',
    'left_description',
    'lead_image',
    'right_eyebrow',
    'right_heading',
    'source_category_id',
  ],
}

const defaultSections: BuilderSection[] = [
  {
    id: 'shop-header',
    label: 'Shop Header',
    eyebrow: 'Storefront Chrome',
    title: 'Top contact strip and trust bar',
    description: 'Controls the top contact info, social links, marquee messages, and trust highlights shown above the shop content.',
    status: 'live',
    accent: 'from-[#f5f0e6] to-white',
    fields: [
      { key: 'contact_phone', label: 'Contact phone', value: '+63 912 345 6789' },
      { key: 'contact_email', label: 'Contact email', value: 'hello@afhome.ph' },
      {
        key: 'marquee_messages',
        label: 'Marquee messages (one per line)',
        value: '',
        kind: 'textarea',
      },
      { key: 'facebook_label', label: 'Facebook label', value: 'FB' },
      { key: 'facebook_url', label: 'Facebook URL', value: '' },
      { key: 'instagram_label', label: 'Instagram label', value: 'IG' },
      { key: 'instagram_url', label: 'Instagram URL', value: '' },
      { key: 'tiktok_label', label: 'TikTok label', value: 'TikTok' },
      { key: 'tiktok_url', label: 'TikTok URL', value: '' },
      { key: 'trust_item_1_title', label: 'Trust item 1 title', value: '' },
      { key: 'trust_item_1_desc', label: 'Trust item 1 description', value: '' },
      { key: 'trust_item_2_title', label: 'Trust item 2 title', value: '' },
      { key: 'trust_item_2_desc', label: 'Trust item 2 description', value: '' },
      { key: 'trust_item_3_title', label: 'Trust item 3 title', value: '' },
      { key: 'trust_item_3_desc', label: 'Trust item 3 description', value: '' },
      { key: 'trust_item_4_title', label: 'Trust item 4 title', value: '' },
      { key: 'trust_item_4_desc', label: 'Trust item 4 description', value: '' },
    ],
  },
  {
    id: 'announcements',
    label: 'Announcements',
    eyebrow: 'Top Utility Bar',
    title: 'Service chips and campaign labels',
    description: 'Used for service advisories, trust signals, and quick promo chips above the shop content.',
    status: 'live',
    accent: 'from-[#f5f0e6] to-white',
    fields: [
      { key: 'chip_group', label: 'Chip group', value: 'Nationwide Shipping, Authenticity Guaranteed, Customer Care' },
    ],
  },
  {
    id: 'campaign-banners',
    label: 'Campaign Banners',
    eyebrow: 'Top Promos',
    title: 'Hero video banner',
    description: 'A large autoplaying hero-style video banner with editable copy and destination link.',
    status: 'live',
    accent: 'from-[#f5f0e6] to-white',
    fields: [
      { key: 'video_eyebrow', label: 'Video eyebrow', value: 'Top Promos' },
      { key: 'video_title', label: 'Video title', value: 'Weekend Furniture Drop' },
      { key: 'video_subtitle', label: 'Video subtitle', value: 'Refresh your living room this week' },
      { key: 'video_url', label: 'Video URL', value: '', kind: 'video' },
      { key: 'video_poster', label: 'Video poster image URL', value: '/Images/HeroSection/chairs_stools.jpg' },
      { key: 'link_type', label: 'Link type', value: 'category' },
      { key: 'link_category_id', label: 'Link category ID', value: '8' },
      { key: 'link_product_id', label: 'Link product ID', value: '' },
      { key: 'video_link', label: 'Custom video link', value: '/shop?category=8' },
      { key: 'video_button', label: 'Button text', value: 'Explore Now' },
    ],
  },
  {
    id: 'category-grid',
    label: 'Category Grid',
    eyebrow: 'Hero Section',
    title: 'Shop by category cards',
    description: 'This block can now pull real categories by ID. You can still override card images per slot.',
    status: 'live',
    accent: 'from-[#f5f0e6] to-white',
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
    title: 'Lead image + category-driven top picks',
    description: 'Select one category and the section will automatically show its products as Top Picks. The Shop Collection button will also navigate to that same category.',
    status: 'live',
    accent: 'from-[#f5f0e6] to-white',
    fields: [
      { key: 'left_eyebrow', label: 'Lead eyebrow', value: 'Featured' },
      { key: 'left_heading', label: 'Lead heading', value: 'Minimal & Simple Design' },
      { key: 'left_description', label: 'Lead description', value: 'Crafted for the modern home with a lighter, calmer visual merchandising tone.', kind: 'textarea' },
      { key: 'lead_image', label: 'Lead image URL', value: '/Images/FeaturedSection/home_living.jpg' },
      { key: 'right_eyebrow', label: 'Product eyebrow', value: 'Sale Items' },
      { key: 'right_heading', label: 'Product heading', value: 'Top Picks This Week' },
      { key: 'source_category_id', label: 'Source category ID', value: '' },
    ],
  },
  {
    id: 'promo-pair',
    label: 'Promo Pair',
    eyebrow: 'Promo Banners',
    title: 'Split callout banners',
    description: 'Two wide visual promos for category pushes. Image URLs and links are editable per side.',
    status: 'live',
    accent: 'from-[#f5f0e6] to-white',
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
    accent: 'from-[#f5f0e6] to-white',
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

const parseTrustItemsFromFields = (fields: BuilderField[]) => {
  const grouped = new Map<number, { title: string; desc: string }>()

  fields.forEach((field) => {
    const match = field.key.match(/^trust_item_(\d+)_(title|desc)$/)
    if (!match) return

    const index = Number.parseInt(match[1], 10)
    const kind = match[2]
    const current = grouped.get(index) ?? { title: '', desc: '' }

    if (kind === 'title') current.title = field.value
    if (kind === 'desc') current.desc = field.value

    grouped.set(index, current)
  })

  return Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([index, item]) => ({ index, title: item.title, desc: item.desc }))
}

const parseIdList = (value: string) =>
  value
    .split(',')
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isFinite(item) && item > 0)

const resolveCategoryImage = ({
  section,
  categoryId,
  slotIndex,
  categoryImage,
}: {
  section: BuilderSection
  categoryId: number
  slotIndex?: number
  categoryImage?: string | null
}) =>
  getFieldValue(section, `category_image_${categoryId}`) ||
  (typeof slotIndex === 'number' ? getFieldValue(section, `card_${slotIndex + 1}_image`) : '') ||
  categoryImage ||
  fallbackImage

const mergeItemIntoSection = (section: BuilderSection, item?: WebPageItem): BuilderSection => {
  if (!item) return section

  const payload = (item.payload ?? {}) as {
    status?: BuilderSectionStatus
    eyebrow?: string
    accent?: string
    fields?: Record<string, string>
  }

  const baseFields = section.fields.map((field) => ({
    ...field,
    value: payload.fields?.[field.key] ?? field.value,
  }))

  const extraFields = Object.entries(payload.fields ?? {})
    .filter(([key]) => !baseFields.some((field) => field.key === key))
    .map(([key, value]) => ({
      key,
      label: key.replace(/_/g, ' '),
      value,
    }))

  return {
    ...section,
    dbId: item.id,
    eyebrow: payload.eyebrow || section.eyebrow,
    title: item.subtitle || section.title,
    description: item.body || section.description,
    status: payload.status || section.status,
    accent: payload.accent || section.accent,
    fields: [...baseFields, ...extraFields],
  }
}

// Section icons
function SectionIcon({ id }: { id: BuilderSectionId }) {
  if (id === 'shop-header') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5h18" />
        <path d="M3 12h18" />
        <path d="M3 19h18" />
      </svg>
    )
  }
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
  const [uploadingFieldKeys, setUploadingFieldKeys] = useState<string[]>([])
  const { data, isLoading, isError, refetch } = useGetAdminWebPageItemsQuery({
    type: 'shop-builder',
    page: 1,
    perPage: 50,
    status: 'all',
  })
  const { data: categoriesData } = useGetCategoriesQuery({ per_page: 200 })
  const { data: productsData } = useGetProductsQuery({ perPage: 200, status: '1' })
  const [createItem, { isLoading: isCreating }] = useCreateAdminWebPageItemMutation()
  const [updateItem, { isLoading: isUpdating }] = useUpdateAdminWebPageItemMutation()
  const [dirtySections, setDirtySections] = useState<Record<string, BuilderSection>>({})

  const categories = useMemo(() => categoriesData?.categories ?? [], [categoriesData?.categories])
  const products = useMemo(() => productsData?.products ?? [], [productsData?.products])

  const sections = useMemo(() => {
    const itemsByKey = new Map<string, WebPageItem>()

    ;(data?.items ?? [])
      .filter((item) => typeof item.key === 'string' && item.key.trim().length > 0)
      .forEach((item) => {
        const key = String(item.key)
        // Keep the first occurrence so admin editing matches the same
        // newest record that the public /shop page reads.
        if (!itemsByKey.has(key)) {
          itemsByKey.set(key, item)
        }
      })

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
          image: resolveCategoryImage({
            section: categorySection,
            categoryId: category.id,
            slotIndex: index,
            categoryImage: category.image,
          }),
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))

    const remaining = categories
      .filter((category) => !selected.some((item) => item.id === category.id))
      .map((category) => ({
        id: category.id,
        name: category.name,
        count: category.product_count ?? 0,
        image: resolveCategoryImage({
          section: categorySection,
          categoryId: category.id,
          categoryImage: category.image,
        }),
      }))

    if (selected.length > 0) return [...selected, ...remaining]

    return remaining
  }, [categories, sections])

  const categoryEditorCards = useMemo(() => {
    const categorySection = sections.find((section) => section.id === 'category-grid')
    if (!categorySection) return []

    const selectedIds = parseIdList(getFieldValue(categorySection, 'category_ids'))
    const selectedSet = new Set(selectedIds)
    const selectedCategories = selectedIds
      .map((id) => categories.find((category) => category.id === id))
      .filter((category): category is NonNullable<typeof category> => Boolean(category))
      .map((category, index) => ({
        id: category.id,
        name: category.name,
        count: category.product_count ?? 0,
        image: resolveCategoryImage({
          section: categorySection,
          categoryId: category.id,
          slotIndex: index,
          categoryImage: category.image,
        }),
      }))

    const remainingCategories = categories
      .filter((category) => !selectedSet.has(category.id))
      .map((category) => ({
        id: category.id,
        name: category.name,
        count: category.product_count ?? 0,
        image: resolveCategoryImage({
          section: categorySection,
          categoryId: category.id,
          categoryImage: category.image,
        }),
      }))

    return selectedCategories.length > 0 ? [...selectedCategories, ...remainingCategories] : remainingCategories
  }, [categories, sections])

  const selectedFeatureProducts = useMemo(() => {
    const featuredSection = sections.find((section) => section.id === 'featured-collection')
    if (!featuredSection) return []
    const sourceCategoryId = Number.parseInt(getFieldValue(featuredSection, 'source_category_id'), 10)
    return Number.isFinite(sourceCategoryId) && sourceCategoryId > 0
      ? products.filter((item) => item.catid === sourceCategoryId).slice(0, 4)
      : []
  }, [products, sections])

  const visibleSelectedFields = useMemo(() => {
    if (selectedSection.id === 'shop-header') {
      const allowedFields = new Set(sectionFieldWhitelist['shop-header'] ?? [])
      return selectedSection.fields.filter((field) => allowedFields.has(field.key) && !/^trust_item_\d+_(title|desc)$/.test(field.key))
    }
    if (selectedSection.id === 'category-grid') {
      return selectedSection.fields.filter(
        (field) => !/^card_[1-4]_image$/.test(field.key) && !/^category_image_\d+$/.test(field.key),
      )
    }
    if (selectedSection.id === 'campaign-banners') {
      const linkType = getFieldValue(selectedSection, 'link_type') || 'category'
      return selectedSection.fields.filter((field) => {
        if (/^(left|right)_/.test(field.key)) return false
        if (/^link_(type|category_id|product_id)$/.test(field.key)) return false
        if (field.key === 'video_link') return linkType === 'custom'
        return true
      })
    }
    if (selectedSection.id === 'featured-collection') {
      const allowedFields = new Set(sectionFieldWhitelist['featured-collection'] ?? [])
      return selectedSection.fields.filter((field) => allowedFields.has(field.key))
    }
    return selectedSection.fields
  }, [selectedSection])

  const updateField = (sectionId: BuilderSectionId, fieldKey: string, value: string) => {
    setDirtySections((current) => {
      const base = sections.find((section) => section.id === sectionId)
      if (!base) return current
      const hasField = base.fields.some((field) => field.key === fieldKey)
      return {
        ...current,
        [sectionId]: {
          ...base,
          fields: hasField
            ? base.fields.map((field) => (field.key === fieldKey ? { ...field, value } : field))
            : [...base.fields, { key: fieldKey, label: fieldKey.replace(/_/g, ' '), value }],
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
    const targetField = sections
      .find((section) => section.id === sectionId)
      ?.fields.find((field) => field.key === fieldKey)
    const uploadType = file.type.startsWith('video/') ? 'video' : 'image'

    if (targetField?.kind === 'video' && uploadType !== 'video') {
      showErrorToast('Please upload a video file for this field.')
      return
    }

    if (targetField?.kind !== 'video' && uploadType !== 'image') {
      showErrorToast('Please upload an image file for this field.')
      return
    }

    const payload = new FormData()
    payload.append('file', file)
    payload.append('folder', 'web-content')
    payload.append('asset_type', uploadType)

    setUploadingFieldKeys((current) => (current.includes(fieldKey) ? current : [...current, fieldKey]))

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: payload,
      })

      const result = (await response.json()) as { url?: string; error?: string }

      if (!response.ok || !result.url) {
        throw new Error(result.error || `Failed to upload ${uploadType}.`)
      }

      updateField(sectionId, fieldKey, result.url)
      showSuccessToast(`${uploadType === 'video' ? 'Video' : 'Image'} uploaded.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to upload ${uploadType}.`
      showErrorToast(message)
    } finally {
      setUploadingFieldKeys((current) => current.filter((key) => key !== fieldKey))
    }
  }

  const saveSection = async () => {
    const section = selectedSection
    if (!section) return

    const allowedKeys = new Set(sectionFieldWhitelist[section.id] ?? section.fields.map((field) => field.key))
    const sectionFields = Object.fromEntries(
      section.fields
        .filter((field) => allowedKeys.has(field.key))
        .map((field) => [field.key, field.value]),
    )

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
        fields: sectionFields,
      },
    }

    try {
      if (section.dbId) {
        await updateItem({ type: 'shop-builder', id: section.dbId, data: payload }).unwrap()
      } else {
        await createItem({ type: 'shop-builder', data: payload }).unwrap()
      }

      await refetch()

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
  const uploadingFieldKey = uploadingFieldKeys[0] ?? null
  const isFieldUploading = (fieldKey: string) => uploadingFieldKeys.includes(fieldKey)

  if (isLoading) {
    return <ShopBuilderStudioSkeleton />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a1a1a] border-t-transparent" />
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
    <div className="space-y-8">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex flex-wrap items-end justify-between gap-6 border-b border-[#e8e5e1] pb-6"
      >
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-medium tracking-widest text-[#8a8a8a] uppercase">
            <span className="h-px w-8 bg-[#8a8a8a]" />
            Shop Builder Studio
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight text-[#1a1a1a]">Page Editor</h1>
          <p className="mt-1.5 text-sm text-[#8a8a8a]">
            {savedCount} of {sections.length} sections saved · Edit sections and click Save to publish.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {isDirty ? (
              <motion.span
                key="unsaved"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Unsaved changes
              </motion.span>
            ) : (
              <motion.span
                key="saved"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                All saved
              </motion.span>
            )}
          </AnimatePresence>
          <motion.a
            href="/shop"
            target="_blank"
            rel="noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#1a1a1a] bg-[#1a1a1a] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#2a2a2a]"
          >
            View Live /shop
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </motion.a>
        </div>
      </motion.div>

      {/* ── 3-column layout ── */}
      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_360px]">

        {/* ── LEFT: Section nav ── */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest text-[#8a8a8a] uppercase">
            <span className="h-px w-6 bg-[#8a8a8a]" />
            Sections
          </p>
          <nav className="space-y-px">
            {sections.map((section, index) => {
              const active = section.id === selectedSection.id
              const dirty = Boolean(dirtySections[section.id])
              const sc = statusConfig[section.status]

              return (
                <motion.button
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedSectionId(section.id)}
                  whileHover={{ x: active ? 0 : 4 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className={`group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-colors ${
                    active
                      ? 'bg-[#1a1a1a] text-white'
                      : 'text-[#1a1a1a] hover:bg-[#f5f0e6]'
                  }`}
                >
                  <span className={`flex-none text-xs font-medium tracking-widest transition-colors ${
                    active ? 'text-[#c9a96e]' : 'text-[#8a8a8a] group-hover:text-[#c9a96e]'
                  }`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium leading-none ${active ? 'text-white' : 'text-[#1a1a1a]'}`}>
                        {section.label}
                      </p>
                      {dirty ? <span className="h-1.5 w-1.5 flex-none rounded-full bg-amber-400" title="Unsaved" /> : null}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                      <p className={`text-[11px] ${active ? 'text-white/50' : 'text-[#8a8a8a]'}`}>{sc.label}</p>
                    </div>
                  </div>
                  {active && (
                    <motion.span
                      layoutId="section-active-arrow"
                      className="flex-none text-[#c9a96e]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    >
                      →
                    </motion.span>
                  )}
                </motion.button>
              )
            })}
          </nav>

          {/* Divider + info */}
          <div className="mt-6 border-t border-[#e8e5e1] pt-5">
            <p className="text-[11px] leading-relaxed text-[#8a8a8a]">
              Click a section to edit its content. Changes are local until you press Save.
            </p>
          </div>
        </motion.aside>

        {/* ── CENTER: Preview canvas ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          className="overflow-hidden rounded-3xl border border-[#e8e5e1] bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-[#e8e5e1] px-5 py-4">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-medium tracking-widest text-[#8a8a8a] uppercase">
                <span className="h-px w-5 bg-[#8a8a8a]" />
                Live Preview
              </p>
              <p className="mt-0.5 text-sm font-medium text-[#1a1a1a]">/shop Visual Canvas</p>
            </div>
            <p className="text-[11px] text-[#8a8a8a]">Click any block to edit</p>
          </div>

          <div className="p-4">
            <div className="rounded-[24px] bg-[#f5f0e6]/30 p-3">
              <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(26,26,26,0.08)]">
                <PreviewShopHeader section={sections[0]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} />
                <PreviewAnnouncements section={sections[1]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} />
                <PreviewCampaignBanners section={sections[2]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} />
                <PreviewCategoryGrid section={sections[3]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} categoryCards={selectedCategoryCards} />
                <PreviewFeaturedCollection section={sections[4]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} featuredProducts={selectedFeatureProducts} />
                <PreviewPromoPair section={sections[5]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} />
                <PreviewNewsletter section={sections[6]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} />
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── RIGHT: Editor panel ── */}
        <AnimatePresence mode="wait">
          <motion.aside
            key={selectedSectionId}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col overflow-hidden rounded-3xl border border-[#e8e5e1] bg-white shadow-sm"
          >
            {/* Section header */}
            <div className="border-b border-[#e8e5e1] bg-[#faf9f7] p-6">
              <p className="inline-flex items-center gap-2 text-xs font-medium tracking-widest text-[#c9a96e] uppercase">
                <span className="h-px w-5 bg-[#c9a96e]" />
                {selectedSection.eyebrow}
              </p>
              <h2 className="mt-3 text-xl font-medium tracking-tight text-[#1a1a1a]">{selectedSection.label}</h2>
              <p className="mt-2 text-xs leading-relaxed text-[#6b6b6b]">{selectedSection.description}</p>

              {/* Status + badge row */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex gap-1.5">
                  {(['live', 'draft', 'planned'] as BuilderSectionStatus[]).map((s) => (
                    <motion.button
                      key={s}
                      type="button"
                      onClick={() => updateStatus(selectedSection.id, s)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium capitalize transition ${
                        selectedSection.status === s
                          ? statusConfig[s].badge
                          : 'border-[#e8e5e1] bg-white text-[#6b6b6b] hover:bg-[#f5f0e6]'
                      }`}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
                <span className={`flex-none rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusConfig[selectedSection.status].badge}`}>
                  {statusConfig[selectedSection.status].label}
                </span>
              </div>
            </div>

            {/* Fields */}
            <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
              <p className="inline-flex items-center gap-2 text-xs font-medium tracking-widest text-[#8a8a8a] uppercase">
                <span className="h-px w-5 bg-[#8a8a8a]" />
                Fields
              </p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
                className="flex flex-col gap-5"
              >
                {visibleSelectedFields.map((field) => (
                  <motion.div
                    key={field.key}
                    variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a] dark:text-slate-500">
                      {field.label}
                    </label>
                    {field.key === 'marquee_messages' ? (
                      <MarqueeMessagesEditor
                        value={field.value}
                        onChange={(value) => updateField(selectedSection.id, field.key, value)}
                      />
                    ) : selectedSection.id === 'shop-header' && field.key === 'tiktok_url' ? (
                      <>
                        <input
                          value={field.value}
                          onChange={(event) => updateField(selectedSection.id, field.key, event.target.value)}
                          className="mt-1.5 w-full rounded-2xl border border-[#e8e5e1] bg-[#faf9f7] px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none transition focus:border-[#c9a96e] focus:bg-white focus:ring-2 focus:ring-[#f5f0e6] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
                        />
                        <TrustItemsEditor
                          section={selectedSection}
                          onChange={(fieldKey, value) => updateField(selectedSection.id, fieldKey, value)}
                        />
                      </>
                    ) : field.kind === 'textarea' ? (
                      <textarea
                        value={field.value}
                        onChange={(event) => updateField(selectedSection.id, field.key, event.target.value)}
                        rows={3}
                        className="mt-1.5 w-full rounded-2xl border border-[#e8e5e1] bg-[#faf9f7] px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none transition focus:border-[#c9a96e] focus:bg-white focus:ring-2 focus:ring-[#f5f0e6] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
                      />
                    ) : field.kind === 'video' || field.key.includes('image') ? (
                      <div className="mt-1.5 space-y-2">
                        <input
                          value={field.value}
                          onChange={(event) => updateField(selectedSection.id, field.key, event.target.value)}
                          placeholder={field.kind === 'video' ? 'Paste video URL or upload below' : 'Paste URL or upload below'}
                          className="w-full rounded-2xl border border-[#e8e5e1] bg-[#faf9f7] px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none transition focus:border-[#c9a96e] focus:bg-white focus:ring-2 focus:ring-[#f5f0e6] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
                        />
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#e8e5e1] bg-[#faf9f7] px-3.5 py-2 text-xs font-medium text-[#1a1a1a] transition hover:border-[#1a1a1a] hover:bg-white dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-300 dark:hover:bg-cyan-950/40">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 16 12 12 8 16" />
                            <line x1="12" y1="12" x2="12" y2="21" />
                            <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                          </svg>
                          <input
                            type="file"
                            accept={field.kind === 'video' ? 'video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-ms-wmv' : 'image/jpeg,image/png,image/webp,image/gif'}
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null
                              void uploadImageForField(selectedSection.id, field.key, file)
                              event.currentTarget.value = ''
                            }}
                          />
                          {uploadingFieldKey === field.key ? 'Uploading...' : field.kind === 'video' ? 'Upload Video' : 'Upload Image'}
                        </label>
                        <div className="relative h-28 overflow-hidden rounded-2xl border border-[#e8e5e1] bg-[#faf9f7]">
                          {(() => {
                            const fallbackPoster =
                              field.kind === 'video' && selectedSection.id === 'campaign-banners'
                                ? getFieldValue(selectedSection, 'video_poster') || fallbackImage
                                : ''
                            const hasPreview = Boolean(field.value || fallbackPoster)

                            return hasPreview ? (
                            field.kind === 'video' ? (
                              field.value ? (
                                <video
                                  src={field.value}
                                  poster={fallbackPoster || undefined}
                                  className={`h-full w-full object-cover transition ${isFieldUploading(field.key) ? 'opacity-35 blur-[1px]' : ''}`}
                                  muted
                                  loop
                                  autoPlay
                                  playsInline
                                />
                              ) : (
                                <Image
                                  src={fallbackPoster}
                                  alt="Video poster preview"
                                  fill
                                  className={`object-cover transition ${isFieldUploading(field.key) ? 'opacity-35 blur-[1px]' : ''}`}
                                  unoptimized
                                />
                              )
                            ) : (
                              <Image
                                src={field.value}
                                alt={field.label}
                                fill
                                className={`object-cover transition ${isFieldUploading(field.key) ? 'opacity-35 blur-[1px]' : ''}`}
                                unoptimized
                              />
                            )
                            ) : null
                          })()}
                          {isFieldUploading(field.key) ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/75 backdrop-blur-[1px]">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1a1a1a] border-t-transparent" />
                              <p className="text-xs font-semibold text-[#1a1a1a]">{field.kind === 'video' ? 'Uploading video...' : 'Uploading image...'}</p>
                            </div>
                          ) : null}
                          {!field.value && !(field.kind === 'video' && selectedSection.id === 'campaign-banners' && getFieldValue(selectedSection, 'video_poster')) && !isFieldUploading(field.key) ? (
                            <div className="absolute inset-0 animate-pulse bg-linear-to-r from-[#f5f0e6] via-white to-[#f5f0e6]" />
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1.5 space-y-2">
                        <input
                          value={field.value}
                          onChange={(event) => updateField(selectedSection.id, field.key, event.target.value)}
                          className="w-full rounded-2xl border border-[#e8e5e1] bg-[#faf9f7] px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none transition focus:border-[#c9a96e] focus:bg-white focus:ring-2 focus:ring-[#f5f0e6] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
                        />
                        {/^https?:\/\//i.test(field.value.trim()) ? (
                          <a
                            href={field.value.trim()}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e5e1] bg-white px-3 py-1.5 text-[11px] font-medium text-[#6b6b6b] transition hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
                          >
                            Open Link
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        ) : null}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>

              {/* Category image overrides */}
              {selectedSection.id === 'category-grid' ? (
                <DynamicCategoryImageFields
                  section={selectedSection}
                  categoryCards={categoryEditorCards}
                  onChange={updateField}
                  onUpload={uploadImageForField}
                  uploadingFieldKeys={uploadingFieldKeys}
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

              {selectedSection.id === 'featured-collection' ? (
                <FeaturedCategoryPickerPanel
                  categories={categories}
                  selectedId={Number.parseInt(getFieldValue(selectedSection, 'source_category_id'), 10)}
                  onSelect={(categoryId) => updateField(selectedSection.id, 'source_category_id', categoryId > 0 ? String(categoryId) : '')}
                />
              ) : null}

              {selectedSection.id === 'campaign-banners' ? (
                <CampaignBannerLinkPanel
                  categories={categories}
                  products={products}
                  selectedType={getFieldValue(selectedSection, 'link_type') || 'category'}
                  selectedCategoryId={Number.parseInt(getFieldValue(selectedSection, 'link_category_id'), 10)}
                  selectedProductId={Number.parseInt(getFieldValue(selectedSection, 'link_product_id'), 10)}
                  customLink={getFieldValue(selectedSection, 'video_link')}
                  onTypeChange={(value) => updateField(selectedSection.id, 'link_type', value)}
                  onCategorySelect={(categoryId) => updateField(selectedSection.id, 'link_category_id', categoryId > 0 ? String(categoryId) : '')}
                  onProductSelect={(productId) => updateField(selectedSection.id, 'link_product_id', productId > 0 ? String(productId) : '')}
                />
              ) : null}
            </div>

            {/* Save button */}
            <div className="mt-auto border-t border-[#e8e5e1] bg-[#faf9f7] p-5">
              <motion.button
                type="button"
                onClick={() => void saveSection()}
                disabled={isSaving}
                whileHover={!isSaving ? { scale: 1.02 } : {}}
                whileTap={!isSaving ? { scale: 0.98 } : {}}
                transition={{ duration: 0.2 }}
                className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isDirty ? 'bg-[#1a1a1a] hover:bg-[#2a2a2a]' : 'bg-[#8a8a8a]'
                }`}
              >
                {isSaving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
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
              </motion.button>
              <p className="mt-3 text-center text-[11px] text-[#8a8a8a]">
                Changes publish to <span className="font-medium text-[#1a1a1a]">/shop</span> immediately after saving.
              </p>
            </div>
          </motion.aside>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared preview wrapper — click to select a section
// ─────────────────────────────────────────────────────────────────────────────

function ShopBuilderStudioSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="space-y-3">
          <div className="h-3 w-32 rounded-full bg-slate-200" />
          <div className="h-7 w-44 rounded-full bg-slate-200" />
          <div className="h-4 w-72 rounded-full bg-slate-100" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 rounded-full bg-slate-100" />
          <div className="h-10 w-36 rounded-2xl bg-slate-100" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[256px_minmax(0,1fr)_348px]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-4 space-y-2 border-b border-slate-100 dark:border-slate-800 px-1 pb-4">
            <div className="h-3 w-20 rounded-full bg-slate-200" />
            <div className="h-3 w-24 rounded-full bg-slate-100" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl px-3 py-3">
                <div className="h-8 w-8 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 rounded-full bg-slate-200" />
                  <div className="h-3 w-20 rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded-full bg-slate-200" />
              <div className="h-4 w-36 rounded-full bg-slate-100" />
            </div>
            <div className="h-3 w-32 rounded-full bg-slate-100" />
          </div>
          <div className="p-4">
            <div className="rounded-[28px] bg-slate-100 p-3">
              <div className="space-y-4 rounded-3xl bg-white p-4">
                <div className="h-14 rounded-2xl bg-slate-100" />
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="h-36 rounded-3xl bg-slate-100" />
                  <div className="h-36 rounded-3xl bg-slate-100" />
                </div>
                <div className="space-y-5 rounded-3xl border border-slate-100 p-4">
                  <div className="mx-auto h-4 w-40 rounded-full bg-slate-100" />
                  <div className="mx-auto h-8 w-72 rounded-full bg-slate-200" />
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-32 rounded-2xl bg-slate-100" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5">
            <div className="space-y-3">
              <div className="h-3 w-24 rounded-full bg-slate-200" />
              <div className="h-6 w-32 rounded-full bg-slate-200" />
              <div className="h-3 w-full rounded-full bg-slate-100" />
              <div className="h-3 w-5/6 rounded-full bg-slate-100" />
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-8 w-16 rounded-xl bg-slate-100" />
              <div className="h-8 w-16 rounded-xl bg-slate-100" />
              <div className="h-8 w-16 rounded-xl bg-slate-100" />
            </div>
          </div>
          <div className="space-y-4 px-5 pb-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="space-y-2">
                <div className="h-3 w-28 rounded-full bg-slate-200" />
                <div className="h-11 rounded-2xl bg-slate-100" />
              </div>
            ))}
            <div className="h-11 rounded-2xl bg-slate-200" />
          </div>
        </aside>
      </div>
    </div>
  )
}

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
        active ? 'ring-2 ring-inset ring-[#c9a96e]' : 'ring-0 hover:ring-1 ring-inset hover:ring-[#e8e5e1]'
      }`}
    >
      {/* Section label pill */}
      <span className={`absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest shadow-sm transition ${
        active ? 'bg-[#1a1a1a] text-white opacity-100' : 'bg-[#1a1a1a]/70 text-white/80 opacity-0 group-hover:opacity-100'
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
      <div className="bg-white px-4 py-3 dark:bg-slate-900">
        <div className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 dark:border-orange-900/40 dark:bg-orange-950/30">
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((item) => (
              <span key={item} className="inline-flex rounded-full border border-orange-100 bg-white px-3 py-1 text-[11px] font-semibold text-orange-700 dark:border-orange-900/40 dark:bg-slate-900 dark:text-orange-300">
                {item}
              </span>
            ))}
            {chips.length === 0 ? (
              <span className="text-xs text-slate-400 dark:text-slate-500">No chips set</span>
            ) : null}
          </div>
        </div>
      </div>
    </PreviewSection>
  )
}

function PreviewShopHeader(props: { section: BuilderSection; selectedId: BuilderSectionId; onSelect: (id: BuilderSectionId) => void }) {
  const messages = getFieldValue(props.section, 'marquee_messages').split('\n').map((item) => item.trim()).filter(Boolean)
  const trustItems = parseTrustItemsFromFields(props.section.fields).filter((item) => item.title || item.desc)

  return (
    <PreviewSection {...props}>
      <div className="bg-slate-900 px-4 py-2 text-white">
        <div className="flex items-center justify-between gap-3 text-[10px]">
          <div className="hidden items-center gap-4 text-white/60 md:flex">
            <span>{getFieldValue(props.section, 'contact_phone') || '+63 912 345 6789'}</span>
            <span>{getFieldValue(props.section, 'contact_email') || 'hello@afhome.ph'}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex gap-6 whitespace-nowrap text-white/70">
              {messages.length > 0 ? (
                messages.slice(0, 3).map((message) => (
                  <span key={message}>{message}</span>
                ))
              ) : (
                <span className="text-white/35">No marquee messages set yet.</span>
              )}
            </div>
          </div>
          <div className="hidden items-center gap-2 text-white/50 md:flex">
            <span>{getFieldValue(props.section, 'facebook_label') || 'FB'}</span>
            <span>|</span>
            <span>{getFieldValue(props.section, 'instagram_label') || 'IG'}</span>
            <span>|</span>
            <span>{getFieldValue(props.section, 'tiktok_label') || 'TikTok'}</span>
          </div>
        </div>
      </div>
      <div className="border-b border-slate-100 dark:border-slate-800 bg-white px-4 py-4 dark:bg-slate-900">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {trustItems.map((item, index) => (
            <div key={`${item.index}-${item.title}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{item.title || `Trust Item ${index + 1}`}</p>
              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{item.desc || 'Description'}</p>
            </div>
          ))}
          {trustItems.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-[#e8e5e1] bg-white px-3 py-4 text-center text-xs text-[#8a8a8a] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
              No trust items set yet.
            </div>
          ) : null}
        </div>
      </div>
    </PreviewSection>
  )
}

function PreviewCampaignBanners(props: { section: BuilderSection; selectedId: BuilderSectionId; onSelect: (id: BuilderSectionId) => void }) {
  const videoUrl = getFieldValue(props.section, 'video_url')
  const posterUrl = getFieldValue(props.section, 'video_poster') || fallbackImage

  return (
    <PreviewSection {...props}>
      <div className="px-4 py-4">
        <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-200">
          <div className="relative min-h-52">
            {videoUrl ? (
              <video
                src={videoUrl}
                poster={posterUrl}
                className="absolute inset-0 h-full w-full scale-[1.06] object-cover object-center"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <Image src={posterUrl} alt="Campaign video poster" fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
            )}
            <div className="absolute inset-0 bg-linear-to-r from-slate-950/75 via-slate-900/35 to-slate-900/10" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
                {getFieldValue(props.section, 'video_eyebrow') || 'Top Promos'}
              </p>
              <p className="mt-2 text-2xl font-bold text-white">{getFieldValue(props.section, 'video_title') || 'Weekend Furniture Drop'}</p>
              <p className="mt-1 max-w-[320px] text-sm text-white/80">{getFieldValue(props.section, 'video_subtitle') || 'Refresh your living room this week'}</p>
            </div>
          </div>
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
            Showing {offset + 1}-{Math.min(offset + 4, cards.length)} of {cards.length} categories
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
  const products = props.featuredProducts

  return (
    <PreviewSection {...props}>
      <div className="bg-gray-50 px-4 py-10 dark:bg-slate-950">
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
            <h2 className="mb-5 text-xl font-bold text-slate-900 dark:text-slate-100">
              {getFieldValue(props.section, 'right_heading') || 'Top Picks This Week'}
            </h2>
            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {products.map((product) => (
                  <div key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="relative h-28 bg-slate-100 dark:bg-slate-800">
                      <Image src={product.image || fallbackImage} alt={product.name} fill className="object-cover" unoptimized />
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-xs font-semibold text-slate-800 dark:text-slate-100">{product.name}</p>
                      <p className="mt-1 text-sm font-bold text-orange-500">PHP {product.priceSrp.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
                Select a category to preview Top Picks.
              </div>
            )}
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
    <div className="rounded-2xl border border-[#e8e5e1] bg-[#faf9f7] p-3 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a8a8a] dark:text-slate-500">{title}</p>
      <div className="mt-2 max-h-36 space-y-1 overflow-y-auto text-xs text-[#6b6b6b] dark:text-slate-400">
        {items.length > 0 ? items.map((item) => <p key={item}>{item}</p>) : <p className="text-[#8a8a8a] dark:text-slate-500">No data yet.</p>}
      </div>
    </div>
  )
}

function MarqueeMessagesEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [draftMessage, setDraftMessage] = useState('')
  const items = value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

  useEffect(() => {
    setDraftMessage('')
  }, [value])

  const updateItem = (index: number, nextValue: string) => {
    const nextItems = items.map((item, itemIndex) => (itemIndex === index ? nextValue : item))
    onChange(nextItems.join('\n'))
  }

  const addItem = () => {
    const nextMessage = draftMessage.trim()
    if (!nextMessage) return
    onChange([...items, nextMessage].join('\n'))
    setDraftMessage('')
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index).join('\n'))
  }

  return (
    <div className="mt-1.5 rounded-2xl border border-[#e8e5e1] bg-[#faf9f7] p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[#6b6b6b] dark:text-slate-400">Manage rotating top banner messages.</p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={draftMessage}
          onChange={(event) => setDraftMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addItem()
            }
          }}
          placeholder="Enter marquee message"
          className="flex-1 rounded-2xl border border-[#e8e5e1] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none transition focus:border-[#c9a96e] focus:ring-2 focus:ring-[#f5f0e6] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!draftMessage.trim()}
          className="inline-flex h-11 flex-none items-center gap-1.5 rounded-full border border-[#e8e5e1] bg-white px-4 text-sm font-medium text-[#1a1a1a] transition hover:bg-[#f5f0e6] disabled:cursor-not-allowed disabled:opacity-45 dark:border-cyan-900/40 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-cyan-950/30"
        >
          <span className="text-base leading-none">+</span>
          Add
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {items.length > 0 ? items.map((item, index) => (
          <div key={`${index}-${item}`} className="rounded-xl border border-[#e8e5e1] bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-2">
              <div className="mt-2 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#f5f0e6] text-[11px] font-bold text-[#6b6b6b] dark:bg-slate-800 dark:text-slate-400">
                {index + 1}
              </div>
              <input
                value={item}
                onChange={(event) => updateItem(index, event.target.value)}
                placeholder="Enter marquee message"
                className="flex-1 rounded-xl border border-[#e8e5e1] bg-[#faf9f7] px-3 py-2 text-sm text-[#1a1a1a] outline-none transition focus:border-[#c9a96e] focus:bg-white focus:ring-2 focus:ring-[#f5f0e6] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-red-200 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100"
                aria-label={`Remove marquee message ${index + 1}`}
              >
                ×
              </button>
            </div>
          </div>
        )) : (
          <div className="rounded-xl border border-dashed border-[#e8e5e1] bg-white px-3 py-4 text-center text-xs text-[#8a8a8a] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
            No marquee messages yet. Click Add to create one.
          </div>
        )}
      </div>
    </div>
  )
}

function TrustItemsEditor({
  section,
  onChange,
}: {
  section: BuilderSection
  onChange: (fieldKey: string, value: string) => void
}) {
  const items = parseTrustItemsFromFields(section.fields)

  const addItem = () => {
    const nextIndex = items.length > 0 ? Math.max(...items.map((item) => item.index)) + 1 : 1
    onChange(`trust_item_${nextIndex}_title`, '')
    onChange(`trust_item_${nextIndex}_desc`, '')
  }

  const removeItem = (index: number) => {
    onChange(`trust_item_${index}_title`, '')
    onChange(`trust_item_${index}_desc`, '')
  }

  return (
    <div className="mt-1.5 rounded-2xl border border-[#e8e5e1] bg-[#faf9f7] p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[#6b6b6b] dark:text-slate-400">Manage trust highlights shown below the top bar.</p>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e5e1] bg-white px-3 py-1.5 text-[11px] font-medium text-[#1a1a1a] transition hover:bg-[#f5f0e6] dark:border-cyan-900/40 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-cyan-950/30"
        >
          <span className="text-sm leading-none">+</span>
          Add
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {items.length > 0 ? items.map((item, index) => (
          <div key={`trust-item-${item.index}`} className="rounded-xl border border-[#e8e5e1] bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f5f0e6] text-[11px] font-bold text-[#6b6b6b] dark:bg-slate-800 dark:text-slate-400">
                  {index + 1}
                </div>
                <p className="text-xs font-semibold text-[#6b6b6b] dark:text-slate-400">Trust item {index + 1}</p>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.index)}
                className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-red-200 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100"
                aria-label={`Remove trust item ${index + 1}`}
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              <input
                value={item.title}
                onChange={(event) => onChange(`trust_item_${item.index}_title`, event.target.value)}
                placeholder="Trust item title"
                className="w-full rounded-2xl border border-[#e8e5e1] bg-[#faf9f7] px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none transition focus:border-[#c9a96e] focus:bg-white focus:ring-2 focus:ring-[#f5f0e6] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
              />
              <input
                value={item.desc}
                onChange={(event) => onChange(`trust_item_${item.index}_desc`, event.target.value)}
                placeholder="Trust item description"
                className="w-full rounded-2xl border border-[#e8e5e1] bg-[#faf9f7] px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none transition focus:border-[#c9a96e] focus:bg-white focus:ring-2 focus:ring-[#f5f0e6] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
              />
            </div>
          </div>
        )) : (
          <div className="rounded-xl border border-dashed border-[#e8e5e1] bg-white px-3 py-4 text-center text-xs text-[#8a8a8a] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
            No trust items yet. Click Add to create one.
          </div>
        )}
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
    <div className="rounded-2xl border border-[#e8e5e1] bg-[#faf9f7] p-3 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a8a8a] dark:text-slate-500">Category picker</p>
      <p className="mt-1 text-[11px] text-[#8a8a8a] dark:text-slate-500">Toggle categories to include them in the shop carousel.</p>
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
                  ? 'border-[#c9a96e] bg-[#f5f0e6] text-[#1a1a1a] dark:border-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-100'
                  : 'border-[#e8e5e1] bg-white text-[#1a1a1a] hover:border-[#c9a96e] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600'
              }`}
            >
              <div>
                <p className="text-xs font-semibold">{category.name}</p>
                <p className="text-[10px] text-[#8a8a8a] dark:text-slate-500">ID {category.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#8a8a8a] dark:text-slate-500">{category.product_count ?? 0}</span>
                <span className={`h-4 w-4 rounded-full border-2 transition ${
                  active ? 'border-[#1a1a1a] bg-[#1a1a1a]' : 'border-[#e8e5e1] bg-white dark:border-slate-600 dark:bg-slate-900'
                }`} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FeaturedCategoryPickerPanel({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Array<{ id: number; name: string; product_count?: number }>
  selectedId: number
  onSelect: (categoryId: number) => void
}) {
  return (
    <div className="rounded-2xl border border-[#e8e5e1] bg-[#faf9f7] p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a8a8a] dark:text-slate-500">Auto product source</p>
          <p className="mt-1 text-[11px] text-[#8a8a8a] dark:text-slate-500">Assign one category to auto-fill the right-side product cards.</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(0)}
          className="rounded-full border border-[#e8e5e1] bg-white px-2.5 py-1 text-[10px] font-medium text-[#6b6b6b] transition hover:border-[#1a1a1a] hover:text-[#1a1a1a] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
        >
          Clear
        </button>
      </div>
      <div className="mt-3 max-h-52 space-y-1.5 overflow-y-auto">
        {categories.map((category) => {
          const active = selectedId === category.id
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                active
                  ? 'border-[#c9a96e] bg-[#f5f0e6] text-[#1a1a1a] dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-100'
                  : 'border-[#e8e5e1] bg-white text-[#1a1a1a] hover:border-[#c9a96e] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600'
              }`}
            >
              <div>
                <p className="text-xs font-semibold">{category.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">ID {category.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{category.product_count ?? 0}</span>
                <span className={`h-4 w-4 rounded-full border-2 transition ${
                  active ? 'border-[#1a1a1a] bg-[#1a1a1a]' : 'border-[#e8e5e1] bg-white dark:border-slate-600 dark:bg-slate-900'
                }`} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CampaignBannerLinkPanel({
  categories,
  products,
  selectedType,
  selectedCategoryId,
  selectedProductId,
  customLink,
  onTypeChange,
  onCategorySelect,
  onProductSelect,
}: {
  categories: Array<{ id: number; name: string; product_count?: number }>
  products: Array<{ id: number; name: string; catid: number }>
  selectedType: string
  selectedCategoryId: number
  selectedProductId: number
  customLink: string
  onTypeChange: (value: 'category' | 'product' | 'custom') => void
  onCategorySelect: (categoryId: number) => void
  onProductSelect: (productId: number) => void
}) {
  const safeType = selectedType === 'product' || selectedType === 'custom' ? selectedType : 'category'
  const selectedProduct = products.find((product) => product.id === selectedProductId)

  return (
    <div className="rounded-2xl border border-[#e8e5e1] bg-[#faf9f7] p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a8a8a]">Hero link target</p>
      <p className="mt-1 text-[11px] text-[#8a8a8a]">Choose where the full video banner and Explore Now button should navigate.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {([
          { key: 'category', label: 'Category' },
          { key: 'product', label: 'Product' },
          { key: 'custom', label: 'Custom URL' },
        ] as const).map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onTypeChange(option.key)}
            className={`rounded-full border px-3 py-2 text-[11px] font-medium transition ${
              safeType === option.key
                ? 'border-[#c9a96e] bg-[#f5f0e6] text-[#1a1a1a]'
                : 'border-[#e8e5e1] bg-white text-[#6b6b6b] hover:border-[#1a1a1a] hover:text-[#1a1a1a]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {safeType === 'category' ? (
        <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto">
          {categories.map((category) => {
            const active = selectedCategoryId === category.id
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategorySelect(category.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                  active
                    ? 'border-[#c9a96e] bg-[#f5f0e6] text-[#1a1a1a]'
                    : 'border-[#e8e5e1] bg-white text-[#1a1a1a] hover:border-[#c9a96e]'
                }`}
              >
                <div>
                  <p className="text-xs font-semibold">{category.name}</p>
                  <p className="text-[10px] text-[#8a8a8a]">ID {category.id}</p>
                </div>
                <span className="text-[10px] text-[#8a8a8a]">{category.product_count ?? 0}</span>
              </button>
            )
          })}
        </div>
      ) : null}

      {safeType === 'product' ? (
        <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto">
          {products.map((product) => {
            const active = selectedProductId === product.id
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => onProductSelect(product.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                  active
                    ? 'border-[#c9a96e] bg-[#f5f0e6] text-[#1a1a1a]'
                    : 'border-[#e8e5e1] bg-white text-[#1a1a1a] hover:border-[#c9a96e]'
                }`}
              >
                <p className="text-xs font-semibold">{product.name}</p>
                <p className="mt-1 text-[10px] text-[#8a8a8a]">ID {product.id} · Category {product.catid}</p>
              </button>
            )
          })}
        </div>
      ) : null}

      {safeType === 'custom' ? (
        <div className="mt-3 rounded-xl border border-dashed border-[#e8e5e1] bg-white px-3 py-3 text-[11px] text-[#6b6b6b]">
          Use the Custom video link field above.
          {customLink.trim() ? <span className="block mt-1 text-[#8a8a8a]">Current: {customLink.trim()}</span> : null}
        </div>
      ) : null}

      {safeType === 'category' && selectedCategoryId > 0 ? (
        <p className="mt-3 text-[11px] text-[#6b6b6b]">Current target: selected category ID {selectedCategoryId}</p>
      ) : null}
      {safeType === 'product' && selectedProduct ? (
        <p className="mt-3 text-[11px] text-[#6b6b6b]">Current target: {selectedProduct.name}</p>
      ) : null}
    </div>
  )
}

function DynamicCategoryImageFields({
  section,
  categoryCards,
  onChange,
  onUpload,
  uploadingFieldKeys,
}: {
  section: BuilderSection
  categoryCards: Array<{ id: number; name: string; count: number; image: string }>
  onChange: (sectionId: BuilderSectionId, fieldKey: string, value: string) => void
  onUpload: (sectionId: BuilderSectionId, fieldKey: string, file: File | null) => Promise<void>
  uploadingFieldKeys: string[]
}) {
  if (categoryCards.length === 0) return null

  return (
    <div className="rounded-2xl border border-[#e8e5e1] bg-[#faf9f7] p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a8a8a]">Category image overrides</p>
      <p className="mt-1 text-[11px] text-[#8a8a8a]">Upload custom images per category slot.</p>
      <div className="mt-3 max-h-120 space-y-3 overflow-y-auto pr-0.5">
        {categoryCards.map((category) => {
          const fieldKey = `category_image_${category.id}`
          const fieldValue = getFieldValue(section, fieldKey) || category.image || ''
          const isUploading = uploadingFieldKeys.includes(fieldKey)
          const uploadingFieldKey = isUploading ? fieldKey : null

          return (
            <div key={category.id} className="rounded-xl border border-[#e8e5e1] bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[#1a1a1a]">{category.name}</p>
                  <p className="text-[10px] text-[#8a8a8a]">ID {category.id} · {category.count} items</p>
                </div>
                <div className="relative h-10 w-16 flex-none overflow-hidden rounded-lg border border-[#e8e5e1] bg-[#faf9f7]">
                  {fieldValue ? (
                    <Image
                      src={fieldValue}
                      alt={category.name}
                      fill
                      className={`object-cover transition ${isUploading ? 'opacity-35 blur-[1px]' : ''}`}
                      unoptimized
                    />
                  ) : null}
                  {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a1a1a] border-t-transparent" />
                    </div>
                  ) : null}
                  {!fieldValue && !isUploading ? (
                    <div className="absolute inset-0 animate-pulse bg-linear-to-r from-slate-100 via-slate-50 to-slate-100" />
                  ) : null}
                </div>
              </div>

              <input
                value={fieldValue}
                onChange={(event) => onChange(section.id, fieldKey, event.target.value)}
                placeholder="Image URL"
                className="mt-2 w-full rounded-xl border border-[#e8e5e1] bg-[#faf9f7] px-3 py-2 text-xs text-[#1a1a1a] outline-none transition focus:border-[#c9a96e] focus:bg-white focus:ring-2 focus:ring-[#f5f0e6]"
              />

              <label className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                isUploading
                  ? 'cursor-wait border-[#e8e5e1] bg-[#f5f0e6] text-[#6b6b6b]'
                  : 'cursor-pointer border-[#e8e5e1] bg-white text-[#1a1a1a] hover:bg-[#f5f0e6]'
              }`}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={isUploading}
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
