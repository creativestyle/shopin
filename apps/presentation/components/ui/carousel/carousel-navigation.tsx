'use client'

import { useTranslations } from 'next-intl'
import ChevronLeftIcon from '@/public/icons/chevronleft.svg'
import ChevronRightIcon from '@/public/icons/chevronright.svg'
import type { CarouselNavigationProps } from '@/types/carousel'
import { cn } from '@/lib/utils'

/* TODO: Adjust button positions when tiles are impleneted! */
export function CarouselNavigation({
  currentIndex,
  isNextSlidePossible,
  onSlideToPrev,
  onSlideToNext,
  carouselId,
  className,
}: CarouselNavigationProps & { className?: string }) {
  const t = useTranslations('carousel')
  const isAtStart = currentIndex === 1

  return (
    <div className={className}>
      {!isAtStart && (
        <button
          type='button'
          className={cn(
            'absolute top-[var(--carousel-arrow-position)] z-[var(--z-carousel-arrow)] flex size-14 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white opacity-0 shadow-[0_2px_2px_0_rgba(0,0,0,0.05)] transition-colors duration-200 group-hover:opacity-100 hover:text-green-600 starting:opacity-0 touchscreen:hidden',
            'left-(--_fullbleed) ml-6'
          )}
          aria-label={t('previousSlide')}
          aria-controls={carouselId}
          onClick={onSlideToPrev}
        >
          <ChevronLeftIcon className='pointer-events-none size-6' />
        </button>
      )}

      {isNextSlidePossible && (
        <button
          type='button'
          className={cn(
            'absolute top-[var(--carousel-arrow-position)] z-[var(--z-carousel-arrow)] flex size-14 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white opacity-0 shadow-[0_2px_2px_0_rgba(0,0,0,0.05)] transition-colors duration-200 group-hover:opacity-100 hover:text-green-600 starting:opacity-0 touchscreen:hidden',
            'right-(--_fullbleed) mr-6'
          )}
          aria-label={t('nextSlide')}
          aria-controls={carouselId}
          onClick={onSlideToNext}
        >
          <ChevronRightIcon className='pointer-events-none size-6' />
        </button>
      )}
    </div>
  )
}
