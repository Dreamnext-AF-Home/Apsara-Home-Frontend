'use client'

import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useCreateAdminWebPageItemMutation,
  useDeleteAdminWebPageItemMutation,
  useGetAdminWebPageItemsQuery,
  useUpdateAdminWebPageItemMutation,
  type WebPageItem,
  type WebPageType,
} from '@/store/api/webPagesApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'

// ─── Types ──────────────────────────────────────────────────────────────────────

type SectionField = {
  key: string
  label: string
  kind?: 'text' | 'textarea' | 'select' | 'image-list'
  options?: string[]
}

type DreamBuildSection = {
  id: WebPageType
  label: string
  helper: string
  itemLabel: string
  dot: string
  fields: SectionField[]
}

type FormState = {
  key: string
  title: string
  subtitle: string
  body: string
  image_url: string
  link_url: string
  button_text: string
  sort_order: string
  is_active: boolean
  payload: Record<string, string>
}

// ─── Section config ─────────────────────────────────────────────────────────────

const sections: DreamBuildSection[] = [
  {
    id: 'dreambuild-hero',
    label: 'Hero Section',
    dot: 'bg-violet-400',
    itemLabel: 'Hero block',
    helper: 'Headline, CTA buttons, carousel images, stats.',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow text' },
      { key: 'primary_button_text', label: 'Primary button text' },
      { key: 'primary_button_url', label: 'Primary button link' },
      { key: 'secondary_button_text', label: 'Secondary button text' },
      { key: 'secondary_button_url', label: 'Secondary button link' },
      { key: 'stat_1_value', label: 'Stat 1 value' },
      { key: 'stat_1_label', label: 'Stat 1 label' },
      { key: 'stat_2_value', label: 'Stat 2 value' },
      { key: 'stat_2_label', label: 'Stat 2 label' },
      { key: 'stat_3_value', label: 'Stat 3 value' },
      { key: 'stat_3_label', label: 'Stat 3 label' },
      { key: 'signature_label', label: 'Signature label' },
      { key: 'carousel_images', label: 'Carousel images', kind: 'image-list' },
    ],
  },
  {
    id: 'dreambuild-services',
    label: 'Services',
    dot: 'bg-cyan-400',
    itemLabel: 'Service',
    helper: 'Service cards: Full Interior Design, Renovation, Styling.',
    fields: [
      { key: 'service_number', label: 'Service number (01, 02…)' },
      { key: 'bullets', label: 'Bullet points (one per line)', kind: 'textarea' },
    ],
  },
  {
    id: 'dreambuild-projects',
    label: 'Projects',
    dot: 'bg-amber-400',
    itemLabel: 'Project',
    helper: 'Portfolio items shown on home and projects pages.',
    fields: [
      { key: 'tag', label: 'Tag (e.g. Residential Interior)' },
      { key: 'location', label: 'Location' },
      { key: 'year', label: 'Year' },
      { key: 'scope', label: 'Scope items (one per line)', kind: 'textarea' },
      { key: 'card_size', label: 'Card size', kind: 'select', options: ['short', 'tall'] },
    ],
  },
  {
    id: 'dreambuild-blogs',
    label: 'Blogs',
    dot: 'bg-emerald-400',
    itemLabel: 'Blog post',
    helper: 'Blog cards and article metadata.',
    fields: [
      { key: 'category', label: 'Category' },
      { key: 'date', label: 'Date label (e.g. March 15, 2024)' },
      { key: 'read_time', label: 'Read time (e.g. 5 min read)' },
      { key: 'slug', label: 'URL slug' },
      { key: 'design_brief', label: 'Design brief / intro note', kind: 'textarea' },
      { key: 'takeaways', label: 'Key takeaways (one per line)', kind: 'textarea' },
      { key: 'sections', label: 'Article sections (Title|Body, one per line)', kind: 'textarea' },
      { key: 'gallery_images', label: 'Inspiration gallery images', kind: 'image-list' },
      { key: 'faq', label: 'FAQ items (Question|Answer, one per line)', kind: 'textarea' },
    ],
  },
  {
    id: 'dreambuild-testimonials',
    label: 'Testimonials',
    dot: 'bg-rose-400',
    itemLabel: 'Testimonial',
    helper: 'Client quotes, names, and roles.',
    fields: [
      { key: 'client_name', label: 'Client name' },
      { key: 'client_role', label: 'Client role / title' },
    ],
  },
  {
    id: 'dreambuild-gallery',
    label: 'Gallery',
    dot: 'bg-orange-400',
    itemLabel: 'Gallery item',
    helper: 'Gallery tiles with images and tone.',
    fields: [
      { key: 'tone', label: 'Tone', kind: 'select', options: ['light', 'dark', 'gold', 'soft'] },
      { key: 'alt', label: 'Image alt text' },
    ],
  },
  {
    id: 'dreambuild-process',
    label: 'Process',
    dot: 'bg-sky-400',
    itemLabel: 'Process step',
    helper: 'Steps like Discover, Shape, and Deliver.',
    fields: [
      { key: 'step_number', label: 'Step number (01, 02…)' },
    ],
  },
  {
    id: 'dreambuild-contact',
    label: 'Contact / Footer',
    dot: 'bg-slate-400',
    itemLabel: 'Contact block',
    helper: 'Contact info, footer notes, and CTA copy.',
    fields: [
      { key: 'email', label: 'Email address' },
      { key: 'phone', label: 'Phone number' },
      { key: 'address', label: 'Address', kind: 'textarea' },
    ],
  },
]

// ─── Static defaults (mirrors landing-data.ts — never changes unless updated) ──

