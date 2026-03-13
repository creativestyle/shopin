'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useCustomer } from '@/features/customer/customer-use-customer'

interface AccountIconBadgeProps {
  className?: string
  children: React.ReactNode
}

/**
 * Component that wraps the account icon and shows a blue dot when user is logged in
 */
export function AccountIconBadge({
  className,
  children,
}: AccountIconBadgeProps) {
  const { isLoggedIn, isLoading } = useCustomer()

  return (
    <div className={cn('relative inline-block', className)}>
      {children}
      {isLoggedIn && !isLoading && (
        <div
          className='absolute -top-0.5 -right-0.5 z-10 h-2.5 w-2.5 rounded-full border-2 border-white bg-gray-950'
          aria-label='Logged in'
        />
      )}
    </div>
  )
}
