import { z } from 'zod'
import { BaseEntityResponseSchema } from '../core/base-entity'
import { BasicPriceResponseSchema } from '../core/basic-price'
import { ProductImageResponseSchema } from '../product/product-image'

export const ProductCardResponseSchema = BaseEntityResponseSchema.extend({
  image: ProductImageResponseSchema,
  price: BasicPriceResponseSchema,
  variantId: z.string().optional(),
  variantCount: z.number().optional(),
})

export type ProductCardResponse = z.infer<typeof ProductCardResponseSchema>
