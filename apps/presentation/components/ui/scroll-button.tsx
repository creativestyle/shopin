'use client'

import { cn } from '@/lib/utils'
import { Button } from './button'
import ChevronRightIcon from '@/public/icons/chevronright.svg'

export interface ScrollButtonProps {
  side: 'left' | 'right'
  visible: boolean
  onClick: () => void
  ariaLabel: string
  className?: string
}

export function ScrollButton({
  side,
  visible,
  onClick,
  ariaLabel,
  className,
}: ScrollButtonProps) {
  return (
    <Button
      size='icon-sm'
      variant='secondary'
      scheme='white'
      className={cn(
        'absolute top-1/2 z-[var(--z-scroll-button)] -mt-0.5 -translate-y-1/2 shadow-sm [&:focus-visible>svg]:fill-primary pointer-fine:[&:hover>svg]:fill-primary',
        {
          'left-0': side === 'left',
          'right-0': side === 'right',
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
        className={cn('size-6 transition-colors', {
          '-scale-100': side === 'left',
        })}
      />
    </Button>
  )
}
