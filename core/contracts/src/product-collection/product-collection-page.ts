import { z } from 'zod'
import { ProductCardResponseSchema } from './product-card'
import { PageResponseSchema } from '../page/page'
import { FacetsResponseSchema } from './facet'
import { PriceRangeSchema, CategoryTreeNodeSchema } from './product-collection'
import {
  ITEMS_PER_PAGE,
  MIN_PAGE,
  MIN_ITEMS_PER_PAGE,
  MAX_ITEMS_PER_PAGE,
  VALID_SORT_OPTIONS,
  DEFAULT_SORT_OPTION,
  type SortOption,
} from '@config/constants'

export const ProductCollectionPageResponseSchema = PageResponseSchema.extend({
  productList: z.array(ProductCardResponseSchema),
  total: z.number().int().min(0),
  facets: FacetsResponseSchema.optional(),
  priceRange: PriceRangeSchema.optional(),
  categoryTree: z.array(CategoryTreeNodeSchema).optional(),
  currentCategoryId: z.string().optional(),
  slugByLocale: z.record(z.string(), z.string()).optional(),
})

export type ProductCollectionPageResponse = z.infer<
  typeof ProductCollectionPageResponseSchema
>

export const ProductCollectionSlugSchema = z
  .string()
  .min(1, 'Product collection slug is required')
  .max(255, 'Product collection slug is too long')

// Reusable schemas for pagination parameters
export const PageSchema = z.coerce
  .number()
  .int()
  .min(MIN_PAGE)
  .optional()
  .default(MIN_PAGE)
export const LimitSchema = z.coerce
  .number()
  .int()
  .min(MIN_ITEMS_PER_PAGE)
  .max(MAX_ITEMS_PER_PAGE)
  .optional()
  .default(ITEMS_PER_PAGE)

// Schema for sort parameter
export const SortSchema = z
  .string()
  .refine(
    (val): val is SortOption => VALID_SORT_OPTIONS.includes(val as SortOption),
    {
      message: `Sort must be one of: ${VALID_SORT_OPTIONS.join(', ')}`,
    }
  )
  .optional()
  .default(DEFAULT_SORT_OPTION)

// Base filters schema - Record of attribute name to array of selected values
const FiltersRecordSchema = z.record(z.string(), z.array(z.string()))

// Schema for filters parameter - parses JSON string or accepts object directly
export const FiltersSchema = z
  .union([
    // Accept direct object (for programmatic use)
    FiltersRecordSchema,
    // Accept JSON string (for URL query parameter)
    z.string().transform((val, ctx) => {
      if (!val) {
        return undefined
      }
      try {
        const parsed = JSON.parse(val)
        return FiltersRecordSchema.parse(parsed)
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid JSON format for filters',
        })
        return z.NEVER
      }
    }),
  ])
  .optional()

export type Filters = z.infer<typeof FiltersRecordSchema> | undefined

// Schema for saleOnly parameter - parses 'true'/'false' string or accepts boolean
export const SaleOnlySchema = z
  .union([z.boolean(), z.string().transform((val) => val === 'true')])
  .optional()
  .default(false)

// Schema for price range parameters (in cents)
export const PriceMinSchema = z.coerce.number().int().min(0).optional()

export const PriceMaxSchema = z.coerce.number().int().min(0).optional()

export const ProductCollectionPageRequestSchema = z.object({
  productCollectionSlug: ProductCollectionSlugSchema,
  page: PageSchema,
  limit: LimitSchema,
  sort: SortSchema,
  filters: FiltersSchema,
  saleOnly: SaleOnlySchema,
  priceMin: PriceMinSchema,
  priceMax: PriceMaxSchema,
})

export type ProductCollectionPageRequest = z.infer<
  typeof ProductCollectionPageRequestSchema
>
