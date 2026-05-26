const ALL_SCOPES = [
  'view_published_products',
  'manage_my_payments',
  'manage_my_orders',
  'manage_my_profile',
  'manage_my_shopping_lists',
] as const

function buildScopes(projectKey: string): string {
  return ALL_SCOPES.map((scope) => `${scope}:${projectKey}`).join(' ')
}

/**
 * Creates scope for anonymous sessions (guest users).
 * Scopes are project-wide; the in-store endpoint constrains the token to the store.
 */
export const createAnonymousSessionScope = (projectKey: string): string =>
  buildScopes(projectKey)

/**
 * Creates scope for logged-in customers.
 * Scopes are project-wide; the in-store endpoint constrains the token to the store.
 */
export const createCustomerScope = (projectKey: string): string =>
  buildScopes(projectKey)
