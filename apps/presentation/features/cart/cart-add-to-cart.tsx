'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import CartIcon from '@/public/icons/cart.svg'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useAddToCart } from './hooks/use-add-to-cart'
import { VariantSelectorModal } from './components/variant-selector-modal'

interface AddToCartProps {
  className?: string
  productId: string
  productSlug?: string
  productName?: string
  variantId?: string
  variantCount?: number
  variant?: 'primary' | 'secondary' | 'tertiary'
  showLoadingText?: boolean
}

export function AddToCart({
  className = 'w-full',
  productId,
  productSlug,
  productName,
  variantId: propVariantId,
  variantCount,
  variant = 'primary',
  showLoadingText = false,
}: AddToCartProps) {
  const t = useTranslations('product.buyBox')
  const searchParams = useSearchParams()
  const { handleAddToCart, isPending } = useAddToCart()
  const [showVariantSelector, setShowVariantSelector] = useState(false)

  // Use prop variantId if provided, otherwise get from URL (PDP use case)
  const variantId = propVariantId || searchParams?.get('variantId') || undefined

  const handleClick = async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // If product has multiple variants and we need to select one, show modal
    const needsVariantSelection =
      variantCount && variantCount > 1 && productSlug && productName

    if (needsVariantSelection) {
      setShowVariantSelector(true)
      return
    }

    // Otherwise, add directly to cart
    if (!variantId) {
      return
    }

    await handleAddToCart({
      productId,
      variantId,
      quantity: 1,
    })
  }

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        className={className}
        disabled={isPending}
      >
        <CartIcon className='size-5' />
        {showLoadingText && isPending ? t('adding') : t('addToBasket')}
      </Button>

      {variantCount && variantCount > 1 && productSlug && productName && (
        <VariantSelectorModal
          open={showVariantSelector}
          onOpenChange={setShowVariantSelector}
          productId={productId}
          productSlug={productSlug}
          productName={productName}
        />
      )}
    </>
  )
}
