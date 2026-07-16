'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import {
  isServer,
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {
  isAuthMutationKey,
  type AuthMutationKind,
} from '@/features/auth/auth-keys'
import { customerKeys } from '@/features/customer/customer-keys'
import { cartKeys } from '@/features/cart/cart-keys'
import { wishlistKeys } from '@/features/wishlist/wishlist-keys'
import { orderHistoryKeys } from '@/features/order-history/order-history-keys'

// Excluded from production bundles via dead-code elimination on process.env.NODE_ENV.
// Errors are caught so a failed chunk load in dev doesn't trigger an HMR reload loop.
const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? dynamic(
        () =>
          import('@tanstack/react-query-devtools')
            .then((mod) => ({ default: mod.ReactQueryDevtools }))
            .catch(() => ({ default: () => null })),
        { ssr: false }
      )
    : () => null

type AuthEventData = { success?: boolean }

const authInvalidationHandlers: Record<
  AuthMutationKind,
  (queryClient: QueryClient, data?: AuthEventData) => void
> = {
  logout: (qc) => {
    qc.setQueryData(customerKeys.me(), null)
    qc.removeQueries({ queryKey: customerKeys.me() })
    qc.setQueryData(cartKeys.all, null)
    qc.removeQueries({ queryKey: cartKeys.all })
    qc.invalidateQueries({ queryKey: wishlistKeys.all })
    qc.removeQueries({ queryKey: orderHistoryKeys.all })
  },
  confirmEmail: (qc, data) => {
    if (data?.success) {
      qc.invalidateQueries({ queryKey: customerKeys.me() })
    }
  },
  login: (qc, data) => {
    if (data?.success) {
      qc.invalidateQueries({ queryKey: customerKeys.me() })
      qc.invalidateQueries({ queryKey: cartKeys.all })
      qc.invalidateQueries({ queryKey: wishlistKeys.all })
    }
  },
  register: (qc, data) => {
    if (data?.success) {
      qc.invalidateQueries({ queryKey: customerKeys.me() })
      qc.invalidateQueries({ queryKey: cartKeys.all })
      qc.invalidateQueries({ queryKey: wishlistKeys.all })
    }
  },
  forgotPassword: () => {},
  resetPassword: () => {},
  resendVerificationEmail: () => {},
}

function createQueryClient() {
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({
      onSuccess: (data, _variables, _context, mutation) => {
        const key = mutation.options.mutationKey
        if (isAuthMutationKey(key)) {
          const handler = authInvalidationHandlers[key[1]]
          handler(queryClient, data as AuthEventData)
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: true,
        retry: false,
      },
    },
  })
  return queryClient
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return createQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) {
      browserQueryClient = createQueryClient()
    }
    return browserQueryClient
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
