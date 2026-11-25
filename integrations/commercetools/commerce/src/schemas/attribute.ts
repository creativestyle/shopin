import { z } from 'zod'

export const AttributeApiResponseSchema = z.object({
  name: z.string(),
  value: z.unknown(),
})

export const AttributeDefinitionApiResponseSchema = z.object({
  type: z
    .object({
      name: z.string(),
      elementType: z
        .object({
          name: z.string(),
        })
        .optional(),
    })
    .optional(),
  name: z.string(),
  label: z.record(z.string(), z.string()).optional(),
  attributeConstraint: z.string().optional(),
  level: z.enum(['Product', 'Variant']).optional(),
})

export type AttributeApiResponse = z.infer<typeof AttributeApiResponseSchema>
export type AttributeDefinitionApiResponse = z.infer<
  typeof AttributeDefinitionApiResponseSchema
>
