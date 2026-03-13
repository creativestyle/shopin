'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { cn } from '@/lib/utils'

export const TOOLTIP_DELAY = {
  fast: 250,
  medium: 500,
  slow: 700,
} as const

type TooltipDelayValue = (typeof TOOLTIP_DELAY)[keyof typeof TOOLTIP_DELAY]

interface TooltipProviderProps extends Omit<
  React.ComponentProps<typeof TooltipPrimitive.Provider>,
  'delayDuration'
> {
  delayDuration?: TooltipDelayValue
}

// IMPORTANT: Tooltip is hidden on pointer-coarse devices via CSS (pointer-coarse:hidden). This means that it will only work on devices with fine pointer capabilities (like a mouse). If you need also support for touch devices, consider using InfoPopover.
function TooltipProvider({
  delayDuration = TOOLTIP_DELAY.fast,
  ...props
}: TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider
      data-slot='tooltip-provider'
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root
        data-slot='tooltip'
        {...props}
      />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return (
    <TooltipPrimitive.Trigger
      data-slot='tooltip-trigger'
      className={cn(
        'rounded-sm ring-offset-3 focus-visible:ring-1 focus-visible:ring-current/20 focus-visible:outline-0',
        className
      )}
      {...props}
    />
  )
}

function TooltipContent({
  className,
  sideOffset = 0,
  withArrow = true,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & {
  withArrow?: boolean
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot='tooltip-content'
        sideOffset={sideOffset}
        className={cn(
          'w-fit max-w-64 origin-(--radix-tooltip-content-transform-origin) animate-in bg-gray-950 px-4 py-2 text-center text-xs/[1.6] text-balance text-white fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 pointer-coarse:hidden',
          className
        )}
        {...props}
      >
        {children}
        {withArrow && (
          <TooltipPrimitive.Arrow className='z-(--z-tooltip) size-4 translate-y-[calc(-50%_-_0.5)] rotate-45 bg-gray-950 fill-gray-950' />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
