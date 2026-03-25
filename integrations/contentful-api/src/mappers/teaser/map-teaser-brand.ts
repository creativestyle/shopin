import type { BrandTeaser } from '@core/contracts/content/teaser-brand'
import type { TeaserBrandApiResponse } from '../../schemas/teaser/teaser-brand'
import { mapContentfulImageToContentImage } from '../content-image'
import { mapLinkEntryToCmsLink } from '../cms-link'

type MappedBrandItem = {
  image: NonNullable<ReturnType<typeof mapContentfulImageToContentImage>>
  caption: string | undefined
  link: ReturnType<typeof mapLinkEntryToCmsLink>
}

function hasMappedImage(item: {
  image: ReturnType<typeof mapContentfulImageToContentImage>
  caption: string | undefined
  link: ReturnType<typeof mapLinkEntryToCmsLink>
}): item is MappedBrandItem {
  return item.image !== undefined
}

/** Maps Contentful TeaserBrand entry to contract BrandTeaser. */
export function mapTeaserBrand(entry: TeaserBrandApiResponse): BrandTeaser {
  const items = (entry.brandItemsCollection?.items ?? [])
    .map((item) => ({
      image: mapContentfulImageToContentImage(item.image),
      caption: item.caption ?? undefined,
      link: mapLinkEntryToCmsLink(item.link),
    }))
    .filter(hasMappedImage)
  return {
    type: 'brand',
    title: entry.title ?? undefined,
    items,
  }
}
