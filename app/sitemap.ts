import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mycountrylist.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/public`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  // Add all public + discoverable lists
  try {
    const supabase = createAdminClient()
    const { data: lists } = await supabase
      .from('country_lists')
      .select('id, updated_at')
      .eq('is_public', true)
      .eq('is_discoverable', true)
      .order('updated_at', { ascending: false })
      .limit(1000)

    if (lists) {
      for (const list of lists) {
        entries.push({
          url: `${BASE_URL}/public/${list.id}`,
          lastModified: list.updated_at,
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      }
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
  }

  return entries
}
