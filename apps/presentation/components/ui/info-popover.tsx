'use client'

import * as React from 'react'
import type { PropsWithChildren } from 'react'

import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from './drawer'

import { cn } from '@/lib/utils'
import { useFinePointer } from '@/hooks/use-media-query'

// IMPORTANT: InfoPopover is meant to be used ONLY if you need to support touch devices too. For mouse-only tooltips, use Tooltip component. Keep in mind that InfoPopover will prevent default actions, thus if you need to put a tooltip for example on "Add To Cart" button, it will be not possible to add product to card on touch devices, because the popover will open instead of triggering the button action.

// Context to share state between trigger and content
interface InfoPopoverContextValue {
  hasFinePointer: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}

const InfoPopoverContext = React.createContext<InfoPopoverContextValue | null>(
  null
)

function useInfoPopoverContext(componentName: string): InfoPopoverContextValue {
  const context = React.useContext(InfoPopoverContext)

  if (!context) {
    throw new Error(`${componentName} must be used within InfoPopover`)
  }

  return context
}

// Root component that provides context
interface InfoPopoverProps {
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}

function InfoPopover({
  children,
  onOpenChange,
  disabled = false,
  ...props
}: PropsWithChildren<InfoPopoverProps>) {
  const hasFinePointer = useFinePointer()

  const contextValue: InfoPopoverContextValue = {
    hasFinePointer,
    onOpenChange,
    disabled,
  }

  if (hasFinePointer) {
    return (
      <InfoPopoverContext.Provider value={contextValue}>
        <Tooltip
          onOpenChange={onOpenChange}
          {...props}
        >
          {children}
        </Tooltip>
      </InfoPopoverContext.Provider>
    )
  }

  return (
    <InfoPopoverContext.Provider value={contextValue}>
      <Drawer
        onOpenChange={onOpenChange}
        {...props}
      >
        {children}
      </Drawer>
    </InfoPopoverContext.Provider>
  )
}

// Trigger component
interface InfoPopoverTriggerProps {
  className?: string
  disabled?: boolean
  asChild?: boolean
}

function InfoPopoverTrigger({
  children,
  className,
  disabled: localDisabled = false,
  asChild = false,
  ...props
}: PropsWithChildren<InfoPopoverTriggerProps>) {
  const { hasFinePointer, disabled: contextDisabled } =
    useInfoPopoverContext('InfoPopoverTrigger')
  const isDisabled = contextDisabled || localDisabled

  if (hasFinePointer) {
    return (
      <TooltipTrigger
        className={cn(className)}
        disabled={isDisabled}
        asChild={asChild}
        {...props}
      >
        {children}
      </TooltipTrigger>
    )
  }

  return (
    <DrawerTrigger
      className={cn(className)}
      disabled={isDisabled}
      asChild={asChild}
      {...props}
    >
      {children}
    </DrawerTrigger>
  )
}

// Content component
interface InfoPopoverContentProps {
  title: string
  className?: string
  // Tooltip specific props
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  withArrow?: boolean
  // Drawer specific props
  scheme?: 'gray' | 'white'
  showCloseButton?: boolean
}

function InfoPopoverContent({
  children,
  className,
  side = 'top',
  sideOffset = 0,
  withArrow = true,
  scheme = 'white',
  showCloseButton = true,
  title,
  ...props
}: PropsWithChildren<InfoPopoverContentProps>) {
  const { hasFinePointer } = useInfoPopoverContext('InfoPopoverContent')

  if (hasFinePointer) {
    return (
      <TooltipContent
        side={side}
        sideOffset={sideOffset}
        withArrow={withArrow}
        className={className}
        {...props}
      >
        {children}
      </TooltipContent>
    )
  }

  return (
    <DrawerContent
      scheme={scheme}
      showCloseButton={showCloseButton}
      className={className}
      {...props}
    >
      <DrawerHeader>
        <DrawerTitle>{title}</DrawerTitle>
      </DrawerHeader>
      <div className='px-7 pb-4'>
        <DrawerDescription>{children}</DrawerDescription>
      </div>
    </DrawerContent>
  )
}

export { InfoPopover, InfoPopoverTrigger, InfoPopoverContent }
