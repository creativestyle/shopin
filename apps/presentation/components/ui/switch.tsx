'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const switchSchemes = cva(
  'peer -mt-px inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 p-1 transition-all outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:!border-gray-400 disabled:!bg-gray-400 data-[state=unchecked]:bg-white disabled:[&>span]:!bg-gray-200 disabled:[&>span[data-state=checked]]:!bg-white',
  {
    variants: {
      scheme: {
        primary:
          'focus-visible:ring-primary/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=unchecked]:border-gray-500 data-[state=unchecked]:hover:enabled:border-primary [&:hover:enabled>span[data-state=unchecked]]:bg-primary',
        accent:
          'focus-visible:ring-accent/30 data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=unchecked]:border-gray-500 data-[state=unchecked]:hover:enabled:border-accent [&:hover:enabled>span[data-state=unchecked]]:bg-accent',
        gray: 'focus-visible:ring-gray-700/30 data-[state=checked]:border-gray-700 data-[state=checked]:bg-gray-700 data-[state=unchecked]:border-gray-300 data-[state=unchecked]:!bg-gray-50 data-[state=unchecked]:hover:enabled:border-gray-700 [&:hover:enabled>span[data-state=unchecked]]:bg-gray-700',
      },
    },
    defaultVariants: {
      scheme: 'gray',
    },
  }
)

const thumbSchemes = cva(
  'pointer-events-none block size-4 rounded-full bg-white ring-0 transition data-[state=checked]:translate-x-4.5 data-[state=checked]:bg-white data-[state=unchecked]:translate-x-0',
  {
    variants: {
      scheme: {
        primary: 'data-[state=unchecked]:bg-gray-200',
        accent: 'data-[state=unchecked]:bg-gray-200',
        gray: 'data-[state=unchecked]:bg-gray-700',
      },
    },
    defaultVariants: {
      scheme: 'primary',
    },
  }
)

function Switch({
  className,
  scheme,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> &
  VariantProps<typeof switchSchemes>) {
  return (
    <SwitchPrimitive.Root
      data-slot='switch'
      className={cn(switchSchemes({ scheme }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot='switch-thumb'
        className={cn(thumbSchemes({ scheme }))}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
