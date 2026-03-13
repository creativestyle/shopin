'use client'

import { useEffect, useRef, useState } from 'react'
import { throttle } from '@/lib/throttle'

const SCROLL_THRESHOLD = 1

interface UseCarouselStateProps {
  slides: React.ReactElement[]
  slidesPerView: number
  maxSlidesPerView: number
  scrollBehaviorPreference: 'smooth' | 'auto'
  onSlideChange?: (currentIndex: number) => void
}

export function useCarouselState({
  slides,
  slidesPerView,
  maxSlidesPerView,
  scrollBehaviorPreference,
  onSlideChange,
}: UseCarouselStateProps) {
  const [isNextSlidePossible, setIsNextSlidePossible] = useState(true)
  const [isAtStart, setIsAtStart] = useState(true)
  const [slidesRenderedAmount, setSlidesRenderedAmount] = useState(
    Math.min(slides.length, maxSlidesPerView * 3)
  )

  const scrollerRef = useRef<HTMLDivElement>(null)
  const slidesRefsArray = useRef<HTMLDivElement[]>([])
  const currentSlideIndexRef = useRef(1)

  // Calculate the width of a slide group (slidesPerView slides + gaps)
  // Used to determine how far to scroll when navigating between slide groups
  const calculateGroupWidth = () => {
    if (!scrollerRef.current || !slidesRefsArray.current[0]) {
      return 0
    }

    const firstSlide = slidesRefsArray.current[0]
    const slideWidth = firstSlide.getBoundingClientRect().width
    const gap = parseInt(
      getComputedStyle(scrollerRef.current)?.getPropertyValue(
        '--carousel-gap'
      ) || '0'
    )
    return (slideWidth + gap) * slidesPerView
  }

  // Navigate to the previous slide group
  // Scrolls backward by one group width, ensuring we don't scroll past the start
  const slideToPrev = () => {
    if (!scrollerRef.current) {
      return
    }

    const groupWidth = calculateGroupWidth()
    if (groupWidth > 0) {
      const currentScroll = scrollerRef.current.scrollLeft
      scrollerRef.current.scrollTo({
        left: Math.max(0, currentScroll - groupWidth),
        behavior: scrollBehaviorPreference,
      })
    }
  }

  // Navigate to the next slide group
  // Scrolls forward by one group width
  const slideToNext = () => {
    if (!scrollerRef.current) {
      return
    }

    const groupWidth = calculateGroupWidth()
    if (groupWidth > 0) {
      const currentScroll = scrollerRef.current.scrollLeft
      scrollerRef.current.scrollTo({
        left: currentScroll + groupWidth,
        behavior: scrollBehaviorPreference,
      })
    }
  }

  // Check scroll boundaries to determine navigation button states
  // Updates isAtStart and isNextSlidePossible based on current scroll position
  const checkScrollBoundaries = () => {
    if (!scrollerRef.current) {
      return
    }

    const scroller = scrollerRef.current
    const scrollLeft = scroller.scrollLeft
    const maxScroll = scroller.scrollWidth - scroller.clientWidth

    setIsAtStart(scrollLeft < SCROLL_THRESHOLD)
    setIsNextSlidePossible(scrollLeft < maxScroll - SCROLL_THRESHOLD)
  }

  // Set up scroll listener to track scroll position and enable progressive rendering
  // Progressive rendering: only render slides that are visible or about to be visible
  // This improves performance for carousels with many slides
  useEffect(() => {
    checkScrollBoundaries()

    const handleScroll = () => {
      if (!scrollerRef.current) {
        return
      }

      const scroller = scrollerRef.current
      const scrollLeft = scroller.scrollLeft
      const maxScroll = scroller.scrollWidth - scroller.clientWidth

      setIsAtStart(scrollLeft < SCROLL_THRESHOLD)
      setIsNextSlidePossible(scrollLeft < maxScroll - SCROLL_THRESHOLD)

      if (maxScroll > 0) {
        const scrollPercentage = scrollLeft / maxScroll
        const estimatedCurrentSlide =
          Math.floor(scrollPercentage * slides.length) + 1
        const targetRenderedAmount = Math.min(
          slides.length,
          estimatedCurrentSlide + slidesPerView * 3
        )

        setSlidesRenderedAmount((prev) => Math.max(prev, targetRenderedAmount))

        if (
          onSlideChange &&
          estimatedCurrentSlide !== currentSlideIndexRef.current
        ) {
          currentSlideIndexRef.current = estimatedCurrentSlide
          onSlideChange(estimatedCurrentSlide)
        }
      }
    }

    const throttledHandleScroll = throttle(handleScroll, 100)

    const scroller = scrollerRef.current
    if (scroller) {
      scroller.addEventListener('scroll', throttledHandleScroll)
    }

    return () => {
      if (scroller) {
        scroller.removeEventListener('scroll', throttledHandleScroll)
      }
    }
  }, [slides.length, slidesPerView, onSlideChange])

  // Expose scrollToSlide function for imperative control
  // Allows parent components to programmatically scroll to a specific slide
  const scrollToSlide = (index: number) => {
    if (!scrollerRef.current || !slidesRefsArray.current[index]) {
      return
    }

    const targetSlide = slidesRefsArray.current[index]
    const scroller = scrollerRef.current
    const scrollerRect = scroller.getBoundingClientRect()
    const targetRect = targetSlide.getBoundingClientRect()

    const offset = targetRect.left - scrollerRect.left
    const targetScrollLeft = scroller.scrollLeft + offset

    scroller.scrollTo({
      left: targetScrollLeft,
      behavior: scrollBehaviorPreference,
    })
  }

  return {
    scrollerRef,
    slidesRefsArray,
    isNextSlidePossible,
    isAtStart,
    slidesRenderedAmount,
    slideToPrev,
    slideToNext,
    scrollToSlide,
  }
}
