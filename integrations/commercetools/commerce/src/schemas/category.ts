import { z } from 'zod'
import { LocalizedStringApiResponseSchema } from './localized-string'

const BaseCategoryReferenceSchema = z.object({
  typeId: z.literal('category'),
  id: z.string(),
})

const BaseCategorySchema = z.object({
  id: z.string(),
  name: LocalizedStringApiResponseSchema,
  slug: LocalizedStringApiResponseSchema,
  parent: BaseCategoryReferenceSchema.optional(),
})

const AncestorReferenceSchema = BaseCategoryReferenceSchema.extend({
  obj: BaseCategorySchema.optional(),
})

export const CategoryApiResponseSchema = BaseCategorySchema.extend({
  ancestors: z.array(AncestorReferenceSchema).optional(),
})

export const CategoryReferenceSchema = BaseCategoryReferenceSchema.extend({
  obj: CategoryApiResponseSchema.optional(),
})

export const CategoryPagedQueryApiResponseSchema = z.object({
  results: z.array(CategoryApiResponseSchema),
})

export type CategoryReference = z.infer<typeof CategoryReferenceSchema>
export type CategoryApiResponse = z.infer<typeof CategoryApiResponseSchema>
export type CategoryPagedQueryApiResponse = z.infer<
  typeof CategoryPagedQueryApiResponseSchema
>
