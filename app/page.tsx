import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Starter</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button>Get started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Next.js + Supabase</span>
            <span className="block text-gray-500">Starter Template</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500">
            A clean, minimal starter template with authentication, protected routes,
            and a dashboard layout. Built with Next.js 15, Supabase, Tailwind CSS,
            and Shadcn UI.
          </p>
          <div className="mx-auto mt-10 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Get started free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8">
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Authentication</h3>
            <p className="mt-2 text-gray-500">
              Email/password authentication with Supabase Auth. Includes signup,
              login, forgot password, and password reset flows.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Protected Routes</h3>
            <p className="mt-2 text-gray-500">
              Middleware-based route protection. Unauthenticated users are
              redirected to login with return URL support.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
              <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Dashboard Layout</h3>
            <p className="mt-2 text-gray-500">
              Responsive dashboard with collapsible sidebar, user menu, and
              mobile-friendly navigation.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
              <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Supabase Ready</h3>
            <p className="mt-2 text-gray-500">
              Three-tier Supabase client setup for browser, server, and admin
              use cases. Row Level Security policies included.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center mb-4">
              <svg className="h-5 w-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Shadcn UI</h3>
            <p className="mt-2 text-gray-500">
              Beautiful, accessible components built on Radix UI. Easily
              customizable with Tailwind CSS.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center mb-4">
              <svg className="h-5 w-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">TypeScript</h3>
            <p className="mt-2 text-gray-500">
              Full TypeScript support with strict mode enabled. Type-safe
              database queries and API routes.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Built with Next.js, Supabase, and Shadcn UI
          </p>
        </div>
      </footer>
    </div>
  );
}
