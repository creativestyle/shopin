/**
 * @jest-environment node
 */
jest.mock('next/headers', () => ({ cookies: jest.fn() }))
jest.mock('next-intl/server', () => ({ getLocale: jest.fn(async () => 'en') }))
jest.mock('@/lib/navigation', () => ({
  redirect: jest.fn(({ href }: { href: string }) => {
    throw new Error(`NEXT_REDIRECT:${href}`)
  }),
}))
jest.mock('@/lib/bff/core/bff-fetch-server', () => ({
  createBffFetchServer: jest.fn(),
}))
jest.mock('@/lib/logger', () => ({ logger: { warn: jest.fn() } }))
jest.mock('@/lib/logger/logger-context', () => ({
  getCorrelationId: jest.fn(async () => 'corr-1'),
}))

import { cookies } from 'next/headers'
import { redirect } from '@/lib/navigation'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { logger } from '@/lib/logger'
import type { CartResponse } from '@core/contracts/cart/cart'
import {
  ensureCheckoutEntry,
  ensureCheckoutStep,
} from '../checkout-server-guard'

const PRICE = { regularPriceInCents: 1000, currency: 'EUR' }
const ADDRESS = { firstName: 'Jane', city: 'Berlin', country: 'DE' }

const BASE_CART: CartResponse = {
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

const COMPLETE_CART: CartResponse = {
  ...BASE_CART,
  billingAddress: ADDRESS,
  shippingAddress: ADDRESS,
  shippingInfo: {
    shippingMethodId: 'standard',
    shippingMethodName: 'Standard',
    price: PRICE,
  },
  paymentInfo: { method: 'invoice', provider: 'mock', status: 'pending' },
}

// a guest on the mock shop has only a sealed cart id (the BFF keeps no token for the mock)
const SESSION_COOKIES = [{ name: 'cart-guest.mock-USD', value: 'c1' }]

const baseFetch = jest.fn()

function setCookies(list: { name: string; value: string }[]) {
  jest.mocked(cookies).mockResolvedValue({
    getAll: () => list,
  } as unknown as Awaited<ReturnType<typeof cookies>>)
}

function respondWithCart(cart: CartResponse | null) {
  baseFetch.mockResolvedValue(
    cart
      ? new Response(JSON.stringify(cart), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      : new Response(null, { status: 200 })
  )
}

describe('ensureCheckoutStep', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(createBffFetchServer).mockResolvedValue({ fetch: baseFetch })
    setCookies(SESSION_COOKIES)
  })

  it('redirects to /cart when the BFF returns no cart', async () => {
    respondWithCart(null)

    await expect(ensureCheckoutStep('shipping')).rejects.toThrow(
      'NEXT_REDIRECT:/cart'
    )
  })

  it('redirects to /cart when the cart has no items', async () => {
    respondWithCart({ ...BASE_CART, itemCount: 0 })

    await expect(ensureCheckoutStep('shipping')).rejects.toThrow(
      'NEXT_REDIRECT:/cart'
    )
  })

  it('logs and redirects to /cart when the cart fetch fails', async () => {
    baseFetch.mockResolvedValue(new Response(null, { status: 401 }))

    await expect(ensureCheckoutStep('shipping')).rejects.toThrow(
      'NEXT_REDIRECT:/cart'
    )
    expect(logger.warn).toHaveBeenCalled()
  })

  it('redirects payment to shipping when billing is set but shipping is not', async () => {
    respondWithCart({ ...BASE_CART, billingAddress: ADDRESS })

    await expect(ensureCheckoutStep('payment')).rejects.toThrow(
      'NEXT_REDIRECT:/checkout/shipping'
    )
  })

  it('returns the cart on shipping when billing is set', async () => {
    const cart = { ...BASE_CART, billingAddress: ADDRESS }
    respondWithCart(cart)

    await expect(ensureCheckoutStep('shipping')).resolves.toEqual(cart)
    expect(redirect).not.toHaveBeenCalled()
  })

  it('forwards only BFF cookies, unchanged, plus the correlation id', async () => {
    setCookies([
      { name: 'cart-guest.commercetools-USD', value: 'c1' },
      { name: 'vault.commerce.commercetools', value: 't1' },
      { name: 'shopin-session', value: 's1' },
      { name: 'wishlist-logged.mock-USD', value: 'w1' },
      { name: 'preview_token', value: 'secret-preview' },
      { name: 'correlationId', value: 'cookie-corr' },
      { name: '_ga', value: 'GA1.1' },
    ])
    respondWithCart({ ...BASE_CART, billingAddress: ADDRESS })

    await ensureCheckoutStep('shipping')

    const headers = new Headers(baseFetch.mock.calls[0][1].headers)
    expect(headers.get('Cookie')).toBe(
      'cart-guest.commercetools-USD=c1; vault.commerce.commercetools=t1; shopin-session=s1; wishlist-logged.mock-USD=w1'
    )
    expect(headers.get('x-correlation-id')).toBe('corr-1')
  })

  describe('internal secret', () => {
    const originalSecret = process.env.BFF_INTERNAL_SECRET

    afterEach(() => {
      process.env.BFF_INTERNAL_SECRET = originalSecret
    })

    it('sends the internal secret when it is set', async () => {
      process.env.BFF_INTERNAL_SECRET = 'internal-secret'
      respondWithCart({ ...BASE_CART, billingAddress: ADDRESS })

      await ensureCheckoutStep('shipping')

      const headers = new Headers(baseFetch.mock.calls[0][1].headers)
      expect(headers.get('x-bff-internal-secret')).toBe('internal-secret')
    })

    it.each([undefined, '', '   '])(
      'sends no internal secret header when the secret is %p',
      async (secret) => {
        if (secret === undefined) {
          delete process.env.BFF_INTERNAL_SECRET
        } else {
          process.env.BFF_INTERNAL_SECRET = secret
        }
        respondWithCart({ ...BASE_CART, billingAddress: ADDRESS })

        await ensureCheckoutStep('shipping')

        const headers = new Headers(baseFetch.mock.calls[0][1].headers)
        expect(headers.has('x-bff-internal-secret')).toBe(false)
      }
    )
  })

  it.each([
    [
      'no cart id cookie (a signed-in commercetools shopper without a cart)',
      [
        { name: 'vault.commerce.commercetools', value: 't1' },
        { name: 'shopin-session', value: 's1' },
      ],
    ],
    ['no cookies at all', []],
  ])(
    'skips the server check and defers to the client guard with %s',
    async (_, list) => {
      setCookies(list)

      await expect(ensureCheckoutStep('payment')).resolves.toBeNull()
      expect(baseFetch).not.toHaveBeenCalled()
      expect(redirect).not.toHaveBeenCalled()
    }
  )
})

describe('ensureCheckoutEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(createBffFetchServer).mockResolvedValue({ fetch: baseFetch })
    setCookies(SESSION_COOKIES)
  })

  it('stays on /checkout while billing is incomplete', async () => {
    respondWithCart(BASE_CART)

    await expect(ensureCheckoutEntry()).resolves.toEqual(BASE_CART)
    expect(redirect).not.toHaveBeenCalled()
  })

  it('goes to the first incomplete step once billing is done', async () => {
    respondWithCart({ ...BASE_CART, billingAddress: ADDRESS })

    await expect(ensureCheckoutEntry()).rejects.toThrow(
      'NEXT_REDIRECT:/checkout/shipping'
    )
  })

  it('goes to review when every step is complete', async () => {
    respondWithCart(COMPLETE_CART)

    await expect(ensureCheckoutEntry()).rejects.toThrow(
      'NEXT_REDIRECT:/checkout/review'
    )
  })
})
