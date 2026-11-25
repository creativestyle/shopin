import type { HeadlineTeaser } from '@core/contracts/content/teaser-headline'
import type { TeaserHeadlineApiResponse } from '../../schemas/teaser/teaser-headline'
import { mapButtonEntryToCmsButton } from '../cms-link'

/** Maps Contentful TeaserHeadline entry to contract HeadlineTeaser. */
export function mapTeaserHeadline(
  entry: TeaserHeadlineApiResponse
): HeadlineTeaser {
  return {
    type: 'headline',
    headline: entry.headline ?? '',
    subtext: entry.subtext ?? undefined,
    cta: mapButtonEntryToCmsButton(entry.cta),
  }
}
