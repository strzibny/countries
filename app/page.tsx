"use client"

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GlobeViewer } from '@/components/globe/globe-viewer'
import { CountryPanel } from '@/components/globe/country-panel'
import { SavePromptDialog } from '@/components/globe/save-prompt-dialog'
import { AuthDialog } from '@/components/auth/auth-dialog'
import { useUnsavedSelections } from '@/hooks/use-unsaved-selections'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Globe, ChevronRight, X, LogOut, List, Plus, Trash2, ChevronLeft, Check, Pencil, Share2, MessageSquare, FileText, Search, Info } from 'lucide-react'
import { CountryListWithCount, CountryListWithCountries, UnsavedCountrySelection, CountryGroup, DEFAULT_COLOR, GROUP_COLORS } from '@/types/database'
import { ALL_COUNTRIES } from '@/lib/countries'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type PanelView = 'none' | 'selection' | 'lists' | 'list-detail'

export default function Home() {
  const {
    selections,
    groups,
    addGroup,
    updateGroup,
    removeGroup,
    addCountry,
    toggleCountry,
    removeCountry,
    updateNotes,
    updateCountryGroup,
    clearSelections,
    isSelected,
    isHydrated,
  } = useUnsavedSelections()

  const { user, profile, signOut, isLoading: isAuthLoading } = useAuth()
  const { toast } = useToast()

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [panelView, setPanelView] = useState<PanelView>('none')
  const [pendingSave, setPendingSave] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [showAboutDialog, setShowAboutDialog] = useState(false)

  // Lists state
  const [lists, setLists] = useState<CountryListWithCount[]>([])
  const [selectedList, setSelectedList] = useState<CountryListWithCountries | null>(null)
  const [isLoadingLists, setIsLoadingLists] = useState(false)
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [editSelections, setEditSelections] = useState<UnsavedCountrySelection[]>([])
  const [editGroups, setEditGroups] = useState<CountryGroup[]>([])
  const [isSavingChanges, setIsSavingChanges] = useState(false)

  // Group selector popup state
  const [pendingCountry, setPendingCountry] = useState<{ code: string; name: string } | null>(null)

  // Fetch lists when user logs in
  useEffect(() => {
    if (user) {
      fetchLists()
    } else {
      setLists([])
      setSelectedList(null)
      setEditingListId(null)
    }
  }, [user])

  const fetchLists = async () => {
    setIsLoadingLists(true)
    try {
      const response = await fetch('/api/lists')
      if (response.ok) {
        const data = await response.json()
        setLists(data.lists || [])
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setIsLoadingLists(false)
    }
  }

  const fetchListDetail = async (listId: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedList(data.list)
        // Load groups from the list
        setEditGroups(data.list.groups || [])
        // Load countries into edit selections
        setEditSelections(
          data.list.countries.map((c: { country_code: string; country_name: string; notes: string | null; color: string | null; group_id: string | null }) => ({
            country_code: c.country_code,
            country_name: c.country_name,
            notes: c.notes || '',
            color: c.color || DEFAULT_COLOR,
            group_id: c.group_id || null,
          }))
        )
        setEditingListId(listId)
        setPanelView('list-detail')
      }
    } catch (error) {
      console.error('Error fetching list:', error)
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return

    try {
      const response = await fetch(`/api/lists/${listId}`, { method: 'DELETE' })
      if (response.ok) {
        setLists(lists.filter(l => l.id !== listId))
        if (editingListId === listId) {
          setEditingListId(null)
          setSelectedList(null)
          setEditSelections([])
          setPanelView('lists')
        }
        toast({ title: 'List deleted' })
      }
    } catch (error) {
      console.error('Error deleting list:', error)
      toast({ title: 'Error', description: 'Failed to delete list', variant: 'destructive' })
    }
  }

  const handleSaveListChanges = async () => {
    if (!selectedList || !editingListId) return

    setIsSavingChanges(true)
    try {
      // Get current countries from DB
      const currentCodes = new Set(selectedList.countries.map(c => c.country_code))
      const newCodes = new Set(editSelections.map(c => c.country_code))

      const toAdd = editSelections.filter(s => !currentCodes.has(s.country_code))
      const toRemove = selectedList.countries.filter(c => !newCodes.has(c.country_code))
      const toUpdate = editSelections.filter(s => {
        const existing = selectedList.countries.find(c => c.country_code === s.country_code)
        return existing && (existing.notes !== s.notes || existing.color !== s.color)
      })

      const operations: Promise<Response>[] = []

      for (const country of toAdd) {
        operations.push(
          fetch(`/api/lists/${editingListId}/countries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(country),
          })
        )
      }

      for (const country of toRemove) {
        operations.push(
          fetch(`/api/lists/${editingListId}/countries/${country.id}`, { method: 'DELETE' })
        )
      }

      for (const country of toUpdate) {
        const existing = selectedList.countries.find(c => c.country_code === country.country_code)
        if (existing) {
          operations.push(
            fetch(`/api/lists/${editingListId}/countries/${existing.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notes: country.notes, color: country.color }),
            })
          )
        }
      }

      // Also save the groups
      operations.push(
        fetch(`/api/lists/${editingListId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groups: editGroups }),
        })
      )

      await Promise.all(operations)
      toast({ title: 'Changes saved' })
      fetchLists()
      fetchListDetail(editingListId)
    } catch (error) {
      console.error('Error saving changes:', error)
      toast({ title: 'Error', description: 'Failed to save changes', variant: 'destructive' })
    } finally {
      setIsSavingChanges(false)
    }
  }

  // Check if we should auto-save after login
  useEffect(() => {
    if (!isAuthLoading && user && pendingSave && selections.length > 0) {
      setShowSaveDialog(true)
      setPendingSave(false)
    }
  }, [user, isAuthLoading, pendingSave, selections.length])

  // Check for pending save flag in sessionStorage
  useEffect(() => {
    if (isHydrated) {
      const hasPendingSave = sessionStorage.getItem('pending_save')
      if (hasPendingSave) {
        setPendingSave(true)
        sessionStorage.removeItem('pending_save')
      }
    }
  }, [isHydrated])

  const handleCountryClick = useCallback((countryCode: string, countryName: string) => {
    if (editingListId) {
      // Editing existing list
      const exists = editSelections.some(c => c.country_code === countryCode)
      if (exists) {
        setEditSelections(prev => prev.filter(c => c.country_code !== countryCode))
      } else if (editGroups.length > 0) {
        // Show group selector
        setPendingCountry({ code: countryCode, name: countryName })
      } else {
        // No groups, add with default color
        setEditSelections(prev => [...prev, {
          country_code: countryCode,
          country_name: countryName,
          notes: '',
          color: DEFAULT_COLOR,
          group_id: null,
        }])
      }
      setPanelView('list-detail')
    } else {
      // New selection
      const alreadySelected = isSelected(countryCode)
      if (alreadySelected) {
        removeCountry(countryCode)
      } else if (groups.length > 0) {
        // Show group selector popup
        setPendingCountry({ code: countryCode, name: countryName })
      } else {
        // No groups, add with default blue
        addCountry(countryCode, countryName, null)
      }
      setPanelView('selection')
    }
  }, [editingListId, editSelections, editGroups, groups, isSelected, removeCountry, addCountry])

  const handleSelectGroup = (groupId: string | null) => {
    if (!pendingCountry) return

    if (editingListId) {
      const group = groupId ? editGroups.find(g => g.id === groupId) : null
      setEditSelections(prev => [...prev, {
        country_code: pendingCountry.code,
        country_name: pendingCountry.name,
        notes: '',
        color: group?.color || DEFAULT_COLOR,
        group_id: groupId,
      }])
    } else {
      addCountry(pendingCountry.code, pendingCountry.name, groupId)
    }
    setPendingCountry(null)
  }

  const handleSaveClick = () => {
    if (!user) {
      sessionStorage.setItem('pending_save', 'true')
    }
    setShowSaveDialog(true)
  }

  const handleSaveList = async (name: string, description: string) => {
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          countries: selections,
          groups: groups,
        }),
      })

      if (!response.ok) throw new Error('Failed to create list')

      toast({
        title: 'List saved!',
        description: `"${name}" has been created with ${selections.length} countries`,
      })

      clearSelections()
      fetchLists()
      setPanelView('lists')
    } catch (error) {
      console.error('Error saving list:', error)
      toast({
        title: 'Error',
        description: 'Failed to save your list',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleNewList = () => {
    setEditingListId(null)
    setSelectedList(null)
    setEditSelections([])
    clearSelections()
    setPanelView('none')
    toast({ title: 'Start selecting countries for your new list' })
  }

  const handleBackToLists = () => {
    setEditingListId(null)
    setSelectedList(null)
    setEditSelections([])
    setPanelView('lists')
  }

  // Determine which countries to show on globe
  const displayedCountries = editingListId ? editSelections.map(s => s.country_code) : selections.map(s => s.country_code)

  // Build color map for globe
  const countryColors = (editingListId ? editSelections : selections).reduce((acc, s) => {
    acc[s.country_code] = s.color
    return acc
  }, {} as Record<string, string>)

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-gray-900/80 to-transparent">
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
              {user ? (
                <>
                  <Button
                    variant="outline"
                    className={`border-white/20 ${
                      panelView === 'lists' || panelView === 'list-detail'
                        ? 'bg-white text-gray-900'
                        : 'bg-white/10 text-white hover:bg-white hover:text-gray-900'
                    }`}
                    onClick={() => setPanelView(panelView === 'lists' || panelView === 'list-detail' ? 'none' : 'lists')}
                  >
                    <List className="h-4 w-4 mr-2" />
                    My lists
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9 border-2 border-white/20">
                          <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                          <AvatarFallback className="bg-blue-600 text-white">
                            {getInitials(profile?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
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
                <>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white hover:text-gray-900"
                    onClick={() => { setAuthMode('signin'); setShowAuthDialog(true) }}
                  >
                    Sign in
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => { setAuthMode('signup'); setShowAuthDialog(true) }}
                  >
                    Get started
                  </Button>
                </>
              )}
            </div>
        </div>
      </header>

      {/* Globe Section */}
      <div className="h-full w-full relative">
        <GlobeViewer
          selectedCountries={displayedCountries}
          countryColors={countryColors}
          onCountryClick={handleCountryClick}
          className="absolute inset-0"
        />

        {/* Floating info panel (collapsed) - for new selections only */}
        {panelView === 'none' && !editingListId && selections.length > 0 && (
          <button
            onClick={() => setPanelView('selection')}
            className="absolute bottom-6 right-6 z-10 bg-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 hover:shadow-xl transition-shadow"
          >
            <div className="flex -space-x-2">
              {selections.slice(0, 3).map((s) => (
                <span key={s.country_code} className="text-xl">
                  {getFlagEmoji(s.country_code)}
                </span>
              ))}
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">
                {selections.length} {selections.length === 1 ? 'country' : 'countries'}
              </p>
              <p className="text-xs text-gray-500">Click to view</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        )}

        {/* Instructions overlay (when no selections and not editing) */}
        {selections.length === 0 && !editingListId && isHydrated && panelView !== 'lists' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-6 py-4 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Create your country list
            </h2>
            <p className="text-gray-600 text-sm">
              Click on countries to select them, then save your list
            </p>
          </div>
        )}

        {/* Side panel - Selection */}
        {panelView === 'selection' && !editingListId && (
          <div className="absolute top-16 right-0 w-80 z-10 bg-white shadow-xl flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Your Selection</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPanelView('none')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CountryPanel
                selections={selections}
                groups={groups}
                onRemove={removeCountry}
                onUpdateNotes={updateNotes}
                onUpdateCountryGroup={updateCountryGroup}
                onAddGroup={addGroup}
                onUpdateGroup={updateGroup}
                onRemoveGroup={removeGroup}
                onAddCountry={(code, name) => addCountry(code, name, null)}
                onSave={handleSaveClick}
                showSaveButton={selections.length > 0}
              />
            </div>
          </div>
        )}

        {/* Side panel - Lists */}
        {panelView === 'lists' && (
          <div className="absolute top-16 right-0 w-80 z-10 bg-white shadow-xl flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">My lists</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPanelView('none')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <Button className="w-full" onClick={handleNewList}>
                New list
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {isLoadingLists ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : lists.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No lists yet</div>
              ) : (
                <div className="p-2 space-y-2">
                  {lists.map((list) => (
                    <div
                      key={list.id}
                      className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors group"
                      onClick={() => fetchListDetail(list.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{list.name}</p>
                          <p className="text-xs text-gray-500">
                            {list.country_count} {list.country_count === 1 ? 'country' : 'countries'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                          onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id) }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Side panel - List Detail/Edit */}
        {panelView === 'list-detail' && selectedList && (
          <ListDetailPanel
            selectedList={selectedList}
            editSelections={editSelections}
            setEditSelections={setEditSelections}
            editGroups={editGroups}
            setEditGroups={setEditGroups}
            onBack={handleBackToLists}
            onClose={() => setPanelView('none')}
            onSave={handleSaveListChanges}
            isSaving={isSavingChanges}
          />
        )}

        {/* Bottom CTA - for new selections only */}
        {selections.length > 0 && !editingListId && panelView !== 'selection' && (
          <div className="absolute bottom-6 left-32 z-10">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 shadow-lg"
              onClick={handleSaveClick}
            >
              Save list
            </Button>
          </div>
        )}
      </div>

      {/* Save Dialog */}
      <SavePromptDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveList}
        countryCount={selections.length}
      />

      {/* Auth Dialog */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        mode={authMode}
      />

      {/* Group Selector Popup */}
      {pendingCountry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPendingCountry(null)} />
          <div className="relative bg-white rounded-lg shadow-xl p-4 w-72">
            <h3 className="font-medium text-gray-900 mb-1">
              Add {pendingCountry.name}
            </h3>
            <p className="text-sm text-gray-500 mb-3">Select a group for this country</p>
            <div className="space-y-2">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-left"
                onClick={() => handleSelectGroup(null)}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: DEFAULT_COLOR }} />
                <span className="text-sm">No group (Blue)</span>
              </button>
              {(editingListId ? editGroups : groups).map((g) => (
                <button
                  key={g.id}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-left"
                  onClick={() => handleSelectGroup(g.id)}
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: g.color }} />
                  <span className="text-sm">{g.name}</span>
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-2 text-gray-500"
              onClick={() => setPendingCountry(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

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
                <li>Use &quot;Add country&quot; search to find any country, including small ones like Vatican City</li>
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

// List Detail Panel Component
interface ListDetailPanelProps {
  selectedList: CountryListWithCountries
  editSelections: UnsavedCountrySelection[]
  setEditSelections: React.Dispatch<React.SetStateAction<UnsavedCountrySelection[]>>
  editGroups: CountryGroup[]
  setEditGroups: React.Dispatch<React.SetStateAction<CountryGroup[]>>
  onBack: () => void
  onClose: () => void
  onSave: () => void
  isSaving?: boolean
}

function ListDetailPanel({
  selectedList,
  editSelections,
  setEditSelections,
  editGroups,
  setEditGroups,
  onBack,
  onClose,
  onSave,
  isSaving = false,
}: ListDetailPanelProps) {
  const { toast } = useToast()
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupColor, setNewGroupColor] = useState<string>(GROUP_COLORS[0].value)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editGroupName, setEditGroupName] = useState('')
  const [editGroupColor, setEditGroupColor] = useState('')
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false)
  const [descriptionValue, setDescriptionValue] = useState(selectedList.description || '')
  const [showAddCountry, setShowAddCountry] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')

  // Filter countries that aren't already selected
  const availableCountries = useMemo(() => {
    const selectedCodes = new Set(editSelections.map(s => s.country_code))
    return ALL_COUNTRIES
      .filter(c => !selectedCodes.has(c.code))
      .filter(c =>
        countrySearch.length === 0 ||
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
      .slice(0, 20)
  }, [editSelections, countrySearch])

  const handleAddCountry = (code: string, name: string) => {
    setEditSelections(prev => [...prev, {
      country_code: code,
      country_name: name,
      notes: '',
      color: DEFAULT_COLOR,
      group_id: null,
    }])
    setShowAddCountry(false)
    setCountrySearch('')
  }

  const handleSaveDescription = async () => {
    try {
      const response = await fetch(`/api/lists/${selectedList.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: descriptionValue }),
      })
      if (response.ok) {
        toast({ title: 'Description saved' })
        setShowDescriptionDialog(false)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save description', variant: 'destructive' })
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/public/${selectedList.id}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({ title: 'Link copied!', description: 'Share link copied to clipboard' })
    } catch {
      toast({ title: 'Share link', description: shareUrl })
    }
  }

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      const newGroup: CountryGroup = {
        id: crypto.randomUUID(),
        name: newGroupName.trim(),
        color: newGroupColor,
      }
      setEditGroups(prev => [...prev, newGroup])
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
      setEditGroups(prev => prev.map(g =>
        g.id === editingGroupId ? { ...g, name: editGroupName.trim(), color: editGroupColor } : g
      ))
      // Update colors for countries in this group
      setEditSelections(prev => prev.map(c =>
        c.group_id === editingGroupId ? { ...c, color: editGroupColor } : c
      ))
      setEditingGroupId(null)
    }
  }

  const handleRemoveGroup = (groupId: string) => {
    setEditGroups(prev => prev.filter(g => g.id !== groupId))
    setEditSelections(prev => prev.filter(c => c.group_id !== groupId))
  }

  const handleUpdateCountryGroup = (countryCode: string, groupId: string | null) => {
    setEditSelections(prev => prev.map(c => {
      if (c.country_code === countryCode) {
        const group = groupId ? editGroups.find(g => g.id === groupId) : null
        return { ...c, group_id: groupId, color: group?.color || DEFAULT_COLOR }
      }
      return c
    }))
  }

  // Group countries by their group_id
  const ungroupedCountries = editSelections.filter(s => !s.group_id)
  const groupedCountries = editGroups.map(group => ({
    group,
    countries: editSelections.filter(s => s.group_id === group.id)
  }))

  return (
    <div className="absolute top-16 right-0 w-80 z-10 bg-white shadow-xl flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{selectedList.name}</h3>
          <p className="text-xs text-gray-500">{editSelections.length} countries</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${descriptionValue ? 'text-amber-500' : ''}`}
          onClick={() => setShowDescriptionDialog(true)}
          title="Edit description"
        >
          <FileText className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare} title="Copy share link">
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Add Country Search */}
      <div className="px-4 py-2 border-b border-gray-100">
        <DropdownMenu open={showAddCountry} onOpenChange={setShowAddCountry}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full h-8 text-xs justify-start">
              <Search className="h-3 w-3 mr-2" />
              Add country...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 p-2" align="start">
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
                    onClick={() => handleAddCountry(country.code, country.name)}
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
                      {newGroupColor === c.value && <Check className="h-3 w-3 text-white" />}
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
            {editGroups.length === 0 && !showAddGroup && (
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
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
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
                      onClick={() => handleRemoveGroup(group.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Countries in this group */}
                {countries.map((country) => (
                  <CountryItemEdit
                    key={country.country_code}
                    country={country}
                    groups={editGroups}
                    onRemove={(code) => setEditSelections(prev => prev.filter(c => c.country_code !== code))}
                    onUpdateGroup={handleUpdateCountryGroup}
                    onUpdateNotes={(code, notes) => setEditSelections(prev => prev.map(c => c.country_code === code ? { ...c, notes } : c))}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Ungrouped Countries */}
          {ungroupedCountries.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {editGroups.length > 0 ? 'Ungrouped' : 'Countries'}
              </h4>
              {ungroupedCountries.map((country) => (
                <CountryItemEdit
                  key={country.country_code}
                  country={country}
                  groups={editGroups}
                  onRemove={(code) => setEditSelections(prev => prev.filter(c => c.country_code !== code))}
                  onUpdateGroup={handleUpdateCountryGroup}
                  onUpdateNotes={(code, notes) => setEditSelections(prev => prev.map(c => c.country_code === code ? { ...c, notes } : c))}
                />
              ))}
            </div>
          )}

          {editSelections.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-4">Click countries on the globe to add them</p>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-200">
        <Button className="w-full" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>

      {/* Description Dialog */}
      <Dialog open={showDescriptionDialog} onOpenChange={setShowDescriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List description</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Add a description for this list..."
            value={descriptionValue}
            onChange={(e) => setDescriptionValue(e.target.value)}
            className="min-h-[120px] text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDescriptionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDescription}>
              Save description
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Country item for edit panel
interface CountryItemEditProps {
  country: UnsavedCountrySelection
  groups: CountryGroup[]
  onRemove: (countryCode: string) => void
  onUpdateGroup: (countryCode: string, groupId: string | null) => void
  onUpdateNotes: (countryCode: string, notes: string) => void
}

function CountryItemEdit({ country, groups, onRemove, onUpdateGroup, onUpdateNotes }: CountryItemEditProps) {
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
            onClick={() => { onUpdateGroup(country.country_code, null); setShowGroupSelect(false) }}
          >
            None
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              className={`px-2 py-1 text-xs rounded border flex items-center gap-1 ${country.group_id === g.id ? 'border-gray-800 bg-gray-100' : 'border-gray-200'}`}
              onClick={() => { onUpdateGroup(country.country_code, g.id); setShowGroupSelect(false) }}
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
  if (!countryCode || countryCode.length !== 2) return ''
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
