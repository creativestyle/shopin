import { z } from 'zod'
import { TeaserBannerApiResponseSchema } from './teaser-banner'
import { TeaserHeroApiResponseSchema } from './teaser-hero'
import { TeaserHeadlineApiResponseSchema } from './teaser-headline'
import { TeaserImageApiResponseSchema } from './teaser-image'
import { TeaserTextApiResponseSchema } from './teaser-text'
import { TeaserRichTextApiResponseSchema } from './teaser-rich-text'
import { TeaserCarouselApiResponseSchema } from './teaser-carousel'
import { TeaserSliderApiResponseSchema } from './teaser-slider'
import { TeaserProductCarouselApiResponseSchema } from './teaser-product-carousel'
import { TeaserSectionApiResponseSchema } from './teaser-section'
import { TeaserRegularApiResponseSchema } from './teaser-regular'
import { TeaserAccordionApiResponseSchema } from './teaser-accordion'
import { TeaserBrandApiResponseSchema } from './teaser-brand'
import { TeaserVideoApiResponseSchema } from './teaser-video'

/** Union of all teaser/component content types from Contentful. */
export const TeaserEntryApiResponseSchema = z.union([
  TeaserBannerApiResponseSchema,
  TeaserHeroApiResponseSchema,
  TeaserHeadlineApiResponseSchema,
  TeaserImageApiResponseSchema,
  TeaserTextApiResponseSchema,
  TeaserRichTextApiResponseSchema,
  TeaserCarouselApiResponseSchema,
  TeaserSliderApiResponseSchema,
  TeaserProductCarouselApiResponseSchema,
  TeaserSectionApiResponseSchema,
  TeaserRegularApiResponseSchema,
  TeaserAccordionApiResponseSchema,
  TeaserBrandApiResponseSchema,
  TeaserVideoApiResponseSchema,
])

export type TeaserEntryApiResponse = z.infer<
  typeof TeaserEntryApiResponseSchema
>