const STATIC_DEFAULTS: Record<string, WebPageItem[]> = {
  'dreambuild-hero': [
    {
      id: -1, type: 'dreambuild-hero', key: 'hero-main', sort_order: 0, is_active: true,
      title: 'Refined interiors for homes that seek clarity and character',
      subtitle: null, button_text: null, link_url: null, image_url: null,
      body: 'Dreambuild creates calm, polished interiors through thoughtful planning, clean material stories, and a modern design language that feels elevated without becoming cold.',
      payload: {
        eyebrow: 'Interior Design Studio',
        primary_button_text: 'Explore Services',
        primary_button_url: '#services',
        secondary_button_text: 'View Projects',
        secondary_button_url: '/projects',
        stat_1_value: '150+', stat_1_label: 'interior concepts explored',
        stat_2_value: '48',   stat_2_label: 'spaces designed and styled',
        stat_3_value: '10',   stat_3_label: 'signature palette directions',
        signature_label: 'Signature Style',
        carousel_images: [
          'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80',
          'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80',
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
          'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
        ].join('\n'),
      },
    },
  ],
  'dreambuild-services': [
    {
      id: -1, type: 'dreambuild-services', key: 'full-interior-design', sort_order: 0, is_active: true,
      title: 'Full Interior Design', subtitle: null, body: 'A complete design service covering planning, mood direction, furniture curation, detailing, and the final visual language of the home.',
      image_url: null, link_url: null, button_text: null,
      payload: { service_number: '01', bullets: 'Space planning with lifestyle-based zoning\nMaterial, color, and finish coordination\nFurniture, lighting, and styling direction' },
    },
    {
      id: -2, type: 'dreambuild-services', key: 'renovation-design', sort_order: 1, is_active: true,
      title: 'Renovation Design', subtitle: null, body: 'For homes that need better flow, more refined finishes, and a stronger point of view before construction and procurement begin.',
      image_url: null, link_url: null, button_text: null,
      payload: { service_number: '02', bullets: 'Kitchen, bath, and common area upgrades\nBuilt-in, joinery, and ceiling direction\nLighting plans and visual consistency checks' },
    },
    {
      id: -3, type: 'dreambuild-services', key: 'styling-finishing', sort_order: 2, is_active: true,
      title: 'Styling and Finishing', subtitle: null, body: 'The final layer that makes a home feel complete through accessories, texture balance, lighting ambiance, and soft luxury detailing.',
      image_url: null, link_url: null, button_text: null,
      payload: { service_number: '03', bullets: 'Decor styling and shelf composition\nCurtain, textile, and soft-finish selection\nFinal-home shoot readiness and presentation polish' },
    },
  ],
  'dreambuild-projects': [
    { id: -1, type: 'dreambuild-projects', key: 'warm-minimalist', sort_order: 0, is_active: true, title: 'Warm Minimalist Residence', subtitle: null, body: 'A serene family home featuring warm oak tones, textured plaster walls, and curated furniture.', image_url: null, link_url: null, button_text: null, payload: { tag: 'Residential Interior', location: 'Metro Manila', year: '2024', card_size: 'tall', scope: 'Full Interior Design\nFurniture Curation\nLighting Design' } },
    { id: -2, type: 'dreambuild-projects', key: 'soft-luxe-condo', sort_order: 1, is_active: true, title: 'Soft Luxe Condo Suite', subtitle: null, body: 'A compact urban retreat transformed with soft textures and brass accents.', image_url: null, link_url: null, button_text: null, payload: { tag: 'Urban Living', location: 'Makati City', year: '2024', card_size: 'short', scope: 'Space Planning\nMaterial Selection\nStyling' } },
    { id: -3, type: 'dreambuild-projects', key: 'contemporary-family', sort_order: 2, is_active: true, title: 'Contemporary Family Home', subtitle: null, body: 'A complete home transformation focusing on open-plan living and natural light.', image_url: null, link_url: null, button_text: null, payload: { tag: 'Full Home Design', location: 'Quezon City', year: '2023', card_size: 'short', scope: 'Full Interior Design\nRenovation Consultation\nFurniture Design' } },
    { id: -4, type: 'dreambuild-projects', key: 'neutral-entertaining', sort_order: 3, is_active: true, title: 'Neutral Entertaining Space', subtitle: null, body: 'An elegant living and dining area designed for hosting.', image_url: null, link_url: null, button_text: null, payload: { tag: 'Living and Dining', location: 'BGC', year: '2023', card_size: 'tall', scope: 'Living Room Design\nDining Room Design\nLighting Layout' } },
  ],
  'dreambuild-blogs': [
    { id: -1, type: 'dreambuild-blogs', key: 'warm-modern-living-room', sort_order: 0, is_active: true, title: 'How To Build A Warm Modern Living Room', subtitle: 'A practical guide to layering neutrals, textures, and statement pieces.', body: null, image_url: null, link_url: null, button_text: null, payload: { category: 'Styling Guide', date: 'March 15, 2024', read_time: '5 min read', slug: 'warm-modern-living-room', design_brief: 'Build the room around one warm anchor material, then balance it with breathable spacing, soft texture, and low-glare light.', takeaways: 'Start with a calm base palette\nRepeat wood or woven tones at least three times\nUse lighting layers instead of one bright ceiling source', sections: 'Start With The Anchor|Choose one dominant material story first: oak, walnut, rattan, linen, or warm stone. Repeating that story makes the space feel intentional instead of randomly decorated.\nLayer Texture Before Color|Warm modern rooms do not need many colors. They need matte, woven, brushed, and soft surfaces working together so neutral pieces still feel dimensional.\nKeep The Layout Conversational|Pull seating away from the walls when possible, keep paths clear, and let the coffee table connect the main pieces without crowding the center.' } },
    { id: -2, type: 'dreambuild-blogs', key: 'small-spaces-premium', sort_order: 1, is_active: true, title: 'Interior Finishes That Make Small Spaces Feel Premium', subtitle: 'Simple finish decisions that elevate condos and compact homes.', body: null, image_url: null, link_url: null, button_text: null, payload: { category: 'Design Tips', date: 'March 8, 2024', read_time: '4 min read', slug: 'small-spaces-premium', design_brief: 'Compact homes feel elevated when the finishes are consistent, tactile, and edited down to a few strong decisions.', takeaways: 'Use fewer finishes with better repetition\nChoose vertical storage that looks built-in\nAvoid glossy overload in small rooms', sections: 'Edit The Finish Palette|Limit the room to two main finishes and one accent. This creates visual calm and helps inexpensive pieces feel more curated.\nUse Height For Storage|Tall cabinets, floating shelves, and vertical wall details draw the eye upward while keeping the floor open.\nMake Utility Look Intentional|Small spaces need hardworking pieces. Choose storage that has a clear design language so practical items do not look temporary.' } },
    { id: -3, type: 'dreambuild-blogs', key: 'before-renovate', sort_order: 2, is_active: true, title: 'Before You Renovate: Design Decisions To Finalize Early', subtitle: 'The key layout, lighting, and material choices to settle before build-out.', body: null, image_url: null, link_url: null, button_text: null, payload: { category: 'Renovation', date: 'February 28, 2024', read_time: '6 min read', slug: 'before-renovate', design_brief: 'The best renovation work happens when the invisible decisions are settled before construction starts.', takeaways: 'Finalize traffic flow before buying furniture\nLock major lighting positions early\nDecide built-ins before wall and outlet work', sections: 'Plan The Daily Route|Map how people move through the space at busy hours. Door swings, dining clearance, and storage access matter more than a beautiful mood board.\nDecide Lighting Before Ceilings|Ambient, task, and accent lighting should be planned before ceiling work begins so the final space feels layered.\nResolve Built-Ins Early|Cabinets, wardrobes, media walls, and desks affect outlets, measurements, wall finishes, and budget timing.' } },
    { id: -4, type: 'dreambuild-blogs', key: 'neutral-palette-guide', sort_order: 3, is_active: true, title: 'The Complete Guide to Neutral Color Palettes', subtitle: 'Understanding undertones, depth, and avoiding flat neutrals.', body: null, image_url: null, link_url: null, button_text: null, payload: { category: 'Color Theory', date: 'February 20, 2024', read_time: '7 min read', slug: 'neutral-palette-guide', design_brief: 'Neutral rooms need contrast, temperature control, and texture so they feel calm without feeling unfinished.', takeaways: 'Mix warm and cool neutrals carefully\nUse contrast to shape the room\nSample paint under real lighting', sections: 'Pick The Temperature|Every neutral has an undertone. Warm creams, cool grays, and pinkish beiges behave differently beside wood, metal, and daylight.\nCreate Depth With Contrast|A neutral room still needs dark, medium, and light values. Without value contrast, furniture and walls can visually disappear.\nUse Texture As Color|Boucle, linen, timber grain, stone, ribbed glass, and matte ceramics can make a simple palette feel rich.' } },
    { id: -5, type: 'dreambuild-blogs', key: 'lighting-layers', sort_order: 4, is_active: true, title: 'Mastering Lighting Layers in Modern Homes', subtitle: 'Ambient, task, and accent lighting for a functional and atmospheric space.', body: null, image_url: null, link_url: null, button_text: null, payload: { category: 'Lighting Design', date: 'February 12, 2024', read_time: '5 min read', slug: 'lighting-layers', design_brief: 'Good lighting changes the way a room works at morning, afternoon, and night.', takeaways: 'Use at least three light types in main rooms\nPut warm lights on dimmers when possible\nLight walls and corners, not only the center', sections: 'Start With Ambient Light|Use soft general lighting as the base. It should make the room usable without making it feel flat.\nAdd Task Lighting|Reading corners, desks, counters, and vanities need focused light that supports real activities.\nFinish With Accent Light|Wall washers, lamps, and shelf lighting create depth and make the room feel designed after sunset.' } },
    { id: -6, type: 'dreambuild-blogs', key: 'sustainable-materials', sort_order: 5, is_active: true, title: 'Sustainable Materials That Still Look Luxurious', subtitle: 'Eco-conscious choices that deliver on aesthetics without compromise.', body: null, image_url: null, link_url: null, button_text: null, payload: { category: 'Sustainability', date: 'February 5, 2024', read_time: '6 min read', slug: 'sustainable-materials', design_brief: 'Sustainable choices can still feel refined when material honesty, durability, and texture lead the design.', takeaways: 'Choose long-life materials over trendy finishes\nUse natural texture for quiet luxury\nCheck maintenance before final selection', sections: 'Prioritize Durability|The most sustainable finish is often the one that lasts longer, repairs cleanly, and still looks good after daily use.\nLet Natural Texture Show|Bamboo, reclaimed wood, stone offcuts, linen, cork, and recycled surfaces can bring depth without visual noise.\nDesign For Maintenance|Beautiful materials still need realistic care. Choose finishes that match how the household actually lives.' } },
  ],
  'dreambuild-testimonials': [
    { id: -1, type: 'dreambuild-testimonials', key: 'angela-m', sort_order: 0, is_active: true, title: 'Angela M.', subtitle: null, body: 'The space finally feels elevated but still personal. Every corner looks calm, intentional, and easy to live in.', image_url: null, link_url: null, button_text: null, payload: { client_name: 'Angela M.', client_role: 'Homeowner' } },
    { id: -2, type: 'dreambuild-testimonials', key: 'daniel-r', sort_order: 1, is_active: true, title: 'Daniel R.', subtitle: null, body: 'They translated our vague ideas into something polished and cohesive. The material palette alone changed the whole mood.', image_url: null, link_url: null, button_text: null, payload: { client_name: 'Daniel R.', client_role: 'Condo Client' } },
  ],
  'dreambuild-gallery': [
    { id: -1, type: 'dreambuild-gallery', key: 'living-room-styling', sort_order: 0, is_active: true, title: 'Living Room Styling', subtitle: null, body: null, image_url: null, link_url: null, button_text: null, payload: { tone: 'dark', alt: 'Living room with dark tones' } },
    { id: -2, type: 'dreambuild-gallery', key: 'dining-space-layers', sort_order: 1, is_active: true, title: 'Dining Space Layers', subtitle: null, body: null, image_url: null, link_url: null, button_text: null, payload: { tone: 'light', alt: 'Dining area with light finish' } },
    { id: -3, type: 'dreambuild-gallery', key: 'bedroom-material-story', sort_order: 2, is_active: true, title: 'Bedroom Material Story', subtitle: null, body: null, image_url: null, link_url: null, button_text: null, payload: { tone: 'gold', alt: 'Bedroom with warm gold tones' } },
    { id: -4, type: 'dreambuild-gallery', key: 'modern-kitchen-detail', sort_order: 3, is_active: true, title: 'Modern Kitchen Detail', subtitle: null, body: null, image_url: null, link_url: null, button_text: null, payload: { tone: 'soft', alt: 'Kitchen with soft finish' } },
    { id: -5, type: 'dreambuild-gallery', key: 'lounge-accent', sort_order: 4, is_active: true, title: 'Lounge Accent Composition', subtitle: null, body: null, image_url: null, link_url: null, button_text: null, payload: { tone: 'dark', alt: 'Lounge with accent pieces' } },
    { id: -6, type: 'dreambuild-gallery', key: 'warm-neutral-interior', sort_order: 5, is_active: true, title: 'Warm Neutral Interior', subtitle: null, body: null, image_url: null, link_url: null, button_text: null, payload: { tone: 'light', alt: 'Warm neutral living space' } },
  ],
  'dreambuild-process': [
    { id: -1, type: 'dreambuild-process', key: 'discover', sort_order: 0, is_active: true, title: 'Discover', subtitle: null, body: 'We collect references, understand how the client lives, and define the emotional tone the home should carry.', image_url: null, link_url: null, button_text: null, payload: { step_number: '01' } },
    { id: -2, type: 'dreambuild-process', key: 'shape', sort_order: 1, is_active: true, title: 'Shape', subtitle: null, body: 'Layouts, materials, finishes, and furniture language are refined into one coherent interior direction.', image_url: null, link_url: null, button_text: null, payload: { step_number: '02' } },
    { id: -3, type: 'dreambuild-process', key: 'deliver', sort_order: 2, is_active: true, title: 'Deliver', subtitle: null, body: 'Selections are organized into a presentation-ready design system that supports implementation with clarity.', image_url: null, link_url: null, button_text: null, payload: { step_number: '03' } },
  ],
  'dreambuild-contact': [
    { id: -1, type: 'dreambuild-contact', key: 'contact-main', sort_order: 0, is_active: true, title: "Let's design your home together", subtitle: null, body: 'Reach out to start a conversation about your space. We work with homeowners across Metro Manila.', image_url: null, link_url: null, button_text: null, payload: { email: 'hello@dreambuild.ph', phone: '+63 912 345 6789', address: 'Metro Manila, Philippines' } },
  ],
}

// ─── Form helpers ───────────────────────────────────────────────────────────────

const emptyForm: FormState = {
  key: '', title: '', subtitle: '', body: '',
  image_url: '', link_url: '', button_text: '',
  sort_order: '0', is_active: true, payload: {},
}

const COMPACT_PANEL_WIDTH = 288
const BLOG_PANEL_WIDTH = 704
const MIN_PANEL_WIDTH = 320
const MAX_PANEL_WIDTH = 960
const SUBTITLE_LIMIT = 255

const slugify = (v: string) =>
  v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const toForm = (item: WebPageItem, section: DreamBuildSection): FormState => {
  const p = (item.payload ?? {}) as Record<string, unknown>
  return {
    key: item.key ?? '',
    title: item.title ?? '',
    subtitle: item.subtitle ?? '',
    body: item.body ?? '',
    image_url: item.image_url ?? '',
    link_url: item.link_url ?? '',
    button_text: item.button_text ?? '',
    sort_order: String(item.sort_order ?? 0),
    is_active: item.is_active,
    payload: section.fields.reduce<Record<string, string>>((acc, f) => {
      const v = p[f.key]
      acc[f.key] = typeof v === 'string' ? v : Array.isArray(v) ? (v as string[]).join('\n') : ''
      return acc
    }, {}),
  }
}

const toPayload = (form: FormState, section: DreamBuildSection) => {
  const payload = Object.fromEntries(
    Object.entries(form.payload).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v !== ''),
  )

  if (section.id === 'dreambuild-blogs' && !payload.slug) {
    payload.slug = slugify(form.title)
  }

  return {
    key: form.key.trim() || slugify(form.title) || section.id,
    title: form.title.trim() || undefined,
    subtitle: form.subtitle.trim().slice(0, SUBTITLE_LIMIT) || undefined,
    body: form.body.trim() || undefined,
    image_url: form.image_url.trim() || undefined,
    link_url: form.link_url.trim() || undefined,
    button_text: form.button_text.trim() || undefined,
    sort_order: Number.parseInt(form.sort_order, 10) || 0,
    is_active: form.is_active,
    payload,
  }
}

