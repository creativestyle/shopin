'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function EmptyCart() {
  const t = useTranslations('cart.empty')

  return (
    <div className='flex w-full flex-col items-center px-0'>
      <p className='mb-6 px-0 text-center text-base leading-relaxed text-gray-700'>
        {t('message')}
      </p>

      <div className='flex items-center gap-3 lg:gap-4'>
        <Button
          variant='secondary'
          scheme='black'
          className='flex-1 text-center lg:flex-none'
          asChild
        >
          <Link href='/'>{t('continueShopping')}</Link>
        </Button>
        <Button
          variant='primary'
          scheme='red'
          className='flex-1 text-center lg:flex-none'
          asChild
        >
          <Link href='/sign-in'>{t('signIn')}</Link>
        </Button>
      </div>
    </div>
  )
}
