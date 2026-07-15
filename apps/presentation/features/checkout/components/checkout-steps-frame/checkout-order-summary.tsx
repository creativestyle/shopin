'use client'

import { useCart } from '@/features/cart/cart-use-cart'
import { CartPreview } from '@/features/cart/cart-preview'
import { useTranslations } from 'next-intl'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorDisplay } from '@/components/ui/error-display'

export function CheckoutOrderSummary() {
  const t = useTranslations('cart')
  const tCommon = useTranslations()
  const { cart, isLoading, error } = useCart()

  return (
    <section
      aria-label={t('summary.title')}
      className='lg:sticky lg:top-8 lg:h-fit'
    >
      <div className='flex h-full w-full flex-col rounded-lg border border-gray-200 bg-white lg:max-h-[calc(100vh-6rem-2rem)]'>
        <div className='shrink-0 p-6 pb-0'>
          <h2 className='mb-6 text-lg/[1.1] font-bold text-gray-950'>
            {t('summary.title')}
          </h2>
        </div>
        <div aria-live='polite'>
          {isLoading && (
            <div
              role='status'
              aria-label={tCommon('common.loading')}
            >
              <LoadingSpinner className='size-6' />
            </div>
          )}
        </div>
        {error && (
          <div
            className='p-6'
            role='alert'
          >
            <ErrorDisplay>{t('errors.fetchCart')}</ErrorDisplay>
          </div>
        )}
        {!isLoading && !error && cart && (
          <div className='flex min-h-0 flex-1 flex-col'>
            <CartPreview
              cart={cart}
              scrollable
              className='flex min-h-0 flex-1 flex-col'
            />
          </div>
        )}
      </div>
    </section>
  )
}
