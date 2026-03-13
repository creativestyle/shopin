import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface QuantityButtonProps {
  onClick: () => void
  disabled: boolean
  ariaLabel: string
  position: 'left' | 'right'
  children: ReactNode
}

const BUTTON_BASE_CLASSES = [
  'absolute top-1/2 h-6 w-6 -translate-y-1/2',
  'flex items-center justify-center',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'cursor-pointer transition-opacity hover:opacity-70',
  'rounded focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 focus-visible:outline-none',
] as const

const POSITION_CLASSES = {
  left: 'left-2',
  right: 'right-2',
} as const

/**
 * Reusable button component for quantity switcher controls
 * Handles consistent styling and accessibility attributes
 */
export function QuantityButton({
  onClick,
  disabled,
  ariaLabel,
  position,
  children,
}: QuantityButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type='button'
      className={cn(BUTTON_BASE_CLASSES, POSITION_CLASSES[position])}
      aria-label={ariaLabel}
      aria-disabled={disabled}
    >
      {children}
    </button>
  )
}
