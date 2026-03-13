/**
 * Query keys for customer-related React Query usage.
 */

export const customerKeys = {
  all: ['customer'] as const,
  me: () => [...customerKeys.all, 'me'] as const,
  addresses: () => [...customerKeys.all, 'addresses'] as const,
}
