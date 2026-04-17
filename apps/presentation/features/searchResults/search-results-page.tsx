import { getTranslations } from 'next-intl/server'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { StandardContainer } from '@/components/ui/standard-container'
import { SearchResultsContent } from './search-results-content'

interface SearchResultsPageProps {
  locale: string
  query: string
}

export async function SearchResultsPage({
  locale,
  query,
}: SearchResultsPageProps) {
  const t = await getTranslations('searchResults')

  const breadcrumbs = [{ label: t('breadcrumb'), path: '/search' }]

  return (
    <StandardContainer className='py-4'>
      <Breadcrumbs
        crumbs={breadcrumbs}
        className='pb-4'
      />

      <SearchResultsContent
        locale={locale}
        query={query}
      />
    </StandardContainer>
  )
}
