"use client"

import { useState, useEffect, useCallback } from 'react'
import { UnsavedCountrySelection, CountryGroup, DEFAULT_COLOR } from '@/types/database'

const STORAGE_KEY = 'unsaved_country_selections'
const GROUPS_STORAGE_KEY = 'unsaved_country_groups'

export function useUnsavedSelections() {
  const [selections, setSelections] = useState<UnsavedCountrySelection[]>([])
  const [groups, setGroups] = useState<CountryGroup[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedSelections = localStorage.getItem(STORAGE_KEY)
      if (storedSelections) {
        setSelections(JSON.parse(storedSelections))
      }
      const storedGroups = localStorage.getItem(GROUPS_STORAGE_KEY)
      if (storedGroups) {
        setGroups(JSON.parse(storedGroups))
      }
    } catch (error) {
      console.error('Error loading unsaved data:', error)
    }
    setIsHydrated(true)
  }, [])

  // Save selections to localStorage when they change
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

  // Save groups to localStorage when they change
  useEffect(() => {
    if (!isHydrated) return

    try {
      if (groups.length > 0) {
        localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups))
      } else {
        localStorage.removeItem(GROUPS_STORAGE_KEY)
      }
    } catch (error) {
      console.error('Error saving groups:', error)
    }
  }, [groups, isHydrated])

  // Group management
  const addGroup = useCallback((name: string, color: string) => {
    const newGroup: CountryGroup = {
      id: crypto.randomUUID(),
      name,
      color,
    }
    setGroups(prev => [...prev, newGroup])
    return newGroup
  }, [])

  const updateGroup = useCallback((groupId: string, name: string, color: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name, color } : g))
    // Update color for all countries in this group
    setSelections(prev => prev.map(c => c.group_id === groupId ? { ...c, color } : c))
  }, [])

  const removeGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId))
    // Remove all countries in this group
    setSelections(prev => prev.filter(c => c.group_id !== groupId))
  }, [])

  // Country management
  const addCountry = useCallback((countryCode: string, countryName: string, groupId: string | null = null) => {
    setSelections(prev => {
      if (prev.some(c => c.country_code === countryCode)) {
        return prev
      }
      const group = groupId ? groups.find(g => g.id === groupId) : null
      return [...prev, {
        country_code: countryCode,
        country_name: countryName,
        notes: '',
        color: group?.color || DEFAULT_COLOR,
        group_id: groupId,
      }]
    })
  }, [groups])

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

  const updateCountryGroup = useCallback((countryCode: string, groupId: string | null) => {
    setSelections(prev =>
      prev.map(c => {
        if (c.country_code === countryCode) {
          const group = groupId ? groups.find(g => g.id === groupId) : null
          return { ...c, group_id: groupId, color: group?.color || DEFAULT_COLOR }
        }
        return c
      })
    )
  }, [groups])

  const toggleCountry = useCallback((countryCode: string, countryName: string, groupId: string | null = null) => {
    setSelections(prev => {
      const exists = prev.some(c => c.country_code === countryCode)
      if (exists) {
        return prev.filter(c => c.country_code !== countryCode)
      }
      const group = groupId ? groups.find(g => g.id === groupId) : null
      return [...prev, {
        country_code: countryCode,
        country_name: countryName,
        notes: '',
        color: group?.color || DEFAULT_COLOR,
        group_id: groupId,
      }]
    })
  }, [groups])

  const clearSelections = useCallback(() => {
    setSelections([])
    setGroups([])
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(GROUPS_STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing unsaved data:', error)
    }
  }, [])

  const isSelected = useCallback((countryCode: string) => {
    return selections.some(c => c.country_code === countryCode)
  }, [selections])

  const getCountryGroup = useCallback((countryCode: string) => {
    const selection = selections.find(c => c.country_code === countryCode)
    if (!selection?.group_id) return null
    return groups.find(g => g.id === selection.group_id) || null
  }, [selections, groups])

  return {
    selections,
    groups,
    addGroup,
    updateGroup,
    removeGroup,
    addCountry,
    removeCountry,
    updateNotes,
    updateCountryGroup,
    toggleCountry,
    clearSelections,
    isSelected,
    getCountryGroup,
    isHydrated,
  }
}
