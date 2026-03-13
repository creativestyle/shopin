'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface CartActionsProps {
  variant?: 'default' | 'modal'
  onLinkClick?: () => void
}

export function CartActions({
  variant = 'default',
  onLinkClick,
}: CartActionsProps) {
  const t = useTranslations('cart')

  const isModal = variant === 'modal'

  return (
    <div
      className={cn('flex w-full gap-4', {
        'items-start': isModal,
        'flex-col': !isModal,
      })}
    >
      {isModal && (
        <Button
          variant='secondary'
          scheme='black'
          className='flex-1'
          asChild
        >
          <Link
            href='/cart'
            onClick={onLinkClick}
          >
            {t('addToCartModal.goToCart')}
          </Link>
        </Button>
      )}
      <Button
        variant='primary'
        className={cn({
          'flex-1': isModal,
          'w-full': !isModal,
        })}
        asChild
      >
        <Link
          href='/checkout'
          onClick={onLinkClick}
        >
          {t('checkout')}
        </Link>
      </Button>
    </div>
  )
}
