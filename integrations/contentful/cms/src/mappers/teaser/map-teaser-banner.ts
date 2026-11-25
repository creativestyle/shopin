import type { BannerTeaser } from '@core/contracts/content/teaser-banner'
import type { TeaserBannerApiResponse } from '../../schemas/teaser/teaser-banner'
import { mapButtonEntryToCmsButton } from '../cms-link'
import { mapContentfulImageToContentImage } from '../content-image'

/** Maps Contentful TeaserBanner entry to contract BannerTeaser. */
export function mapTeaserBanner(entry: TeaserBannerApiResponse): BannerTeaser {
  return {
    type: 'banner',
    backgroundImage: mapContentfulImageToContentImage(entry.backgroundImage),
    headline: entry.headline ?? undefined,
    body: entry.body ?? undefined,
    cta: mapButtonEntryToCmsButton(entry.cta),
  }
}
