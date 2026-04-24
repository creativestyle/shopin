import { z } from 'zod'
import { LocalizedStringApiResponseSchema } from './localized-string'
import { ProductVariantApiResponseSchema } from './product-variant'
import { ProductTypeReferenceApiResponseSchema } from './product-type'
import { CategoryReferenceSchema } from './category'

export const ProductProjectionApiResponseSchema = z.object({
  id: z.string(),
  createdAt: z.iso.datetime(),
  productType: ProductTypeReferenceApiResponseSchema.optional(),
  name: LocalizedStringApiResponseSchema,
  slug: LocalizedStringApiResponseSchema,
  description: LocalizedStringApiResponseSchema.optional(),
  metaDescription: LocalizedStringApiResponseSchema.optional(),
  masterVariant: ProductVariantApiResponseSchema,
  variants: z.array(ProductVariantApiResponseSchema).optional(),
  categories: z.array(CategoryReferenceSchema).optional(),
})

export const ProductProjectionPagedQueryApiResponseSchema = z.object({
  results: z.array(ProductProjectionApiResponseSchema),
  total: z.number().int().optional(),
  count: z.number().int().optional(),
  offset: z.number().int().optional(),
  limit: z.number().int().optional(),
})

export type ProductProjectionApiResponse = z.infer<
  typeof ProductProjectionApiResponseSchema
>
export type ProductProjectionPagedQueryApiResponse = z.infer<
  typeof ProductProjectionPagedQueryApiResponseSchema
>
