import { Injectable, Inject } from '@nestjs/common'
import { LANGUAGE_TOKEN } from '@core/i18n'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import type { StoreConfigResponse } from '@core/contracts/store-config/store-config'
import type { SupportedLocale } from '@config/constants'

const MOCK_COUNTRIES: Record<SupportedLocale, string[]> = {
  'en-US': ['US', 'CA'],
  'de-DE': ['DE', 'AT', 'CH', 'NL', 'BE', 'LU', 'FR'],
}

@Injectable()
export class StoreConfigService {
  constructor(
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  async getStoreConfig(): Promise<StoreConfigResponse> {
    const language = this.languageProvider.getCurrentLanguage()
    const shippingCountries = MOCK_COUNTRIES[language as SupportedLocale] ?? []
    const projectCountries = [...new Set(Object.values(MOCK_COUNTRIES).flat())]
    return { shippingCountries, projectCountries }
  }
}
