import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex h-12 min-w-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full text-sm leading-tight font-bold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-0 disabled:pointer-events-none disabled:cursor-default [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'px-7 text-white disabled:bg-gray-50 disabled:text-gray-300',
        secondary:
          'border-2 px-7 disabled:border-gray-300 disabled:bg-transparent disabled:text-gray-300',
        tertiary: 'bg-transparent px-0 disabled:text-gray-300',
      },
      scheme: {
        red: 'bg-rose-700 hover:bg-rose-600 active:bg-rose-600',
        white: 'bg-white text-gray-950 hover:bg-gray-100 active:bg-gray-100',
        black: 'bg-gray-950 text-white hover:bg-gray-800 active:bg-gray-800',
      },
    },
    compoundVariants: [
      {
        variant: 'secondary',
        scheme: 'red',
        class:
          'border-rose-700 bg-white text-rose-700 hover:border-rose-600 hover:bg-white hover:text-rose-600 active:border-rose-600 active:text-rose-600',
      },
      {
        variant: 'secondary',
        scheme: 'white',
        class:
          'border-white bg-transparent text-white hover:border-gray-100 hover:bg-transparent hover:text-gray-100 active:border-gray-100 active:text-gray-100',
      },
      {
        variant: 'secondary',
        scheme: 'black',
        class:
          'border-gray-950 bg-white text-gray-950 hover:border-gray-800 hover:bg-gray-100 hover:text-gray-800 active:border-gray-800 active:text-gray-800',
      },
      {
        variant: 'primary',
        scheme: 'red',
        class: 'focus-visible:ring-rose-700 focus-visible:ring-offset-2',
      },
      {
        variant: 'primary',
        scheme: 'black',
        class: 'focus-visible:ring-gray-950 focus-visible:ring-offset-2',
      },
      {
        variant: 'tertiary',
        scheme: 'red',
        class:
          'bg-transparent text-rose-700 hover:bg-transparent hover:text-rose-600 active:bg-transparent active:text-rose-600',
      },
      {
        variant: 'tertiary',
        scheme: 'white',
        class:
          'bg-transparent text-white hover:bg-transparent hover:text-gray-100 active:bg-transparent active:text-gray-100',
      },
      {
        variant: 'tertiary',
        scheme: 'black',
        class:
          'bg-transparent text-gray-950 hover:bg-transparent hover:text-gray-700 active:bg-transparent active:text-gray-700',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      scheme: 'red',
    },
  }
)

function Button({
  className,
  variant,
  scheme,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  if (asChild) {
    return (
      <Slot
        data-slot='button'
        className={cn(buttonVariants({ variant, scheme, className }))}
        {...(props as any)}
      />
    )
  }

  return (
    <button
      data-slot='button'
      className={cn(buttonVariants({ variant, scheme, className }))}
      {...props}
    />
  )
}

export type ButtonVariant = NonNullable<
  VariantProps<typeof buttonVariants>['variant']
>
export type ButtonScheme = NonNullable<
  VariantProps<typeof buttonVariants>['scheme']
>
export { Button, buttonVariants }
