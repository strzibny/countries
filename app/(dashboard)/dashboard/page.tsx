"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Rocket, Settings, BookOpen } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { profile, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s what&apos;s happening with your account today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Rocket className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Getting Started</CardTitle>
            </div>
            <CardDescription>
              Complete your profile to get the most out of the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/settings"
              className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
            >
              Visit settings to update your profile &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Settings className="h-4 w-4 text-green-600" />
              </div>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </div>
            <CardDescription>
              Your account overview at a glance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p>Account created: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </div>
            <CardDescription>
              Resources to help you get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Check out our documentation for guides and tutorials.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
