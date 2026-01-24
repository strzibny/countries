"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'signin' | 'signup'
}

export function AuthDialog({ open, onOpenChange, mode }: AuthDialogProps) {
  const isSignIn = mode === 'signin'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
          </div>
          <DialogTitle className="text-2xl">
            {isSignIn ? 'Welcome back' : 'Create an account'}
          </DialogTitle>
          <DialogDescription>
            {isSignIn
              ? 'Sign in to your account to continue'
              : 'Get started with your free account'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <GoogleSignInButton className="w-full" size="lg" />
          {!isSignIn && (
            <p className="text-xs text-center text-gray-500">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
