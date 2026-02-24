import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/lists/[id]/public - Fetch a list publicly (no auth required)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Fetch the list with its countries (no user check - public access)
    const { data: list, error: listError } = await supabase
      .from('country_lists')
      .select(`
        id,
        name,
        description,
        is_public,
        groups,
        created_at,
        list_countries (
          id,
          country_code,
          country_name,
          notes,
          color,
          group_id
        )
      `)
      .eq('id', id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Only allow access to lists that are explicitly public
    if (!list.is_public) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Get the owner's profile for display (just name, not email)
    const { data: listWithUser } = await supabase
      .from('country_lists')
      .select('user_id')
      .eq('id', id)
      .single()

    let ownerName = 'Anonymous'
    if (listWithUser?.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', listWithUser.user_id)
        .single()

      if (profile?.full_name) {
        ownerName = profile.full_name
      }
    }

    return NextResponse.json({
      list: {
        ...list,
        countries: list.list_countries || [],
        owner_name: ownerName,
      }
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    console.error('Error in GET /api/lists/[id]/public:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
