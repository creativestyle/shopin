import { z } from 'zod'
import { LocalizedStringApiResponseSchema } from './localized-string'

// Reference to a parent category
export const CategoryReferenceSchema = z.object({
  typeId: z.literal('category'),
  id: z.string(),
})

export const CategoryApiResponseSchema = z.object({
  id: z.string(),
  name: LocalizedStringApiResponseSchema,
  slug: LocalizedStringApiResponseSchema,
  parent: CategoryReferenceSchema.optional(),
})

export const CategoryPagedQueryApiResponseSchema = z.object({
  results: z.array(CategoryApiResponseSchema),
})

export type CategoryReference = z.infer<typeof CategoryReferenceSchema>
export type CategoryApiResponse = z.infer<typeof CategoryApiResponseSchema>
export type CategoryPagedQueryApiResponse = z.infer<
  typeof CategoryPagedQueryApiResponseSchema
>