const mergeItem = (item: WebPageItem, form: FormState): WebPageItem => ({
  ...item,
  title: form.title || null,
  subtitle: form.subtitle || null,
  body: form.body || null,
  image_url: form.image_url || null,
  link_url: form.link_url || null,
  button_text: form.button_text || null,
  sort_order: Number(form.sort_order) || 0,
  is_active: form.is_active,
  payload: { ...((item.payload as Record<string, string>) ?? {}), ...form.payload },
})

// Static fallback images for services (matches landing page serviceImages)
const SERVICE_IMAGES = [
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&q=80',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80',
  'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=900&q=80',
]

// ─── FieldZone — clickable sub-element within a canvas card ────────────────────

function FieldZone({
  fieldKey,
  label,
  onFocus,
  isActive,
  children,
}: {
  fieldKey: string
  label: string
  onFocus: (fieldKey: string) => void
  isActive: boolean
  children: ReactNode
}) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onFocus(fieldKey) }}
      className={`group/fz relative cursor-pointer rounded-lg transition-all duration-100 ${
        isActive
          ? 'bg-cyan-50/70 ring-2 ring-cyan-400 ring-offset-1'
          : 'hover:bg-cyan-50/40 hover:ring-2 hover:ring-cyan-200 hover:ring-offset-1'
      }`}
    >
      <span
        className={`pointer-events-none absolute -top-5 left-0 z-20 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white transition-opacity ${
          isActive ? 'bg-cyan-500 opacity-100' : 'bg-cyan-400 opacity-0 group-hover/fz:opacity-100'
        }`}
      >
        {label}
      </span>
      {children}
    </div>
  )
}

// ─── Canvas primitives ──────────────────────────────────────────────────────────

function AddNewButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 py-4 text-sm font-medium text-stone-400 transition hover:border-stone-400 hover:bg-white/60 hover:text-stone-600"
    >
      <span className="text-lg leading-none">+</span>
      {label}
    </button>
  )
}

function StaticBanner() {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
      <span className="mt-0.5 text-sm">📌</span>
      <div>
        <p className="text-xs font-bold text-amber-800">Showing static landing page content</p>
        <p className="mt-0.5 text-xs text-amber-700">
          These items are currently hardcoded in the landing page. Click any card to create a CMS version that will replace it.
        </p>
      </div>
    </div>
  )
}

function CanvasItem({
  item, selected, onSelect, isStatic, children,
}: {
  item: WebPageItem
  selected: WebPageItem | null
  onSelect: (item: WebPageItem) => void
  isStatic?: boolean
  children: ReactNode
}) {
  const isSelected = !isStatic && selected?.id === item.id

  return (
    <div
      onClick={() => onSelect(item)}
      title={isStatic ? 'Click to create a CMS version of this content' : undefined}
      className={`group relative cursor-pointer rounded-3xl transition-all duration-150 ${
        isStatic
          ? 'opacity-80 ring-2 ring-dashed ring-amber-300 hover:opacity-100 hover:ring-amber-400'
          : isSelected
          ? 'ring-2 ring-cyan-500 ring-offset-4'
          : 'ring-2 ring-transparent hover:ring-2 hover:ring-cyan-300 hover:ring-offset-4'
      }`}
    >
      {/* Badge */}
      {isStatic ? (
        <span className="pointer-events-none absolute -right-1 -top-1 z-10 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 shadow-sm ring-1 ring-amber-200">
          Static
        </span>
      ) : (
        <span className={`pointer-events-none absolute -right-1 -top-1 z-10 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm transition-opacity ${
          isSelected
            ? 'bg-cyan-500 text-white opacity-100'
            : 'bg-white text-cyan-600 ring-1 ring-cyan-200 opacity-0 group-hover:opacity-100'
        }`}>
          {isSelected ? '✎ Editing' : '✎ Edit'}
        </span>
      )}
      {children}
    </div>
  )
}

// ─── Section canvases ────────────────────────────────────────────────────────────

interface CanvasProps {
  items: WebPageItem[]
  selected: WebPageItem | null
  onSelect: (item: WebPageItem) => void
  onRequestDelete?: (item: WebPageItem) => void
  onAddNew: () => void
  isLoading: boolean
  onFieldFocus?: (item: WebPageItem, fieldKey: string) => void
  focusedField?: string | null
}

