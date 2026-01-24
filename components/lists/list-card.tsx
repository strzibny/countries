"use client"

import Link from 'next/link'
import { Globe, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CountryListWithCount } from '@/types/database'

interface ListCardProps {
  list: CountryListWithCount
  onDelete?: (id: string) => void
}

export function ListCard({ list, onDelete }: ListCardProps) {
  const formattedDate = new Date(list.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
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

      {/* Actions dropdown */}
      <div className="absolute top-4 right-4">
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
  )
}
