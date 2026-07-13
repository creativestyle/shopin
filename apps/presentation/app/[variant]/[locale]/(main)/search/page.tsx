import { initRouteContext } from '@/lib/request-context/route-context'
import { SearchResultsPage } from '@/features/searchResults/search-results-page'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ variant: string; locale: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { variant, locale } = await params
  const { q } = await searchParams
  initRouteContext({ variant, locale })
  const query = typeof q === 'string' ? q : ''

  return (
    <SearchResultsPage
      locale={locale}
      query={query}
    />
  )
}
