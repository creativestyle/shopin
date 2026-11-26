import type { SliderTeaser } from '@core/contracts/content/teaser-slider'
import type { TeaserSliderApiResponse } from '../../schemas/teaser/teaser-slider'
import { mapLinkEntryToCmsLink, mapButtonEntryToCmsButton } from '../cms-link'
import { mapContentfulImageToContentImage } from '../content-image'

/** Maps Contentful TeaserSlider entry to contract SliderTeaser. */
export function mapTeaserSlider(entry: TeaserSliderApiResponse): SliderTeaser {
  const items = (entry.slidesCollection?.items ?? []).map((slide) => ({
    image: mapContentfulImageToContentImage(slide.image),
    caption: slide.caption ?? undefined,
    link: mapLinkEntryToCmsLink(slide.link),
    headline: slide.headline ?? undefined,
    body: slide.body ?? undefined,
    cta: mapButtonEntryToCmsButton(slide.cta),
  }))
  return {
    type: 'slider',
    title: entry.title ?? undefined,
    items,
  }
}
