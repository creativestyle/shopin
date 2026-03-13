'use client'
import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { RadioGroupItem } from '@/components/ui/radio-button'
import { Label as UiLabel } from '@/components/ui/label'
import InfoCircleIcon from '@/public/icons/info.svg'
import { cn } from '@/lib/utils'
import {
  InfoPopover,
  InfoPopoverContent,
  InfoPopoverTrigger,
} from './info-popover'

type RadioSelectorOptionProps = {
  id: string
  value: string
  label?: React.ReactNode
  labelInfo?: React.ReactNode
  description?: React.ReactNode
  endContent?: React.ReactNode
  disabled?: boolean
  invalid?: boolean
  className?: string
}

export function RadioSelector({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot='radio-selector'
      className={cn('flex flex-col gap-3', className)}
      {...props}
    />
  )
}

export function RadioSelectorOption({
  id,
  value,
  label,
  labelInfo,
  description,
  endContent,
  disabled,
  invalid,
  className,
}: RadioSelectorOptionProps) {
  const labelId = `${id}-label`
  const hasLabel = Boolean(label)
  return (
    <label
      htmlFor={id}
      className={cn(
        'group/opt w-full rounded-lg border bg-white px-6 py-4',
        {
          'flex flex-col gap-3': hasLabel,
          'border-error': invalid,
        },
        'border-gray-200',
        'hover:border-gray-500',
        'has-[[data-state=checked]]:border-gray-500 has-[[data-state=checked]]:hover:border-gray-900',
        'has-[[disabled]]:cursor-not-allowed has-[[disabled]]:border-gray-200 has-[[disabled]]:bg-gray-100 has-[[disabled]]:text-gray-500',
        className
      )}
    >
      {hasLabel ? (
        <>
          <div className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <RadioGroupItem
                id={id}
                value={value}
                disabled={disabled}
                aria-labelledby={labelId}
                invalid={invalid}
              />
              <UiLabel asChild>
                <span
                  id={labelId}
                  className='group-has-[[data-state=checked]]/opt:font-bold'
                >
                  {label}
                </span>
              </UiLabel>
              {labelInfo && (
                <InfoPopover>
                  <InfoPopoverTrigger>
                    <InfoCircleIcon
                      className='-mt-0.5 size-6 shrink-0'
                      aria-hidden='true'
                    />
                  </InfoPopoverTrigger>
                  <InfoPopoverContent title={String(label ?? '')}>
                    {labelInfo}
                  </InfoPopoverContent>
                </InfoPopover>
              )}
            </div>
            {endContent}
          </div>
          {description}
        </>
      ) : (
        <div className='flex w-full justify-between gap-3'>
          <div className='flex gap-2'>
            <RadioGroupItem
              id={id}
              value={value}
              disabled={disabled}
              aria-labelledby={labelId}
              invalid={invalid}
            />
            <div id={labelId}>{description}</div>
          </div>
          {endContent}
        </div>
      )}
    </label>
  )
}
