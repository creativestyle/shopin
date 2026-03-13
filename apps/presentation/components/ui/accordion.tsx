'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import ChevronDownIcon from '@/public/icons/chevron-down.svg'

import { cn } from '@/lib/utils'

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
  return (
    <AccordionPrimitive.Item
      data-slot='accordion-item'
      className={cn(
        'border-b border-gray-200 last:border-b-0',
        {
          'md:max-lg:[&_[data-slot=accordion-trigger]]:pointer-events-none md:max-lg:[&_[data-slot=accordion-trigger]>svg]:hidden md:max-lg:[&>div]:!animate-none md:max-lg:data-[state=closed]:[&>div]:!block':
            disabledMd,
          'lg:[&_[data-slot=accordion-trigger]]:pointer-events-none lg:[&_[data-slot=accordion-trigger]>svg]:hidden lg:[&>div]:!animate-none lg:data-[state=closed]:[&>div]:!block':
            disabledLg,
        },
        className
      )}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  withArrow = true,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
  withArrow?: boolean
}) {
  return (
    <AccordionPrimitive.Header className='flex gap-4'>
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
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  forceMount = true,
  ...props
}: Omit<
  React.ComponentProps<typeof AccordionPrimitive.Content>,
  'forceMount'
> & {
  forceMount?: boolean
}) {
  function handleAnimationStart(e: React.AnimationEvent<HTMLDivElement>) {
    ;(e.target as HTMLDivElement).classList.remove('data-[state=closed]:hidden')
  }

  function handleAnimationEnd(e: React.AnimationEvent<HTMLDivElement>) {
    const el = e.target as HTMLDivElement

    if (el.getAttribute('data-state') === 'closed') {
      el.classList.add('data-[state=closed]:hidden')
    }
  }

  return (
    <AccordionPrimitive.Content
      data-slot='accordion-content'
      className='overflow-hidden data-[state=closed]:hidden data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-6 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-6'
      onAnimationStart={handleAnimationStart}
      onAnimationEnd={handleAnimationEnd}
      {...(forceMount && { forceMount: true })}
      {...props}
    >
      <div className={cn('pb-6', className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
