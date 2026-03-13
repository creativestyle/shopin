'use client'

import { useEffect, useRef, useState } from 'react'
import { useUpdateCartItem } from '../../hooks/use-update-cart-item'
import { debounce } from '@/lib/debounce'
import type { LineItemResponse } from '@core/contracts/cart/cart'

const DEFAULT_DEBOUNCE_MS = 300

interface UseCartItemQuantityOptions {
  item: LineItemResponse
  debounceMs?: number
}

export function useCartItemQuantity({
  item,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseCartItemQuantityOptions) {
  const { handleUpdate, isPending: isUpdatingCart } = useUpdateCartItem()
  const [isUpdating, setIsUpdating] = useState(false)
  const [optimisticQuantity, setOptimisticQuantity] = useState(item.quantity)

  const stateRef = useRef({
    pendingDelta: 0,
    targetQuantity: item.quantity,
    expectedServerQuantity: null as number | null,
    lastSyncedQuantity: item.quantity,
  })

  const syncQuantity = (quantity: number) => {
    setOptimisticQuantity(quantity)
    stateRef.current.targetQuantity = quantity
    stateRef.current.lastSyncedQuantity = quantity
  }

  useEffect(() => {
    if (stateRef.current.pendingDelta !== 0) {
      return
    }

    if (stateRef.current.expectedServerQuantity !== null) {
      if (item.quantity === stateRef.current.expectedServerQuantity) {
        stateRef.current.expectedServerQuantity = null
        queueMicrotask(() => syncQuantity(item.quantity))
      }
      return
    }

    if (item.quantity !== stateRef.current.lastSyncedQuantity) {
      queueMicrotask(() => syncQuantity(item.quantity))
    } else if (item.quantity === optimisticQuantity) {
      stateRef.current.targetQuantity = item.quantity
      stateRef.current.lastSyncedQuantity = item.quantity
    }
  }, [item.quantity, optimisticQuantity])

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) {
      return
    }
    stateRef.current.expectedServerQuantity = newQuantity
    setIsUpdating(true)
    const result = await handleUpdate({
      lineItemId: item.id,
      quantity: newQuantity,
    })
    if (!result.success) {
      syncQuantity(item.quantity)
      stateRef.current.pendingDelta = 0
      stateRef.current.expectedServerQuantity = null
    } else if (stateRef.current.pendingDelta === 0) {
      stateRef.current.expectedServerQuantity = null
    }
    setIsUpdating(false)
  }

  const applyPendingChangesRef = useRef<(() => void) | undefined>(undefined)

  useEffect(() => {
    applyPendingChangesRef.current = () => {
      if (stateRef.current.pendingDelta !== 0) {
        const newQuantity = stateRef.current.targetQuantity
        stateRef.current.pendingDelta = 0
        handleQuantityChange(newQuantity).catch(() => {})
      }
    }
  })

  const debouncedApplyChangesRef = useRef<
    (((...args: unknown[]) => void) & { cancel: () => void }) | undefined
  >(undefined)

  useEffect(() => {
    debouncedApplyChangesRef.current = debounce((..._args: unknown[]) => {
      applyPendingChangesRef.current?.()
    }, debounceMs)
    return () => {
      debouncedApplyChangesRef.current?.cancel()
    }
  }, [debounceMs])

  const updateQuantityOptimistically = (delta: number) => {
    stateRef.current.pendingDelta += delta
    setOptimisticQuantity((prev) => {
      const newValue = prev + delta
      stateRef.current.targetQuantity = newValue
      return newValue
    })
    debouncedApplyChangesRef.current?.()
  }

  const handleIncrease = () => updateQuantityOptimistically(1)

  const handleDecrease = () => updateQuantityOptimistically(-1)

  const handleDirectInputChange = (newValue: number) => {
    stateRef.current.pendingDelta = 0
    setOptimisticQuantity(newValue)
    stateRef.current.targetQuantity = newValue
    handleQuantityChange(newValue).catch(() => {})
  }

  return {
    optimisticQuantity,
    isUpdating: isUpdating || isUpdatingCart,
    handleIncrease,
    handleDecrease,
    handleDirectInputChange,
  }
}
