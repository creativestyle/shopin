'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TopBarFrameProps {
  ariaLabel: string
  className?: string
  children: React.ReactNode
}

export function TopBarFrame({
  ariaLabel,
  className,
  children,
}: TopBarFrameProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const viewport = window.visualViewport
    const element = ref.current
    if (!viewport || !element) {
      return
    }

    // Keep the bar at the top of the visual viewport when the mobile keyboard shifts it
    const update = () => {
      const offset = Math.max(0, viewport.offsetTop)
      element.style.transform = offset > 0 ? `translateY(${offset}px)` : ''
    }

    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      element.style.transform = ''
    }
  }, [])

  return (
    <aside
      ref={ref}
      aria-label={ariaLabel}
      tabIndex={0}
      className={cn(
        'container-type-inline-size sticky top-0 z-50 w-full bg-gray-950 py-1.5',
        'outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset',
        className
      )}
    >
      {children}
    </aside>
  )
}
