import { cn } from '@/lib/utils'
import LoaderSvg from '@/public/loader.svg'
import { useTranslations } from 'next-intl'

export type LoadingSpinnerProps = {
  /** Additional CSS classes for size and styling (e.g., "size-8") */
  className?: string
  /** Rotation speed in seconds for one full rotation. Default: 1 second */
  speed?: number
  /** Accessible label for screen readers */
  label?: string
}

/**
 * Accessible loading spinner component using animated SVG.
 *
 * @example
 * ```tsx
 * <LoadingSpinner className="size-8" />
 * <LoadingSpinner className="size-6" speed={0.8} label="Loading products" />
 * ```
 */
export function LoadingSpinner({
  className,
  speed = 1,
  label,
}: LoadingSpinnerProps) {
  const t = useTranslations('common')
  const ariaLabel = label || t('loadingAriaLabel')

  // Extract size classes (size-*, w-*, h-*) and other classes
  const sizeMatch = className?.match(
    /\b(size-\d+|w-\d+|h-\d+|w-full|h-full)\b/g
  )

  return (
    <div
      role='status'
      aria-live='polite'
      aria-label={label}
      className={cn(
        'flex h-full w-full items-center justify-center',
        className
          ?.replace(/\b(size-\d+|w-\d+|h-\d+|w-full|h-full)\b/g, '')
          .trim() || ''
      )}
    >
      <LoaderSvg
        className={cn(sizeMatch?.join(' ') || 'size-8', 'animate-spin')}
        style={{
          animationDuration: `${speed}s`,
        }}
        aria-hidden='true'
      />
      <span className='sr-only'>{ariaLabel}</span>
    </div>
  )
}
