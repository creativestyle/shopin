'use client'

import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { CartResponse } from '@core/contracts/cart/cart'
import { CartExtra } from '@/lib/slots'
import { cartKeys } from '../cart-keys'
import { useCartService } from '../hooks/use-cart-service'

/** `setFields` for the CartExtra slot: SHOPin's cart fields route (CSRF token, providers), then the new cart. */
function useSetFields(): (fields: Record<string, unknown>) => Promise<void> {
  const { cartService } = useCartService()
  const queryClient = useQueryClient()
  return useCallback(
    async (fields) => {
      queryClient.setQueryData(
        cartKeys.all,
        await cartService.setFields(fields)
      )
    },
    [cartService, queryClient]
  )
}

function WithFields({ cart }: { cart: CartResponse }) {
  const setFields = useSetFields()
  return CartExtra ? (
    <CartExtra
      cart={cart}
      setFields={setFields}
    />
  ) : null
}

/** The shop's own cart fields (slot CartExtra) under the cart summary; nothing when the shop has none. */
export function ShopCartExtra({ cart }: { cart: CartResponse }) {
  return CartExtra ? <WithFields cart={cart} /> : null
}
