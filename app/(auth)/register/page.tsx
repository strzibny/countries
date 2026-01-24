"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Get started with your free account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleSignInButton className="w-full" size="lg" />
          <p className="text-xs text-center text-gray-500">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-gray-900 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
