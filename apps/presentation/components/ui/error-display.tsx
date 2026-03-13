'use client'

import { cn } from '@/lib/utils'

interface ErrorDisplayProps {
  children: React.ReactNode
  className?: string
  /** Center text (e.g. for full-page error states) */
  centered?: boolean
}

/**
 * Standard inline/block error message for presentation layer.
 * Use for load errors, validation summaries, or any user-facing error text.
 * Renders with role="alert" and consistent styling (text-red-600, text-sm).
 */
export function ErrorDisplay({
  children,
  className,
  centered,
}: ErrorDisplayProps) {
  return (
    <div
      role='alert'
      className={cn(
        'text-sm text-red-600',
        { 'text-center': centered },
        className
      )}
    >
      {children}
    </div>
  )
}
