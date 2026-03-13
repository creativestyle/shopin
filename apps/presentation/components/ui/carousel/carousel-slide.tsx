'use client'

import { cn } from '@/lib/utils'
import type { CarouselSlideProps } from '@/types/carousel'

export function CarouselSlide({ children, className }: CarouselSlideProps) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col [anchor-name:--carousel-anchor] *:h-full',
        className
      )}
    >
      {children}
    </div>
  )
}
