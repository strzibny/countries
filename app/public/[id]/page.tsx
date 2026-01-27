"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { GlobeViewer } from '@/components/globe/globe-viewer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Globe, ChevronRight, X, User } from 'lucide-react'
import Link from 'next/link'

interface ListCountry {
  id: string
  country_code: string
  country_name: string
  notes: string | null
  color: string | null
}

interface SharedList {
  id: string
  name: string
  description: string | null
  created_at: string
  countries: ListCountry[]
  owner_name: string
}

export default function PublicListPage() {
  const params = useParams()
  const listId = params.id as string

  const [list, setList] = useState<SharedList | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => {
    async function fetchList() {
      try {
        const response = await fetch(`/api/lists/${listId}/public`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('List not found')
          } else {
            setError('Failed to load list')
          }
          return
        }
        const data = await response.json()
        setList(data.list)
      } catch (err) {
        console.error('Error fetching list:', err)
        setError('Failed to load list')
      } finally {
        setIsLoading(false)
      }
    }

    if (listId) {
      fetchList()
    }
  }, [listId])

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <h1 className="text-2xl font-bold mb-4">{error || 'List not found'}</h1>
        <Link href="/">
          <Button>Go to Home</Button>
        </Link>
      </div>
    )
  }

  const selectedCountries = list.countries.map(c => c.country_code)
  const countryColors = list.countries.reduce((acc, c) => {
    acc[c.country_code] = c.color || '#3b82f6'
    return acc
  }, {} as Record<string, string>)

  // Group countries by color for display
  const countriesByColor = list.countries.reduce((acc, c) => {
    const color = c.color || '#3b82f6'
    if (!acc[color]) acc[color] = []
    acc[color].push(c)
    return acc
  }, {} as Record<string, ListCountry[]>)

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-gray-900/80 to-transparent">
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Globe className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-white">MyCountryList</span>
              <a
                href="https://x.com/strzibnyj"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-white/60 hover:text-white/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Made by Josef
              </a>
            </div>
          </Link>
          <Link href="/">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-gray-900">
              Make your own
            </Button>
          </Link>
        </div>
      </header>

      {/* Globe */}
      <div className="h-full w-full relative">
        <GlobeViewer
          selectedCountries={selectedCountries}
          countryColors={countryColors}
          onCountryClick={() => {}} // Read-only
          className="absolute inset-0"
        />

        {/* List info card */}
        {!showPanel && (
          <button
            onClick={() => setShowPanel(true)}
            className="absolute bottom-6 right-6 z-10 bg-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 hover:shadow-xl transition-shadow max-w-xs"
          >
            <div className="text-left flex-1">
              <p className="font-medium text-gray-900 truncate">{list.name}</p>
              <p className="text-xs text-gray-500">
                {list.countries.length} {list.countries.length === 1 ? 'country' : 'countries'} • by {list.owner_name}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
          </button>
        )}

        {/* Side panel */}
        {showPanel && (
          <div className="absolute top-16 right-0 w-80 z-10 bg-white shadow-xl flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{list.name}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  <span>{list.owner_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => setShowPanel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {list.description && (
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm text-gray-600">{list.description}</p>
              </div>
            )}

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {Object.entries(countriesByColor).map(([color, countries]) => (
                  <div key={color}>
                    <div className="flex items-center gap-2 mb-2" style={{ borderLeft: `4px solid ${color}`, paddingLeft: '8px' }}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm font-medium text-gray-700">{countries.length} countries</span>
                    </div>
                    {countries.map((country) => (
                      <div
                        key={country.country_code}
                        className="bg-gray-50 rounded-lg p-3 ml-3 mb-2"
                        style={{ borderLeft: `4px solid ${color}` }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getFlagEmoji(country.country_code)}</span>
                          <span className="font-medium text-gray-900 text-sm">{country.country_name}</span>
                        </div>
                        {country.notes && (
                          <p className="text-sm text-gray-600 mt-1">{country.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {list.countries.length === 0 && (
                  <p className="text-center text-gray-500 text-sm">No countries in this list</p>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-gray-200">
              <Link href="/" className="block">
                <Button className="w-full">Make your own</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return ''
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}
