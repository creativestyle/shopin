'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfigurableOptions } from '@/components/ui/configurable-options/configurable-options'
import { Button } from '@/components/ui/button'
import { useAddToCart } from '../hooks/use-add-to-cart'
import { useTranslations } from 'next-intl'
import { useBffFetchClient } from '@/lib/bff/core/bff-fetch-client'
import type { ProductPageResponse } from '@core/contracts/product/product-page'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import CloseIcon from '@/public/icons/close.svg'

interface VariantSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  productSlug: string
  productName: string
}

export function VariantSelectorModal({
  open,
  onOpenChange,
  productId,
  productSlug,
  productName,
}: VariantSelectorModalProps) {
  const t = useTranslations('product')
  const tCommon = useTranslations('common')
  const [productData, setProductData] = useState<ProductPageResponse | null>(
    null
  )
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({})
  const { handleAddToCart, isPending: isAdding } = useAddToCart()
  const { fetch } = useBffFetchClient()

  useEffect(() => {
    if (open && !productData) {
      fetch(`/product/slug/${productSlug}/page`)
        .then((response) => response.json())
        .then((data: ProductPageResponse) => {
          setProductData(data)
        })
        .catch((error) => {
          console.error('Failed to fetch product data:', error)
        })
    }
  }, [open, productSlug, productData, fetch])

  const isLoading = open && !productData

  const handleOptionChange = (key: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [key]: value }))
  }

  const getSelectedVariantId = () => {
    if (
      !productData?.product.variants ||
      !productData.product.variants.length
    ) {
      return productData?.product.variantId
    }

    const selectedVariant = productData.product.variants.find((variant) => {
      return Object.entries(selectedOptions).every(
        ([key, value]) => variant.attributes[key] === value
      )
    })

    return selectedVariant?.id || productData.product.variantId
  }

  const handleAddToBasket = async () => {
    const variantId = getSelectedVariantId()
    if (!variantId) {
      return
    }

    await handleAddToCart({
      productId,
      variantId,
      quantity: 1,
    })
    onOpenChange(false)
    setProductData(null)
    setSelectedOptions({})
  }

  const isAddDisabled =
    isAdding ||
    isLoading ||
    (productData?.product.configurableOptions &&
      productData.product.configurableOptions.length > 0 &&
      Object.keys(selectedOptions).length <
        productData.product.configurableOptions.length)

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className='!inset-y-0 !top-0 !right-0 !left-auto flex h-full !max-h-full w-full max-w-full !translate-x-0 !translate-y-0 flex-col p-0 md:!inset-y-0 md:!top-0 md:!max-h-full md:w-112 md:max-w-112 md:!translate-y-0'
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className='relative flex h-14 w-full items-center justify-between bg-white !px-4 py-4 md:w-112'>
          <div className='relative h-6 w-6 shrink-0 opacity-0' />
          <DialogTitle className='relative flex shrink-0 flex-col justify-center text-center text-base leading-none font-normal text-nowrap text-gray-950'>
            <p className='leading-[1.1] whitespace-pre'>{productName}</p>
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className='relative flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center'
            aria-label={tCommon('close')}
          >
            <CloseIcon className='h-6 w-6 shrink-0 text-gray-700' />
          </button>
        </DialogHeader>

        {/* Content */}
        <div className='flex flex-1 flex-col overflow-y-auto px-4 py-6 md:px-6'>
          {isLoading ? (
            <div className='flex flex-1 items-center justify-center'>
              <LoadingSpinner />
            </div>
          ) : (
            productData?.product && (
              <div className='flex flex-col gap-6'>
                <p className='text-sm text-gray-700'>
                  {t('buyBox.selectVariant')}
                </p>
                {productData.product.configurableOptions &&
                  productData.product.configurableOptions.length > 0 && (
                    <ConfigurableOptions
                      options={productData.product.configurableOptions}
                      selected={selectedOptions}
                      onChangeOption={handleOptionChange}
                      variants={productData.product.variants}
                      layout='grid'
                    />
                  )}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className='flex w-full shrink-0 flex-col border-t border-gray-200 bg-white px-4 py-4 md:px-6'>
          <Button
            onClick={handleAddToBasket}
            disabled={isAddDisabled}
            className='w-full'
          >
            {isAdding ? (
              <>
                <LoadingSpinner className='mr-2 size-4' />
                {t('buyBox.adding')}
              </>
            ) : (
              t('buyBox.addToBasket')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