function HeroCanvas({ items, selected, onSelect, onAddNew, isLoading, onFieldFocus, focusedField }: CanvasProps) {
  const isStatic = items.length === 0
  const displayItems = isStatic ? (STATIC_DEFAULTS['dreambuild-hero'] ?? []) : items
  return (
    <div className="mx-auto max-w-4xl space-y-5 p-8">
      {isLoading && <ProgressBar />}
      {isStatic && <StaticBanner />}
      {displayItems.map(item => {
        const p = (item.payload ?? {}) as Record<string, string>
        const imgs = (p.carousel_images ?? '').split('\n').filter(Boolean)
        const stats = [1, 2, 3].map(n => ({ v: p[`stat_${n}_value`], l: p[`stat_${n}_label`] })).filter(s => s.v || s.l)
        const isThisSelected = !isStatic && selected?.id === item.id
        const fz = (fieldKey: string) => ({
          fieldKey,
          label: fieldKey.replace(/_/g, ' '),
          onFocus: (key: string) => onFieldFocus?.(item, key),
          isActive: isThisSelected && focusedField === fieldKey,
        })
        return (
          <CanvasItem key={item.id} item={item} selected={selected} onSelect={onSelect} isStatic={isStatic}>
            <div className="overflow-hidden rounded-3xl bg-white shadow-md">
              <div className="grid gap-10 p-8 lg:grid-cols-[1fr_340px] lg:items-center">
                <div>
                  <FieldZone {...fz('eyebrow')}>
                    <span className="inline-block rounded-full border border-stone-200 bg-white px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500">
                      {p.eyebrow || 'Interior Design Studio'}
                    </span>
                  </FieldZone>
                  <FieldZone {...fz('title')} label="Title">
                    <h2 className="mt-5 text-2xl font-medium leading-snug text-stone-900 lg:text-3xl">
                      {item.title || <em className="font-normal text-stone-300">Headline goes here…</em>}
                    </h2>
                  </FieldZone>
                  <FieldZone {...fz('body')} label="Body">
                    {(item.subtitle ?? item.body) ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-500">{item.subtitle ?? item.body}</p>
                    ) : null}
                  </FieldZone>
                  <FieldZone {...fz('primary_button_text')} label="Primary CTA">
                    <div className="mt-6 flex flex-wrap gap-3">
                      <span className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white">
                        {p.primary_button_text || 'Explore Services'}
                      </span>
                      <span className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700">
                        {p.secondary_button_text || 'View Projects'}
                      </span>
                    </div>
                  </FieldZone>
                  {stats.length > 0 && (
                    <FieldZone {...fz('stat_1_value')} label="Stats">
                      <div className="mt-8 grid grid-cols-3 gap-4 border-t border-stone-100 pt-6">
                        {stats.map((s, i) => (
                          <div key={i}>
                            <p className="text-xl font-medium text-stone-900">{s.v}</p>
                            <p className="mt-0.5 text-[10px] text-stone-400">{s.l}</p>
                          </div>
                        ))}
                      </div>
                    </FieldZone>
                  )}
                </div>
                <FieldZone {...fz('carousel_images')} label="Carousel image">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100">
                    {imgs[0]
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={imgs[0]} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full items-center justify-center"><p className="text-sm text-stone-400">Carousel image</p></div>
                    }
                    {imgs.length > 1 && (
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {imgs.map((_, i) => (
                          <span key={i} className={`block h-1 rounded-full bg-white/80 ${i === 0 ? 'w-4' : 'w-1.5 opacity-50'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                </FieldZone>
              </div>
            </div>
          </CanvasItem>
        )
      })}
      {!isStatic && <AddNewButton onClick={onAddNew} label="Add hero block" />}
    </div>
  )
}

function ServicesCanvas({ items, selected, onSelect, onAddNew, isLoading, onFieldFocus, focusedField }: CanvasProps) {
  const isStatic = items.length === 0
  const displayItems = isStatic ? (STATIC_DEFAULTS['dreambuild-services'] ?? []) : items

  return (
    <div className="mx-auto max-w-4xl p-8">
      {isLoading && <ProgressBar />}
      {isStatic && <StaticBanner />}

      {/* Section header — mirrors landing page */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-stone-400">
            <span className="h-px w-8 bg-stone-300" />
            Interior Services
          </p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight text-stone-900">
            What we do best.
          </h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-stone-500 lg:text-right">
          Three focused service areas, each designed to move your space forward.
        </p>
      </div>

      {/* Service items */}
      <div className="mt-14 space-y-20">
        {displayItems.map((item, idx) => {
          const p = (item.payload ?? {}) as Record<string, string>
          const bullets = (p.bullets ?? '').split('\n').filter(Boolean)
          const isEven = idx % 2 === 1
          const serviceNum = p.service_number || String(idx + 1).padStart(2, '0')
          const imgSrc = item.image_url || SERVICE_IMAGES[idx % SERVICE_IMAGES.length]
          const isThisSelected = !isStatic && selected?.id === item.id
          const fz = (fieldKey: string, label: string) => ({
            fieldKey,
            label,
            onFocus: (key: string) => onFieldFocus?.(item, key),
            isActive: isThisSelected && focusedField === fieldKey,
          })

          return (
            <CanvasItem key={item.id} item={item} selected={selected} onSelect={onSelect} isStatic={isStatic}>
              <div className="relative">
                {/* Oversized background number */}
                <div className={`pointer-events-none absolute -top-8 select-none text-[7rem] font-bold leading-none tracking-tighter text-stone-200 ${isEven ? 'right-0' : 'left-0'}`}>
                  {serviceNum}
                </div>

                <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
                  {isEven ? (
                    <>
                      <div className="flex flex-col justify-center">
                        <FieldZone {...fz('service_number', 'Service #')}>
                          <p className="text-xs font-medium uppercase tracking-widest text-stone-400">
                            Service {serviceNum}
                          </p>
                        </FieldZone>
                        <FieldZone {...fz('title', 'Title')}>
                          <h3 className="mt-4 text-2xl font-medium tracking-tight text-stone-900 lg:text-3xl">
                            {item.title || <em className="font-normal text-stone-300">Service title…</em>}
                          </h3>
                        </FieldZone>
                        <FieldZone {...fz('body', 'Body')}>
                          {(item.subtitle ?? item.body) ? (
                            <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-stone-500">{item.subtitle ?? item.body}</p>
                          ) : null}
                        </FieldZone>
                        <div className="my-6 h-px w-10 bg-stone-200" />
                        <FieldZone {...fz('bullets', 'Bullets')}>
                          {bullets.length > 0 && (
                            <div className="space-y-3">
                              {bullets.slice(0, 4).map((b, i) => (
                                <div key={i} className="flex items-start gap-3">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-[10px] font-medium text-stone-700">
                                    {String(i + 1).padStart(2, '0')}
                                  </span>
                                  <p className="pt-0.5 text-sm leading-relaxed text-stone-500">{b}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </FieldZone>
                      </div>
                      <FieldZone {...fz('image_url', 'Image')}>
                        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgSrc} alt={item.title ?? ''} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
                          <div className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm">
                            <span className="text-sm font-bold tracking-tight text-stone-900">{serviceNum}</span>
                          </div>
                        </div>
                      </FieldZone>
                    </>
                  ) : (
                    <>
                      <FieldZone {...fz('image_url', 'Image')}>
                        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgSrc} alt={item.title ?? ''} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
                          <div className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm">
                            <span className="text-sm font-bold tracking-tight text-stone-900">{serviceNum}</span>
                          </div>
                        </div>
                      </FieldZone>
                      <div className="flex flex-col justify-center">
                        <FieldZone {...fz('service_number', 'Service #')}>
                          <p className="text-xs font-medium uppercase tracking-widest text-stone-400">
                            Service {serviceNum}
                          </p>
                        </FieldZone>
                        <FieldZone {...fz('title', 'Title')}>
                          <h3 className="mt-4 text-2xl font-medium tracking-tight text-stone-900 lg:text-3xl">
                            {item.title || <em className="font-normal text-stone-300">Service title…</em>}
                          </h3>
                        </FieldZone>
                        <FieldZone {...fz('body', 'Body')}>
                          {(item.subtitle ?? item.body) ? (
                            <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-stone-500">{item.subtitle ?? item.body}</p>
                          ) : null}
                        </FieldZone>
                        <div className="my-6 h-px w-10 bg-stone-200" />
                        <FieldZone {...fz('bullets', 'Bullets')}>
                          {bullets.length > 0 && (
                            <div className="space-y-3">
                              {bullets.slice(0, 4).map((b, i) => (
                                <div key={i} className="flex items-start gap-3">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-[10px] font-medium text-stone-700">
                                    {String(i + 1).padStart(2, '0')}
                                  </span>
                                  <p className="pt-0.5 text-sm leading-relaxed text-stone-500">{b}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </FieldZone>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CanvasItem>
          )
        })}
      </div>

      {/* Bottom CTA — mirrors landing page */}
      <div className="mt-16 flex flex-col items-center gap-4 border-t border-stone-200 pt-12 text-center">
        <p className="text-base font-medium text-stone-900">
          Not sure which service fits your project?
        </p>
        <span className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-8 py-3.5 text-sm font-medium text-white">
          Book a Free Consult →
        </span>
      </div>

      {!isStatic && <AddNewButton onClick={onAddNew} label="Add service" />}
      {isStatic && (
        <button type="button" onClick={onAddNew} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cyan-200 py-3 text-xs font-semibold text-cyan-600 transition hover:bg-cyan-50">
          + Add CMS service (will replace static)
        </button>
      )}
    </div>
  )
}

function ProjectsCanvas({ items, selected, onSelect, onAddNew, isLoading, onFieldFocus, focusedField }: CanvasProps) {
  const isStatic = items.length === 0
  const displayItems = isStatic ? (STATIC_DEFAULTS['dreambuild-projects'] ?? []) : items
  return (
    <div className="mx-auto max-w-4xl p-8">
      {isLoading && <ProgressBar />}
      {isStatic && <StaticBanner />}
      <div className="grid grid-cols-2 gap-4">
        {displayItems.map(item => {
          const p = (item.payload ?? {}) as Record<string, string>
          const scope = (p.scope ?? '').split('\n').filter(Boolean)
          const isThisSelected = !isStatic && selected?.id === item.id
          const fz = (fieldKey: string, label: string) => ({
            fieldKey,
            label,
            onFocus: (key: string) => onFieldFocus?.(item, key),
            isActive: isThisSelected && focusedField === fieldKey,
          })
          return (
            <CanvasItem key={item.id} item={item} selected={selected} onSelect={onSelect} isStatic={isStatic}>
              <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
                <FieldZone {...fz('image_url', 'Image')}>
                  <div className={`overflow-hidden bg-stone-100 ${p.card_size === 'tall' ? 'aspect-[3/4]' : 'aspect-video'}`}>
                    {item.image_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200"><p className="text-xs text-stone-400">No image</p></div>
                    }
                  </div>
                </FieldZone>
                <div className="p-4">
                  <FieldZone {...fz('tag', 'Tag')}>
                    {p.tag && <p className="text-[10px] font-medium uppercase tracking-widest text-stone-400">{p.tag}</p>}
                  </FieldZone>
                  <FieldZone {...fz('title', 'Title')}>
                    <h3 className="mt-1 text-sm font-semibold text-stone-900">{item.title}</h3>
                  </FieldZone>
                  <FieldZone {...fz('location', 'Location / Year')}>
                    <div className="mt-1 flex gap-2 text-[11px] text-stone-400">
                      {p.location && <span>{p.location}</span>}
                      {p.year && <span>· {p.year}</span>}
                    </div>
                  </FieldZone>
                  <FieldZone {...fz('scope', 'Scope')}>
                    {scope.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {scope.map((s, i) => <span key={i} className="rounded-full bg-stone-50 px-2 py-0.5 text-[10px] text-stone-500">{s}</span>)}
                      </div>
                    )}
                  </FieldZone>
                </div>
              </div>
            </CanvasItem>
          )
        })}
      </div>
      <AddNewButton onClick={onAddNew} label={isStatic ? '+ Add CMS project (will replace static)' : 'Add project'} />
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BlogsCanvasOld({ items, selected, onSelect, onAddNew, isLoading, onFieldFocus, focusedField }: CanvasProps) {
  const isStatic = items.length === 0
  const displayItems = isStatic ? (STATIC_DEFAULTS['dreambuild-blogs'] ?? []) : items
  return (
    <div className="mx-auto max-w-4xl p-8">
      {isLoading && <ProgressBar />}
      {isStatic && <StaticBanner />}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {displayItems.map(item => {
          const p = (item.payload ?? {}) as Record<string, string>
          const isThisSelected = !isStatic && selected?.id === item.id
          const fz = (fieldKey: string, label: string) => ({
            fieldKey,
            label,
            onFocus: (key: string) => onFieldFocus?.(item, key),
            isActive: isThisSelected && focusedField === fieldKey,
          })
          return (
            <CanvasItem key={item.id} item={item} selected={selected} onSelect={onSelect} isStatic={isStatic}>
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <FieldZone {...fz('image_url', 'Image')}>
                  <div className="aspect-video overflow-hidden bg-gradient-to-br from-stone-50 to-stone-100">
                    {item.image_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full items-center justify-center"><p className="text-[10px] text-stone-400">No image</p></div>
                    }
                  </div>
                </FieldZone>
                <div className="p-3">
                  <FieldZone {...fz('category', 'Category / Date')}>
                    <div className="flex flex-wrap gap-1 text-[9px] uppercase tracking-wider text-stone-400">
                      {p.category && <span>{p.category}</span>}
                      {p.date && <><span>·</span><span>{p.date}</span></>}
                      {p.read_time && <><span>·</span><span>{p.read_time}</span></>}
                    </div>
                  </FieldZone>
                  <FieldZone {...fz('title', 'Title')}>
                    <h3 className="mt-1.5 text-xs font-semibold leading-snug text-stone-900">{item.title}</h3>
                  </FieldZone>
                  <FieldZone {...fz('subtitle', 'Subtitle')}>
                    {(item.subtitle ?? item.body) ? (
                      <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-stone-500">{item.subtitle ?? item.body}</p>
                    ) : null}
                  </FieldZone>
                </div>
              </div>
            </CanvasItem>
          )
        })}
      </div>
      <AddNewButton onClick={onAddNew} label={isStatic ? '+ Add CMS blog post (will replace static)' : 'Add blog post'} />
    </div>
  )
}

function TestimonialsCanvas({ items, selected, onSelect, onAddNew, isLoading, onFieldFocus, focusedField }: CanvasProps) {
  const isStatic = items.length === 0
  const displayItems = isStatic ? (STATIC_DEFAULTS['dreambuild-testimonials'] ?? []) : items
  return (
    <div className="mx-auto max-w-4xl p-8">
      {isLoading && <ProgressBar />}
      {isStatic && <StaticBanner />}
      <div className="grid gap-4 md:grid-cols-2">
        {displayItems.map(item => {
          const p = (item.payload ?? {}) as Record<string, string>
          const name = p.client_name || item.title
          const isThisSelected = !isStatic && selected?.id === item.id
          const fz = (fieldKey: string, label: string) => ({
            fieldKey,
            label,
            onFocus: (key: string) => onFieldFocus?.(item, key),
            isActive: isThisSelected && focusedField === fieldKey,
          })
          return (
            <CanvasItem key={item.id} item={item} selected={selected} onSelect={onSelect} isStatic={isStatic}>
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-3xl leading-none text-stone-200">&quot;</p>
                <FieldZone {...fz('body', 'Quote')}>
                  <p className="mt-2 line-clamp-4 text-sm italic leading-relaxed text-stone-700">
                    {item.body ?? item.subtitle}
                  </p>
                </FieldZone>
                <div className="mt-4 flex items-center gap-3 border-t border-stone-100 pt-4">
                  <FieldZone {...fz('image_url', 'Photo')}>
                    {item.image_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={item.image_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                      : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100"><span className="text-xs font-semibold text-stone-500">{name?.[0]?.toUpperCase() ?? '?'}</span></div>
                    }
                  </FieldZone>
                  <div>
                    <FieldZone {...fz('client_name', 'Name')}>
                      <p className="text-sm font-semibold text-stone-900">{name}</p>
                    </FieldZone>
                    <FieldZone {...fz('client_role', 'Role')}>
                      <p className="text-xs text-stone-400">{p.client_role}</p>
                    </FieldZone>
                  </div>
                </div>
              </div>
            </CanvasItem>
          )
        })}
      </div>
      <AddNewButton onClick={onAddNew} label={isStatic ? '+ Add CMS testimonial (will replace static)' : 'Add testimonial'} />
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function GalleryCanvasOld({ items, selected, onSelect, onAddNew, isLoading, onFieldFocus, focusedField }: CanvasProps) {
  const isStatic = items.length === 0
  const displayItems = isStatic ? (STATIC_DEFAULTS['dreambuild-gallery'] ?? []) : items
  const toneGrad: Record<string, string> = {
    dark: 'from-stone-600 to-stone-900',
    light: 'from-stone-100 to-stone-200',
    gold: 'from-amber-100 to-amber-300',
    soft: 'from-rose-50 to-stone-100',
  }
  return (
    <div className="mx-auto max-w-4xl p-8">
      {isLoading && <ProgressBar />}
      {isStatic && <StaticBanner />}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {displayItems.map(item => {
          const p = (item.payload ?? {}) as Record<string, string>
          const tone = p.tone || 'light'
          const isThisSelected = !isStatic && selected?.id === item.id
          const fz = (fieldKey: string, label: string) => ({
            fieldKey,
            label,
            onFocus: (key: string) => onFieldFocus?.(item, key),
            isActive: isThisSelected && focusedField === fieldKey,
          })
          return (
            <CanvasItem key={item.id} item={item} selected={selected} onSelect={onSelect} isStatic={isStatic}>
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <FieldZone {...fz('image_url', 'Image')}>
                  <div className="aspect-square overflow-hidden">
                    {item.image_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={item.image_url} alt={p.alt ?? ''} className="h-full w-full object-cover" />
                      : <div className={`flex h-full items-center justify-center bg-gradient-to-br ${toneGrad[tone] ?? toneGrad.light}`}><p className="text-xs capitalize text-stone-400">{tone}</p></div>
                    }
                  </div>
                </FieldZone>
                <div className="px-3 py-2">
                  <FieldZone {...fz('title', 'Title')}>
                    <p className="truncate text-xs font-medium text-stone-700">{item.title}</p>
                  </FieldZone>
                  <FieldZone {...fz('tone', 'Tone')}>
                    <p className="text-[10px] capitalize text-stone-400">{tone} · order {item.sort_order}</p>
                  </FieldZone>
                </div>
              </div>
            </CanvasItem>
          )
        })}
      </div>
      <AddNewButton onClick={onAddNew} label={isStatic ? '+ Add CMS gallery item (will replace static)' : 'Add gallery item'} />
    </div>
  )
}

function ProcessCanvas({ items, selected, onSelect, onAddNew, isLoading, onFieldFocus, focusedField }: CanvasProps) {
  const isStatic = items.length === 0
  const displayItems = isStatic ? (STATIC_DEFAULTS['dreambuild-process'] ?? []) : items
  return (
    <div className="mx-auto max-w-4xl p-8">
      {isLoading && <ProgressBar />}
      {isStatic && <StaticBanner />}
      <div className="grid gap-4 md:grid-cols-3">
        {displayItems.map((item, idx) => {
          const p = (item.payload ?? {}) as Record<string, string>
          const isThisSelected = !isStatic && selected?.id === item.id
          const fz = (fieldKey: string, label: string) => ({
            fieldKey,
            label,
            onFocus: (key: string) => onFieldFocus?.(item, key),
            isActive: isThisSelected && focusedField === fieldKey,
          })
          return (
            <CanvasItem key={item.id} item={item} selected={selected} onSelect={onSelect} isStatic={isStatic}>
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <FieldZone {...fz('step_number', 'Step #')}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-stone-900">
                    <span className="text-sm font-bold text-stone-900">{p.step_number || String(idx + 1).padStart(2, '0')}</span>
                  </div>
                </FieldZone>
                <FieldZone {...fz('title', 'Title')}>
                  <h3 className="mt-4 font-semibold text-stone-900">{item.title}</h3>
                </FieldZone>
                <FieldZone {...fz('body', 'Body')}>
                  <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-stone-500">{item.body ?? item.subtitle}</p>
                </FieldZone>
              </div>
            </CanvasItem>
          )
        })}
      </div>
      <AddNewButton onClick={onAddNew} label={isStatic ? '+ Add CMS step (will replace static)' : 'Add process step'} />
    </div>
  )
}

function ContactCanvas({ items, selected, onSelect, onAddNew, isLoading, onFieldFocus, focusedField }: CanvasProps) {
  const isStatic = items.length === 0
  const displayItems = isStatic ? (STATIC_DEFAULTS['dreambuild-contact'] ?? []) : items
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-8">
      {isLoading && <ProgressBar />}
      {isStatic && <StaticBanner />}
      {displayItems.map(item => {
        const p = (item.payload ?? {}) as Record<string, string>
        const isThisSelected = !isStatic && selected?.id === item.id
        const fz = (fieldKey: string, label: string) => ({
          fieldKey,
          label,
          onFocus: (key: string) => onFieldFocus?.(item, key),
          isActive: isThisSelected && focusedField === fieldKey,
        })
        return (
          <CanvasItem key={item.id} item={item} selected={selected} onSelect={onSelect} isStatic={isStatic}>
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <FieldZone {...fz('title', 'Title')}>
                <h3 className="text-xl font-medium text-stone-900">{item.title}</h3>
              </FieldZone>
              <FieldZone {...fz('body', 'Body')}>
                {(item.body ?? item.subtitle) ? (
                  <p className="mt-2 text-sm text-stone-500">{item.body ?? item.subtitle}</p>
                ) : null}
              </FieldZone>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <FieldZone {...fz('email', 'Email')}>
                  {p.email && (
                    <div className="rounded-xl bg-stone-50 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Email</p>
                      <p className="mt-1 text-sm text-stone-700">{p.email}</p>
                    </div>
                  )}
                </FieldZone>
                <FieldZone {...fz('phone', 'Phone')}>
                  {p.phone && (
                    <div className="rounded-xl bg-stone-50 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Phone</p>
                      <p className="mt-1 text-sm text-stone-700">{p.phone}</p>
                    </div>
                  )}
                </FieldZone>
                <FieldZone {...fz('address', 'Address')}>
                  {p.address && (
                    <div className="rounded-xl bg-stone-50 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Address</p>
                      <p className="mt-1 whitespace-pre-line text-sm text-stone-700">{p.address}</p>
                    </div>
                  )}
                </FieldZone>
              </div>
            </div>
          </CanvasItem>
        )
      })}
      {!isStatic && <AddNewButton onClick={onAddNew} label="Add contact block" />}
      {isStatic && (
        <button
          type="button"
          onClick={onAddNew}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cyan-200 py-3 text-xs font-semibold text-cyan-600 transition hover:bg-cyan-50"
        >
          + Add CMS contact block (will replace static)
        </button>
      )}
    </div>
  )
}

function BlogsCanvas({ items, selected, onSelect, onRequestDelete, onAddNew, isLoading, onFieldFocus, focusedField }: CanvasProps) {
  const displayItems = items

  return (
    <div className="mx-auto max-w-5xl p-8">
      {isLoading && <ProgressBar />}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-stone-300/60 pb-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">Editorial Library</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">Blogs</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-500">
            Manage CMS article records. The public landing page keeps its static fallback until CMS rows are added here.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-stone-800"
        >
          <span className="text-base leading-none">+</span>
          Add Blog Post
        </button>
      </div>

      {displayItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 p-10 text-center">
          <p className="text-sm font-semibold text-stone-900">No CMS blog posts yet</p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-stone-500">
            DreamBuild will keep using the static blog content from the landing page. Add a CMS post when you want to replace a fallback slot.
          </p>
          <button
            type="button"
            onClick={onAddNew}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-stone-800"
          >
            <span className="text-base leading-none">+</span>
            Add First Blog Post
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="grid grid-cols-[minmax(0,1.6fr)_130px_110px_100px_190px] gap-4 border-b border-stone-100 bg-stone-50 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
            <span>Article</span>
            <span>Category</span>
            <span>Date</span>
            <span>Read</span>
            <span className="text-right">Action</span>
          </div>
          {displayItems.map(item => {
            const p = (item.payload ?? {}) as Record<string, string>
            const isThisSelected = selected?.id === item.id
            const fz = (fieldKey: string, label: string) => ({
              fieldKey,
              label,
              onFocus: (key: string) => onFieldFocus?.(item, key),
              isActive: isThisSelected && focusedField === fieldKey,
            })

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(item)
                  }
                }}
                className={`group grid w-full cursor-pointer grid-cols-[minmax(0,1.6fr)_130px_110px_100px_190px] items-center gap-4 border-b border-stone-100 px-5 py-4 text-left transition last:border-b-0 hover:bg-stone-50 ${
                  isThisSelected ? 'bg-cyan-50/50' : ''
                }`}
              >
                <div className="min-w-0">
                  <FieldZone {...fz('title', 'Title')}>
                    <p className="truncate text-sm font-semibold text-stone-950">{item.title || 'Untitled article'}</p>
                  </FieldZone>
                  <FieldZone {...fz('subtitle', 'Excerpt')}>
                    <p className="mt-1 line-clamp-1 text-xs text-stone-500">{item.subtitle || item.body || 'No excerpt yet'}</p>
                  </FieldZone>
                </div>
                <FieldZone {...fz('category', 'Category')}>
                  <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{p.category || 'Uncategorized'}</p>
                </FieldZone>
                <FieldZone {...fz('date', 'Date')}>
                  <p className="text-xs text-stone-500">{p.date || 'No date'}</p>
                </FieldZone>
                <FieldZone {...fz('read_time', 'Read time')}>
                  <p className="text-xs text-stone-500">{p.read_time || 'No time'}</p>
                </FieldZone>
                <div className="flex min-w-0 items-center justify-end gap-2">
                  <span className="shrink-0 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                    CMS
                  </span>
                  {item.id > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRequestDelete?.(item)
                      }}
                      className="shrink-0 whitespace-nowrap rounded-full border border-red-200 bg-red-50 px-3.5 py-1.5 text-[11px] font-bold text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm"
                      title="Delete this blog post"
                    >
                      Delete
                    </button>
                  )}
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-stone-950 px-3.5 py-1.5 text-[11px] font-bold text-white transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-sm">Edit</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function GalleryCanvas({ items, selected, onSelect, onAddNew, isLoading, onFieldFocus, focusedField }: CanvasProps) {
  const displayItems = items
  const toneGrad: Record<string, string> = {
    dark: 'from-stone-600 to-stone-900',
    light: 'from-stone-100 to-stone-200',
    gold: 'from-amber-100 to-amber-300',
    soft: 'from-rose-50 to-stone-100',
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      {isLoading && <ProgressBar />}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-stone-300/60 pb-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">Visual Archive</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">Gallery</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-500">
            Add CMS gallery entries with tone and alt text. The landing page keeps its static gallery until items are added here.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-stone-800"
        >
          <span className="text-base leading-none">+</span>
          Add Gallery Item
        </button>
      </div>

      {displayItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 p-10 text-center">
          <p className="text-sm font-semibold text-stone-900">No CMS gallery items yet</p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-stone-500">
            DreamBuild will keep using the static gallery from the landing page. Add an item when you want to replace a fallback slot.
          </p>
          <button
            type="button"
            onClick={onAddNew}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-stone-800"
          >
            <span className="text-base leading-none">+</span>
            Add First Gallery Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {displayItems.map(item => {
          const p = (item.payload ?? {}) as Record<string, string>
          const tone = p.tone || 'light'
          const isThisSelected = selected?.id === item.id
          const fz = (fieldKey: string, label: string) => ({
            fieldKey,
            label,
            onFocus: (key: string) => onFieldFocus?.(item, key),
            isActive: isThisSelected && focusedField === fieldKey,
          })

          return (
            <CanvasItem key={item.id} item={item} selected={selected} onSelect={onSelect} isStatic={false}>
              <div className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <FieldZone {...fz('image_url', 'Image')}>
                  <div className="relative aspect-square overflow-hidden">
                    {item.image_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={item.image_url} alt={p.alt ?? ''} className="h-full w-full object-cover" />
                      : (
                        <div className={`flex h-full items-center justify-center bg-gradient-to-br ${toneGrad[tone] ?? toneGrad.light}`}>
                          <div className="text-center">
                            <p className="text-2xl font-light text-stone-400">+</p>
                            <p className="mt-1 text-xs capitalize text-stone-400">{tone} image</p>
                          </div>
                        </div>
                      )}
                    <span className="absolute right-3 top-3 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                      CMS
                    </span>
                  </div>
                </FieldZone>
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <FieldZone {...fz('title', 'Title')}>
                        <p className="truncate text-sm font-semibold text-stone-900">{item.title || 'Untitled image'}</p>
                      </FieldZone>
                      <FieldZone {...fz('tone', 'Tone')}>
                        <p className="mt-1 text-[11px] capitalize text-stone-400">{tone} · order {item.sort_order}</p>
                      </FieldZone>
                    </div>

                    {item.id > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelect(item)
                          // Then delete using the existing Delete button in the editor panel
                        }}
                        className="shrink-0 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-100"
                        title="Select this item first, then delete in the editor panel"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  <p className="mt-3 text-[11px] font-bold text-stone-950">Edit</p>
                </div>
              </div>
            </CanvasItem>
          )
        })}
        </div>
      )}
    </div>
  )
}

function SectionCanvas(props: CanvasProps & { section: DreamBuildSection }) {
  switch (props.section.id) {
    case 'dreambuild-hero': return <HeroCanvas {...props} />
    case 'dreambuild-services': return <ServicesCanvas {...props} />
    case 'dreambuild-projects': return <ProjectsCanvas {...props} />
    case 'dreambuild-blogs': return <BlogsCanvas {...props} />
    case 'dreambuild-testimonials': return <TestimonialsCanvas {...props} />
    case 'dreambuild-gallery': return <GalleryCanvas {...props} />
    case 'dreambuild-process': return <ProcessCanvas {...props} />
    case 'dreambuild-contact': return <ContactCanvas {...props} />
    default: return null
  }
}

// ─── Carousel images field ──────────────────────────────────────────────────────

function CarouselImagesField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  // Internal slots array — keeps empty strings alive so new rows persist
  const [slots, setSlots] = useState<string[]>(() => {
    const parsed = (value ?? '').split('\n').filter(Boolean)
    return parsed.length > 0 ? parsed : ['']
  })
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  // Track last value we wrote so external resets (different item selected) are detected
  const lastWritten = useRef((value ?? '').split('\n').filter(Boolean).join('\n'))
  useEffect(() => {
    const incoming = (value ?? '').split('\n').filter(Boolean).join('\n')
    if (incoming === lastWritten.current) return
    lastWritten.current = incoming
    const parsed = incoming.split('\n').filter(Boolean)
    setSlots(parsed.length > 0 ? parsed : [''])
  }, [value])

  const commit = (next: string[]) => {
    setSlots(next)
    const serialized = next.filter(Boolean).join('\n')
    lastWritten.current = serialized
    onChange(serialized)
  }

  const updateUrl = (idx: number, url: string) => {
    const next = [...slots]
    next[idx] = url
    commit(next)
  }

  const removeUrl = (idx: number) => {
    const next = slots.filter((_, i) => i !== idx)
    commit(next.length > 0 ? next : [''])
  }

  const uploadForSlot = async (idx: number, file: File) => {
    setUploadingIdx(idx)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'web-content')
      fd.append('asset_type', 'image')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const result = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !result.url) throw new Error(result.error ?? 'Upload failed')
      updateUrl(idx, result.url)
      showSuccessToast('Image uploaded.')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploadingIdx(null)
    }
  }

  return (
    <div className="space-y-2">
      {slots.map((url, idx) => (
        <div key={idx} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {/* Preview */}
          {url ? (
            <div className="relative h-20 overflow-hidden bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-bold text-white">
                {idx + 1}
              </span>
            </div>
          ) : (
            <div className="flex h-14 items-center justify-center bg-stone-100">
              <span className="text-[10px] text-stone-400">Image {idx + 1} — paste URL or upload</span>
            </div>
          )}
          {/* Controls row */}
          <div className="flex items-center gap-1.5 p-2">
            <input
              value={url}
              onChange={e => updateUrl(idx, e.target.value)}
              placeholder="https://..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-1 focus:ring-cyan-100"
            />
            {/* Upload */}
            <label className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition ${
              uploadingIdx === idx
                ? 'cursor-wait border-cyan-200 bg-cyan-50 text-cyan-400'
                : 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-white'
            }`} title="Upload image">
              {uploadingIdx === idx ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-300 border-t-cyan-600" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                </svg>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={uploadingIdx !== null}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) void uploadForSlot(idx, file)
                  e.currentTarget.value = ''
                }}
              />
            </label>
            {/* Remove */}
            <button
              type="button"
              onClick={() => removeUrl(idx)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-400 transition hover:bg-red-100"
              title="Remove image"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => commit([...slots, ''])}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-300 py-2.5 text-xs font-semibold text-slate-400 transition hover:border-slate-400 hover:text-slate-600"
      >
        <span className="text-base leading-none">+</span>
        Add image
      </button>
    </div>
  )
}

// ─── Edit panel ─────────────────────────────────────────────────────────────────

function EditPanel({
  section, form, setForm, editTarget, isBusy, onSubmit, onDelete, onCancel,
  focusedField, onUploadImage, isUploadingImage,
}: {
  section: DreamBuildSection
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  editTarget: WebPageItem | null
  isBusy: boolean
  onSubmit: (e: FormEvent) => void
  onDelete: () => void
  onCancel: () => void
  focusedField?: string | null
  onUploadImage?: (file: File) => Promise<void>
  isUploadingImage?: boolean
}) {
  const isCreatingFromStatic = !editTarget
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!focusedField || !scrollAreaRef.current) return
    const el = scrollAreaRef.current.querySelector<HTMLElement>(`[data-field="${focusedField}"]`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    // Slight delay so scroll completes before focusing
    setTimeout(() => el.querySelector<HTMLElement>('input, textarea, select')?.focus(), 150)
  }, [focusedField])

  if (section.id === 'dreambuild-blogs') {
    return (
      <BlogEditPanel
        section={section}
        form={form}
        setForm={setForm}
        editTarget={editTarget}
        isBusy={isBusy}
        onSubmit={onSubmit}
        onDelete={onDelete}
        onCancel={onCancel}
        focusedField={focusedField}
        onUploadImage={onUploadImage}
        isUploadingImage={isUploadingImage}
      />
    )
  }

  if (section.id === 'dreambuild-process') {
    return (
      <ProcessEditPanel
        form={form}
        setForm={setForm}
        editTarget={editTarget}
        isBusy={isBusy}
        onSubmit={onSubmit}
        onDelete={onDelete}
        onCancel={onCancel}
        focusedField={focusedField}
      />
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {isCreatingFromStatic ? `New ${section.itemLabel}` : 'Editing'}
            </p>
            {!isCreatingFromStatic && (
              <p className="mt-0.5 truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                {editTarget?.title ?? editTarget?.key ?? section.itemLabel}
              </p>
            )}
            {isCreatingFromStatic && (
              <p className="mt-0.5 text-xs text-amber-600">Pre-filled from static content</p>
            )}
          </div>
          <button type="button" onClick={onCancel} className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">✕</button>
        </div>
        {focusedField && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-cyan-50 px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <p className="text-[10px] font-semibold text-cyan-600">
              Editing: <span className="font-bold">{focusedField.replace(/_/g, ' ')}</span>
            </p>
          </div>
        )}
      </div>

      <div ref={scrollAreaRef} className="flex-1 space-y-3 overflow-y-auto p-5">
        <Field label="Title" fieldKey="title" focusedField={focusedField}>
          <input data-field="title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Main title" className={inputClass} />
        </Field>
        <Field label="Subtitle" fieldKey="subtitle" focusedField={focusedField}>
          <input data-field="subtitle" value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="Short support text" className={inputClass} />
        </Field>
        <Field label="Body / description" fieldKey="body" focusedField={focusedField}>
          <textarea data-field="body" value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={3} placeholder="Longer copy, quote, or description" className={inputClass} />
        </Field>

        {/* Image field with upload */}
        <Field label="Image" fieldKey="image_url" focusedField={focusedField}>
          <input
            data-field="image_url"
            value={form.image_url}
            onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
            placeholder="Paste URL or upload below"
            className={inputClass}
          />
          <label className={`mt-1.5 inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-semibold transition ${
            isUploadingImage
              ? 'cursor-wait border-cyan-200 bg-cyan-50 text-cyan-500'
              : 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-white'
          }`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16" />
              <line x1="12" y1="12" x2="12" y2="21" />
              <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
            </svg>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={isUploadingImage}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void onUploadImage?.(file)
                e.currentTarget.value = ''
              }}
            />
            {isUploadingImage ? 'Uploading…' : 'Upload Image'}
          </label>
          {form.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image_url} alt="" className="mt-2 h-24 w-full rounded-xl object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
        </Field>

        <Field label="Link URL" fieldKey="link_url" focusedField={focusedField}>
          <input data-field="link_url" value={form.link_url} onChange={e => setForm(p => ({ ...p, link_url: e.target.value }))} placeholder="/projects or https://..." className={inputClass} />
        </Field>
        <Field label="Button text" fieldKey="button_text" focusedField={focusedField}>
          <input data-field="button_text" value={form.button_text} onChange={e => setForm(p => ({ ...p, button_text: e.target.value }))} placeholder="e.g. View Project" className={inputClass} />
        </Field>

        {section.fields.length > 0 && (
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4 dark:border-cyan-900/30">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">
              {section.label} fields
            </p>
            <div className="space-y-3">
              {section.fields.map(field => (
                <Field key={field.key} label={field.label} fieldKey={field.key} focusedField={focusedField}>
                  {field.kind === 'image-list' ? (
                    <div data-field={field.key}>
                      <CarouselImagesField
                        value={form.payload[field.key] ?? ''}
                        onChange={val => setForm(p => ({ ...p, payload: { ...p.payload, [field.key]: val } }))}
                      />
                    </div>
                  ) : field.kind === 'select' ? (
                    <select data-field={field.key} value={form.payload[field.key] ?? ''} onChange={e => setForm(p => ({ ...p, payload: { ...p.payload, [field.key]: e.target.value } }))} className={inputClass}>
                      <option value="">Select…</option>
                      {(field.options ?? []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : field.kind === 'textarea' ? (
                    <textarea data-field={field.key} value={form.payload[field.key] ?? ''} onChange={e => setForm(p => ({ ...p, payload: { ...p.payload, [field.key]: e.target.value } }))} rows={3} className={inputClass} />
                  ) : (
                    <input data-field={field.key} value={form.payload[field.key] ?? ''} onChange={e => setForm(p => ({ ...p, payload: { ...p.payload, [field.key]: e.target.value } }))} className={inputClass} />
                  )}
                </Field>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Sort order" fieldKey="sort_order" focusedField={focusedField}>
            <input data-field="sort_order" type="number" min={0} value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))} className={inputClass} />
          </Field>
          <Field label="Key (auto)" fieldKey="key" focusedField={focusedField}>
            <input data-field="key" value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value }))} placeholder="Auto from title" className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-slate-100 p-4 dark:border-slate-800">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
          Active (visible on site)
        </label>
        <button type="submit" disabled={isBusy} className="w-full rounded-2xl bg-cyan-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-cyan-700/20 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60">
          {isBusy ? 'Saving…' : editTarget ? 'Save Changes' : `Create ${section.itemLabel}`}
        </button>
        {editTarget && (
          <button type="button" onClick={onDelete} className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100">
            Delete
          </button>
        )}
      </div>
    </form>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────────

function BlogEditPanel({
  form, setForm, editTarget, isBusy, onSubmit, onDelete, onCancel,
  focusedField, onUploadImage, isUploadingImage,
}: {
  section: DreamBuildSection
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  editTarget: WebPageItem | null
  isBusy: boolean
  onSubmit: (e: FormEvent) => void
  onDelete: () => void
  onCancel: () => void
  focusedField?: string | null
  onUploadImage?: (file: File) => Promise<void>
  isUploadingImage?: boolean
}) {
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const slugValue = form.payload.slug || slugify(form.title)
  const takeaways = (form.payload.takeaways ?? '').split('\n').map(v => v.trim()).filter(Boolean)
  const articleSections = (form.payload.sections ?? '').split('\n').map(v => v.trim()).filter(Boolean)
  const faqs = (form.payload.faq ?? '').split('\n').map(v => v.trim()).filter(Boolean)

  useEffect(() => {
    if (!focusedField || !scrollAreaRef.current) return
    const el = scrollAreaRef.current.querySelector<HTMLElement>(`[data-field="${focusedField}"]`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    setTimeout(() => el.querySelector<HTMLElement>('input, textarea, select')?.focus(), 150)
  }, [focusedField])

  const updatePayload = (key: string, value: string) => {
    setForm(p => ({ ...p, payload: { ...p.payload, [key]: value } }))
  }

  const baseInput = `${inputClass} bg-white`

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
              DreamBuild Blog Article Builder
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
              {editTarget ? (editTarget.title ?? 'Editing article') : 'New blog article'}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Same content blocks as the public DreamBuild blog page: card, hero, design brief, takeaways, sections, gallery, and FAQ.
            </p>
          </div>
          <button type="button" onClick={onCancel} className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">x</button>
        </div>
        {focusedField && (
          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <p className="text-[10px] font-semibold text-emerald-700">
              Editing: <span className="font-bold">{focusedField.replace(/_/g, ' ')}</span>
            </p>
          </div>
        )}
      </div>

      <div ref={scrollAreaRef} className="flex-1 space-y-5 overflow-y-auto bg-slate-50/70 p-5">
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="relative h-32 bg-gradient-to-br from-stone-200 via-stone-100 to-amber-100">
            {form.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image_url} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-700">
                {form.payload.category || 'Category'}
              </span>
              <p className="mt-2 line-clamp-1 text-sm font-bold text-white">{form.title || 'Article title preview'}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-stone-100 p-4 text-[11px] text-stone-500">
            <span>{form.payload.date || 'Date label'}</span>
            <span>{form.payload.read_time || 'Read time'}</span>
            <span className="truncate text-right">/blogs/{slugValue || 'slug'}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">Landing card and article hero</p>
          <div className="space-y-3">
            <Field label="Article title" fieldKey="title" focusedField={focusedField}>
              <input data-field="title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="How To Build A Warm Modern Living Room" className={baseInput} />
            </Field>
            <Field label="Excerpt / subtitle" fieldKey="subtitle" focusedField={focusedField}>
              <textarea
                data-field="subtitle"
                value={form.subtitle}
                maxLength={SUBTITLE_LIMIT}
                onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))}
                rows={2}
                placeholder="Short text shown on blog cards and below the article title."
                className={baseInput}
              />
              <div className="mt-1 flex items-center justify-between gap-3 text-[11px]">
                <span className="text-slate-400">Keep this short. Put longer copy in Design brief, Body, or Article sections.</span>
                <span className={form.subtitle.length > SUBTITLE_LIMIT - 25 ? 'font-semibold text-amber-600' : 'text-slate-400'}>
                  {form.subtitle.length}/{SUBTITLE_LIMIT}
                </span>
              </div>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Category" fieldKey="category" focusedField={focusedField}>
                <input data-field="category" value={form.payload.category ?? ''} onChange={e => updatePayload('category', e.target.value)} placeholder="Styling Guide" className={baseInput} />
              </Field>
              <Field label="URL slug" fieldKey="slug" focusedField={focusedField}>
                <input data-field="slug" value={form.payload.slug ?? ''} onChange={e => updatePayload('slug', e.target.value)} placeholder={slugify(form.title) || 'article-slug'} className={baseInput} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date label" fieldKey="date" focusedField={focusedField}>
                <input data-field="date" value={form.payload.date ?? ''} onChange={e => updatePayload('date', e.target.value)} placeholder="March 15, 2024" className={baseInput} />
              </Field>
              <Field label="Read time" fieldKey="read_time" focusedField={focusedField}>
                <input data-field="read_time" value={form.payload.read_time ?? ''} onChange={e => updatePayload('read_time', e.target.value)} placeholder="5 min read" className={baseInput} />
              </Field>
            </div>
            <Field label="Featured image" fieldKey="image_url" focusedField={focusedField}>
              <input data-field="image_url" value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="Paste URL or upload below" className={baseInput} />
              <label className={`mt-1.5 inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-semibold transition ${isUploadingImage ? 'cursor-wait border-emerald-200 bg-emerald-50 text-emerald-500' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-white'}`}>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={isUploadingImage} onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void onUploadImage?.(file)
                  e.currentTarget.value = ''
                }} />
                {isUploadingImage ? 'Uploading...' : 'Upload featured image'}
              </label>
            </Field>
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">Article content blocks</p>
          <div className="space-y-3">
            <Field label="Design brief" fieldKey="design_brief" focusedField={focusedField}>
              <textarea data-field="design_brief" value={form.payload.design_brief ?? ''} onChange={e => updatePayload('design_brief', e.target.value)} rows={3} placeholder="Appears in the article hero overlay and Design Brief box." className={baseInput} />
            </Field>
            <Field label="Fallback body paragraph" fieldKey="body" focusedField={focusedField}>
              <textarea data-field="body" value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={3} placeholder="Used if design brief is empty, or as supporting article copy." className={baseInput} />
            </Field>
            <Field label="Key takeaways" fieldKey="takeaways" focusedField={focusedField}>
              <textarea data-field="takeaways" value={form.payload.takeaways ?? ''} onChange={e => updatePayload('takeaways', e.target.value)} rows={4} placeholder={'One takeaway per line\nExample: Start with a calm base palette'} className={baseInput} />
              <p className="mt-1 text-[11px] text-slate-400">{takeaways.length} takeaway{takeaways.length === 1 ? '' : 's'} will show on the article page.</p>
            </Field>
            <Field label="Article sections" fieldKey="sections" focusedField={focusedField}>
              <textarea data-field="sections" value={form.payload.sections ?? ''} onChange={e => updatePayload('sections', e.target.value)} rows={6} placeholder={'Format: Heading|Body, one section per line\nExample: Start With The Anchor|Choose one dominant material story first.'} className={baseInput} />
              <p className="mt-1 text-[11px] text-slate-400">{articleSections.length} section{articleSections.length === 1 ? '' : 's'} will generate the table of contents.</p>
            </Field>
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">Gallery and FAQ</p>
          <div className="space-y-3">
            <Field label="In-article gallery images" fieldKey="gallery_images" focusedField={focusedField}>
              <div data-field="gallery_images">
                <CarouselImagesField value={form.payload.gallery_images ?? ''} onChange={val => updatePayload('gallery_images', val)} />
              </div>
            </Field>
            <Field label="FAQ items" fieldKey="faq" focusedField={focusedField}>
              <textarea data-field="faq" value={form.payload.faq ?? ''} onChange={e => updatePayload('faq', e.target.value)} rows={5} placeholder={'Format: Question|Answer, one FAQ per line\nExample: What makes a room feel warm?|Repeated texture and layered lighting.'} className={baseInput} />
              <p className="mt-1 text-[11px] text-slate-400">{faqs.length} FAQ item{faqs.length === 1 ? '' : 's'} will show at the bottom of the article.</p>
            </Field>
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">Publishing</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sort order" fieldKey="sort_order" focusedField={focusedField}>
              <input data-field="sort_order" type="number" min={0} value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))} className={baseInput} />
            </Field>
            <Field label="Key (auto)" fieldKey="key" focusedField={focusedField}>
              <input data-field="key" value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value }))} placeholder="Auto from title" className={baseInput} />
            </Field>
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-slate-100 bg-white p-4 dark:border-slate-800">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
          Active (visible on DreamBuild)
        </label>
        <button type="submit" disabled={isBusy} className="w-full rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
          {isBusy ? 'Saving...' : editTarget ? 'Save Blog Article' : 'Create Blog Article'}
        </button>
        {editTarget && (
          <button type="button" onClick={onDelete} className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100">
            Delete
          </button>
        )}
      </div>
    </form>
  )
}

