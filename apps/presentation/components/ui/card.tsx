import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const variants = cva('rounded-lg p-4', {
  variants: {
    scheme: {
      white: 'bg-white text-gray-700',
      gray: 'bg-gray-100 text-gray-700',
      primary: 'bg-primary text-white',
      success: 'bg-success text-white',
      info: 'bg-info text-white',
    },
  },
  defaultVariants: {
    scheme: 'white',
  },
})

function Card({
  className,
  scheme,
  children,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof variants>) {
  return (
    <div
      className={cn(variants({ scheme, className }))}
      {...props}
    >
      {children}
    </div>
  )
}

export { Card, variants as cardVariants }
