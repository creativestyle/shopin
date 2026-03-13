'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import CartIcon from '../../public/icons/cart.svg'
import { CartBadge } from '@/features/cart/cart-badge'

export function HeaderCartButton() {
  const t = useTranslations('userMenu')

  return (
    <Link
      href='/cart'
      className='relative p-1 text-gray-900 hover:bg-gray-100 hover:text-primary'
    >
      <CartIcon className='size-6' />
      <span className='sr-only'>{t('cart')}</span>
      {/* Cart number badge for mobile */}
      <CartBadge className='absolute -top-1 -right-1' />
    </Link>
  )
}
