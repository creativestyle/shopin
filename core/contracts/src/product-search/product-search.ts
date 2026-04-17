import { z } from 'zod'
import { ProductCardResponseSchema } from '../product-collection/product-card'
import { FacetsResponseSchema } from '../product-collection/facet'
import { PriceRangeSchema } from '../product-collection/product-collection'
import { MIN_SEARCH_QUERY_LENGTH } from '@config/constants'

export const ProductSearchQuerySchema = z
  .string()
  .min(MIN_SEARCH_QUERY_LENGTH, 'searchResults.errors.queryMinLength')
  .max(200, 'searchResults.errors.queryMaxLength')

export const ProductSearchResponseSchema = z.object({
  suggestions: z.array(z.string()).optional(),
  products: z.array(ProductCardResponseSchema),
  facets: FacetsResponseSchema.optional(),
  priceRange: PriceRangeSchema.optional(),
  total: z.number().int().min(0),
})

export type ProductSearchResponse = z.infer<typeof ProductSearchResponseSchema>
