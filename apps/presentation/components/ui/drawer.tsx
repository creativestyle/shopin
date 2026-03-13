'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

import { Drawer as DrawerPrimitive } from 'vaul'
import CloseIcon from '@/public/icons/close.svg'

function Drawer({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return (
    <DrawerPrimitive.Root
      data-slot='drawer'
      {...props}
    />
  )
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return (
    <DrawerPrimitive.Trigger
      data-slot='drawer-trigger'
      {...props}
    />
  )
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return (
    <DrawerPrimitive.Portal
      data-slot='drawer-portal'
      {...props}
    />
  )
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return (
    <DrawerPrimitive.Close
      data-slot='drawer-close'
      {...props}
    />
  )
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot='drawer-overlay'
      className={cn(
        'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  scheme = 'gray',
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  scheme?: 'gray' | 'white'
  showCloseButton?: boolean
}) {
  const t = useTranslations('common')

  return (
    <DrawerPortal data-slot='drawer-portal'>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot='drawer-content'
        className={cn(
          'group/drawer-content fixed z-50 flex h-auto flex-col gap-4',
          'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg lg:data-[vaul-drawer-direction=bottom]:mx-auto lg:data-[vaul-drawer-direction=bottom]:max-w-256',
          {
            'bg-gray-100': scheme === 'gray',
            'bg-white': scheme === 'white',
          },
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'mx-auto mt-3 hidden h-1 w-9 shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block',
            {
              'bg-gray-400/60': scheme === 'gray',
              'bg-gray-400/40': scheme === 'white',
            }
          )}
        />
        {children}
        {showCloseButton && (
          <DrawerPrimitive.Close
            data-slot='drawer-close'
            className='fixed top-9 right-4 flex size-8 cursor-pointer items-center justify-center rounded-full transition hover:bg-white focus:bg-white focus:shadow-none focus:outline-hidden focus-visible:ring-3 focus-visible:ring-gray-400/30'
          >
            <CloseIcon
              aria-hidden='true'
              className='pointer-events-none size-6 shrink-0'
            />
            <span className='sr-only'>{t('close')}</span>
          </DrawerPrimitive.Close>
        )}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='drawer-header'
      className={cn(
        'flex flex-col gap-0.5 py-2 pr-16 pl-7 md:gap-1.5',
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='drawer-footer'
      className={cn('mt-auto flex flex-col gap-2 px-4 pb-4', className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot='drawer-title'
      className={cn('text-lg/[1.3] font-bold text-gray-950', className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot='drawer-description'
      className={cn(className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
