'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'

import * as SheetPrimitive from '@radix-ui/react-dialog'
import CloseIcon from '@/public/icons/close.svg'

import { cn } from '@/lib/utils'

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return (
    <SheetPrimitive.Root
      data-slot='sheet'
      {...props}
    />
  )
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return (
    <SheetPrimitive.Trigger
      data-slot='sheet-trigger'
      {...props}
    />
  )
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return (
    <SheetPrimitive.Close
      data-slot='sheet-close'
      {...props}
    />
  )
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return (
    <SheetPrimitive.Portal
      data-slot='sheet-portal'
      {...props}
    />
  )
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot='sheet-overlay'
      className={cn(
        'fixed inset-0 z-(--z-modal) bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left'
  showCloseButton?: boolean
}) {
  const t = useTranslations('common')

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot='sheet-content'
        className={cn(
          'group fixed z-(--z-modal) flex flex-col bg-white shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:animate-in data-[state=open]:duration-500',
          side === 'right' &&
            'inset-y-0 right-0 h-full w-[calc(100%-theme(spacing.5))] max-w-100 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
          side === 'left' &&
            'inset-y-0 left-0 h-full w-[calc(100%-theme(spacing.5))] max-w-100 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
          side === 'top' &&
            'inset-x-0 top-0 h-auto data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
          side === 'bottom' &&
            'inset-x-0 bottom-0 h-auto data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
          className
        )}
        {...props}
      >
        {showCloseButton && (
          <SheetPrimitive.Close className='absolute top-3 right-3 flex size-8 cursor-pointer items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-white hover:text-primary focus:bg-white focus:text-primary focus:ring-3 focus:ring-white/20 focus:outline-hidden'>
            <CloseIcon
              className='pointer-events-none size-7 shrink-0'
              aria-hidden='true'
            />
            <span className='sr-only'>{t('close')}</span>
          </SheetPrimitive.Close>
        )}
        {children}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sheet-header'
      className={cn(
        'shrink-0 bg-white p-4 pr-14 text-base text-gray-950 shadow-[0_5px_10px_0_rgba(0,0,0,0.05)]',
        className
      )}
      {...props}
    />
  )
}

function SheetBody({ className, ...props }: React.ComponentProps<'div'>) {
  const t = useTranslations('common')

  return (
    <div
      data-slot='sheet-body'
      tabIndex={0}
      role='region'
      aria-label={t('scrollableDialogContent')}
      className={cn(
        'flex h-full flex-col overflow-y-auto p-4 text-gray-500 focus:outline-none focus-visible:shadow-[inset_0_0_3px_rgba(0,0,0,0.3)]',
        className
      )}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sheet-footer'
      className={cn(
        'shrink-0 px-4 py-3 shadow-[0_-4px_4px_0_rgba(0,0,0,0.05)]',
        className
      )}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot='sheet-title'
      className={cn('leading-[1.5] font-bold', className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot='sheet-description'
      className={cn('mb-4 text-gray-500', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
