'use client'

import { Button } from '@/components/ui/button'
import { Link } from '@/lib/navigation'
import { useTranslations } from 'next-intl'

interface CartActionsProps {
  variant?: 'default' | 'modal'
  onClose?: () => void
}

export function CartActions({
  variant = 'default',
  onClose,
}: CartActionsProps) {
  const t = useTranslations('cart')

  if (variant === 'modal') {
    return (
      <div className='flex w-full items-start gap-4'>
        <Button
          type='button'
          variant='secondary'
          scheme='black'
          className='flex-1'
          onClick={onClose}
        >
          {t('addToCartModal.continue')}
        </Button>
        <Button
          variant='primary'
          className='flex-1'
          asChild
        >
          <Link
            href='/cart'
            onClick={onClose}
          >
            {t('addToCartModal.goToCart')}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='flex w-full flex-col gap-4'>
      <Button
        variant='primary'
        className='w-full'
        asChild
      >
        <Link href='/checkout'>{t('checkout')}</Link>
      </Button>
    </div>
  )
}
