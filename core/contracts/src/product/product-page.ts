import { z } from 'zod'
import { ProductDetailsResponseSchema } from './product-details'
import { PageResponseSchema } from '../page/page'

export const ProductPageResponseSchema = PageResponseSchema.extend({
  product: ProductDetailsResponseSchema,
})

export type ProductPageResponse = z.infer<typeof ProductPageResponseSchema>

export const ProductSlugSchema = z
  .string()
  .min(1, 'Product slug is required')
  .max(255, 'Product slug is too long')

export const VariantIdSchema = z
  .string()
  .min(1, 'Variant ID must not be empty')
  .max(255, 'Variant ID is too long')
  .optional()

export const ProductPageRequestSchema = z.object({
  productSlug: ProductSlugSchema,
  variantId: VariantIdSchema,
})

export type ProductPageRequest = z.infer<typeof ProductPageRequestSchema>
