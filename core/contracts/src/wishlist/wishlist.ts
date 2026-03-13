import { z } from 'zod'
import { ProductCardResponseSchema } from '../product-collection/product-card'

export const WishlistItemResponseSchema = z.object({
  id: z.string(), // Line item ID in shopping list (for remove operations)
  product: ProductCardResponseSchema, // Product card data
})

export type WishlistItemResponse = z.infer<typeof WishlistItemResponseSchema>

export const WishlistResponseSchema = z.object({
  id: z.string(),
  version: z.number(),
  items: z.array(WishlistItemResponseSchema),
  itemCount: z.number(),
})

export type WishlistResponse = z.infer<typeof WishlistResponseSchema>

export const AddToWishlistRequestSchema = z.object({
  productId: z.string().optional(),
  variantId: z.string().optional(),
})

export type AddToWishlistRequest = z.infer<typeof AddToWishlistRequestSchema>

export const RemoveFromWishlistRequestSchema = z.object({
  lineItemId: z.string(),
})

export type RemoveFromWishlistRequest = z.infer<
  typeof RemoveFromWishlistRequestSchema
>
