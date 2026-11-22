import { z } from 'zod'
import { ProductDetailsResponseSchema } from './product-details'
import { CrumbResponseSchema } from '../core/crumb'
import { PageSeoSchema } from '../page/page'

export const ProductResponseSchema = z.object({
  product: ProductDetailsResponseSchema,
  breadcrumb: z.array(CrumbResponseSchema),
  seo: PageSeoSchema.optional(),
})

export type ProductResponse = z.infer<typeof ProductResponseSchema>
