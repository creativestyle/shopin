'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CartItemCompact } from './cart-item/cart-item-compact'
import { useCart } from '../cart-use-cart'
import { CartSummary } from './cart-summary'
import { CartActions } from './cart-actions'
import { ShowMoreProducts } from './show-more-products'
import CloseIcon from '@/public/icons/close.svg'

interface AddToCartModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddToCartModal({ open, onOpenChange }: AddToCartModalProps) {
  const t = useTranslations('cart')
  const tCommon = useTranslations('common')
  const { cart, refetch, error } = useCart()
  const productsScrollRef = React.useRef<HTMLDivElement>(null)
  const scrollSentinelRef = React.useRef<HTMLDivElement>(null)
  const wasOpenRef = useRef(false)

  // Refetch cart data when modal opens
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
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className='!inset-y-0 !top-0 !right-0 !left-auto flex h-full !max-h-full w-full max-w-full !translate-x-0 !translate-y-0 flex-col p-0 md:!inset-y-0 md:!top-0 md:!max-h-full md:w-112 md:max-w-112 md:!translate-y-0'
        showCloseButton={false}
      >
        {/* Header - 55px height */}
        <DialogHeader className='relative flex h-14 w-full items-center justify-between bg-white !px-4 py-4 md:w-112'>
          <div className='relative h-6 w-6 shrink-0 opacity-0' />
          <DialogTitle className='relative flex shrink-0 flex-col justify-center text-center text-base leading-none font-normal text-nowrap text-gray-950'>
            <p className='leading-[1.1] whitespace-pre'>
              {`${t('title')} (${cart.itemCount})`}
            </p>
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className='relative flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center'
            aria-label={tCommon('close')}
          >
            <CloseIcon className='h-6 w-6 shrink-0 text-gray-700' />
          </button>
        </DialogHeader>

        {/* Scrollable Content Area - positioned at left-6 top-14 with width 409px */}
        <div
          ref={productsScrollRef}
          className='absolute top-14 bottom-72 left-4 flex w-[calc(100%-2rem)] flex-col items-start overflow-x-clip overflow-y-auto md:left-6 md:w-102'
        >
          {/* Toast Message */}
          <div className='flex w-full shrink-0 items-center gap-4 overflow-clip rounded-lg bg-green-100 p-4'>
            <div className='min-w-0 flex-1'>
              <p className='text-sm/[1.6] font-normal text-gray-700'>
                {t('addToCartModal.toastMessage')}
              </p>
            </div>
          </div>

          {/* Product List */}
          <div className='mt-0 w-full space-y-0 pb-10'>
            {[...cart.lineItems].reverse().map((item) => (
              <CartItemCompact
                key={item.id}
                item={item}
              />
            ))}
          </div>

          {/* Sentinel element for IntersectionObserver */}
          <div
            ref={scrollSentinelRef}
            className='h-0 w-full'
          />
        </div>

        {/* Footer - Fixed at bottom, centered */}
        <div className='absolute bottom-0 left-1/2 flex w-full shrink-0 translate-x-[-50%] flex-col items-start overflow-clip bg-white px-0 pt-6 pb-4 shadow-[0px_-5px_10px_0px_rgba(0,0,0,0.1)] md:w-112'>
          <ShowMoreProducts
            scrollRef={productsScrollRef}
            sentinelRef={scrollSentinelRef}
          />

          {/* Cart Summary Section */}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
