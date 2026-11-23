'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
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
  label,
  isSelected,
  onSelect,
}: {
  item: GalleryThumbnailStripImage
  idx: number
  label: string
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
      aria-label={item.alt || label}
      aria-pressed={isSelected}
    >
      <Image
        loader={productImageLoader(item.src)}
        src={item.src}
        alt=''
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
  const t = useTranslations('product.gallery')
  const carouselRef = useRef<CarouselRef>(null)
  const thumbnailsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollToSlide(selectedIndex)
    } else if (thumbnailsRef.current) {
      const selectedThumb = thumbnailsRef.current.children[selectedIndex] as
        | HTMLElement
        | undefined
      const prefersReducedMotion = window.matchMedia?.(
        '(prefers-reduced-motion: reduce)'
      ).matches
      selectedThumb?.scrollIntoView?.({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
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
    <div className='shrink-0 md:pb-4'>
      <div
        className={cn(
          'w-full bg-white px-3 py-4 md:mx-auto md:w-fit md:max-w-[364px] md:rounded-[16px] md:py-3',
          // Room for the sm arrows, which sit outside the scroller
          needsCarousel && 'px-11 md:px-3 touchscreen:px-3'
        )}
      >
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
                    label={t('thumbnailAria', {
                      current: idx + 1,
                      total: images.length,
                    })}
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
            className='no-scrollbar flex gap-2 overflow-x-auto scroll-smooth-motion [-ms-overflow-style:none]'
          >
            {images.map((item, idx) => (
              <div
                key={idx}
                className='w-[50px] shrink-0 md:h-[65px] md:w-auto'
              >
                <ThumbnailButton
                  item={item}
                  idx={idx}
                  label={t('thumbnailAria', {
                    current: idx + 1,
                    total: images.length,
                  })}
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
