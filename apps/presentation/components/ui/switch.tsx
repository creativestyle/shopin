'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const switchRootClasses = {
  base: 'peer -mt-px inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 p-1 transition-all outline-none focus-visible:ring-1',
  disabled: 'cursor-not-allowed border-gray-100 bg-gray-100',
}

const switchRootSchemes = cva('cursor-pointer', {
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
})

const switchThumbClasses = {
  base: 'pointer-events-none block size-4 rounded-full ring-0 transition',
  disabled:
    'bg-gray-300 data-[state=checked]:translate-x-4.5 data-[state=unchecked]:translate-x-0',
}

const switchThumbSchemes = cva(
  'data-[state=checked]:translate-x-4.5 data-[state=checked]:bg-white data-[state=unchecked]:translate-x-0',
  {
    variants: {
      scheme: {
        primary: 'data-[state=unchecked]:bg-gray-200',
        accent: 'data-[state=unchecked]:bg-gray-200',
        gray: 'data-[state=unchecked]:bg-gray-700',
      },
    },
    defaultVariants: {
      scheme: 'gray',
    },
  }
)

type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root> &
  VariantProps<typeof switchRootSchemes>

function Switch({
  className,
  scheme,
  disabled,
  'aria-disabled': ariaDisabled,
  ...props
}: SwitchProps) {
  const rootClassName = cn(
    switchRootClasses.base,
    disabled ? switchRootClasses.disabled : switchRootSchemes({ scheme }),
    className
  )

  const thumbClassName = cn(
    switchThumbClasses.base,
    disabled ? switchThumbClasses.disabled : switchThumbSchemes({ scheme })
  )

  return (
    <SwitchPrimitive.Root
      data-slot='switch'
      className={rootClassName}
      disabled={disabled}
      aria-disabled={disabled ? true : ariaDisabled}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot='switch-thumb'
        className={thumbClassName}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
