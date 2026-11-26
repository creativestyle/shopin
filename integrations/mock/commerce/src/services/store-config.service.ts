import { RequestContext } from '@core/integration-kit'
import { Injectable } from '@nestjs/common'
import type { StoreConfigResponse } from '@core/contracts/store-config/store-config'
/** Ship-to countries per locale; a locale the mock does not know ships to its own country (fr-FR → FR). */
const MOCK_COUNTRIES: Readonly<Record<string, string[]>> = {
  'en-US': ['US', 'CA'],
  'de-DE': ['DE', 'AT', 'CH', 'NL', 'BE', 'LU', 'FR'],
}

@Injectable()
export class StoreConfigService {
  constructor(private readonly languageProvider: RequestContext) {}

  async getStoreConfig(): Promise<StoreConfigResponse> {
    const language = this.languageProvider.getCurrentLanguage()
    const country = language.split('-')[1]?.toUpperCase()
    const shippingCountries =
      MOCK_COUNTRIES[language] ?? (country ? [country] : [])
    const projectCountries = [
      ...new Set([
        ...Object.values(MOCK_COUNTRIES).flat(),
        ...shippingCountries,
      ]),
    ]
    return { shippingCountries, projectCountries }
  }
}
