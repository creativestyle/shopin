import { z } from 'zod'
import { ProductCardResponseSchema } from '../product-collection/product-card'

// Base link schema without children (used for deepest level - level 4)
const BaseLinkSchema = z.object({
  text: z.string(),
  href: z.string(),
  target: z.enum(['_blank', '_self', '_parent', '_top']).optional(),
  isHighlighted: z.boolean().optional(),
})

// 3rd level link with optional 4th level children
export const ThirdLevelLinkSchema = BaseLinkSchema.extend({
  children: z.array(BaseLinkSchema).optional(),
})

// 2nd level link with optional 3rd level children
export const SubcategoryLinkSchema = BaseLinkSchema.extend({
  children: z.array(ThirdLevelLinkSchema).optional(),
})

// Top level link with optional 2nd level children (subcategories) and featured product
export const LinkResponseSchema = BaseLinkSchema.extend({
  children: z.array(SubcategoryLinkSchema).optional(),
  featuredProduct: ProductCardResponseSchema.optional(),
})

export type LinkResponse = z.infer<typeof LinkResponseSchema>
export type SubcategoryLink = z.infer<typeof SubcategoryLinkSchema>
export type ThirdLevelLink = z.infer<typeof ThirdLevelLinkSchema>
export type BaseLink = z.infer<typeof BaseLinkSchema>
