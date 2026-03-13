import { z } from 'zod'
import { ProductDetailsResponseSchema } from './product-details'
import { CrumbResponseSchema } from '../core/crumb'

export const ProductResponseSchema = z.object({
  product: ProductDetailsResponseSchema,
  breadcrumb: z.array(CrumbResponseSchema),
})

export type ProductResponse = z.infer<typeof ProductResponseSchema>
