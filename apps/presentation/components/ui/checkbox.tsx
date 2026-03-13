'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import CheckIcon from '@/public/icons/checkmark.svg'

import { cn } from '@/lib/utils'
import { useFieldValidation } from './field'

function Checkbox({
  className,
  invalid,
  ariaDescribedBy,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  invalid?: boolean
  ariaDescribedBy?: string
}) {
  const { isInvalid, describedBy: effectiveDescribedBy } = useFieldValidation({
    invalid,
    ariaDescribedBy,
  })

  return (
    <CheckboxPrimitive.Root
      data-slot='checkbox'
      aria-invalid={isInvalid || undefined}
      aria-describedby={effectiveDescribedBy || undefined}
      className={cn(
        'peer size-5 shrink-0 appearance-none rounded',
        'border border-gray-300',
        'cursor-pointer bg-white outline-none',
        'transition-colors duration-150',
        'hover:border-gray-900',
        'checked:hover:border-gray-900',
        'disabled:cursor-not-allowed',
        'disabled:border-gray-300 disabled:bg-gray-100',
        'checked:disabled:border-gray-300',
        'lord-of-the-focus-ring',
        {
          'border-error checked:border-error hover:border-error': invalid,
        },
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot='checkbox-indicator'>
        <CheckIcon className='size-4.5' />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
