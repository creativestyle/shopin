import type { SessionTokens } from './port-types'

// ─── What the BFF hands a port besides its options (abstract classes: inject them by type) ─────

/** This request: language, currency, its headers, the storefront URL. */
export abstract class RequestContext {
  abstract readonly language: string
  abstract readonly currency: string
  /** A request header (lower or any case), its first value; undefined when the request has none. */
  abstract header(name: string): string | undefined
  /** The storefront's base URL (core variable FRONTEND_URL), e.g. for a payment return link. */
  abstract readonly storefrontUrl: string
  abstract getCurrentLanguage(): string
  /**
   * The shop's locales (config/locales.json), the first is its default: what a port configures per locale (a store
   * per locale, the CMS's locales). A port reads them here, not from the storefront's constants.
   */
  abstract readonly locales: readonly string[]
}

export interface VaultEntry extends SessionTokens {
  /** True when the tokens act for a signed-in customer, false for a guest. */
  customer: boolean
}

/** This port's own token store for the current shopper (encrypted HttpOnly cookie). A port sees only its entry. */
export abstract class TokenVault {
  abstract get(): Promise<VaultEntry | undefined>
  abstract set(tokens: SessionTokens, customer: boolean): Promise<void>
  abstract clear(): void
}

/**
 * For a port of an integration that serves through others (`delegates`): their ports of the same category by id,
 * and the ones that cannot serve (variables missing, credentials check failed) with the reason. Inject it by type.
 */
export abstract class Delegates {
  abstract readonly ports: Readonly<Record<string, unknown>>
  abstract readonly unavailable: Readonly<Record<string, string>>
}

/** The customer the current request acts for, from the SHOPin session (never from the request). */
export abstract class CustomerContext {
  /** The linked customer id at this commerce provider; undefined for a guest. */
  abstract customerId(): Promise<string | undefined>
}
