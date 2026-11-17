'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import ChevronLeftIcon from '@/public/icons/chevron-left.svg'
import ChevronRightIcon from '@/public/icons/chevron-right.svg'
import type { CarouselNavigationProps } from '@/types/carousel'
import { cn } from '@/lib/utils'
import { Button } from '../button'

type NavDirection = 'prev' | 'next'

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

  const prevButtonRef = useRef<HTMLButtonElement | null>(null)
  const nextButtonRef = useRef<HTMLButtonElement | null>(null)
  const lostFocusRef = useRef<{
    from: HTMLButtonElement
    to: NavDirection
  } | null>(null)

  // Remember focus when a focused arrow unmounts at the carousel boundary
  const createButtonRef =
    (direction: NavDirection) => (el: HTMLButtonElement | null) => {
      const ref = direction === 'prev' ? prevButtonRef : nextButtonRef
      ref.current = el
      return () => {
        ref.current = null
        if (el && el.ownerDocument.activeElement === el) {
          lostFocusRef.current = {
            from: el,
            to: direction === 'prev' ? 'next' : 'prev',
          }
        }
      }
    }
  const [prevButtonCallbackRef] = useState(() => createButtonRef('prev'))
  const [nextButtonCallbackRef] = useState(() => createButtonRef('next'))

  // Move focus to the opposite arrow, or the scroller, instead of <body>
  useLayoutEffect(() => {
    const lostFocus = lostFocusRef.current
    if (!lostFocus) {
      return
    }
    lostFocusRef.current = null
    if (lostFocus.from.isConnected) {
      return
    }
    const button =
      lostFocus.to === 'next' ? nextButtonRef.current : prevButtonRef.current
    ;(button ?? document.getElementById(carouselId))?.focus()
  })

  return (
    <div className={className}>
      {!isAtStart && (
        <Button
          ref={prevButtonCallbackRef}
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
          ref={nextButtonCallbackRef}
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
