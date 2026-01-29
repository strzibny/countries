"use client"

import { useState, useMemo } from 'react'
import { X, Plus, Check, Pencil, Trash2, MessageSquare, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { ALL_COUNTRIES } from '@/lib/countries'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UnsavedCountrySelection, CountryGroup, GROUP_COLORS } from '@/types/database'

interface CountryPanelProps {
  selections: UnsavedCountrySelection[]
  groups: CountryGroup[]
  onRemove: (countryCode: string) => void
  onUpdateNotes: (countryCode: string, notes: string) => void
  onUpdateCountryGroup: (countryCode: string, groupId: string | null) => void
  onAddGroup: (name: string, color: string) => CountryGroup
  onUpdateGroup: (groupId: string, name: string, color: string) => void
  onRemoveGroup: (groupId: string) => void
  onAddCountry?: (countryCode: string, countryName: string) => void
  onSave?: () => void
  showSaveButton?: boolean
  isSaving?: boolean
  className?: string
}

export function CountryPanel({
  selections,
  groups,
  onRemove,
  onUpdateNotes,
  onUpdateCountryGroup,
  onAddGroup,
  onUpdateGroup,
  onRemoveGroup,
  onAddCountry,
  onSave,
  showSaveButton = true,
  isSaving = false,
  className = '',
}: CountryPanelProps) {
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupColor, setNewGroupColor] = useState<string>(GROUP_COLORS[0].value)
  const [showAddCountry, setShowAddCountry] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')

  // Filter countries that aren't already selected
  const availableCountries = useMemo(() => {
    const selectedCodes = new Set(selections.map(s => s.country_code))
    return ALL_COUNTRIES
      .filter(c => !selectedCodes.has(c.code))
      .filter(c =>
        countrySearch.length === 0 ||
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
      .slice(0, 20) // Limit results for performance
  }, [selections, countrySearch])
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editGroupName, setEditGroupName] = useState('')
  const [editGroupColor, setEditGroupColor] = useState('')

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      onAddGroup(newGroupName.trim(), newGroupColor)
      setNewGroupName('')
      setNewGroupColor(GROUP_COLORS[0].value)
      setShowAddGroup(false)
    }
  }

  const startEditGroup = (group: CountryGroup) => {
    setEditingGroupId(group.id)
    setEditGroupName(group.name)
    setEditGroupColor(group.color)
  }

  const saveEditGroup = () => {
    if (editingGroupId && editGroupName.trim()) {
      onUpdateGroup(editingGroupId, editGroupName.trim(), editGroupColor)
      setEditingGroupId(null)
    }
  }

  // Group countries by their group_id
  const ungroupedCountries = selections.filter(s => !s.group_id)
  const groupedCountries = groups.map(group => ({
    group,
    countries: selections.filter(s => s.group_id === group.id)
  }))

  if (selections.length === 0 && groups.length === 0) {
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
          Selected ({selections.length})
        </h3>
        {onAddCountry && (
          <DropdownMenu open={showAddCountry} onOpenChange={setShowAddCountry}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <Search className="h-3 w-3 mr-1" />
                Add country
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2" align="end">
              <Input
                placeholder="Search countries..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="h-8 text-sm mb-2"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto">
                {countrySearch.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">
                    Type to search countries...
                  </p>
                ) : availableCountries.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">
                    No matches found
                  </p>
                ) : (
                  availableCountries.map((country) => (
                    <button
                      key={country.code}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-100 rounded"
                      onClick={() => {
                        onAddCountry(country.code, country.name)
                        setShowAddCountry(false)
                        setCountrySearch('')
                      }}
                    >
                      <span>{getFlagEmoji(country.code)}</span>
                      <span>{country.name}</span>
                      <span className="text-gray-400 text-xs ml-auto">{country.code}</span>
                    </button>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Groups Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Groups</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowAddGroup(!showAddGroup)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Group
              </Button>
            </div>

            {/* Add Group Form */}
            {showAddGroup && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg space-y-2">
                <Input
                  placeholder="Group name..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                />
                <div className="flex gap-1">
                  {GROUP_COLORS.map((c) => (
                    <button
                      key={c.value}
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c.value,
                        borderColor: newGroupColor === c.value ? 'white' : 'transparent',
                        boxShadow: newGroupColor === c.value ? `0 0 0 2px ${c.value}` : 'none',
                      }}
                      onClick={() => setNewGroupColor(c.value)}
                      title={c.name}
                    >
                      {newGroupColor === c.value && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs flex-1" onClick={handleAddGroup}>
                    Create
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowAddGroup(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Group List */}
            {groups.length === 0 && !showAddGroup && (
              <p className="text-xs text-gray-400 mb-3">No groups yet. Countries will be blue by default.</p>
            )}

            {groupedCountries.map(({ group, countries }) => (
              <div key={group.id} className="mb-3">
                {editingGroupId === group.id ? (
                  <div className="p-2 bg-gray-50 rounded-lg space-y-2 mb-2">
                    <Input
                      value={editGroupName}
                      onChange={(e) => setEditGroupName(e.target.value)}
                      className="h-7 text-sm"
                    />
                    <div className="flex gap-1">
                      {GROUP_COLORS.map((c) => (
                        <button
                          key={c.value}
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                          style={{
                            backgroundColor: c.value,
                            borderColor: editGroupColor === c.value ? 'white' : 'transparent',
                            boxShadow: editGroupColor === c.value ? `0 0 0 2px ${c.value}` : 'none',
                          }}
                          onClick={() => setEditGroupColor(c.value)}
                        >
                          {editGroupColor === c.value && <Check className="h-2 w-2 text-white" />}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-6 text-xs flex-1" onClick={saveEditGroup}>Save</Button>
                      <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setEditingGroupId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group"
                    style={{ borderLeft: `4px solid ${group.color}` }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="text-sm font-medium flex-1">{group.name}</span>
                    <span className="text-xs text-gray-400">{countries.length}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => startEditGroup(group)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500"
                      onClick={() => onRemoveGroup(group.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Countries in this group */}
                {countries.map((country) => (
                  <CountryItem
                    key={country.country_code}
                    country={country}
                    groups={groups}
                    onRemove={onRemove}
                    onUpdateNotes={onUpdateNotes}
                    onUpdateCountryGroup={onUpdateCountryGroup}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Ungrouped Countries */}
          {ungroupedCountries.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {groups.length > 0 ? 'Ungrouped' : 'Countries'}
              </h4>
              {ungroupedCountries.map((country) => (
                <CountryItem
                  key={country.country_code}
                  country={country}
                  groups={groups}
                  onRemove={onRemove}
                  onUpdateNotes={onUpdateNotes}
                  onUpdateCountryGroup={onUpdateCountryGroup}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {showSaveButton && onSave && (
        <div className="p-4 border-t border-gray-200">
          <Button
            className="w-full"
            onClick={onSave}
            disabled={isSaving || selections.length === 0}
          >
            {isSaving ? 'Saving...' : 'Save list'}
          </Button>
        </div>
      )}
    </div>
  )
}

interface CountryItemProps {
  country: UnsavedCountrySelection
  groups: CountryGroup[]
  onRemove: (countryCode: string) => void
  onUpdateNotes: (countryCode: string, notes: string) => void
  onUpdateCountryGroup: (countryCode: string, groupId: string | null) => void
}

function CountryItem({ country, groups, onRemove, onUpdateNotes, onUpdateCountryGroup }: CountryItemProps) {
  const [showGroupSelect, setShowGroupSelect] = useState(false)
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [notesValue, setNotesValue] = useState(country.notes)

  const handleSaveNotes = () => {
    onUpdateNotes(country.country_code, notesValue)
    setShowNotesDialog(false)
  }

  return (
    <div
      className="bg-gray-50 rounded-lg p-3 ml-2 mb-2"
      style={{ borderLeft: `4px solid ${country.color}` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getFlagEmoji(country.country_code)}</span>
          <span className="font-medium text-gray-900 text-sm">{country.country_name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${country.notes ? 'text-amber-500' : 'text-gray-400'}`}
            onClick={() => { setNotesValue(country.notes); setShowNotesDialog(true) }}
            title="Edit notes"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          {groups.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400"
              onClick={() => setShowGroupSelect(!showGroupSelect)}
              title="Change group"
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: country.color }}
              />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-red-500"
            onClick={() => onRemove(country.country_code)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notes preview */}
      {country.notes && (
        <p className="text-xs text-gray-500 mt-1 truncate">{country.notes}</p>
      )}

      {/* Group selector */}
      {showGroupSelect && groups.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          <button
            className={`px-2 py-1 text-xs rounded border ${!country.group_id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            onClick={() => { onUpdateCountryGroup(country.country_code, null); setShowGroupSelect(false) }}
          >
            None
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              className={`px-2 py-1 text-xs rounded border flex items-center gap-1 ${country.group_id === g.id ? 'border-gray-800 bg-gray-100' : 'border-gray-200'}`}
              onClick={() => { onUpdateCountryGroup(country.country_code, g.id); setShowGroupSelect(false) }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Notes dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{getFlagEmoji(country.country_code)}</span>
              {country.country_name}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Add notes about this country..."
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            className="min-h-[120px] text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>
              Save notes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
