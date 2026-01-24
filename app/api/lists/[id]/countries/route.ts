import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/lists/[id]/countries - Get countries in list
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

    // First verify the list belongs to the user
    const { data: list, error: listError } = await supabase
      .from('country_lists')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    const { data: countries, error } = await supabase
      .from('list_countries')
      .select('*')
      .eq('list_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching countries:', error)
      return NextResponse.json({ error: 'Failed to fetch countries' }, { status: 500 })
    }

    return NextResponse.json({ countries })
  } catch (error) {
    console.error('Error in GET /api/lists/[id]/countries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/lists/[id]/countries - Add country to list
export async function POST(
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

    // First verify the list belongs to the user
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
    const { country_code, country_name, notes } = body

    if (!country_code || !country_name) {
      return NextResponse.json({ error: 'country_code and country_name are required' }, { status: 400 })
    }

    const { data: country, error } = await supabase
      .from('list_countries')
      .insert({
        list_id: id,
        country_code,
        country_name,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Country already in list' }, { status: 409 })
      }
      console.error('Error adding country:', error)
      return NextResponse.json({ error: 'Failed to add country' }, { status: 500 })
    }

    return NextResponse.json({ country }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/lists/[id]/countries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
