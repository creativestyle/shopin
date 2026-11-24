import type { IntegrationTestData } from './types'

// The mock catalog is generated from the slug or term, so any value works
export const MOCK_DATA: IntegrationTestData = {
  'en-US': {
    categoryPath: '/c/e2e-journeys',
    searchTerm: 'shirt',
    cmsPagePath: '/about',
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
    categoryPath: '/c/e2e-journeys',
    searchTerm: 'hemd',
    cmsPagePath: '/about',
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
