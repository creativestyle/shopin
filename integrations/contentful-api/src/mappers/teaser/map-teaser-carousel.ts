import type { CarouselTeaser } from '@core/contracts/content/teaser-carousel'
import type { TeaserCarouselApiResponse } from '../../schemas/teaser/teaser-carousel'
import { mapLinkEntryToCmsLink, mapButtonEntryToCmsButton } from '../cms-link'
import { mapContentfulImageToContentImage } from '../content-image'

/** Maps Contentful TeaserCarousel entry to contract CarouselTeaser. */
export function mapTeaserCarousel(
  entry: TeaserCarouselApiResponse
): CarouselTeaser {
  const items = (entry.carouselItemsCollection?.items ?? []).map(
    (carouselItem) => ({
      image: mapContentfulImageToContentImage(carouselItem.image),
      caption: carouselItem.caption ?? undefined,
      link: mapLinkEntryToCmsLink(carouselItem.link),
      headline: carouselItem.headline ?? undefined,
      body: carouselItem.body ?? undefined,
      cta: mapButtonEntryToCmsButton(carouselItem.cta),
    })
  )
  return {
    type: 'carousel',
    title: entry.title ?? undefined,
    items,
  }
}
