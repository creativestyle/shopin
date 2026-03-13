import { I18N_CONFIG } from '@config/constants'
import {
  ContentPageResponseSchema,
  type ContentPageResponse,
} from '@core/contracts/content/page'
import type { TeaserResponse } from '@core/contracts/content/teaser'
import type { PageItemApiResponse } from '../schemas/page'
import { localeSlugKey } from '../schemas/page'
import { mapContentfulImageToContentImage } from './content-image'

function buildSlugByLocale(
  page: PageItemApiResponse
): Record<string, string> | undefined {
  const out: Record<string, string> = {}
  for (const locale of I18N_CONFIG.supportedLanguages) {
    const s = page[localeSlugKey(locale) as keyof PageItemApiResponse]
    out[locale] = typeof s === 'string' && s ? s : page.slug
  }
  const allSame = I18N_CONFIG.supportedLanguages.every(
    (locale) => out[locale] === page.slug
  )
  return allSame ? undefined : out
}

/**
 * Builds breadcrumb from Contentful page parent chain.
 */
export function buildBreadcrumbFromPageItem(
  page: PageItemApiResponse
): { label: string; path: string }[] {
  const ancestors: { label: string; path: string }[] = []
  let parent: PageItemApiResponse['parentPage'] = page.parentPage
  while (parent?.slug) {
    ancestors.unshift({
      label: parent.pageTitle ?? parent.slug,
      path: `/${parent.slug}`,
    })
    parent = parent.parentPage as PageItemApiResponse['parentPage']
  }
  return [
    ...ancestors,
    {
      label: page.pageTitle ?? page.slug ?? '',
      path: `/${page.slug}`,
    },
  ]
}

/**
 * Maps Contentful page item + mapped components to contract ContentPageResponse.
 * Validates output with ContentPageResponseSchema from @core/contracts.
 */
export function mapPageItemToContentPageResponse(
  page: PageItemApiResponse,
  components: TeaserResponse[]
): ContentPageResponse {
  const breadcrumb = buildBreadcrumbFromPageItem(page)
  const pageTitleVisibility =
    page.pageTitleVisibility === 'visible' ||
    page.pageTitleVisibility === 'srOnly'
      ? page.pageTitleVisibility
      : undefined
  const ogImage = mapContentfulImageToContentImage(page.ogImage)
  const hasSeo =
    page.metaTitle != null ||
    page.metaDescription != null ||
    ogImage != null ||
    page.noIndex === true
  const seo = hasSeo
    ? {
        metaTitle: page.metaTitle ?? undefined,
        metaDescription: page.metaDescription ?? undefined,
        ogImage,
        noIndex: page.noIndex ?? undefined,
      }
    : undefined

  const slugByLocale = buildSlugByLocale(page)

  return ContentPageResponseSchema.parse({
    breadcrumb,
    slug: page.slug,
    slugByLocale,
    parentPageSlug: page.parentPage?.slug ?? undefined,
    pageTitle: page.pageTitle ?? page.slug,
    pageTitleVisibility,
    seo,
    components,
  })
}
