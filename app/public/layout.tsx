import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore country lists - MyCountryList',
  description: 'Browse country lists shared by the community. Discover travel lists, visited countries, and more on an interactive 3D globe.',
  openGraph: {
    title: 'Explore country lists - MyCountryList',
    description: 'Browse country lists shared by the community. Discover travel lists, visited countries, and more on an interactive 3D globe.',
  },
  twitter: {
    title: 'Explore country lists - MyCountryList',
    description: 'Browse country lists shared by the community on an interactive 3D globe.',
  },
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
