"use client"

import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
