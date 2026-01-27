"use client"

import { useEffect, useState, useCallback, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlobeViewer } from '@/components/globe/globe-viewer'
import { CountryPanel } from '@/components/globe/country-panel'
import { useToast } from '@/hooks/use-toast'
import { CountryListWithCountries, UnsavedCountrySelection, DEFAULT_COLOR } from '@/types/database'

export default function EditListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [list, setList] = useState<CountryListWithCountries | null>(null)
  const [selections, setSelections] = useState<UnsavedCountrySelection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const fetchList = useCallback(async () => {
    try {
      const response = await fetch(`/api/lists/${id}`)
      if (response.ok) {
        const data = await response.json()
        setList(data.list)
        // Initialize selections from existing countries
        setSelections(
          data.list.countries.map((c: { country_code: string; country_name: string; notes: string | null; color: string | null }) => ({
            country_code: c.country_code,
            country_name: c.country_name,
            notes: c.notes || '',
            color: c.color || DEFAULT_COLOR,
            group_id: null,
          }))
        )
      } else if (response.status === 404) {
        router.push('/lists')
      } else {
        throw new Error('Failed to fetch list')
      }
    } catch (error) {
      console.error('Error fetching list:', error)
      toast({
        title: 'Error',
        description: 'Failed to load the list',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [id, router, toast])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleCountryClick = useCallback((countryCode: string, countryName: string) => {
    setSelections(prev => {
      const exists = prev.some(c => c.country_code === countryCode)
      if (exists) {
        return prev.filter(c => c.country_code !== countryCode)
      }
      return [...prev, { country_code: countryCode, country_name: countryName, notes: '', color: DEFAULT_COLOR, group_id: null }]
    })
    setHasChanges(true)
  }, [])

  const handleRemoveCountry = useCallback((countryCode: string) => {
    setSelections(prev => prev.filter(c => c.country_code !== countryCode))
    setHasChanges(true)
  }, [])

  const handleUpdateNotes = useCallback((countryCode: string, notes: string) => {
    setSelections(prev =>
      prev.map(c => c.country_code === countryCode ? { ...c, notes } : c)
    )
    setHasChanges(true)
  }, [])

  const handleSave = async () => {
    if (!list) return
    setIsSaving(true)

    try {
      // Get current countries from DB
      const currentCodes = new Set(list.countries.map(c => c.country_code))
      const newCodes = new Set(selections.map(c => c.country_code))

      // Countries to add (in selections but not in current)
      const toAdd = selections.filter(s => !currentCodes.has(s.country_code))

      // Countries to remove (in current but not in selections)
      const toRemove = list.countries.filter(c => !newCodes.has(c.country_code))

      // Countries to potentially update notes
      const toUpdate = selections.filter(s => {
        const existing = list.countries.find(c => c.country_code === s.country_code)
        return existing && existing.notes !== s.notes
      })

      // Execute all operations
      const operations: Promise<Response>[] = []

      // Add new countries
      for (const country of toAdd) {
        operations.push(
          fetch(`/api/lists/${id}/countries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(country),
          })
        )
      }

      // Remove deleted countries
      for (const country of toRemove) {
        operations.push(
          fetch(`/api/lists/${id}/countries/${country.id}`, {
            method: 'DELETE',
          })
        )
      }

      // Update notes
      for (const country of toUpdate) {
        const existing = list.countries.find(c => c.country_code === country.country_code)
        if (existing) {
          operations.push(
            fetch(`/api/lists/${id}/countries/${existing.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notes: country.notes }),
            })
          )
        }
      }

      await Promise.all(operations)

      toast({
        title: 'Changes saved',
        description: 'Your list has been updated',
      })

      setHasChanges(false)
      router.push(`/lists/${id}`)
    } catch (error) {
      console.error('Error saving changes:', error)
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!list) {
    return null
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <Link href={`/lists/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{list.name}</h1>
            <p className="text-sm text-gray-500">
              {selections.length} {selections.length === 1 ? 'country' : 'countries'} selected
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Globe */}
        <div className="flex-1 bg-gray-900">
          <GlobeViewer
            selectedCountries={selections.map(s => s.country_code)}
            onCountryClick={handleCountryClick}
            className="h-full"
          />
        </div>

        {/* Country panel */}
        <div className="w-80 border-l border-gray-200 bg-white overflow-hidden">
          <CountryPanel
            selections={selections}
            onRemove={handleRemoveCountry}
            onUpdateNotes={handleUpdateNotes}
            showSaveButton={false}
          />
        </div>
      </div>
    </div>
  )
}
