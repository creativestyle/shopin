import type { BrandTeaser } from '@core/contracts/content/teaser-brand'
import type { TeaserBrandApiResponse } from '../../schemas/teaser/teaser-brand'
import { mapContentfulImageToContentImage } from '../content-image'
import { mapLinkEntryToCmsLink } from '../cms-link'

/** Maps Contentful TeaserBrand entry to contract BrandTeaser. */
export function mapTeaserBrand(entry: TeaserBrandApiResponse): BrandTeaser {
  const items = (entry.brandItemsCollection?.items ?? [])
    .map((item) => ({
      image: mapContentfulImageToContentImage(item.image),
      caption: item.caption ?? undefined,
      link: mapLinkEntryToCmsLink(item.link),
    }))
    .filter((item): item is { image: NonNullable<typeof item.image>; caption: typeof item.caption; link: typeof item.link } =>
      item.image !== undefined
    )
  return {
    type: 'brand',
    title: entry.title ?? undefined,
    items,
  }
}
