"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { GlobeViewer } from '@/components/globe/globe-viewer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CountryGroup } from '@/types/database'
import { Globe, ChevronRight, X, User, Info, List, LogOut } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'

interface ListCountry {
  id: string
  country_code: string
  country_name: string
  notes: string | null
  color: string | null
  group_id: string | null
}

interface SharedList {
  id: string
  name: string
  description: string | null
  groups: CountryGroup[] | null
  created_at: string
  countries: ListCountry[]
  owner_name: string
}

export default function PublicListPage() {
  const params = useParams()
  const listId = params.id as string
  const { user, profile, signOut } = useAuth()

  const [list, setList] = useState<SharedList | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPanel, setShowPanel] = useState(false)
  const [showAboutDialog, setShowAboutDialog] = useState(false)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

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

  const filteredCountries = activeGroup
    ? list.countries.filter(c => c.group_id === activeGroup)
    : list.countries

  const selectedCountries = filteredCountries.map(c => c.country_code)
  const countryColors = filteredCountries.reduce((acc, c) => {
    acc[c.country_code] = c.color || '#3b82f6'
    return acc
  }, {} as Record<string, string>)

  const hasGroups = list.groups && list.groups.length > 1

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
          <div className="pt-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Globe className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">
                MyCountryList
              </span>
            </Link>
            <a
              href="https://x.com/strzibnyj"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/60 hover:text-white/80 transition-colors"
            >
              by Josef
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-gray-900"
              onClick={() => setShowAboutDialog(true)}
            >
              <Info className="h-4 w-4 mr-1" />
              About
            </Button>
            <Link href="/public">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-gray-900">
                <List className="h-4 w-4 mr-1" />
                Public lists
              </Button>
            </Link>
            {user ? (
              <>
                <Link href="/lists">
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-gray-900">
                    <Globe className="h-4 w-4 mr-1" />
                    My lists
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                        <AvatarFallback className="bg-white/20 text-white">
                          {getInitials(profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                        <p className="text-xs leading-none text-gray-500">{profile?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:text-red-600"
                      onClick={() => signOut()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-gray-900">
                  Make your own
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Globe */}
      <div className="h-full w-full relative">
        <GlobeViewer
          selectedCountries={selectedCountries}
          countryColors={countryColors}
          onCountryClick={() => {}}
          readOnly
          className="absolute inset-0"
        />

        {/* Group filter buttons */}
        {hasGroups && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2 max-h-[60vh] overflow-y-auto rounded-lg">
            <button
              onClick={() => setActiveGroup(null)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeGroup === null
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              All
            </button>
            {list.groups!.map((group) => (
              <button
                key={group.id}
                onClick={() => setActiveGroup(group.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeGroup === group.id
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                {group.name}
              </button>
            ))}
          </div>
        )}

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

      {/* About Dialog */}
      <Dialog open={showAboutDialog} onOpenChange={setShowAboutDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Globe className="h-4 w-4 text-white" />
              </div>
              MyCountryList
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              Build your personal country lists on an interactive 3D globe. It&apos;s free.
            </p>
            <div className="space-y-2">
              <p><strong className="text-gray-900">Features:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Click countries on the globe to add them to your list</li>
                <li>Create custom groups with different colors to organize countries</li>
                <li>Add personal notes to each country</li>
                <li>Save multiple lists and share them with friends</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p><strong className="text-gray-900">Ideas for lists:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Countries you&apos;ve visited</li>
                <li>Travel bucket list destinations</li>
                <li>Places you&apos;ve lived or worked</li>
                <li>Countries with friends or family</li>
              </ul>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <a
                href="https://x.com/strzibnyj"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Made by Josef
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
