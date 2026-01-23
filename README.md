# Next.js + Supabase Starter

A clean, minimal starter template for building web applications with Next.js and Supabase. Includes authentication, protected routes, and a dashboard layout.

## Features

- **Authentication**: Email/password auth with signup, login, forgot password, and reset password flows
- **Protected Routes**: Middleware-based route protection with redirect support
- **Dashboard Layout**: Responsive sidebar with collapsible navigation
- **Supabase Integration**: Three-tier client setup (browser, server, admin)
- **Shadcn UI**: Beautiful, accessible components
- **TypeScript**: Full type safety throughout
- **Tailwind CSS v4**: Modern styling with CSS variables

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| UI | Shadcn UI + Tailwind CSS v4 |
| Language | TypeScript |

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd next-supabase-starter

# Install dependencies
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `supabase/schema.sql`
3. Go to **Settings > API** and copy your keys

### 3. Configure Environment Variables

```bash
# Copy the example env file
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (keep secret!)
- `NEXT_PUBLIC_APP_URL`: Your app URL (http://localhost:3000 for dev)

### 4. Configure Supabase Auth

In your Supabase dashboard:
1. Go to **Authentication > URL Configuration**
2. Add `http://localhost:3000/auth/callback` to **Redirect URLs**
3. For production, add your production callback URL

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
├── app/
│   ├── (auth)/              # Auth pages (login, register, etc.)
│   ├── (dashboard)/         # Dashboard pages (protected)
│   ├── api/                 # API routes
│   ├── auth/callback/       # Auth callback handler
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── auth/                # Auth components
│   ├── dashboard/           # Dashboard components
│   ├── providers/           # Context providers
│   └── ui/                  # Shadcn UI components
├── hooks/                   # Custom React hooks
├── lib/
│   ├── supabase/           # Supabase clients
│   └── utils.ts            # Utility functions
├── supabase/
│   └── schema.sql          # Database schema
├── types/                   # TypeScript types
└── middleware.ts           # Route protection
```

## Key Files

### Supabase Clients

- `lib/supabase/client.ts` - Browser client for client components
- `lib/supabase/server.ts` - Server client for server components and API routes
- `lib/supabase/admin.ts` - Admin client with service role (bypasses RLS)

### Authentication

- `components/providers/auth-provider.tsx` - Auth context with all auth methods
- `middleware.ts` - Route protection logic
- `app/auth/callback/route.ts` - Handles email confirmation redirects

## Database Schema

The starter includes a simple `profiles` table:

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Profiles are automatically created when users sign up via a database trigger.

## Adding New Features

### Add a New Protected Page

1. Create a new page in `app/(dashboard)/your-page/page.tsx`
2. The route is automatically protected by the dashboard layout

### Add a New API Route

```typescript
// app/api/your-route/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Your logic here
  return NextResponse.json({ data: 'Hello!' })
}
```

### Add a New Database Table

1. Add the SQL to `supabase/schema.sql`
2. Run the SQL in your Supabase SQL Editor
3. Add types to `types/database.ts`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Update `NEXT_PUBLIC_APP_URL` to your production URL
5. Add production callback URL in Supabase Auth settings

## Customization

### Change Colors

Edit the CSS variables in `app/globals.css`. The starter uses a neutral (white/grey) theme.

### Add Shadcn Components

```bash
npx shadcn@latest add [component-name]
```

### Modify Sidebar Navigation

Edit `components/dashboard/sidebar.tsx` to add or remove navigation items.

## License

MIT
