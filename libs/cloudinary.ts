const CLOUDINARY_UPLOAD_SEGMENT = '/upload/'

type CloudinaryImageOptions = {
  width?: number
  height?: number
  quality?: 'auto' | number
  format?: 'auto' | 'webp' | 'jpg' | 'png' | 'avif'
  crop?: 'limit' | 'fill' | 'fit' | 'scale'
  dpr?: 'auto' | number
  effect?: string
  sharpen?: boolean
}

export const isCloudinaryUrl = (value?: string | null) =>
  Boolean(value && value.includes('res.cloudinary.com') && value.includes(CLOUDINARY_UPLOAD_SEGMENT))

export const getEnhancedCloudinaryImageUrl = (
  src?: string | null,
  {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'limit',
    dpr = 'auto',
    effect,
    sharpen = true,
  }: CloudinaryImageOptions = {},
) => {
  if (!src || !isCloudinaryUrl(src)) {
    return src ?? ''
  }

  const transforms = [
    width ? `w_${width}` : null,
    height ? `h_${height}` : null,
    crop ? `c_${crop}` : null,
    quality ? `q_${quality}` : null,
    format ? `f_${format}` : null,
    dpr ? `dpr_${dpr}` : null,
    sharpen ? 'e_sharpen:80' : null,
    effect ? effect : null,
  ].filter(Boolean)

  if (transforms.length === 0) {
    return src
  }

  return src.replace(CLOUDINARY_UPLOAD_SEGMENT, `${CLOUDINARY_UPLOAD_SEGMENT}${transforms.join(',')}/`)
}