function ProcessEditPanel({
  form, setForm, editTarget, isBusy, onSubmit, onDelete, onCancel, focusedField,
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  editTarget: WebPageItem | null
  isBusy: boolean
  onSubmit: (e: FormEvent) => void
  onDelete: () => void
  onCancel: () => void
  focusedField?: string | null
}) {
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const stepNumber = form.payload.step_number || '01'

  useEffect(() => {
    if (!focusedField || !scrollAreaRef.current) return
    const el = scrollAreaRef.current.querySelector<HTMLElement>(`[data-field="${focusedField}"]`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    setTimeout(() => el.querySelector<HTMLElement>('input, textarea, select')?.focus(), 150)
  }, [focusedField])

  const updatePayload = (key: string, value: string) => {
    setForm(p => ({ ...p, payload: { ...p.payload, [key]: value } }))
  }

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600">
              DreamBuild Process Step
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
              {editTarget ? (editTarget.title ?? 'Editing process step') : 'New process step'}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              This matches the public Process cards: step number, title, and description.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {editTarget && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-100"
              >
                Delete
              </button>
            )}
            <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">x</button>
          </div>
        </div>
      </div>

      <div ref={scrollAreaRef} className="flex-1 space-y-5 overflow-y-auto bg-slate-50/70 p-5">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-stone-900">
            <span className="text-sm font-bold text-stone-900">{stepNumber}</span>
          </div>
          <p className="mt-5 text-lg font-semibold text-stone-950">{form.title || 'Step title preview'}</p>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">
            {form.body || 'Step description preview will appear here.'}
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">Process card content</p>
          <div className="space-y-3">
            <Field label="Step number" fieldKey="step_number" focusedField={focusedField}>
              <input
                data-field="step_number"
                value={form.payload.step_number ?? ''}
                onChange={e => updatePayload('step_number', e.target.value)}
                placeholder="01"
                className={inputClass}
              />
            </Field>
            <Field label="Step title" fieldKey="title" focusedField={focusedField}>
              <input
                data-field="title"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Discover"
                className={inputClass}
              />
            </Field>
            <Field label="Step description" fieldKey="body" focusedField={focusedField}>
              <textarea
                data-field="body"
                value={form.body}
                onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                rows={5}
                placeholder="We collect references, understand how the client lives, and define the emotional tone the home should carry."
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">Publishing</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sort order" fieldKey="sort_order" focusedField={focusedField}>
              <input data-field="sort_order" type="number" min={0} value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Key (auto)" fieldKey="key" focusedField={focusedField}>
              <input data-field="key" value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value }))} placeholder="Auto from title" className={inputClass} />
            </Field>
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-slate-100 bg-white p-4 dark:border-slate-800">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
          Active (visible on DreamBuild)
        </label>
        <button type="submit" disabled={isBusy} className="w-full rounded-2xl bg-sky-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-sky-700/20 transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60">
          {isBusy ? 'Saving...' : editTarget ? 'Save Process Step' : 'Create Process Step'}
        </button>
        {editTarget && (
          <button type="button" onClick={onDelete} className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100">
            Delete
          </button>
        )}
      </div>
    </form>
  )
}

