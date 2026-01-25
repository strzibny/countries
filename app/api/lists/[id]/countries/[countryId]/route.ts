import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/lists/[id]/countries/[countryId] - Update country notes
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; countryId: string }> }
) {
  try {
    const { id, countryId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the list belongs to the user
    const { data: list, error: listError } = await supabase
      .from('country_lists')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    const body = await request.json()
    const { notes, color } = body

    const updateData: { notes?: string | null; color?: string | null } = {}
    if (notes !== undefined) updateData.notes = notes || null
    if (color !== undefined) updateData.color = color || null

    const { data: country, error } = await supabase
      .from('list_countries')
      .update(updateData)
      .eq('id', countryId)
      .eq('list_id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Country not found' }, { status: 404 })
      }
      console.error('Error updating country:', error)
      return NextResponse.json({ error: 'Failed to update country' }, { status: 500 })
    }

    return NextResponse.json({ country })
  } catch (error) {
    console.error('Error in PATCH /api/lists/[id]/countries/[countryId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/lists/[id]/countries/[countryId] - Remove country from list
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; countryId: string }> }
) {
  try {
    const { id, countryId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the list belongs to the user
    const { data: list, error: listError } = await supabase
      .from('country_lists')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('list_countries')
      .delete()
      .eq('id', countryId)
      .eq('list_id', id)

    if (error) {
      console.error('Error deleting country:', error)
      return NextResponse.json({ error: 'Failed to delete country' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/lists/[id]/countries/[countryId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
