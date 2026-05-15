'use client'

import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Skeleton } from '@heroui/react/skeleton'
import HeroSection from './HeroSection'
import FeaturedSections from './FeaturedSections'
import PromoBenners from './PromoBenners'
import NewsLetter from './NewsLetter'
import ItemCard from '../item/ItemCard'
import ShopCategoryCarousel from './ShopCategoryCarousel'
import ShopNewsletterSignup from './ShopNewsletterSignup'
import type { Category } from '@/store/api/categoriesApi'
import type { Product } from '@/store/api/productsApi'
import type { WebPageItem } from '@/store/api/webPagesApi'
import { buildPartnerCategoryLink, buildPartnerShopLink } from '@/libs/partnerStorefront'
import { buildStorefrontProductPath } from '@/libs/storefrontRouting'

type ShopSectionPayload = {
  fields?: Record<string, string>
}

const fallbackImage = '/Images/HeroSection/chairs_stools.jpg'
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
}

const getItemByKey = (items: WebPageItem[], key: string) =>
  items.find((item) => String(item.key ?? '').trim() === key)

const getField = (item: WebPageItem | undefined, key: string) =>
  (((item?.payload ?? {}) as ShopSectionPayload).fields ?? {})[key] ?? ''

const parseIdList = (value: string) =>
  value
    .split(',')
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isFinite(item) && item > 0)

const buildProductLink = (product: Pick<Product, 'id' | 'name'>, partnerSlug?: string) =>
  buildStorefrontProductPath(
    product.name,
    typeof product.id === 'number' ? product.id : undefined,
    partnerSlug ? `/shop/${partnerSlug}` : undefined,
  )

function CampaignBannerSkeleton() {
  return (
    <motion.section
      className="!bg-white dark:!bg-gray-900 container mx-auto px-4 py-6"
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42 }}
    >
      <Skeleton className="h-[280px] w-full rounded-[32px] md:h-[380px]" />
    </motion.section>
  )
}

function CategoryGridSkeleton() {
  return (
    <motion.section className="!bg-white dark:!bg-gray-900 container mx-auto px-4 py-10">
      <div className="mb-8 text-center space-y-3">
        <Skeleton className="h-4 w-32 rounded mx-auto" />
        <Skeleton className="h-8 w-64 rounded mx-auto" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-40 space-y-2">
            <Skeleton className="h-40 w-40 rounded-lg" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-3 w-3/4 rounded" />
          </div>
        ))}
      </div>
    </motion.section>
  )
}

function FeaturedCollectionSkeleton() {
  return (
    <motion.section className="!bg-gray-50 dark:!bg-gray-900 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <Skeleton className="h-[500px] rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-8 w-48 rounded" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function PromoSkeleton() {
  return (
    <motion.section className="!bg-white dark:!bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] rounded-3xl md:h-[360px]" />
          ))}
        </div>
      </div>
    </motion.section>
  )
}

function NewsletterSkeleton() {
  return (
    <motion.section className="!bg-gray-50 dark:!bg-gray-900 py-16">
      <div className="container mx-auto px-4 text-center">
        <Skeleton className="h-8 w-64 rounded mx-auto mb-4" />
        <Skeleton className="h-4 w-96 rounded mx-auto mb-8" />
        <div className="flex gap-2 max-w-md mx-auto">
          <Skeleton className="flex-1 h-10 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </motion.section>
  )
}

const getFeaturedProducts = (
  featuredCollection: WebPageItem | undefined,
  products: Product[],
  featuredProductIds?: number[],
) => {
  if (Array.isArray(featuredProductIds)) {
    const selectedSet = new Set(featuredProductIds)
    return products.filter((item) => selectedSet.has(item.id)).slice(0, 4)
  }

  const sourceCategoryId = Number.parseInt(getField(featuredCollection, 'source_category_id'), 10)
  return Number.isFinite(sourceCategoryId) && sourceCategoryId > 0
    ? products.filter((item) => item.catid === sourceCategoryId).slice(0, 4)
    : []
}

const resolveCategoryCardImage = ({
  section,
  categoryId,
  slotIndex,
  categoryImage,
}: {
  section: WebPageItem | undefined
  categoryId: number
  slotIndex?: number
  categoryImage?: string | null
}) =>
  getField(section, `category_image_${categoryId}`) ||
  (typeof slotIndex === 'number' ? getField(section, `card_${slotIndex + 1}_image`) : '') ||
  categoryImage ||
  fallbackImage

export type ShopBuilderSectionsData = {
  items: WebPageItem[]
  categories: Category[]
  products: Product[]
} | null

export type ShopBuilderSectionsProps = {
  data?: ShopBuilderSectionsData
  partnerSlug?: string
  partnerHeroVideoUrl?: string
  allowedCategoryIds?: number[]
  featuredProductIds?: number[]
  enableActivateDiscount?: boolean
}

