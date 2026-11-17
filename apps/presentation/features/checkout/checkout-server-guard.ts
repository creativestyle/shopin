import { redirect } from '@/lib/navigation'
import { getLocale } from 'next-intl/server'
import { cookies } from 'next/headers'
import {
  ACCESS_TOKEN_COOKIE_NAME,
  CART_ID_COOKIE_PREFIX_GUEST,
  CART_ID_COOKIE_PREFIX_LOGGED,
  CORRELATION_ID_HEADER,
} from '@config/constants'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { logger } from '@/lib/logger'
import { getCorrelationId } from '@/lib/logger/logger-context'
import { CartService } from '@/features/cart/cart-service'
import type { CartResponse } from '@core/contracts/cart/cart'
import {
  getFirstIncompleteStep,
  isStepComplete,
} from './components/checkout-steps-frame/checkout-step-validation'
import {
  CHECKOUT_STEPS,
  type CheckoutStepId,
} from './components/checkout-steps-frame/checkout-steps-config'
import type { BffFetchClient } from '@/lib/bff/types'

export type { CheckoutStepId } from './components/checkout-steps-frame/checkout-steps-config'

type RequestCookie = { name: string; value: string }

/** Read-only guard: without these cookies the BFF would refresh tokens via Set-Cookie the browser never gets. */
function canResolveCartOnServer(requestCookies: RequestCookie[]): boolean {
  const hasCartId = requestCookies.some(
    ({ name }) =>
      name.startsWith(CART_ID_COOKIE_PREFIX_GUEST) ||
      name.startsWith(CART_ID_COOKIE_PREFIX_LOGGED)
  )
  const hasAccessToken = requestCookies.some(
    ({ name }) => name === ACCESS_TOKEN_COOKIE_NAME
  )
  return hasCartId && hasAccessToken
}

/** BFF fetch client that forwards request cookies and correlation id so the BFF can resolve the cart. */
async function createBffFetchWithCookies(
  requestCookies: RequestCookie[]
): Promise<BffFetchClient> {
  const cookieHeader = requestCookies
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ')

  const [baseClient, correlationId] = await Promise.all([
    createBffFetchServer(),
    getCorrelationId(),
  ])

  return {
    fetch: (path, options) => {
      const headers = new Headers(options?.headers)
      headers.set('Cookie', cookieHeader)
      headers.set(CORRELATION_ID_HEADER, correlationId)

      return baseClient.fetch(path, { ...options, headers })
    },
  }
}

/** Returns the cart, or null when the server cannot resolve it and the client guard decides. */
export async function ensureCheckoutStep(
  currentStepId: CheckoutStepId
): Promise<CartResponse | null> {
  const cart = await getCartOrRedirect()
  if (!cart) {
    return null
  }

  const incompleteStep = getFirstIncompleteStep(cart, currentStepId)
  if (incompleteStep) {
    const locale = await getLocale()
    redirect({ href: incompleteStep.route, locale })
  }

  return cart
}

/** Returns the cart, or null when the server cannot resolve it and the client guard decides. */
export async function ensureCheckoutEntry(): Promise<CartResponse | null> {
  const cart = await getCartOrRedirect()
  if (!cart || !isStepComplete('billing', cart)) {
    return cart
  }

  const locale = await getLocale()

  const firstIncompleteStep = getFirstIncompleteStep(cart)
  if (firstIncompleteStep) {
    redirect({ href: firstIncompleteStep.route, locale })
  }

  const reviewStep = CHECKOUT_STEPS.find((s) => s.id === 'review')
  if (reviewStep) {
    redirect({ href: reviewStep.route, locale })
  }

  return cart
}

async function getCartOrRedirect(): Promise<CartResponse | null> {
  const cookieStore = await cookies()
  const requestCookies = cookieStore.getAll()

  if (!canResolveCartOnServer(requestCookies)) {
    return null
  }

  let cart: CartResponse | null = null
  try {
    const bffFetch = await createBffFetchWithCookies(requestCookies)
    cart = await new CartService(bffFetch).getCart()
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : String(error) },
      'Checkout server guard: cart fetch failed'
    )
  }

  if (!cart || cart.itemCount === 0) {
    const locale = await getLocale()
    redirect({ href: '/cart', locale })
  }

  return cart
}
