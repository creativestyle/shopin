import type { IntegrationTestData } from './types'

// Catalog of the commercetools project in the root .env; update if it changes
export const COMMERCETOOLS_DATA: IntegrationTestData = {
  'en-US': {
    categoryPath: '/c/microphones',
    searchTerm: 'Modeling',
    address: {
      firstName: 'E2E',
      lastName: 'Shopper',
      streetName: 'Main Street',
      streetNumber: '1',
      postalCode: '10001',
      city: 'New York',
      countryCode: 'US',
    },
  },
  'de-DE': {
    categoryPath: '/c/microphones',
    searchTerm: 'Modeling',
    address: {
      firstName: 'E2E',
      lastName: 'Shopper',
      streetName: 'Hauptstraße',
      streetNumber: '1',
      postalCode: '10115',
      city: 'Berlin',
      countryCode: 'DE',
    },
  },
}
