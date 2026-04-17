'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { CarouselProps, CarouselRef } from '@/types/carousel'
import {
  CarouselScrollbar,
  CarouselNavigation,
  useCarouselConfig,
  useCarouselState,
} from './'

export const Carousel = ({
  children,
  id: idProp,
  navigation = true,
  scrollbar = true,
  gridConfig,
  className,
  style,
  onSlideChange,
  ref,
}: CarouselProps & { ref?: React.Ref<CarouselRef> }) => {
  const t = useTranslations('carousel')

  // Use stable id from parent when provided to avoid hydration mismatch with multiple carousels
  const generatedId = React.useId()
  const carouselId = idProp ?? generatedId

  // Extract slides from children (only CarouselSlide components)
  const slides = React.Children.toArray(children).filter((child) =>
    React.isValidElement(child)
  )

  // Carousel configuration hook
  const {
    slidesPerView,
    maxSlidesPerView,
    cssConfig,
    scrollBehaviorPreference,
  } = useCarouselConfig(gridConfig)

  // Carousel state hook
  const {
    scrollerRef,
    slidesRefsArray,
    isNextSlidePossible,
    isAtStart,
    slidesRenderedAmount,
    slideToPrev,
    slideToNext,
    scrollToSlide,
  } = useCarouselState({
    slides,
    slidesPerView,
    maxSlidesPerView,
    scrollBehaviorPreference,
    onSlideChange,
  })

  // Track animation frame ID for cleanup
  const animationFrameRef = React.useRef<number | null>(null)

  // Expose scrollToSlide method via ref for imperative control
  // Allows parent components to programmatically scroll to a specific slide
  // Uses requestAnimationFrame to wait for slides to be rendered before scrolling
  // This is necessary because the carousel uses progressive rendering
  React.useImperativeHandle(ref, () => ({
    scrollToSlide: (index: number) => {
      // Cancel any pending animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      const attemptScroll = () => {
        if (!scrollerRef.current || !slidesRefsArray.current[index]) {
          animationFrameRef.current = requestAnimationFrame(attemptScroll)
          return
        }

        animationFrameRef.current = null
        scrollToSlide(index)
      }

      animationFrameRef.current = requestAnimationFrame(attemptScroll)
    },
  }))

  // Cleanup animation frame on unmount
  React.useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Check if navigation/scrollbar is needed (more than one group of slides)
  const needsNavigation = slides.length > slidesPerView

  // Derive minimum slides rendered amount from maxSlidesPerView
  // Ensure we always render enough slides for smooth scrolling
  const minSlidesRenderedAmount = Math.min(slides.length, maxSlidesPerView * 3)

  // Ensure slidesRenderedAmount is at least the minimum
  const effectiveSlidesRenderedAmount = Math.max(
    slidesRenderedAmount,
    minSlidesRenderedAmount
  )

  return (
    <div
      data-role='carousel'
      role='region'
      aria-roledescription='carousel'
      aria-label={t('ariaLabel')}
      className={cn(
        'ui-fullbleed grid grid-cols-1 gap-6',
        {
          // Always reserve space for scrollbar to prevent CLS
          'grid-rows-[auto_1]': scrollbar,
          'grid-rows-1': !scrollbar,
        },
        className
      )}
      style={
        {
          ...cssConfig,
          ...style,
        } as React.CSSProperties
      }
    >
      <div className='relative row-start-1 [&:hover_button[type=button]]:opacity-100'>
        {/* Navigation arrows */}
        {navigation && needsNavigation && (
          <CarouselNavigation
            currentIndex={isAtStart ? 1 : 2}
            isNextSlidePossible={isNextSlidePossible}
            onSlideToPrev={slideToPrev}
            onSlideToNext={slideToNext}
            carouselId={carouselId}
          />
        )}

        {/* Slides container */}
        <div
          ref={scrollerRef}
          id={carouselId}
          className={cn(
            'relative no-scrollbar grid snap-mandatory items-stretch gap-(--carousel-gap)',
            'snap-x scroll-px-(--_fullbleed) auto-cols-[calc(100%/var(--carousel-slidesPerView)-((var(--carousel-slidesPerView)-1)*var(--carousel-gap))/var(--carousel-slidesPerView))] grid-flow-col overflow-x-auto overscroll-x-contain px-(--_fullbleed)',
            'lord-of-the-focus-ring'
          )}
          role='group'
          aria-live='polite'
          aria-atomic='false'
        >
          {slides.map((slide, index) => (
            <div
              key={`slider-${index}`}
              ref={(el) => {
                if (el) {
                  slidesRefsArray.current[index] = el
                }
              }}
              className='flex snap-center place-items-start sm:snap-start'
              role='group'
              aria-roledescription='slide'
              aria-label={t('slideXofY', {
                current: index + 1,
                total: slides.length,
              })}
            >
              {index < effectiveSlidesRenderedAmount && slide}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Scrollbar - Always reserve space to prevent CLS */}
      {scrollbar && (
        <div className='row-start-2 px-(--_fullbleed)'>
          {needsNavigation && <CarouselScrollbar scrollerRef={scrollerRef} />}
        </div>
      )}
    </div>
  )
}
