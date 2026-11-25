import type { ProductCarouselTeaser } from '@core/contracts/content/teaser-product-carousel'
import type { TeaserProductCarouselApiResponse } from '../../schemas/teaser/teaser-product-carousel'

/** Maps Contentful TeaserProductCarousel entry to contract ProductCarouselTeaser. */
export function mapTeaserProductCarousel(
  entry: TeaserProductCarouselApiResponse
): ProductCarouselTeaser {
  return {
    type: 'productCarousel',
    title: entry.title ?? undefined,
    categorySlug: entry.categorySlug ?? undefined,
  }
}
