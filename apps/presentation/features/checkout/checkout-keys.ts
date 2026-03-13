/**
 * Checkout query and mutation keys. Single source of truth for checkout-related keys in React Query.
 */

export const checkoutKeys = {
  all: ['checkout'] as const,
  mutations: {
    setAddress: () => [...checkoutKeys.all, 'mutations', 'setAddress'] as const,
    setShippingMethod: () =>
      [...checkoutKeys.all, 'mutations', 'setShippingMethod'] as const,
    setPaymentMethod: () =>
      [...checkoutKeys.all, 'mutations', 'setPaymentMethod'] as const,
    createOrder: () =>
      [...checkoutKeys.all, 'mutations', 'createOrder'] as const,
    initiatePayment: () =>
      [...checkoutKeys.all, 'mutations', 'initiatePayment'] as const,
  },
}

export const shippingMethodsKeys = {
  all: [...checkoutKeys.all, 'shippingMethods'] as const,
}

export const paymentMethodsKeys = {
  all: [...checkoutKeys.all, 'paymentMethods'] as const,
}
