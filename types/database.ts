export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface CountryList {
  id: string
  user_id: string
  name: string
  description: string | null
  groups: CountryGroup[] | null
  created_at: string
  updated_at: string
}

export interface ListCountry {
  id: string
  list_id: string
  country_code: string
  country_name: string
  notes: string | null
  color: string | null
  created_at: string
  updated_at: string
}

export interface CountryListWithCountries extends CountryList {
  countries: ListCountry[]
}

export interface CountryListWithCount extends CountryList {
  country_count: number
}

// Predefined colors for groups
export const GROUP_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
] as const

export const DEFAULT_COLOR = '#3b82f6'

// Country group for organizing selections
export interface CountryGroup {
  id: string
  name: string
  color: string
}

// Types for unsaved local state (before user authenticates)
export interface UnsavedCountrySelection {
  country_code: string
  country_name: string
  notes: string
  color: string
  group_id: string | null
}

export interface UnsavedList {
  name: string
  description: string
  countries: UnsavedCountrySelection[]
}
