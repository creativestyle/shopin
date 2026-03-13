'use client'

import { useEffect, useState } from 'react'

/**
 * Custom hook to detect if the device has fine pointer capabilities
 * @param query - The media query string to match against
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false
    }
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    const mediaQuery = window.matchMedia(query)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Set initial value via handler to avoid synchronous setState
    handler({ matches: mediaQuery.matches } as MediaQueryListEvent)

    // Use modern addEventListener (supported in all modern browsers)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

/**
 * Hook specifically for detecting fine pointer capabilities
 * @returns boolean indicating if the device has fine pointer capabilities
 */
export function useFinePointer(): boolean {
  return useMediaQuery('(pointer: fine)')
}
