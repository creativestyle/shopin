import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { useFieldValidation } from '../field'
import { TrailingElement } from './text-input-trailing-element'

const inputVariants = cva(
  'peer w-full rounded-lg border bg-white px-4 pt-6 pb-1.5 leading-[1.5] text-gray-950 placeholder-transparent caret-gray-950 transition-colors transition-normal outline-none focus:placeholder-gray-400 focus-visible:border-gray-950 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:placeholder-gray-400',
  {
    variants: {
      state: {
        none: 'border-gray-400 hover:border-gray-500',
        valid: 'border-gray-400 hover:border-gray-500',
        error:
          'border-red-600 hover:border-red-600 focus-visible:border-red-600',
      },
      hasEnd: {
        true: 'pr-12', // space for status icon or endAdornment
        false: '',
      },
    },
    defaultVariants: { state: 'none', hasEnd: false },
  }
)

type InputVariantProps = VariantProps<typeof inputVariants>
type ValidationState = InputVariantProps['state']

function useInputValidation(validationState: ValidationState) {
  const { isInvalid, describedBy } = useFieldValidation({
    invalid: validationState === 'error',
  })
  const isValid = validationState === 'valid'

  return { isInvalid, isValid, describedBy }
}

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
  validationState?: ValidationState
  required?: boolean
  /** Optional trailing adornment (e.g., button, icon). If absent, status icons render by state. */
  endAdornment?: React.ReactNode
  /** Optional absolutely-positioned overlay inside the input container (e.g., ghost text). */
  overlay?: React.ReactNode
  asChild?: boolean
  children?: React.ReactElement
}

/**
 * Accessible text input compatible with react-hook-form.
 * For password visibility toggle, use PasswordInput component.
 */
function TextInput({
  id,
  label,
  validationState = 'none',
  required,
  className,
  endAdornment,
  overlay,
  type = 'text',
  asChild,
  children,
  placeholder = ' ',
  ...props
}: TextInputProps) {
  const { isInvalid, isValid, describedBy } =
    useInputValidation(validationState)

  // Add right padding if we will render any trailing element
  const hasEnd = Boolean(endAdornment || isValid || isInvalid)
  const InputComponent = asChild ? Slot : 'input'

  return (
    <div className={cn('flex w-full flex-col gap-2')}>
      <div className='relative w-full'>
        <InputComponent
          id={id}
          type={type}
          aria-required={required || undefined}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            inputVariants({
              state: isInvalid ? 'error' : isValid ? 'valid' : 'none',
              hasEnd,
            }),
            className
          )}
          data-slot='input'
          placeholder={placeholder}
          {...props}
        >
          {asChild ? children : null}
        </InputComponent>
        {overlay && overlay}
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'absolute top-2 left-4 text-xs/[1.5] text-gray-500 transition-all transition-normal',
              'peer-disabled:text-gray-400',
              'peer-hover:text-gray-950',
              // On focus (or when there is content), keep it floated
              'peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs',
              // When placeholder is shown (empty input), bring label to center at 1/2
              'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base',
              // Render a visual asterisk without exposing it to screen readers
              {
                'after:content-["*"]': required,
              }
            )}
          >
            {label}
          </label>
        )}
        <TrailingElement
          endAdornment={endAdornment}
          isValid={isValid}
          isInvalid={isInvalid}
        />
      </div>
    </div>
  )
}

export { TextInput, inputVariants }
