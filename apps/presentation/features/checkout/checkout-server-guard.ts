import { redirect } from '@/lib/navigation'
import { getLocale } from 'next-intl/server'
import { cookies } from 'next/headers'
import {
  CART_ID_COOKIE_PREFIX_GUEST,
  CART_ID_COOKIE_PREFIX_LOGGED,
} from '@config/constants'
import {
  createBffFetchWithCookies,
  type RequestCookie,
} from '@/lib/bff/core/bff-fetch-server-with-cookies'
import { logger } from '@/lib/logger'
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

export type { CheckoutStepId } from './components/checkout-steps-frame/checkout-steps-config'

/**
 * Read-only guard: the server resolves the cart only when the browser has a cart id. Every provider has one (the
 * mock keeps no token at all); without the tokens it needs, the BFF answers no cart and the client guard takes over.
 * A refresh during this call cannot reach the browser, which is harmless for a provider that does not rotate refresh
 * tokens (the next browser request refreshes again).
 */
function canResolveCartOnServer(requestCookies: RequestCookie[]): boolean {
  return requestCookies.some(
    ({ name }) =>
      name.startsWith(CART_ID_COOKIE_PREFIX_GUEST) ||
      name.startsWith(CART_ID_COOKIE_PREFIX_LOGGED)
  )
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
