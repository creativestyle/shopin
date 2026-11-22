import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { CartResponse } from '@core/contracts/cart/cart'
import { CartHydrationBoundary } from '../cart-hydration-boundary'
import { cartKeys } from '../cart-keys'

const PRICE = { regularPriceInCents: 1000, currency: 'EUR' }

const CART: CartResponse = {
  id: 'cart-1',
  version: 1,
  lineItems: [],
  subtotal: PRICE,
  grandTotal: PRICE,
  currency: 'EUR',
  itemCount: 1,
  shippingInfo: undefined,
  paymentInfo: undefined,
}

function renderBoundary(cart: CartResponse | null) {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <CartHydrationBoundary cart={cart}>
        <p>step content</p>
      </CartHydrationBoundary>
    </QueryClientProvider>
  )
  return queryClient
}

describe('CartHydrationBoundary', () => {
  it('seeds the cart query with the server cart', () => {
    const queryClient = renderBoundary(CART)

    expect(queryClient.getQueryData(cartKeys.all)).toEqual(CART)
    expect(screen.getByText('step content')).toBeInTheDocument()
  })

  it('renders children and seeds nothing without a cart', () => {
    const queryClient = renderBoundary(null)

    expect(queryClient.getQueryData(cartKeys.all)).toBeUndefined()
    expect(screen.getByText('step content')).toBeInTheDocument()
  })
})
