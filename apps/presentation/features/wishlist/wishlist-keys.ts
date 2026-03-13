/**
 * Wishlist query keys. Single source of truth for wishlist-related queryKey in React Query.
 */

export const wishlistKeys = {
  all: ['wishlist'] as const,
  list: (page: number, limit: number) =>
    [...wishlistKeys.all, 'list', page, limit] as const,
  productIds: () => [...wishlistKeys.all, 'productIds'] as const,
  mutations: {
    add: () => [...wishlistKeys.all, 'mutations', 'add'] as const,
    remove: () => [...wishlistKeys.all, 'mutations', 'remove'] as const,
  },
}
