'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'
import { throttle } from '@/lib/throttle'

import { ScrollButton } from './scroll-button'

export interface HorizontalScrollerProps {
  children: React.ReactNode
  className?: string
  scheme?: 'white' | 'dark'
  scrollAmount?: number
}

export function HorizontalScroller({
  children,
  className,
  scheme = 'white',
  scrollAmount = 200,
}: HorizontalScrollerProps) {
  const t = useTranslations('common')

  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  const checkScrollability = React.useCallback(() => {
    if (!scrollContainerRef.current) {
      return
    }

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }, [])

  const throttledCheckScrollabilityRef =
    React.useRef<ReturnType<typeof throttle>>(undefined)

  React.useEffect(() => {
    throttledCheckScrollabilityRef.current = throttle(checkScrollability, 100)
  }, [checkScrollability])

  React.useEffect(() => {
    checkScrollability()
    const container = scrollContainerRef.current

    if (!container) {
      return
    }

    const throttledHandler = throttledCheckScrollabilityRef.current
    if (throttledHandler) {
      container.addEventListener('scroll', throttledHandler)
      return () => container.removeEventListener('scroll', throttledHandler)
    }
  }, [checkScrollability])

  // Add resize listener with throttling
  React.useEffect(() => {
    const throttledHandler = throttledCheckScrollabilityRef.current
    if (throttledHandler) {
      window.addEventListener('resize', throttledHandler)
      return () => window.removeEventListener('resize', throttledHandler)
    }
  }, [])

  const scroll = React.useCallback(
    (direction: 'left' | 'right') => {
      const container = scrollContainerRef.current

      if (!container) {
        return
      }

      const newScrollLeft =
        direction === 'left'
          ? container.scrollLeft - scrollAmount
          : container.scrollLeft + scrollAmount

      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      })
    },
    [scrollAmount]
  )

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'pointer-events-none absolute top-0 bottom-0 left-0 z-(--z-scroll-button-bg) w-16 bg-gradient-to-r from-5% to-transparent transition-opacity duration-200',
          {
            'from-white': scheme === 'white',
            'from-gray-950': scheme === 'dark',
            'opacity-100': canScrollLeft,
            'opacity-0': !canScrollLeft,
          }
        )}
      />
      <ScrollButton
        side='left'
        visible={canScrollLeft}
        scheme={scheme}
        ariaLabel={t('scrollLeft')}
        onClick={() => scroll('left')}
      />
      <div
        className={cn(
          'pointer-events-none absolute top-0 right-0 bottom-0 z-(--z-scroll-button-bg) w-16 bg-gradient-to-l from-5% to-transparent transition-opacity duration-200',
          {
            'from-white': scheme === 'white',
            'from-gray-950': scheme === 'dark',
            'opacity-100': canScrollRight,
            'opacity-0': !canScrollRight,
          }
        )}
      />
      <ScrollButton
        side='right'
        visible={canScrollRight}
        scheme={scheme}
        ariaLabel={t('scrollRight')}
        onClick={() => scroll('right')}
      />
      <div
        className='no-scrollbar overflow-x-auto scroll-smooth-motion'
        ref={scrollContainerRef}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  )
}
