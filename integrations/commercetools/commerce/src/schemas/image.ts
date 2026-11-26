import { z } from 'zod'

export const ImageApiResponseSchema = z.object({
  url: z.string(),
  label: z.string().optional(),
})

export type ImageApiResponse = z.infer<typeof ImageApiResponseSchema>
