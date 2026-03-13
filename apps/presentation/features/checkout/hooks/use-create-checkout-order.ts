'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useOrderService } from '@/features/order/use-order-service'
import { useCart } from '@/features/cart/cart-use-cart'
import { cartKeys } from '@/features/cart/cart-keys'
import { checkoutKeys } from '../checkout-keys'
import type { OrderResponse } from '@core/contracts/order/order'
import { generateToken, getStoredToken, saveToken } from './use-order-token'
import { HttpError } from '@/lib/error-utils'
import { addToast } from '@/components/ui/toast'
import {
  useBffClientMutation,
  useMutationErrorHandler,
} from '@/lib/bff/utils/mutations'

interface UseCreateCheckoutOrderOptions {
  locale: string
}

function redirectToComplete(
  router: ReturnType<typeof useRouter>,
  locale: string,
  orderId: string,
  token: string
): void {
  router.push(`/${locale}/checkout/complete?orderId=${orderId}&token=${token}`)
}

function handleOrderSuccess(
  router: ReturnType<typeof useRouter>,
  locale: string,
  order: OrderResponse
): void {
  const existing = getStoredToken(order.id)

  if (existing) {
    redirectToComplete(router, locale, order.id, existing.token)
    return
  }

  const token = generateToken()
  saveToken(order.id, token)
  redirectToComplete(router, locale, order.id, token)
}

export function useCreateCheckoutOrder({
  locale,
}: UseCreateCheckoutOrderOptions) {
  const router = useRouter()
  const t = useTranslations('checkout')
  const handleError = useMutationErrorHandler()
  const { orderService } = useOrderService()
  const { cart } = useCart()
  const queryClient = useQueryClient()

  const mutation = useBffClientMutation({
    mutationKey: checkoutKeys.mutations.createOrder(),
    errorMessage: null, // custom handling in onError
    mutationFn: async (): Promise<OrderResponse> => {
      if (!cart?.id) {
        throw new Error('Cart ID is required to create an order')
      }
      return await orderService.createOrder({ cartId: cart.id })
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all })
      queryClient.removeQueries({ queryKey: cartKeys.all })
      handleOrderSuccess(router, locale, order)
    },
    onError: (err) => {
      if (!cart?.id) {
        queryClient.invalidateQueries({ queryKey: cartKeys.all })
        queryClient.removeQueries({ queryKey: cartKeys.all })
        addToast({
          type: 'error',
          children: t('cartMissing'),
        })
        router.push(`/${locale}`)
        return
      }

      if (HttpError.isConflictError(err)) {
        queryClient.invalidateQueries({ queryKey: cartKeys.all })
        queryClient.removeQueries({ queryKey: cartKeys.all })
        addToast({
          type: 'info',
          children: t('orderAlreadyExists'),
        })
        router.push(`/${locale}`)
        return
      }

      handleError(err, t('orderCreationError'))
    },
  })

  return {
    createOrder: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}
