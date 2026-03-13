import type { TeaserResponse } from '@core/contracts/content/teaser'
import type { TeaserEntryApiResponse } from '../../schemas/teaser'
import { mapTeaserBanner } from './map-teaser-banner'
import { mapTeaserHero } from './map-teaser-hero'
import { mapTeaserHeadline } from './map-teaser-headline'
import { mapTeaserImage } from './map-teaser-image'
import { mapTeaserText } from './map-teaser-text'
import { mapTeaserRichText } from './map-teaser-rich-text'
import { mapTeaserCarousel } from './map-teaser-carousel'
import { mapTeaserSlider } from './map-teaser-slider'
import { mapTeaserProductCarousel } from './map-teaser-product-carousel'
import { mapTeaserSection } from './map-teaser-section'
import { mapTeaserRegular } from './map-teaser-regular'
import { mapTeaserAccordion } from './map-teaser-accordion'

/**
 * Maps a Contentful teaser/component entry to contract TeaserResponse.
 */
export function mapTeaserEntryToResponse(
  entry: TeaserEntryApiResponse
): TeaserResponse | null {
  switch (entry.__typename) {
    case 'TeaserBanner':
      return mapTeaserBanner(entry)
    case 'TeaserHero':
      return mapTeaserHero(entry)
    case 'TeaserHeadline':
      return mapTeaserHeadline(entry)
    case 'TeaserImage':
      return mapTeaserImage(entry)
    case 'TeaserText':
      return mapTeaserText(entry)
    case 'TeaserRichText':
      return mapTeaserRichText(entry)
    case 'TeaserCarousel':
      return mapTeaserCarousel(entry)
    case 'TeaserSlider':
      return mapTeaserSlider(entry)
    case 'TeaserProductCarousel':
      return mapTeaserProductCarousel(entry)
    case 'TeaserSection':
      return mapTeaserSection(entry)
    case 'TeaserRegular':
      return mapTeaserRegular(entry)
    case 'TeaserAccordion':
      return mapTeaserAccordion(entry)
    default:
      return null
  }
}
