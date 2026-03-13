'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { toast as sonnerToast } from 'sonner'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import InfoIcon from '@/public/icons/info.svg'
import CheckmarkIcon from '@/public/icons/checkmark.svg'
import CloseIcon from '@/public/icons/close.svg'
import NotificationIcon from '@/public/icons/notification.svg'
import { Button } from './button'

interface ToastProps {
  id?: string | number
  type?: 'info' | 'infoLight' | 'success' | 'error' | 'warning'
  duration?: number
  critical?: boolean
  withIcon?: boolean
  withCloseButton?: boolean
  onDismiss?: () => void
  onAutoClose?: () => void
  className?: string
}

const toastConfig: Record<
  NonNullable<ToastProps['type']>,
  {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    iconColorClass: string
    variantClass: string
  }
> = {
  info: {
    icon: InfoIcon,
    iconColorClass: 'text-[#0EA5E9]',
    variantClass: 'bg-[#E0F2FE] text-[#374151] ring-1 ring-[#374151]/20',
  },
  infoLight: {
    icon: InfoIcon,
    iconColorClass: 'text-[#374151]',
    variantClass:
      'bg-[#FFFFFF] text-[#374151] ring-1 ring-[#374151]/20 [[data-sonner-toaster=true]_&]:shadow-sm',
  },
  success: {
    icon: CheckmarkIcon,
    iconColorClass: 'text-[#22C55E]',
    variantClass: 'bg-[#DCFCE7] text-[#374151] ring-1 ring-[#374151]/20',
  },
  error: {
    icon: CloseIcon,
    iconColorClass: 'text-[#EF4444]',
    variantClass: 'bg-[#FECACA] text-[#374151] ring-1 ring-[#374151]/20',
  },
  warning: {
    icon: NotificationIcon,
    iconColorClass: 'text-[#F97316]',
    variantClass: 'bg-[#FFEDD5] text-[#374151] ring-1 ring-[#374151]/20',
  },
}

function addToast({ children, ...toast }: React.PropsWithChildren<ToastProps>) {
  if (!children) {
    return null
  }

  return sonnerToast.custom(
    (id) => (
      <Toast
        id={id}
        {...toast}
      >
        {children}
      </Toast>
    ),
    {
      ...(toast.id ? { id: toast.id } : {}),
      duration: (toast.duration ?? toast.type === 'error') ? 15000 : 7000,
      onDismiss: toast.onDismiss,
      onAutoClose: toast.onAutoClose,
    }
  )
}

function dismissToastById(id: string | number) {
  return sonnerToast.dismiss(id)
}

function dismissAllToasts() {
  return sonnerToast.dismiss()
}

const types = cva(
  'flex w-full items-center rounded-lg p-4 sm:max-w-96 sm:min-w-50',
  {
    variants: {
      type: Object.fromEntries(
        Object.entries(toastConfig).map(([key, config]) => [
          key,
          config.variantClass,
        ])
      ),
    },
    defaultVariants: {
      type: 'info',
    },
  }
)

function Toast({
  type = 'info',
  id,
  critical = false,
  withIcon = true,
  withCloseButton = true,
  className,
  children,
}: React.PropsWithChildren<ToastProps>) {
  const t = useTranslations('common')
  const { icon: IconComponent, iconColorClass } = toastConfig[type ?? 'info']

  return (
    <div
      className={cn(types({ type }), className)}
      aria-live={critical ? 'assertive' : 'polite'}
      aria-atomic='true'
      role={critical ? 'alert' : 'status'}
    >
      <div className='flex flex-1 items-center'>
        <div className='flex w-full items-center gap-3 text-sm/[1.6] font-normal not-italic'>
          {withIcon && (
            <IconComponent
              className={cn('size-6 shrink-0', iconColorClass)}
              aria-hidden='true'
            />
          )}
          {children && <div>{children}</div>}
        </div>
      </div>
      {withCloseButton && (
        <Button
          variant='tertiary'
          scheme='black'
          className='focus-visible:ring-current/20'
          aria-label={t('close')}
          onClick={() => sonnerToast.dismiss(id)}
        >
          <CloseIcon
            className='size-5 shrink-0'
            aria-hidden='true'
          />
        </Button>
      )}
    </div>
  )
}

export { addToast, dismissToastById, dismissAllToasts, Toast }
