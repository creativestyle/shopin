import { Module, Global, Scope } from '@nestjs/common'
import type { Faker } from '@faker-js/faker' with {
  'resolution-mode': 'import',
}
import { LANGUAGE_TOKEN } from '@core/i18n'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'

export const MOCK_API = 'MOCK_API'

type FakerLocales = { faker: Faker; fakerDE: Faker }

// @faker-js/faker is ESM-only; load it once via dynamic import from this CommonJS module
let fakerLocales: Promise<FakerLocales> | undefined
const loadFakerLocales = () =>
  (fakerLocales ??= import('@faker-js/faker').then(({ faker, fakerDE }) => ({
    faker,
    fakerDE,
  })))

export class MockApi {
  private readonly faker: Faker

  constructor(languageProvider: LanguageProvider, locales: FakerLocales) {
    this.faker = this.getFakerInstance(languageProvider, locales)
  }

  private getFakerInstance(
    languageProvider: LanguageProvider,
    locales: FakerLocales
  ) {
    const currentLanguage = languageProvider.getCurrentLanguage()
    switch (currentLanguage) {
      case 'de-DE':
        return locales.fakerDE
      default:
        return locales.faker
    }
  }

  getFaker(): Faker {
    return this.faker
  }
}

@Global()
@Module({
  providers: [
    {
      provide: MOCK_API,
      scope: Scope.REQUEST,
      inject: [LANGUAGE_TOKEN],
      useFactory: async (languageProvider: LanguageProvider) =>
        new MockApi(languageProvider, await loadFakerLocales()),
    },
  ],
  exports: [MOCK_API],
})
export class MockClientModule {}
