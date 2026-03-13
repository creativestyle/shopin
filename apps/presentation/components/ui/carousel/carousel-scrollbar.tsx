'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { throttle } from '@/lib/throttle'

interface CarouselScrollbarProps {
  scrollerRef: React.RefObject<HTMLDivElement | null>
}

const INITIAL_SCROLL_PERCENTAGE = 0
const MIN_THUMB_SIZE = 20 // Minimum 20% thumb size
const MAX_THUMB_SIZE = 100 // Maximum 100% thumb size
const THROTTLE_DELAY_MS = 20 // Throttle delay in milliseconds

export function CarouselScrollbar({ scrollerRef }: CarouselScrollbarProps) {
  const t = useTranslations('carousel')
  const [scrollbarState, setScrollbarState] = useState({
    scrollPercentage: INITIAL_SCROLL_PERCENTAGE,
    thumbSize: MIN_THUMB_SIZE,
  })

  // Listen to scroll events
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) {
      return
    }

    // Calculate scroll position and thumb size
    const updateScrollbar = () => {
      if (!scrollerRef.current) {
        return
      }

      const scroller = scrollerRef.current
      const scrollLeft = scroller.scrollLeft
      const maxScroll = scroller.scrollWidth - scroller.clientWidth

      // Calculate scroll percentage
      const percentage = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0

      // Calculate thumb size based on visible vs total content ratio
      const visibleRatio = scroller.clientWidth / scroller.scrollWidth
      const calculatedThumbSize = Math.max(
        MIN_THUMB_SIZE,
        Math.min(MAX_THUMB_SIZE, visibleRatio * 100)
      )

      setScrollbarState({
        scrollPercentage: percentage,
        thumbSize: calculatedThumbSize,
      })
    }

    // Create throttled handler inside effect to avoid ref access during render
    const throttledUpdateScrollbar = throttle(
      updateScrollbar,
      THROTTLE_DELAY_MS
    )

    // Defer initial update to avoid synchronous setState in effect body
    const frameId = requestAnimationFrame(() => {
      updateScrollbar()
    })

    scroller.addEventListener('scroll', throttledUpdateScrollbar)
    window.addEventListener('resize', throttledUpdateScrollbar)

    return () => {
      cancelAnimationFrame(frameId)
      scroller.removeEventListener('scroll', throttledUpdateScrollbar)
      window.removeEventListener('resize', throttledUpdateScrollbar)
    }
  }, [scrollerRef])

  // Calculate thumb position (accounting for thumb width)
  // scrollPercentage is 0-100, so we divide by 100 to get 0-1 range
  const thumbPosition =
    (scrollbarState.scrollPercentage / 100) * (100 - scrollbarState.thumbSize)

  return (
    <div className='flex items-center justify-center'>
      <div
        className='relative h-1 w-full max-w-226 rounded-full bg-gray-200'
        role='progressbar'
        aria-label={t('ariaLabel')}
        aria-valuenow={Math.round(scrollbarState.scrollPercentage)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className='absolute top-0 h-full rounded-full bg-gray-400'
          style={{
            left: `${thumbPosition}%`,
            width: `${scrollbarState.thumbSize}%`,
          }}
        />
      </div>
    </div>
  )
}
