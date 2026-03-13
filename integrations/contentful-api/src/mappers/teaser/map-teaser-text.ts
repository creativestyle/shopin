import type { TextTeaser } from '@core/contracts/content/teaser-text'
import type { TeaserTextApiResponse } from '../../schemas/teaser/teaser-text'

/** Maps Contentful TeaserText entry to contract TextTeaser. */
export function mapTeaserText(entry: TeaserTextApiResponse): TextTeaser {
  return {
    type: 'text',
    body: entry.body ?? '',
  }
}
