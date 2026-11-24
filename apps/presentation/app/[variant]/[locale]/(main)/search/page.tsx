import { SEARCH_PARAM_QUERY } from '@config/constants'
import { initRouteContext } from '@/lib/request-context/route-context'
import { SearchResultsPage } from '@/features/searchResults/search-results-page'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ variant: string; locale: string }>
  searchParams: Promise<{ [SEARCH_PARAM_QUERY]?: string }>
}) {
  const { variant, locale } = await params
  const { [SEARCH_PARAM_QUERY]: q } = await searchParams
  initRouteContext({ variant, locale })
  const query = typeof q === 'string' ? q : ''

  return (
    <SearchResultsPage
      locale={locale}
      query={query}
    />
  )
}
