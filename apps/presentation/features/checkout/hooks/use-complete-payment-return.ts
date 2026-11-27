'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@/lib/navigation'
import { useTranslations } from 'next-intl'
import { useCheckoutService } from './use-checkout-service'
import { cartKeys } from '@/features/cart/cart-keys'
import { checkoutKeys } from '../checkout-keys'
import type {
  PaymentReturnRequest,
  PaymentReturnResponse,
} from '@core/contracts/cart/payment-method'
import { generateToken, getStoredToken, saveToken } from './use-order-token'
import { HttpError } from '@/lib/error-utils'
import { addToast } from '@/components/ui/toast'
import {
  useBffClientMutation,
  useMutationErrorHandler,
} from '@/lib/bff/utils/mutations'

function redirectToComplete(
  router: ReturnType<typeof useRouter>,
  orderId: string,
  token: string
): void {
  router.push(`/checkout/complete?orderId=${orderId}&token=${token}`)
}

function handleOrderSuccess(
  router: ReturnType<typeof useRouter>,
  orderId: string
): void {
  const existing = getStoredToken(orderId)

  if (existing) {
    redirectToComplete(router, orderId, existing.token)
    return
  }

  const token = generateToken()
  saveToken(orderId, token)
  redirectToComplete(router, orderId, token)
}

/**
 * The payment return: the BFF asks the payment integration for the result and creates the order only for a paid
 * or authorized payment. Paid: the order confirmation. Failed, cancelled or still pending: back to the review step,
 * where the shopper pays again, with the payment-failed message.
 */
export function useCompletePaymentReturn() {
  const router = useRouter()
  const t = useTranslations('checkout')
  const handleError = useMutationErrorHandler()
  const { checkoutService } = useCheckoutService()
  const queryClient = useQueryClient()

  const mutation = useBffClientMutation({
    mutationKey: checkoutKeys.mutations.completePaymentReturn(),
    errorMessage: null, // custom handling in onError
    mutationFn: (
      request: PaymentReturnRequest
    ): Promise<PaymentReturnResponse> =>
      checkoutService.completePaymentReturn(request),
    onSuccess: (result) => {
      if (!result.orderId) {
        router.push('/checkout/review?paymentFailed=true')
        return
      }
      queryClient.invalidateQueries({ queryKey: cartKeys.all })
      queryClient.removeQueries({ queryKey: cartKeys.all })
      handleOrderSuccess(router, result.orderId)
    },
    onError: (err) => {
      if (HttpError.isConflictError(err)) {
        queryClient.invalidateQueries({ queryKey: cartKeys.all })
        queryClient.removeQueries({ queryKey: cartKeys.all })
        addToast({
          type: 'info',
          children: t('orderAlreadyExists'),
        })
        router.push('/')
        return
      }

      handleError(err, t('orderCreationError'))
    },
  })

  return {
    completePaymentReturn: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}
