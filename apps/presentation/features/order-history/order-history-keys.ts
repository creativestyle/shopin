/**
 * Query keys for order history React Query usage.
 */
export const orderHistoryKeys = {
  all: ['order-history'] as const,
  list: (limit?: number, offset?: number) =>
    [...orderHistoryKeys.all, 'list', { limit, offset }] as const,
  detail: (orderId: string) =>
    [...orderHistoryKeys.all, 'detail', orderId] as const,
}
