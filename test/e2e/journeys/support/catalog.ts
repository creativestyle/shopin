// Catalog entry points in the commercetools project; update if the catalog changes.
export const CATEGORY_WITH_SINGLE_VARIANT_PRODUCTS = '/c/microphones'

export const MULTI_VARIANT_PRODUCT = {
  path: '/p/shopin-xlr-microphone-cable',
  name: 'SHOPin XLR Microphone Cable',
  option: '3 m',
}

export const SEARCH_TERM = 'microphone'

export const GUEST_ADDRESS = {
  firstName: 'E2E',
  lastName: 'Tester',
  streetName: 'Main Street',
  streetNumber: '1',
  postalCode: '10001',
  city: 'New York',
  country: 'United States',
}

export function uniqueEmail() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  return `e2e+${suffix}@example.com`
}