export type ShopBuilderApiResponse = {
  items: WebPageItem[]
  categories: Category[]
  products: Product[]
}

export function normalizeShopBuilderApiResponse(data: ShopBuilderApiResponse | null | undefined) {
  return {
    items: data?.items ?? [],
    categories: data?.categories ?? [],
    products: data?.products ?? [],
  }
}

export default function ShopBuilderSections({ data = null, partnerSlug, partnerHeroVideoUrl, allowedCategoryIds, featuredProductIds, enableActivateDiscount }: ShopBuilderSectionsProps) {
  const { items, categories, products } = normalizeShopBuilderApiResponse(data)

  if (!data || items.length === 0) {
    return (
      <>
        <CampaignBannerSkeleton />
        <CategoryGridSkeleton />
        <FeaturedCollectionSkeleton />
        <PromoSkeleton />
        <NewsletterSkeleton />
      </>
    )
  }

  const announcements = getItemByKey(items, 'announcements')
  const campaignBanners = getItemByKey(items, 'campaign-banners')
  const categoryGrid = getItemByKey(items, 'category-grid')
  const featuredCollection = getItemByKey(items, 'featured-collection')
  const promoPair = getItemByKey(items, 'promo-pair')
  const newsletter = getItemByKey(items, 'newsletter')

  const selectedCategoryCards = parseIdList(getField(categoryGrid, 'category_ids'))
    .map((id, index) => {
      const category = categories.find((item) => item.id === id)
      if (!category) return null
      return {
        id: category.id,
        name: category.name,
        url: buildPartnerCategoryLink(partnerSlug, category),
        count: category.product_count ?? 0,
        image: resolveCategoryCardImage({
          section: categoryGrid,
          categoryId: category.id,
          slotIndex: index,
          categoryImage: category.image,
        }),
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  const partnerAllowedIds = partnerSlug ? (allowedCategoryIds ?? []) : []
  const partnerAllowedSet = new Set(partnerAllowedIds)
  const partnerCategoryCards = partnerSlug
    ? categories
      .filter((category) => partnerAllowedSet.has(category.id))
      .map((category, index) => ({
        id: category.id,
        name: category.name,
        url: buildPartnerCategoryLink(partnerSlug, category),
        count: category.product_count ?? 0,
        image: resolveCategoryCardImage({
          section: categoryGrid,
          categoryId: category.id,
          slotIndex: index,
          categoryImage: category.image,
        }),
      }))
    : []

  const allCategoryCards = partnerSlug ? partnerCategoryCards : selectedCategoryCards

  const featuredProducts = getFeaturedProducts(featuredCollection, products, featuredProductIds)

  return (
    <>
      {announcements ? <AnnouncementsSection section={announcements} /> : null}
      {campaignBanners ? (
        <CampaignBannersSection
          section={campaignBanners}
          categories={categories}
          products={products}
          partnerSlug={partnerSlug}
          partnerHeroVideoUrl={partnerHeroVideoUrl}
        />
      ) : null}

      {categoryGrid && allCategoryCards.length > 0 && (!partnerSlug || partnerAllowedIds.length > 0) ? (
        <CategoryGridSection
          section={categoryGrid}
          categoryCards={allCategoryCards}
        />
      ) : partnerSlug ? null : (
        <HeroSection />
      )}

      {featuredCollection ? (
        <FeaturedCollectionSection
          section={featuredCollection}
          featuredProducts={featuredProducts}
          categories={categories}
          partnerSlug={partnerSlug}
          enableActivateDiscount={enableActivateDiscount}
        />
      ) : (
        <FeaturedSections />
      )}

      {promoPair ? <PromoPairSection section={promoPair} partnerSlug={partnerSlug} /> : <PromoBenners />}
      {newsletter ? <NewsletterSection section={newsletter} /> : <NewsLetter />}
    </>
  )
}

function AnnouncementsSection({ section }: { section: WebPageItem }) {
  const chips = getField(section, 'chip_group').split(',').map((item) => item.trim()).filter(Boolean)
  if (chips.length === 0) return null

  return (
    <motion.section
      {...fadeUp}
      transition={{ duration: 0.45 }}
      className="!bg-white dark:!bg-gray-900"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="rounded-2xl border border-orange-100 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <AnimatePresence initial={false}>
              {chips.map((item, index) => (
                <motion.span
                  key={item}
                  initial={{ opacity: 0, scale: 0.92, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -8 }}
                  transition={{ duration: 0.22, delay: index * 0.04 }}
                  className="inline-flex rounded-full border border-orange-100 dark:border-orange-800 bg-white dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-orange-700 dark:text-orange-400"
                >
                  {item}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function CampaignBannersSection({
  section,
  categories,
  products,
  partnerSlug,
  partnerHeroVideoUrl,
}: {
  section: WebPageItem
  categories: Category[]
  products: Product[]
  partnerSlug?: string
  partnerHeroVideoUrl?: string
}) {
  const videoUrl = getField(section, 'video_url')
  const resolvedVideoUrl = (partnerHeroVideoUrl ?? '').trim() || videoUrl
  const posterUrl = getField(section, 'video_poster') || fallbackImage
  const eyebrow = getField(section, 'video_eyebrow') || 'Top Promos'
  const title = getField(section, 'video_title') || 'Weekend Furniture Drop'
  const subtitle = getField(section, 'video_subtitle') || 'Refresh your living room this week'
  const buttonText = getField(section, 'video_button') || 'Explore Now'
  const linkType = getField(section, 'link_type') || 'category'
  const linkCategoryId = Number.parseInt(getField(section, 'link_category_id'), 10)
  const linkProductId = Number.parseInt(getField(section, 'link_product_id'), 10)
  const linkCategory = Number.isFinite(linkCategoryId) && linkCategoryId > 0
    ? categories.find((category) => category.id === linkCategoryId)
    : undefined
  const linkProduct = Number.isFinite(linkProductId) && linkProductId > 0
    ? products.find((product) => product.id === linkProductId)
    : undefined
  const link = linkType === 'product' && linkProduct
    ? buildProductLink(linkProduct, partnerSlug)
    : linkType === 'category' && linkCategory
      ? buildPartnerCategoryLink(partnerSlug, linkCategory)
      : buildPartnerShopLink(getField(section, 'video_link') || '/shop', partnerSlug)

  return (
    <motion.section
      {...fadeUp}
      transition={{ duration: 0.5, delay: 0.04 }}
      className="!bg-white dark:!bg-gray-900 container mx-auto px-4 py-6"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={`${title}-${posterUrl}-${resolvedVideoUrl}`}
          initial={{ opacity: 0, y: 26, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.98 }}
          transition={{ duration: 0.42 }}
        >
          <div className="rounded-[32px] border border-slate-200 bg-slate-950 dark:border-gray-700">
            <Link
              href={link}
              className="group relative isolate block overflow-hidden rounded-[32px]"
            >
              <div className="relative min-h-[280px] overflow-hidden rounded-[32px] md:min-h-[380px]">
                {resolvedVideoUrl ? (
                  <video
                    className="absolute inset-0 h-full w-full rounded-[32px] object-cover"
                    src={resolvedVideoUrl}
                    poster={posterUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <Image
                    src={posterUrl}
                    alt={title}
                    fill
                    className="rounded-[32px] object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                  />
                )}

                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-slate-950/10" />
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />

                <div className="relative flex min-h-[280px] flex-col justify-end p-6 text-white md:min-h-[380px] md:p-10">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">
                    {eyebrow}
                  </p>
                  <h2 className="max-w-xl text-3xl font-bold leading-tight md:text-5xl">
                    {title}
                  </h2>
                  <p className="mt-3 max-w-lg text-sm text-white/80 md:text-base">
                    {subtitle}
                  </p>
                  <span className="mt-6 inline-flex w-fit rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-colors group-hover:bg-orange-400">
                    {buttonText}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.section>
  )
}

function CategoryGridSection({
  section,
  categoryCards,
}: {
  section: WebPageItem
  categoryCards: Array<{ id: number; name: string; url: string; count: number; image: string }>
}) {
  const cards = categoryCards

  return (
    <motion.section
      {...fadeUp}
      transition={{ duration: 0.5, delay: 0.08 }}
      className="!bg-white dark:!bg-gray-900 container mx-auto px-4 py-10"
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.45 }}
        className="mb-8 text-center"
      >
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.35 }}
          className="mb-2 text-sm font-semibold uppercase tracking-widest text-orange-500"
        >
          {getField(section, 'eyebrow') || 'Shop by Category'}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="text-3xl font-bold text-slate-900 dark:text-gray-100 md:text-4xl"
        >
          {getField(section, 'heading') || 'Find Your Perfect Furniture'}
        </motion.h2>
      </motion.div>

      <ShopCategoryCarousel cards={cards} />
    </motion.section>
  )
}

function FeaturedCollectionSection({
  section,
  featuredProducts,
  categories,
  partnerSlug,
  enableActivateDiscount,
}: {
  section: WebPageItem
  featuredProducts: Product[]
  categories: Category[]
  partnerSlug?: string
  enableActivateDiscount?: boolean
}) {
  const sourceCategoryId = Number.parseInt(getField(section, 'source_category_id'), 10)
  const sourceCategory = Number.isFinite(sourceCategoryId) && sourceCategoryId > 0
    ? categories.find((category) => category.id === sourceCategoryId)
    : undefined
  const buttonLink = sourceCategory
    ? buildPartnerCategoryLink(partnerSlug, sourceCategory)
    : buildPartnerShopLink('/shop', partnerSlug)
  const buttonText = 'Shop Collection'

  const forceRealPriceForPartner = Boolean(partnerSlug) && !Boolean(enableActivateDiscount)
  const hideDiscountBadgeForPartner = Boolean(partnerSlug) && !Boolean(enableActivateDiscount)

  return (
    <motion.section
      {...fadeUp}
      transition={{ duration: 0.55, delay: 0.1 }}
      className="!bg-gray-50 dark:!bg-gray-900 py-16"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -34 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55 }}
          >
            <Link href={buttonLink} className="group relative block aspect-[4/5] overflow-hidden rounded-3xl">
              <Image
                src={getField(section, 'lead_image') || '/Images/FeaturedSection/home_living.jpg'}
                alt={getField(section, 'left_heading') || 'Featured collection'}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-orange-300">
                  {getField(section, 'left_eyebrow') || 'Featured'}
                </p>
                <h2 className="mb-3 text-3xl font-bold leading-tight text-white">
                  {getField(section, 'left_heading') || 'Minimal & Simple Design'}
                </h2>
                <p className="mb-5 text-sm text-white/60">
                  {getField(section, 'left_description') || 'Crafted for the modern home.'}
                </p>
                <span className="inline-flex rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white">
                  {buttonText}
                </span>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 34 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, delay: 0.06 }}
          >
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-orange-500">
              {getField(section, 'right_eyebrow') || 'Sale Items'}
            </p>
            <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-gray-100">
              {getField(section, 'right_heading') || 'Top Picks This Week'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {featuredProducts.length > 0 ? (
                <AnimatePresence initial={false}>
                  {featuredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.35, delay: index * 0.05 }}
                    >
                      <ItemCard
                        product={product}
                        brandName={product.brand || ''}
                        hideDiscountBadge={hideDiscountBadgeForPartner}
                        forceRealPrice={forceRealPriceForPartner}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="col-span-2 rounded-2xl border border-dashed border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-10 text-center text-sm text-slate-400 dark:text-gray-500">
                  Select a category in Shop Builder to display Top Picks.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}

function PromoPairSection({ section, partnerSlug }: { section: WebPageItem; partnerSlug?: string }) {
  const promos = [
    {
      eyebrow: getField(section, 'left_eyebrow') || 'Limited Offer',
      heading: getField(section, 'left_heading') || 'Build Your Home with Furniture',
      button: getField(section, 'left_button') || 'Shop Now',
      image: getField(section, 'left_image') || '/Images/PromoBanners/ct2-img1-large.jpg',
      link: buildPartnerShopLink(getField(section, 'left_link') || '/shop', partnerSlug),
      badge: 'text-orange-300',
      tone: 'from-slate-900/90 via-slate-900/40 to-transparent',
    },
    {
      eyebrow: getField(section, 'right_eyebrow') || 'New Collection',
      heading: getField(section, 'right_heading') || 'Choose Your Best Appliance',
      button: getField(section, 'right_button') || 'Explore',
      image: getField(section, 'right_image') || '/Images/PromoBanners/ct2-img2-large.jpg',
      link: buildPartnerShopLink(getField(section, 'right_link') || '/shop', partnerSlug),
      badge: 'text-sky-300',
      tone: 'from-sky-900/90 via-sky-900/40 to-transparent',
    },
  ]

  return (
    <motion.section
      {...fadeUp}
      transition={{ duration: 0.5, delay: 0.14 }}
      className="!bg-white dark:!bg-gray-900 container mx-auto px-4 py-12"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AnimatePresence initial={false}>
          {promos.map((promo, index) => (
            <motion.div
              key={`${promo.heading}-${promo.image}`}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.42, delay: index * 0.08 }}
            >
              <Link href={promo.link} className="group relative block h-96 overflow-hidden rounded-3xl">
                <Image src={promo.image} alt={promo.heading} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
                <div className={`absolute inset-0 bg-gradient-to-t ${promo.tone}`}></div>
                <div className="absolute inset-0 p-8">
                  <div className="flex h-full flex-col justify-end">
                    <p className={`mb-2 text-xs font-semibold uppercase tracking-widest ${promo.badge}`}>{promo.eyebrow}</p>
                    <h3 className="mb-5 text-2xl font-bold leading-tight text-white">{promo.heading}</h3>
                    <span className="inline-flex w-fit rounded-xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm">
                      {promo.button}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}

function NewsletterSection({ section }: { section: WebPageItem }) {
  return (
    <ShopNewsletterSignup
      badge={getField(section, 'badge') || 'Newsletter'}
      heading={getField(section, 'heading') || 'Stay in the Loop'}
      description={getField(section, 'description') || 'Get exclusive deals, new arrivals and interior tips to your inbox.'}
      button={getField(section, 'button') || 'Subscribe'}
    />
  )
}
