import type { ContentPageResponse } from '@core/contracts/content/page'
import type { TeaserResponse } from '@core/contracts/content/teaser'
import { getContentPage } from './get-content-page'
import { isHomepageSlug } from './homepage-slug'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { StandardContainer } from '@/components/ui/standard-container'
import { ErrorDisplay } from '@/components/ui/error-display'
import { getTranslations } from 'next-intl/server'
import { getCommonErrorMessage } from '@/lib/error-translation-keys'
import { TeaserBlock } from './teasers/teaser-block'
import { TeaserHeroBlock } from './teasers/teaser-hero-block'

interface ContentPageProps {
  slug: string
}

function resolvePageTitle(page: ContentPageResponse, slug: string): string {
  return (
    page.pageTitle ?? page.breadcrumb[page.breadcrumb.length - 1]?.label ?? slug
  )
}

/**
 * Server component: fetches content page from BFF and renders breadcrumb,
 * page title (h1), and teaser components. Homepage hides h1 (sr-only);
 * other pages respect pageTitleVisibility from API.
 */
export async function ContentPage({ slug }: ContentPageProps) {
  let pageData: ContentPageResponse | null = null
  let error: string | null = null
  const t = await getTranslations('common')

  try {
    pageData = await getContentPage(slug)
  } catch (err) {
    error = await getCommonErrorMessage(err, () => getTranslations('common'))
  }

  if (error) {
    return (
      <StandardContainer className='p-4'>
        <ErrorDisplay centered>{error}</ErrorDisplay>
      </StandardContainer>
    )
  }

  if (!pageData) {
    return (
      <StandardContainer className='p-4'>
        <div className='text-center'>{t('noDataFound')}</div>
      </StandardContainer>
    )
  }

  const isHomepage = isHomepageSlug(slug)
  const pageTitle = resolvePageTitle(pageData, slug)
  const isTitleSrOnly = isHomepage || pageData.pageTitleVisibility === 'srOnly'
  const components = pageData.components ?? []
  const firstNonHeroIndex = components.findIndex(
    (t: TeaserResponse) => t.type !== 'hero'
  )

  return (
    <>
      {!isHomepage && (
        <StandardContainer className='py-4 pb-4'>
          <Breadcrumbs crumbs={pageData.breadcrumb} />
        </StandardContainer>
      )}
      {pageTitle && (
        <StandardContainer className={isTitleSrOnly ? 'sr-only' : 'pt-4'}>
          <h1 className='text-2xl font-bold md:text-3xl'>{pageTitle}</h1>
        </StandardContainer>
      )}
      {components.map((teaser, i) =>
        teaser.type === 'hero' ? (
          <div
            key={i}
            className='ui-container'
          >
            <div className='ui-fullbleed-width'>
              <TeaserHeroBlock
                teaser={teaser}
                imagePreload={i === 0}
              />
            </div>
          </div>
        ) : (
          <StandardContainer
            key={i}
            className={
              i === firstNonHeroIndex
                ? 'flex flex-col gap-8 pb-4'
                : 'flex flex-col gap-8 py-4'
            }
          >
            <TeaserBlock
              teaser={teaser}
              index={i}
              imagePreload={i === 0}
            />
          </StandardContainer>
        )
      )}
    </>
  )
}
