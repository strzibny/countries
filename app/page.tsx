"use client"

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GlobeViewer } from '@/components/globe/globe-viewer'
import { CountryPanel } from '@/components/globe/country-panel'
import { SavePromptDialog } from '@/components/globe/save-prompt-dialog'
import { AuthDialog } from '@/components/auth/auth-dialog'
import { useUnsavedSelections } from '@/hooks/use-unsaved-selections'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Globe, ChevronRight, X } from 'lucide-react'

export default function Home() {
  const {
    selections,
    toggleCountry,
    removeCountry,
    updateNotes,
    clearSelections,
    isHydrated,
  } = useUnsavedSelections()

  const { user, isLoading: isAuthLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [pendingSave, setPendingSave] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

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
    toggleCountry(countryCode, countryName)
    setShowPanel(true)
  }, [toggleCountry])

  const handleSaveClick = () => {
    if (!user) {
      // Set flag to show save dialog after login
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
        }),
      })

      if (!response.ok) throw new Error('Failed to create list')

      const data = await response.json()

      toast({
        title: 'List saved!',
        description: `"${name}" has been created with ${selections.length} countries`,
      })

      clearSelections()
      router.push(`/lists/${data.list.id}`)
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

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-gray-900/80 to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Globe className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">Country Lists</span>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    Dashboard
                  </Button>
                </Link>
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
        </div>
      </header>

      {/* Globe Section */}
      <div className="h-full w-full relative">
        <GlobeViewer
          selectedCountries={selections.map(s => s.country_code)}
          onCountryClick={handleCountryClick}
          className="absolute inset-0"
        />

        {/* Floating info panel (collapsed) */}
        {!showPanel && selections.length > 0 && (
          <button
            onClick={() => setShowPanel(true)}
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

        {/* Instructions overlay (when no selections) */}
        {selections.length === 0 && isHydrated && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-6 py-4 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Create your country list
            </h2>
            <p className="text-gray-600 text-sm">
              Click on countries to select them, then save your list
            </p>
          </div>
        )}

        {/* Side panel */}
        {showPanel && (
          <div className="absolute top-16 right-0 w-80 z-10 bg-white shadow-xl flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Your Selection</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CountryPanel
                selections={selections}
                onRemove={removeCountry}
                onUpdateNotes={updateNotes}
                onSave={handleSaveClick}
                showSaveButton={selections.length > 0}
              />
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        {selections.length > 0 && !showPanel && (
          <div className="absolute bottom-6 left-32 z-10">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 shadow-lg"
              onClick={handleSaveClick}
            >
              Save Your List
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
