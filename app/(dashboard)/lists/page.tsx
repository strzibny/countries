"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Loader2 } from 'lucide-react'
import { ListCard } from '@/components/lists/list-card'
import { CreateListDialog } from '@/components/lists/create-list-dialog'
import { useToast } from '@/hooks/use-toast'
import { CountryListWithCount } from '@/types/database'

export default function ListsPage() {
  const [lists, setLists] = useState<CountryListWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  const fetchLists = useCallback(async () => {
    try {
      const response = await fetch('/api/lists')
      if (response.ok) {
        const data = await response.json()
        setLists(data.lists || [])
      } else {
        throw new Error('Failed to fetch lists')
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
      toast({
        title: 'Error',
        description: 'Failed to load your lists',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  const handleCreateList = async (name: string, description: string) => {
    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })

    if (!response.ok) {
      throw new Error('Failed to create list')
    }

    const data = await response.json()
    toast({
      title: 'List created',
      description: `"${name}" has been created`,
    })

    // Navigate to home page where user can edit via "My lists"
    router.push('/')
  }

  const handleDeleteList = async (id: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return

    try {
      const response = await fetch(`/api/lists/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete list')
      }

      setLists(lists.filter(list => list.id !== id))
      toast({
        title: 'List deleted',
        description: 'The list has been deleted',
      })
    } catch (error) {
      console.error('Error deleting list:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete the list',
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Lists</h1>
          <p className="text-gray-500 mt-1">Create and manage your country lists</p>
        </div>
        <CreateListDialog onCreateList={handleCreateList} />
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No lists yet</h3>
          <p className="text-gray-500 mb-4">Create your first country list to get started</p>
          <CreateListDialog onCreateList={handleCreateList} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} onDelete={handleDeleteList} />
          ))}
        </div>
      )}
    </div>
  )
}
