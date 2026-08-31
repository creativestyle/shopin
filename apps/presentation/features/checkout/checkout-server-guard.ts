import { redirect } from '@/lib/navigation'
import { getLocale } from 'next-intl/server'
import { cookies } from 'next/headers'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { BaseService } from '@/lib/bff/services/base-service'
import { CartResponseSchema } from '@core/contracts/cart/cart'
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

/** Local cart fetcher — avoids cross-feature import of CartService. */
class CartFetchService extends BaseService {
  async getCart(): Promise<CartResponse | null> {
    const data = await this.get<CartResponse | null>('/cart', {
      allowEmpty: true,
    })

    if (!data) {
      return null
    }

    return CartResponseSchema.parse(data)
  }
}

/** BFF fetch client that forwards request cookies so the BFF can resolve the cart. */
async function createBffFetchWithCookies(): Promise<BffFetchClient> {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  const cookieHeader = allCookies.map((c) => `${c.name}=${c.value}`).join('; ')

  const baseClient = await createBffFetchServer()

  return {
    fetch: async (path, options) => {
      const existingHeaders = (options?.headers ?? {}) as Record<string, string>

      return baseClient.fetch(path, {
        ...options,
        headers: {
          ...existingHeaders,
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
      })
    },
  }
}

export async function ensureCheckoutStep(
  currentStepId: CheckoutStepId
): Promise<CartResponse> {
  const cart = await getCartOrRedirect()

  const incompleteStep = getFirstIncompleteStep(cart, currentStepId)
  if (incompleteStep) {
    const locale = await getLocale()
    redirect({ href: incompleteStep.route, locale })
  }

  return cart
}

export async function ensureCheckoutEntry(): Promise<void> {
  const cart = await getCartOrRedirect()

  if (!isStepComplete('billing', cart)) {
    return
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
}

async function getCartOrRedirect(): Promise<CartResponse> {
  const bffFetch = await createBffFetchWithCookies()
  const cartService = new CartFetchService(bffFetch)
  const cart = await cartService.getCart()

  if (!cart || cart.itemCount === 0) {
    const locale = await getLocale()
    redirect({ href: '/cart', locale })
  }

  return cart
}
