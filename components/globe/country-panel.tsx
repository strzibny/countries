"use client"

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UnsavedCountrySelection } from '@/types/database'

interface CountryPanelProps {
  selections: UnsavedCountrySelection[]
  onRemove: (countryCode: string) => void
  onUpdateNotes: (countryCode: string, notes: string) => void
  onSave?: () => void
  showSaveButton?: boolean
  isSaving?: boolean
  className?: string
}

export function CountryPanel({
  selections,
  onRemove,
  onUpdateNotes,
  onSave,
  showSaveButton = true,
  isSaving = false,
  className = '',
}: CountryPanelProps) {
  if (selections.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">Click on countries to select them</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">
          Selected Countries ({selections.length})
        </h3>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {selections.map((country) => (
            <div
              key={country.country_code}
              className="bg-gray-50 rounded-lg p-3 relative"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getFlagEmoji(country.country_code)}</span>
                  <span className="font-medium text-gray-900">{country.country_name}</span>
                  <span className="text-xs text-gray-400">{country.country_code}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-400 hover:text-red-500"
                  onClick={() => onRemove(country.country_code)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                placeholder="Add notes about this country..."
                value={country.notes}
                onChange={(e) => onUpdateNotes(country.country_code, e.target.value)}
                className="min-h-[60px] text-sm resize-none"
              />
            </div>
          ))}
        </div>
      </ScrollArea>

      {showSaveButton && onSave && (
        <div className="p-4 border-t border-gray-200">
          <Button
            className="w-full"
            onClick={onSave}
            disabled={isSaving || selections.length === 0}
          >
            {isSaving ? 'Saving...' : 'Save List'}
          </Button>
        </div>
      )}
    </div>
  )
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍'
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}
