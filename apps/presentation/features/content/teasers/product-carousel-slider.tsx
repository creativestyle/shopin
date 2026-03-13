'use client'

import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import { Carousel, CarouselSlide } from '@/components/ui/carousel'
import { ProductCard } from '@/components/ui/product-card'
import {
  CONTENT_CAROUSEL_GRID_CONFIG,
  CONTENT_CAROUSEL_PRELOAD_ITEM_COUNT,
} from '../lib/carousel-grid-config'

export function ProductCarouselSlider({
  products,
  locale,
  imagePreload,
  carouselId,
}: {
  products: ProductCardResponse[]
  locale: string
  imagePreload?: boolean
  carouselId?: string
}) {
  if (!products?.length) {
    return null
  }

  return (
    <Carousel
      id={carouselId}
      gridConfig={CONTENT_CAROUSEL_GRID_CONFIG}
      className='gap-4'
    >
      {products.map((product, index) => (
        <CarouselSlide key={product.id}>
          <ProductCard
            data={product}
            locale={locale}
            imagePreload={
              imagePreload && index < CONTENT_CAROUSEL_PRELOAD_ITEM_COUNT
            }
          />
        </CarouselSlide>
      ))}
    </Carousel>
  )
}
