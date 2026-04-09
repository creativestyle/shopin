import { SearchResultsPage } from '@/features/searchResults/search-results-page'

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ params, searchParams }: PageProps) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ])

  const query =
    typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : ''

  return (
    <SearchResultsPage
      locale={locale}
      query={query}
    />
  )
}
