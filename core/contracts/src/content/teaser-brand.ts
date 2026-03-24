import { z } from 'zod'
import { TeaserBrandItemSchema } from './teaser-brand-item'

export const BrandTeaserSchema = z.object({
  type: z.literal('brand'),
  title: z.string().optional(),
  items: z.array(TeaserBrandItemSchema),
})
export type BrandTeaser = z.infer<typeof BrandTeaserSchema>
