import { setRequestLocale } from 'next-intl/server'
import { SearchResultsPage } from '@/features/searchResults/search-results-page'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { locale } = await params
  const { q } = await searchParams
  setRequestLocale(locale)
  const query = typeof q === 'string' ? q : ''

  return (
    <SearchResultsPage
      locale={locale}
      query={query}
    />
  )
}
