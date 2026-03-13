'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

function SwitchTabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot='switch-tabs'
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  )
}

function SwitchTabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot='switch-tabs-list'
      className={cn(
        'flex items-center justify-center gap-2 rounded-lg bg-gray-200 p-2 text-gray-950',
        className
      )}
      {...props}
    />
  )
}

function SwitchTabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot='switch-tabs-trigger'
      className={cn(
        'relative z-[2] inline-flex flex-1 items-center justify-center gap-2 rounded-lg p-2 leading-[1.5] font-bold ring-offset-3 transition-all focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:ring-offset-0 focus-visible:outline-0 disabled:pointer-events-none disabled:opacity-50',
        'before:absolute before:inset-0 before:-z-[1] before:scale-30 before:rounded-lg before:bg-white before:opacity-0 before:shadow-[0_5px_10px_0_rgba(0,0,0,0.1)] before:transition-all before:duration-500 before:ease-(--ease-spring-3) data-[state=active]:before:scale-100 data-[state=active]:before:opacity-100 data-[state=inactive]:hover:bg-gray-400/15',
        className
      )}
      {...props}
    />
  )
}

function SwitchTabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot='switch-tabs-content'
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { SwitchTabs, SwitchTabsList, SwitchTabsTrigger, SwitchTabsContent }
