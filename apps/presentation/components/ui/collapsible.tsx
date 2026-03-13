'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'

function Collapsible({
  bordered = false,
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root> & {
  bordered?: boolean
}) {
  return (
    <CollapsiblePrimitive.Root
      data-slot='collapsible'
      className={cn(
        bordered
          ? 'rounded-lg border border-gray-200 bg-white transition-colors has-[>button:focus-visible]:ring-3 has-[>button:focus-visible]:ring-gray-300/40 has-[>button[data-state=closed]:hover]:border-gray-400 [&>*]:px-4 [&>*]:pt-0 [&>*]:pb-4 [&>button]:w-full [&>button]:py-6'
          : '[&>button:focus-visible]:ring-3 [&>button:focus-visible]:ring-gray-300/40 [&>button:focus-visible]:ring-offset-3',
        className
      )}
      {...props}
    />
  )
}

function CollapsibleTrigger({
  children,
  className,
  indicator = true,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger> & {
  indicator?: boolean
}) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot='collapsible-trigger'
      className={cn(
        'group flex items-center gap-4 rounded-lg text-lg/[1.5] font-bold text-gray-950 focus:outline-none',
        className
      )}
      {...props}
    >
      {indicator && (
        <span
          className='relative -mt-1 size-3.5 shrink-0 self-center text-gray-950 transition-transform duration-300 group-data-[state=open]:rotate-180'
          aria-hidden='true'
        >
          <span className='absolute left-1/2 block h-3.5 w-0.5 -translate-x-1/2 bg-current transition-transform duration-300 group-data-[state=open]:rotate-90'></span>
          <span className='absolute top-1/2 block h-0.5 w-3.5 -translate-y-1/2 bg-current'></span>
        </span>
      )}
      {children}
    </CollapsiblePrimitive.CollapsibleTrigger>
  )
}

function CollapsibleContent({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot='collapsible-content'
      className={cn(
        'pt-4 ease-in-out data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-4 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-4',
        className
      )}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
