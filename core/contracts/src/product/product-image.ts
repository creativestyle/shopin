import { z } from 'zod'

export const ProductImageResponseSchema = z.object({
  src: z.string(),
  alt: z.string(),
})

export type ProductImageResponse = z.infer<typeof ProductImageResponseSchema>
