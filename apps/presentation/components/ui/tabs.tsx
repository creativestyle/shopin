'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { HorizontalScroller } from './horizontal-scroller'
import { cn } from '@/lib/utils'

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot='tabs'
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <HorizontalScroller className='border-b border-gray-200'>
      <TabsPrimitive.List
        data-slot='tabs-list'
        className={cn(
          'relative z-10 inline-flex w-fit items-center gap-4 lg:gap-8',
          'min-w-full lg:min-w-0',
          className
        )}
        {...props}
      />
    </HorizontalScroller>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot='tabs-trigger'
      className={cn(
        'relative inline-flex items-center gap-2 py-3 font-bold whitespace-nowrap text-gray-500 transition-colors after:absolute after:bottom-0 after:left-0 after:h-0 after:w-full after:bg-gray-400 after:transition-all after:duration-250 hover:after:h-0.5 focus-visible:!text-primary focus-visible:outline-0 disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:text-gray-950 data-[state=active]:after:h-1 data-[state=active]:after:bg-primary',
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot='tabs-content'
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
