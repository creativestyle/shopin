import { z } from 'zod'
import { ProductImageResponseSchema } from './product-image'

export const ProductGalleryResponseSchema = z.object({
  images: z.array(ProductImageResponseSchema),
})

export type ProductGalleryResponse = z.infer<
  typeof ProductGalleryResponseSchema
>
