"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

interface SavePromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string, description: string) => Promise<void>
  countryCount: number
}

export function SavePromptDialog({
  open,
  onOpenChange,
  onSave,
  countryCount,
}: SavePromptDialogProps) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [step, setStep] = useState<'auth' | 'name'>('auth')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Reset state when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep('auth')
      setName('')
      setDescription('')
    }
    onOpenChange(newOpen)
  }

  // Check if user is authenticated
  if (user && step === 'auth') {
    setStep('name')
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setIsSaving(true)
    try {
      await onSave(name.trim(), description.trim())
      handleOpenChange(false)
    } catch (error) {
      console.error('Error saving list:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isAuthLoading) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 'auth' ? (
          <>
            <DialogHeader>
              <DialogTitle>Save your list</DialogTitle>
              <DialogDescription>
                Sign in to save your {countryCount} selected {countryCount === 1 ? 'country' : 'countries'}.
                Your selections will be preserved after signing in.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <GoogleSignInButton className="w-full" size="lg" />
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Name your list</DialogTitle>
              <DialogDescription>
                Give your list of {countryCount} {countryCount === 1 ? 'country' : 'countries'} a name.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">List name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Countries to Visit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a description for your list..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save list'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
