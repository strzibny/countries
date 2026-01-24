"use client"

import { useEffect, useState, useCallback, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Globe, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { CountryListWithCountries, ListCountry } from '@/types/database'

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return ''
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export default function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [list, setList] = useState<CountryListWithCountries | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const fetchList = useCallback(async () => {
    try {
      const response = await fetch(`/api/lists/${id}`)
      if (response.ok) {
        const data = await response.json()
        setList(data.list)
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

  const handleUpdateNotes = async (country: ListCountry, notes: string) => {
    try {
      const response = await fetch(`/api/lists/${id}/countries/${country.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) throw new Error('Failed to update notes')

      setList(prev => prev ? {
        ...prev,
        countries: prev.countries.map(c =>
          c.id === country.id ? { ...c, notes } : c
        ),
      } : null)

      setEditingNotes(null)
    } catch (error) {
      console.error('Error updating notes:', error)
      toast({
        title: 'Error',
        description: 'Failed to update notes',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveCountry = async (countryId: string) => {
    if (!confirm('Remove this country from the list?')) return

    try {
      const response = await fetch(`/api/lists/${id}/countries/${countryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to remove country')

      setList(prev => prev ? {
        ...prev,
        countries: prev.countries.filter(c => c.id !== countryId),
      } : null)

      toast({
        title: 'Country removed',
        description: 'The country has been removed from your list',
      })
    } catch (error) {
      console.error('Error removing country:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove country',
        variant: 'destructive',
      })
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/lists">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{list.name}</h1>
            {list.description && (
              <p className="text-gray-500 mt-1">{list.description}</p>
            )}
            <p className="text-sm text-gray-400 mt-2">
              {list.countries.length} {list.countries.length === 1 ? 'country' : 'countries'}
            </p>
          </div>
        </div>
        <Link href={`/lists/${id}/edit`}>
          <Button>
            <Pencil className="h-4 w-4 mr-2" />
            Edit on Globe
          </Button>
        </Link>
      </div>

      {/* Countries */}
      {list.countries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No countries yet</h3>
          <p className="text-gray-500 mb-4">Add countries to this list using the globe editor</p>
          <Link href={`/lists/${id}/edit`}>
            <Button>
              <Pencil className="h-4 w-4 mr-2" />
              Edit on Globe
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.countries.map((country) => (
            <Card key={country.id} className="relative group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFlagEmoji(country.country_code)}</span>
                    <div>
                      <CardTitle className="text-base">{country.country_name}</CardTitle>
                      <p className="text-xs text-gray-400">{country.country_code}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                    onClick={() => handleRemoveCountry(country.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editingNotes === country.id ? (
                  <div className="space-y-2">
                    <Textarea
                      defaultValue={country.notes || ''}
                      placeholder="Add notes..."
                      className="min-h-[80px] text-sm"
                      autoFocus
                      onBlur={(e) => handleUpdateNotes(country, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingNotes(null)
                        if (e.key === 'Enter' && e.metaKey) {
                          handleUpdateNotes(country, e.currentTarget.value)
                        }
                      }}
                    />
                    <p className="text-xs text-gray-400">Press Cmd+Enter to save, Escape to cancel</p>
                  </div>
                ) : (
                  <div
                    className="min-h-[40px] text-sm text-gray-600 cursor-pointer hover:bg-gray-50 rounded p-2 -m-2"
                    onClick={() => setEditingNotes(country.id)}
                  >
                    {country.notes || (
                      <span className="text-gray-400 italic">Click to add notes...</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
