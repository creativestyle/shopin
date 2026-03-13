'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'

import ChevronDownIcon from '@/public/icons/chevron-down.svg'
import CheckIcon from '@/public/icons/checkmark.svg'

import { cn } from '@/lib/utils'
import { useFieldValidation } from './field'

type SelectA11yContextValue = {
  ariaRequired?: boolean
  ariaDescribedBy?: string
  invalid?: boolean
}
const SelectA11yContext = React.createContext<SelectA11yContextValue | null>(
  null
)

function useSelectA11yContext() {
  const context = React.useContext(SelectA11yContext)
  if (!context) {
    return null
  }
  return context
}

export type SelectRootProps = React.ComponentProps<
  typeof SelectPrimitive.Root
> & {
  ariaRequired?: boolean
  ariaDescribedBy?: string
  invalid?: boolean
}

function SelectRoot({
  children,
  ariaRequired,
  ariaDescribedBy,
  invalid,
  ...props
}: SelectRootProps) {
  return (
    <SelectA11yContext.Provider
      value={{ ariaRequired, ariaDescribedBy, invalid }}
    >
      <SelectPrimitive.Root
        data-slot='select'
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    </SelectA11yContext.Provider>
  )
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot='select-group'
      {...props}
    />
  )
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return (
    <SelectPrimitive.Value
      data-slot='select-value'
      className='pt-2'
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  size = 'default',
  label,
  children,
  invalid,
  ariaRequired,
  ariaDescribedBy,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  label?: string
  size?: 'sm' | 'default'
  invalid?: boolean
  ariaRequired?: boolean
  ariaDescribedBy?: string
}) {
  const a11yContext = useSelectA11yContext()
  const effectiveInvalid = invalid ?? a11yContext?.invalid
  const effectiveAriaRequired = ariaRequired ?? a11yContext?.ariaRequired
  const effectiveAriaDescribedBy =
    ariaDescribedBy ?? a11yContext?.ariaDescribedBy

  return (
    <SelectPrimitive.Trigger
      data-slot='select-trigger'
      data-size={size}
      aria-required={effectiveAriaRequired || undefined}
      aria-invalid={effectiveInvalid || undefined}
      aria-describedby={effectiveAriaDescribedBy || undefined}
      className={cn(
        "group relative grid h-14 w-fit grid-cols-[minmax(0,1fr)_auto] grid-rows-[5_auto] items-center justify-between gap-x-4 rounded-lg border border-gray-400 bg-white px-4 py-2 whitespace-nowrap transition-all outline-none hover:border-gray-500 focus-visible:border focus-visible:border-gray-500 focus-visible:ring-1 focus-visible:ring-gray-100 disabled:cursor-not-allowed disabled:border-gray-100 disabled:bg-gray-100 has-[[data-slot=select-value]:empty]:grid-rows-[1fr_0fr] aria-invalid:border-red-600 aria-invalid:ring-red-600/20 data-[placeholder]:text-gray-500 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 data-[state=open]:border-gray-500 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-gray-500",
        !label && 'grid-rows-1',
        effectiveInvalid &&
          'border-red-600 hover:border-red-600 focus-visible:border-red-600',
        className
      )}
      {...props}
    >
      {label && (
        <span className="col-start-1 row-start-1 origin-top-left scale-[0.8125] text-left text-base/[1.5] text-gray-500 transition-all group-hover:text-gray-950 group-disabled:!text-gray-500 group-has-[[data-slot=select-value]:empty]:row-span-full group-has-[[data-slot=select-value]:empty]:scale-100 group-has-[[data-slot=select-value]:empty]:text-gray-950 group-aria-required:after:content-['*']">
          {label}
        </span>
      )}
      <span
        className={cn(
          'col-start-1 truncate text-left group-disabled:text-gray-500 group-has-[[data-slot=select-value]:empty]:hidden',
          label ? 'row-start-2' : 'row-start-1'
        )}
      >
        {children}
      </span>
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className='col-start-2 row-span-2 size-5 self-center fill-gray-950 transition-transform group-disabled:fill-gray-500 group-data-[state=open]:-scale-y-100' />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot='select-content'
        className={cn(
          'relative z-(--z-dropdown) h-(--radix-select-content-available-height) max-h-68 max-w-[calc(100vw-(var(--spacing)*8))] min-w-32 origin-(--radix-select-content-transform-origin) overflow-auto rounded-lg border border-gray-200 bg-white text-neutral-950 shadow-[0_2px_2px_0_rgba(0,0,0,0.05)] focus:outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        sideOffset={3}
        position={position}
        {...props}
      >
        <SelectPrimitive.Viewport
          className={cn(
            'py-1',
            position === 'popper' &&
              'h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width) scroll-my-1 [overflow:unset_!important] [-ms-overflow-style:unset_!important] [scrollbar-width:auto_!important]'
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot='select-label'
      className={cn('px-5 py-1.5 text-sm text-gray-500', className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot='select-item'
      className={cn(
        "[&_svg:not([class*='text-'])]:text-text-950 relative flex min-h-12 w-full cursor-default items-center gap-2 py-2 pr-4 pl-11 outline-hidden select-none focus:bg-gray-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[state=checked]:font-bold data-[state=checked]:text-primary [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className='absolute left-4 flex size-5 items-center justify-center'>
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className='size-5' />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot='select-separator'
      className={cn(
        'pointer-events-none -mx-1 my-1 h-px bg-gray-200',
        className
      )}
      {...props}
    />
  )
}

function Select({
  value,
  label,
  options,
  disabled = false,
  required = false,
  invalid = false,
  onValueChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value?: string
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  onValueChange?: (value: string) => void
}) {
  const { isInvalid, describedBy } = useFieldValidation({
    invalid,
  })
  return (
    <SelectRoot
      value={value}
      disabled={disabled}
      onValueChange={onValueChange}
    >
      <SelectTrigger
        label={label}
        ariaRequired={required}
        invalid={isInvalid}
        ariaDescribedBy={describedBy || undefined}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  )
}

export {
  Select,
  SelectRoot,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
