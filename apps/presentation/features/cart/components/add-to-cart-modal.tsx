'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { CartItemCompact } from './cart-item/cart-item-compact'
import { useCart } from '../cart-use-cart'
import { CartSummary } from './cart-summary'
import { CartActions } from './cart-actions'
import { ShowMoreProducts } from './show-more-products'

interface AddToCartModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddToCartModal({ open, onOpenChange }: AddToCartModalProps) {
  const t = useTranslations('cart')
  const { cart, refetch, error } = useCart()
  const productsScrollRef = React.useRef<HTMLDivElement>(null)
  const scrollSentinelRef = React.useRef<HTMLDivElement>(null)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      refetch()
    }
    wasOpenRef.current = open
  }, [open, refetch])

  if (error || !cart || cart.itemCount === 0) {
    return null
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent className='md:max-w-md'>
        <SheetHeader className='text-center'>
          <SheetTitle className='font-normal'>
            {`${t('title')} (${cart.itemCount})`}
          </SheetTitle>
          <SheetDescription className='sr-only'>
            {t('addToCartModal.dialogDescription')}
          </SheetDescription>
        </SheetHeader>

        <div
          ref={productsScrollRef}
          className='flex flex-1 flex-col overflow-y-auto p-4'
        >
          <div className='flex w-full shrink-0 items-center gap-4 overflow-clip rounded-lg bg-green-100 p-4'>
            <div className='min-w-0 flex-1'>
              <p className='text-sm/[1.6] font-normal text-gray-700'>
                {t('addToCartModal.toastMessage')}
              </p>
            </div>
          </div>

          <div className='mt-0 w-full space-y-0 pb-10'>
            {[...cart.lineItems].reverse().map((item) => (
              <CartItemCompact
                key={item.id}
                item={item}
              />
            ))}
          </div>

          <div
            ref={scrollSentinelRef}
            className='h-0 w-full'
          />
        </div>

        <SheetFooter className='flex-col items-start px-0 pt-6 pb-4'>
          <ShowMoreProducts
            scrollRef={productsScrollRef}
            sentinelRef={scrollSentinelRef}
          />
          <CartSummary
            cart={cart}
            variant='modal'
            actions={
              <CartActions
                variant='modal'
                onLinkClick={() => onOpenChange(false)}
              />
            }
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
