'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import ChevronDownIcon from '@/public/icons/chevron-down.svg'

import { cn } from '@/lib/utils'

type AccordionDisabledBreakpoints = { md: boolean; lg: boolean }
const AccordionForceMountContext =
  React.createContext<AccordionDisabledBreakpoints>({ md: false, lg: false })

// Apply hidden only at breakpoints where the accordion is still interactive;
// omit it at breakpoints where the item is "disabled" (content always visible).
function getClosedHiddenClass(
  disabledMd: boolean,
  disabledLg: boolean
): string {
  if (disabledMd && disabledLg) {
    return 'max-md:data-[state=closed]:hidden'
  }
  if (disabledMd) {
    return 'max-md:data-[state=closed]:hidden lg:data-[state=closed]:hidden'
  }
  if (disabledLg) {
    return 'max-lg:data-[state=closed]:hidden'
  }
  return 'data-[state=closed]:hidden'
}

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot='accordion'
      {...props}
    />
  )
}

function AccordionItem({
  className,
  disabledMd = false,
  disabledLg = false,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item> & {
  disabledMd?: boolean
  disabledLg?: boolean
}) {
  if (!disabledMd && !disabledLg) {
    return (
      <AccordionPrimitive.Item
        data-slot='accordion-item'
        className={cn('border-b border-gray-200 last:border-b-0', className)}
        {...props}
      />
    )
  }

  return (
    <AccordionForceMountContext.Provider
      value={{ md: disabledMd, lg: disabledLg }}
    >
      <AccordionPrimitive.Item
        data-slot='accordion-item'
        className={cn(
          'border-b border-gray-200 last:border-b-0',
          {
            'md:max-lg:**:data-[slot=accordion-trigger]:pointer-events-none md:max-lg:[&_[data-slot=accordion-trigger]>svg]:hidden':
              disabledMd,
            'lg:**:data-[slot=accordion-trigger]:pointer-events-none lg:[&_[data-slot=accordion-trigger]>svg]:hidden':
              disabledLg,
          },
          className
        )}
        {...props}
      />
    </AccordionForceMountContext.Provider>
  )
}

function AccordionTrigger({
  className,
  children,
  withArrow = true,
  level = 3,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
  withArrow?: boolean
  level?: 2 | 3 | 4 | 5 | 6
}) {
  const HeadingTag = `h${level}` as const
  return (
    <AccordionPrimitive.Header asChild>
      <HeadingTag className='flex gap-4'>
        <AccordionPrimitive.Trigger
          data-slot='accordion-trigger'
          className={cn(
            'flex flex-1 cursor-pointer items-start gap-4 lord-of-the-focus-ring rounded-md py-6 text-left text-lg/[1.5] font-medium text-gray-950 uppercase transition-all focus-visible:border-neutral-950 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
            className
          )}
          {...props}
        >
          {children}
          {withArrow && (
            <ChevronDownIcon
              className='pointer-events-none ml-auto size-6 shrink-0 transition-transform duration-200'
              aria-hidden='true'
            />
          )}
        </AccordionPrimitive.Trigger>
      </HeadingTag>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  forceMount: forceMountProp,
  ...props
}: Omit<
  React.ComponentProps<typeof AccordionPrimitive.Content>,
  'forceMount'
> & {
  forceMount?: boolean
}) {
  const { md: disabledMd, lg: disabledLg } = React.useContext(
    AccordionForceMountContext
  )
  const forceMount = forceMountProp ?? (disabledMd || disabledLg)

  return (
    <AccordionPrimitive.Content
      data-slot='accordion-content'
      className={cn(
        'overflow-hidden',
        forceMount
          ? getClosedHiddenClass(disabledMd, disabledLg)
          : 'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down'
      )}
      forceMount={forceMount || undefined}
      {...props}
    >
      <div className={cn('pb-6', className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
