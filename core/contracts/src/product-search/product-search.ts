import { z } from 'zod'
import { ProductCardResponseSchema } from '../product-collection/product-card'

export const ProductSearchQuerySchema = z
  .string()
  .min(3, 'Search query must be at least 3 characters')
  .max(200, 'Search query is too long')

export const ProductSearchResponseSchema = z.object({
  suggestions: z.array(z.string()),
  products: z.array(ProductCardResponseSchema),
})

export type ProductSearchResponse = z.infer<typeof ProductSearchResponseSchema>
