import { LOCALE, localePath, type Locale } from './i18n'

// Catalog, routes and addresses in the commercetools project; update if they change.
export const ROUTES = {
  home: localePath('/'),
  cart: localePath('/cart'),
  checkoutBilling: localePath('/checkout/billing'),
  wishlist: localePath('/wishlist'),
  search: (term: string) =>
    `${localePath('/search')}?q=${encodeURIComponent(term)}`,
}

type LocaleData = {
  product: { category: string; name: string }
  variantProduct: { path: string; name: string; option: string }
  search: { term: string; onlyResult: string }
  paymentMethod: string
  address: {
    firstName: string
    lastName: string
    streetName: string
    streetNumber: string
    postalCode: string
    city: string
    countryCode: string
  }
}

const DATA: Record<Locale, LocaleData> = {
  'en-US': {
    product: {
      category: '/c/microphones',
      name: 'Creativestyle Modeling Condenser Microphone',
    },
    variantProduct: {
      path: '/p/shopin-xlr-microphone-cable',
      name: 'SHOPin XLR Microphone Cable',
      option: '3 m',
    },
    search: {
      term: 'Modeling',
      onlyResult: 'Creativestyle Modeling Condenser Microphone',
    },
    // Served by the mock payment service, not core/i18n.
    paymentMethod: 'Invoice (Payment within 14 days)',
    address: {
      firstName: 'E2E',
      lastName: 'Tester',
      streetName: 'Main Street',
      streetNumber: '1',
      postalCode: '10001',
      city: 'New York',
      countryCode: 'US',
    },
  },
  'de-DE': {
    product: {
      category: '/de/c/microphones',
      name: 'Creativestyle Modeling-Kondensatormikrofon',
    },
    variantProduct: {
      path: '/de/p/shopin-xlr-microphone-cable',
      name: 'SHOPin XLR Mikrofonkabel',
      option: '3 m',
    },
    search: {
      term: 'Modeling',
      onlyResult: 'Creativestyle Modeling-Kondensatormikrofon',
    },
    paymentMethod: 'Rechnung (Zahlung innerhalb von 14 Tagen)',
    address: {
      firstName: 'E2E',
      lastName: 'Tester',
      streetName: 'Hauptstraße',
      streetNumber: '1',
      postalCode: '10115',
      city: 'Berlin',
      countryCode: 'DE',
    },
  },
}

export const TEST_DATA = DATA[LOCALE]

export function uniqueEmail() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  return `e2e+${suffix}@example.com`
}
