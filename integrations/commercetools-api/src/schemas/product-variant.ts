import { z } from 'zod'
import { PriceApiResponseSchema } from './price'
import { ImageApiResponseSchema } from './image'
import { AttributeApiResponseSchema } from './attribute'

export const ProductVariantApiResponseSchema = z.object({
  id: z.number(),
  sku: z.string().optional(),
  prices: z.array(PriceApiResponseSchema).optional(),
  attributes: z.array(AttributeApiResponseSchema).optional(),
  images: z.array(ImageApiResponseSchema).optional(),
})

export type ProductVariantApiResponse = z.infer<
  typeof ProductVariantApiResponseSchema
>
