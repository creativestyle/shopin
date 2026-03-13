'use client'

import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import AccountIcon from '../../public/icons/account.svg'
import HeartIcon from '../../public/icons/heart.svg'
import CartIcon from '../../public/icons/cart.svg'
import PinIcon from '../../public/icons/pin.svg'
import { AccountIconBadge } from './account-icon-badge'
import { useAccountHref } from '@/features/account/use-account-href'
import { CartBadge } from '@/features/cart/cart-badge'
import { WishlistBadge } from '@/features/wishlist/wishlist-badge'

interface UserMenuWrapperProps {
  className?: string
}

export function UserMenuWrapper({ className }: UserMenuWrapperProps) {
  const t = useTranslations('userMenu')
  const accountHref = useAccountHref()

  return (
    <div className={cn('flex items-center gap-2 lg:gap-3', className)}>
      {/* Store Locator */}
      <Button
        variant='tertiary'
        scheme='black'
        className='h-6 min-w-6'
      >
        <PinIcon className='size-6' />
        <span className='sr-only'>{t('storeLocator')}</span>
      </Button>

      {/* Account */}
      <Button
        variant='tertiary'
        scheme='black'
        className='relative h-6 min-w-6'
        asChild
      >
        <Link href={accountHref}>
          <AccountIconBadge>
            <AccountIcon className='size-6' />
          </AccountIconBadge>
          <span className='sr-only'>{t('account')}</span>
        </Link>
      </Button>

      {/* Wishlist */}
      <Button
        variant='tertiary'
        scheme='black'
        className='relative h-6 min-w-6'
        asChild
      >
        <Link href='/wishlist'>
          <HeartIcon className='size-6' />
          <span className='sr-only'>{t('wishlist')}</span>
          {/* Wishlist number badge - Positioned at bottom-right */}
          <WishlistBadge className='absolute right-0 bottom-0' />
        </Link>
      </Button>

      {/* Cart with number badge */}
      <Button
        variant='tertiary'
        scheme='black'
        className='relative h-6 min-w-6'
        asChild
      >
        <Link href='/cart'>
          <CartIcon className='size-6' />
          <span className='sr-only'>{t('cart')}</span>
          {/* Cart number badge - Positioned at bottom-right */}
          <CartBadge className='absolute right-0 bottom-0' />
        </Link>
      </Button>
    </div>
  )
}
