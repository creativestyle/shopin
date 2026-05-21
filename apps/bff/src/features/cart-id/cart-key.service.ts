import { Injectable, Inject, Scope } from '@nestjs/common'
import { LANGUAGE_TOKEN } from '@core/i18n'
import { resolveCurrencyFromLanguage } from '@core/i18n/currency-utils'
import type { LanguageProvider } from '../../common/language/language.provider'
import { getCartKey } from './cart.utils'

/**
 * Service for generating cart keys based on currency and user type.
 * Carts are scoped per currency; stores sharing a currency share a guest cart.
 */
@Injectable({
  scope: Scope.REQUEST,
})
export class CartKeyService {
  constructor(
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  getCurrentCurrency(): string {
    return resolveCurrencyFromLanguage(
      this.languageProvider.getCurrentLanguage()
    )
  }

  getCartKeys(): { loggedInCartKey: string; guestCartKey: string } {
    const currency = this.getCurrentCurrency()
    return {
      loggedInCartKey: getCartKey(currency, false),
      guestCartKey: getCartKey(currency, true),
    }
  }

  getLoggedInCartKey(): string {
    return getCartKey(this.getCurrentCurrency(), false)
  }

  getGuestCartKey(): string {
    return getCartKey(this.getCurrentCurrency(), true)
  }

  getCartKey(isGuest: boolean): string {
    return getCartKey(this.getCurrentCurrency(), isGuest)
  }
}
