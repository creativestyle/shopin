'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ConfigurableOptions } from '@/components/ui/configurable-options/configurable-options'
import { Button } from '@/components/ui/button'
import { useAddToCart } from '../hooks/use-add-to-cart'
import { useTranslations } from 'next-intl'
import { useBffFetchClient } from '@/lib/bff/core/bff-fetch-client'
import type { ProductPageResponse } from '@core/contracts/product/product-page'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

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
        ([key, value]) =>
          variant.attributes?.find((a) => a.name === key)?.value === value
      )
    })

    return selectedVariant?.id || productData.product.variantId
  }

  const handleAddToBasket = async () => {
    const variantId = getSelectedVariantId()
    if (!variantId) {
      return
    }

    await handleAddToCart({ productId, variantId, quantity: 1 })
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
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent className='md:max-w-md'>
        <SheetHeader className='text-center'>
          <SheetTitle className='font-normal'>{productName}</SheetTitle>
        </SheetHeader>

        <SheetBody>
          {isLoading ? (
            <div className='flex flex-1 items-center justify-center'>
              <LoadingSpinner />
            </div>
          ) : (
            productData?.product && (
              <div className='flex flex-col gap-6'>
                <SheetDescription className='text-sm text-gray-700'>
                  {t('buyBox.selectVariant')}
                </SheetDescription>
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
        </SheetBody>

        <SheetFooter className='border-t border-gray-200'>
          <Button
            onClick={handleAddToBasket}
            disabled={isAddDisabled}
            className='w-full'
            aria-busy={isAdding}
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
