'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { productImageLoader } from '@/lib/product-image-loader'
import { cn } from '@/lib/utils'
import { Carousel, CarouselSlide } from '@/components/ui/carousel'
import type { CarouselRef } from '@/types/carousel'

interface GalleryThumbnailStripImage {
  src: string
  alt?: string
}

export interface GalleryThumbnailStripProps {
  images: GalleryThumbnailStripImage[]
  selectedIndex: number
  onSelect: (index: number) => void
}

function ThumbnailButton({
  item,
  idx,
  isSelected,
  onSelect,
}: {
  item: GalleryThumbnailStripImage
  idx: number
  isSelected: boolean
  onSelect: (index: number) => void
}) {
  return (
    <button
      type='button'
      onClick={() => onSelect(idx)}
      className={cn(
        'aspect-[50/65] w-full overflow-hidden border bg-white transition-all outline-none focus-visible:ring-1 focus-visible:ring-black/20 md:aspect-auto md:h-[65px]',
        isSelected
          ? 'border-gray-700 shadow-sm'
          : 'border-transparent opacity-70 hover:opacity-100'
      )}
      aria-label={item.alt || `View image ${idx + 1}`}
      aria-pressed={isSelected}
    >
      <Image
        loader={productImageLoader(item.src)}
        src={item.src}
        alt={item.alt || ''}
        width={50}
        height={65}
        loading='lazy'
        className='size-full object-cover'
      />
    </button>
  )
}

export function GalleryThumbnailStrip({
  images,
  selectedIndex,
  onSelect,
}: GalleryThumbnailStripProps) {
  const carouselRef = useRef<CarouselRef>(null)
  const thumbnailsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollToSlide(selectedIndex)
    } else if (thumbnailsRef.current) {
      const selectedThumb = thumbnailsRef.current.children[selectedIndex] as
        | HTMLElement
        | undefined
      selectedThumb?.scrollIntoView?.({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [selectedIndex])

  if (images.length <= 1) {
    return null
  }

  const maxSlides = { base: 5, md: 6 }
  const needsCarousel = images.length > maxSlides.md

  return (
    <div className='pointer-events-none absolute inset-x-0 bottom-0 z-10 md:bottom-4'>
      <div className='pointer-events-auto w-full rounded-none bg-white px-3 py-4 md:mx-auto md:w-fit md:max-w-[364px] md:rounded-[16px] md:py-3'>
        {needsCarousel ? (
          <div className='[--_fullbleed:2px]'>
            <Carousel
              ref={carouselRef}
              gridConfig={{ base: 5.2, md: 6 }}
              navigation
              navigationSize='sm'
              navigationStep={1}
              scrollbar={false}
              fullbleed={false}
              style={{ '--carousel-gap': '8px' } as React.CSSProperties}
            >
              {images.map((item, idx) => (
                <CarouselSlide key={idx}>
                  <ThumbnailButton
                    item={item}
                    idx={idx}
                    isSelected={idx === selectedIndex}
                    onSelect={onSelect}
                  />
                </CarouselSlide>
              ))}
            </Carousel>
          </div>
        ) : (
          <div
            ref={thumbnailsRef}
            className='flex gap-2 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          >
            {images.map((item, idx) => (
              <div
                key={idx}
                className='w-[50px] shrink-0 md:h-[65px] md:w-auto'
              >
                <ThumbnailButton
                  item={item}
                  idx={idx}
                  isSelected={idx === selectedIndex}
                  onSelect={onSelect}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
