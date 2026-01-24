"use client"

import { useState, useEffect, useCallback } from 'react'
import { UnsavedCountrySelection } from '@/types/database'

const STORAGE_KEY = 'unsaved_country_selections'

export function useUnsavedSelections() {
  const [selections, setSelections] = useState<UnsavedCountrySelection[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setSelections(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading unsaved selections:', error)
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage when selections change
  useEffect(() => {
    if (!isHydrated) return

    try {
      if (selections.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selections))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (error) {
      console.error('Error saving unsaved selections:', error)
    }
  }, [selections, isHydrated])

  const addCountry = useCallback((countryCode: string, countryName: string) => {
    setSelections(prev => {
      if (prev.some(c => c.country_code === countryCode)) {
        return prev
      }
      return [...prev, { country_code: countryCode, country_name: countryName, notes: '' }]
    })
  }, [])

  const removeCountry = useCallback((countryCode: string) => {
    setSelections(prev => prev.filter(c => c.country_code !== countryCode))
  }, [])

  const updateNotes = useCallback((countryCode: string, notes: string) => {
    setSelections(prev =>
      prev.map(c =>
        c.country_code === countryCode ? { ...c, notes } : c
      )
    )
  }, [])

  const toggleCountry = useCallback((countryCode: string, countryName: string) => {
    setSelections(prev => {
      const exists = prev.some(c => c.country_code === countryCode)
      if (exists) {
        return prev.filter(c => c.country_code !== countryCode)
      }
      return [...prev, { country_code: countryCode, country_name: countryName, notes: '' }]
    })
  }, [])

  const clearSelections = useCallback(() => {
    setSelections([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing unsaved selections:', error)
    }
  }, [])

  const isSelected = useCallback((countryCode: string) => {
    return selections.some(c => c.country_code === countryCode)
  }, [selections])

  return {
    selections,
    addCountry,
    removeCountry,
    updateNotes,
    toggleCountry,
    clearSelections,
    isSelected,
    isHydrated,
  }
}
