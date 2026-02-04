"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Globe, Search, Info, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PublicList {
  id: string
  name: string
  description: string | null
  updated_at: string
  country_count: number
  owner_name: string
}

export default function PublicIndexPage() {
  const [lists, setLists] = useState<PublicList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAboutDialog, setShowAboutDialog] = useState(false)

  const fetchLists = useCallback(async (query: string) => {
    try {
      const params = query ? `?q=${encodeURIComponent(query)}` : ''
      const response = await fetch(`/api/lists/public${params}`)
      if (response.ok) {
        const data = await response.json()
        setLists(data.lists)
      }
    } catch (error) {
      console.error('Error fetching public lists:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLists('')
  }, [fetchLists])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true)
      fetchLists(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, fetchLists])

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Globe className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <span className="text-lg font-semibold text-white">
                MyCountryList
              </span>
              <a
                href="https://x.com/strzibnyj"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-white/60 hover:text-white/80 transition-colors"
              >
                Made by Josef
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-gray-900"
              onClick={() => setShowAboutDialog(true)}
            >
              <Info className="h-4 w-4 mr-2" />
              About
            </Button>
            <Link href="/">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-gray-900">
                Make your own
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">Explore Country Lists</h1>
          <p className="text-white/60 max-w-lg mx-auto">
            Browse country lists shared by the community. Click any list to view it on the interactive globe.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search lists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-blue-500"
          />
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="text-white/60">Loading...</div>
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery ? 'No lists found' : 'No public lists yet'}
            </h3>
            <p className="text-white/60 mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Be the first to share a country list with the community'}
            </p>
            {!searchQuery && (
              <Link href="/">
                <Button>Create a list</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <Link
                key={list.id}
                href={`/public/${list.id}`}
                className="block rounded-lg border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors"
              >
                <h3 className="font-semibold text-white truncate">{list.name}</h3>
                {list.description && (
                  <p className="text-sm text-white/60 mt-1 line-clamp-2">{list.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3 text-xs text-white/40">
                  <span>{list.country_count} {list.country_count === 1 ? 'country' : 'countries'}</span>
                  <span>by {list.owner_name}</span>
                </div>
              </Link>
            ))}
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
