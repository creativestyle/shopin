import React from 'react'

// Carousel types based on Tailwind breakpoints
export type TailwindBreakpoints = {
  'sm': number
  'md': number
  'lg': number
  'xl': number
  '2xl': number
}

export interface CarouselColumnsConfig extends TailwindBreakpoints {
  base: number
}

export interface CarouselRef {
  scrollToSlide: (index: number) => void
}

export interface CarouselProps {
  children: React.ReactNode
  /** Stable ID for aria-controls; avoids hydration mismatch when multiple carousels exist */
  id?: string
  navigation?: boolean
  /** Show scrollbar pagination */
  scrollbar?: boolean
  gridConfig?: Partial<CarouselColumnsConfig> | number
  className?: string
  style?: React.CSSProperties
  onSlideChange?: (currentIndex: number) => void
}

export interface CarouselSlideProps {
  children: React.ReactNode
  className?: string
}

export interface CarouselNavigationProps {
  currentIndex: number
  isNextSlidePossible: boolean
  onSlideToPrev: () => void
  onSlideToNext: () => void
  carouselId: string
  prevIcon?: React.ReactNode
  nextIcon?: React.ReactNode
}

/**
 * Return type for the useCarouselConfig hook
 */
export interface UseCarouselConfigReturn {
  /** Merged carousel configuration with default values */
  config: CarouselColumnsConfig
  /** CSS custom properties for slides per view at each breakpoint */
  cssConfig: Record<string, number>
  /** Current slides per view based on the active breakpoint */
  slidesPerView: number
  /** Maximum possible slides per view across all breakpoints (for initial render optimization) */
  maxSlidesPerView: number
  /** Scroll behavior preference based on user's reduced motion setting */
  scrollBehaviorPreference: 'smooth' | 'auto'
  /** Current active breakpoint */
  currentBreakpoint: keyof CarouselColumnsConfig
}
