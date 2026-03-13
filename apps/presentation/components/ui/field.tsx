'use client'

import React, { createContext, useContext, useId, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

interface FieldContextValue {
  errorId?: string
  descriptionId?: string
  isInvalid?: boolean
}

const FieldContext = createContext<FieldContextValue | null>(null)

function useFieldContext() {
  const context = useContext(FieldContext)
  if (!context) {
    return null
  }
  return context
}

function useFieldValidation(options?: {
  invalid?: boolean
  ariaDescribedBy?: string
}) {
  const context = useFieldContext()

  let isInvalid = false
  if (context?.isInvalid) {
    isInvalid = true
  } else if (options?.invalid !== undefined) {
    isInvalid = options.invalid
  }

  let describedBy = options?.ariaDescribedBy
  if (!describedBy) {
    const ids: (string | undefined)[] = []
    if (context?.isInvalid && context.errorId) {
      ids.push(context.errorId)
    }
    if (context?.descriptionId) {
      ids.push(context.descriptionId)
    }
    describedBy = ids.filter(Boolean).join(' ')
  }

  return { isInvalid, describedBy }
}

function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>) {
  return (
    <fieldset
      data-slot='field-set'
      className={cn('flex flex-col gap-3', className)}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  variant = 'legend',
  required,
  ...props
}: React.ComponentProps<'legend'> & {
  variant?: 'legend' | 'label'
  required?: boolean
}) {
  return (
    <legend
      data-slot='field-legend'
      data-variant={variant}
      className={cn(
        'text-base/[1.5]',
        'text-gray-500',
        'pb-2',
        {
          'after:content-["*"]': required,
        },
        className
      )}
      {...props}
    />
  )
}

const fieldVariants = cva(
  'group/field data-[invalid=true]:text-destructive flex w-full',
  {
    variants: {
      orientation: {
        vertical: ['flex-col [&>*]:w-full [&>.sr-only]:w-auto'],
        horizontal: [
          'flex-row items-center',
          '[&>[data-slot=field-label]]:flex-auto',
          'has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
        ],
        responsive: [
          'flex-col @md/field-group:flex-row @md/field-group:items-center [&>*]:w-full @md/field-group:[&>*]:w-auto [&>.sr-only]:w-auto',
          '@md/field-group:[&>[data-slot=field-label]]:flex-auto',
          '@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
        ],
      },
    },
    defaultVariants: {
      orientation: 'vertical',
    },
  }
)

function Field({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof fieldVariants> & {
    'data-invalid'?: boolean
  }) {
  const baseId = useId()
  const inputId = `field-input-${baseId}`
  const errorId = `field-error-${baseId}`
  const descriptionId = `field-description-${baseId}`
  const isInvalid = props['data-invalid'] === true

  const contextValue = useMemo(
    () => ({ inputId, errorId, descriptionId, isInvalid }),
    [inputId, errorId, descriptionId, isInvalid]
  )
  return (
    <FieldContext.Provider value={contextValue}>
      <div
        role='group'
        data-slot='field'
        data-orientation={orientation}
        data-invalid={props['data-invalid']}
        className={cn(fieldVariants({ orientation }), className)}
        {...props}
      />
    </FieldContext.Provider>
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const context = useFieldContext()

  return (
    <p
      data-slot='field-description'
      id={context?.descriptionId}
      className={cn('pt-2 text-sm/[1.5] text-gray-950', className)}
      {...props}
    />
  )
}

function FieldError({
  className,
  error,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & {
  error: { message?: string }
  variant?: 'default' | 'checkbox' | 'radio'
}) {
  const context = useFieldContext()
  const t = useTranslations()

  let errorMessage: string | undefined
  if (error?.message) {
    errorMessage = (t as (key: string) => string)(error.message)
  }

  return (
    <div
      role='alert'
      data-slot='field-error'
      id={context?.errorId}
      className={cn('mt-2 flex items-center gap-1', 'text-red-600', className)}
      {...props}
    >
      <p
        className={cn('text-base/[1.5]', {
          'ml-8': variant === 'checkbox' || variant === 'radio',
          'ml-4': variant !== 'checkbox' && variant !== 'radio',
        })}
      >
        {errorMessage}
      </p>
    </div>
  )
}

export {
  Field,
  FieldDescription,
  FieldError,
  FieldSet,
  FieldLegend,
  useFieldContext,
  useFieldValidation,
}
