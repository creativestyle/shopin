import { z } from 'zod'

export const LogoResponseSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
})

export type LogoResponse = z.infer<typeof LogoResponseSchema>
