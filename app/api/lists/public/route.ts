import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/lists/public - Fetch all public & discoverable lists
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() || ''

    let dbQuery = supabase
      .from('country_lists')
      .select(`
        id,
        name,
        description,
        updated_at,
        user_id,
        list_countries(count)
      `)
      .eq('is_public', true)
      .eq('is_discoverable', true)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (query) {
      dbQuery = dbQuery.ilike('name', `%${query}%`)
    }

    const { data: lists, error } = await dbQuery

    if (error) {
      console.error('Error fetching public lists:', error)
      return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 })
    }

    // Fetch owner names for all lists
    const userIds = [...new Set(lists.map(l => l.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)

    const profileMap = new Map(
      (profiles || []).map(p => [p.id, p.full_name || 'Anonymous'])
    )

    const result = lists.map(list => ({
      id: list.id,
      name: list.name,
      description: list.description,
      updated_at: list.updated_at,
      country_count: (list.list_countries as unknown as { count: number }[])?.[0]?.count ?? 0,
      owner_name: profileMap.get(list.user_id) || 'Anonymous',
    }))

    return NextResponse.json({ lists: result }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    console.error('Error in GET /api/lists/public:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
