import { Injectable, Inject, Scope } from '@nestjs/common'
import { LANGUAGE_TOKEN } from '@core/i18n'
import { resolveCurrencyFromLanguage } from '@core/i18n/currency-utils'
import type { DataSource } from '@config/constants'
import type { LanguageProvider } from '../../common/language/language.provider'
import { DATA_SOURCE } from '../../data-source/tokens'
import { getCartKey } from './cart.utils'

/**
 * Service for generating cart keys based on currency, user type and data source.
 * Carts are scoped per currency; stores sharing a currency share a guest cart.
 */
@Injectable({
  scope: Scope.REQUEST,
})
export class CartKeyService {
  constructor(
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider,
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource
  ) {}

  getCurrentCurrency(): string {
    return resolveCurrencyFromLanguage(
      this.languageProvider.getCurrentLanguage()
    )
  }

  getCartKeys(): { loggedInCartKey: string; guestCartKey: string } {
    const currency = this.getCurrentCurrency()
    return {
      loggedInCartKey: getCartKey(currency, false, this.dataSource),
      guestCartKey: getCartKey(currency, true, this.dataSource),
    }
  }

  getLoggedInCartKey(): string {
    return getCartKey(this.getCurrentCurrency(), false, this.dataSource)
  }

  getGuestCartKey(): string {
    return getCartKey(this.getCurrentCurrency(), true, this.dataSource)
  }

  getCartKey(isGuest: boolean): string {
    return getCartKey(this.getCurrentCurrency(), isGuest, this.dataSource)
  }
}
