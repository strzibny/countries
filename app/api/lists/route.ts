import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/lists - Fetch all user's lists with country counts
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch lists with country counts
    const { data: lists, error } = await supabase
      .from('country_lists')
      .select(`
        *,
        list_countries(count)
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching lists:', error)
      return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 })
    }

    // Transform the response to include country_count
    interface ListWithCountries {
      id: string
      user_id: string
      name: string
      description: string | null
      created_at: string
      updated_at: string
      list_countries?: { count: number }[]
    }
    const listsWithCount = lists?.map((list: ListWithCountries) => ({
      ...list,
      country_count: list.list_countries?.[0]?.count || 0,
      list_countries: undefined,
    }))

    return NextResponse.json({ lists: listsWithCount })
  } catch (error) {
    console.error('Error in GET /api/lists:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/lists - Create new list
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, countries, groups } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Create the list
    const { data: list, error: listError } = await supabase
      .from('country_lists')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        groups: groups || [],
      })
      .select()
      .single()

    if (listError) {
      console.error('Error creating list:', listError)
      return NextResponse.json({ error: 'Failed to create list' }, { status: 500 })
    }

    // If countries are provided, add them to the list
    if (countries && Array.isArray(countries) && countries.length > 0) {
      const countriesToInsert = countries.map((country: { country_code: string; country_name: string; notes?: string; color?: string; group_id?: string }) => ({
        list_id: list.id,
        country_code: country.country_code,
        country_name: country.country_name,
        notes: country.notes || null,
        color: country.color || null,
        group_id: country.group_id || null,
      }))

      const { error: countriesError } = await supabase
        .from('list_countries')
        .insert(countriesToInsert)

      if (countriesError) {
        console.error('Error adding countries:', countriesError)
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json({ list }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/lists:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
