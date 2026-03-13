'use client'

import { useState } from 'react'
import type { LineItemResponse } from '@core/contracts/cart/cart'
import { useRemoveCartItem } from './use-remove-cart-item'

interface UseCartItemRemovalOptions {
  item: LineItemResponse
}

export function useCartItemRemoval({ item }: UseCartItemRemovalOptions) {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { handleRemove, isPending: isRemoving } = useRemoveCartItem()

  const handleRemoveClick = () => {
    setShowConfirmation(true)
  }

  const handleConfirm = async () => {
    await handleRemove({ lineItemId: item.id })
    setShowConfirmation(false)
  }

  const handleCancel = () => {
    setShowConfirmation(false)
  }

  return {
    showConfirmation,
    isRemoving,
    handleRemoveClick,
    handleConfirm,
    handleCancel,
  }
}
