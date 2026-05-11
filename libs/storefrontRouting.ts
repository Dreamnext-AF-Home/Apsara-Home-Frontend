const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const extractPartnerSlugFromPath = (pathname?: string | null): string | null => {
  const path = String(pathname ?? '').trim()
  if (!path) return null

  const shopMatch = path.match(/^\/shop\/([^/?#]+)/i)
  if (shopMatch?.[1]) return shopMatch[1].trim().toLowerCase()

  const directMatch = path.match(
    /^\/([^/?#]+)\/(product|category|checkout|track-order|profile|orders|wishlist|login)(?=\/|$)/i,
  )
  if (directMatch?.[1]) return directMatch[1].trim().toLowerCase()

  return null
}

export const buildStorefrontProductPath = (
  name: string,
  id?: number,
  pathname?: string | null,
): string => {
  const slug = toSlug(name || 'product')
  const productSuffix = typeof id === 'number' && id > 0 ? `${slug}-i${id}` : slug
  const partnerSlug = extractPartnerSlugFromPath(pathname)

  if (partnerSlug) {
    const currentPath = String(pathname ?? '').trim().toLowerCase()
    if (currentPath.startsWith('/shop/')) {
      return `/shop/${partnerSlug}/product/${productSuffix}`
    }
    return `/${partnerSlug}/product/${productSuffix}`
  }

  return `/product/${productSuffix}`
}
