'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
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

export function GalleryThumbnailStrip({
  images,
  selectedIndex,
  onSelect,
}: GalleryThumbnailStripProps) {
  const carouselRef = useRef<CarouselRef>(null)

  useEffect(() => {
    carouselRef.current?.scrollToSlide(selectedIndex)
  }, [selectedIndex])

  if (images.length <= 1) {
    return null
  }

  return (
    <div className='pointer-events-none absolute inset-x-0 bottom-0 z-10 md:bottom-4'>
      <div className='pointer-events-auto w-full rounded-none bg-white px-3 py-4 md:mx-auto md:max-w-[364px] md:rounded-[16px] md:py-3'>
        <div className='[--_fullbleed:2px]'>
          <Carousel
            ref={carouselRef}
            gridConfig={{ base: 5.2, md: 6 }}
            navigation={images.length > 6}
            navigationSize='sm'
            navigationStep={1}
            scrollbar={false}
            fullbleed={false}
            style={{ '--carousel-gap': '8px' } as React.CSSProperties}
          >
            {images.map((item, idx) => {
              const isSelected = idx === selectedIndex

              return (
                <CarouselSlide key={idx}>
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
                      src={item.src}
                      alt={item.alt || ''}
                      width={50}
                      height={65}
                      loading='lazy'
                      className='size-full object-cover'
                    />
                  </button>
                </CarouselSlide>
              )
            })}
          </Carousel>
        </div>
      </div>
    </div>
  )
}
