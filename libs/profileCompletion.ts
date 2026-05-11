import type { MeResponse } from '@/store/api/userApi'

const isFilled = (value?: string | null) => {
  const normalized = String(value ?? '').trim()
  return normalized !== '' && normalized !== '0'
}

const inferWorkLocation = (country?: string | null) => {
  const normalized = String(country ?? '').trim()
  if (!normalized) return null

  if (
    normalized.toLowerCase() === 'philippines'
    || normalized.toUpperCase() === 'PH'
    || normalized === '175'
    || normalized.toLowerCase() === 'local'
  ) {
    return 'local'
  }

  return 'overseas'
}

export const getProfileCompletion = (profile?: Partial<MeResponse> | null) => {
  if (!profile) {
    return { percentage: 0, complete: false }
  }

  if (typeof profile.profile_completion_percentage === 'number') {
    return {
      percentage: profile.profile_completion_percentage,
      complete: Boolean(profile.profile_complete) || profile.profile_completion_percentage >= 100,
    }
  }

  const workLocation = profile.work_location ?? inferWorkLocation(profile.country)
  const checks = [
    isFilled(profile.name),
    isFilled(profile.email),
    isFilled(profile.phone),
    isFilled(profile.username),
    isFilled(profile.birth_date),
    isFilled(profile.gender),
    isFilled(profile.occupation) && String(profile.occupation).trim().toLowerCase() !== 'none',
    isFilled(workLocation),
    isFilled(profile.country),
    isFilled(profile.address),
    isFilled(profile.barangay),
    isFilled(profile.city),
    isFilled(profile.province),
    isFilled(profile.region),
    isFilled(profile.zip_code),
  ]

  const percentage = Math.round((checks.filter(Boolean).length / checks.length) * 100)
  return { percentage, complete: percentage >= 100 }
}
