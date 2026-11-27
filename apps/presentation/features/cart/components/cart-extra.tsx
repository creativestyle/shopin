'use client'

import { cloneElement, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { CartResponse } from '@core/contracts/cart/cart'
import { useClientSlots } from '@/features/slots/client-slots'
import { cartKeys } from '../cart-keys'
import { useCartService } from '../hooks/use-cart-service'

/** `setFields` for the CartExtra slot: SHOPin's cart fields route (CSRF token, providers), then the new cart. */
function useSetFields(): (fields: Record<string, unknown>) => Promise<void> {
  const { cartService } = useCartService()
  const queryClient = useQueryClient()
  return useCallback(
    async (fields) => {
      const cart = await cartService.setFields(fields)
      // as the other cart writes: a refetch in flight must not overwrite the new cart
      await queryClient.cancelQueries({ queryKey: cartKeys.all, exact: true })
      queryClient.setQueryData(cartKeys.all, cart)
    },
    [cartService, queryClient]
  )
}

function WithFields({
  cart,
  slot,
}: {
  cart: CartResponse
  slot: NonNullable<ReturnType<typeof useClientSlots>['cartExtra']>
}) {
  const setFields = useSetFields()
  return cloneElement(slot, { cart, setFields })
}

/** The shop's own cart fields (slot CartExtra) under the cart summary; nothing when the shop has none. */
export function ShopCartExtra({ cart }: { cart: CartResponse }) {
  const { cartExtra } = useClientSlots()
  return cartExtra ? (
    <WithFields
      cart={cart}
      slot={cartExtra}
    />
  ) : null
}
