import { redirect } from 'next/navigation'
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
  const bffFetch = await createBffFetchWithCookies()
  const cartService = new CartFetchService(bffFetch)
  const cart = await cartService.getCart()

  if (!cart || cart.itemCount === 0) {
    redirect('/cart')
  }

  const incompleteStep = getFirstIncompleteStep(cart, currentStepId)
  if (incompleteStep) {
    redirect(incompleteStep.route)
  }

  return cart
}

export async function ensureCheckoutEntry(): Promise<void> {
  const bffFetch = await createBffFetchWithCookies()
  const cartService = new CartFetchService(bffFetch)
  const cart = await cartService.getCart()

  if (!cart || cart.itemCount === 0) {
    redirect('/cart')
  }

  if (!isStepComplete('billing', cart)) {
    return
  }

  const firstIncompleteStep = getFirstIncompleteStep(cart)
  if (firstIncompleteStep) {
    redirect(firstIncompleteStep.route)
  }

  const reviewStep = CHECKOUT_STEPS.find((s) => s.id === 'review')
  if (reviewStep) {
    redirect(reviewStep.route)
  }
}
