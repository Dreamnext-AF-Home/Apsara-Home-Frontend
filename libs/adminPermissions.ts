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
