'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import CloseIcon from '@/public/icons/close.svg'

import * as DialogPrimitive from '@radix-ui/react-dialog'

/**
 * Transition duration for dialog animations in milliseconds.
 * Used to generate the Tailwind duration class.
 */
export const DIALOG_TRANSITION_DURATION_MS = 200

const DIALOG_TRANSITION_DURATION_CLASS_NAME = {
  [DIALOG_TRANSITION_DURATION_MS]: 'duration-200',
} as const

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return (
    <DialogPrimitive.Root
      data-slot='dialog'
      {...props}
    />
  )
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return (
    <DialogPrimitive.Trigger
      data-slot='dialog-trigger'
      {...props}
    />
  )
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return (
    <DialogPrimitive.Portal
      data-slot='dialog-portal'
      {...props}
    />
  )
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      data-slot='dialog-close'
      {...props}
    />
  )
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot='dialog-overlay'
      className={cn(
        'fixed inset-0 z-(--z-modal) bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const t = useTranslations('common')

  return (
    <DialogPortal data-slot='dialog-portal'>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot='dialog-content'
        className={cn(
          'group fixed inset-0 right-0 left-auto z-(--z-modal) flex max-h-full w-[calc(100%-(var(--spacing)*5))] max-w-120 flex-col bg-white shadow-lg',
          DIALOG_TRANSITION_DURATION_CLASS_NAME[DIALOG_TRANSITION_DURATION_MS],
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 max-md:data-[state=closed]:slide-out-to-right max-md:data-[state=open]:slide-in-from-right md:inset-auto md:top-[50%] md:right-auto md:left-[50%] md:max-h-[calc(100%-var(--spacing)*12)] md:max-w-188 md:translate-[-50%] md:rounded-lg md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95',
          className
        )}
        {...props}
      >
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot='dialog-close'
            className='fixed top-4 right-4 flex size-8 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white shadow-[0_2px_2px_0_rgba(0,0,0,0.05)] transition hover:ring-3 hover:ring-gray-200/50 focus:shadow-none focus:ring-3 focus:ring-gray-200/50 focus:outline-hidden md:size-12'
          >
            <CloseIcon
              aria-hidden='true'
              className='pointer-events-none size-6 shrink-0'
            />
            <span className='sr-only'>{t('close')}</span>
          </DialogPrimitive.Close>
        )}
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-header'
      className={cn(
        'pt-12 pr-16 pb-6 text-gray-950 max-md:flex max-md:shrink-0 max-md:gap-2 max-md:py-6 max-md:pl-6 max-md:shadow-[0_2px_2px_0_rgba(0,0,0,0.05)] md:px-12',
        className
      )}
      {...props}
    />
  )
}

function DialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  const t = useTranslations('common')

  return (
    <div
      data-slot='dialog-body'
      tabIndex={0}
      role='region'
      aria-label={t('scrollableDialogContent')}
      className={cn(
        'flex h-full flex-col overflow-y-auto p-6 pt-10 text-gray-500 group-has-[>div[data-slot=dialog-footer]]:pb-0 focus:outline-none focus-visible:shadow-[inset_0_0_3px_rgba(0,0,0,0.3)] md:p-12 md:group-has-[>div[data-slot=dialog-header]]:pt-0',
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-footer'
      className={cn(
        'max-md:flex max-md:shrink-0 max-md:gap-2 max-md:p-6 md:px-12 md:pt-6 md:pb-12',
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot='dialog-title'
      className={cn('leading-[1.3] font-semibold', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot='dialog-description'
      className={cn('mb-4 text-gray-500', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
