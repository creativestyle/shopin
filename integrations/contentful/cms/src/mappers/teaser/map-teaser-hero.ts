import type { HeroTeaser } from '@core/contracts/content/teaser-hero'
import type { TeaserHeroApiResponse } from '../../schemas/teaser/teaser-hero'
import { mapButtonEntryToCmsButton } from '../cms-link'
import { mapContentfulImageToContentImage } from '../content-image'

/** Maps Contentful TeaserHero entry to contract HeroTeaser. */
export function mapTeaserHero(entry: TeaserHeroApiResponse): HeroTeaser {
  return {
    type: 'hero',
    backgroundImage: mapContentfulImageToContentImage(entry.backgroundImage),
    headline: entry.headline ?? undefined,
    body: entry.body ?? undefined,
    cta: mapButtonEntryToCmsButton(entry.cta),
  }
}
