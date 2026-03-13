import type { ImageTeaser } from '@core/contracts/content/teaser-image'
import type { TeaserImageApiResponse } from '../../schemas/teaser/teaser-image'
import { mapLinkEntryToCmsLink } from '../cms-link'
import { mapContentfulImageToContentImage } from '../content-image'

/** Maps Contentful TeaserImage entry to contract ImageTeaser. */
export function mapTeaserImage(entry: TeaserImageApiResponse): ImageTeaser {
  return {
    type: 'image',
    title: entry.title ?? undefined,
    image: mapContentfulImageToContentImage(entry.image),
    caption: entry.caption ?? undefined,
    link: mapLinkEntryToCmsLink(entry.link),
  }
}
