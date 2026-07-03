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
  showOnTouch = false,
  className,
}: CarouselNavigationProps & { className?: string }) {
  const t = useTranslations('carousel')
  const isAtStart = currentIndex === 1
  const usesTouchNavigationStyle = showOnTouch
  const buttonClassName = cn(
    'absolute top-[var(--carousel-arrow-position)] z-[var(--z-carousel-arrow)] -translate-y-1/2 opacity-0 shadow-[0_2px_2px_0_rgba(0,0,0,0.05)] group-hover:opacity-100 starting:opacity-0',
    usesTouchNavigationStyle
      ? 'h-[50px] w-[50px] min-w-[50px] rounded-none touchscreen:opacity-100'
      : 'touchscreen:hidden'
  )
  const iconClassName = usesTouchNavigationStyle
    ? 'pointer-events-none size-6'
    : 'pointer-events-none size-8'

  return (
    <div className={className}>
      {!isAtStart && (
        <Button
          type='button'
          variant='secondary'
          scheme='white'
          size={usesTouchNavigationStyle ? 'auto' : 'icon-lg'}
          className={cn(
            buttonClassName,
            usesTouchNavigationStyle
              ? 'left-(--_fullbleed)'
              : 'left-(--_fullbleed) ml-6'
          )}
          aria-label={t('previousSlide')}
          aria-controls={carouselId}
          onClick={onSlideToPrev}
        >
          <ChevronLeftIcon className={iconClassName} />
        </Button>
      )}

      {isNextSlidePossible && (
        <Button
          type='button'
          variant='secondary'
          scheme='white'
          size={usesTouchNavigationStyle ? 'auto' : 'icon-lg'}
          className={cn(
            buttonClassName,
            usesTouchNavigationStyle
              ? 'right-(--_fullbleed)'
              : 'right-(--_fullbleed) mr-6'
          )}
          aria-label={t('nextSlide')}
          aria-controls={carouselId}
          onClick={onSlideToNext}
        >
          <ChevronRightIcon className={iconClassName} />
        </Button>
      )}
    </div>
  )
}
