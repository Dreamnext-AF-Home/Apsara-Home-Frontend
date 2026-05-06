// ─── Web Content sub-section permissions (for level 4 users) ────────────────────
// Stored in admin_permissions as 'wc:' prefixed strings.
// Empty list = full access to all sections.

export const WEB_CONTENT_SECTION_OPTIONS = [
  { id: 'wc:shop-builder',        label: 'Shop Builder',        description: 'Shop layout, merch blocks, and promo placements.' },
  { id: 'wc:dreambuild',          label: 'DreamBuild',          description: 'DreamBuild landing page — hero, services, projects, etc.' },
  { id: 'wc:partner-storefronts', label: 'Partner Storefronts', description: 'Client-specific storefront pages and branding.' },
] as const

export type WebContentSectionId = (typeof WEB_CONTENT_SECTION_OPTIONS)[number]['id']

/** Returns true if the user can access a specific web content section.
 *  Empty permissions = no restriction = full access. */
export const canAccessWebContentSection = (permissions: string[], wcKey: string): boolean => {
  const wcSections = permissions.filter(p => p.startsWith('wc:'))
  if (wcSections.length === 0) return true
  return wcSections.includes(wcKey)
}

// ─── Main admin permission options ───────────────────────────────────────────────

export const ADMIN_PERMISSION_OPTIONS = [
  {
    id: 'members',
    label: 'Members',
    description: 'Access member lists, KYC, wallet, and referral views.',
  },
  {
    id: 'orders',
    label: 'Orders',
    description: 'Open order queues, approval flows, and fulfillment pages.',
  },
  {
    id: 'interior_requests',
    label: 'Interior Requests',
    description: 'Manage quotation and interior service requests.',
  },
  {
    id: 'products',
    label: 'Products',
    description: 'Manage products, categories, brands, and inventory pages.',
  },
  {
    id: 'shipping',
    label: 'Shipping',
    description: 'Open shipping, tracking, and courier tools.',
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    description: 'View supplier companies and supplier-related pages.',
  },
  {
    id: 'web_content',
    label: 'Web Content',
    description: 'Access shop builder, assembly guides, and website content pages.',
  },
  {
    id: 'settings_users',
    label: 'Users & Roles',
    description: 'Manage admin users, roles, and internal access settings.',
  },
] as const

export type AdminPermissionId = (typeof ADMIN_PERMISSION_OPTIONS)[number]['id']

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissionId[] = [
  'orders',
  'interior_requests',
  'products',
  'shipping',
  'web_content',
  'settings_users',
]

const VALID_PERMISSION_SET = new Set<string>(ADMIN_PERMISSION_OPTIONS.map((item) => item.id))

export const normalizeAdminPermissions = (permissions: unknown): AdminPermissionId[] => {
  if (!Array.isArray(permissions)) return []
  return permissions.filter((item): item is AdminPermissionId => typeof item === 'string' && VALID_PERMISSION_SET.has(item))
}
