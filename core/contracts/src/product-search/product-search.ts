import { z } from 'zod'
import { ProductCardResponseSchema } from '../product-collection/product-card'
import { FacetsResponseSchema } from '../product-collection/facet'
import { PriceRangeSchema } from '../product-collection/product-collection'

export const ProductSearchQuerySchema = z
  .string()
  .min(3, 'Search query must be at least 3 characters')
  .max(200, 'Search query is too long')

export const ProductSearchResponseSchema = z.object({
  suggestions: z.array(z.string()),
  products: z.array(ProductCardResponseSchema),
  facets: FacetsResponseSchema.optional(),
  priceRange: PriceRangeSchema.optional(),
  total: z.number().int().min(0).optional(),
})

export type ProductSearchResponse = z.infer<typeof ProductSearchResponseSchema>
