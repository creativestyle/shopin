/**
 * Creates scope for anonymous sessions (guest users).
 */
export const createAnonymousSessionScope = (projectKey: string): string =>
  `view_published_products:${projectKey} manage_my_orders:${projectKey} manage_my_profile:${projectKey} manage_my_shopping_lists:${projectKey} manage_my_payments:${projectKey}`

/**
 * Creates scope for logged-in customers.
 */
export const createCustomerScope = (projectKey: string): string =>
  `view_published_products:${projectKey} manage_my_orders:${projectKey} manage_my_profile:${projectKey} manage_my_shopping_lists:${projectKey} manage_my_payments:${projectKey}`
