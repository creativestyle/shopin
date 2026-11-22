import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import type { CartResponse } from '@core/contracts/cart/cart'
import { cartKeys } from './cart-keys'

interface CartHydrationBoundaryProps {
  cart: CartResponse | null
  children: React.ReactNode
}

function dehydrateCart(cart: CartResponse) {
  const queryClient = new QueryClient()
  queryClient.setQueryData(cartKeys.all, cart)
  return dehydrate(queryClient)
}

/** Seeds the client cart query with a cart fetched on the server. */
export function CartHydrationBoundary({
  cart,
  children,
}: CartHydrationBoundaryProps) {
  if (!cart) {
    return <>{children}</>
  }

  return (
    <HydrationBoundary state={dehydrateCart(cart)}>
      {children}
    </HydrationBoundary>
  )
}
