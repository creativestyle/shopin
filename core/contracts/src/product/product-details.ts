import { z } from 'zod'
import { ProductGalleryResponseSchema } from './product-gallery'
import { BasicPriceResponseSchema } from '../core/basic-price'
import { BadgeResponseSchema } from '../core/badge'
import { BaseEntityResponseSchema } from '../core/base-entity'
import { ConfigurableOptionResponseSchema } from './configurable-option'

export const ProductDetailsResponseSchema = BaseEntityResponseSchema.extend({
  variantId: z.string().optional(),
  price: BasicPriceResponseSchema,
  gallery: ProductGalleryResponseSchema,
  description: z.string(),
  seoText: z.string().optional(),
  badges: z.array(BadgeResponseSchema).optional(),
  deliveryEstimate: z.string().optional(),
  configurableOptions: z.array(ConfigurableOptionResponseSchema).optional(),
  variants: z
    .array(
      z.object({
        id: z.string(),
        attributes: z.record(z.string(), z.string()),
      })
    )
    .optional(),
  /**
   * Product slug per RFC 5646 locale (e.g. { 'en-US': 'red-shoes', 'de-DE': 'rote-schuhe' }).
   * Used by the language switcher to resolve the localized product URL.
   */
  slugByLocale: z.record(z.string(), z.string()).optional(),
})

export type ProductDetailsResponse = z.infer<
  typeof ProductDetailsResponseSchema
>
