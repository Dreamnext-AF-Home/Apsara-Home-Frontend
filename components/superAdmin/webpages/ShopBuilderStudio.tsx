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

const statusStyles: Record<BuilderSectionStatus, string> = {
  live: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  draft: 'border-amber-200 bg-amber-50 text-amber-700',
  planned: 'border-slate-200 bg-slate-100 text-slate-600',
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

export default function ShopBuilderStudio() {
  const [selectedSectionId, setSelectedSectionId] = useState<BuilderSectionId>('category-grid')
  const [editorMessage, setEditorMessage] = useState('Load, edit, and save each section as real builder data.')
  const [uploadingFieldKey, setUploadingFieldKey] = useState<string | null>(null)
  const { data, isLoading, isError } = useGetAdminWebPageItemsQuery({
    type: 'shop-builder',
    page: 1,
    perPage: 50,
    status: 'all',
  })
  const { data: categoriesData } = useGetCategoriesQuery({ per_page: 50, used_only: true })
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
          image: getFieldValue(categorySection, `card_${index + 1}_image`) || category.image || fallbackImage,
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

  const selectedFeatureProducts = useMemo(() => {
    const featuredSection = sections.find((section) => section.id === 'featured-collection')
    if (!featuredSection) return []
    const ids = parseIdList(getFieldValue(featuredSection, 'product_ids'))
    return ids
      .map((id) => products.find((item) => item.id === id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .slice(0, 4)
  }, [products, sections])

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
    setEditorMessage('Preview updated locally. Click Save Section to persist it.')
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
    setEditorMessage('Uploading image attachment...')

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
      setEditorMessage('Image uploaded. Save the section to publish this change.')
      showSuccessToast('Image uploaded successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image.'
      setEditorMessage('Image upload failed.')
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
      setEditorMessage('Section saved. The live `/shop` page can now read this data.')
      showSuccessToast(`${section.label} saved.`)
    } catch (error) {
      setEditorMessage('Could not save this section right now.')
      const apiErr = error as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to save shop builder section.')
    }
  }

  const isSaving = isCreating || isUpdating

  if (isLoading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Loading shop builder data...</div>
  }

  if (isError) {
    return <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600 shadow-sm">Failed to load shop builder data.</div>
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">Visual Editor</p>
            <h1 className="mt-2 text-xl font-bold text-slate-900 md:text-2xl">Shop Builder</h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">
              This builder now saves real section data, and the category plus featured product blocks can already reference live categories and products by ID.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700">Builder State</p>
            <p className="mt-1 text-sm font-medium text-cyan-900">{editorMessage}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-900">Selectable Sections</h2>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              {sections.length} blocks
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {sections.map((section, index) => {
              const active = section.id === selectedSection.id
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedSectionId(section.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    active
                      ? 'border-cyan-300 bg-cyan-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Block {index + 1}</p>
                      <p className="mt-1 text-sm font-bold leading-snug text-slate-900">{section.label}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${statusStyles[section.status]}`}>
                      {section.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{section.title}</p>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Storefront Preview</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">/shop Visual Canvas</h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
              Saved rows: {data?.items?.length ?? 0}
            </div>
          </div>

          <div className="mt-5 rounded-[28px] bg-slate-100 p-4 md:p-5">
            <div className="mx-auto max-w-5xl rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-6">
              <PreviewAnnouncements section={sections[0]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} />
              <PreviewCampaignBanners section={sections[1]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} />
              <PreviewCategoryGrid section={sections[2]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} categoryCards={selectedCategoryCards} />
              <PreviewFeaturedCollection section={sections[3]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} featuredProducts={selectedFeatureProducts} />
              <PreviewPromoPair section={sections[4]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} />
              <PreviewNewsletter section={sections[5]} selectedId={selectedSection.id} onSelect={setSelectedSectionId} />
            </div>
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className={`rounded-3xl bg-gradient-to-br ${selectedSection.accent} p-4`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{selectedSection.eyebrow}</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900">{selectedSection.label}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{selectedSection.description}</p>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[selectedSection.status]}`}>
                {selectedSection.status}
              </span>
              <span className="text-xs font-medium text-slate-400">Key: {selectedSection.id}</span>
            </div>

            {selectedSection.fields.map((field) => (
              <div key={field.key}>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{field.label}</label>
                {field.kind === 'textarea' ? (
                  <textarea
                    value={field.value}
                    onChange={(event) => updateField(selectedSection.id, field.key, event.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                  />
                ) : field.key.includes('image') ? (
                  <div className="mt-2 space-y-3">
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <input
                        value={field.value}
                        onChange={(event) => updateField(selectedSection.id, field.key, event.target.value)}
                        placeholder="Image URL will appear here after upload"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                      />
                      <label className="inline-flex w-fit cursor-pointer items-center rounded-2xl border border-cyan-200 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50">
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
                        {uploadingFieldKey === field.key ? 'Uploading image...' : 'Attach Image'}
                      </label>
                    </div>

                    {field.value ? (
                      <div className="relative h-32 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        <Image src={field.value} alt={field.label} fill className="object-cover" unoptimized />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <input
                    value={field.value}
                    onChange={(event) => updateField(selectedSection.id, field.key, event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                  />
                )}
              </div>
            ))}

            {selectedSection.id === 'category-grid' ? (
              <CategoryPickerPanel
                categories={categories}
                selectedIds={parseIdList(getFieldValue(selectedSection, 'category_ids'))}
                onToggle={toggleCategorySelection}
              />
            ) : null}

            {selectedSection.id === 'featured-collection' ? (
              <HelperPanel
                title="Live product reference"
                items={products.map((product) => `${product.id} - ${product.name}`)}
              />
            ) : null}

            <button
              type="button"
              onClick={() => void saveSection()}
              disabled={isSaving}
              className="w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving Section...' : 'Save Section'}
            </button>

            <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50 px-4 py-4">
              <p className="text-sm font-semibold text-cyan-900">Current setup</p>
              <p className="mt-1 text-xs leading-relaxed text-cyan-800">
                You can already drive `/shop` with real text, image URLs, category IDs, and product IDs. The next layer after this is a true upload/media picker so you will not need to paste image URLs manually.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function HelperPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-slate-600">
        {items.length > 0 ? items.map((item) => <p key={item}>{item}</p>) : <p>No data yet.</p>}
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
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Live category picker</p>
      <p className="mt-1 text-xs text-slate-500">Click categories below to include or remove them from the shop carousel.</p>
      <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
        {categories.map((category) => {
          const active = selectedIds.includes(category.id)
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onToggle(category.id)}
              className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${
                active
                  ? 'border-cyan-300 bg-cyan-50 text-cyan-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div>
                <p className="text-sm font-semibold">{category.name}</p>
                <p className="text-xs text-slate-500">ID {category.id}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                active ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {category.product_count ?? 0} items
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PreviewSection({
  section,
  selectedId,
  onSelect,
  children,
}: {
  section: BuilderSection
  selectedId: BuilderSectionId
  onSelect: (id: BuilderSectionId) => void
  children: ReactNode
}) {
  const active = section.id === selectedId

  return (
    <button
      type="button"
      onClick={() => onSelect(section.id)}
      className={`group mb-4 block w-full rounded-[30px] border-2 p-3 text-left transition ${
        active
          ? 'border-cyan-400 bg-cyan-50/60 shadow-[0_10px_35px_rgba(8,145,178,0.12)]'
          : 'border-transparent hover:border-slate-300 hover:bg-slate-50/80'
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{section.eyebrow}</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{section.label}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusStyles[section.status]}`}>
            {section.status}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${active ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            {active ? 'Selected' : 'Select'}
          </span>
        </div>
      </div>
      {children}
    </button>
  )
}

function PreviewAnnouncements(props: { section: BuilderSection; selectedId: BuilderSectionId; onSelect: (id: BuilderSectionId) => void }) {
  const chips = getFieldValue(props.section, 'chip_group').split(',').map((item) => item.trim()).filter(Boolean)
  return (
    <PreviewSection {...props}>
      <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((item) => (
            <span key={item} className="rounded-full border border-orange-100 bg-white px-3 py-1 text-[11px] font-semibold text-orange-700">{item}</span>
          ))}
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
      <div className="grid gap-3 md:grid-cols-2">
        {banners.map((banner) => (
          <div key={banner.title} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 p-5">
            <Image src={banner.image} alt={banner.title || 'Campaign banner'} fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 to-slate-900/20" />
            <div className="relative flex min-h-[150px] flex-col justify-end text-white">
              <p className="text-lg font-bold">{banner.title}</p>
              <p className="mt-1 max-w-[220px] text-sm text-white/80">{banner.subtitle}</p>
            </div>
          </div>
        ))}
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

  const moveLeft = () => setOffset((current) => Math.max(0, current - 1))
  const moveRight = () => setOffset((current) => (current + 4 < cards.length ? current + 1 : current))

  return (
    <PreviewSection {...props}>
      <div className="py-6">
        <div className="relative">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">{getFieldValue(props.section, 'eyebrow')}</p>
          <h3 className="mt-2 text-center text-3xl font-bold text-slate-900">{getFieldValue(props.section, 'heading')}</h3>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              moveLeft()
            }}
            disabled={!canGoLeft}
            className="absolute left-0 top-1/2 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md md:inline-flex disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              moveRight()
            }}
            disabled={!canGoRight}
            className="absolute right-0 top-1/2 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md md:inline-flex disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {visibleCards.map((card) => (
            <div key={card.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="relative h-28">
                <Image src={card.image} alt={card.name} fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-slate-900">{card.name}</p>
                <p className="mt-1 text-xs text-slate-500">{card.count} products</p>
              </div>
            </div>
          ))}
        </div>
        {cards.length > 4 ? (
          <p className="mt-3 text-center text-xs text-slate-400">
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
  const products = props.featuredProducts.length > 0
    ? props.featuredProducts
    : [1, 2, 3, 4].map((index) => ({
        id: index,
        name: `Product ${index}`,
        image: fallbackImage,
        priceSrp: 2600,
      }))

  return (
    <PreviewSection {...props}>
      <div className="grid gap-5 py-2 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-stone-300 via-stone-100 to-white p-6">
          <Image src={getFieldValue(props.section, 'lead_image') || fallbackImage} alt={getFieldValue(props.section, 'left_heading') || 'Featured'} fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="relative flex min-h-[370px] flex-col justify-end">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">{getFieldValue(props.section, 'left_eyebrow')}</p>
            <h3 className="mt-2 text-3xl font-bold leading-tight text-white">{getFieldValue(props.section, 'left_heading')}</h3>
            <p className="mt-3 max-w-xs text-sm text-white/75">{getFieldValue(props.section, 'left_description')}</p>
            <div className="mt-5 inline-flex w-fit rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white">Shop Collection</div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">{getFieldValue(props.section, 'right_eyebrow')}</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{getFieldValue(props.section, 'right_heading')}</h3>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {products.map((product) => (
              <div key={product.id} className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="relative h-36 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-white">
                  <Image src={product.image || fallbackImage} alt={product.name} fill className="object-cover" unoptimized />
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900">{product.name}</p>
                <p className="mt-1 text-sm font-bold text-orange-500">PHP {product.priceSrp.toLocaleString()}</p>
              </div>
            ))}
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
    },
    {
      eyebrow: getFieldValue(props.section, 'right_eyebrow'),
      title: getFieldValue(props.section, 'right_heading'),
      button: getFieldValue(props.section, 'right_button'),
      image: getFieldValue(props.section, 'right_image') || fallbackImage,
    },
  ]

  return (
    <PreviewSection {...props}>
      <div className="grid gap-4 py-4 md:grid-cols-2">
        {promos.map((promo) => (
          <div key={promo.title} className="relative overflow-hidden rounded-[28px] border border-slate-200 p-6">
            <Image src={promo.image} alt={promo.title || 'Promo'} fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 to-slate-900/10" />
            <div className="relative flex min-h-[250px] flex-col justify-end text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">{promo.eyebrow}</p>
              <h3 className="mt-2 max-w-xs text-3xl font-bold leading-tight">{promo.title}</h3>
              <div className="mt-5 inline-flex w-fit rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">{promo.button}</div>
            </div>
          </div>
        ))}
      </div>
    </PreviewSection>
  )
}

function PreviewNewsletter(props: { section: BuilderSection; selectedId: BuilderSectionId; onSelect: (id: BuilderSectionId) => void }) {
  return (
    <PreviewSection {...props}>
      <div className="overflow-hidden rounded-[28px] bg-slate-900 px-6 py-12 text-center">
        <span className="rounded-full bg-orange-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">{getFieldValue(props.section, 'badge')}</span>
        <h3 className="mt-5 text-3xl font-bold text-white">{getFieldValue(props.section, 'heading')}</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/60">{getFieldValue(props.section, 'description')}</p>
        <div className="mx-auto mt-6 flex max-w-md gap-3">
          <div className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/10" />
          <div className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white">{getFieldValue(props.section, 'button')}</div>
        </div>
      </div>
    </PreviewSection>
  )
}
