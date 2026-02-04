"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Globe, MoreVertical, Pencil, Trash2, Share2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { CountryListWithCount } from '@/types/database'

interface ListCardProps {
  list: CountryListWithCount
  onDelete?: (id: string) => void
}

export function ListCard({ list: initialList, onDelete }: ListCardProps) {
  const [list, setList] = useState(initialList)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const { toast } = useToast()

  const formattedDate = new Date(list.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <>
      <Card className="group relative hover:shadow-md transition-shadow">
        <Link href={`/lists/${list.id}`}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{list.name}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {list.country_count} {list.country_count === 1 ? 'country' : 'countries'}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {list.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{list.description}</p>
            )}
            <p className="text-xs text-gray-400">Updated {formattedDate}</p>
          </CardContent>
        </Link>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault()
              setShowShareDialog(true)
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/lists/${list.id}/edit`} className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit on Globe
                </Link>
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={(e) => {
                    e.preventDefault()
                    onDelete(list.id)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share list</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`public-${list.id}`} className="cursor-pointer flex-1">
                <div>
                  <span className="text-sm font-medium text-gray-900">Public</span>
                  <p className="text-xs text-gray-500 font-normal">Anyone with the link can view</p>
                </div>
              </Label>
              <Switch
                id={`public-${list.id}`}
                checked={list.is_public}
                onCheckedChange={async (checked) => {
                  const updates: { is_public: boolean; is_discoverable?: boolean } = { is_public: checked }
                  if (!checked) updates.is_discoverable = false
                  try {
                    const response = await fetch(`/api/lists/${list.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(updates),
                    })
                    if (!response.ok) throw new Error()
                    const data = await response.json()
                    setList(prev => ({ ...prev, is_public: data.list.is_public, is_discoverable: data.list.is_discoverable }))
                  } catch {
                    toast({ title: 'Error', description: 'Failed to update visibility', variant: 'destructive' })
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`discoverable-${list.id}`} className="cursor-pointer flex-1">
                <div>
                  <span className="text-sm font-medium text-gray-900">Discoverable</span>
                  <p className="text-xs text-gray-500 font-normal">Appears on the public browse page</p>
                </div>
              </Label>
              <Switch
                id={`discoverable-${list.id}`}
                checked={list.is_discoverable}
                disabled={!list.is_public}
                onCheckedChange={async (checked) => {
                  try {
                    const response = await fetch(`/api/lists/${list.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ is_discoverable: checked }),
                    })
                    if (!response.ok) throw new Error()
                    const data = await response.json()
                    setList(prev => ({ ...prev, is_discoverable: data.list.is_discoverable }))
                  } catch {
                    toast({ title: 'Error', description: 'Failed to update visibility', variant: 'destructive' })
                  }
                }}
              />
            </div>
            {list.is_public && (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1.5">Public link</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/public/${list.id}` : `/public/${list.id}`}
                    className="text-xs bg-white border border-gray-200 rounded px-2 py-1.5 flex-1 min-w-0 overflow-hidden text-ellipsis outline-none"
                    onFocus={(e) => e.target.select()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/public/${list.id}`)
                      toast({ title: 'Link copied' })
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
