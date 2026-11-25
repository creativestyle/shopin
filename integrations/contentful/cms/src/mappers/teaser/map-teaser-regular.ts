import type { RegularTeaser } from '@core/contracts/content/teaser-regular'
import type { TeaserRegularApiResponse } from '../../schemas/teaser/teaser-regular'
import { mapButtonEntryToCmsButton } from '../cms-link'
import { mapContentfulImageToContentImage } from '../content-image'

/** Maps Contentful TeaserRegular entry to contract RegularTeaser. */
export function mapTeaserRegular(
  entry: TeaserRegularApiResponse
): RegularTeaser {
  return {
    type: 'regular',
    categoryLabel: entry.categoryLabel ?? undefined,
    headline: entry.headline ?? undefined,
    body: entry.body ?? undefined,
    cta: mapButtonEntryToCmsButton(entry.cta),
    image: mapContentfulImageToContentImage(entry.image),
  }
}
