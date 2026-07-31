'use client'

import { useTranslations } from 'next-intl'
import ChevronLeftIcon from '@/public/icons/chevron-left.svg'
import ChevronRightIcon from '@/public/icons/chevron-right.svg'
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
  size,
  className,
}: CarouselNavigationProps & { className?: string }) {
  const t = useTranslations('carousel')
  const isAtStart = currentIndex === 1
  const isSm = size === 'sm'

  const buttonSize = isSm ? ('icon-sm' as const) : ('icon-lg' as const)
  const iconSize = isSm ? 'size-4' : 'size-8'
  const commonClasses = isSm
    ? 'shadow-sm'
    : 'opacity-0 shadow-[0_2px_2px_0_rgba(0,0,0,0.05)] group-hover:opacity-100 starting:opacity-0'
  const prevPositionClasses = isSm
    ? 'left-0 -ml-1 -translate-x-full'
    : 'left-(--_fullbleed) ml-6'
  const nextPositionClasses = isSm
    ? 'right-0 translate-x-full'
    : 'right-(--_fullbleed) mr-6'

  return (
    <div className={className}>
      {!isAtStart && (
        <Button
          type='button'
          variant='secondary'
          scheme='white'
          size={buttonSize}
          className={cn(
            'absolute top-[var(--carousel-arrow-position)] z-[var(--z-carousel-arrow)] -translate-y-1/2 touchscreen:hidden',
            commonClasses,
            prevPositionClasses
          )}
          aria-label={t('previousSlide')}
          aria-controls={carouselId}
          onClick={onSlideToPrev}
        >
          <ChevronLeftIcon className={cn('pointer-events-none', iconSize)} />
        </Button>
      )}

      {isNextSlidePossible && (
        <Button
          type='button'
          variant='secondary'
          scheme='white'
          size={buttonSize}
          className={cn(
            'absolute top-[var(--carousel-arrow-position)] z-[var(--z-carousel-arrow)] -translate-y-1/2 touchscreen:hidden',
            commonClasses,
            nextPositionClasses
          )}
          aria-label={t('nextSlide')}
          aria-controls={carouselId}
          onClick={onSlideToNext}
        >
          <ChevronRightIcon className={cn('pointer-events-none', iconSize)} />
        </Button>
      )}
    </div>
  )
}
