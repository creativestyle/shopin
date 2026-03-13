import { z } from 'zod'

export const BadgeVariantResponseSchema = z.enum([
  'green',
  'orange',
  'gray',
  'yellow',
  'blue',
  'red',
])

export type BadgeVariantResponse = z.infer<typeof BadgeVariantResponseSchema>

export const BadgeResponseSchema = z.object({
  variant: BadgeVariantResponseSchema,
  text: z.string(),
})

export type BadgeResponse = z.infer<typeof BadgeResponseSchema>
