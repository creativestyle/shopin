'use client'

import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const radioGroupVariants = cva('grid', {
  variants: {
    orientation: {
      vertical: 'gap-4',
      horizontal: 'auto-cols-max grid-flow-col items-center gap-x-10',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
})

function RadioGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root> &
  VariantProps<typeof radioGroupVariants>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot='radio-group'
      className={cn(radioGroupVariants({ orientation }), className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  invalid,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & {
  invalid?: boolean
}) {
  return (
    <RadioGroupPrimitive.Item
      data-slot='radio-group-item'
      aria-invalid={invalid || undefined}
      className={cn(
        'group peer size-5 shrink-0 -translate-y-0.5 rounded-full border-2 outline-none',
        'border-gray-300',
        'cursor-pointer bg-white',
        'transition-colors duration-150',
        'hover:border-gray-950',
        'data-[state=checked]:hover:border-gray-900',
        'disabled:cursor-not-allowed disabled:border-gray-300',
        'data-[state=checked]:disabled:border-gray-300',
        'lord-of-the-focus-ring',
        invalid &&
          'border-error hover:border-error data-[state=checked]:border-error',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot='radio-group-indicator'
        className='flex items-center justify-center'
      >
        <span className='pointer-events-none size-2.5 rounded-full bg-gray-950 group-data-[disabled]:bg-gray-400' />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
