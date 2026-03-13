import type { ContentPageResponse } from '@core/contracts/content/page'
import type { ContentImage } from '@core/contracts/content/content-image'
import { defaultBasePage, placeholderImage } from './base'

export function getDefaultPage(
  slug: string,
  placeholder: (
    w: number,
    h: number,
    title?: string
  ) => ContentImage = placeholderImage
): ContentPageResponse {
  const title = slug.charAt(0).toUpperCase() + slug.slice(1)
  return {
    ...defaultBasePage,
    slug,
    parentPageSlug: 'homepage',
    breadcrumb: [
      ...defaultBasePage.breadcrumb,
      { label: slug, path: `/${slug}` },
    ],
    pageTitle: title,
    pageTitleVisibility: 'visible',
    components: [
      {
        type: 'headline',
        headline: title,
        subtext: 'Content from mock API.',
        cta: { link: { label: 'Explore', url: `/${slug}` } },
      },
      {
        type: 'image',
        title: 'Featured',
        image: placeholder(400, 300, 'Featured'),
        caption: 'Discover more.',
        link: { label: 'Featured', url: '/new' },
      },
      {
        type: 'text',
        body: 'This page is served by the mock content API. Switch to Contentful in the data source selector to use CMS content.',
      },
    ],
  }
}
