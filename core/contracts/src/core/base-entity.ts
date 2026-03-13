import { z } from 'zod'

export const BaseEntityResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
})

export type BaseEntityResponse = z.infer<typeof BaseEntityResponseSchema>
