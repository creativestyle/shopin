import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center lord-of-the-focus-ring rounded-sm text-xs/[1.6] font-bold whitespace-nowrap',
  {
    variants: {
      variant: {
        green: 'bg-green-500 text-white focus-visible:ring-green-100/80',
        blue: 'bg-blue-500 text-white',
        orange: 'bg-orange-500 text-white focus-visible:ring-orange-500/80',
        red: 'bg-red-400 text-white',
        gray: 'bg-gray-200 text-gray-700 focus-visible:ring-gray-200/80',
        yellow: 'bg-yellow-500 text-white focus-visible:ring-yellow-500/80',
      },
      size: {
        small: 'px-1',
        medium: 'px-2 py-1',
      },
    },
    defaultVariants: {
      variant: 'green',
      size: 'medium',
    },
  }
)

type BadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: BadgeProps) {
  if (asChild) {
    return (
      <Slot
        data-slot='badge'
        className={cn(badgeVariants({ variant, size }), className)}
        {...(props as any)}
      />
    )
  }

  return (
    <span
      data-slot='badge'
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants, type BadgeProps }