export default function DreamBuildContentManager() {
  const [selectedType, setSelectedType] = useState<WebPageType>('dreambuild-hero')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editTarget, setEditTarget] = useState<WebPageItem | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelWidth, setPanelWidth] = useState(COMPACT_PANEL_WIDTH)
  const [isResizingPanel, setIsResizingPanel] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<WebPageItem | null>(null)
  const editorShellRef = useRef<HTMLDivElement | null>(null)

  const selectedSection = useMemo(
    () => sections.find(s => s.id === selectedType) ?? sections[0],
    [selectedType],
  )

  const { data, isLoading, isFetching, isError } = useGetAdminWebPageItemsQuery({
    type: selectedSection.id, page: 1, perPage: 100, status: 'all',
  })

  const [createItem, { isLoading: isCreating }] = useCreateAdminWebPageItemMutation()
  const [updateItem, { isLoading: isUpdating }] = useUpdateAdminWebPageItemMutation()
  const [deleteItem, { isLoading: isDeleting }] = useDeleteAdminWebPageItemMutation()

  const isBusy = isCreating || isUpdating

  useEffect(() => {
    if (!isResizingPanel) return

    const onPointerMove = (event: PointerEvent) => {
      const bounds = editorShellRef.current?.getBoundingClientRect()
      if (!bounds) return

      const maxWidth = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, bounds.width - 280))
      const nextWidth = Math.round(bounds.right - event.clientX)
      setPanelWidth(Math.min(maxWidth, Math.max(MIN_PANEL_WIDTH, nextWidth)))
    }

    const onPointerUp = () => {
      setIsResizingPanel(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizingPanel])

  // Real-time canvas: merge form state into the editing item for live preview
  const displayItems = useMemo(() => {
    const saved = data?.items ?? []
    if (!editTarget || editTarget.id < 0) return saved
    return saved.map(item => item.id === editTarget.id ? mergeItem(item, form) : item)
  }, [data?.items, editTarget, form])

  const resetForm = () => {
    setForm(emptyForm)
    setEditTarget(null)
    setPanelOpen(false)
    setFocusedField(null)
    setDeleteTarget(null)
  }

  const handleSectionChange = (type: WebPageType) => {
    setSelectedType(type)
    setPanelWidth(type === 'dreambuild-blogs' ? BLOG_PANEL_WIDTH : COMPACT_PANEL_WIDTH)
    resetForm()
  }

  // Opens the edit panel for an item, optionally focusing a specific field
  const openPanel = (item: WebPageItem, focusField?: string | null) => {
    const isSameItem = editTarget !== null && editTarget.id === item.id
    if (!isSameItem) {
      if (item.id < 0) {
        setEditTarget(null)
        setForm(toForm(item, selectedSection))
      } else {
        setEditTarget(item)
        setForm(toForm(item, selectedSection))
      }
    }
    setPanelOpen(true)
    setFocusedField(focusField ?? null)
  }

  const handleSelect = (item: WebPageItem) => openPanel(item)
  const handleFieldFocus = (item: WebPageItem, fieldKey: string) => openPanel(item, fieldKey)
  const handleAddNew = () => {
    const nextStepNumber = String(displayItems.length + 1).padStart(2, '0')
    setEditTarget(null)
    setForm(selectedSection.id === 'dreambuild-blogs'
      ? {
        ...emptyForm,
        payload: {
          category: 'Styling Guide',
          read_time: '5 min read',
          takeaways: 'Start with a clear room purpose\nRepeat materials for cohesion\nUse lighting to shape mood',
          sections: 'Start With The Foundation|Define the main material, layout, and furniture direction before adding decorative layers.\nLayer Texture And Light|Use tactile surfaces and multiple light sources to make the room feel finished.\nEdit The Final Composition|Remove pieces that do not support the room purpose and let the strongest details breathe.',
          faq: 'Can this article be customized from admin?|Yes. The title, excerpt, image, design brief, takeaways, sections, gallery, and FAQ fields all map to the DreamBuild blog page.',
        },
      }
      : selectedSection.id === 'dreambuild-process'
        ? {
          ...emptyForm,
          sort_order: String(displayItems.length),
          payload: {
            step_number: nextStepNumber,
          },
        }
      : emptyForm)
    setPanelOpen(true)
    setFocusedField(null)
  }

  const handleUploadImage = async (file: File) => {
    setIsUploadingImage(true)
    try {
      const payload = new FormData()
      payload.append('file', file)
      payload.append('folder', 'web-content')
      payload.append('asset_type', 'image')
      const response = await fetch('/api/admin/upload', { method: 'POST', body: payload })
      const result = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !result.url) throw new Error(result.error ?? 'Upload failed')
      setForm(p => ({ ...p, image_url: result.url! }))
      showSuccessToast('Image uploaded.')
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Failed to upload image.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      if (editTarget && editTarget.id > 0) {
        await updateItem({ type: selectedSection.id, id: editTarget.id, data: toPayload(form, selectedSection) }).unwrap()
        showSuccessToast(`${selectedSection.itemLabel} updated.`)
      } else {
        await createItem({ type: selectedSection.id, data: toPayload(form, selectedSection) }).unwrap()
        showSuccessToast(`${selectedSection.itemLabel} created.`)
      }
      resetForm()
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } }
      const first = apiErr?.data?.errors ? Object.values(apiErr.data.errors)[0]?.[0] : undefined
      showErrorToast(first ?? apiErr?.data?.message ?? 'Failed to save.')
    }
  }

  const handleRequestDelete = (item = editTarget) => {
    if (!item || item.id < 0) return
    setDeleteTarget(item)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleteTarget.id < 0) return
    try {
      await deleteItem({ type: selectedSection.id, id: deleteTarget.id }).unwrap()
      showSuccessToast(`${selectedSection.itemLabel} deleted.`)
      if (editTarget?.id === deleteTarget.id) {
        resetForm()
      } else {
        setDeleteTarget(null)
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message ?? 'Failed to delete.')
    }
  }

  return (
    <div
      ref={editorShellRef}
      className="flex overflow-hidden rounded-3xl border border-slate-200 bg-[#edeae5] shadow-sm dark:border-slate-800"
      style={{ height: 'calc(100vh - 120px)', minHeight: 640 }}
    >
      {/* ── 1. Dark sidebar ─────────────────────────────────────────── */}
      <aside className="flex w-52 shrink-0 flex-col overflow-hidden border-r border-white/5 bg-[#0f0f0f]">
        <div className="shrink-0 border-b border-white/10 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">DreamBuild</p>
          <p className="mt-0.5 text-sm font-semibold text-white">Content Editor</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          <p className="px-5 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-widest text-stone-600">Sections</p>
          {sections.map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() => handleSectionChange(section.id)}
              className={`flex w-full items-center gap-2.5 px-5 py-2.5 text-left text-sm transition ${
                selectedSection.id === section.id
                  ? 'bg-white/10 font-semibold text-white'
                  : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
              }`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${section.dot}`} />
              {section.label}
            </button>
          ))}
        </nav>
        {isError && (
          <p className="shrink-0 border-t border-white/10 px-5 py-3 text-[10px] leading-relaxed text-amber-400">
            Backend needs to support {selectedSection.id}.
          </p>
        )}
      </aside>

      {/* ── 2. Canvas ────────────────────────────────────────────────── */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Fake browser bar */}
        <div className="shrink-0 border-b border-stone-300/40 bg-[#e2ddd7] px-5 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400/50" />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-full bg-white/50 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
              <span className="text-xs text-stone-400">dreambuild.ph · {selectedSection.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${selectedSection.dot}`} />
              <span className="text-xs font-medium text-stone-500">{displayItems.length} items</span>
            </div>
          </div>
        </div>

        {(isLoading || isFetching) && (
          <div className="h-0.5 shrink-0 overflow-hidden bg-cyan-200">
            <div className="h-full w-1/3 animate-pulse bg-cyan-500" />
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <SectionCanvas
            section={selectedSection}
            items={displayItems}
            selected={editTarget}
            onSelect={handleSelect}
            onRequestDelete={handleRequestDelete}
            onAddNew={handleAddNew}
            isLoading={isLoading}
            onFieldFocus={handleFieldFocus}
            focusedField={focusedField}
          />
        </div>
      </div>

      {/* ── 3. Edit panel ────────────────────────────────────────────── */}
      <aside
        className={`relative flex max-w-[calc(100vw-16rem)] shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${
          isResizingPanel ? '' : 'transition-[width] duration-200'
        }`}
        style={{ width: panelOpen ? panelWidth : 0 }}
      >
        {panelOpen && (
          <>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize editor panel"
              title="Drag to resize"
              onPointerDown={(event) => {
                event.preventDefault()
                setIsResizingPanel(true)
              }}
              className={`group absolute left-0 top-0 z-20 h-full w-2 cursor-col-resize transition ${
                isResizingPanel ? 'bg-emerald-400/40' : 'bg-transparent hover:bg-emerald-400/25'
              }`}
            >
              <span className={`absolute left-1/2 top-1/2 h-12 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition ${
                isResizingPanel ? 'bg-emerald-600' : 'bg-slate-300 opacity-0 group-hover:opacity-100'
              }`} />
            </div>
            <EditPanel
              section={selectedSection}
              form={form}
              setForm={setForm}
              editTarget={editTarget}
              isBusy={isBusy}
              onSubmit={handleSubmit}
              onDelete={() => handleRequestDelete()}
              onCancel={resetForm}
              focusedField={focusedField}
              onUploadImage={handleUploadImage}
              isUploadingImage={isUploadingImage}
            />
          </>
        )}
      </aside>

      {deleteTarget && (
        <DeleteConfirmModal
          itemLabel={selectedSection.itemLabel}
          itemTitle={deleteTarget.title ?? deleteTarget.key ?? selectedSection.itemLabel}
          isDeleting={isDeleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}

// ─── Shared UI ──────────────────────────────────────────────────────────────────

function ProgressBar() {
  return (
    <div className="mb-4 h-0.5 overflow-hidden rounded-full bg-stone-200">
      <div className="h-full w-1/2 animate-pulse rounded-full bg-stone-400" />
    </div>
  )
}

function DeleteConfirmModal({
  itemLabel,
  itemTitle,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  itemLabel: string
  itemTitle: string
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex animate-[dreambuildModalFadeIn_160ms_ease-out] items-center justify-center bg-stone-950/50 px-4 backdrop-blur-sm">
      <style jsx global>{`
        @keyframes dreambuildModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes dreambuildModalPanelIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <div className="w-full max-w-md animate-[dreambuildModalPanelIn_180ms_ease-out] rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-500">Confirm delete</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-stone-950">Delete this {itemLabel.toLowerCase()}?</h3>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          This will permanently remove <span className="font-semibold text-stone-900">&ldquo;{itemTitle}&rdquo;</span> from the CMS records.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="inline-flex min-w-24 items-center justify-center whitespace-nowrap rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-stone-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex min-w-28 items-center justify-center whitespace-nowrap rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-red-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-white focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800'

function Field({
  label, children, fieldKey, focusedField,
}: {
  label: string
  children: ReactNode
  fieldKey?: string
  focusedField?: string | null
}) {
  const highlighted = Boolean(fieldKey && focusedField === fieldKey)
  return (
    <label
      className={`block space-y-1.5 rounded-xl px-2 py-1.5 -mx-2 transition-colors duration-150 ${
        highlighted ? 'bg-cyan-50 ring-1 ring-cyan-200' : ''
      }`}
    >
      <span className={`text-xs font-semibold transition-colors ${
        highlighted ? 'text-cyan-600' : 'text-slate-500 dark:text-slate-400'
      }`}>
        {label}
        {highlighted && <span className="ml-1.5 rounded bg-cyan-500 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">active</span>}
      </span>
      {children}
    </label>
  )
}
