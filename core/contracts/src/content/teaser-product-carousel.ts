import { z } from 'zod'
import { ProductCardResponseSchema } from '../product-collection/product-card'

export const ProductCarouselTeaserSchema = z.object({
  type: z.literal('productCarousel'),
  title: z.string().optional(),
  categorySlug: z.string().optional(),
  products: z.array(ProductCardResponseSchema).optional(),
})
export type ProductCarouselTeaser = z.infer<typeof ProductCarouselTeaserSchema>
