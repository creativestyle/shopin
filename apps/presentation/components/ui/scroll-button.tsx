'use client'

import { cn } from '@/lib/utils'

import ChevronRightIcon from '@/public/icons/chevronright.svg'

export interface ScrollButtonProps {
  side: 'left' | 'right'
  visible: boolean
  scheme?: 'white' | 'dark'
  onClick: () => void
  ariaLabel: string
  className?: string
}

export function ScrollButton({
  side,
  visible,
  scheme = 'white',
  onClick,
  ariaLabel,
  className,
}: ScrollButtonProps) {
  return (
    <button
      className={cn(
        'absolute top-1/2 z-[var(--z-scroll-button)] -mt-0.5 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition focus-visible:ring-2 focus-visible:outline-none [&:focus-visible>svg]:fill-primary pointer-fine:[&:hover>svg]:fill-primary',
        {
          'left-0': side === 'left',
          'right-0': side === 'right',
          'focus-visible:ring-gray-200/50': scheme === 'white',
          'focus-visible:ring-gray-950/50': scheme === 'dark',
          'opacity-100': visible,
          'pointer-events-none opacity-0': !visible,
        },
        className
      )}
      type='button'
      aria-label={ariaLabel}
      {...(!visible && { 'aria-hidden': true })}
      {...(!visible && { tabIndex: -1 })}
      onClick={onClick}
    >
      <ChevronRightIcon
        className={cn('pointer-events-none size-6 shrink-0 transition-colors', {
          '-scale-100': side === 'left',
        })}
      />
    </button>
  )
}
