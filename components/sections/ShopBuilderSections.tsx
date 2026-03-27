'use client'

import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import HeroSection from './HeroSection'
import FeaturedSections from './FeaturedSections'
import PromoBenners from './PromoBenners'
import NewsLetter from './NewsLetter'
import ProductCard from '../ui/ProductCard'
import ShopCategoryCarousel from './ShopCategoryCarousel'
import ShopNewsletterSignup from './ShopNewsletterSignup'
import type { Category } from '@/store/api/categoriesApi'
import type { Product } from '@/store/api/productsApi'
import type { WebPageItem } from '@/store/api/webPagesApi'
import { buildPartnerShopLink } from '@/libs/partnerStorefront'

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

export type ShopBuilderSectionsData = {
  items: WebPageItem[]
  categories: Category[]
  products: Product[]
} | null

export type ShopBuilderSectionsProps = {
  data?: ShopBuilderSectionsData
  partnerSlug?: string
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

export default function ShopBuilderSections({ data = null, partnerSlug }: ShopBuilderSectionsProps) {
  const { items, categories, products } = normalizeShopBuilderApiResponse(data)

  if (!data || items.length === 0) {
    return (
      <>
        <HeroSection />
        <FeaturedSections />
        <PromoBenners />
        <NewsLetter />
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
        url: category.url,
        count: category.product_count ?? 0,
        image: getField(categoryGrid, `card_${index + 1}_image`) || category.image || fallbackImage,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  const remainingCategoryCards = categories
    .filter((category) => !selectedCategoryCards.some((card) => card.id === category.id))
    .map((category) => ({
      id: category.id,
      name: category.name,
      url: category.url,
      count: category.product_count ?? 0,
      image: category.image || fallbackImage,
    }))

  const allCategoryCards = selectedCategoryCards.length > 0
    ? [...selectedCategoryCards, ...remainingCategoryCards]
    : remainingCategoryCards

  const featuredProducts = parseIdList(getField(featuredCollection, 'product_ids'))
    .map((id) => products.find((item) => item.id === id))
    .filter((item): item is Product => Boolean(item))
    .slice(0, 4)

  return (
    <>
      {announcements ? <AnnouncementsSection section={announcements} /> : null}
      {campaignBanners ? <CampaignBannersSection section={campaignBanners} partnerSlug={partnerSlug} /> : null}

      {categoryGrid ? (
        <CategoryGridSection
          section={categoryGrid}
          categoryCards={allCategoryCards}
          partnerSlug={partnerSlug}
        />
      ) : (
        <HeroSection />
      )}

      {featuredCollection ? (
        <FeaturedCollectionSection
          section={featuredCollection}
          featuredProducts={featuredProducts}
          partnerSlug={partnerSlug}
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
      className="bg-white"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="rounded-2xl border border-orange-100 bg-orange-50 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <AnimatePresence initial={false}>
              {chips.map((item, index) => (
                <motion.span
                  key={item}
                  initial={{ opacity: 0, scale: 0.92, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -8 }}
                  transition={{ duration: 0.22, delay: index * 0.04 }}
                  className="inline-flex rounded-full border border-orange-100 bg-white px-3 py-1 text-xs font-semibold text-orange-700"
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

function CampaignBannersSection({ section, partnerSlug }: { section: WebPageItem; partnerSlug?: string }) {
  const banners = [
    {
      title: getField(section, 'left_title') || 'Weekend Furniture Drop',
      subtitle: getField(section, 'left_subtitle') || 'Refresh your living room this week',
      image: getField(section, 'left_image') || fallbackImage,
      link: buildPartnerShopLink(getField(section, 'left_link') || '/shop', partnerSlug),
    },
    {
      title: getField(section, 'right_title') || 'Appliance Upgrade Days',
      subtitle: getField(section, 'right_subtitle') || 'Choose your best appliance today',
      image: getField(section, 'right_image') || '/Images/PromoBanners/ct2-img2-large.jpg',
      link: buildPartnerShopLink(getField(section, 'right_link') || '/shop', partnerSlug),
    },
  ]

  return (
    <motion.section
      {...fadeUp}
      transition={{ duration: 0.5, delay: 0.04 }}
      className="container mx-auto px-4 py-6"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <AnimatePresence initial={false}>
          {banners.map((banner, index) => (
            <motion.div
              key={`${banner.title}-${banner.image}`}
              initial={{ opacity: 0, y: 26, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.98 }}
              transition={{ duration: 0.42, delay: index * 0.08 }}
            >
              <Link href={banner.link} className="group relative block overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 p-5">
            <Image src={banner.image} alt={banner.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 to-slate-900/20" />
            <div className="relative flex min-h-[170px] flex-col justify-end text-white">
              <p className="text-xl font-bold">{banner.title}</p>
              <p className="mt-1 max-w-[240px] text-sm text-white/80">{banner.subtitle}</p>
            </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}

function CategoryGridSection({
  section,
  categoryCards,
  partnerSlug,
}: {
  section: WebPageItem
  categoryCards: Array<{ id: number; name: string; url: string; count: number; image: string }>
  partnerSlug?: string
}) {
  const fallbackCards = [1, 2, 3, 4].map((index) => ({
    id: index,
    name: `Category ${index}`,
    url: buildPartnerShopLink('/shop', partnerSlug),
    count: 0,
    image: getField(section, `card_${index}_image`) || fallbackImage,
  }))
  const cards = categoryCards.length > 0 ? categoryCards : fallbackCards

  return (
    <motion.section
      {...fadeUp}
      transition={{ duration: 0.5, delay: 0.08 }}
      className="container mx-auto px-4 py-10"
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
          className="text-3xl font-bold text-slate-900 md:text-4xl"
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
  partnerSlug,
}: {
  section: WebPageItem
  featuredProducts: Product[]
  partnerSlug?: string
}) {
  const buttonLink = buildPartnerShopLink(getField(section, 'lead_link') || '/shop', partnerSlug)
  const buttonText = section.button_text || 'Shop Collection'

  return (
    <motion.section
      {...fadeUp}
      transition={{ duration: 0.55, delay: 0.1 }}
      className="bg-gray-50 py-16"
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
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
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
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
                      <ProductCard
                        id={product.id}
                        name={product.name}
                        price={product.priceSrp}
                        priceMember={product.priceMember}
                        prodpv={product.prodpv}
                        image={product.image || fallbackImage}
                        stock={product.qty}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                [1, 2, 3, 4].map((index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="rounded-2xl bg-white p-3 shadow-sm"
                  >
                    <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-100 to-white" />
                    <p className="mt-3 text-sm font-medium text-gray-800">Select product IDs in Shop Builder</p>
                    <p className="mt-1 text-base font-bold text-orange-500">PHP 0</p>
                  </motion.div>
                ))
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
      className="container mx-auto px-4 py-12"
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
            <div className={`absolute inset-0 bg-gradient-to-t ${promo.tone}`} />
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
