'use client'

import { WishlistToggleButton } from './wishlist-toggle-button'

interface ProductCardWishlistButtonProps {
  productId: string
  variantId?: string
}

export function ProductCardWishlistButton({
  productId,
  variantId,
}: ProductCardWishlistButtonProps) {
  return (
    <WishlistToggleButton
      productId={productId}
      variantId={variantId}
      variant='product-card'
    />
  )
}
