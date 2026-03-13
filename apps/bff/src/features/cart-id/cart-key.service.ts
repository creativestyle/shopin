import { Injectable, Inject, Scope } from '@nestjs/common'
import { LANGUAGE_TOKEN, resolveCurrencyFromLanguage } from '@core/i18n'
import type { LanguageProvider } from '../../common/language/language.provider'
import { getCartKey } from './cart.utils'

/**
 * Service for generating cart keys based on currency and user type.
 * Handles key generation logic and currency resolution.
 */
@Injectable({
  scope: Scope.REQUEST,
})
export class CartKeyService {
  constructor(
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  /**
   * Gets the current currency based on the current language
   * @returns Currency code (e.g., 'USD', 'EUR')
   */
  getCurrentCurrency(): string {
    const currentLanguage = this.languageProvider.getCurrentLanguage()
    return resolveCurrencyFromLanguage(currentLanguage)
  }

  /**
   * Gets both logged-in and guest cart keys for the current currency
   * @returns Object with loggedInCartKey and guestCartKey
   */
  getCartKeys(): { loggedInCartKey: string; guestCartKey: string } {
    const currency = this.getCurrentCurrency()
    return {
      loggedInCartKey: getCartKey(currency, false),
      guestCartKey: getCartKey(currency, true),
    }
  }

  /**
   * Gets cart key for logged-in user
   * @returns Cart key for logged-in user
   */
  getLoggedInCartKey(): string {
    const currency = this.getCurrentCurrency()
    return getCartKey(currency, false)
  }

  /**
   * Gets cart key for guest user
   * @returns Cart key for guest user
   */
  getGuestCartKey(): string {
    const currency = this.getCurrentCurrency()
    return getCartKey(currency, true)
  }

  /**
   * Gets cart key based on user type
   * @param isGuest - Whether the user is a guest
   * @returns Cart key for the specified user type
   */
  getCartKey(isGuest: boolean): string {
    const currency = this.getCurrentCurrency()
    return getCartKey(currency, isGuest)
  }
}
