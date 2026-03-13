'use client'

import { useEffect, useState } from 'react'
import { throttle } from '@/lib/throttle'
import type {
  CarouselColumnsConfig,
  UseCarouselConfigReturn,
} from '@/types/carousel'

// Default carousel configuration from Futterhaus tailwind config
const DEFAULT_CAROUSEL_CONFIG: CarouselColumnsConfig = {
  'base': 1.12,
  'sm': 2.12,
  'md': 3.12,
  'lg': 4,
  'xl': 5,
  '2xl': 5,
}

// Tailwind breakpoints in pixels (standard Tailwind breakpoints)
const BREAKPOINTS = {
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536,
} as const

// Breakpoint entries in descending order for breakpoint detection
const BREAKPOINT_ENTRIES: Array<[keyof typeof BREAKPOINTS, number]> = [
  ['2xl', BREAKPOINTS['2xl']],
  ['xl', BREAKPOINTS.xl],
  ['lg', BREAKPOINTS.lg],
  ['md', BREAKPOINTS.md],
  ['sm', BREAKPOINTS.sm],
]

export function useCarouselConfig(
  customConfig?: Readonly<Partial<CarouselColumnsConfig> | number>
): UseCarouselConfigReturn {
  const [currentBreakpoint, setCurrentBreakpoint] =
    useState<keyof CarouselColumnsConfig>('base')
  // Initialize scroll behavior with static default to avoid hydration mismatch
  // Will be updated on the client in useEffect
  const [scrollBehaviorPreference, setScrollBehaviorPreference] = useState<
    'smooth' | 'auto'
  >('smooth')

  // Merge custom config with defaults
  let mergedConfig = { ...DEFAULT_CAROUSEL_CONFIG } as CarouselColumnsConfig

  if (customConfig) {
    if (typeof customConfig === 'number') {
      // If a number is provided, use it for all breakpoints
      for (const bp in mergedConfig) {
        mergedConfig[bp as keyof CarouselColumnsConfig] = customConfig
      }
    } else {
      // Merge with custom config
      mergedConfig = { ...mergedConfig, ...customConfig }
    }
  }

  const config = mergedConfig

  // Generate CSS custom properties for each breakpoint
  const styles: Record<string, number> = {}
  Object.entries(config).forEach(([name, value]) => {
    styles[`--carousel-slidesPerView-${name}`] = value
  })
  const cssConfig = styles

  // Calculate the highest possible slides per view for initial render optimization
  const values = Object.values(config)
  const maxSlidesPerView = Math.max(...values)

  // Get current slides per view based on breakpoint
  const slidesPerView = Math.floor(
    config[currentBreakpoint] || config.base || 1
  )

  // Detect current breakpoint based on window width
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      const matchedBreakpoint = BREAKPOINT_ENTRIES.find(
        ([, breakpointWidth]) => width >= breakpointWidth
      )

      setCurrentBreakpoint(matchedBreakpoint ? matchedBreakpoint[0] : 'base')
    }

    // Initial check
    updateBreakpoint()

    // Throttle resize handler for better performance
    const throttledUpdateBreakpoint = throttle(updateBreakpoint, 150)

    // Update on resize
    window.addEventListener('resize', throttledUpdateBreakpoint)
    return () => window.removeEventListener('resize', throttledUpdateBreakpoint)
  }, [])

  // Set initial scroll behavior and subscribe to changes in reduced motion preference
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: no-preference)'
    )

    // Handler that updates state based on media query
    const handleChange = (e: { matches: boolean }) => {
      setScrollBehaviorPreference(e.matches ? 'smooth' : 'auto')
    }

    // Set initial value by calling handler with current state
    handleChange(prefersReducedMotion)

    // Subscribe to changes
    prefersReducedMotion.addEventListener('change', handleChange)
    return () =>
      prefersReducedMotion.removeEventListener('change', handleChange)
  }, [])

  return {
    config,
    cssConfig,
    slidesPerView,
    maxSlidesPerView,
    scrollBehaviorPreference,
    currentBreakpoint,
  }
}
