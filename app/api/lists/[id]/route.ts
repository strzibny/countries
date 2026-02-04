import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/lists/[id] - Fetch single list with all countries
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: list, error } = await supabase
      .from('country_lists')
      .select(`
        *,
        list_countries(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'List not found' }, { status: 404 })
      }
      console.error('Error fetching list:', error)
      return NextResponse.json({ error: 'Failed to fetch list' }, { status: 500 })
    }

    // Transform to match expected structure
    const listWithCountries = {
      ...list,
      countries: list.list_countries || [],
      list_countries: undefined,
    }

    return NextResponse.json({ list: listWithCountries })
  } catch (error) {
    console.error('Error in GET /api/lists/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/lists/[id] - Update list name/description
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, groups, is_public, is_discoverable } = body

    const updates: { name?: string; description?: string | null; groups?: unknown[]; is_public?: boolean; is_discoverable?: boolean } = {}
    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description?.trim() || null
    if (groups !== undefined) updates.groups = groups
    if (is_public !== undefined) updates.is_public = is_public
    if (is_discoverable !== undefined) updates.is_discoverable = is_discoverable

    // If making not public, also turn off discoverable
    if (is_public === false) {
      updates.is_discoverable = false
    }

    // Discoverable requires public to be true
    if (is_discoverable === true && is_public !== true) {
      // Check current list state to see if it's already public
      const { data: currentList } = await supabase
        .from('country_lists')
        .select('is_public')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (!currentList?.is_public && is_public !== true) {
        return NextResponse.json(
          { error: 'List must be public before it can be discoverable' },
          { status: 400 }
        )
      }
    }

    const { data: list, error } = await supabase
      .from('country_lists')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'List not found' }, { status: 404 })
      }
      console.error('Error updating list:', error)
      return NextResponse.json({ error: 'Failed to update list' }, { status: 500 })
    }

    return NextResponse.json({ list })
  } catch (error) {
    console.error('Error in PATCH /api/lists/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/lists/[id] - Delete list
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('country_lists')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting list:', error)
      return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/lists/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
