'use client'

import Link from 'next/link'
import { cn } from '../../lib/utils'
import AccountIcon from '../../public/icons/account.svg'
import { AccountIconBadge } from './account-icon-badge'
import { useAccountHref } from '@/features/account/use-account-href'

interface MobileAccountLinkProps {
  'className'?: string
  'aria-label': string
}

export function MobileAccountLink({
  className,
  'aria-label': ariaLabel,
}: MobileAccountLinkProps) {
  // Determine href based on login status
  const accountHref = useAccountHref()

  return (
    <Link
      href={accountHref}
      className={cn('relative', className)}
      aria-label={ariaLabel}
    >
      <AccountIconBadge>
        <AccountIcon className='size-6' />
      </AccountIconBadge>
    </Link>
  )
}
