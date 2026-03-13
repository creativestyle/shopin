import { z } from 'zod'

export const CrumbResponseSchema = z.object({
  label: z.string(),
  path: z.string(),
})

export type CrumbResponse = z.infer<typeof CrumbResponseSchema>
