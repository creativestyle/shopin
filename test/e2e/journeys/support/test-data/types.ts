import type { Locale } from '../i18n'

export interface LocaleTestData {
  /** A category page that lists products, without the locale prefix. */
  categoryPath: string
  /** A term the search answers with at least one product. */
  searchTerm: string
  /** A CMS page, without the locale prefix; undefined when the integration names none. */
  cmsPagePath?: string
  /** A shippable address of the store (its country is offered for delivery). */
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

export type IntegrationTestData = Record<Locale, LocaleTestData>
