import type { ContentPageResponse } from '@core/contracts/content/page'

export const defaultBasePage: Pick<
  ContentPageResponse,
  'breadcrumb' | 'slug' | 'pageTitle' | 'pageTitleVisibility' | 'seo'
> = {
  breadcrumb: [{ label: 'Home', path: '/' }],
  slug: 'homepage',
  pageTitle: 'Home',
  pageTitleVisibility: 'visible',
  seo: {
    metaTitle: 'Shopin Store – Home',
    metaDescription:
      'Shop the best selection. Free returns, secure payment, sustainable choices.',
    ogImage: {
      url: '/og-image.png',
      alt: '',
      width: 1200,
      height: 630,
    },
  },
}

export function placeholderImage(
  width: number,
  height: number,
  title?: string
): { url: string; alt: string; width: number; height: number; title?: string } {
  return {
    url: '/images/placeholder.svg',
    alt: title ?? '',
    width,
    height,
    ...(title && { title }),
  }
}
