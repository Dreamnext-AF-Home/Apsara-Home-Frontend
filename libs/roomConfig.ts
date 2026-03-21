export type RoomOption = {
  id: number
  slug: string
  label: string
}

export const ROOM_OPTIONS: RoomOption[] = [
  { id: 1, slug: 'bedroom', label: 'Bedroom' },
  { id: 2, slug: 'kitchen', label: 'Kitchen' },
  { id: 3, slug: 'living-room', label: 'Living Room' },
  { id: 4, slug: 'outdoor', label: 'Outdoor' },
  { id: 5, slug: 'study-office-room', label: 'Study & Office Room' },
  { id: 6, slug: 'dining-room', label: 'Dining Room' },
  { id: 7, slug: 'laundry-room', label: 'Laundry Room' },
  { id: 8, slug: 'bathroom', label: 'Bathroom' },
]

const KEYWORD_RULES: Array<{ roomType: number; keywords: string[] }> = [
  { roomType: 1, keywords: ['bedroom', 'bed', 'mattress', 'pillow', 'dresser', 'night-table', 'wardrobe', 'cabinet'] },
  { roomType: 2, keywords: ['kitchen', 'rice-cooker', 'coffee-maker', 'oven', 'toaster', 'pressure-cooker', 'grill', 'kettle', 'pots', 'pans', 'utensil'] },
  { roomType: 3, keywords: ['living', 'sofa', 'leisure-chair', 'lounge-chair', 'ottoman', 'coffee-table', 'center-table', 'tv-rack', 'shelf'] },
  { roomType: 4, keywords: ['outdoor', 'garden', 'patio'] },
  { roomType: 5, keywords: ['study', 'office', 'desk', 'workstation', 'computer-table', 'office-chair'] },
  { roomType: 6, keywords: ['dining', 'dining-room', 'dining-table', 'dining-chair', 'buffet'] },
  { roomType: 7, keywords: ['laundry', 'laundry-room', 'washer', 'dryer', 'hamper'] },
  { roomType: 8, keywords: ['bathroom', 'bath', 'toilet', 'shower', 'sink', 'vanity'] },
]

const normalize = (value: string) => value.toLowerCase().trim()

export const getRoomOptionById = (roomType: number | null | undefined) =>
  ROOM_OPTIONS.find((option) => option.id === Number(roomType)) ?? null

export const getRoomOptionBySlug = (slug: string) =>
  ROOM_OPTIONS.find((option) => option.slug === normalize(slug)) ?? null

export const inferRoomTypeFromCategory = (category?: { name?: string | null; url?: string | null } | null) => {
  if (!category) return null

  const haystacks = [category.name ?? '', category.url ?? '']
    .map(normalize)
    .filter(Boolean)

  for (const rule of KEYWORD_RULES) {
    const matched = haystacks.some((haystack) => rule.keywords.some((keyword) => haystack.includes(keyword)))
    if (matched) return rule.roomType
  }

  return null
}
