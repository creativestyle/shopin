'use client'

import { useTranslations } from 'next-intl'
import ChevronLeftIcon from '@/public/icons/chevronleft.svg'
import ChevronRightIcon from '@/public/icons/chevronright.svg'
import type { CarouselNavigationProps } from '@/types/carousel'
import { cn } from '@/lib/utils'
import { Button } from '../button'

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
        <Button
          type='button'
          variant='secondary'
          scheme='white'
          size='icon-lg'
          className={cn(
            'absolute top-[var(--carousel-arrow-position)] z-[var(--z-carousel-arrow)] -translate-y-1/2 opacity-0 shadow-[0_2px_2px_0_rgba(0,0,0,0.05)] group-hover:opacity-100 starting:opacity-0 touchscreen:hidden',
            'left-(--_fullbleed) ml-6'
          )}
          aria-label={t('previousSlide')}
          aria-controls={carouselId}
          onClick={onSlideToPrev}
        >
          <ChevronLeftIcon className='pointer-events-none size-8' />
        </Button>
      )}

      {isNextSlidePossible && (
        <Button
          type='button'
          variant='secondary'
          scheme='white'
          size='icon-lg'
          className={cn(
            'absolute top-[var(--carousel-arrow-position)] z-[var(--z-carousel-arrow)] -translate-y-1/2 opacity-0 shadow-[0_2px_2px_0_rgba(0,0,0,0.05)] group-hover:opacity-100 starting:opacity-0 touchscreen:hidden',
            'right-(--_fullbleed) mr-6'
          )}
          aria-label={t('nextSlide')}
          aria-controls={carouselId}
          onClick={onSlideToNext}
        >
          <ChevronRightIcon className='pointer-events-none size-8' />
        </Button>
      )}
    </div>
  )
}
