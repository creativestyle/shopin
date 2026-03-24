import { z } from 'zod'
import { ImageTeaserSchema } from './teaser-image'
import { CarouselTeaserSchema } from './teaser-carousel'
import { HeadlineTeaserSchema } from './teaser-headline'
import { TextTeaserSchema } from './teaser-text'
import { RichTextTeaserSchema } from './teaser-rich-text'
import { BannerTeaserSchema } from './teaser-banner'
import { HeroTeaserSchema } from './teaser-hero'
import { ProductCarouselTeaserSchema } from './teaser-product-carousel'
import { SliderTeaserSchema } from './teaser-slider'
import { SectionTeaserSchema } from './teaser-section'
import { RegularTeaserSchema } from './teaser-regular'
import { AccordionTeaserSchema } from './teaser-accordion'
import { BrandTeaserSchema } from './teaser-brand'

/** Discriminated union of all teaser/component types */
export const TeaserResponseSchema = z.discriminatedUnion('type', [
  ImageTeaserSchema,
  CarouselTeaserSchema,
  HeadlineTeaserSchema,
  TextTeaserSchema,
  RichTextTeaserSchema,
  BannerTeaserSchema,
  HeroTeaserSchema,
  ProductCarouselTeaserSchema,
  SliderTeaserSchema,
  SectionTeaserSchema,
  RegularTeaserSchema,
  AccordionTeaserSchema,
  BrandTeaserSchema,
])

export type TeaserResponse = z.infer<typeof TeaserResponseSchema>

/** Type guard: narrows teaser to the variant with the given type. Use instead of casting. */
export function isTeaserOfType<T extends TeaserResponse['type']>(
  teaser: TeaserResponse,
  type: T
): teaser is Extract<TeaserResponse, { type: T }> {
  return teaser.type === type
}
