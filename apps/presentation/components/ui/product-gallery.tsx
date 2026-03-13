'use client'

import React from 'react'
import type { ProductGalleryResponse } from '@core/contracts/product/product-gallery'
import { cn } from '@/lib/utils'
import { GalleryImage } from '@/components/ui/gallery-image'
import { GradientOverlay } from '@/components/ui/gradient-overlay'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import PlusIcon from '@/public/icons/plus.svg'
import { Carousel, CarouselSlide } from '@/components/ui/carousel'
import { GalleryDialog } from '@/components/ui/gallery-dialog'

export interface ProductGalleryProps extends ProductGalleryResponse {
  className?: string
  initialVisible?: number
  hasVideo?: boolean
  video?: { src: string; poster: string; alt?: string }
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  className,
  initialVisible = 2,
  // hasVideo and video are intentionally ignored for now
}) => {
  const t = useTranslations('product.gallery')
  const [visibleCount, setVisibleCount] = React.useState(initialVisible)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogIndex, setDialogIndex] = React.useState(0)

  const canShowMore = images.length > visibleCount

  const openDialog = (index: number) => {
    setDialogIndex(index)
    setDialogOpen(true)
  }

  // Prepare tiles: images only
  const tiles = images.map((img, idx) => (
    <GalleryImage
      key={idx}
      src={img.src}
      alt={img.alt}
      onZoom={() => openDialog(idx)}
      loading={idx < visibleCount ? 'eager' : undefined}
    />
  ))

  const visibleTiles = tiles.slice(0, visibleCount)
  const truncatedTiles = tiles.slice(visibleCount, visibleCount + 2)

  // All images for mobile carousel
  const carouselSlides = images.map((img, idx) => (
    <CarouselSlide
      key={`carousel-${idx}`}
      className='h-84 lg:h-auto'
    >
      <GalleryImage
        src={img.src}
        alt={img.alt}
        onZoom={() => openDialog(idx)}
        className='h-full lg:aspect-square lg:h-auto'
        loading={idx === 0 ? 'eager' : undefined}
      />
    </CarouselSlide>
  ))

  return (
    <div className={cn('relative', className)}>
      {/* Mobile Carousel (up to 1024px) */}
      <div className='lg:hidden'>
        <Carousel
          gridConfig={{
            base: 1,
            sm: 1.5,
            md: 2,
          }}
          navigation={images.length > 1}
          scrollbar={images.length > 1}
        >
          {carouselSlides}
        </Carousel>
      </div>

      {/* Desktop Grid (1024px and above) */}
      <div className='hidden grid-cols-2 gap-4 lg:grid'>
        {visibleTiles}

        {canShowMore && (
          <>
            {/* Truncated previews to hint more content */}
            {truncatedTiles.map((node, i) => (
              <div
                key={`trunc-${i}`}
                className='relative h-30 overflow-hidden rounded-lg'
              >
                {node}
              </div>
            ))}

            {/* Gradient + Load more */}
            <div className='relative col-span-2'>
              <GradientOverlay
                direction='bottom'
                className='rounded-b-lg'
              />
              <div className='relative z-10 -mt-6'>
                <div className='flex w-full items-center justify-center'>
                  <Button
                    variant='tertiary'
                    scheme='black'
                    data-testid='load-more-photos'
                    onClick={() => setVisibleCount((v) => v + 4)}
                  >
                    <PlusIcon
                      className='size-4'
                      aria-hidden='true'
                    />
                    {t('loadMore')}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {images.length > 0 && (
        <GalleryDialog
          images={images}
          startIndex={dialogIndex}
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  )
}
