'use client'

import {
  useMutation,
  type MutateOptions,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query'
import { addToast } from '@/components/ui/toast'
import { useTranslations } from 'next-intl'
import { RateLimitError } from './rate-limit-error'

/** Result of mutateAsync(); never rejects — check success and use data or error. */
export type BffMutationAsyncResult<TData, TError> =
  | { success: true; data: TData }
  | { success: false; error: TError }

function showErrorToast(
  error: unknown,
  message?: string,
  tCommon?: (
    key: 'errors.tooManyRequests' | 'errors.internalServerError'
  ) => string
): void {
  if (error === null || error === undefined) {
    return
  }

  const defaultMessage = tCommon
    ? tCommon('errors.internalServerError')
    : 'Something went wrong. Please try again.'
  const text = message ?? defaultMessage

  if (error instanceof RateLimitError) {
    addToast({
      type: 'error',
      children: tCommon
        ? tCommon('errors.tooManyRequests')
        : 'Too many requests. Please try again.',
    })
    return
  }
  addToast({ type: 'error', children: text })
}

/** For custom onError when you need the same error toast (e.g. useBffClientMutation with errorMessage: null). */
export function useMutationErrorHandler(): (
  error: unknown,
  message?: string
) => void {
  const tCommon = useTranslations('common')
  return (error, message) => showErrorToast(error, message, tCommon)
}

export type BffClientMutationResult<TData, TError, TVariables, TContext> = Omit<
  UseMutationResult<TData, TError, TVariables, TContext>,
  'mutateAsync'
> & {
  mutateAsync: (
    variables: TVariables,
    options?: MutateOptions<TData, TError, TVariables, TContext>
  ) => Promise<BffMutationAsyncResult<TData, TError>>
}

/**
 * Standard mutation hook for BFF client calls. Same API as useMutation plus errorMessage:
 *   - string     → show error toast with this message
 *   - undefined  → default "Something went wrong" (translated)
 *   - null       → no toast (handle in onError yourself)
 * mutateAsync() never rejects: it returns { success: true, data } or { success: false, error }; toast is shown on error.
 */
export function useBffClientMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    errorMessage?: string | null
  }
): BffClientMutationResult<TData, TError, TVariables, TContext> {
  const { errorMessage, onError, ...rest } = options
  const handleError = useMutationErrorHandler()

  const mutation = useMutation<TData, TError, TVariables, TContext>({
    ...rest,
    onError: (err, variables, onMutateResult, context) => {
      if (err !== null && err !== undefined && errorMessage !== null) {
        handleError(err, errorMessage)
      }
      onError?.(err, variables, onMutateResult, context)
    },
  })

  return {
    ...mutation,
    mutateAsync: async (variables, mutateOptions) => {
      try {
        const data = await mutation.mutateAsync(variables, mutateOptions)
        return { success: true as const, data }
      } catch (error) {
        return { success: false as const, error: error as TError }
      }
    },
  }
}
