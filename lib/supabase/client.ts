// Browser client for client components
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we have valid Supabase config
const isValidUrl = (url: string | undefined): url is string => {
  if (!url) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function createClient() {
  if (!isValidUrl(supabaseUrl) || !supabaseAnonKey) {
    // Return a mock client during build time or when env vars are not set
    // This prevents build failures while still allowing the app to work at runtime
    if (typeof window === 'undefined') {
      return null as unknown as ReturnType<typeof createBrowserClient>
    }
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (typeof document === 'undefined') return []
        const cookies: { name: string; value: string }[] = []
        document.cookie.split(';').forEach((cookie) => {
          const [name, value] = cookie.trim().split('=')
          if (name && value) {
            cookies.push({ name, value: decodeURIComponent(value) })
          }
        })
        return cookies
      },
      setAll(cookiesToSet) {
        if (typeof document === 'undefined') return
        cookiesToSet.forEach(({ name, value, options }) => {
          let cookie = `${name}=${encodeURIComponent(value)}`
          cookie += `; path=${options?.path || '/'}`
          if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
          cookie += `; samesite=${options?.sameSite || 'lax'}`
          if (options?.secure || (typeof window !== 'undefined' && window.location.protocol === 'https:')) {
            cookie += `; secure`
          }
          document.cookie = cookie
        })
      },
    },
  })
}
