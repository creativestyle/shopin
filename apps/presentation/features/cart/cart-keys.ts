/**
 * Cart query keys. Single source of truth for cart-related queryKey in React Query.
 */

export const cartKeys = {
  all: ['cart'] as const,
  mutations: {
    add: () => [...cartKeys.all, 'mutations', 'add'] as const,
    remove: () => [...cartKeys.all, 'mutations', 'remove'] as const,
    update: () => [...cartKeys.all, 'mutations', 'update'] as const,
  },
}
