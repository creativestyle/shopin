import { z } from 'zod'
import { ProductCardResponseSchema } from './product-card'
import { CrumbResponseSchema } from '../core/crumb'
import { FacetsResponseSchema } from './facet'

export const PriceRangeSchema = z.object({
  minPriceInCents: z.number().int().min(0),
  maxPriceInCents: z.number().int().min(0),
})

export type PriceRange = z.infer<typeof PriceRangeSchema>

export const CategoryTreeNodeSchema: z.ZodType<{
  id: string
  name: string
  slug: string
  children?: CategoryTreeNode[]
}> = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  children: z.lazy(() => z.array(CategoryTreeNodeSchema)).optional(),
})

export type CategoryTreeNode = z.infer<typeof CategoryTreeNodeSchema>

export const ProductCollectionResponseSchema = z.object({
  productList: z.array(ProductCardResponseSchema),
  breadcrumb: z.array(CrumbResponseSchema),
  total: z.number().int().min(0),
  facets: FacetsResponseSchema.optional(),
  priceRange: PriceRangeSchema.optional(),
  categoryTree: z.array(CategoryTreeNodeSchema).optional(),
  currentCategoryId: z.string().optional(),
})

export type ProductCollectionResponse = z.infer<
  typeof ProductCollectionResponseSchema
>
