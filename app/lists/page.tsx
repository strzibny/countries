"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Globe, Search, Info, MapPin, List, LogOut, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { useToast } from '@/hooks/use-toast'
import { CountryListWithCount } from '@/types/database'

export default function ListsPage() {
  const { profile, signOut } = useAuth()
  const { toast } = useToast()
  const [lists, setLists] = useState<CountryListWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAboutDialog, setShowAboutDialog] = useState(false)

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const fetchLists = useCallback(async () => {
    try {
      const response = await fetch('/api/lists')
      if (response.ok) {
        const data = await response.json()
        setLists(data.lists || [])
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  const filteredLists = searchQuery
    ? lists.filter(list =>
        list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        list.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : lists

  const handleDeleteList = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this list?')) return

    try {
      const response = await fetch(`/api/lists/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete list')
      setLists(lists.filter(list => list.id !== id))
      toast({ title: 'List deleted', description: 'The list has been deleted' })
    } catch (error) {
      console.error('Error deleting list:', error)
      toast({ title: 'Error', description: 'Failed to delete the list', variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header>
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
            <Link href="/lists">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-gray-900 border-white/40">
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
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">My lists</h1>
          <p className="text-white/60 max-w-lg mx-auto">
            Create and manage your country lists. Click any list to view it on the interactive globe.
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
        ) : filteredLists.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery ? 'No lists found' : 'No lists yet'}
            </h3>
            <p className="text-white/60 mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first country list to get started'}
            </p>
            {!searchQuery && (
              <Link href="/">
                <Button>Create a list</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLists.map((list) => (
              <Link
                key={list.id}
                href={`/?list=${list.id}`}
                className="group block rounded-lg border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors relative"
              >
                <h3 className="font-semibold text-white truncate pr-8">{list.name}</h3>
                {list.description && (
                  <p className="text-sm text-white/60 mt-1 line-clamp-2">{list.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3 text-xs text-white/40">
                  <span>{list.country_count} {list.country_count === 1 ? 'country' : 'countries'}</span>
                  <span>Updated {new Date(list.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <button
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400"
                  onClick={(e) => handleDeleteList(list.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
