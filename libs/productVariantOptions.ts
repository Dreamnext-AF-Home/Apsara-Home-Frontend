export type VariantOptionLabels = {
  primaryLabel?: string
  secondaryLabel?: string
}

const META_PREFIX = '<!--AFHOME_VARIANT_OPTIONS:'
const META_SUFFIX = '-->'

const normalizeLabel = (value?: string | null) => {
  const trimmed = (value ?? '').trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export const extractVariantOptionLabels = (specifications?: string | null): VariantOptionLabels => {
  const source = specifications ?? ''
  const start = source.indexOf(META_PREFIX)
  if (start === -1) return {}

  const end = source.indexOf(META_SUFFIX, start + META_PREFIX.length)
  if (end === -1) return {}

  const payload = source.slice(start + META_PREFIX.length, end).trim()
  if (!payload) return {}

  try {
    const parsed = JSON.parse(payload) as { primaryLabel?: string; secondaryLabel?: string }
    return {
      primaryLabel: normalizeLabel(parsed.primaryLabel),
      secondaryLabel: normalizeLabel(parsed.secondaryLabel),
    }
  } catch {
    return {}
  }
}

export const stripVariantOptionLabelsMeta = (specifications?: string | null) => {
  const source = specifications ?? ''
  const start = source.indexOf(META_PREFIX)
  if (start === -1) return source

  const end = source.indexOf(META_SUFFIX, start + META_PREFIX.length)
  if (end === -1) return source

  const before = source.slice(0, start).trim()
  const after = source.slice(end + META_SUFFIX.length).trim()
  return [before, after].filter(Boolean).join('\n\n').trim()
}

export const mergeVariantOptionLabelsMeta = (
  specifications: string | null | undefined,
  labels: VariantOptionLabels,
) => {
  const cleaned = stripVariantOptionLabelsMeta(specifications)
  const primaryLabel = normalizeLabel(labels.primaryLabel)
  const secondaryLabel = normalizeLabel(labels.secondaryLabel)

  if (!primaryLabel && !secondaryLabel) {
    return cleaned || undefined
  }

  const payload = JSON.stringify({
    ...(primaryLabel ? { primaryLabel } : {}),
    ...(secondaryLabel ? { secondaryLabel } : {}),
  })

  return [cleaned, `${META_PREFIX}${payload}${META_SUFFIX}`].filter(Boolean).join('\n\n').trim()
}
