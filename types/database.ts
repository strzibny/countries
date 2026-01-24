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
  created_at: string
  updated_at: string
}

export interface ListCountry {
  id: string
  list_id: string
  country_code: string
  country_name: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CountryListWithCountries extends CountryList {
  countries: ListCountry[]
}

export interface CountryListWithCount extends CountryList {
  country_count: number
}

// Types for unsaved local state (before user authenticates)
export interface UnsavedCountrySelection {
  country_code: string
  country_name: string
  notes: string
}

export interface UnsavedList {
  name: string
  description: string
  countries: UnsavedCountrySelection[]
}
