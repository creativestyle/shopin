import React from 'react'
import { cn } from '@/lib/utils'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import { ProductCard } from './product-card'
import { getProductVariantKey } from '@/lib/product-utils'
import { AddToCart } from '@/features/cart/cart-add-to-cart'

interface ProductGridProps {
  products: ProductCardResponse[]
  className?: string
  locale: string
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  className,
  locale,
}) => {
  return (
    <div
      className={cn(
        'mx-auto grid w-full max-w-full justify-center justify-items-center gap-6',
        // Mobile: 2 columns
        'grid-cols-2',
        // Tablet: 3 columns
        'sm:grid-cols-3',
        // Desktop: 2 columns
        'md:grid-cols-3',
        // Large desktop: 3 columns
        'lg:grid-cols-3',
        // Extra large: 4 columns
        'xl:grid-cols-4',
        className
      )}
    >
      {products.map((product) => (
        <ProductCard
          key={getProductVariantKey(product.id, product.variantId)}
          data={product}
          locale={locale}
          actions={
            <AddToCart
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              variantId={product.variantId}
              variantCount={product.variantCount}
              variant='primary'
              className='z-2 w-full'
            />
          }
        />
      ))}
    </div>
  )
}
