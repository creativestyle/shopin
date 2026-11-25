import { z } from 'zod'
import { AttributeDefinitionApiResponseSchema } from './attribute'

export const ProductTypeObjApiResponseSchema = z.object({
  attributes: z.array(AttributeDefinitionApiResponseSchema).optional(),
})

export const ProductTypeReferenceApiResponseSchema = z.object({
  typeId: z.literal('product-type'),
  id: z.string(),
  obj: ProductTypeObjApiResponseSchema.optional(),
})
