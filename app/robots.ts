import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mycountrylist.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/public', '/public/*'],
        disallow: ['/api/', '/lists/', '/settings/', '/login/', '/register/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
