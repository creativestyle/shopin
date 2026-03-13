'use client'

import { CartItem } from './components/cart-item/cart-item'
import { CartSummary } from './components/cart-summary'
import { CartActions } from './components/cart-actions'
import { EmptyCart } from './components/empty-cart'
import { useTranslations } from 'next-intl'
import { useCart } from './cart-use-cart'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorDisplay } from '@/components/ui/error-display'

export function CartContent() {
  const t = useTranslations('cart')
  const { cart, isLoading, error } = useCart()

  if (isLoading) {
    return <LoadingSpinner className='size-8' />
  }

  if (error) {
    return (
      <div className='flex flex-col items-center'>
        <ErrorDisplay centered>{t('errors.fetchCart')}</ErrorDisplay>
      </div>
    )
  }

  if (!cart || cart.itemCount === 0) {
    return <EmptyCart />
  }

  return (
    <div className='flex flex-col gap-4 xl:flex-row xl:gap-8'>
      <div className='min-w-0 flex-1'>
        <div className='space-y-0'>
          {cart.lineItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
            />
          ))}
        </div>
      </div>
      <div className='h-fit xl:sticky xl:top-4 xl:w-full xl:max-w-lg'>
        <CartSummary
          cart={cart}
          actions={<CartActions />}
        />
      </div>
    </div>
  )
}
