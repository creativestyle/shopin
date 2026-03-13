import React from 'react'
import { cn } from '@/lib/utils'

export interface GradientOverlayProps {
  direction?: 'top' | 'bottom'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const GradientOverlay: React.FC<GradientOverlayProps> = ({
  direction = 'bottom',
  size = 'md',
  className,
}) => {
  return (
    <div
      className={cn(
        'pointer-events-none absolute right-0 left-0',
        {
          'h-[80px]': size === 'sm',
          'h-[140px]': size === 'md',
          'h-[200px]': size === 'lg',
          'h-[260px]': size === 'xl',
        },
        {
          'bottom-0 bg-gradient-to-b from-white/0 via-white/80 to-white':
            direction === 'bottom',
          'top-0 bg-gradient-to-t from-white via-white/80 to-white/0':
            direction !== 'bottom',
        },
        className
      )}
      aria-hidden='true'
    />
  )
}
